// ── MODULE DONNÉES ────────────────────────────────────────────────────────────
function ModuleDonnees({ cpData }) {
  const [activeTab, setActiveTab] = useState('classes');
  if (!cpData) return <ModulePlaceholder icon="📊" title="Aucun fichier chargé" sub="Ouvrez un fichier JSON ClassPro depuis l'accueil." />;

  const tabs = [
    { id: 'classes', label: '👥 Classes', count: cpData.classes.length },
    { id: 'sessions', label: '📓 Séances', count: cpData.sessions.length },
    { id: 'bulletins', label: '🎓 Bulletins', count: cpData.bulletins.length },
    { id: 'edt', label: '📅 EDT', count: cpData.edt.length },
    { id: 'progs', label: '📆 Progressions', count: Object.values(cpData.progs || {}).reduce((s, v) => s + ((v?.rows?.length) || 0), 0) },
  ];

  const profile = cpData.profile;

  return (
    <>
      <div className="page-hd">
        <div>
          <div className="phd-badge">📊 Données</div>
          <div className="phd-title">Données importées</div>
          <div className="phd-sub">Lecture du JSON ClassPro v{cpData.version} · {fmtDate(cpData.date)}</div>
        </div>
      </div>
      <div className="page-content">
        {/* Tabs */}
        <div style={{ display: 'flex', gap: '.38rem', marginBottom: '1rem', borderBottom: '1px solid var(--border)', paddingBottom: '.65rem', flexWrap: 'wrap' }}>
          {tabs.map(t => (
            <button key={t.id}
              onClick={() => setActiveTab(t.id)}
              style={{
                padding: '.38rem .875rem', borderRadius: 'var(--r-s)',
                border: activeTab === t.id ? '1px solid var(--accent)' : '1px solid var(--border)',
                background: activeTab === t.id ? 'var(--accent)' : 'var(--surface)',
                color: activeTab === t.id ? '#fff' : 'var(--text2)',
                fontFamily: 'Roboto, sans-serif', fontSize: '.77rem', fontWeight: 600,
                cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '.4rem',
              }}
            >
              {t.label}
              <span style={{
                background: activeTab === t.id ? 'rgba(255,255,255,.25)' : 'var(--surface2)',
                color: activeTab === t.id ? '#fff' : 'var(--text3)',
                padding: '.06rem .42rem', borderRadius: 99, fontSize: '.65rem', fontWeight: 700,
              }}>
                {t.count}
              </span>
            </button>
          ))}
        </div>

        {/* Contenu des tabs */}
        {activeTab === 'classes' && (
          cpData.classes.length === 0
            ? <EmptyState icon="👥" label="Aucune classe enregistrée" />
            : <div style={{ display: 'flex', flexDirection: 'column', gap: '.5rem' }}>
                {cpData.classes.map((cls, i) => (
                  <div key={i} className="card" style={{ padding: '.875rem 1.1rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div style={{ width: 42, height: 42, borderRadius: 10, background: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontFamily: 'Roboto Slab, serif', fontWeight: 800, fontSize: '.88rem', flexShrink: 0 }}>
                      {(cls.nom || cls.name || '?').slice(0, 2).toUpperCase()}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 700, fontSize: '.92rem' }}>{cls.nom || cls.name || 'Classe sans nom'}</div>
                      <div style={{ fontSize: '.72rem', color: 'var(--text2)', marginTop: '.08rem' }}>
                        {cls.effectif || cls.eleves?.length || 0} élève(s)
                        {cls.niveau ? ` · ${cls.niveau}` : ''}
                      </div>
                    </div>
                    <div className="pill pill-accent">{cls.annee || profile?.annee || '—'}</div>
                  </div>
                ))}
              </div>
        )}

        {activeTab === 'sessions' && (
          cpData.sessions.length === 0
            ? <EmptyState icon="📓" label="Aucune séance enregistrée" />
            : <div style={{ display: 'flex', flexDirection: 'column', gap: '.38rem' }}>
                {cpData.sessions.slice(0, 50).map((s, i) => (
                  <div key={i} className="data-row">
                    <span className="data-row-label">{s.date || s.dateSeance || '—'}</span>
                    <span className="data-row-value" style={{ flex: 1 }}>{s.titre || s.objectif || s.title || 'Séance'}</span>
                    {s.classe && <span className="pill">{s.classe}</span>}
                  </div>
                ))}
                {cpData.sessions.length > 50 && <div style={{ fontSize: '.75rem', color: 'var(--text3)', textAlign: 'center', padding: '.5rem' }}>… et {cpData.sessions.length - 50} séances de plus</div>}
              </div>
        )}

        {activeTab === 'bulletins' && (
          cpData.bulletins.length === 0
            ? <EmptyState icon="🎓" label="Aucun bulletin importé" />
            : <div style={{ display: 'flex', flexDirection: 'column', gap: '.38rem' }}>
                {cpData.bulletins.slice(0, 50).map((b, i) => (
                  <div key={i} className="data-row">
                    <span className="data-row-label">{b.name || 'Élève'}</span>
                    <span className="data-row-value" style={{ flex: 1 }}>
                      Moy. {b.generalAverage ?? '—'}{b.generalAverageT1 ? ` · T1: ${b.generalAverageT1}` : ''}
                    </span>
                    <span className="pill">T{b.trimester || '?'}</span>
                  </div>
                ))}
              </div>
        )}

        {activeTab === 'edt' && (
          cpData.edt.length === 0
            ? <EmptyState icon="📅" label="Aucun créneau EDT" />
            : <div style={{ display: 'flex', flexDirection: 'column', gap: '.38rem' }}>
                {cpData.edt.map((e, i) => {
                  const jours = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi'];
                  return (
                    <div key={i} className="data-row">
                      <span className="data-row-label">{jours[e.day] || `J${e.day}`}</span>
                      <span className="data-row-value" style={{ flex: 1 }}>{e.title || 'Cours'}</span>
                      <span className="pill">{String(e.startH || 0).padStart(2,'0')}h{String(e.startM || 0).padStart(2,'0')} → {String(e.endH || 0).padStart(2,'0')}h{String(e.endM || 0).padStart(2,'0')}</span>
                    </div>
                  );
                })}
              </div>
        )}

        {activeTab === 'progs' && (
          Object.keys(cpData.progs || {}).length === 0
            ? <EmptyState icon="📆" label="Aucune progression enregistrée" />
            : <div style={{ display: 'flex', flexDirection: 'column', gap: '.38rem' }}>
                {Object.entries(cpData.progs).map(([clsId, prog]) => (
                  <div key={clsId} className="data-row">
                    <span className="data-row-label">{clsId}</span>
                    <span className="data-row-value" style={{ flex: 1 }}>{prog?.rows?.length || 0} séquence(s)</span>
                    <span className="pill">{prog?.cols?.length || 0} col.</span>
                  </div>
                ))}
              </div>
        )}
      </div>
    </>
  );
}

