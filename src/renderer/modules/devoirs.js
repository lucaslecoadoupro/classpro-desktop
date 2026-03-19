function ModuleDevoirs({ cpData, onDataChange }) {
  const classes = cpData?.classes || [];
  const [devoirs, setDevoirs] = useState(() => cpData?.devoirs || []);
  const [selCls, setSelCls] = useState(() => classes[0]?.id || null);
  const [showAdd, setShowAdd] = useState(false);
  const [showDelDv, setShowDelDv] = useState(null); // id devoir à supprimer
  const [form, setForm] = useState({ titre: '', dateRendu: '', classId: '' });

  useEffect(() => { onDataChange('cdc-devoirs', devoirs); }, [devoirs]);

  const selClass = classes.find(c => c.id === selCls);
  const clsDev = devoirs.filter(d => d.classId === selCls);

  const addDevoir = () => {
    if (!form.titre.trim() || !form.classId) return;
    const cls = classes.find(c => c.id === form.classId);
    if (!cls) return;
    const dv = {
      id: 'dv' + Date.now(),
      titre: form.titre.trim(),
      dateRendu: form.dateRendu,
      classId: form.classId,
      className: cls.name,
      eleves: (cls.eleves || []).map(e => ({ eleveid: e.id, elevenom: e.nom, statut: 'nonrendu', relances: 0 })),
    };
    setDevoirs(p => [...p, dv]);
    setSelCls(form.classId);
    setShowAdd(false);
    setForm({ titre: '', dateRendu: '', classId: '' });
  };

  const setStatut = (dvId, eleveId, statut) => {
    setDevoirs(p => p.map(d => d.id !== dvId ? d : { ...d, eleves: d.eleves.map(e => e.eleveid === eleveId ? { ...e, statut } : e) }));
  };

  const deleteDevoir = (id) => {
    setDevoirs(p => p.filter(d => d.id !== id));
    setShowDelDv(null);
  };

  if (!cpData) return <ModulePlaceholder icon="📋" title="Travaux non rendus" sub="Ouvrez d'abord un fichier ClassPro." />;

  return (
    <>
      <div className="page-hd">
        <div>
          <div className="phd-badge">📋 Travaux</div>
          <div className="phd-title">Suivi des travaux non rendus</div>
          <div className="phd-sub">{selClass ? `${selClass.name} · ${clsDev.length} devoir(s)` : 'Sélectionnez une classe'}</div>
        </div>
        <div className="phd-actions">
          <button className="btn btn-ghost" onClick={() => { setForm({ titre: '', dateRendu: '', classId: selCls || '' }); setShowAdd(true); }}>+ Devoir</button>
        </div>
        {clsDev.length > 0 && (
          <div className="phd-stats">
            {[
              { label: 'Non rendus', value: clsDev.reduce((s, d) => s + (d.eleves || []).filter(e => e.statut === 'nonrendu').length, 0), red: true },
              { label: 'En retard', value: clsDev.reduce((s, d) => s + (d.eleves || []).filter(e => e.statut === 'retard').length, 0) },
              { label: 'Rendus', value: clsDev.reduce((s, d) => s + (d.eleves || []).filter(e => e.statut === 'rendu').length, 0) },
              { label: 'Devoirs', value: clsDev.length },
            ].map(s => (
              <div key={s.label} className="phstat">
                <div className="phstat-label">{s.label}</div>
                <div className={`phstat-value ${s.red && s.value > 0 ? 'red' : ''}`}>{s.value}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div style={{ display: 'flex', flex: 1, overflow: 'hidden', minHeight: 0 }}>

        {/* Sidebar classes */}
        <div style={{ width: 200, flexShrink: 0, borderRight: '1px solid var(--border)', background: 'var(--surface2)', overflowY: 'auto' }}>
          <div style={{ padding: '.45rem .65rem', fontSize: '.6rem', fontWeight: 700, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '.07em', borderBottom: '1px solid var(--border)' }}>Classes</div>
          {classes.length === 0 && <div style={{ padding: '.875rem', fontSize: '.76rem', color: 'var(--text3)', fontStyle: 'italic' }}>Aucune classe</div>}
          {classes.map(c => {
            const nb = devoirs.filter(d => d.classId === c.id && (d.eleves || []).some(e => e.statut === 'nonrendu' || e.statut === 'retard')).length;
            return (
              <button key={c.id}
                onClick={() => setSelCls(c.id)}
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', padding: '.55rem .875rem', border: 'none', borderBottom: '1px solid var(--border)', borderLeft: `3px solid ${selCls === c.id ? 'var(--accent)' : 'transparent'}`, background: selCls === c.id ? 'var(--surface)' : 'none', color: selCls === c.id ? 'var(--accent)' : 'var(--text2)', fontFamily: 'Roboto,sans-serif', fontSize: '.8rem', fontWeight: selCls === c.id ? 700 : 500, cursor: 'pointer', transition: 'all .13s', textAlign: 'left' }}>
                {c.name}
                {nb > 0 && <span style={{ background: 'var(--danger)', color: '#fff', borderRadius: 99, fontSize: '.6rem', fontWeight: 700, padding: '.08rem .42rem' }}>{nb}</span>}
              </button>
            );
          })}
        </div>

        {/* Zone devoirs */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '1rem 1.25rem', display: 'flex', flexDirection: 'column', gap: '.75rem' }}>
          {!selCls && <div style={{ color: 'var(--text3)', textAlign: 'center', padding: '3rem', fontSize: '.85rem' }}>← Sélectionnez une classe</div>}
          {selCls && clsDev.length === 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '.75rem', padding: '3rem', color: 'var(--text3)' }}>
              <div style={{ fontSize: '2rem', opacity: .2 }}>📋</div>
              <div style={{ fontWeight: 700, color: 'var(--text2)' }}>Aucun devoir pour cette classe</div>
              <button className="btn btn-primary" onClick={() => { setForm({ titre: '', dateRendu: '', classId: selCls }); setShowAdd(true); }}>+ Ajouter un devoir</button>
            </div>
          )}

          {clsDev.map(dv => {
            const nbNR = (dv.eleves || []).filter(e => e.statut === 'nonrendu').length;
            const nbRt = (dv.eleves || []).filter(e => e.statut === 'retard').length;
            return (
              <div key={dv.id} style={{ background: 'var(--surface)', border: '1.5px solid var(--border)', borderRadius: 'var(--r)', overflow: 'hidden', boxShadow: 'var(--shadow-xs)' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '.5rem', padding: '.75rem 1rem', background: 'var(--surface2)', borderBottom: '1px solid var(--border)' }}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '.9rem' }}>{dv.titre}</div>
                    <div style={{ fontSize: '.7rem', color: 'var(--text2)', marginTop: '.08rem', display: 'flex', gap: '.6rem' }}>
                      {dv.dateRendu && <span>📅 {fmtDateCourt(dv.dateRendu)}</span>}
                      {nbNR > 0 && <span style={{ color: 'var(--danger)', fontWeight: 600 }}>✗ {nbNR} non rendu{nbNR > 1 ? 's' : ''}</span>}
                      {nbRt > 0 && <span style={{ color: 'var(--warning)', fontWeight: 600 }}>⏳ {nbRt} en retard</span>}
                    </div>
                  </div>
                  <button onClick={() => setShowDelDv(dv.id)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text3)', fontSize: '.85rem', padding: '.2rem .4rem', borderRadius: 'var(--r-xs)', flexShrink: 0 }} title="Supprimer ce devoir">🗑️</button>
                </div>
                <div style={{ padding: '.6rem 1rem', display: 'flex', flexDirection: 'column', gap: '.28rem' }}>
                  {(dv.eleves || []).map(el => (
                    <div key={el.eleveid} style={{ display: 'flex', alignItems: 'center', gap: '.5rem', padding: '.28rem .4rem', borderRadius: 'var(--r-xs)', fontSize: '.8rem' }}>
                      <span style={{ flex: 1, fontWeight: 500 }}>{el.elevenom}</span>
                      <div style={{ display: 'flex', gap: '.22rem' }}>
                        {STATUTS_DV.map(s => (
                          <button key={s.id}
                            onClick={() => setStatut(dv.id, el.eleveid, s.id)}
                            style={{ padding: '.18rem .52rem', borderRadius: 99, cursor: 'pointer', border: `1px solid ${el.statut === s.id ? s.border : 'var(--border)'}`, background: el.statut === s.id ? s.bg : 'var(--surface2)', color: el.statut === s.id ? s.color : 'var(--text3)', fontFamily: 'Roboto,sans-serif', fontSize: '.68rem', fontWeight: el.statut === s.id ? 700 : 400, transition: 'all .13s', opacity: el.statut === s.id ? 1 : .5 }}>
                            {s.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Modal nouveau devoir ── */}
      {showAdd && (
        <Modal title="📋 Nouveau devoir" onClose={() => setShowAdd(false)}>
          <Field label="Titre du devoir *">
            <input autoFocus value={form.titre} onChange={e => setForm(f => ({ ...f, titre: e.target.value }))}
              placeholder="Ex : Exercice p.45, Rédaction…" style={inputStyle} />
          </Field>
          <Field label="Classe *">
            <select value={form.classId} onChange={e => setForm(f => ({ ...f, classId: e.target.value }))} style={inputStyle}>
              <option value="">— Choisir une classe —</option>
              {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </Field>
          <Field label="Date de rendu prévue">
            <input type="date" value={form.dateRendu} onChange={e => setForm(f => ({ ...f, dateRendu: e.target.value }))} style={inputStyle} />
          </Field>
          <div style={{ display: 'flex', gap: '.5rem', justifyContent: 'flex-end' }}>
            <button onClick={() => setShowAdd(false)} className="btn">Annuler</button>
            <button onClick={addDevoir} className="btn btn-primary" disabled={!form.titre.trim() || !form.classId}>Créer</button>
          </div>
        </Modal>
      )}

      {/* ── Modal suppression devoir ── */}
      {showDelDv && (
        <Modal title="🗑️ Supprimer ce devoir ?" onClose={() => setShowDelDv(null)} width={380}>
          <div style={{ fontSize: '.88rem', color: 'var(--text2)', lineHeight: 1.6 }}>
            <strong>"{devoirs.find(d => d.id === showDelDv)?.titre}"</strong> sera définitivement supprimé.
            <br /><span style={{ fontSize: '.78rem', color: 'var(--text3)' }}>Cette action est irréversible.</span>
          </div>
          <div style={{ display: 'flex', gap: '.5rem', justifyContent: 'flex-end' }}>
            <button onClick={() => setShowDelDv(null)} className="btn">Annuler</button>
            <button onClick={() => deleteDevoir(showDelDv)} className="btn btn-danger">Supprimer</button>
          </div>
        </Modal>
      )}
    </>
  );
}

// ── MODULE PROGRESSION ANNUELLE ───────────────────────────────────────────────
const COLS_DEFAULT = [
  { id: 'seq',       label: 'N°',           width: 50,  type: 'text' },
  { id: 'titre',     label: 'Titre',        width: 200, type: 'text' },
  { id: 'objectifs', label: 'Objectifs',    width: 220, type: 'text' },
  { id: 'support',   label: 'Support',      width: 160, type: 'text' },
  { id: 'debut',     label: 'Début',        width: 110, type: 'date' },
  { id: 'fin',       label: 'Fin',          width: 110, type: 'date' },
  { id: 'duree',     label: 'Durée (h)',    width: 90,  type: 'text' },
  { id: 'eval',      label: 'Évaluation',   width: 140, type: 'text' },
  { id: 'remarques', label: 'Remarques',    width: 200, type: 'text' },
];

function makeRow(cols) {
  const r = { id: 'r' + Date.now() + Math.random().toString(36).slice(2) };
  cols.forEach(c => { r[c.id] = ''; });
  return r;
}
