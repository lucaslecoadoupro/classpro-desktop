// ── MODULE SUIVI DE CLASSE ────────────────────────────────────────────────────
const OBS = [
  { id: 'bav',  emoji: '💬', label: 'Bavardage',        k: 'neg' },
  { id: 'trav', emoji: '📚', label: 'Manque travail',   k: 'neg' },
  { id: 'disp', emoji: '😶', label: 'Dispersé',         k: 'neg' },
  { id: 'part', emoji: '✋', label: 'Participation',    k: 'neu' },
  { id: 'bon',  emoji: '👍', label: 'Bon comportement', k: 'pos' },
  { id: 'top',  emoji: '⭐', label: 'Excellent',        k: 'pos' },
];

function ModuleSuivi({ cpData, onDataChange }) {
  const [classes, setClasses] = useState(() => cpData?.classes || []);
  const [sessions, setSessions] = useState(() => {
    const raw = cpData?._raw?.entries?.['sc-sessions'];
    try { return JSON.parse(raw || '{}'); } catch { return {}; }
  });
  const [selId, setSelId] = useState(null);
  const [vueSuivi, setVueSuivi] = useState('obs');
  const [showNewClasse, setShowNewClasse] = useState(false);
  const [showNewSeance, setShowNewSeance] = useState(false);
  const [showRenomClasse, setShowRenomClasse] = useState(false);
  const [showDelClasse, setShowDelClasse] = useState(false);
  const [showImportEleves, setShowImportEleves] = useState(false);
  const [bilanEl, setBilanEl] = useState(null);
  const [newNom, setNewNom] = useState('');
  const [renomNom, setRenomNom] = useState('');
  const [newEleve, setNewEleve] = useState('');
  const [texteImport, setTexteImport] = useState('');
  const [seanceDate, setSeanceDate] = useState(isoDate(new Date()));
  const [seanceLabel, setSeanceLabel] = useState('');
  const [showAlertConfig, setShowAlertConfig] = useState(false);
  const [showAlertModal, setShowAlertModal] = useState(false);
  const [alertSeuils, setAlertSeuils] = useState(() => {
    try { return JSON.parse(localStorage.getItem('cpd-suivi-seuils') || 'null') || { bav: 3, trav: 3, disp: 3, part: '', bon: '', top: '' }; }
    catch { return { bav: 3, trav: 3, disp: 3, part: '', bon: '', top: '' }; }
  });
  const [alertSeuilsForm, setAlertSeuilsForm] = useState(alertSeuils);

  const cur = classes.find(c => c.id === selId) || null;
  const curSess = useMemo(() =>
    (sessions[selId] || []).slice().sort((a, b) => a.date > b.date ? 1 : -1),
    [sessions, selId]
  );

  // Calcul des alertes — élèves dépassant les seuils sur la classe active
  const alertes = useMemo(() => {
    if (!cur) return [];
    const result = [];
    cur.eleves.forEach(el => {
      const counts = {};
      OBS.forEach(o => { counts[o.id] = 0; });
      (sessions[selId] || []).forEach(s => {
        OBS.forEach(o => { if (s.obs?.[el.id + '_' + o.id]) counts[o.id]++; });
      });
      const triggered = OBS.filter(o => {
        const seuil = alertSeuils[o.id];
        return seuil !== '' && seuil !== null && seuil !== undefined && counts[o.id] >= Number(seuil);
      }).map(o => ({ obs: o, count: counts[o.id] }));
      if (triggered.length > 0) result.push({ el, triggered });
    });
    return result;
  }, [sessions, selId, cur, alertSeuils]);

  const saveAlertSeuils = () => {
    setAlertSeuils(alertSeuilsForm);
    localStorage.setItem('cpd-suivi-seuils', JSON.stringify(alertSeuilsForm));
    setShowAlertConfig(false);
  };

  useEffect(() => { if (!selId && classes.length > 0) setSelId(classes[0].id); }, [classes]);
  useEffect(() => { if (onDataChange) onDataChange('sc-classes', classes); }, [classes]);
  useEffect(() => { if (onDataChange) onDataChange('sc-sessions', sessions); }, [sessions]);

  const addSeance = () => {
    if (!selId) return;
    const s = { id: 's' + Date.now(), date: seanceDate, label: seanceLabel.trim() || 'Cours', obs: {} };
    setSessions(prev => {
      const arr = [...(prev[selId] || []), s].sort((a, b) => a.date > b.date ? 1 : -1);
      return { ...prev, [selId]: arr };
    });
    setShowNewSeance(false); setSeanceLabel('');
  };
  const delSeance = sid => setSessions(prev => ({ ...prev, [selId]: (prev[selId] || []).filter(s => s.id !== sid) }));
  const toggleObs = (sid, eid, oid) => {
    setSessions(prev => ({
      ...prev,
      [selId]: (prev[selId] || []).map(s => {
        if (s.id !== sid) return s;
        const key = eid + '_' + oid;
        const obs = { ...s.obs };
        if (obs[key]) delete obs[key]; else obs[key] = true;
        return { ...s, obs };
      }),
    }));
  };
  const hasObs = (sid, eid, oid) => !!(sessions[selId] || []).find(s => s.id === sid)?.obs?.[eid + '_' + oid];

  const addClasse = () => {
    const n = newNom.trim(); if (!n) return;
    const c = { id: 'c' + Date.now(), name: n, eleves: [] };
    setClasses(prev => [...prev, c]);
    setSelId(c.id); setNewNom(''); setShowNewClasse(false);
  };
  const renommerClasse = () => {
    const n = renomNom.trim(); if (!n || !selId) return;
    setClasses(prev => prev.map(c => c.id === selId ? { ...c, name: n } : c));
    setShowRenomClasse(false);
  };
  const supprimerClasse = () => {
    setClasses(prev => prev.filter(c => c.id !== selId));
    setSessions(prev => { const n = { ...prev }; delete n[selId]; return n; });
    setSelId(null); setShowDelClasse(false);
  };

  const addEleve = () => {
    const n = newEleve.trim(); if (!n || !selId) return;
    setClasses(prev => prev.map(c => c.id !== selId ? c : { ...c, eleves: [...c.eleves, { id: 'e' + Date.now(), nom: n }] }));
    setNewEleve('');
  };
  const delEleve = eid => setClasses(prev => prev.map(c => c.id !== selId ? c : { ...c, eleves: c.eleves.filter(e => e.id !== eid) }));

  const importerEleves = () => {
    const lignes = texteImport.split('\n').map(l => l.trim()).filter(Boolean);
    const existNoms = (cur?.eleves || []).map(e => e.nom.toLowerCase());
    const nouveaux = [];
    lignes.forEach((ligne, i) => {
      const tokens = ligne.split(/\s+/);
      const hasUpper = tokens.some(t => /^[A-Z\xC0-\xD6\xD8-\xDE]{2,}/.test(t));
      const hasPrenom = tokens.some(t => /^[A-Z\xC0-\xDE][a-z\xe0-\xff]/.test(t));
      if (hasUpper && hasPrenom) {
        const nom = tokens.join(' ');
        if (!existNoms.includes(nom.toLowerCase())) nouveaux.push({ id: 'e' + Date.now() + i, nom });
      }
    });
    if (!nouveaux.length) { alert('Aucun nom détecté. Format attendu : DUPONT Jean'); return; }
    setClasses(prev => prev.map(c => c.id !== selId ? c : { ...c, eleves: [...c.eleves, ...nouveaux] }));
    setTexteImport(''); setShowImportEleves(false);
  };

  const getBilan = el => {
    const counts = {}; OBS.forEach(o => { counts[o.id] = 0; });
    curSess.forEach(s => OBS.forEach(o => { if (s.obs?.[el.id + '_' + o.id]) counts[o.id]++; }));
    return counts;
  };
  const obsColor = k => k === 'neg' ? 'var(--danger)' : k === 'pos' ? 'var(--success)' : 'var(--warning)';
  const obsBg   = k => k === 'neg' ? 'rgba(220,38,38,.1)' : k === 'pos' ? 'rgba(15,155,110,.1)' : 'rgba(217,119,6,.1)';

  if (!cpData) return <ModulePlaceholder icon="👥" title="Suivi de classe" sub="Ouvrez d'abord un fichier ClassPro." />;

  const Modal = ({ show, onClose, title, width = 400, children }) => !show ? null : (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.45)', zIndex: 9000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{ background: 'var(--surface)', borderRadius: 'var(--r)', width, boxShadow: 'var(--shadow-l)', overflow: 'hidden' }}>
        <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid var(--border)', background: 'var(--surface2)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontWeight: 700 }}>{title}</div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.2rem', color: 'var(--text3)' }}>×</button>
        </div>
        <div style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '.75rem' }}>{children}</div>
      </div>
    </div>
  );

  return (
    <>
      <div className="page-hd">
        <div>
          <div className="phd-badge">👥 Suivi de classe</div>
          <div className="phd-title">{cur ? cur.name : 'Suivi de classe'}</div>
          <div className="phd-sub">{cur ? `${cur.eleves.length} élève(s) · ${curSess.length} séance(s)` : `${classes.length} classe(s)`}</div>
        </div>
        <div className="phd-actions">
          {selId && <button className="btn btn-ghost" onClick={() => setShowNewSeance(true)}>+ Séance</button>}
          {selId && alertes.length > 0 && (
            <button onClick={() => setShowAlertModal(true)}
              style={{ display:'flex', alignItems:'center', gap:'.4rem', padding:'.38rem .875rem', borderRadius:'var(--r-s)', border:'none', background:'var(--danger)', color:'#fff', fontFamily:'Roboto,sans-serif', fontSize:'.8rem', fontWeight:700, cursor:'pointer' }}>
              ⚠️ {alertes.length} alerte{alertes.length > 1 ? 's' : ''}
            </button>
          )}
          {selId && (
            <button onClick={() => { setAlertSeuilsForm(alertSeuils); setShowAlertConfig(true); }} title="Configurer les seuils d'alerte"
              style={{ padding:'.38rem .5rem', borderRadius:'var(--r-s)', border:'1px solid var(--border)', background:'var(--surface2)', cursor:'pointer', fontSize:'.85rem' }}>
              ⚙️
            </button>
          )}

          <button className="btn btn-white" onClick={() => { setNewNom(''); setShowNewClasse(true); }}>+ Classe</button>
          {selId && <>
            <button className="btn btn-ghost" title="Renommer" onClick={() => { setRenomNom(cur?.name || ''); setShowRenomClasse(true); }}>✏️</button>
            <button className="btn btn-danger" style={{ opacity: .8 }} onClick={() => setShowDelClasse(true)}>🗑️</button>
          </>}
        </div>
      </div>

      <div style={{ display: 'flex', flex: 1, overflow: 'hidden', minHeight: 0 }}>
        {/* Sidebar classes */}
        <div style={{ width: 180, flexShrink: 0, borderRight: '1px solid var(--border)', background: 'var(--surface2)', display: 'flex', flexDirection: 'column' }}>
          <div style={{ padding: '.38rem .6rem', fontSize: '.6rem', fontWeight: 700, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '.08em', borderBottom: '1px solid var(--border)' }}>Classes</div>
          <div style={{ flex: 1, overflowY: 'auto' }}>
            {classes.length === 0 && <div style={{ padding: '.875rem', fontSize: '.76rem', color: 'var(--text3)', fontStyle: 'italic' }}>Aucune classe</div>}
            {classes.map(cls => (
              <button key={cls.id} onClick={() => setSelId(cls.id)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', padding: '.55rem .875rem', border: 'none', borderLeft: `3px solid ${selId === cls.id ? 'var(--accent)' : 'transparent'}`, background: selId === cls.id ? 'var(--surface)' : 'transparent', cursor: 'pointer', fontFamily: 'Roboto, sans-serif', fontSize: '.8rem', fontWeight: selId === cls.id ? 700 : 500, color: selId === cls.id ? 'var(--accent)' : 'var(--text2)', borderBottom: '1px solid var(--border)', transition: 'all .15s' }}>
                <span>{cls.name}</span>
                <span style={{ fontSize: '.65rem', color: 'var(--text3)', fontWeight: 400 }}>({cls.eleves.length})</span>
              </button>
            ))}
          </div>
        </div>

        {!selId ? (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '.75rem', color: 'var(--text3)' }}>
            <div style={{ fontSize: '3rem', opacity: .15 }}>👥</div>
            <div style={{ fontWeight: 700, color: 'var(--text2)' }}>Sélectionnez une classe</div>
          </div>
        ) : (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            {/* Onglets */}
            <div style={{ display: 'flex', borderBottom: '1px solid var(--border)', background: 'var(--surface)', flexShrink: 0 }}>
              {[{ id: 'obs', label: '📋 Observations' }, { id: 'eleves', label: '👤 Élèves' }].map(tab => (
                <button key={tab.id} onClick={() => setVueSuivi(tab.id)} style={{ padding: '.6rem 1.1rem', border: 'none', borderBottom: `2.5px solid ${vueSuivi === tab.id ? 'var(--accent)' : 'transparent'}`, background: 'none', cursor: 'pointer', fontFamily: 'Roboto, sans-serif', fontSize: '.8rem', fontWeight: vueSuivi === tab.id ? 700 : 500, color: vueSuivi === tab.id ? 'var(--accent)' : 'var(--text2)' }}>
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Vue observations */}
            {vueSuivi === 'obs' && (
              <div style={{ flex: 1, overflowX: 'auto', overflowY: 'auto' }}>
                {curSess.length === 0 ? (
                  <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text3)', fontSize: '.82rem' }}>
                    Aucune séance · <button onClick={() => setShowNewSeance(true)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--accent)', fontWeight: 700 }}>+ Ajouter une séance</button>
                  </div>
                ) : cur.eleves.length === 0 ? (
                  <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text3)', fontSize: '.82rem' }}>
                    Aucun élève · <button onClick={() => setVueSuivi('eleves')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--accent)', fontWeight: 700 }}>Gérer les élèves →</button>
                  </div>
                ) : (
                  <table style={{ borderCollapse: 'collapse', fontSize: '.8rem' }}>
                    <thead>
                      <tr style={{ background: 'var(--surface2)', position: 'sticky', top: 0, zIndex: 10 }}>
                        <th style={{ padding: '.6rem 1rem', textAlign: 'left', fontWeight: 700, color: 'var(--text2)', borderBottom: '2px solid var(--border)', minWidth: 180, position: 'sticky', left: 0, background: 'var(--surface2)', zIndex: 11 }}>Élève</th>
                        {curSess.map(s => (
                          <th key={s.id} style={{ minWidth: 56, padding: '.35rem .4rem', textAlign: 'center', fontWeight: 600, color: 'var(--text2)', borderBottom: '2px solid var(--border)', borderLeft: '1px solid var(--border)', position: 'relative' }}>
                            <div style={{ fontSize: '.65rem', fontWeight: 700, color: 'var(--accent)', writingMode: 'vertical-rl', transform: 'rotate(180deg)', whiteSpace: 'nowrap', margin: '0 auto' }}>
                              {s.date ? new Date(s.date + 'T12:00').toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' }) : '—'}
                            </div>
                            <div style={{ fontSize: '.55rem', color: 'var(--text3)', writingMode: 'vertical-rl', transform: 'rotate(180deg)', whiteSpace: 'nowrap', margin: '0 auto', marginTop: '.2rem' }}>{s.label}</div>
                            <button onClick={() => delSeance(s.id)} style={{ position: 'absolute', top: 2, right: 2, background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text3)', fontSize: '.6rem', opacity: .4 }} title="Supprimer">×</button>
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {cur.eleves.map((el, i) => {
                        const enAlerte = alertes.some(a => a.el.id === el.id);
                        return (
                          <tr key={el.id} style={{ background: enAlerte ? 'rgba(220,38,38,.04)' : i % 2 === 0 ? 'var(--surface)' : 'var(--surface2)' }}>
                            <td style={{ padding: '.45rem 1rem', fontWeight: 600, borderBottom: '1px solid var(--border)', whiteSpace: 'nowrap', position: 'sticky', left: 0, background: enAlerte ? 'rgba(220,38,38,.06)' : i % 2 === 0 ? 'var(--surface)' : 'var(--surface2)', zIndex: 1 }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '.5rem' }}>
                                {enAlerte && <span style={{ color: 'var(--danger)', fontSize: '.75rem', flexShrink: 0 }} title="Élève en alerte">⚠️</span>}
                                <button onClick={() => setBilanEl(el)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: enAlerte ? 'var(--danger)' : 'var(--text)', fontWeight: 700, fontSize: '.82rem', textDecoration: 'underline dotted', textUnderlineOffset: 3, padding: 0 }}>{el.nom}</button>
                              </div>
                            </td>
                            {curSess.map(s => (
                              <td key={s.id} style={{ padding: '.3rem .25rem', borderBottom: '1px solid var(--border)', borderLeft: '1px solid var(--border)', textAlign: 'center', verticalAlign: 'middle' }}>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '2px', justifyContent: 'center', alignItems: 'center', minHeight: 28 }}>
                                  {OBS.map(o => {
                                    const active = hasObs(s.id, el.id, o.id);
                                    return active ? (
                                      <button key={o.id} onClick={() => toggleObs(s.id, el.id, o.id)} title={o.label}
                                        style={{ width: 10, height: 10, borderRadius: '50%', border: 'none', background: obsColor(o.k), cursor: 'pointer', padding: 0, flexShrink: 0, transition: 'transform .1s' }}
                                        onMouseEnter={e => e.currentTarget.style.transform='scale(1.4)'}
                                        onMouseLeave={e => e.currentTarget.style.transform='scale(1)'} />
                                    ) : (
                                      <button key={o.id} onClick={() => toggleObs(s.id, el.id, o.id)} title={o.label}
                                        style={{ width: 10, height: 10, borderRadius: '50%', border: '1.5px solid var(--border)', background: 'transparent', cursor: 'pointer', padding: 0, flexShrink: 0, opacity: .25, transition: 'opacity .1s' }}
                                        onMouseEnter={e => e.currentTarget.style.opacity='0.7'}
                                        onMouseLeave={e => e.currentTarget.style.opacity='0.25'} />
                                    );
                                  })}
                                </div>
                              </td>
                            ))}
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                )}
              </div>
            )}

            {/* Vue élèves */}
            {vueSuivi === 'eleves' && (
              <div style={{ flex: 1, overflow: 'auto', padding: '1rem 1.25rem' }}>
                <div style={{ display: 'flex', gap: '.65rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
                  <input type="text" placeholder="Ajouter un élève (NOM Prénom)…" value={newEleve} onChange={e => setNewEleve(e.target.value)} onKeyDown={e => e.key === 'Enter' && addEleve()} style={{ flex: 1, minWidth: 220, padding: '.5rem .875rem', border: '1.5px solid var(--border)', borderRadius: 'var(--r-s)', background: 'var(--surface2)', color: 'var(--text)', fontFamily: 'Roboto, sans-serif', fontSize: '.85rem', outline: 'none' }} />
                  <button onClick={addEleve} disabled={!newEleve.trim()} className="btn btn-primary">+ Ajouter</button>
                  <button onClick={() => setShowImportEleves(true)} className="btn">📋 Import liste</button>
                </div>
                {cur.eleves.length === 0 ? (
                  <div style={{ textAlign: 'center', color: 'var(--text3)', padding: '2rem', fontSize: '.82rem', fontStyle: 'italic' }}>Aucun élève — ajoutez-en un ou importez une liste</div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '.38rem' }}>
                    {cur.eleves.map((el, i) => (
                      <div key={el.id} style={{ display: 'flex', alignItems: 'center', gap: '.75rem', padding: '.55rem .875rem', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--r-s)' }}>
                        <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '.65rem', fontWeight: 700, flexShrink: 0 }}>{el.nom.slice(0, 2).toUpperCase()}</div>
                        <span style={{ flex: 1, fontWeight: 600, fontSize: '.85rem' }}>{el.nom}</span>
                        <span style={{ fontSize: '.7rem', color: 'var(--text3)' }}>#{i + 1}</span>
                        <button onClick={() => delEleve(el.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text3)', fontSize: '.8rem', padding: '.2rem .35rem', borderRadius: 4 }} onMouseEnter={e => e.target.style.color = 'var(--danger)'} onMouseLeave={e => e.target.style.color = 'var(--text3)'}>🗑️</button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Bilan élève */}
      {bilanEl && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.45)', zIndex: 9000, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={e => e.target === e.currentTarget && setBilanEl(null)}>
          <div style={{ background: 'var(--surface)', borderRadius: 'var(--r)', width: 520, maxHeight: '80vh', overflow: 'hidden', display: 'flex', flexDirection: 'column', boxShadow: 'var(--shadow-l)' }}>
            <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--surface2)' }}>
              <div><div style={{ fontWeight: 700, fontSize: '.95rem' }}>{bilanEl.nom}</div><div style={{ fontSize: '.72rem', color: 'var(--text3)' }}>{cur?.name} · {curSess.length} séance(s)</div></div>
              <button onClick={() => setBilanEl(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.3rem', color: 'var(--text3)' }}>×</button>
            </div>
            <div style={{ padding: '1rem 1.25rem', overflowY: 'auto' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '.42rem', marginBottom: '1rem' }}>
                {OBS.map(o => { const cnt = getBilan(bilanEl)[o.id]; return (
                  <div key={o.id} style={{ display: 'flex', alignItems: 'center', gap: '.5rem', padding: '.5rem .7rem', background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 'var(--r-xs)', opacity: cnt === 0 ? .4 : 1 }}>
                    <span style={{ fontSize: '1.1rem' }}>{o.emoji}</span>
                    <div><div style={{ fontWeight: 700, fontSize: '.72rem' }}>{o.label}</div><div style={{ fontSize: '.8rem', fontWeight: 800, color: cnt > 0 ? obsColor(o.k) : 'var(--text3)' }}>{cnt === 0 ? '—' : cnt + 'x'}</div></div>
                  </div>
                ); })}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '.3rem' }}>
                {curSess.map(s => { const actifs = OBS.filter(o => s.obs?.[bilanEl.id + '_' + o.id]); return (
                  <div key={s.id} style={{ display: 'flex', alignItems: 'center', gap: '.65rem', padding: '.42rem .65rem', background: 'var(--surface2)', borderRadius: 'var(--r-xs)', border: '1px solid var(--border)' }}>
                    <div style={{ minWidth: 70, flexShrink: 0 }}><div style={{ fontSize: '.7rem', fontWeight: 700 }}>{s.date && new Date(s.date + 'T12:00').toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}</div><div style={{ fontSize: '.62rem', color: 'var(--text3)' }}>{s.label}</div></div>
                    {actifs.length === 0 ? <span style={{ fontSize: '.72rem', color: 'var(--text3)', fontStyle: 'italic' }}>Rien de noté</span>
                      : <div style={{ display: 'flex', gap: '.22rem', flexWrap: 'wrap' }}>{actifs.map(o => <span key={o.id} style={{ display: 'inline-flex', alignItems: 'center', gap: '.15rem', padding: '.1rem .42rem', borderRadius: 99, background: obsBg(o.k), color: obsColor(o.k), fontSize: '.7rem', fontWeight: 600 }}>{o.emoji} {o.label}</span>)}</div>
                    }
                  </div>
                ); })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Légende */}
      {vueSuivi === 'obs' && cur && curSess.length > 0 && cur.eleves.length > 0 && (
        <div style={{ padding: '.38rem 1rem', borderTop: '1px solid var(--border)', background: 'var(--surface2)', display: 'flex', gap: '1rem', flexShrink: 0, flexWrap: 'wrap', alignItems: 'center' }}>
          <span style={{ fontSize: '.65rem', fontWeight: 700, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '.06em' }}>Légende</span>
          {OBS.map(o => (
            <div key={o.id} style={{ display: 'flex', alignItems: 'center', gap: '.3rem', fontSize: '.72rem', color: 'var(--text2)' }}>
              <div style={{ width: 9, height: 9, borderRadius: '50%', background: obsColor(o.k), flexShrink: 0 }} />
              {o.label}
            </div>
          ))}
        </div>
      )}

      {/* Modale alertes élèves */}
      {showAlertModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.5)', zIndex: 9000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}
          onClick={e => e.target === e.currentTarget && setShowAlertModal(false)}>
          <div style={{ background: 'var(--surface)', borderRadius: 16, width: 480, maxHeight: '80vh', display: 'flex', flexDirection: 'column', boxShadow: '0 24px 64px rgba(0,0,0,.3)', overflow: 'hidden' }}>
            <div style={{ background: 'linear-gradient(135deg, #dc2626, #b91c1c)', padding: '1.25rem 1.5rem', flexShrink: 0 }}>
              <div style={{ fontFamily: 'Roboto Slab,serif', fontWeight: 800, fontSize: '1.05rem', color: '#fff', marginBottom: '.2rem' }}>⚠️ Alertes élèves</div>
              <div style={{ fontSize: '.78rem', color: 'rgba(255,255,255,.8)' }}>{alertes.length} élève{alertes.length > 1 ? 's' : ''} · {cur?.name}</div>
            </div>
            <div style={{ flex: 1, overflowY: 'auto', padding: '1rem 1.25rem', display: 'flex', flexDirection: 'column', gap: '.75rem' }}>
              {alertes.map(({ el, triggered }) => (
                <div key={el.id} style={{ padding: '.875rem 1rem', background: 'var(--surface2)', border: '1px solid rgba(220,38,38,.2)', borderRadius: 12, borderLeft: '4px solid var(--danger)' }}>
                  <div style={{ fontWeight: 700, fontSize: '.9rem', marginBottom: '.5rem', display: 'flex', alignItems: 'center', gap: '.5rem' }}>
                    👤 {el.nom}
                  </div>
                  {triggered.map(({ obs: o, count }) => (
                    <div key={o.id} style={{ fontSize: '.8rem', color: 'var(--text2)', padding: '.35rem .5rem', background: 'rgba(220,38,38,.06)', borderRadius: 6, marginBottom: '.3rem' }}>
                      <div style={{ marginBottom: '.2rem' }}>
                        ⚠️ <strong>{el.nom.split(' ')[0]}</strong> a été {o.label.toLowerCase()} <strong>{count} fois</strong>. Cela mériterait peut-être une <strong>observation Pronote</strong> ?
                      </div>
                      <div style={{ fontSize: '.72rem', color: 'var(--text3)' }}>{o.emoji} {o.label} : {count}x</div>
                    </div>
                  ))}
                </div>
              ))}
            </div>
            <div style={{ padding: '.875rem 1.25rem', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'flex-end', background: 'var(--surface2)' }}>
              <button className="btn btn-primary" onClick={() => setShowAlertModal(false)}>Fermer</button>
            </div>
          </div>
        </div>
      )}

      {/* Modale config seuils d'alerte */}
      {showAlertConfig && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.5)', zIndex: 9000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}
          onClick={e => e.target === e.currentTarget && setShowAlertConfig(false)}>
          <div style={{ background: 'var(--surface)', borderRadius: 16, width: 440, maxHeight: '85vh', display: 'flex', flexDirection: 'column', boxShadow: '0 24px 64px rgba(0,0,0,.3)', overflow: 'hidden' }}>
            <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--border)', background: 'var(--surface2)' }}>
              <div style={{ fontFamily: 'Roboto Slab,serif', fontWeight: 800, fontSize: '1rem' }}>⚙️ Seuils d'alerte</div>
              <div style={{ fontSize: '.78rem', color: 'var(--text3)', marginTop: '.2rem' }}>Déclencher une alerte après X observations</div>
            </div>
            <div style={{ padding: '.75rem 1.25rem', background: 'rgba(59,91,219,.05)', borderBottom: '1px solid var(--border)', fontSize: '.75rem', color: 'var(--text2)', lineHeight: 1.6 }}>
              💡 Laisser vide = pas d'alerte pour cette observation. L'alerte se déclenche sur le total cumulé de toutes les séances.
            </div>
            <div style={{ flex: 1, overflowY: 'auto', padding: '1rem 1.5rem', display: 'flex', flexDirection: 'column', gap: '.6rem' }}>
              {OBS.map(o => (
                <div key={o.id} style={{ display: 'flex', alignItems: 'center', gap: '.75rem', padding: '.55rem .75rem', background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 10 }}>
                  <span style={{ fontSize: '1.1rem', flexShrink: 0 }}>{o.emoji}</span>
                  <span style={{ flex: 1, fontWeight: 600, fontSize: '.85rem', color: obsColor(o.k) }}>{o.label}</span>
                  <span style={{ fontSize: '.78rem', color: 'var(--text3)' }}>Alerte après</span>
                  <input type="number" min="1" max="99"
                    value={alertSeuilsForm[o.id] ?? ''}
                    onChange={e => setAlertSeuilsForm(f => ({ ...f, [o.id]: e.target.value === '' ? '' : Number(e.target.value) }))}
                    placeholder="—"
                    style={{ width: 52, padding: '.38rem .5rem', border: '1.5px solid var(--border)', borderRadius: 8, background: 'var(--surface)', color: 'var(--text)', fontFamily: 'Roboto,sans-serif', fontSize: '.88rem', textAlign: 'center', outline: 'none' }}
                    onFocus={e => e.target.style.borderColor='var(--accent)'} onBlur={e => e.target.style.borderColor='var(--border)'} />
                  <span style={{ fontSize: '.78rem', color: 'var(--text3)' }}>fois</span>
                </div>
              ))}
            </div>
            <div style={{ padding: '.875rem 1.5rem', borderTop: '1px solid var(--border)', display: 'flex', gap: '.5rem', justifyContent: 'flex-end', background: 'var(--surface2)' }}>
              <button className="btn" onClick={() => setShowAlertConfig(false)}>Annuler</button>
              <button className="btn btn-primary" onClick={saveAlertSeuils}>Enregistrer</button>
            </div>
          </div>
        </div>
      )}

      <Modal show={showNewSeance} onClose={() => setShowNewSeance(false)} title="+ Nouvelle séance">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '.28rem' }}><label style={{ fontSize: '.72rem', fontWeight: 600, color: 'var(--text2)', textTransform: 'uppercase', letterSpacing: '.07em' }}>Date</label><input type="date" value={seanceDate} onChange={e => setSeanceDate(e.target.value)} style={{ padding: '.6rem .875rem', border: '1.5px solid var(--border)', borderRadius: 'var(--r-s)', background: 'var(--surface2)', color: 'var(--text)', fontFamily: 'Roboto, sans-serif', fontSize: '.88rem', outline: 'none' }} /></div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '.28rem' }}><label style={{ fontSize: '.72rem', fontWeight: 600, color: 'var(--text2)', textTransform: 'uppercase', letterSpacing: '.07em' }}>Label (optionnel)</label><input type="text" autoFocus placeholder="Ex : Cours, Interro…" value={seanceLabel} onChange={e => setSeanceLabel(e.target.value)} onKeyDown={e => e.key === 'Enter' && addSeance()} style={{ padding: '.6rem .875rem', border: '1.5px solid var(--border)', borderRadius: 'var(--r-s)', background: 'var(--surface2)', color: 'var(--text)', fontFamily: 'Roboto, sans-serif', fontSize: '.88rem', outline: 'none' }} /></div>
        <div style={{ display: 'flex', gap: '.5rem', justifyContent: 'flex-end' }}><button onClick={() => setShowNewSeance(false)} className="btn">Annuler</button><button onClick={addSeance} className="btn btn-primary">Créer</button></div>
      </Modal>

      <Modal show={showNewClasse} onClose={() => setShowNewClasse(false)} title="+ Nouvelle classe">
        <input autoFocus type="text" placeholder="Ex : 3A, 5B…" value={newNom} onChange={e => setNewNom(e.target.value)} onKeyDown={e => e.key === 'Enter' && addClasse()} style={{ padding: '.6rem .875rem', border: '1.5px solid var(--border)', borderRadius: 'var(--r-s)', background: 'var(--surface2)', color: 'var(--text)', fontFamily: 'Roboto, sans-serif', fontSize: '.88rem', outline: 'none' }} />
        <div style={{ display: 'flex', gap: '.5rem', justifyContent: 'flex-end' }}><button onClick={() => setShowNewClasse(false)} className="btn">Annuler</button><button onClick={addClasse} disabled={!newNom.trim()} className="btn btn-primary">Créer</button></div>
      </Modal>

      <Modal show={showRenomClasse} onClose={() => setShowRenomClasse(false)} title="✏️ Renommer la classe">
        <input autoFocus type="text" value={renomNom} onChange={e => setRenomNom(e.target.value)} onKeyDown={e => e.key === 'Enter' && renommerClasse()} style={{ padding: '.6rem .875rem', border: '1.5px solid var(--border)', borderRadius: 'var(--r-s)', background: 'var(--surface2)', color: 'var(--text)', fontFamily: 'Roboto, sans-serif', fontSize: '.88rem', outline: 'none' }} />
        <div style={{ display: 'flex', gap: '.5rem', justifyContent: 'flex-end' }}><button onClick={() => setShowRenomClasse(false)} className="btn">Annuler</button><button onClick={renommerClasse} disabled={!renomNom.trim()} className="btn btn-primary">Renommer</button></div>
      </Modal>

      <Modal show={showDelClasse} onClose={() => setShowDelClasse(false)} title={`🗑️ Supprimer ${cur?.name} ?`}>
        <div style={{ fontSize: '.85rem', color: 'var(--text2)', lineHeight: 1.6 }}>La classe <strong>{cur?.name}</strong> et toutes ses séances seront supprimées définitivement.</div>
        <div style={{ display: 'flex', gap: '.5rem', justifyContent: 'flex-end' }}><button onClick={() => setShowDelClasse(false)} className="btn">Annuler</button><button onClick={supprimerClasse} className="btn btn-danger">Supprimer</button></div>
      </Modal>

      <Modal show={showImportEleves} onClose={() => setShowImportEleves(false)} title="📋 Importer une liste d'élèves" width={480}>
        <div style={{ fontSize: '.75rem', color: 'var(--text3)' }}>Format attendu : NOM Prénom (un par ligne)</div>
        <textarea autoFocus rows={10} value={texteImport} onChange={e => setTexteImport(e.target.value)} placeholder={'DUPONT Jean\nMARTIN Sophie\nBERNARD Lucas\n…'} style={{ width: '100%', padding: '.65rem .875rem', border: '1.5px solid var(--border)', borderRadius: 'var(--r-s)', background: 'var(--surface2)', color: 'var(--text)', fontFamily: 'monospace', fontSize: '.82rem', lineHeight: 1.6, resize: 'vertical', outline: 'none' }} />
        <div style={{ display: 'flex', gap: '.5rem', justifyContent: 'flex-end' }}><button onClick={() => setShowImportEleves(false)} className="btn">Annuler</button><button onClick={importerEleves} disabled={!texteImport.trim()} className="btn btn-primary">Importer</button></div>
      </Modal>
    </>
  );
}


// ── HELPERS PARTAGÉS ÉDITEURS ────────────────────────────────────────────────
function isoDate(d) { return d.toISOString().slice(0, 10); }
function fmtDateCourt(iso) {
  if (!iso) return '—';
  return new Date(iso + 'T12:00').toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' });
}
function Modal({ title, onClose, children, width = 440 }) {
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.48)', zIndex: 9000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{ background: 'var(--surface)', borderRadius: 'var(--r)', width: '100%', maxWidth: width, boxShadow: 'var(--shadow-l)', overflow: 'hidden' }}>
        <div style={{ padding: '.875rem 1.25rem', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'var(--surface2)' }}>
          <div style={{ fontWeight: 700, fontSize: '.95rem' }}>{title}</div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.3rem', color: 'var(--text3)', lineHeight: 1 }}>×</button>
        </div>
        <div style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '.875rem' }}>
          {children}
        </div>
      </div>
    </div>
  );
}
function Field({ label, children }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '.28rem' }}>
      <label style={{ fontSize: '.7rem', fontWeight: 700, color: 'var(--text2)', textTransform: 'uppercase', letterSpacing: '.07em' }}>{label}</label>
      {children}
    </div>
  );
}
const inputStyle = { padding: '.6rem .875rem', border: '1.5px solid var(--border)', borderRadius: 'var(--r-s)', background: 'var(--surface2)', color: 'var(--text)', fontFamily: 'Roboto, sans-serif', fontSize: '.86rem', outline: 'none', transition: 'border-color .15s', width: '100%' };
const taStyle = { ...inputStyle, resize: 'vertical', minHeight: 72, lineHeight: 1.6 };
