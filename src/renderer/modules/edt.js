// ── CONSTANTES EDT ───────────────────────────────────────────────────────────
const EDT_DAYS  = ['Lundi','Mardi','Mercredi','Jeudi','Vendredi'];
const EDT_HOURS = Array.from({length:11},(_,i)=>i+8); // 8h → 18h
const EDT_COLORS = [
  {bg:'#dbeafe',border:'#3b82f6',text:'#1e40af'},
  {bg:'#dcfce7',border:'#22c55e',text:'#15803d'},
  {bg:'#fef9c3',border:'#eab308',text:'#854d0e'},
  {bg:'#fee2e2',border:'#ef4444',text:'#991b1b'},
  {bg:'#f3e8ff',border:'#a855f7',text:'#7e22ce'},
  {bg:'#ffedd5',border:'#f97316',text:'#9a3412'},
];

function edtGetMonday(date) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  d.setHours(0,0,0,0);
  return d;
}
function edtGetWeekType(monday, refMonday) {
  const msPerWeek = 7*24*60*60*1000;
  const diff = Math.round((monday - refMonday) / msPerWeek);
  return diff % 2 === 0 ? 'A' : 'B';
}
function edtDateForDay(monday, dayIdx) {
  const d = new Date(monday);
  d.setDate(d.getDate() + dayIdx);
  return d;
}
function edtFmtShort(d) {
  return d.toLocaleDateString('fr-FR',{day:'numeric',month:'short'});
}
function edtIso(d) {
  return d.toISOString().slice(0,10);
}


// ── PARSER PDF EDT PRONOTE ────────────────────────────────────────────────────
async function parseEdtPDF(file) {
  if (!window.pdfjsLib) {
    alert('pdf.js non chargé. Vérifiez que vendor/pdf.min.js est présent dans src/renderer/vendor/.');
    return null;
  }
  const buf = await file.arrayBuffer();
  const pdf = await window.pdfjsLib.getDocument({ data: buf }).promise;

  let items = [];
  for (let pi = 1; pi <= pdf.numPages; pi++) {
    const page = await pdf.getPage(pi);
    const vp   = page.getViewport({ scale: 1 });
    const tc   = await page.getTextContent();
    tc.items.forEach(it => {
      const s = it.str.trim();
      if (!s) return;
      const tx = it.transform;
      items.push({ s, x: tx[4], y: vp.height - tx[5], fs: Math.abs(tx[3]) });
    });
  }

  const timeRe    = /^(\d{1,2})h(\d{2})$/;
  const isWeekMark = s => /^[AB]$/i.test(s);
  const isNoise    = s => /^S\.\d/.test(s) || s.length === 0;
  const isFooter   = s => /©|Index Education|COLLEGE|COLLÈGE/i.test(s);
  const DAY_FR     = ['lundi','mardi','mercredi','jeudi','vendredi'];

  const dayXMap = {};
  items.forEach(it => {
    const idx = DAY_FR.findIndex(d => it.s.toLowerCase() === d);
    if (idx >= 0) dayXMap[idx] = it.x;
  });
  const foundDays = Object.keys(dayXMap).map(Number);
  if (foundDays.length < 2) return { blocks:[], error:"Jours non detectes dans le PDF. Verifiez que c'est bien un EDT Pronote." };

  const sortedDays = foundDays.sort((a,b) => dayXMap[a] - dayXMap[b]);
  const colBounds  = sortedDays.map((di,i) => {
    const x     = dayXMap[di];
    const xPrev = i > 0 ? dayXMap[sortedDays[i-1]] : 0;
    const xNext = i < sortedDays.length-1 ? dayXMap[sortedDays[i+1]] : 99999;
    return { dayIdx:di, xMin:(x+xPrev)/2, xMax:(x+xNext)/2 };
  });

  const timeSlots = [];
  items.forEach(it => {
    if (it.x > 70) return;
    const m = it.s.match(timeRe);
    if (!m) return;
    const h = parseInt(m[1]), min = parseInt(m[2]);
    if (!timeSlots.find(t => t.h===h && t.m===min)) timeSlots.push({ h, m:min, y:it.y });
  });
  timeSlots.sort((a,b) => a.y - b.y);
  if (timeSlots.length < 2) return { blocks:[], error:'Horaires non détectés. Vérifiez le format du PDF.' };

  const headerY = items.find(it => it.s.toLowerCase() === 'lundi')?.y ?? 56;

  const assignCol = (x, isMarker=false) => {
    if (isMarker) {
      return colBounds.reduce((best,c) => {
        const d = Math.abs(x - c.xMax);
        return (!best || d < Math.abs(x - best.xMax)) ? c : best;
      }, null);
    }
    let col = colBounds.find(c => x >= c.xMin && x < c.xMax);
    if (col) return col;
    return colBounds.reduce((best,c) => {
      const d = Math.abs(x - (c.xMin+c.xMax)/2);
      return (!best || d < Math.abs(x - (best.xMin+best.xMax)/2)) ? c : best;
    }, null);
  };

  const colItems = items.filter(it => {
    if (it.x <= 60) return false;
    if (it.y <= headerY + 2) return false;
    if (isFooter(it.s)) return false;
    return true;
  }).map(it => {
    const col = assignCol(it.x, isWeekMark(it.s));
    return col ? { ...it, dayIdx:col.dayIdx } : null;
  }).filter(Boolean);

  const byDay = {};
  colItems.forEach(it => { if (!byDay[it.dayIdx]) byDay[it.dayIdx]=[]; byDay[it.dayIdx].push(it); });

  const snapSlot = (yS, yE) => {
    let si = 0;
    for (let i=0; i<timeSlots.length; i++) { if (timeSlots[i].y <= yS+10) si=i; else break; }
    let ei = Math.min(si+1, timeSlots.length-1);
    for (let i=si+1; i<timeSlots.length; i++) { if (timeSlots[i].y > yE-10) { ei=i; break; } ei=Math.min(i+1,timeSlots.length-1); }
    return { start:timeSlots[si], end:timeSlots[ei] };
  };

  const blocks = [];
  const pushBlock = (dayIdx, title, weeks, yS, yE) => {
    title = title.trim().replace(/\s+/g,' ');
    if (title.length < 2) return;
    const { start, end } = snapSlot(yS, yE);
    if (end.h*60+end.m <= start.h*60+start.m) return;
    const colorIdx = Math.abs(title.split('').reduce((a,c) => a+c.charCodeAt(0), 0)) % EDT_COLORS.length;
    blocks.push({
      id: 'edt-import-'+Date.now()+Math.random().toString(36).slice(2),
      day:dayIdx, startH:start.h, startM:start.m, endH:end.h, endM:end.m,
      title:title.slice(0,80), teacher:'', room:'', colorIdx, weeks, classId:''
    });
  };

  Object.entries(byDay).forEach(([dayIdxStr, dayItems]) => {
    const dayIdx = parseInt(dayIdxStr);
    for (let si=0; si<timeSlots.length-1; si++) {
      const yS = timeSlots[si].y, yE = timeSlots[si+1].y;
      const slotItems = dayItems.filter(it => it.y>=yS-2 && it.y<yE+5);
      if (!slotItems.length) continue;
      const content = slotItems.filter(it => !isWeekMark(it.s) && !isNoise(it.s));
      const markers = slotItems.filter(it => isWeekMark(it.s));
      if (!content.length) continue;

      const byTextY = {};
      content.forEach(it => {
        const k = `${Math.round(it.y)}_${it.s}`;
        if (!byTextY[k]) byTextY[k]=[];
        byTextY[k].push(it.x);
      });
      const dupePairs = Object.values(byTextY).filter(xs=>xs.length>=2).map(xs=>xs.slice().sort((a,b)=>a-b));

      if (dupePairs.length > 0 && markers.length >= 2) {
        const xLavg = dupePairs.reduce((s,p)=>s+p[0],0)/dupePairs.length;
        const xRavg = dupePairs.reduce((s,p)=>s+p[p.length-1],0)/dupePairs.length;
        const splitXc = (xLavg+xRavg)/2;
        const mxs = markers.map(m=>m.x).sort((a,b)=>a-b);
        const splitXm = (mxs[0]+mxs[mxs.length-1])/2;
        const weekL = markers.find(m=>m.x<splitXm)?.s.toUpperCase()||'AB';
        const weekR = markers.find(m=>m.x>=splitXm)?.s.toUpperCase()||'AB';
        const left  = content.filter(it=>it.x<splitXc).sort((a,b)=>a.y-b.y);
        const right = content.filter(it=>it.x>=splitXc).sort((a,b)=>a.y-b.y);
        const titleL = [...new Set(left.map(it=>it.s))].join(' ');
        const titleR = [...new Set(right.map(it=>it.s))].join(' ');
        if (titleL) pushBlock(dayIdx, titleL, weekL, yS, yE);
        if (titleR) pushBlock(dayIdx, titleR, weekR, yS, yE);
      } else {
        const week  = markers.length===1 ? markers[0].s.toUpperCase() : 'AB';
        const title = [...new Set(content.sort((a,b)=>a.y-b.y).map(it=>it.s))].join(' ');
        pushBlock(dayIdx, title, week, yS, yE);
      }
    }
  });

  const seen = new Set();
  const deduped = blocks.filter(b => {
    const k = `${b.day}_${b.startH}_${b.startM}_${b.title}`;
    if (seen.has(k)) return false; seen.add(k); return true;
  }).sort((a,b) => a.day-b.day || (a.startH*60+a.startM)-(b.startH*60+b.startM));

  return { blocks:deduped, error:null };
}

