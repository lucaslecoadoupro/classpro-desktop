// ── MODULE PLAN DE CLASSE ─────────────────────────────────────────────────────
// Adapté depuis ClassPro v0.6.6 — remplace localStorage par cpData/onDataChange

const GRID = 40;

const PALETTE_ITEMS = [
  { section: 'Mobilier fixe', items: [
    { type: 'tableau',     label: 'Tableau',           sub: 'Face aux élèves',       defaultW: 7, defaultH: 1, cls: 'pdc-elem-tableau',    isTable: false },
    { type: 'bureau-prof', label: 'Bureau enseignant', sub: 'Bureau du professeur',  defaultW: 3, defaultH: 2, cls: 'pdc-elem-bureau-prof', isTable: false },
    { type: 'paillasse',   label: 'Paillasse',         sub: 'Paillasse / meuble',    defaultW: 5, defaultH: 2, cls: 'pdc-elem-paillasse',  isTable: false },
    { type: 'passage',     label: 'Couloir',           sub: 'Zone de passage libre', defaultW: 1, defaultH: 4, cls: 'pdc-elem-passage',    isTable: false },
  ]},
  { section: 'Tables élèves', items: [
    { type: 'table-solo', label: 'Table individuelle', sub: '1 élève',              defaultW: 2, defaultH: 2, cls: 'pdc-elem-table', isTable: true, seats: 1 },
    { type: 'table-duo',  label: 'Table double',       sub: '2 élèves côte à côte', defaultW: 4, defaultH: 2, cls: 'pdc-elem-table', isTable: true, seats: 2 },
    { type: 'ilot-4',     label: 'Îlot de 4',          sub: '4 élèves face à face', defaultW: 4, defaultH: 4, cls: 'pdc-elem-table', isTable: true, seats: 4 },
    { type: 'ilot-6',     label: 'Îlot de 6',          sub: '6 élèves en groupe',   defaultW: 6, defaultH: 4, cls: 'pdc-elem-table', isTable: true, seats: 6 },
  ]},
];

function pdcInitiales(nom) {
  if (!nom) return '?';
  const p = nom.trim().split(/\s+/);
  return (p[0][0] + (p[1] ? p[1][0] : '')).toUpperCase();
}

function PalPreview({ type }) {
  const S = { borderRadius: 3, background: 'var(--surface)', border: '1.5px solid var(--border)' };
  if (type === 'tableau')     return <div style={{ width: 38, height: 12, background: '#1e3a8a', borderRadius: 4, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><span style={{ fontSize: '.38rem', fontWeight: 800, color: '#fff', letterSpacing: '.08em' }}>TABLEAU</span></div>;
  if (type === 'bureau-prof') return <div style={{ width: 26, height: 22, background: 'rgba(124,58,237,.12)', border: '1.5px solid rgba(124,58,237,.45)', borderRadius: 4 }} />;
  if (type === 'paillasse')   return <div style={{ width: 38, height: 14, background: 'rgba(180,83,9,.1)', border: '1.5px solid rgba(180,83,9,.4)', borderRadius: 4 }} />;
  if (type === 'passage')     return <div style={{ width: 14, height: 28, background: 'repeating-linear-gradient(45deg,rgba(148,163,184,.12),rgba(148,163,184,.12) 3px,transparent 3px,transparent 6px)', border: '1.5px dashed rgba(148,163,184,.5)', borderRadius: 4 }} />;
  if (type === 'table-solo')  return <div style={{ ...S, width: 22, height: 22 }} />;
  if (type === 'table-duo')   return <div style={{ display: 'flex', gap: 2 }}>{[0, 1].map(i => <div key={i} style={{ ...S, width: 16, height: 18 }} />)}</div>;
  if (type === 'ilot-4')      return <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>{[0,1,2,3].map(i => <div key={i} style={{ ...S, width: 12, height: 12 }} />)}</div>;
  if (type === 'ilot-6')      return <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 2 }}>{[0,1,2,3,4,5].map(i => <div key={i} style={{ ...S, width: 11, height: 11 }} />)}</div>;
  return null;
}

