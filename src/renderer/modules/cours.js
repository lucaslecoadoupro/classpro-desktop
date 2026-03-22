// ── MODULE CRÉER UN COURS ────────────────────────────────────────────────────

const COURS_SECTIONS_DEFAULT = [
  { id: 'objectifs',  label: 'Objectifs',            icon: '🎯', placeholder: 'Ce que les élèves vont apprendre et savoir faire...' },
  { id: 'deroulement',label: 'Déroulement / Activité',icon: '📋', placeholder: 'Déroulement de la séance, activités, étapes...' },
  { id: 'devoirs',    label: 'Devoirs',               icon: '📝', placeholder: 'Travail à faire à la maison...' },
];

// ── Éditeur rich text — contentEditable + execCommand ───────────────────────

// Injecter le CSS placeholder une seule fois
if (!document.getElementById('rich-editor-css')) {
  const s = document.createElement('style');
  s.id = 'rich-editor-css';
  s.textContent = '[contenteditable][data-ph]:empty::before{content:attr(data-ph);color:var(--text3);pointer-events:none;font-style:italic}';
  document.head.appendChild(s);
}
const RICH_FONTS = [
  { v: 'Roboto, sans-serif',          l: 'Roboto' },
  { v: 'Roboto Slab, serif',          l: 'Slab' },
  { v: 'Georgia, serif',              l: 'Georgia' },
  { v: 'Arial, sans-serif',           l: 'Arial' },
  { v: 'Courier New, monospace',      l: 'Mono' },
  { v: 'Comic Sans MS, cursive',      l: 'Comic' },
];

function RichTextarea({ value, onChange, placeholder }) {
  const ref      = React.useRef(null);
  const savedSel = React.useRef(null);
  const isEdit   = React.useRef(false);

  // Sync depuis l'extérieur uniquement si pas en train d'éditer
  React.useEffect(() => {
    if (ref.current && !isEdit.current) {
      ref.current.innerHTML = value || '';
    }
  }, [value]);

  const saveSel = () => {
    const s = window.getSelection();
    if (s && s.rangeCount > 0) savedSel.current = s.getRangeAt(0).cloneRange();
  };
  const restoreSel = () => {
    if (!savedSel.current) return;
    const s = window.getSelection();
    if (s) { s.removeAllRanges(); s.addRange(savedSel.current); }
  };
  const exec = (cmd, val = null) => {
    restoreSel();
    document.execCommand(cmd, false, val);
    ref.current?.focus();
    onChange(ref.current?.innerHTML || '');
  };

  const btnStyle = {
    height: 24, minWidth: 24, padding: '0 5px',
    border: '1px solid var(--border)', borderRadius: 3,
    background: 'var(--surface)', color: 'var(--text2)',
    cursor: 'pointer', fontSize: '.72rem', fontWeight: 700,
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
    flexShrink: 0, fontFamily: 'Roboto,sans-serif',
  };
  const sep = <div style={{ width:1, background:'var(--border)', margin:'0 3px', alignSelf:'stretch' }} />;

  return (
    <div style={{ border: '1.5px solid var(--border)', borderRadius: 'var(--r-s)', overflow: 'hidden', background: 'var(--surface)' }}
      onFocusCapture={e => e.currentTarget.style.borderColor = 'var(--accent)'}
      onBlurCapture={e => { if (!e.currentTarget.contains(e.relatedTarget)) { e.currentTarget.style.borderColor = 'var(--border)'; isEdit.current = false; } }}>

      {/* Barre 1 : formatage + alignement */}
      <div onMouseDown={e => e.preventDefault()}
        style={{ display:'flex', gap:3, padding:'4px 7px 3px', borderBottom:'1px solid var(--border)', background:'var(--surface2)', flexWrap:'wrap', alignItems:'center' }}>
        <button style={btnStyle} onMouseDown={e=>{e.preventDefault();saveSel();}} onClick={()=>exec('bold')}     title="Gras"><b>B</b></button>
        <button style={btnStyle} onMouseDown={e=>{e.preventDefault();saveSel();}} onClick={()=>exec('italic')}   title="Italique"><i>I</i></button>
        <button style={btnStyle} onMouseDown={e=>{e.preventDefault();saveSel();}} onClick={()=>exec('underline')} title="Souligné"><u>U</u></button>
        {sep}
        <button style={btnStyle} onMouseDown={e=>{e.preventDefault();saveSel();}} onClick={()=>exec('justifyLeft')}   title="Gauche">⬅</button>
        <button style={btnStyle} onMouseDown={e=>{e.preventDefault();saveSel();}} onClick={()=>exec('justifyCenter')} title="Centrer">≡</button>
        <button style={btnStyle} onMouseDown={e=>{e.preventDefault();saveSel();}} onClick={()=>exec('justifyRight')}  title="Droite">➡</button>
        {sep}
        <button style={btnStyle} onMouseDown={e=>{e.preventDefault();saveSel();}} onClick={()=>exec('insertUnorderedList')} title="Liste à puces">•≡</button>
        <button style={btnStyle} onMouseDown={e=>{e.preventDefault();saveSel();}} onClick={()=>exec('insertOrderedList')}   title="Liste numérotée">①</button>
        {sep}
        <button style={btnStyle} onMouseDown={e=>{e.preventDefault();saveSel();}} onClick={()=>exec('removeFormat')} title="Effacer formatage">✕</button>
      </div>

      {/* Barre 2 : police + couleur */}
      <div onMouseDown={e => e.preventDefault()}
        style={{ display:'flex', gap:3, padding:'3px 7px', borderBottom:'1px solid var(--border)', background:'var(--surface2)', alignItems:'center', flexWrap:'wrap' }}>
        <span style={{ fontSize:'.6rem', fontWeight:700, color:'var(--text3)', textTransform:'uppercase', letterSpacing:'.05em', flexShrink:0, marginRight:2 }}>Police :</span>
        {RICH_FONTS.map(f => (
          <button key={f.v}
            style={{ ...btnStyle, fontFamily: f.v, fontSize: '.65rem', padding: '0 6px' }}
            onMouseDown={e => { e.preventDefault(); saveSel(); }}
            onClick={() => exec('fontName', f.v)}>
            {f.l}
          </button>
        ))}
        {sep}
        <span style={{ fontSize:'.6rem', fontWeight:700, color:'var(--text3)', textTransform:'uppercase', letterSpacing:'.05em', flexShrink:0 }}>Couleur :</span>
        <input type="color" defaultValue="#1a2236"
          onMouseDown={e => saveSel()}
          onChange={e => exec('foreColor', e.target.value)}
          style={{ width:22, height:22, padding:1, border:'1px solid var(--border)', borderRadius:3, cursor:'pointer', background:'none', flexShrink:0 }}
          title="Couleur du texte" />
      </div>

      {/* Zone de saisie */}
      <div ref={ref} contentEditable suppressContentEditableWarning
        onFocus={() => { isEdit.current = true; }}
        onBlur={() => { isEdit.current = false; onChange(ref.current?.innerHTML || ''); }}
        onInput={() => onChange(ref.current?.innerHTML || '')}
        onKeyUp={saveSel} onMouseUp={saveSel}
        data-ph={placeholder}
        style={{ minHeight: 120, padding: '.75rem', outline: 'none', fontFamily: 'Roboto,sans-serif', fontSize: '.88rem', lineHeight: 1.7, color: 'var(--text)', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }} />
    </div>
  );
}