// ── MODULE EMPLOI DU TEMPS ────────────────────────────────────────────────────
function ModuleEDT({ cpData, onDataChange }) {
  const classes  = cpData?.classes  || [];
  const edtData  = cpData?.edt      || [];
  const edtRefA  = cpData?.edtRefA  || null;
  const sessions = cpData?.sessions || {};
  const fiches   = cpData?.fiches   || {};

  const EMPTY_FORM = {day:0,startH:8,startM:0,endH:9,endM:0,title:'',room:'',colorIdx:0,weeks:'AB',classId:''};

  const [viewMonday, setViewMonday] = useState(() => edtGetMonday(new Date()));
  const [refWeekA,   setRefWeekA]   = useState(() => edtRefA ? new Date(edtRefA) : edtGetMonday(new Date()));
  const [showAdd,    setShowAdd]    = useState(false);
  const [form,       setForm]       = useState(EMPTY_FORM);
  const [editId,     setEditId]     = useState(null);
  const [showRefPicker, setShowRefPicker] = useState(false);
  const [refPickerVal,  setRefPickerVal]  = useState('');
  const [ctxMenu,    setCtxMenu]    = useState(null);
  const [autoPopup,  setAutoPopup]  = useState(null);
  const [autoClassId,setAutoClassId]= useState('');
  const [autoNbWeeks,setAutoNbWeeks]= useState(8);
  const [autoResult, setAutoResult] = useState(null);
  const [coursModal,    setCoursModal]    = useState(null); // { block } — modale lier/créer cours
  const [showImport,    setShowImport]    = useState(false);
  const [importStatus,  setImportStatus]  = useState(null); // null | 'loading' | {blocks, error}
  const [importPreview, setImportPreview] = useState(false);

  // ── Vacances ──────────────────────────────────────────────────────────────
  const [vacances,     setVacances]     = useState(() => { try { return JSON.parse(localStorage.getItem('cdc-vacances') || '[]'); } catch { return []; } });
  const [showVacances, setShowVacances] = useState(false);
  const [newVac,       setNewVac]       = useState({ label:'', debut:'', fin:'' });

  // ── Jours annulés (malade, formation, férié…) ────────────────────────────
  // Structure: { 'YYYY-MM-DD': { motif: 'malade'|'formation'|'ferie'|'autre', label: '' } }
  const [joursAnnules, setJoursAnnules] = useState(() => { try { return JSON.parse(localStorage.getItem('cdc-jours-annules') || '{}'); } catch { return {}; } });
  const [dayCtxMenu,   setDayCtxMenu]   = useState(null); // { dayIdx, dateIso, x, y }
  const [motifModal,   setMotifModal]   = useState(null); // { dayIdx, dateIso }
  const [motifForm,    setMotifForm]    = useState({ motif:'malade', label:'' });

  const weekType = edtGetWeekType(viewMonday, refWeekA);
  const todayStr = edtIso(new Date());
  const isCurrentWeek = edtIso(viewMonday) === edtIso(edtGetMonday(new Date()));

  // Persistance vacances + jours annulés
  useEffect(() => { localStorage.setItem('cdc-vacances', JSON.stringify(vacances)); }, [vacances]);
  useEffect(() => { localStorage.setItem('cdc-jours-annules', JSON.stringify(joursAnnules)); }, [joursAnnules]);

  // Jours en vacances cette semaine (indices 0=lundi…4=vendredi)
  const vacancesDaySet = (() => {
    const set = new Set();
    for (let di = 0; di < 5; di++) {
      const dayIso = edtIso(edtDateForDay(viewMonday, di));
      if (vacances.some(v => dayIso >= v.debut && dayIso <= v.fin)) set.add(di);
    }
    return set;
  })();
  // Période de vacances qui chevauche la semaine (pour le bandeau)
  const vacanceSemaine = (() => {
    const mondayIso = edtIso(viewMonday);
    const fridayIso = edtIso(edtDateForDay(viewMonday, 4));
    return vacances.find(v => mondayIso <= v.fin && fridayIso >= v.debut) || null;
  })();

  const MOTIF_LABELS = { malade:'🤒 Malade', formation:'📚 Formation', ferie:'🎉 Jour férié', autre:'📌 Autre' };

  const dayHeaders = EDT_DAYS.map((label, i) => {
    const date = edtDateForDay(viewMonday, i);
    return { label, date, isToday: edtIso(date) === todayStr };
  });

  const visibleBlocks = edtData.filter(b => {
    if (vacancesDaySet.has(b.day)) return false; // masquer si jour en vacances
    const dateIso = edtIso(edtDateForDay(viewMonday, b.day));
    if (joursAnnules[dateIso]) return false;     // masquer si jour annulé
    const w = b.weeks || 'AB';
    return w === 'AB' || w === weekType;
  });

  const saveBlocks = (blocks) => onDataChange('cdc-edt', blocks);

  const handlePdfImport = async (file) => {
    if (!file) return;
    setImportStatus('loading');
    setShowImport(false);
    try {
      const result = await parseEdtPDF(file);
      if (result) {
        setImportStatus(result);
        setImportPreview(true);
      } else {
        setImportStatus(null);
      }
    } catch(e) {
      setImportStatus({ blocks:[], error:'Erreur : ' + e.message });
      setImportPreview(true);
    }
  };

  const confirmImport = () => {
    if (!importStatus || importStatus === 'loading' || !importStatus.blocks) return;
    const existing = edtData;
    const toAdd = importStatus.blocks.filter(nb => {
      return !existing.find(b => b.day===nb.day && b.startH===nb.startH && b.startM===nb.startM && b.title===nb.title);
    });
    saveBlocks([...existing, ...toAdd]);
    setImportPreview(false);
    setImportStatus(null);
  };
  const saveRefA   = (d) => onDataChange('cdc-edt-refA', d.toISOString());

  const prevWeek = () => setViewMonday(m => { const d=new Date(m); d.setDate(d.getDate()-7); return d; });
  const nextWeek = () => setViewMonday(m => { const d=new Date(m); d.setDate(d.getDate()+7); return d; });
  const goToday  = () => setViewMonday(edtGetMonday(new Date()));

  const saveBlock = () => {
    if (!form.title.trim()) return;
    if (editId) {
      saveBlocks(edtData.map(b => b.id === editId ? { ...b, ...form } : b));
      setEditId(null);
    } else {
      saveBlocks([...edtData, { ...form, id: 'edt-' + Date.now() }]);
    }
    setShowAdd(false);
    setForm(EMPTY_FORM);
  };

  const delBlock = (id) => {
    if (!window.confirm('Supprimer ce cours ?')) return;
    saveBlocks(edtData.filter(b => b.id !== id));
  };

  const editBlock = (b) => {
    setForm({ day:b.day, startH:b.startH, startM:b.startM, endH:b.endH, endM:b.endM,
      title:b.title, room:b.room||'', colorIdx:b.colorIdx||0, weeks:b.weeks||'AB', classId:b.classId||'' });
    setEditId(b.id);
    setShowAdd(true);
  };

  const saveRefWeekA = () => {
    if (!refPickerVal) return;
    const d = edtGetMonday(new Date(refPickerVal + 'T12:00'));
    setRefWeekA(d);
    saveRefA(d);
    setShowRefPicker(false);
  };

  // Automatisation : créer séances + fiches depuis un bloc EDT
  const runAutomation = () => {
    if (!autoClassId || !autoPopup?.block) return;
    const block = autoPopup.block;
    const today = edtGetMonday(new Date());
    const targetWeeks = [];
    let cursor = new Date(today);
    for (let i = 0; i < autoNbWeeks * 3 + 10; i++) {
      const wt = edtGetWeekType(cursor, refWeekA);
      const w  = block.weeks || 'AB';
      const courseDate = edtDateForDay(cursor, block.day);
      const courseDateIso = edtIso(courseDate);
      const isVacance = vacances.some(v => courseDateIso >= v.debut && courseDateIso <= v.fin);
      const isAnnule  = !!joursAnnules[courseDateIso];
      if ((w === 'AB' || w === wt) && !isVacance && !isAnnule) targetWeeks.push(new Date(cursor));
      cursor.setDate(cursor.getDate() + 7);
      if (targetWeeks.length >= autoNbWeeks) break;
    }

    const existSessions = { ...sessions };
    const existFiches   = { ...fiches };
    const classSess  = existSessions[autoClassId] || [];
    const classFich  = existFiches[autoClassId]   || [];
    const newSess = [], newFich = [], skipped = [];

    targetWeeks.forEach(monday => {
      const courseDate = edtDateForDay(monday, block.day);
      const dateStr    = edtIso(courseDate);
      const label      = block.title + (block.room ? ' · ' + block.room : '');
      if (!classSess.some(s => s.date === dateStr && s.label === label)) {
        newSess.push({ id:'s'+Date.now()+Math.random().toString(36).slice(2), date:dateStr, label, obs:{} });
      } else { skipped.push(dateStr); }
      if (!classFich.some(f => f.date === dateStr && f.titre === block.title)) {
        newFich.push({ id:'f'+Date.now()+Math.random().toString(36).slice(2), date:dateStr,
          titre:block.title, objectif:'', activite:'', devoirs:'', documents:'', aRevoir:'', absents:[] });
      }
    });

    existSessions[autoClassId] = [...classSess, ...newSess].sort((a,b) => a.date.localeCompare(b.date));
    existFiches[autoClassId]   = [...classFich, ...newFich].sort((a,b) => b.date.localeCompare(a.date));
    onDataChange('sc-sessions', existSessions);
    onDataChange('cdc-fiches',  existFiches);

    const className = classes.find(c => c.id === autoClassId)?.name || autoClassId;
    setAutoResult({ sessionsCreated: newSess.length, fichesCreated: newFich.length, skipped: skipped.length, className, dates: newSess.map(s => s.date) });
  };

  if (!cpData) return <ModulePlaceholder icon="📅" title="Emploi du temps" sub="Ouvrez d'abord un fichier ClassPro." />;

  const ROWS = EDT_HOURS.length;

  return (
    <>
      <div className="page-hd">
        <div>
          <div style={{ display:'flex', alignItems:'center', gap:'.5rem' }}>
            <div className="phd-badge">📅 Emploi du temps</div>
            <button onClick={() => { setRefPickerVal(edtIso(refWeekA)); setShowRefPicker(true); }}
              style={{ display:'flex', alignItems:'center', gap:'.28rem', background:'rgba(255,255,255,.12)', border:'1px solid rgba(255,255,255,.2)', color:'rgba(255,255,255,.85)', fontSize:'.65rem', fontWeight:600, padding:'.18rem .55rem', borderRadius:99, cursor:'pointer' }}>
              ⚙️ Réf. A/B
            </button>
          </div>
          <div className="phd-title">Planning hebdomadaire</div>
          <div className="phd-sub">
            Semaine <strong style={{ color:'#fff' }}>{weekType}</strong> · {edtFmtShort(viewMonday)} → {edtFmtShort(edtDateForDay(viewMonday,4))}
            {isCurrentWeek && <span style={{ marginLeft:'.5rem', background:'rgba(255,255,255,.18)', padding:'.1rem .42rem', borderRadius:99, fontSize:'.65rem', fontWeight:700 }}>Cette semaine</span>}
          </div>
        </div>
        <div className="phd-actions">
          {/* Navigation semaine */}
          <div style={{ display:'flex', alignItems:'center', gap:'.3rem', background:'rgba(255,255,255,.12)', border:'1px solid rgba(255,255,255,.2)', borderRadius:'var(--r-s)', padding:'.28rem .5rem' }}>
            <button onClick={prevWeek} style={{ background:'none', border:'none', color:'#fff', cursor:'pointer', fontSize:'.9rem', padding:'.1rem .35rem', borderRadius:4, opacity:.8 }}>◀</button>
            <span style={{ fontSize:'.75rem', color:'#fff', fontWeight:700, minWidth:80, textAlign:'center' }}>Sem. {weekType}</span>
            <button onClick={nextWeek} style={{ background:'none', border:'none', color:'#fff', cursor:'pointer', fontSize:'.9rem', padding:'.1rem .35rem', borderRadius:4, opacity:.8 }}>▶</button>
          </div>
          {!isCurrentWeek && <button className="btn btn-ghost" onClick={goToday} style={{ fontSize:'.75rem' }}>Aujourd&apos;hui</button>}
          {/* Créer fiches et suivi */}
          <button className="btn btn-ghost"
            style={{ fontSize:'.72rem', background:'rgba(255,255,255,.15)', border:'1px solid rgba(255,255,255,.3)', color:'#fff' }}
            onClick={() => { setAutoClassId(''); setAutoResult(null); setAutoPopup({ block: null, fromHeader: true }); }}>
            🔁 Créer les fiches et le suivi
          </button>
          {/* Vacances */}
          <button className="btn btn-ghost"
            style={{ fontSize:'.72rem', background:'rgba(255,255,255,.12)', border:'1px solid rgba(255,255,255,.25)', color:'#fff', display:'flex', alignItems:'center', gap:'.35rem' }}
            onClick={() => setShowVacances(true)}
            title="Gérer les périodes de vacances scolaires">
            🏖️ Vacances {vacances.length > 0 && <span style={{ background:'rgba(255,255,255,.25)', borderRadius:99, padding:'0 .35rem', fontSize:'.65rem' }}>{vacances.length}</span>}
          </button>
          {/* Import PDF */}
          <button className="btn btn-ghost"
            style={{ fontSize:'.75rem', background:'rgba(255,255,255,.15)', border:'1px solid rgba(255,255,255,.3)', color:'#fff' }}
            onClick={() => setShowImport(true)}>
            📄 Importer l&apos;EDT
          </button>
          {/* Ajouter */}
          <button className="btn btn-primary" onClick={() => { setEditId(null); setForm(EMPTY_FORM); setShowAdd(true); }}>
            + Ajouter un cours
          </button>
          {/* Purger */}
          {edtData.length > 0 && (
            <button className="btn" style={{ background:'rgba(220,38,38,.15)', border:'1px solid rgba(220,38,38,.3)', color:'#fca5a5', fontSize:'.72rem' }}
              onClick={() => { if (window.confirm('Supprimer tous les cours de l\'EDT ? Cette action est irréversible.')) saveBlocks([]); }}>
              🗑️ Purger l&apos;EDT
            </button>
          )}
        </div>
      </div>

      {/* Grille EDT */}
      <div className="page-content" style={{ paddingTop:0, overflow:'hidden', flex:1, display:'flex', flexDirection:'column' }}>
        <div style={{ flex:1, overflow:'auto' }}>
          <div style={{ display:'grid', gridTemplateColumns:'54px repeat(5,1fr)', minWidth:680 }} onClick={() => { ctxMenu && setCtxMenu(null); dayCtxMenu && setDayCtxMenu(null); }}>
            {/* Header vide */}
            <div style={{ background:'var(--surface2)', position:'sticky', top:0, zIndex:20, borderRight:'1px solid var(--border)', borderBottom:'2px solid var(--border)' }} />
            {/* Headers jours */}
            {dayHeaders.map((dh, i) => {
              const dateIso = edtIso(dh.date);
              const isAnnule = !!joursAnnules[dateIso];
              const isVac = vacancesDaySet.has(i);
              return (
                <div key={i}
                  style={{ padding:'.45rem .4rem', textAlign:'center', fontSize:'.74rem', fontWeight:700, borderRight:'1px solid var(--border)', borderBottom: dh.isToday ? '2px solid var(--accent)' : '2px solid var(--border)', background: isAnnule ? 'rgba(239,68,68,.07)' : isVac ? 'rgba(245,158,11,.07)' : dh.isToday ? 'rgba(59,91,219,.06)' : 'var(--surface2)', position:'sticky', top:0, zIndex:20, color: isAnnule ? 'var(--danger)' : dh.isToday ? 'var(--accent)' : 'var(--text2)', cursor:'pointer' }}
                  onContextMenu={e => { e.preventDefault(); setDayCtxMenu({ dayIdx:i, dateIso, x:e.clientX, y:e.clientY }); }}>
                  <div style={{ fontWeight: dh.isToday ? 800 : 700, textDecoration: isAnnule ? 'line-through' : 'none' }}>{dh.label}</div>
                  <div style={{ fontSize:'.62rem', fontWeight:400, color: isAnnule ? 'var(--danger)' : 'var(--text3)', marginTop:'.06rem' }}>
                    {edtFmtShort(dh.date)}
                    {isAnnule && <span style={{ marginLeft:'.25rem' }}>{MOTIF_LABELS[joursAnnules[dateIso]?.motif] || '📌'}</span>}
                  </div>
                </div>
              );
            })}
            {/* Colonne heures */}
            <div style={{ borderRight:'1px solid var(--border)', background:'var(--surface)' }}>
              {EDT_HOURS.map(h => (
                <div key={h} style={{ height:60, display:'flex', alignItems:'flex-start', justifyContent:'flex-end', padding:'.15rem .4rem 0', fontSize:'.65rem', color:'var(--text3)', borderBottom:'1px solid rgba(0,0,0,.04)' }}>{h}h</div>
              ))}
            </div>
            {/* Colonnes jours avec blocs */}
            {EDT_DAYS.map((_, di) => {
              const dateIso = edtIso(edtDateForDay(viewMonday, di));
              const isToday = dateIso === todayStr;
              const isVac   = vacancesDaySet.has(di);
              const annule  = joursAnnules[dateIso] || null;
              const colH = ROWS * 60;
              const dayBlocks = visibleBlocks.filter(b => b.day === di);
              return (
                <div key={di} style={{ position:'relative', height:colH, borderRight:'1px solid var(--border)', background: annule ? 'rgba(239,68,68,.03)' : isToday ? 'rgba(59,91,219,.02)' : 'var(--surface)' }}
                  onContextMenu={e => { e.preventDefault(); if (!e.target.closest('[data-edt-block]')) setDayCtxMenu({ dayIdx:di, dateIso, x:e.clientX, y:e.clientY }); }}>
                  {EDT_HOURS.map((h, hi) => (
                    <div key={h} style={{ position:'absolute', top:hi*60, left:0, right:0, height:60, borderBottom:'1px solid rgba(0,0,0,.04)', pointerEvents:'none' }} />
                  ))}
                  {/* Overlay vacances */}
                  {isVac && vacanceSemaine && (
                    <div style={{ position:'absolute', inset:0, background:'rgba(245,158,11,.06)', borderTop:'2px solid rgba(245,158,11,.25)', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:'.4rem', zIndex:1, pointerEvents:'none' }}>
                      <span style={{ fontSize:'1.5rem', opacity:.5 }}>🏖️</span>
                      <div style={{ fontSize:'.62rem', fontWeight:700, color:'var(--warning)', opacity:.8, textTransform:'uppercase', letterSpacing:'.04em', textAlign:'center', padding:'0 .3rem', lineHeight:1.3 }}>{vacanceSemaine.label}</div>
                    </div>
                  )}
                  {/* Overlay jour annulé */}
                  {annule && (
                    <div style={{ position:'absolute', inset:0, background:'rgba(239,68,68,.04)', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:'.4rem', zIndex:1, pointerEvents:'none' }}>
                      <span style={{ fontSize:'1.4rem', opacity:.45 }}>{annule.motif === 'malade' ? '🤒' : annule.motif === 'formation' ? '📚' : annule.motif === 'ferie' ? '🎉' : '📌'}</span>
                      <div style={{ fontSize:'.62rem', fontWeight:700, color:'var(--danger)', opacity:.7, textTransform:'uppercase', letterSpacing:'.04em', textAlign:'center', padding:'0 .3rem', lineHeight:1.3 }}>
                        {MOTIF_LABELS[annule.motif]?.replace(/^.+ /,'')}
                        {annule.label ? <><br/><span style={{fontWeight:400,textTransform:'none',letterSpacing:0}}>{annule.label}</span></> : null}
                      </div>
                    </div>
                  )}
                  {dayBlocks.map(b => {
                    const col = EDT_COLORS[b.colorIdx || 0];
                    const topPx = (b.startH - 8)*60 + b.startM;
                    const hPx  = Math.max(22, (b.endH - b.startH)*60 + (b.endM - b.startM));
                    const w    = b.weeks || 'AB';
                    return (
                      <div key={b.id}
                        data-edt-block="1"
                        style={{ position:'absolute', left:2, right:2, top:topPx, height:hPx, borderRadius:6, padding:'.22rem .4rem', fontSize:'.67rem', fontWeight:700, overflow:'hidden', cursor:'pointer', borderLeft:`3px solid ${col.border}`, background:col.bg, color:col.text, boxShadow:'0 1px 4px rgba(0,0,0,.1)', zIndex:2 }}
                        onClick={() => editBlock(b)}
                        onContextMenu={e => { e.preventDefault(); e.stopPropagation(); setCtxMenu({ block:b, x:e.clientX, y:e.clientY }); }}>
                        <div style={{ display:'flex', alignItems:'center', gap:'.25rem', overflow:'hidden' }}>
                          <div style={{ fontWeight:700, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', flex:1 }}>{b.title}</div>
                          {Object.values(cpData && cpData.cours || {}).some(c => c.edtBlockId === b.id) && (
                            <span title="Cours lie" style={{ fontSize:'.6rem', flexShrink:0 }}>📖</span>
                          )}
                        </div>
                        {b.room && <div style={{ opacity:.7, fontSize:'.62rem' }}>📍{b.room}</div>}
                        <div style={{ opacity:.7, fontSize:'.62rem' }}>{b.startH}:{String(b.startM).padStart(2,'0')}–{b.endH}:{String(b.endM).padStart(2,'0')}</div>
                        {w !== 'AB' && <div style={{ position:'absolute', top:3, right:4, background:col.border, color:'#fff', fontSize:'.52rem', fontWeight:800, padding:'.05rem .25rem', borderRadius:3 }}>Sem.{w}</div>}
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>

          {/* État vide */}
          {edtData.length === 0 && (
            <div style={{ textAlign:'center', padding:'3rem', color:'var(--text3)' }}>
              <div style={{ fontSize:'3rem', opacity:.15, marginBottom:'.75rem' }}>📅</div>
              <div style={{ fontWeight:700, color:'var(--text2)', marginBottom:'.4rem' }}>Aucun cours dans l&apos;EDT</div>
              <div style={{ fontSize:'.82rem' }}>Cliquez sur &ldquo;+ Ajouter un cours&rdquo; pour commencer</div>
            </div>
          )}
        </div>
      </div>

      {/* ── Modale sélection PDF ── */}
      {showImport && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,.5)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:9999 }}
          onClick={e => e.target===e.currentTarget && setShowImport(false)}>
          <div style={{ background:'var(--surface)', borderRadius:'var(--r)', padding:'1.5rem', width:400, boxShadow:'var(--shadow-l)' }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'1rem' }}>
              <div>
                <div style={{ fontFamily:'Roboto Slab,serif', fontWeight:800, fontSize:'1rem' }}>📄 Importer un EDT Pronote</div>
                <div style={{ fontSize:'.78rem', color:'var(--text3)', marginTop:'.2rem' }}>Sélectionnez le PDF exporté depuis Pronote</div>
              </div>
              <button onClick={() => setShowImport(false)} style={{ background:'none', border:'none', cursor:'pointer', fontSize:'1.3rem', color:'var(--text3)' }}>×</button>
            </div>
            <div style={{ padding:'1rem', background:'rgba(59,91,219,.06)', border:'2px dashed rgba(59,91,219,.3)', borderRadius:'var(--r-s)', textAlign:'center', marginBottom:'1rem' }}>
              <div style={{ fontSize:'2rem', marginBottom:'.5rem' }}>📄</div>
              <div style={{ fontSize:'.83rem', color:'var(--text2)', marginBottom:'.75rem' }}>
                Fichier PDF de l&apos;emploi du temps Pronote
              </div>
              <label style={{ display:'inline-block', padding:'.55rem 1.25rem', background:'var(--accent)', color:'#fff', borderRadius:'var(--r-s)', cursor:'pointer', fontWeight:700, fontSize:'.85rem', fontFamily:'Roboto,sans-serif' }}>
                Choisir le PDF
                <input type="file" accept=".pdf,application/pdf" style={{ display:'none' }}
                  onChange={e => { if(e.target.files[0]) handlePdfImport(e.target.files[0]); }} />
              </label>
            </div>
            <div style={{ fontSize:'.73rem', color:'var(--text3)', lineHeight:1.6 }}>
              <strong>Comment exporter depuis Pronote ?</strong><br/>
              Emploi du temps → Imprimer → Format PDF → Toutes semaines
            </div>
          </div>
        </div>
      )}

      {/* ── Status import loading ── */}
      {importStatus === 'loading' && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,.5)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:9999 }}>
          <div style={{ background:'var(--surface)', borderRadius:'var(--r)', padding:'2rem', textAlign:'center', boxShadow:'var(--shadow-l)' }}>
            <div style={{ fontSize:'2rem', marginBottom:'1rem' }}>⏳</div>
            <div style={{ fontWeight:700 }}>Lecture du PDF en cours…</div>
            <div style={{ fontSize:'.8rem', color:'var(--text3)', marginTop:'.4rem' }}>Cela peut prendre quelques secondes</div>
          </div>
        </div>
      )}

      {/* ── Modale prévisualisation import ── */}
      {importPreview && importStatus && importStatus !== 'loading' && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,.5)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:9999, padding:'1rem' }}
          onClick={e => e.target===e.currentTarget && setImportPreview(false)}>
          <div style={{ background:'var(--surface)', borderRadius:'var(--r)', width:500, maxHeight:'80vh', overflowY:'auto', boxShadow:'var(--shadow-l)', overflow:'hidden' }}>
            {importStatus.error ? (
              <div style={{ padding:'1.75rem' }}>
                <div style={{ fontSize:'2rem', marginBottom:'.75rem' }}>❌</div>
                <div style={{ fontWeight:800, fontSize:'1rem', marginBottom:'.5rem' }}>Erreur de lecture</div>
                <div style={{ fontSize:'.83rem', color:'var(--text3)', marginBottom:'1rem' }}>{importStatus.error}</div>
                <button className="btn" onClick={() => setImportPreview(false)}>Fermer</button>
              </div>
            ) : (
              <>
                <div style={{ background:'linear-gradient(135deg,#0f9b6e,#059669)', padding:'1.25rem 1.75rem', display:'flex', alignItems:'center', gap:'.75rem' }}>
                  <span style={{ fontSize:'1.6rem' }}>✅</span>
                  <div>
                    <div style={{ fontFamily:'Roboto Slab,serif', fontWeight:800, fontSize:'1.05rem', color:'#fff' }}>{importStatus.blocks.length} cours détectés</div>
                    <div style={{ fontSize:'.75rem', color:'rgba(255,255,255,.75)', marginTop:'.12rem' }}>Prévisualisation avant import</div>
                  </div>
                </div>
                <div style={{ maxHeight:300, overflowY:'auto', padding:'1rem 1.75rem' }}>
                  {importStatus.blocks.map((b, i) => {
                    const col = EDT_COLORS[b.colorIdx || 0];
                    return (
                      <div key={i} style={{ display:'flex', alignItems:'center', gap:'.75rem', padding:'.38rem .5rem', borderBottom:'1px solid var(--border)', fontSize:'.8rem' }}>
                        <div style={{ width:10, height:10, borderRadius:'50%', background:col.border, flexShrink:0 }} />
                        <span style={{ minWidth:70, color:'var(--text3)', fontSize:'.73rem' }}>{EDT_DAYS[b.day]}</span>
                        <span style={{ flex:1, fontWeight:600 }}>{b.title}</span>
                        <span style={{ color:'var(--text3)', fontSize:'.73rem' }}>{b.startH}h{String(b.startM).padStart(2,'0')}–{b.endH}h{String(b.endM).padStart(2,'0')}</span>
                        {b.weeks !== 'AB' && <span style={{ background:col.bg, color:col.text, fontSize:'.65rem', padding:'.1rem .35rem', borderRadius:4, fontWeight:700 }}>Sem.{b.weeks}</span>}
                      </div>
                    );
                  })}
                </div>
                <div style={{ padding:'1rem 1.75rem', borderTop:'1px solid var(--border)', display:'flex', gap:'.5rem', justifyContent:'flex-end' }}>
                  <button className="btn" onClick={() => { setImportPreview(false); setImportStatus(null); }}>Annuler</button>
                  <button className="btn btn-primary" onClick={confirmImport}>
                    Importer {importStatus.blocks.length} cours
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* ── Modale ajout/édition ── */}
      {showAdd && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,.5)', backdropFilter:'blur(4px)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:9999, padding:'1.25rem' }}
          onClick={e => e.target === e.currentTarget && setShowAdd(false)}>
          <div style={{ background:'var(--surface)', borderRadius:'var(--r)', padding:'1.4rem', width:'100%', maxWidth:390, boxShadow:'var(--shadow-l)', maxHeight:'90vh', overflowY:'auto' }}>
            <div style={{ fontFamily:'Roboto Slab,serif', fontSize:'.95rem', fontWeight:800, marginBottom:'.95rem', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
              <span>{editId ? 'Modifier le cours' : 'Ajouter un cours'}</span>
              <button onClick={() => setShowAdd(false)} style={{ background:'none', border:'none', cursor:'pointer', fontSize:'1.3rem', color:'var(--text3)' }}>×</button>
            </div>
            <div style={{ display:'flex', flexDirection:'column', gap:'.7rem' }}>
              <div style={{ display:'flex', flexDirection:'column', gap:'.25rem' }}>
                <label style={{ fontSize:'.72rem', fontWeight:700, color:'var(--text2)', textTransform:'uppercase', letterSpacing:'.07em' }}>Matière / Titre *</label>
                <input type="text" placeholder="Espagnol, Mathématiques…" value={form.title} onChange={e => setForm(f => ({...f, title: e.target.value}))} autoFocus
                  style={{ padding:'.55rem .75rem', border:'1.5px solid var(--border)', borderRadius:'var(--r-s)', background:'var(--surface2)', color:'var(--text)', fontFamily:'Roboto,sans-serif', fontSize:'.85rem', outline:'none' }} />
              </div>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'.6rem' }}>
                <div style={{ display:'flex', flexDirection:'column', gap:'.25rem' }}>
                  <label style={{ fontSize:'.72rem', fontWeight:700, color:'var(--text2)', textTransform:'uppercase', letterSpacing:'.07em' }}>Salle</label>
                  <input type="text" placeholder="Salle 12" value={form.room} onChange={e => setForm(f => ({...f, room: e.target.value}))}
                    style={{ padding:'.55rem .75rem', border:'1.5px solid var(--border)', borderRadius:'var(--r-s)', background:'var(--surface2)', color:'var(--text)', fontFamily:'Roboto,sans-serif', fontSize:'.85rem', outline:'none' }} />
                </div>
                <div style={{ display:'flex', flexDirection:'column', gap:'.25rem' }}>
                  <label style={{ fontSize:'.72rem', fontWeight:700, color:'var(--text2)', textTransform:'uppercase', letterSpacing:'.07em' }}>Semaine</label>
                  <select value={form.weeks} onChange={e => setForm(f => ({...f, weeks: e.target.value}))}
                    style={{ padding:'.55rem .75rem', border:'1.5px solid var(--border)', borderRadius:'var(--r-s)', background:'var(--surface2)', color:'var(--text)', fontFamily:'Roboto,sans-serif', fontSize:'.85rem', outline:'none' }}>
                    <option value="AB">A et B</option>
                    <option value="A">Semaine A</option>
                    <option value="B">Semaine B</option>
                  </select>
                </div>
              </div>
              <div style={{ display:'flex', flexDirection:'column', gap:'.25rem' }}>
                <label style={{ fontSize:'.72rem', fontWeight:700, color:'var(--text2)', textTransform:'uppercase', letterSpacing:'.07em' }}>Jour</label>
                <select value={form.day} onChange={e => setForm(f => ({...f, day: +e.target.value}))}
                  style={{ padding:'.55rem .75rem', border:'1.5px solid var(--border)', borderRadius:'var(--r-s)', background:'var(--surface2)', color:'var(--text)', fontFamily:'Roboto,sans-serif', fontSize:'.85rem', outline:'none' }}>
                  {EDT_DAYS.map((d,i) => <option key={d} value={i}>{d}</option>)}
                </select>
              </div>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'.6rem' }}>
                <div style={{ display:'flex', flexDirection:'column', gap:'.25rem' }}>
                  <label style={{ fontSize:'.72rem', fontWeight:700, color:'var(--text2)', textTransform:'uppercase', letterSpacing:'.07em' }}>Début</label>
                  <div style={{ display:'flex', gap:'.3rem' }}>
                    <select value={form.startH} onChange={e => setForm(f => ({...f, startH: +e.target.value}))}
                      style={{ flex:1, padding:'.5rem', border:'1.5px solid var(--border)', borderRadius:'var(--r-s)', background:'var(--surface2)', color:'var(--text)', fontFamily:'Roboto,sans-serif', fontSize:'.82rem', outline:'none' }}>
                      {EDT_HOURS.map(h => <option key={h} value={h}>{h}h</option>)}
                    </select>
                    <select value={form.startM} onChange={e => setForm(f => ({...f, startM: +e.target.value}))}
                      style={{ flex:1, padding:'.5rem', border:'1.5px solid var(--border)', borderRadius:'var(--r-s)', background:'var(--surface2)', color:'var(--text)', fontFamily:'Roboto,sans-serif', fontSize:'.82rem', outline:'none' }}>
                      {[0,5,10,15,20,25,30,35,40,45,50,55].map(m => <option key={m} value={m}>{String(m).padStart(2,'0')}</option>)}
                    </select>
                  </div>
                </div>
                <div style={{ display:'flex', flexDirection:'column', gap:'.25rem' }}>
                  <label style={{ fontSize:'.72rem', fontWeight:700, color:'var(--text2)', textTransform:'uppercase', letterSpacing:'.07em' }}>Fin</label>
                  <div style={{ display:'flex', gap:'.3rem' }}>
                    <select value={form.endH} onChange={e => setForm(f => ({...f, endH: +e.target.value}))}
                      style={{ flex:1, padding:'.5rem', border:'1.5px solid var(--border)', borderRadius:'var(--r-s)', background:'var(--surface2)', color:'var(--text)', fontFamily:'Roboto,sans-serif', fontSize:'.82rem', outline:'none' }}>
                      {EDT_HOURS.map(h => <option key={h} value={h}>{h}h</option>)}
                    </select>
                    <select value={form.endM} onChange={e => setForm(f => ({...f, endM: +e.target.value}))}
                      style={{ flex:1, padding:'.5rem', border:'1.5px solid var(--border)', borderRadius:'var(--r-s)', background:'var(--surface2)', color:'var(--text)', fontFamily:'Roboto,sans-serif', fontSize:'.82rem', outline:'none' }}>
                      {[0,5,10,15,20,25,30,35,40,45,50,55].map(m => <option key={m} value={m}>{String(m).padStart(2,'0')}</option>)}
                    </select>
                  </div>
                </div>
              </div>
              {classes.length > 0 && (
                <div style={{ display:'flex', flexDirection:'column', gap:'.25rem' }}>
                  <label style={{ fontSize:'.72rem', fontWeight:700, color:'var(--text2)', textTransform:'uppercase', letterSpacing:'.07em' }}>Lier à une classe</label>
                  <select value={form.classId} onChange={e => setForm(f => ({...f, classId: e.target.value}))}
                    style={{ padding:'.55rem .75rem', border:'1.5px solid var(--border)', borderRadius:'var(--r-s)', background:'var(--surface2)', color:'var(--text)', fontFamily:'Roboto,sans-serif', fontSize:'.85rem', outline:'none' }}>
                    <option value="">— Aucune classe —</option>
                    {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
              )}
              <div style={{ display:'flex', flexDirection:'column', gap:'.25rem' }}>
                <label style={{ fontSize:'.72rem', fontWeight:700, color:'var(--text2)', textTransform:'uppercase', letterSpacing:'.07em' }}>Couleur</label>
                <div style={{ display:'flex', gap:'.4rem', flexWrap:'wrap' }}>
                  {EDT_COLORS.map((c,i) => (
                    <div key={i} onClick={() => setForm(f => ({...f, colorIdx: i}))}
                      style={{ width:28, height:28, borderRadius:8, background: c.bg, border:`2.5px solid ${form.colorIdx===i ? c.border : 'transparent'}`, cursor:'pointer', boxShadow: form.colorIdx===i ? `0 0 0 2px ${c.border}` : 'none', transition:'all .15s' }} />
                  ))}
                </div>
              </div>
              <button onClick={saveBlock} disabled={!form.title.trim()}
                style={{ marginTop:'.4rem', padding:'.65rem', borderRadius:'var(--r-s)', border:'none', background:'var(--accent)', color:'#fff', fontFamily:'Roboto,sans-serif', fontWeight:700, fontSize:'.88rem', cursor:'pointer', opacity: form.title.trim() ? 1 : .5 }}>
                {editId ? 'Enregistrer' : 'Ajouter le cours'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Menu contextuel clic droit sur un jour ── */}
      {dayCtxMenu && (
        <>
          <div style={{ position:'fixed', inset:0, zIndex:3000 }} onClick={() => setDayCtxMenu(null)} onContextMenu={e => { e.preventDefault(); setDayCtxMenu(null); }} />
          <div style={{ position:'fixed', left: dayCtxMenu.x, top: dayCtxMenu.y, zIndex:3001, background:'var(--surface)', border:'1px solid var(--border)', borderRadius:'var(--r-s)', boxShadow:'var(--shadow-l)', minWidth:210, overflow:'hidden', padding:'.3rem 0' }}>
            <div style={{ padding:'.3rem .85rem .35rem', fontSize:'.65rem', fontWeight:700, color:'var(--text3)', textTransform:'uppercase', letterSpacing:'.07em', borderBottom:'1px solid var(--border)' }}>
              {EDT_DAYS[dayCtxMenu.dayIdx]} · {new Date(dayCtxMenu.dateIso + 'T12:00').toLocaleDateString('fr-FR',{day:'numeric',month:'long'})}
            </div>
            {joursAnnules[dayCtxMenu.dateIso] ? (
              <button onClick={() => { setJoursAnnules(j => { const n={...j}; delete n[dayCtxMenu.dateIso]; return n; }); setDayCtxMenu(null); }}
                style={{ display:'flex', alignItems:'center', gap:'.55rem', width:'100%', padding:'.42rem .85rem', background:'none', border:'none', cursor:'pointer', fontSize:'.82rem', color:'var(--text)', textAlign:'left' }}
                onMouseEnter={e => e.currentTarget.style.background='var(--surface2)'}
                onMouseLeave={e => e.currentTarget.style.background='none'}>
                ✅ Rétablir la journée
              </button>
            ) : (
              <button onClick={() => { setMotifForm({ motif:'malade', label:'' }); setMotifModal({ dayIdx:dayCtxMenu.dayIdx, dateIso:dayCtxMenu.dateIso }); setDayCtxMenu(null); }}
                style={{ display:'flex', alignItems:'center', gap:'.55rem', width:'100%', padding:'.42rem .85rem', background:'none', border:'none', cursor:'pointer', fontSize:'.82rem', color:'var(--danger)', textAlign:'left' }}
                onMouseEnter={e => e.currentTarget.style.background='rgba(220,38,38,.07)'}
                onMouseLeave={e => e.currentTarget.style.background='none'}>
                🚫 Supprimer cette journée…
              </button>
            )}
          </div>
        </>
      )}

      {/* ── Modale choix motif annulation journée ── */}
      {motifModal && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,.5)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:9999 }}
          onClick={e => e.target === e.currentTarget && setMotifModal(null)}>
          <div style={{ background:'var(--surface)', borderRadius:'var(--r)', width:380, boxShadow:'var(--shadow-l)', overflow:'hidden' }}>
            <div style={{ background:'linear-gradient(135deg,#dc2626,#b91c1c)', padding:'1.1rem 1.5rem', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
              <div>
                <div style={{ fontFamily:'Roboto Slab,serif', fontWeight:800, fontSize:'.95rem', color:'#fff' }}>🚫 Journée annulée</div>
                <div style={{ fontSize:'.73rem', color:'rgba(255,255,255,.75)', marginTop:'.1rem' }}>
                  {EDT_DAYS[motifModal.dayIdx]} {new Date(motifModal.dateIso+'T12:00').toLocaleDateString('fr-FR',{day:'numeric',month:'long'})}
                </div>
              </div>
              <button onClick={() => setMotifModal(null)} style={{ background:'rgba(255,255,255,.15)', border:'none', borderRadius:6, color:'#fff', cursor:'pointer', fontSize:'1.1rem', width:28, height:28, display:'flex', alignItems:'center', justifyContent:'center' }}>×</button>
            </div>
            <div style={{ padding:'1.25rem 1.5rem', display:'flex', flexDirection:'column', gap:'.75rem' }}>
              <div style={{ display:'flex', flexDirection:'column', gap:'.25rem' }}>
                <label style={{ fontSize:'.72rem', fontWeight:700, color:'var(--text2)', textTransform:'uppercase', letterSpacing:'.07em' }}>Motif</label>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'.38rem' }}>
                  {Object.entries(MOTIF_LABELS).map(([key, label]) => (
                    <button key={key} onClick={() => setMotifForm(f => ({...f, motif:key}))}
                      style={{ padding:'.45rem .65rem', borderRadius:'var(--r-s)', border:`2px solid ${motifForm.motif===key ? 'var(--accent)' : 'var(--border)'}`, background: motifForm.motif===key ? 'rgba(59,91,219,.08)' : 'var(--surface2)', color:'var(--text)', fontSize:'.8rem', cursor:'pointer', fontFamily:'Roboto,sans-serif', textAlign:'left', fontWeight: motifForm.motif===key ? 700 : 400 }}>
                      {label}
                    </button>
                  ))}
                </div>
              </div>
              <div style={{ display:'flex', flexDirection:'column', gap:'.25rem' }}>
                <label style={{ fontSize:'.72rem', fontWeight:700, color:'var(--text2)', textTransform:'uppercase', letterSpacing:'.07em' }}>Précision (optionnel)</label>
                <input type="text" placeholder="Ex: Journée pédagogique, Formation CPF…" value={motifForm.label} onChange={e => setMotifForm(f=>({...f,label:e.target.value}))}
                  style={{ padding:'.5rem .75rem', border:'1.5px solid var(--border)', borderRadius:'var(--r-s)', background:'var(--surface2)', color:'var(--text)', fontFamily:'Roboto,sans-serif', fontSize:'.83rem', outline:'none' }} />
              </div>
              <div style={{ display:'flex', gap:'.5rem', justifyContent:'flex-end', marginTop:'.25rem' }}>
                <button className="btn" onClick={() => setMotifModal(null)}>Annuler</button>
                <button className="btn btn-primary" style={{ background:'#dc2626', borderColor:'#dc2626' }}
                  onClick={() => { setJoursAnnules(j => ({...j, [motifModal.dateIso]: { motif:motifForm.motif, label:motifForm.label.trim() }})); setMotifModal(null); }}>
                  🚫 Confirmer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Modale gestion vacances ── */}
      {showVacances && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,.5)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:9999, padding:'1rem' }}
          onClick={e => e.target === e.currentTarget && setShowVacances(false)}>
          <div style={{ background:'var(--surface)', borderRadius:'var(--r)', width:500, maxHeight:'85vh', display:'flex', flexDirection:'column', boxShadow:'var(--shadow-l)', overflow:'hidden' }}>
            <div style={{ padding:'1.25rem 1.75rem', borderBottom:'1px solid var(--border)', display:'flex', justifyContent:'space-between', alignItems:'center', flexShrink:0 }}>
              <div>
                <div style={{ fontFamily:'Roboto Slab,serif', fontWeight:800, fontSize:'1rem' }}>🏖️ Périodes de vacances</div>
                <div style={{ fontSize:'.78rem', color:'var(--text3)', marginTop:'.15rem' }}>Les automatisations sauteront ces périodes</div>
              </div>
              <button onClick={() => setShowVacances(false)} style={{ background:'none', border:'none', cursor:'pointer', fontSize:'1.3rem', color:'var(--text3)' }}>×</button>
            </div>
            <div style={{ flex:1, overflowY:'auto', padding:'1.25rem 1.75rem', display:'flex', flexDirection:'column', gap:'1rem' }}>
              {/* Formulaire ajout */}
              <div style={{ padding:'.75rem', background:'var(--surface2)', border:'1px solid var(--border)', borderRadius:'var(--r-s)', display:'flex', flexDirection:'column', gap:'.5rem' }}>
                <div style={{ fontSize:'.72rem', fontWeight:700, color:'var(--text3)', textTransform:'uppercase', letterSpacing:'.07em' }}>Ajouter une période</div>
                <input type="text" placeholder="Nom (ex : Toussaint, Noël…)" value={newVac.label} onChange={e => setNewVac(v => ({...v, label:e.target.value}))}
                  style={{ padding:'.38rem .65rem', border:'1.5px solid var(--border)', borderRadius:'var(--r-xs)', background:'var(--surface)', color:'var(--text)', fontFamily:'Roboto,sans-serif', fontSize:'.82rem', outline:'none' }} />
                <div style={{ display:'flex', gap:'.5rem', alignItems:'flex-end' }}>
                  <div style={{ flex:1 }}>
                    <label style={{ fontSize:'.72rem', color:'var(--text2)', display:'block', marginBottom:'.2rem' }}>Début</label>
                    <input type="date" value={newVac.debut} onChange={e => setNewVac(v => ({...v, debut:e.target.value}))}
                      style={{ width:'100%', padding:'.38rem .65rem', border:'1.5px solid var(--border)', borderRadius:'var(--r-xs)', background:'var(--surface)', color:'var(--text)', fontFamily:'Roboto,sans-serif', fontSize:'.8rem', outline:'none' }} />
                  </div>
                  <div style={{ flex:1 }}>
                    <label style={{ fontSize:'.72rem', color:'var(--text2)', display:'block', marginBottom:'.2rem' }}>Fin</label>
                    <input type="date" value={newVac.fin} onChange={e => setNewVac(v => ({...v, fin:e.target.value}))}
                      style={{ width:'100%', padding:'.38rem .65rem', border:'1.5px solid var(--border)', borderRadius:'var(--r-xs)', background:'var(--surface)', color:'var(--text)', fontFamily:'Roboto,sans-serif', fontSize:'.8rem', outline:'none' }} />
                  </div>
                  <button className="btn btn-primary" style={{ padding:'.42rem .9rem', flexShrink:0 }}
                    disabled={!newVac.label.trim() || !newVac.debut || !newVac.fin || newVac.fin < newVac.debut}
                    onClick={() => {
                      setVacances(v => [...v, { id:'v'+Date.now(), label:newVac.label.trim(), debut:newVac.debut, fin:newVac.fin }].sort((a,b) => a.debut.localeCompare(b.debut)));
                      setNewVac({ label:'', debut:'', fin:'' });
                    }}>+ Ajouter</button>
                </div>
              </div>
              {/* Liste */}
              {vacances.length === 0 ? (
                <div style={{ textAlign:'center', color:'var(--text3)', fontSize:'.8rem', padding:'.75rem', fontStyle:'italic' }}>Aucune période enregistrée</div>
              ) : (
                <div style={{ display:'flex', flexDirection:'column', gap:'.3rem' }}>
                  {vacances.map(v => {
                    const debut = new Date(v.debut+'T12:00');
                    const fin   = new Date(v.fin+'T12:00');
                    const fmt   = d => d.toLocaleDateString('fr-FR',{day:'numeric',month:'short',year:'numeric'});
                    const duree = Math.round((fin - debut) / 86400000) + 1;
                    const isNow = edtIso(new Date()) >= v.debut && edtIso(new Date()) <= v.fin;
                    return (
                      <div key={v.id} style={{ display:'flex', alignItems:'center', gap:'.65rem', padding:'.55rem .875rem', background: isNow ? 'rgba(16,185,129,.08)' : 'var(--surface2)', border:`1px solid ${isNow ? 'rgba(16,185,129,.3)' : 'var(--border)'}`, borderRadius:'var(--r-s)' }}>
                        <span>🏖️</span>
                        <div style={{ flex:1 }}>
                          <div style={{ fontWeight:700, fontSize:'.82rem' }}>{v.label}
                            {isNow && <span style={{ marginLeft:'.4rem', background:'rgba(16,185,129,.15)', color:'#059669', fontSize:'.65rem', fontWeight:700, padding:'.08rem .35rem', borderRadius:99 }}>En cours</span>}
                          </div>
                          <div style={{ fontSize:'.72rem', color:'var(--text2)', marginTop:'.04rem' }}>{fmt(debut)} → {fmt(fin)} · {duree} jour{duree > 1 ? 's' : ''}</div>
                        </div>
                        <button onClick={() => setVacances(v2 => v2.filter(x => x.id !== v.id))}
                          style={{ background:'none', border:'none', cursor:'pointer', color:'var(--text3)', fontSize:'1rem', padding:'.1rem .3rem' }}>×</button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
            <div style={{ padding:'.875rem 1.75rem', borderTop:'1px solid var(--border)', display:'flex', justifyContent:'flex-end', flexShrink:0 }}>
              <button className="btn btn-primary" onClick={() => setShowVacances(false)}>Fermer</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Modale Réf A/B ── */}
      {showRefPicker && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,.5)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:9999 }}
          onClick={e => e.target === e.currentTarget && setShowRefPicker(false)}>
          <div style={{ background:'var(--surface)', borderRadius:'var(--r)', padding:'1.5rem', width:400, boxShadow:'var(--shadow-l)' }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'1rem' }}>
              <div>
                <div style={{ fontFamily:'Roboto Slab,serif', fontWeight:800, fontSize:'1rem' }}>⚙️ Référence semaine A</div>
                <div style={{ fontSize:'.78rem', color:'var(--text3)', marginTop:'.2rem' }}>Choisissez une date appartenant à une semaine A</div>
              </div>
              <button onClick={() => setShowRefPicker(false)} style={{ background:'none', border:'none', cursor:'pointer', fontSize:'1.3rem', color:'var(--text3)' }}>×</button>
            </div>
            <div style={{ padding:'.75rem', background:'rgba(59,91,219,.07)', border:'1px solid rgba(59,91,219,.2)', borderRadius:'var(--r-s)', fontSize:'.8rem', lineHeight:1.65, marginBottom:'1rem' }}>
              ClassPro calcule si une semaine est A ou B en comptant depuis cette référence.
            </div>
            <div style={{ display:'flex', flexDirection:'column', gap:'.25rem', marginBottom:'1rem' }}>
              <label style={{ fontSize:'.72rem', fontWeight:700, color:'var(--text2)', textTransform:'uppercase', letterSpacing:'.07em' }}>Date de référence</label>
              <input type="date" value={refPickerVal} onChange={e => setRefPickerVal(e.target.value)}
                style={{ padding:'.55rem .75rem', border:'1.5px solid var(--border)', borderRadius:'var(--r-s)', background:'var(--surface2)', color:'var(--text)', fontFamily:'Roboto,sans-serif', fontSize:'.85rem', outline:'none' }} />
            </div>
            <div style={{ fontSize:'.75rem', color:'var(--text2)', marginBottom:'1rem' }}>
              Référence actuelle : lundi du <strong>{refWeekA.toLocaleDateString('fr-FR',{day:'numeric',month:'long',year:'numeric'})}</strong>
            </div>
            <div style={{ display:'flex', gap:'.5rem', justifyContent:'flex-end' }}>
              <button className="btn" onClick={() => setShowRefPicker(false)}>Annuler</button>
              <button className="btn btn-primary" onClick={saveRefWeekA} disabled={!refPickerVal}>Enregistrer</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Menu contextuel clic droit ── */}
      {ctxMenu && (
        <>
          <div style={{ position:'fixed', inset:0, zIndex:3000 }} onClick={() => setCtxMenu(null)} onContextMenu={e => { e.preventDefault(); setCtxMenu(null); }} />
          <div style={{ position:'fixed', left: ctxMenu.x, top: ctxMenu.y, zIndex:3001, background:'var(--surface)', border:'1px solid var(--border)', borderRadius:'var(--r-s)', boxShadow:'var(--shadow-l)', minWidth:200, overflow:'hidden', padding:'.3rem 0' }}>
            <div style={{ padding:'.3rem .85rem .35rem', fontSize:'.65rem', fontWeight:700, color:'var(--text3)', textTransform:'uppercase', letterSpacing:'.07em', borderBottom:'1px solid var(--border)' }}>
              {ctxMenu.block.title} <span style={{ fontWeight:400, opacity:.7 }}>· Sem.{ctxMenu.block.weeks || 'AB'}</span>
            </div>
            {(() => {
              const block = ctxMenu.block;
              const coursData = cpData?.cours || {};
              const coursLie = Object.values(coursData).find(c => c.edtBlockId === block.id);
              const items = [
                coursLie
                  ? { icon:'📖', label:'Consulter le cours lié', action: () => { setCoursModal({ block, coursLie }); setCtxMenu(null); } }
                  : { icon:'✏️', label:'Créer un cours pour ce créneau', action: () => { setCoursModal({ block, coursLie: null }); setCtxMenu(null); } },
                { icon:'🔁', label:'Créer fiches et suivi', action: () => { setAutoClassId(block.classId||''); setAutoResult(null); setAutoPopup({ block }); setCtxMenu(null); } },
                { icon:'✏️', label:'Modifier le créneau', action: () => { editBlock(block); setCtxMenu(null); } },
                { icon:'🗑️', label:'Supprimer', danger: true, action: () => { delBlock(block.id); setCtxMenu(null); } },
              ];
              return items;
            })().map((item, i) => (
              <button key={i} onClick={item.action}
                style={{ display:'flex', alignItems:'center', gap:'.55rem', width:'100%', padding:'.42rem .85rem', background:'none', border:'none', cursor:'pointer', fontSize:'.82rem', color: item.danger ? 'var(--danger)' : 'var(--text)', textAlign:'left', borderTop: item.danger ? '1px solid var(--border)' : 'none' }}
                onMouseEnter={e => e.currentTarget.style.background = item.danger ? 'rgba(220,38,38,.07)' : 'var(--surface2)'}
                onMouseLeave={e => e.currentTarget.style.background = 'none'}>
                <span>{item.icon}</span> {item.label}
              </button>
            ))}
          </div>
        </>
      )}

      {/* ── Modale lier/créer cours depuis EDT ── */}
      {coursModal && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,.5)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:9999, padding:'1rem' }}
          onClick={e => e.target===e.currentTarget && setCoursModal(null)}>
          <div style={{ background:'var(--surface)', borderRadius:'var(--r)', width:460, boxShadow:'var(--shadow-l)', overflow:'hidden' }}>

            {/* Header */}
            <div style={{ background:'linear-gradient(135deg,#1e3a8a,#3b5bdb)', padding:'1.25rem 1.5rem', display:'flex', alignItems:'center', gap:'.75rem' }}>
              <span style={{ fontSize:'1.5rem' }}>✏️</span>
              <div>
                <div style={{ fontFamily:'Roboto Slab,serif', fontWeight:800, fontSize:'1rem', color:'#fff' }}>
                  {coursModal.coursLie ? 'Cours lié à ce créneau' : 'Créer un cours pour ce créneau'}
                </div>
                <div style={{ fontSize:'.75rem', color:'rgba(255,255,255,.75)', marginTop:'.15rem' }}>
                  {EDT_DAYS[coursModal.block.day]} · {coursModal.block.startH}h{String(coursModal.block.startM).padStart(2,'0')} – {coursModal.block.endH}h{String(coursModal.block.endM).padStart(2,'0')} · Sem.{coursModal.block.weeks||'AB'}
                </div>
              </div>
              <button onClick={() => setCoursModal(null)}
                style={{ marginLeft:'auto', background:'rgba(255,255,255,.15)', border:'none', borderRadius:6, color:'#fff', cursor:'pointer', fontSize:'1.1rem', width:28, height:28, display:'flex', alignItems:'center', justifyContent:'center' }}>×</button>
            </div>

            <div style={{ padding:'1.25rem 1.5rem', display:'flex', flexDirection:'column', gap:'1rem' }}>
              {coursModal.coursLie ? (
                <>
                  {/* Cours existant lié */}
                  <div style={{ padding:'.875rem 1rem', background:'rgba(59,91,219,.07)', border:'1px solid rgba(59,91,219,.25)', borderRadius:'var(--r-s)' }}>
                    <div style={{ fontWeight:700, fontSize:'.92rem', marginBottom:'.25rem' }}>{coursModal.coursLie.titre}</div>
                    <div style={{ fontSize:'.75rem', color:'var(--text3)' }}>
                      {[
                        (cpData?.classes||[]).find(c=>c.id===coursModal.coursLie.classeId)?.name,
                        coursModal.coursLie.date ? new Date(coursModal.coursLie.date+'T12:00').toLocaleDateString('fr-FR',{day:'numeric',month:'long'}) : null,
                        coursModal.coursLie.sections?.filter(s=>s.contenu?.trim()).length + ' section(s) remplie(s)'
                      ].filter(Boolean).join(' · ')}
                    </div>
                  </div>
                  <div style={{ fontSize:'.8rem', color:'var(--text3)', textAlign:'center' }}>
                    Pour consulter ou modifier ce cours, allez dans <strong>Préparer → Créer un cours</strong>
                  </div>
                  <div style={{ display:'flex', gap:'.5rem', justifyContent:'space-between' }}>
                    <button className="btn" style={{ color:'var(--danger)', borderColor:'var(--danger)', fontSize:'.78rem' }}
                      onClick={() => {
                        const updated = { ...coursModal.coursLie, edtBlockId: null };
                        onDataChange('cdc-cours', { ...(cpData?.cours||{}), [updated.id]: updated });
                        setCoursModal(null);
                      }}>
                      Délier ce cours
                    </button>
                    <button className="btn btn-primary" onClick={() => setCoursModal(null)}>Fermer</button>
                  </div>
                </>
              ) : (
                <>
                  {/* Créer ou lier un cours */}
                  {(() => {
                    const coursData = cpData?.cours || {};
                    const coursList = Object.values(coursData).filter(c => !c.edtBlockId);
                    return coursList.length > 0 ? (
                      <>
                        <div style={{ fontSize:'.82rem', color:'var(--text2)', fontWeight:600 }}>Lier un cours existant</div>
                        <div style={{ display:'flex', flexDirection:'column', gap:'.38rem', maxHeight:180, overflowY:'auto' }}>
                          {coursList.map(c => (
                            <button key={c.id}
                              onClick={() => {
                                const updated = { ...c, edtBlockId: coursModal.block.id };
                                onDataChange('cdc-cours', { ...coursData, [c.id]: updated });
                                setCoursModal(null);
                              }}
                              style={{ display:'flex', alignItems:'center', gap:'.65rem', padding:'.5rem .75rem', border:'1px solid var(--border)', borderRadius:'var(--r-s)', background:'var(--surface2)', cursor:'pointer', fontFamily:'Roboto,sans-serif', textAlign:'left', transition:'all .13s' }}
                              onMouseEnter={e => { e.currentTarget.style.borderColor='var(--accent)'; e.currentTarget.style.background='rgba(59,91,219,.06)'; }}
                              onMouseLeave={e => { e.currentTarget.style.borderColor='var(--border)'; e.currentTarget.style.background='var(--surface2)'; }}>
                              <span style={{ fontSize:'.9rem' }}>📖</span>
                              <div>
                                <div style={{ fontWeight:600, fontSize:'.83rem' }}>{c.titre}</div>
                                <div style={{ fontSize:'.7rem', color:'var(--text3)' }}>
                                  {(cpData?.classes||[]).find(cl=>cl.id===c.classeId)?.name || 'Sans classe'}
                                  {c.date ? ' · ' + new Date(c.date+'T12:00').toLocaleDateString('fr-FR',{day:'numeric',month:'short'}) : ''}
                                </div>
                              </div>
                            </button>
                          ))}
                        </div>
                        <div style={{ display:'flex', alignItems:'center', gap:'.75rem' }}>
                          <div style={{ flex:1, height:1, background:'var(--border)' }} />
                          <span style={{ fontSize:'.72rem', color:'var(--text3)' }}>ou</span>
                          <div style={{ flex:1, height:1, background:'var(--border)' }} />
                        </div>
                      </>
                    ) : null;
                  })()}
                  <div style={{ fontSize:'.82rem', color:'var(--text2)', fontWeight:600 }}>Créer un nouveau cours pour ce créneau</div>
                  <div style={{ fontSize:'.78rem', color:'var(--text3)', padding:'.65rem .875rem', background:'var(--surface2)', borderRadius:'var(--r-s)', lineHeight:1.6 }}>
                    Un cours vide sera créé et automatiquement lié à ce créneau EDT. Vous pourrez ensuite le remplir depuis <strong>Préparer → Créer un cours</strong>.
                  </div>
                  <div style={{ display:'flex', gap:'.5rem', justifyContent:'flex-end' }}>
                    <button className="btn" onClick={() => setCoursModal(null)}>Annuler</button>
                    <button className="btn btn-primary"
                      onClick={() => {
                        const block = coursModal.block;
                        const id = 'cours-' + Date.now();
                        const classeId = block.classId || '';
                        const nc = {
                          id,
                          titre: block.title + (block.date ? '' : ''),
                          date: '',
                          classeId,
                          sequenceId: '',
                          createdAt: new Date().toISOString(),
                          edtBlockId: block.id,
                          sections: [
                            { id:'objectifs',   label:'Objectifs',            icon:'🎯', placeholder:'Objectifs de la séance...', contenu:'' },
                            { id:'deroulement', label:'Déroulement / Activité',icon:'📋', placeholder:'Déroulement...', contenu:'' },
                            { id:'devoirs',     label:'Devoirs',               icon:'📝', placeholder:'Travail à faire...', contenu:'' },
                          ],
                          attachments: [],
                        };
                        onDataChange('cdc-cours', { ...(cpData?.cours||{}), [id]: nc });
                        setCoursModal(null);
                      }}>
                      ✏️ Créer le cours
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Modale automatisation ── */}
      {autoPopup && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,.5)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:9999 }}
          onClick={e => e.target === e.currentTarget && !autoResult && setAutoPopup(null)}>
          <div style={{ background:'var(--surface)', borderRadius:'var(--r)', width:460, maxHeight:'90vh', overflowY:'auto', boxShadow:'var(--shadow-l)', overflow:'hidden' }}>
            {autoResult ? (
              <>
                <div style={{ background:'linear-gradient(135deg,#0f9b6e,#059669)', padding:'1.25rem 1.75rem', display:'flex', alignItems:'center', gap:'.75rem' }}>
                  <span style={{ fontSize:'1.6rem' }}>✅</span>
                  <div>
                    <div style={{ fontFamily:'Roboto Slab,serif', fontWeight:800, fontSize:'1.05rem', color:'#fff' }}>Automatisation effectuée !</div>
                    <div style={{ fontSize:'.75rem', color:'rgba(255,255,255,.75)', marginTop:'.12rem' }}>Classe : {autoResult.className}</div>
                  </div>
                </div>
                <div style={{ padding:'1rem 1.75rem', display:'flex', gap:'.75rem' }}>
                  <div style={{ flex:1, padding:'.75rem', background:'rgba(15,155,110,.07)', border:'1px solid rgba(15,155,110,.2)', borderRadius:'var(--r-s)', textAlign:'center' }}>
                    <div style={{ fontSize:'1.6rem', fontWeight:800, color:'var(--success)' }}>{autoResult.sessionsCreated}</div>
                    <div style={{ fontSize:'.7rem', color:'var(--text2)' }}>séance{autoResult.sessionsCreated>1?'s':''}</div>
                  </div>
                  <div style={{ flex:1, padding:'.75rem', background:'rgba(59,91,219,.07)', border:'1px solid rgba(59,91,219,.2)', borderRadius:'var(--r-s)', textAlign:'center' }}>
                    <div style={{ fontSize:'1.6rem', fontWeight:800, color:'var(--accent)' }}>{autoResult.fichesCreated}</div>
                    <div style={{ fontSize:'.7rem', color:'var(--text2)' }}>fiche{autoResult.fichesCreated>1?'s':''}</div>
                  </div>
                  {autoResult.skipped > 0 && (
                    <div style={{ flex:1, padding:'.75rem', background:'rgba(217,119,6,.07)', border:'1px solid rgba(217,119,6,.2)', borderRadius:'var(--r-s)', textAlign:'center' }}>
                      <div style={{ fontSize:'1.6rem', fontWeight:800, color:'var(--warning)' }}>{autoResult.skipped}</div>
                      <div style={{ fontSize:'.7rem', color:'var(--text2)' }}>ignoré{autoResult.skipped>1?'s':''}</div>
                    </div>
                  )}
                </div>
                <div style={{ padding:'0 1.75rem 1.25rem' }}>
                  <button className="btn btn-primary" style={{ width:'100%', justifyContent:'center' }} onClick={() => setAutoPopup(null)}>Fermer</button>
                </div>
              </>
            ) : (
              <>
                <div style={{ padding:'1.25rem 1.75rem', borderBottom:'1px solid var(--border)', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                  <div>
                    <div style={{ fontFamily:'Roboto Slab,serif', fontWeight:800, fontSize:'1rem' }}>🔁 Créer les fiches et le suivi</div>
                    <div style={{ fontSize:'.78rem', color:'var(--text3)', marginTop:'.2rem' }}>
                      {autoPopup.block ? `${autoPopup.block.title} · ${EDT_DAYS[autoPopup.block.day]}` : 'Automatisation globale'}
                    </div>
                  </div>
                  <button onClick={() => setAutoPopup(null)} style={{ background:'none', border:'none', cursor:'pointer', fontSize:'1.3rem', color:'var(--text3)' }}>×</button>
                </div>
                <div style={{ padding:'1.25rem 1.75rem', display:'flex', flexDirection:'column', gap:'1rem' }}>
                  {/* Sélection classe */}
                  <div style={{ display:'flex', flexDirection:'column', gap:'.25rem' }}>
                    <label style={{ fontSize:'.72rem', fontWeight:700, color:'var(--text2)', textTransform:'uppercase', letterSpacing:'.07em' }}>Classe cible *</label>
                    <select value={autoClassId} onChange={e => setAutoClassId(e.target.value)}
                      style={{ padding:'.55rem .75rem', border:'1.5px solid var(--border)', borderRadius:'var(--r-s)', background:'var(--surface2)', color:'var(--text)', fontFamily:'Roboto,sans-serif', fontSize:'.85rem', outline:'none' }}>
                      <option value="">— Sélectionnez une classe —</option>
                      {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </div>
                  {/* Nombre de semaines */}
                  <div style={{ display:'flex', flexDirection:'column', gap:'.25rem' }}>
                    <label style={{ fontSize:'.72rem', fontWeight:700, color:'var(--text2)', textTransform:'uppercase', letterSpacing:'.07em' }}>Nombre de semaines à créer</label>
                    <input type="number" min={1} max={40} value={autoNbWeeks} onChange={e => setAutoNbWeeks(+e.target.value)}
                      style={{ padding:'.55rem .75rem', border:'1.5px solid var(--border)', borderRadius:'var(--r-s)', background:'var(--surface2)', color:'var(--text)', fontFamily:'Roboto,sans-serif', fontSize:'.85rem', outline:'none', width:100 }} />
                  </div>
                  <div style={{ padding:'.75rem', background:'rgba(59,91,219,.07)', border:'1px solid rgba(59,91,219,.2)', borderRadius:'var(--r-s)', fontSize:'.8rem', lineHeight:1.65 }}>
                    Cela créera automatiquement les séances dans <strong>Suivi de classe</strong> et les fiches dans <strong>Carnet de bord</strong> pour les {autoNbWeeks} prochaines semaines, en tenant compte des semaines A/B.
                  </div>
                  <div style={{ display:'flex', gap:'.5rem', justifyContent:'flex-end' }}>
                    <button className="btn" onClick={() => setAutoPopup(null)}>Annuler</button>
                    <button className="btn btn-primary" disabled={!autoClassId || !autoPopup.block} onClick={runAutomation}>
                      🔁 Lancer l&apos;automatisation
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