// ── MODULE PLACEHOLDER (à venir) ─────────────────────────────────────────────
function ModulePlaceholder({ icon, title, sub, soon = false }) {
  return (
    <>
      <div className="page-hd">
        <div>
          <div className="phd-badge">{icon} Module</div>
          <div className="phd-title">{title}</div>
          <div className="phd-sub">{sub || 'Importez un fichier JSON pour accéder à ce module.'}</div>
        </div>
      </div>
      <div className="page-content">
        <div className="module-placeholder">
          <div className="module-placeholder-icon">{icon}</div>
          <div className="module-placeholder-title">{title}</div>
          <div className="module-placeholder-sub">{sub || "Importez un fichier JSON ClassPro depuis l'accueil pour accéder à ce module."}</div>
          {soon && <div className="badge-soon">🔧 Bientôt disponible</div>}
          {!soon && (
            <div style={{ marginTop: '1rem', display: 'flex', alignItems: 'center', gap: '.5rem', padding: '.6rem 1rem', borderRadius: 'var(--r-s)', background: 'rgba(59,91,219,.08)', border: '1px solid rgba(59,91,219,.2)', color: 'var(--accent)', fontSize: '.82rem', fontWeight: 500 }}>
              📂 Accueil → Ouvrir un fichier ClassPro
            </div>
          )}
        </div>
      </div>
    </>
  );
}

function EmptyState({ icon, label }) {
  return (
    <div className="empty">
      <div className="empty-icon">{icon}</div>
      <div>{label}</div>
    </div>
  );
}