// Rendu markdown simple pour l'aperçu
function renderMarkdown(text) {
  if (!text) return null;
  return text.split('\n').map((line, i) => {
    if (!line.trim()) return <br key={i} />;
    if (line.startsWith('## '))  return <h2 key={i} style={{ fontSize:'1rem', fontWeight:800, margin:'.5rem 0 .25rem', color:'var(--text)' }}>{line.slice(3)}</h2>;
    if (line.startsWith('### ')) return <h3 key={i} style={{ fontSize:'.88rem', fontWeight:700, margin:'.4rem 0 .2rem', color:'var(--text2)' }}>{line.slice(4)}</h3>;
    if (line.startsWith('• ') || line.startsWith('- ')) return <div key={i} style={{ display:'flex', gap:'.5rem', margin:'.1rem 0' }}><span style={{ color:'var(--accent)', flexShrink:0 }}>•</span><span>{renderInline(line.slice(2))}</span></div>;
    if (/^\d+\.\s/.test(line)) { const m = line.match(/^(\d+)\.\s(.*)/); return <div key={i} style={{ display:'flex', gap:'.5rem', margin:'.1rem 0' }}><span style={{ color:'var(--accent)', flexShrink:0, minWidth:16 }}>{m[1]}.</span><span>{renderInline(m[2])}</span></div>; }
    return <p key={i} style={{ margin:'.15rem 0', lineHeight:1.7 }}>{renderInline(line)}</p>;
  });
}

function renderInline(text) {
  const parts = [];
  let rest = text;
  let key = 0;
  while (rest) {
    const boldMatch  = rest.match(/\*\*(.+?)\*\*/);
    const italMatch  = rest.match(/_(.+?)_/);
    const ulMatch    = rest.match(/__(.+?)__/);
    const candidates = [boldMatch, italMatch, ulMatch].filter(Boolean).sort((a,b) => a.index - b.index);
    if (!candidates.length) { parts.push(<span key={key++}>{rest}</span>); break; }
    const first = candidates[0];
    if (first.index > 0) parts.push(<span key={key++}>{rest.slice(0, first.index)}</span>);
    if (first === boldMatch)  parts.push(<strong key={key++}>{first[1]}</strong>);
    if (first === italMatch)  parts.push(<em key={key++}>{first[1]}</em>);
    if (first === ulMatch)    parts.push(<u key={key++}>{first[1]}</u>);
    rest = rest.slice(first.index + first[0].length);
  }
  return parts;
}


