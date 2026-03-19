function ModuleProgression({ cpData, onDataChange }) {
  const classes = cpData?.classes || [];
  const [progs, setProgs] = useState(() => {
    const raw = cpData?.progs;
    if (raw && typeof raw === 'object' && !Array.isArray(raw)) return raw;
    return {};
  });
  const [selCls, setSelCls] = useState(() => classes[0]?.id || null);
  const [showAddCol, setShowAddCol] = useState(false);
  const [newColLabel, setNewColLabel] = useState('');
  const [showDelCol, setShowDelCol] = useState(null);
  const [editColId, setEditColId] = useState(null);
  const [editColLabel, setEditColLabel] = useState('');
  const [hasEdited, setHasEdited] = useState(false);
  const setProgsAndEdit = (fn) => { setProgs(fn); setHasEdited(true); };

  useEffect(() => {
    if (hasEdited && onDataChange) onDataChange('cdc-progs', progs);
  }, [progs, hasEdited]);

  const rawCur = (selCls && progs[selCls]) ? progs[selCls] : null;
  const cols = Array.isArray(rawCur?.cols) ? rawCur.cols : [];
  const rows = Array.isArray(rawCur?.rows) ? rawCur.rows : [];
  const progExiste = !!(rawCur && Array.isArray(rawCur.cols) && Array.isArray(rawCur.rows));

  const updateCell = (rowId, colId, val) => {
    setProgsAndEdit(p => ({ ...p, [selCls]: { ...p[selCls], rows: p[selCls].rows.map(r => r.id === rowId ? { ...r, [colId]: val } : r) } }));
  };
  const addRow = () => {
    setProgsAndEdit(p => ({ ...p, [selCls]: { ...p[selCls], rows: [...p[selCls].rows, makeRow(cols)] } }));
  };
  const delRow = (rowId) => {
    setProgsAndEdit(p => ({ ...p, [selCls]: { ...p[selCls], rows: p[selCls].rows.filter(r => r.id !== rowId) } }));
  };
  const addCol = () => {
    const label = newColLabel.trim(); if (!label) return;
    const newCol = { id: 'c' + Date.now(), label, width: 160, type: 'text' };
    setProgsAndEdit(p => ({ ...p, [selCls]: { cols: [...p[selCls].cols, newCol], rows: p[selCls].rows.map(r => ({ ...r, [newCol.id]: '' })) } }));
    setNewColLabel(''); setShowAddCol(false);
  };
  const delCol = (colId) => {
    setProgsAndEdit(p => ({ ...p, [selCls]: { cols: p[selCls].cols.filter(c => c.id !== colId), rows: p[selCls].rows.map(r => { const n = { ...r }; delete n[colId]; return n; }) } }));
    setShowDelCol(null);
  };
  const renameCol = () => {
    if (!editColLabel.trim() || !editColId) return;
    setProgsAndEdit(p => ({ ...p, [selCls]: { ...p[selCls], cols: p[selCls].cols.map(c => c.id === editColId ? { ...c, label: editColLabel.trim() } : c) } }));
    setEditColId(null); setEditColLabel('');
  };
  const resetCols = () => {
    const newCols = COLS_DEFAULT.map(c => ({ ...c }));
    setProgsAndEdit(p => ({ ...p, [selCls]: { cols: newCols, rows: [makeRow(newCols)] } }));
  };
  const creerProgression = () => {
    const newCols = COLS_DEFAULT.map(c => ({ ...c }));
    setProgsAndEdit(p => ({ ...p, [selCls]: { cols: newCols, rows: [makeRow(newCols)] } }));
    setHasEdited(true);
  };

  if (!cpData) return <ModulePlaceholder icon="📆" title="Progression annuelle" sub="Ouvrez d'abord un fichier ClassPro." />;

  const cellStyle = (col) => ({
    padding: '.35rem .55rem', border: 'none', borderRight: '1px solid var(--border)',
    background: 'transparent', color: 'var(--text)', fontFamily: 'Roboto, sans-serif',
    fontSize: '.78rem', width: '100%', outline: 'none', minWidth: col.width || 120, boxSizing: 'border-box',
  });

  return (
    <>
      <div className="page-hd">
        <div>
          <div className="phd-badge">📆 Progression</div>
          <div className="phd-title">Progression annuelle</div>
          <div className="phd-sub">
            {selCls && classes.find(c => c.id === selCls)?.name
              ? `${classes.find(c => c.id === selCls).name} · ${rows.length} séquence(s)`
              : 'Sélectionnez une classe'}
          </div>
        </div>
        <div className="phd-actions">
          {selCls && progExiste && (
            <>
              <button className="btn btn-ghost" onClick={() => setShowAddCol(true)}>+ Colonne</button>
              <button className="btn btn-primary" onClick={addRow}>+ Séquence</button>
            </>
          )}
        </div>
      </div>

      <div style={{ display: 'flex', flex: 1, overflow: 'hidden', minHeight: 0 }}>
        <div style={{ width: 160, flexShrink: 0, borderRight: '1px solid var(--border)', background: 'var(--surface2)', overflowY: 'auto' }}>
          <div style={{ padding: '.38rem .6rem', fontSize: '.6rem', fontWeight: 700, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '.08em', borderBottom: '1px solid var(--border)' }}>Classes</div>
          {classes.length === 0 && <div style={{ padding: '.875rem', fontSize: '.76rem', color: 'var(--text3)', fontStyle: 'italic' }}>Aucune classe</div>}
          {classes.map(cls => (
            <button key={cls.id} onClick={() => setSelCls(cls.id)}
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', padding: '.55rem .875rem', border: 'none', borderLeft: `3px solid ${selCls === cls.id ? 'var(--accent)' : 'transparent'}`, background: selCls === cls.id ? 'var(--surface)' : 'transparent', cursor: 'pointer', fontFamily: 'Roboto, sans-serif', fontSize: '.8rem', fontWeight: selCls === cls.id ? 700 : 500, color: selCls === cls.id ? 'var(--accent)' : 'var(--text2)', borderBottom: '1px solid var(--border)', transition: 'all .15s' }}>
              <span>{cls.name}</span>
              <span style={{ fontSize: '.62rem', color: 'var(--text3)', fontWeight: 400 }}>{(progs[cls.id]?.rows || []).length}</span>
            </button>
          ))}
        </div>

        {!selCls ? (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text3)', flexDirection: 'column', gap: '.5rem' }}>
            <div style={{ fontSize: '2.5rem', opacity: .15 }}>📆</div>
            <div style={{ fontWeight: 700, color: 'var(--text2)' }}>{classes.length === 0 ? 'Aucune classe dans ce fichier' : 'Sélectionnez une classe'}</div>
          </div>
        ) : !progExiste ? (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ fontSize: '3rem', opacity: .15 }}>📆</div>
            <div style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--text2)' }}>Aucune progression renseignée</div>
            <div style={{ fontSize: '.83rem', color: 'var(--text3)' }}>Créez la progression annuelle pour la classe <strong>{classes.find(c => c.id === selCls)?.name}</strong></div>
            <button className="btn btn-primary" onClick={creerProgression}>+ Créer la progression</button>
          </div>
        ) : (
          <div style={{ flex: 1, overflow: 'auto', display: 'flex', flexDirection: 'column' }}>
            <div style={{ flex: 1, overflow: 'auto' }}>
              <table style={{ borderCollapse: 'collapse', minWidth: '100%', fontSize: '.78rem' }}>
                <thead>
                  <tr style={{ background: 'var(--surface2)', position: 'sticky', top: 0, zIndex: 10 }}>
                    <th style={{ width: 36, padding: '.5rem .4rem', borderBottom: '2px solid var(--border)', borderRight: '1px solid var(--border)', color: 'var(--text3)', fontWeight: 500, fontSize: '.65rem' }}>#</th>
                    {cols.map(col => (
                      <th key={col.id} style={{ padding: '.4rem .55rem', borderBottom: '2px solid var(--border)', borderRight: '1px solid var(--border)', textAlign: 'left', fontWeight: 700, color: 'var(--text2)', whiteSpace: 'nowrap', minWidth: col.width || 120 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '.3rem' }}>
                          <span style={{ flex: 1 }}>{col.label}</span>
                          <button onClick={() => { setEditColId(col.id); setEditColLabel(col.label); }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text3)', fontSize: '.62rem', opacity: .5, padding: '.1rem' }} title="Renommer">✏️</button>
                          <button onClick={() => setShowDelCol(col.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text3)', fontSize: '.62rem', opacity: .5, padding: '.1rem' }} title="Supprimer">×</button>
                        </div>
                      </th>
                    ))}
                    <th style={{ width: 36, borderBottom: '2px solid var(--border)' }}></th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row, i) => (
                    <tr key={row.id} style={{ background: i % 2 === 0 ? 'var(--surface)' : 'var(--surface2)' }}>
                      <td style={{ textAlign: 'center', fontSize: '.68rem', color: 'var(--text3)', borderBottom: '1px solid var(--border)', borderRight: '1px solid var(--border)', padding: '.35rem .4rem', fontWeight: 600 }}>{i + 1}</td>
                      {cols.map(col => (
                        <td key={col.id} style={{ borderBottom: '1px solid var(--border)', padding: 0 }}>
                          <input type={col.type === 'date' ? 'date' : 'text'} value={row[col.id] || ''} onChange={e => updateCell(row.id, col.id, e.target.value)} style={cellStyle(col)} onFocus={e => e.target.style.background = 'rgba(59,91,219,.07)'} onBlur={e => e.target.style.background = 'transparent'} />
                        </td>
                      ))}
                      <td style={{ borderBottom: '1px solid var(--border)', textAlign: 'center', padding: '.2rem' }}>
                        <button onClick={() => delRow(row.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text3)', fontSize: '.75rem', padding: '.2rem .3rem', opacity: .4, borderRadius: 4 }} onMouseEnter={e => e.currentTarget.style.opacity = 1} onMouseLeave={e => e.currentTarget.style.opacity = .4} title="Supprimer">🗑️</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div style={{ padding: '.65rem 1rem', borderTop: '1px solid var(--border)', background: 'var(--surface2)', display: 'flex', gap: '.5rem', alignItems: 'center', flexShrink: 0 }}>
              <button className="btn btn-primary" onClick={addRow} style={{ fontSize: '.75rem' }}>+ Séquence</button>
              <button className="btn btn-ghost" onClick={() => setShowAddCol(true)} style={{ fontSize: '.75rem' }}>+ Colonne</button>
              <div style={{ flex: 1 }} />
              <button className="btn" onClick={resetCols} style={{ fontSize: '.72rem', opacity: .65 }}>🔄 Réinitialiser</button>
            </div>
          </div>
        )}
      </div>

      {showAddCol && (
        <Modal title="+ Nouvelle colonne" onClose={() => setShowAddCol(false)} width={360}>
          <Field label="Nom de la colonne *">
            <input autoFocus value={newColLabel} onChange={e => setNewColLabel(e.target.value)} onKeyDown={e => e.key === 'Enter' && addCol()} placeholder="Ex : Compétences, Niveau, Période…" style={inputStyle} />
          </Field>
          <div style={{ display: 'flex', gap: '.5rem', justifyContent: 'flex-end' }}>
            <button onClick={() => setShowAddCol(false)} className="btn">Annuler</button>
            <button onClick={addCol} className="btn btn-primary" disabled={!newColLabel.trim()}>Ajouter</button>
          </div>
        </Modal>
      )}
      {editColId && (
        <Modal title="✏️ Renommer la colonne" onClose={() => setEditColId(null)} width={360}>
          <Field label="Nouveau nom *">
            <input autoFocus value={editColLabel} onChange={e => setEditColLabel(e.target.value)} onKeyDown={e => e.key === 'Enter' && renameCol()} style={inputStyle} />
          </Field>
          <div style={{ display: 'flex', gap: '.5rem', justifyContent: 'flex-end' }}>
            <button onClick={() => setEditColId(null)} className="btn">Annuler</button>
            <button onClick={renameCol} className="btn btn-primary" disabled={!editColLabel.trim()}>Renommer</button>
          </div>
        </Modal>
      )}
      {showDelCol && (
        <Modal title="🗑️ Supprimer cette colonne ?" onClose={() => setShowDelCol(null)} width={360}>
          <div style={{ fontSize: '.88rem', color: 'var(--text2)', lineHeight: 1.6 }}>La colonne <strong>"{cols.find(c => c.id === showDelCol)?.label}"</strong> et toutes ses données seront supprimées.</div>
          <div style={{ display: 'flex', gap: '.5rem', justifyContent: 'flex-end' }}>
            <button onClick={() => setShowDelCol(null)} className="btn">Annuler</button>
            <button onClick={() => delCol(showDelCol)} className="btn btn-danger">Supprimer</button>
          </div>
        </Modal>
      )}
    </>
  );
}

// ── MODULE CONSEIL DE CLASSE ──────────────────────────────────────────────────