function TableSeats({ item, eleves, flags, selEleve, onSeatClick, mode }) {
  const def = PALETTE_ITEMS.flatMap(s => s.items).find(i => i.type === item.type);
  if (!def?.seats) return null;
  const seatLayouts = {
    'table-solo': [[0]],
    'table-duo':  [[0, 1]],
    'ilot-4':     [[0, 1], [2, 3]],
    'ilot-6':     [[0, 1, 2], [3, 4, 5]],
  };
  const layout = seatLayouts[item.type] || [[0]];
  const seatEleves = item.seatEleves || {};
  return (
    <div style={{ display: 'flex', flexDirection: 'column', width: '100%', height: '100%', padding: 5, gap: 3, boxSizing: 'border-box' }}>
      {layout.map((row, ri) => (
        <div key={ri} style={{ display: 'flex', gap: 3, flex: 1 }}>
          {row.map(i => {
            const eleveId = seatEleves[i];
            const eleve = eleveId ? eleves?.find(e => e.id === eleveId) : null;
            const flag = eleve && flags?.[eleve.id];
            const isSelTarget = selEleve && !eleve;
            return (
              <div key={i}
                onClick={mode === 'placement' ? e => { e.stopPropagation(); onSeatClick(item.id, i); } : undefined}
                style={{
                  flex: 1, borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  minWidth: 0, overflow: 'hidden', transition: 'all .13s', position: 'relative',
                  background: eleve
                    ? (flag === 'eviter' ? 'rgba(220,38,38,.1)' : flag === 'rapprocher' ? 'rgba(15,155,110,.1)' : 'rgba(59,91,219,.1)')
                    : (isSelTarget ? 'rgba(59,91,219,.06)' : 'rgba(0,0,0,.03)'),
                  border: eleve
                    ? `2px solid ${flag === 'eviter' ? 'var(--danger)' : flag === 'rapprocher' ? 'var(--success)' : 'rgba(59,91,219,.28)'}`
                    : `1.5px dashed ${isSelTarget ? 'var(--accent)' : 'rgba(0,0,0,.13)'}`,
                  cursor: mode === 'placement' ? 'pointer' : 'default',
                }}>
                {eleve ? (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1, padding: '2px 3px' }}>
                    <div style={{ width: 18, height: 18, borderRadius: '50%', background: flag === 'eviter' ? 'var(--danger)' : flag === 'rapprocher' ? 'var(--success)' : 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <span style={{ fontSize: '.42rem', fontWeight: 800, color: '#fff', lineHeight: 1 }}>{pdcInitiales(eleve.nom)}</span>
                    </div>
                    <span style={{ fontSize: '.46rem', fontWeight: 700, color: 'var(--text)', lineHeight: 1, textAlign: 'center', wordBreak: 'break-word', maxWidth: '100%' }}>{eleve.nom.split(' ').pop()}</span>
                  </div>
                ) : (
                  <span style={{ fontSize: '.65rem', color: 'var(--text3)', opacity: isSelTarget ? .7 : .35 }}>+</span>
                )}
                {flag && <span style={{ position: 'absolute', top: 1, right: 2, fontSize: '.45rem' }}>{flag === 'eviter' ? '⛔' : '✅'}</span>}
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}

function GridBg({ w, h, cell }) {
  const c = cell || 40;
  return (
    <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: .5, pointerEvents: 'none' }} xmlns="http://www.w3.org/2000/svg">
      <defs>
        <pattern id="sg" width={c} height={c} patternUnits="userSpaceOnUse">
          <path d={`M ${c} 0 L 0 0 0 ${c}`} fill="none" stroke="var(--border)" strokeWidth="0.6" />
        </pattern>
        <pattern id="lg" width={c * 5} height={c * 5} patternUnits="userSpaceOnUse">
          <rect width={c * 5} height={c * 5} fill="url(#sg)" />
          <path d={`M ${c * 5} 0 L 0 0 0 ${c * 5}`} fill="none" stroke="var(--border)" strokeWidth="1.2" />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#lg)" />
    </svg>
  );
}

// ── COMPOSANT PRINCIPAL ───────────────────────────────────────────────────────
function ModulePlanClasse({ cpData, onDataChange }) {
  const classes = cpData?.classes || [];

  // plans : { [classId]: { elements: [], flags: {}, nomSalle: '' } }
  const [plans, setPlans] = useState(() => {
    const p = cpData?.plans;
    return (p && typeof p === 'object' && !Array.isArray(p)) ? p : {};
  });

  const [selCls, setSelCls]         = useState(null);
  const [mode, setMode]             = useState('layout');
  const [zoom, setZoom]             = useState(100);
  const [selectedId, setSelectedId] = useState(null);
  const [marqueMode, setMarqueMode] = useState(null);
  const [selEleve, setSelEleve]     = useState(null);

  const dragRef  = React.useRef(null);
  const canvasRef = React.useRef(null);

  // Sync vers cpData à chaque changement de plans
  useEffect(() => {
    onDataChange && onDataChange({ plans });
  }, [plans]);

  // Si cpData.plans change de l'extérieur (import JSON), resync
  useEffect(() => {
    const p = cpData?.plans;
    if (p && typeof p === 'object' && !Array.isArray(p)) setPlans(p);
  }, [cpData?.plans]);

  const cls      = classes.find(c => c.id === selCls);
  const plan     = selCls ? (plans[selCls] || { elements: [], flags: {}, nomSalle: '' }) : { elements: [], flags: {}, nomSalle: '' };
  const elements = plan.elements || [];
  const flags    = plan.flags    || {};
  const nomSalle = plan.nomSalle || '';

  const updatePlan     = np => setPlans(p => ({ ...p, [selCls]: np }));
  const updateElements = ne => updatePlan({ ...plan, elements: ne });

  const scale = zoom / 100;
  const CELL  = Math.round(GRID * scale);

  const zoomIn    = () => setZoom(z => Math.min(200, z + 10));
  const zoomOut   = () => setZoom(z => Math.max(40, z - 10));
  const zoomReset = () => setZoom(100);

  const onPaletteDragStart = (e, pi) => {
    dragRef.current = { fromPalette: true, palItem: pi };
    e.dataTransfer.effectAllowed = 'copy';
    e.dataTransfer.setData('text/plain', 'palette');
  };

  const clientToGrid = (clientX, clientY) => {
    const rect = canvasRef.current.getBoundingClientRect();
    return { gx: (clientX - rect.left) / CELL, gy: (clientY - rect.top) / CELL };
  };

  const onElemMouseDown = (e, elem) => {
    if (mode === 'placement') return;
    if (e.target.closest('.pdc-inspector')) return; // FIX: bloquer si clic dans l'inspector
    e.stopPropagation();
    setSelectedId(elem.id);

    // FIX: si l'élément est déjà sélectionné et qu'on reclique sans bouger, ne pas démarrer de drag
    const alreadySelected = selectedId === elem.id;
    const startX = e.clientX, startY = e.clientY;
    const startElemX = elem.x, startElemY = elem.y;
    let dragging = false;

    const onMove = ev => {
      const dpx = ev.clientX - startX, dpy = ev.clientY - startY;
      if (!dragging && Math.abs(dpx) < 4 && Math.abs(dpy) < 4) return;
      if (!dragging) dragging = true;
      const nx = Math.max(0, startElemX + Math.round(dpx / CELL));
      const ny = Math.max(0, startElemY + Math.round(dpy / CELL));
      setPlans(p => {
        const cp = p[selCls] || { elements: [], flags: {} };
        return { ...p, [selCls]: { ...cp, elements: cp.elements.map(el => el.id === elem.id ? { ...el, x: nx, y: ny } : el) } };
      });
    };
    const onUp = () => {
      dragRef.current = null;
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  };

  const onCanvasDrop = e => {
    e.preventDefault();
    if (!dragRef.current?.fromPalette || !selCls) return;
    const pi = dragRef.current.palItem;
    const { gx, gy } = clientToGrid(e.clientX, e.clientY);
    const nx = Math.max(0, Math.round(gx - pi.defaultW / 2));
    const ny = Math.max(0, Math.round(gy - pi.defaultH / 2));
    const ne = { id: 'el' + Date.now() + Math.random().toString(36).slice(2, 5), type: pi.type, x: nx, y: ny, w: pi.defaultW, h: pi.defaultH, seatEleves: {} };
    const newElements = [...elements, ne];
    updateElements(newElements);
    setSelectedId(ne.id);
    dragRef.current = null;
    if (newElements.length === 1) cpdUnlockBadge('first_plan');
  };

  const onResizeMouseDown = (e, elem, dir) => {
    e.preventDefault(); e.stopPropagation();
    const startClientX = e.clientX, startClientY = e.clientY;
    const startW = elem.w, startH = elem.h;
    const onMove = ev => {
      const dw = Math.round((ev.clientX - startClientX) / CELL);
      const dh = Math.round((ev.clientY - startClientY) / CELL);
      setPlans(p => {
        const cp = p[selCls] || { elements: [], flags: {} };
        return { ...p, [selCls]: { ...cp, elements: cp.elements.map(el => {
          if (el.id !== elem.id) return el;
          const r = { ...el };
          if (dir === 'e' || dir === 'se') r.w = Math.max(1, startW + dw);
          if (dir === 's' || dir === 'se') r.h = Math.max(1, startH + dh);
          return r;
        })}};
      });
    };
    const onUp = () => { window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp); };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  };

  const deleteElem    = id => { updateElements(elements.filter(el => el.id !== id)); setSelectedId(null); };
  const duplicateElem = id => {
    const o = elements.find(el => el.id === id); if (!o) return;
    const c = { ...o, id: 'el' + Date.now() + Math.random().toString(36).slice(2, 5), x: o.x + 1, y: o.y + 1, seatEleves: {} };
    updateElements([...elements, c]); setSelectedId(c.id);
  };

  const onSeatClick = (elemId, seatIdx) => {
    if (mode !== 'placement') return;
    if (marqueMode) {
      const elem = elements.find(e => e.id === elemId);
      const eleveId = elem?.seatEleves?.[seatIdx]; if (!eleveId) return;
      const nf = { ...flags }; nf[eleveId] = flags[eleveId] === marqueMode ? null : marqueMode;
      updatePlan({ ...plan, flags: nf }); return;
    }
    if (selEleve) {
      const ne = elements.map(el => { const se = { ...el.seatEleves }; Object.keys(se).forEach(k => { if (se[k] === selEleve) delete se[k]; }); return { ...el, seatEleves: se }; });
      const t = ne.find(e => e.id === elemId); if (!t) return;
      t.seatEleves[seatIdx] = selEleve;
      updateElements(ne); setSelEleve(null);
    } else {
      const elem = elements.find(e => e.id === elemId);
      const eleveId = elem?.seatEleves?.[seatIdx];
      if (eleveId) setSelEleve(eleveId);
    }
  };

  const removeEleveFromAll = eleveId => {
    updateElements(elements.map(el => { const se = { ...el.seatEleves }; Object.keys(se).forEach(k => { if (se[k] === eleveId) delete se[k]; }); return { ...el, seatEleves: se }; }));
    setSelEleve(null);
  };

  const tirage = () => {
    if (!cls) return;
    const seats = [];
    elements.forEach(elem => {
      const def = PALETTE_ITEMS.flatMap(s => s.items).find(i => i.type === elem.type);
      if (def?.isTable && def.seats) for (let i = 0; i < def.seats; i++) seats.push({ elemId: elem.id, seat: i });
    });
    const shuffled = [...cls.eleves].sort(() => Math.random() - .5);
    const ss = [...seats].sort(() => Math.random() - .5);
    const ne = elements.map(el => ({ ...el, seatEleves: {} }));
    shuffled.slice(0, ss.length).forEach((e, i) => {
      const { elemId, seat } = ss[i];
      const el = ne.find(x => x.id === elemId); if (el) el.seatEleves[seat] = e.id;
    });
    updateElements(ne); setSelEleve(null);
  };

  const totalSeats    = elements.reduce((a, el) => { const def = PALETTE_ITEMS.flatMap(s => s.items).find(i => i.type === el.type); return a + (def?.seats || 0); }, 0);
  const occupiedSeats = elements.reduce((a, el) => a + Object.values(el.seatEleves || {}).filter(Boolean).length, 0);
  const placedIds     = new Set();
  elements.forEach(el => Object.values(el.seatEleves || {}).forEach(id => { if (id) placedIds.add(id); }));
  const unplaced = cls ? cls.eleves.filter(e => !placedIds.has(e.id)) : [];

  const canvasW = elements.length ? (Math.max(...elements.map(el => el.x + el.w)) + 3) * CELL : 14 * CELL;
  const canvasH = elements.length ? (Math.max(...elements.map(el => el.y + el.h)) + 3) * CELL : 10 * CELL;

  const renderElem = elem => {
    const def = PALETTE_ITEMS.flatMap(s => s.items).find(i => i.type === elem.type); if (!def) return null;
    const isSel = selectedId === elem.id && mode === 'layout';
    const px = elem.x * CELL, py = elem.y * CELL;
    const pw = elem.w * CELL, ph = elem.h * CELL;
    const inner = () => {
      if (def.isTable)           return <TableSeats item={elem} eleves={cls?.eleves} flags={flags} selEleve={selEleve} onSeatClick={onSeatClick} mode={mode} />;
      if (elem.type === 'tableau')     return <span style={{ fontSize: `${Math.max(9, Math.round(CELL * 0.45))}px`, fontWeight: 800, letterSpacing: '.12em', textShadow: '0 1px 0 rgba(0,0,0,.2)' }}>TABLEAU</span>;
      if (elem.type === 'bureau-prof') return <div style={{ textAlign: 'center', lineHeight: 1.3 }}><div style={{ fontSize: `${Math.max(10, Math.round(CELL * 0.5))}px`, marginBottom: 2 }}>👨‍🏫</div><span style={{ fontSize: `${Math.max(8, Math.round(CELL * 0.35))}px`, fontWeight: 700 }}>Bureau<br />prof</span></div>;
      if (elem.type === 'paillasse')   return <span style={{ fontSize: `${Math.max(8, Math.round(CELL * 0.38))}px`, fontWeight: 700, letterSpacing: '.04em' }}>Paillasse</span>;
      return null;
    };
    return (
      <div key={elem.id}
        className={`pdc-elem ${def.cls}${mode === 'layout' ? ' layout-mode' : ''}${isSel ? ' selected-elem' : ''}`}
        style={{ left: px, top: py, width: pw, height: ph, cursor: mode === 'layout' ? 'move' : 'default', zIndex: isSel ? 20 : elem.type === 'passage' ? 0 : 1 }}
        onMouseDown={e => mode === 'layout' && onElemMouseDown(e, elem)}>
        {inner()}
        {isSel && <>
          <div className="pdc-inspector" onMouseDown={e => { e.stopPropagation(); e.preventDefault(); }} onClick={e => e.stopPropagation()}>
            <button className="pdc-inspector-btn"
              onPointerDown={e => { e.stopPropagation(); e.preventDefault(); }}
              onClick={e => { e.stopPropagation(); duplicateElem(elem.id); }}>⧉ Dupliquer</button>
            <div className="pdc-inspector-sep" />
            <button className="pdc-inspector-btn danger"
              onPointerDown={e => { e.stopPropagation(); e.preventDefault(); }}
              onClick={e => { e.stopPropagation(); deleteElem(elem.id); }}>✕ Supprimer</button>
          </div>
          <div className="pdc-rh pdc-rh-e"  onMouseDown={e => onResizeMouseDown(e, elem, 'e')} />
          <div className="pdc-rh pdc-rh-s"  onMouseDown={e => onResizeMouseDown(e, elem, 's')} />
          <div className="pdc-rh pdc-rh-se" onMouseDown={e => onResizeMouseDown(e, elem, 'se')} />
        </>}
      </div>
    );
  };

  return (<>
    <div className="page-hd">
      <div>
        <div className="phd-badge">🪑 Plan de classe</div>
        <div className="phd-title">{nomSalle || (cls ? `Salle — ${cls.name}` : 'Plan de classe')}</div>
        <div className="phd-sub">{cls ? `${cls.name} · ${occupiedSeats}/${totalSeats} places occupées` : 'Sélectionnez une classe'}</div>
      </div>
      <div className="phd-actions">
        {selCls && <>
          <button className="btn btn-ghost" onClick={tirage}>🎲 Placement aléatoire</button>
          <button className="btn btn-ghost" onClick={() => { if (confirm('Vider tous les placements ?')) { updateElements(elements.map(el => ({ ...el, seatEleves: {} }))); setSelEleve(null); } }}>🗑 Vider placements</button>
          <button className="btn btn-ghost" onClick={() => { if (confirm('Réinitialiser toute la salle ?')) { updatePlan({ elements: [], flags: {}, nomSalle: '' }); setSelectedId(null); setSelEleve(null); } }}>↺ Réinitialiser</button>
        </>}
      </div>
    </div>

    <div className="pdc-outer">
      <div className="pdc-topbar">
        <span style={{ fontSize: '.73rem', fontWeight: 600, color: 'var(--text2)', flexShrink: 0 }}>Classe :</span>
        {classes.length === 0 ? (
          <span style={{ fontSize: '.75rem', color: 'var(--text3)' }}>Aucune classe — créez-en une dans Classes &amp; élèves</span>
        ) : (
          <div className="seg">
            {classes.map(c => (
              <button key={c.id} className={selCls === c.id ? 'on' : ''} onClick={() => { setSelCls(c.id); setSelectedId(null); setSelEleve(null); setMarqueMode(null); }}>
                {c.name}
              </button>
            ))}
          </div>
        )}
        {selCls && <>
          <div style={{ display: 'flex', alignItems: 'center', gap: '.35rem', marginLeft: '.4rem' }}>
            <span style={{ fontSize: '.68rem', color: 'var(--text3)', flexShrink: 0 }}>📛 Salle :</span>
            <input className="pdc-salle-name" value={nomSalle} onChange={e => updatePlan({ ...plan, nomSalle: e.target.value })} placeholder="Nommer la salle…" maxLength={40} />
          </div>
          <div className="pdc-mode-seg" style={{ marginLeft: 'auto' }}>
            <button className={`pdc-mode-btn${mode === 'layout' ? ' on' : ''}`} onClick={() => { setMode('layout'); setSelEleve(null); setMarqueMode(null); }}>🎨 Disposition</button>
            <button className={`pdc-mode-btn${mode === 'placement' ? ' on' : ''}`} onClick={() => { setMode('placement'); setSelectedId(null); }}>👥 Placement</button>
          </div>
          {mode === 'placement' && <>
            <button className={`pdc-marque-btn${marqueMode === 'eviter' ? ' on' : ''}`} style={{ color: marqueMode === 'eviter' ? '#fff' : 'var(--danger)' }} onClick={() => setMarqueMode(m => m === 'eviter' ? null : 'eviter')}>⛔ À éviter</button>
            <button className={`pdc-marque-btn${marqueMode === 'rapprocher' ? ' on' : ''}`} style={{ color: marqueMode === 'rapprocher' ? '#fff' : 'var(--success)' }} onClick={() => setMarqueMode(m => m === 'rapprocher' ? null : 'rapprocher')}>✅ À rapprocher</button>
          </>}
          <div className="pdc-zoom-bar">
            <button className="pdc-zoom-btn" onClick={zoomOut} title="Dézoomer">−</button>
            <span className="pdc-zoom-val" onDoubleClick={zoomReset} title="Double-clic = 100%">{zoom}%</span>
            <button className="pdc-zoom-btn" onClick={zoomIn} title="Zoomer">+</button>
          </div>
        </>}
      </div>

      {!selCls ? (
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', color: 'var(--text2)', gap: '.65rem' }}>
          <div style={{ fontSize: '2.5rem', opacity: .2 }}>🏫</div>
          <div style={{ fontWeight: 700, fontSize: '.9rem' }}>Sélectionnez une classe ci-dessus</div>
          <div style={{ fontSize: '.78rem', color: 'var(--text3)' }}>Le plan est conservé par classe</div>
        </div>
      ) : (
        <div className="pdc-shell">
          {mode === 'layout' && (
            <div className="pdc-palette">
              <div className="pdc-palette-hd">Éléments — glissez sur le canvas</div>
              <div className="pdc-palette-body">
                {PALETTE_ITEMS.map(sec => (
                  <React.Fragment key={sec.section}>
                    <div className="pdc-palette-section">{sec.section}</div>
                    {sec.items.map(pi => (
                      <div key={pi.type} className="pdc-palette-item" draggable onDragStart={e => onPaletteDragStart(e, pi)}>
                        <div className="pdc-palette-preview"><PalPreview type={pi.type} /></div>
                        <div>
                          <div className="pdc-palette-label">{pi.label}</div>
                          <div className="pdc-palette-sub">{pi.sub}</div>
                        </div>
                      </div>
                    ))}
                  </React.Fragment>
                ))}
                <div style={{ marginTop: '.8rem', padding: '.6rem .65rem', background: 'rgba(59,91,219,.05)', border: '1px solid rgba(59,91,219,.14)', borderRadius: 'var(--r-xs)', fontSize: '.64rem', color: 'var(--text2)', lineHeight: 1.65 }}>
                  <strong style={{ display: 'block', marginBottom: '.2rem', color: 'var(--text)' }}>💡 Conseils</strong>
                  Glissez un élément. Cliquez pour sélectionner et déplacer. Redimensionnez via les poignées bleues. Double-clic sur le % de zoom pour réinitialiser.
                </div>
              </div>
            </div>
          )}

          <div className="pdc-canvas-wrap" onDragOver={e => e.preventDefault()} onDrop={onCanvasDrop}
            onClick={e => { if (e.target === e.currentTarget || e.target.classList.contains('pdc-canvas')) setSelectedId(null); }}
            style={{ padding: 20, overflow: 'auto' }}>
            <div style={{ minWidth: canvasW, minHeight: canvasH }}>
              <div ref={canvasRef} className="pdc-canvas"
                style={{ width: canvasW, height: canvasH, position: 'relative' }}>
                <GridBg w={canvasW} h={canvasH} cell={CELL} />
                {elements.map(renderElem)}
                {elements.length === 0 && (
                  <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '1rem', pointerEvents: 'none' }}>
                    <div style={{ fontSize: '5rem', opacity: .06 }}>🏫</div>
                    <div style={{ textAlign: 'center', color: 'var(--text3)' }}>
                      <div style={{ fontSize: '1rem', fontWeight: 700, opacity: .5, marginBottom: '.35rem' }}>{mode === 'layout' ? 'Construisez votre salle' : 'Passez en mode Disposition'}</div>
                      <div style={{ fontSize: '.78rem', opacity: .4 }}>{mode === 'layout' ? 'Glissez des éléments depuis la palette de gauche' : ''}</div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {mode === 'placement' && (
            <div className="pdc-panel">
              <div className="pdc-panel-hd">
                {selEleve ? <><span style={{ color: 'var(--accent)' }}>📍</span> Cliquez un siège</> : <><span>👥</span> Non placés ({unplaced.length})</>}
              </div>
              <div className="pdc-unplaced">
                {selEleve && <>
                  <div style={{ padding: '.5rem .6rem', background: 'rgba(59,91,219,.07)', border: '1px solid rgba(59,91,219,.18)', borderRadius: 'var(--r-xs)', marginBottom: '.35rem' }}>
                    <div style={{ fontSize: '.65rem', color: 'var(--text2)', marginBottom: '.3rem' }}>
                      Placement de <strong style={{ color: 'var(--accent)' }}>{cls?.eleves.find(e => e.id === selEleve)?.nom}</strong>
                    </div>
                    <div style={{ display: 'flex', gap: '.3rem' }}>
                      <button className="btn btn-danger" style={{ fontSize: '.7rem', padding: '.22rem .5rem', flex: 1 }} onClick={() => removeEleveFromAll(selEleve)}>✕ Retirer</button>
                      <button className="btn" style={{ fontSize: '.7rem', padding: '.22rem .5rem', flex: 1 }} onClick={() => setSelEleve(null)}>Annuler</button>
                    </div>
                  </div>
                </>}
                {unplaced.length === 0 && !selEleve && (
                  <div style={{ padding: '1rem .5rem', textAlign: 'center', color: 'var(--success)', fontSize: '.78rem', fontWeight: 700 }}>🎉 Tous les élèves sont placés</div>
                )}
                {unplaced.map(e => (
                  <div key={e.id} className={`pdc-eleve-pill${selEleve === e.id ? ' on' : ''}`} onClick={() => setSelEleve(e.id)}>
                    <div className="pdc-eleve-avatar">{pdcInitiales(e.nom)}</div>
                    <span style={{ fontWeight: 500 }}>{e.nom}</span>
                  </div>
                ))}
                {placedIds.size > 0 && !selEleve && (
                  <div style={{ marginTop: '.5rem', paddingTop: '.5rem', borderTop: '1px solid var(--border)' }}>
                    <div style={{ fontSize: '.6rem', fontWeight: 700, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: '.3rem' }}>Déjà placés</div>
                    {[...placedIds].map(id => {
                      const e = cls?.eleves.find(el => el.id === id); if (!e) return null;
                      return (
                        <div key={id} className="pdc-eleve-pill" style={{ opacity: .75 }} onClick={() => setSelEleve(id)}>
                          <div className="pdc-eleve-avatar" style={{ background: 'var(--success)' }}>{pdcInitiales(e.nom)}</div>
                          <span style={{ fontWeight: 500 }}>{e.nom}</span>
                          <span style={{ marginLeft: 'auto', fontSize: '.65rem', color: 'var(--success)' }}>✓</span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
              <div style={{ padding: '.6rem .75rem', borderTop: '1px solid var(--border)', fontSize: '.64rem', color: 'var(--text2)', lineHeight: 1.7, background: 'var(--surface2)' }}>
                <strong style={{ display: 'block', marginBottom: '.2rem', color: 'var(--text)' }}>Légende</strong>
                <span style={{ color: 'var(--danger)' }}>⛔</span> Binôme à éviter<br />
                <span style={{ color: 'var(--success)' }}>✅</span> À surveiller / rapprocher
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  </>);
}