// ── SECTION DOCUMENTS / PIÈCES JOINTES ───────────────────────────────────────
function SectionDocuments({ attachments, onChange }) {
  const [newLink, setNewLink] = useState('');
  const [newLinkLabel, setNewLinkLabel] = useState('');
  const [showAddLink, setShowAddLink] = useState(false);
  const fileInputRef = React.useRef(null);

  const addFile = (file) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const att = {
        id:   'att-' + Date.now(),
        type: 'file',
        name: file.name,
        mime: file.type,
        size: file.size,
        data: e.target.result, // base64 data URL
      };
      onChange([...attachments, att]);
    };
    reader.readAsDataURL(file);
  };

  const addLink = () => {
    if (!newLink.trim()) return;
    const att = {
      id:    'att-' + Date.now(),
      type:  'link',
      name:  newLinkLabel.trim() || newLink.trim(),
      url:   newLink.trim().startsWith('http') ? newLink.trim() : 'https://' + newLink.trim(),
    };
    onChange([...attachments, att]);
    setNewLink('');
    setNewLinkLabel('');
    setShowAddLink(false);
  };

  const remove = (id) => onChange(attachments.filter(a => a.id !== id));

  const getIcon = (att) => {
    if (att.type === 'link') return '🔗';
    if (att.mime?.startsWith('image/')) return '🖼️';
    if (att.mime === 'application/pdf') return '📄';
    return '📎';
  };

  const formatSize = (bytes) => {
    if (!bytes) return '';
    if (bytes < 1024) return bytes + ' o';
    if (bytes < 1024*1024) return (bytes/1024).toFixed(0) + ' Ko';
    return (bytes/1024/1024).toFixed(1) + ' Mo';
  };

  const openFile = (att) => {
    if (att.type === 'link') { window.open(att.url, '_blank'); return; }
    // Ouvrir le fichier depuis la data URL
    const w = window.open();
    if (att.mime?.startsWith('image/')) {
      w.document.write(`<img src="${att.data}" style="max-width:100%;"/>`);
    } else {
      w.location = att.data;
    }
  };

  return (
    <div style={{ border:'1px solid var(--border)', borderRadius:'var(--r)', background:'var(--surface)', overflow:'hidden' }}>
      {/* Header */}
      <div style={{ display:'flex', alignItems:'center', gap:'.5rem', padding:'.65rem 1rem', borderBottom:'1px solid var(--border)', cursor:'default' }}>
        <span style={{ opacity:.4, fontSize:'.8rem' }}>⠿</span>
        <span style={{ fontSize:'.95rem' }}>📎</span>
        <div style={{ fontWeight:700, fontSize:'.88rem', flex:1 }}>Documents / Supports</div>
        <span style={{ fontSize:'.72rem', color:'var(--text3)' }}>{attachments.length} fichier(s)</span>
      </div>

      {/* Liste des pièces jointes */}
      <div style={{ padding:'.75rem 1rem', display:'flex', flexDirection:'column', gap:'.5rem', minHeight: attachments.length ? 'auto' : 0 }}>
        {attachments.map(att => (
          <div key={att.id} style={{ display:'flex', alignItems:'center', gap:'.65rem', padding:'.5rem .75rem', background:'var(--surface2)', border:'1px solid var(--border)', borderRadius:'var(--r-s)' }}>
            <span style={{ fontSize:'1.1rem', flexShrink:0 }}>{getIcon(att)}</span>
            {/* Préview image */}
            {att.type === 'file' && att.mime?.startsWith('image/') && att.data && (
              <img src={att.data} alt={att.name}
                style={{ width:40, height:40, objectFit:'cover', borderRadius:4, flexShrink:0, cursor:'pointer' }}
                onClick={() => openFile(att)} />
            )}
            <div style={{ flex:1, minWidth:0 }}>
              <button onClick={() => openFile(att)}
                style={{ background:'none', border:'none', cursor:'pointer', padding:0, fontFamily:'Roboto,sans-serif', fontWeight:600, fontSize:'.83rem', color:'var(--accent)', textAlign:'left', textDecoration:'underline dotted', textUnderlineOffset:3, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', maxWidth:'100%', display:'block' }}>
                {att.name}
              </button>
              <div style={{ fontSize:'.7rem', color:'var(--text3)', marginTop:'.08rem' }}>
                {att.type === 'link' ? att.url : formatSize(att.size)}
              </div>
            </div>
            <button onClick={() => remove(att.id)}
              style={{ background:'none', border:'none', cursor:'pointer', color:'var(--text3)', fontSize:'.75rem', padding:'.2rem .35rem', borderRadius:4, flexShrink:0 }}
              onMouseEnter={e => e.currentTarget.style.color='var(--danger)'}
              onMouseLeave={e => e.currentTarget.style.color='var(--text3)'}>×</button>
          </div>
        ))}
      </div>

      {/* Zone ajout lien */}
      {showAddLink && (
        <div style={{ padding:'.75rem 1rem', borderTop:'1px solid var(--border)', display:'flex', flexDirection:'column', gap:'.5rem', background:'var(--surface2)' }}>
          <input value={newLink} onChange={e => setNewLink(e.target.value)}
            onKeyDown={e => { if(e.key==='Enter') addLink(); if(e.key==='Escape') setShowAddLink(false); }}
            placeholder="https://exemple.com"
            autoFocus
            style={{ padding:'.5rem .75rem', border:'1.5px solid var(--accent)', borderRadius:'var(--r-s)', background:'var(--surface)', color:'var(--text)', fontFamily:'Roboto,sans-serif', fontSize:'.85rem', outline:'none' }} />
          <input value={newLinkLabel} onChange={e => setNewLinkLabel(e.target.value)}
            placeholder="Nom du lien (optionnel)"
            style={{ padding:'.5rem .75rem', border:'1.5px solid var(--border)', borderRadius:'var(--r-s)', background:'var(--surface)', color:'var(--text)', fontFamily:'Roboto,sans-serif', fontSize:'.85rem', outline:'none' }} />
          <div style={{ display:'flex', gap:'.4rem', justifyContent:'flex-end' }}>
            <button onClick={() => setShowAddLink(false)} className="btn" style={{ fontSize:'.78rem' }}>Annuler</button>
            <button onClick={addLink} disabled={!newLink.trim()} className="btn btn-primary" style={{ fontSize:'.78rem' }}>Ajouter</button>
          </div>
        </div>
      )}

      {/* Boutons d'ajout */}
      <div style={{ padding:'.65rem 1rem', borderTop:'1px solid var(--border)', display:'flex', gap:'.5rem', background:'var(--surface2)' }}>
        <input ref={fileInputRef} type="file" accept=".jpg,.jpeg,.png,.pdf" style={{ display:'none' }}
          onChange={e => { if(e.target.files[0]) addFile(e.target.files[0]); e.target.value=''; }} />
        <button onClick={() => fileInputRef.current?.click()} className="btn" style={{ fontSize:'.75rem' }}>
          🖼️ Image / PDF
        </button>
        <button onClick={() => setShowAddLink(v => !v)} className="btn" style={{ fontSize:'.75rem', background: showAddLink ? 'var(--accent)' : '', color: showAddLink ? '#fff' : '', borderColor: showAddLink ? 'var(--accent)' : '' }}>
          🔗 Lien
        </button>
      </div>
    </div>
  );
}

function ModuleCours({ cpData, onDataChange }) {
  const classes    = cpData?.classes    || [];
  const progs      = cpData?.progs      || {};
  const coursData  = cpData?.cours      || {};

  // cours stocké par id de fiche dans cdc-cours : { [id]: { titre, date, classeId, sequenceId, sections:[{id,label,icon,contenu}], createdAt } }

  const [selCours,   setSelCours]   = useState(null); // id du cours actif
  const [vue,        setVue]        = useState('edit'); // 'edit' | 'apercu'
  const [showNewCours, setShowNewCours] = useState(false);
  const [showNewSection, setShowNewSection] = useState(false);
  const [newSectionLabel, setNewSectionLabel] = useState('');
  const [newCoursForm, setNewCoursForm] = useState({ titre:'', date:'', classeId:'', sequenceId:'' });
  const [dragIdx,    setDragIdx]    = useState(null);
  const [dragOver,   setDragOver]   = useState(null);

  const coursList = Object.values(coursData).sort((a,b) => (b.createdAt||'').localeCompare(a.createdAt||''));
  const cours = selCours ? coursData[selCours] : null;

  const saveCours = (updated) => {
    onDataChange('cdc-cours', { ...coursData, [updated.id]: updated });
  };

  const createCours = () => {
    if (!newCoursForm.titre.trim()) return;
    const id = 'cours-' + Date.now();
    const nc = {
      id,
      titre:      newCoursForm.titre.trim(),
      date:       newCoursForm.date,
      classeId:   newCoursForm.classeId,
      sequenceId: newCoursForm.sequenceId,
      createdAt:  new Date().toISOString(),
      sections:   COURS_SECTIONS_DEFAULT.map(s => ({ ...s, contenu:'' })),
      attachments: [], // { id, type:'file'|'link', name, data, url, mime }
    };
    onDataChange('cdc-cours', { ...coursData, [id]: nc });
    setSelCours(id);
    setNewCoursForm({ titre:'', date:'', classeId:'', sequenceId:'' });
    setShowNewCours(false);
    setVue('edit');
    cpdUnlockBadge('first_cours');
  };

  const deleteCours = (id) => {
    if (!window.confirm('Supprimer ce cours ?')) return;
    const next = { ...coursData };
    delete next[id];
    onDataChange('cdc-cours', next);
    if (selCours === id) setSelCours(null);
  };

  const updateSection = (secId, contenu) => {
    if (!cours) return;
    saveCours({ ...cours, sections: cours.sections.map(s => s.id===secId ? {...s, contenu} : s) });
  };

  const updateMeta = (key, val) => {
    if (!cours) return;
    saveCours({ ...cours, [key]: val });
  };

  const addSection = () => {
    if (!newSectionLabel.trim() || !cours) return;
    const id = 'sec-' + Date.now();
    saveCours({ ...cours, sections: [...cours.sections, { id, label:newSectionLabel.trim(), icon:'📌', contenu:'', placeholder:'Contenu de la section...' }] });
    setNewSectionLabel('');
    setShowNewSection(false);
  };

  const deleteSection = (secId) => {
    if (!cours) return;
    saveCours({ ...cours, sections: cours.sections.filter(s => s.id !== secId) });
  };

  // Drag & drop sections
  const onDragStart = (i) => setDragIdx(i);
  const onDragOver  = (e, i) => { e.preventDefault(); setDragOver(i); };
  const onDrop      = (i) => {
    if (dragIdx === null || dragIdx === i || !cours) return;
    const secs = [...cours.sections];
    const [moved] = secs.splice(dragIdx, 1);
    secs.splice(i, 0, moved);
    saveCours({ ...cours, sections: secs });
    setDragIdx(null); setDragOver(null);
  };

  const sequencesClasse = cours?.classeId ? (progs[cours.classeId]?.rows || []) : [];
  const classeNom = classes.find(c => c.id === cours?.classeId)?.name || '';
  const seqNom    = sequencesClasse.find(r => r.id === cours?.sequenceId)?.[Object.keys(sequencesClasse[0]||{})[1]] || '';

  if (!cpData) return <ModulePlaceholder icon="✏️" title="Créer un cours" sub="Ouvrez d'abord un fichier ClassPro." />;

  return (
    <>
      <div className="page-hd">
        <div>
          <div className="phd-badge">✏️ Préparer</div>
          <div className="phd-title">{cours ? cours.titre : 'Créer un cours'}</div>
          <div className="phd-sub">
            {cours
              ? [classeNom, seqNom, cours.date ? new Date(cours.date+'T12:00').toLocaleDateString('fr-FR',{day:'numeric',month:'long',year:'numeric'}) : ''].filter(Boolean).join(' · ')
              : `${coursList.length} cours enregistré(s)`
            }
          </div>
        </div>
        <div className="phd-actions">
          {cours && (
            <>
              <div style={{ display:'flex', background:'rgba(255,255,255,.12)', border:'1px solid rgba(255,255,255,.2)', borderRadius:'var(--r-s)', overflow:'hidden' }}>
                {[{id:'edit',label:'✏️ Édition'},{id:'apercu',label:'👁 Aperçu'}].map(v => (
                  <button key={v.id} onClick={() => setVue(v.id)}
                    style={{ padding:'.38rem .875rem', border:'none', background: vue===v.id ? 'rgba(255,255,255,.25)' : 'transparent', color:'#fff', cursor:'pointer', fontFamily:'Roboto,sans-serif', fontSize:'.78rem', fontWeight: vue===v.id ? 700 : 400, transition:'all .15s' }}>
                    {v.label}
                  </button>
                ))}
              </div>
              <button className="btn btn-ghost" style={{ background:'rgba(255,255,255,.15)', border:'1px solid rgba(255,255,255,.3)', color:'#fff', fontSize:'.75rem' }}
                onClick={() => deleteCours(cours.id)}>
                🗑️ Supprimer
              </button>
            </>
          )}
          <button className="btn btn-primary" onClick={() => setShowNewCours(true)}>+ Nouveau cours</button>
        </div>
      </div>

      <div style={{ display:'flex', flex:1, overflow:'hidden', minHeight:0 }}>

        {/* Sidebar cours */}
        <div style={{ width:220, flexShrink:0, borderRight:'1px solid var(--border)', background:'var(--surface2)', overflowY:'auto', display:'flex', flexDirection:'column' }}>
          <div style={{ padding:'.5rem .65rem', fontSize:'.65rem', fontWeight:700, color:'var(--text3)', textTransform:'uppercase', letterSpacing:'.08em', borderBottom:'1px solid var(--border)' }}>
            Mes cours ({coursList.length})
          </div>
          {coursList.length === 0 && (
            <div style={{ padding:'1.5rem .875rem', color:'var(--text3)', fontSize:'.8rem', fontStyle:'italic' }}>
              Aucun cours — cliquez sur + Nouveau cours
            </div>
          )}
          {coursList.map(c => {
            const cls = classes.find(cl => cl.id === c.classeId);
            return (
              <button key={c.id} onClick={() => { setSelCours(c.id); setVue('edit'); }}
                style={{ display:'flex', flexDirection:'column', gap:'.15rem', width:'100%', padding:'.6rem .875rem', border:'none', borderLeft:`3px solid ${selCours===c.id ? 'var(--accent)' : 'transparent'}`, borderBottom:'1px solid var(--border)', background: selCours===c.id ? 'var(--surface)' : 'transparent', cursor:'pointer', fontFamily:'Roboto,sans-serif', textAlign:'left', transition:'all .13s' }}>
                <div style={{ fontWeight:700, fontSize:'.83rem', color: selCours===c.id ? 'var(--accent)' : 'var(--text)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{c.titre}</div>
                <div style={{ fontSize:'.68rem', color:'var(--text3)' }}>
                  {[cls?.name, c.date ? new Date(c.date+'T12:00').toLocaleDateString('fr-FR',{day:'numeric',month:'short'}) : ''].filter(Boolean).join(' · ')}
                </div>
              </button>
            );
          })}
        </div>

        {/* Zone principale */}
        <div style={{ flex:1, overflowY:'auto' }}>
          {!cours ? (
            <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', height:'100%', gap:'1rem', color:'var(--text3)' }}>
              <div style={{ fontSize:'3rem', opacity:.12 }}>✏️</div>
              <div style={{ fontWeight:600, color:'var(--text2)' }}>Sélectionnez ou créez un cours</div>
            </div>
          ) : vue === 'edit' ? (
            <div style={{ padding:'1.25rem', display:'flex', flexDirection:'column', gap:'1.25rem', maxWidth:820 }}>

              {/* Métadonnées */}
              <div className="card">
                <div className="card-hd"><div className="card-title">📋 Informations du cours</div></div>
                <div className="card-body" style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'.75rem' }}>
                  <div style={{ gridColumn:'1/-1', display:'flex', flexDirection:'column', gap:'.25rem' }}>
                    <label style={{ fontSize:'.7rem', fontWeight:700, color:'var(--text2)', textTransform:'uppercase', letterSpacing:'.07em' }}>Titre *</label>
                    <input value={cours.titre} onChange={e => updateMeta('titre', e.target.value)}
                      style={{ padding:'.55rem .875rem', border:'1.5px solid var(--border)', borderRadius:'var(--r-s)', background:'var(--surface2)', color:'var(--text)', fontFamily:'Roboto,sans-serif', fontSize:'.9rem', fontWeight:600, outline:'none' }}
                      onFocus={e => e.target.style.borderColor='var(--accent)'} onBlur={e => e.target.style.borderColor='var(--border)'} />
                  </div>
                  <div style={{ display:'flex', flexDirection:'column', gap:'.25rem' }}>
                    <label style={{ fontSize:'.7rem', fontWeight:700, color:'var(--text2)', textTransform:'uppercase', letterSpacing:'.07em' }}>Date de la séance</label>
                    <input type="date" value={cours.date||''} onChange={e => updateMeta('date', e.target.value)}
                      style={{ padding:'.55rem .875rem', border:'1.5px solid var(--border)', borderRadius:'var(--r-s)', background:'var(--surface2)', color:'var(--text)', fontFamily:'Roboto,sans-serif', fontSize:'.85rem', outline:'none' }}
                      onFocus={e => e.target.style.borderColor='var(--accent)'} onBlur={e => e.target.style.borderColor='var(--border)'} />
                  </div>
                  <div style={{ display:'flex', flexDirection:'column', gap:'.25rem' }}>
                    <label style={{ fontSize:'.7rem', fontWeight:700, color:'var(--text2)', textTransform:'uppercase', letterSpacing:'.07em' }}>Classe</label>
                    <select value={cours.classeId||''} onChange={e => updateMeta('classeId', e.target.value)}
                      style={{ padding:'.55rem .875rem', border:'1.5px solid var(--border)', borderRadius:'var(--r-s)', background:'var(--surface2)', color:'var(--text)', fontFamily:'Roboto,sans-serif', fontSize:'.85rem', outline:'none' }}>
                      <option value="">— Aucune classe —</option>
                      {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </div>
                  {cours.classeId && progs[cours.classeId]?.rows?.length > 0 && (
                    <div style={{ display:'flex', flexDirection:'column', gap:'.25rem' }}>
                      <label style={{ fontSize:'.7rem', fontWeight:700, color:'var(--text2)', textTransform:'uppercase', letterSpacing:'.07em' }}>Séquence de progression</label>
                      <select value={cours.sequenceId||''} onChange={e => updateMeta('sequenceId', e.target.value)}
                        style={{ padding:'.55rem .875rem', border:'1.5px solid var(--border)', borderRadius:'var(--r-s)', background:'var(--surface2)', color:'var(--text)', fontFamily:'Roboto,sans-serif', fontSize:'.85rem', outline:'none' }}>
                        <option value="">— Aucune séquence —</option>
                        {(progs[cours.classeId]?.rows||[]).map((r,i) => {
                          const cols = progs[cours.classeId]?.cols || [];
                          const titreCol = cols[1];
                          const label = titreCol ? (r[titreCol.id] || `Séquence ${i+1}`) : `Séquence ${i+1}`;
                          return <option key={r.id||i} value={r.id||i}>{label}</option>;
                        })}
                      </select>
                    </div>
                  )}
                </div>
              </div>

              {/* Sections */}
              {cours.sections.map((sec, si) => (
                <div key={sec.id}
                  draggable onDragStart={() => onDragStart(si)} onDragOver={e => onDragOver(e, si)} onDrop={() => onDrop(si)} onDragEnd={() => { setDragIdx(null); setDragOver(null); }}
                  style={{ opacity: dragIdx===si ? .5 : 1, border: dragOver===si ? '2px dashed var(--accent)' : '1px solid var(--border)', borderRadius:'var(--r)', background:'var(--surface)', transition:'opacity .15s' }}>
                  <div style={{ display:'flex', alignItems:'center', gap:'.5rem', padding:'.65rem 1rem', borderBottom:'1px solid var(--border)', cursor:'grab' }}>
                    <span style={{ opacity:.4, fontSize:'.8rem' }}>⠿</span>
                    <span style={{ fontSize:'.95rem' }}>{sec.icon}</span>
                    <div style={{ fontWeight:700, fontSize:'.88rem', flex:1 }}>{sec.label}</div>
                    <button onClick={() => deleteSection(sec.id)}
                      style={{ background:'none', border:'none', cursor:'pointer', color:'var(--text3)', fontSize:'.75rem', padding:'.2rem .35rem', borderRadius:4, opacity:.5 }}
                      onMouseEnter={e => { e.currentTarget.style.opacity='1'; e.currentTarget.style.color='var(--danger)'; }}
                      onMouseLeave={e => { e.currentTarget.style.opacity='.5'; e.currentTarget.style.color='var(--text3)'; }}
                      title="Supprimer cette section">×</button>
                  </div>
                  <RichTextarea
                    value={sec.contenu}
                    onChange={v => updateSection(sec.id, v)}
                    placeholder={sec.placeholder || 'Contenu...'}
                  />
                </div>
              ))}

              {/* Section Documents spéciale */}
              <SectionDocuments
                attachments={cours.attachments || []}
                onChange={atts => saveCours({ ...cours, attachments: atts })}
              />

              {/* Ajouter section */}
              {showNewSection ? (
                <div style={{ display:'flex', gap:'.5rem', padding:'1rem', border:'2px dashed var(--border)', borderRadius:'var(--r)', background:'var(--surface2)' }}>
                  <input autoFocus value={newSectionLabel} onChange={e => setNewSectionLabel(e.target.value)}
                    onKeyDown={e => { if(e.key==='Enter') addSection(); if(e.key==='Escape') setShowNewSection(false); }}
                    placeholder="Nom de la section..."
                    style={{ flex:1, padding:'.5rem .75rem', border:'1.5px solid var(--accent)', borderRadius:'var(--r-s)', background:'var(--surface)', color:'var(--text)', fontFamily:'Roboto,sans-serif', fontSize:'.85rem', outline:'none' }} />
                  <button onClick={addSection} disabled={!newSectionLabel.trim()} className="btn btn-primary">Ajouter</button>
                  <button onClick={() => setShowNewSection(false)} className="btn">Annuler</button>
                </div>
              ) : (
                <button onClick={() => setShowNewSection(true)}
                  style={{ display:'flex', alignItems:'center', gap:'.5rem', justifyContent:'center', padding:'.75rem', border:'2px dashed var(--border)', borderRadius:'var(--r)', background:'transparent', cursor:'pointer', color:'var(--text3)', fontFamily:'Roboto,sans-serif', fontSize:'.83rem', transition:'all .15s', width:'100%' }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor='var(--accent)'; e.currentTarget.style.color='var(--accent)'; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor='var(--border)'; e.currentTarget.style.color='var(--text3)'; }}>
                  + Ajouter une section personnalisée
                </button>
              )}
            </div>

          ) : (
            /* ── VUE APERÇU ── */
            <div style={{ padding:'2rem 3rem', maxWidth:800, fontFamily:'Roboto,sans-serif' }}>
              {/* En-tête aperçu */}
              <div style={{ borderBottom:'3px solid var(--accent)', paddingBottom:'1rem', marginBottom:'1.5rem' }}>
                <div style={{ fontSize:'.72rem', fontWeight:700, color:'var(--accent)', textTransform:'uppercase', letterSpacing:'.1em', marginBottom:'.4rem' }}>
                  {[classeNom, seqNom].filter(Boolean).join(' · ')}
                </div>
                <h1 style={{ margin:0, fontFamily:'Roboto Slab,serif', fontSize:'1.6rem', fontWeight:800, color:'var(--text)', lineHeight:1.2 }}>{cours.titre}</h1>
                {cours.date && (
                  <div style={{ marginTop:'.5rem', fontSize:'.85rem', color:'var(--text2)' }}>
                    {new Date(cours.date+'T12:00').toLocaleDateString('fr-FR',{weekday:'long',day:'numeric',month:'long',year:'numeric'})}
                  </div>
                )}
              </div>

              {/* Sections */}
              {cours.sections.map(sec => sec.contenu.trim() && (
                <div key={sec.id} style={{ marginBottom:'1.75rem' }}>
                  <div style={{ display:'flex', alignItems:'center', gap:'.5rem', marginBottom:'.65rem', paddingBottom:'.4rem', borderBottom:'1px solid var(--border)' }}>
                    <span>{sec.icon}</span>
                    <h2 style={{ margin:0, fontSize:'1rem', fontWeight:800, color:'var(--text)', fontFamily:'Roboto Slab,serif' }}>{sec.label}</h2>
                  </div>
                  <div style={{ fontSize:'.88rem', color:'var(--text)', lineHeight:1.75, paddingLeft:'.25rem' }}
                    dangerouslySetInnerHTML={{ __html: sec.contenu }} />
                </div>
              ))}

              {(cours.attachments||[]).length > 0 && (
                <div style={{ marginBottom:'1.75rem' }}>
                  <div style={{ display:'flex', alignItems:'center', gap:'.5rem', marginBottom:'.65rem', paddingBottom:'.4rem', borderBottom:'1px solid var(--border)' }}>
                    <span>📎</span>
                    <h2 style={{ margin:0, fontSize:'1rem', fontWeight:800, color:'var(--text)', fontFamily:'Roboto Slab,serif' }}>Documents / Supports</h2>
                  </div>
                  <div style={{ display:'flex', flexDirection:'column', gap:'1rem' }}>
                    {cours.attachments.map(att => (
                      <div key={att.id}>
                        {att.type === 'link' ? (
                          <div style={{ display:'flex', alignItems:'center', gap:'.65rem' }}>
                            <span>🔗</span>
                            <a href={att.url} target="_blank" rel="noreferrer"
                              style={{ fontSize:'.85rem', color:'var(--accent)', textDecoration:'underline' }}>
                              {att.name}
                            </a>
                            <span style={{ fontSize:'.72rem', color:'var(--text3)' }}>{att.url}</span>
                          </div>
                        ) : att.mime?.startsWith('image/') && att.data ? (
                          <div>
                            <div style={{ fontSize:'.78rem', fontWeight:600, color:'var(--text2)', marginBottom:'.4rem' }}>🖼️ {att.name}</div>
                            <img src={att.data} alt={att.name}
                              style={{ maxWidth:'100%', maxHeight:400, borderRadius:'var(--r-s)', border:'1px solid var(--border)', display:'block', objectFit:'contain' }} />
                          </div>
                        ) : (
                          <div style={{ display:'flex', alignItems:'center', gap:'.65rem', padding:'.5rem .75rem', background:'var(--surface2)', border:'1px solid var(--border)', borderRadius:'var(--r-s)' }}>
                            <span>📄</span>
                            <span style={{ fontSize:'.85rem', fontWeight:600 }}>{att.name}</span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {cours.sections.every(s => !s.contenu.trim()) && !(cours.attachments||[]).length && (
                <div style={{ textAlign:'center', color:'var(--text3)', padding:'3rem', fontStyle:'italic' }}>
                  Aucun contenu — repassez en mode Édition pour remplir vos sections.
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Modale nouveau cours */}
      {showNewCours && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,.5)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:9999, padding:'1rem' }}
          onClick={e => e.target===e.currentTarget && setShowNewCours(false)}>
          <div style={{ background:'var(--surface)', borderRadius:'var(--r)', padding:'1.5rem', width:460, boxShadow:'var(--shadow-l)', display:'flex', flexDirection:'column', gap:'1rem' }}>
            <div style={{ fontFamily:'Roboto Slab,serif', fontWeight:800, fontSize:'1.1rem' }}>✏️ Nouveau cours</div>

            <div style={{ display:'flex', flexDirection:'column', gap:'.25rem' }}>
              <label style={{ fontSize:'.7rem', fontWeight:700, color:'var(--text2)', textTransform:'uppercase', letterSpacing:'.07em' }}>Titre *</label>
              <input autoFocus value={newCoursForm.titre} onChange={e => setNewCoursForm(f => ({...f, titre:e.target.value}))}
                onKeyDown={e => e.key==='Enter' && createCours()}
                placeholder="Ex : Le présent de l'indicatif, Chapitre 3..."
                style={{ padding:'.6rem .875rem', border:'1.5px solid var(--accent)', borderRadius:'var(--r-s)', background:'var(--surface2)', color:'var(--text)', fontFamily:'Roboto,sans-serif', fontSize:'.88rem', outline:'none' }} />
            </div>

            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'.75rem' }}>
              <div style={{ display:'flex', flexDirection:'column', gap:'.25rem' }}>
                <label style={{ fontSize:'.7rem', fontWeight:700, color:'var(--text2)', textTransform:'uppercase', letterSpacing:'.07em' }}>Date</label>
                <input type="date" value={newCoursForm.date} onChange={e => setNewCoursForm(f => ({...f, date:e.target.value}))}
                  style={{ padding:'.55rem .75rem', border:'1.5px solid var(--border)', borderRadius:'var(--r-s)', background:'var(--surface2)', color:'var(--text)', fontFamily:'Roboto,sans-serif', fontSize:'.85rem', outline:'none' }} />
              </div>
              <div style={{ display:'flex', flexDirection:'column', gap:'.25rem' }}>
                <label style={{ fontSize:'.7rem', fontWeight:700, color:'var(--text2)', textTransform:'uppercase', letterSpacing:'.07em' }}>Classe</label>
                <select value={newCoursForm.classeId} onChange={e => setNewCoursForm(f => ({...f, classeId:e.target.value, sequenceId:''}))}
                  style={{ padding:'.55rem .75rem', border:'1.5px solid var(--border)', borderRadius:'var(--r-s)', background:'var(--surface2)', color:'var(--text)', fontFamily:'Roboto,sans-serif', fontSize:'.85rem', outline:'none' }}>
                  <option value="">— Aucune —</option>
                  {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
            </div>

            {newCoursForm.classeId && progs[newCoursForm.classeId]?.rows?.length > 0 && (
              <div style={{ display:'flex', flexDirection:'column', gap:'.25rem' }}>
                <label style={{ fontSize:'.7rem', fontWeight:700, color:'var(--text2)', textTransform:'uppercase', letterSpacing:'.07em' }}>Séquence liée</label>
                <select value={newCoursForm.sequenceId} onChange={e => setNewCoursForm(f => ({...f, sequenceId:e.target.value}))}
                  style={{ padding:'.55rem .875rem', border:'1.5px solid var(--border)', borderRadius:'var(--r-s)', background:'var(--surface2)', color:'var(--text)', fontFamily:'Roboto,sans-serif', fontSize:'.85rem', outline:'none' }}>
                  <option value="">— Aucune séquence —</option>
                  {(progs[newCoursForm.classeId]?.rows||[]).map((r,i) => {
                    const cols = progs[newCoursForm.classeId]?.cols || [];
                    const titreCol = cols[1];
                    const label = titreCol ? (r[titreCol.id] || `Séquence ${i+1}`) : `Séquence ${i+1}`;
                    return <option key={r.id||i} value={r.id||i}>{label}</option>;
                  })}
                </select>
              </div>
            )}

            <div style={{ display:'flex', gap:'.5rem', justifyContent:'flex-end', paddingTop:'.25rem' }}>
              <button className="btn" onClick={() => setShowNewCours(false)}>Annuler</button>
              <button className="btn btn-primary" disabled={!newCoursForm.titre.trim()} onClick={createCours}>
                Créer le cours
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
