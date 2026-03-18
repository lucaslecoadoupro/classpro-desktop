/* ═══════════════════════════════════════════════════════════════════════════
   ClassPro Desktop — app.js
   Renderer React principal
   ═══════════════════════════════════════════════════════════════════════════ */
const { useState, useEffect, useCallback, useMemo } = React;

// ── Logo SVG (identique à ClassPro) ─────────────────────────────────────────
const LOGO_SVG = `<svg width="34" height="38" viewBox="0 0 100 110" xmlns="http://www.w3.org/2000/svg"><defs><linearGradient id="sf" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#1a1a1a"/><stop offset="100%" stop-color="#0d0d0d"/></linearGradient><linearGradient id="gs" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#d4b483"/><stop offset="100%" stop-color="#a8864e"/></linearGradient><linearGradient id="bpl" x1="1" y1="0" x2="0" y2="0"><stop offset="0%" stop-color="#ffffff"/><stop offset="100%" stop-color="#c8c8c8"/></linearGradient><linearGradient id="bpr" x1="0" y1="0" x2="1" y2="0"><stop offset="0%" stop-color="#ffffff"/><stop offset="100%" stop-color="#c8c8c8"/></linearGradient></defs><path d="M50 8 L84 22 L84 58 Q84 80 50 96 Q16 80 16 58 L16 22 Z" fill="url(#sf)" stroke="url(#gs)" stroke-width="2.8" stroke-linejoin="round"/><path d="M50 63 Q40 60 30 63 L30 44 Q40 41 50 44 Z" fill="url(#bpl)" stroke="#b8b8b8" stroke-width="0.4"/><path d="M50 63 Q60 60 70 63 L70 44 Q60 41 50 44 Z" fill="url(#bpr)" stroke="#b8b8b8" stroke-width="0.4"/><line x1="50" y1="44" x2="50" y2="63" stroke="#a0a0a0" stroke-width="1.2"/><path d="M30 63 Q40 67 50 65 Q60 67 70 63" fill="none" stroke="#b0b0b0" stroke-width="1"/><ellipse cx="50" cy="66" rx="20" ry="2" fill="#000" opacity="0.25"/><line x1="50" y1="16" x2="50" y2="26" stroke="#d4b483" stroke-width="1.6" stroke-linecap="round"/><line x1="44" y1="21" x2="56" y2="21" stroke="#d4b483" stroke-width="1.6" stroke-linecap="round"/></svg>`;

// ── Navigation ───────────────────────────────────────────────────────────────
const NAV = [
  { section: 'Vue générale', items: [
    { id: 'accueil',      icon: '🏠', label: 'Accueil' },
    { id: 'donnees',      icon: '📊', label: 'Données importées' },
  ]},
  { section: 'Modules pédagogiques', items: [
    { id: 'suivi',        icon: '👥', label: 'Suivi de classe' },
    { id: 'carnet',       icon: '📓', label: 'Carnet de bord' },
    { id: 'devoirs',      icon: '📋', label: 'Travaux non rendus' },
    { id: 'progression',  icon: '📆', label: 'Progression annuelle' },
    { id: 'conseil',      icon: '🎓', label: 'Conseil de classe' },
  ]},
  { section: 'Génération PDF', items: [
    { id: 'pdf-progression', icon: '📄', label: 'PDF Progression' },
    { id: 'pdf-carnet',      icon: '📄', label: 'PDF Carnet de bord' },
    { id: 'pdf-bulletins',   icon: '📄', label: 'PDF Bulletins' },
  ]},
];

// ── Helpers ──────────────────────────────────────────────────────────────────
function parseClassProJson(data) {
  // Le JSON ClassPro a la forme { version, date, entries: { 'cdc-profile': '...', ... } }
  if (!data || !data.entries) return null;
  const entries = data.entries;
  const parse = (key) => { try { return JSON.parse(entries[key] || 'null'); } catch { return null; } };
  return {
    version: data.version || '?',
    date: data.date || null,
    profile:     parse('cdc-profile'),
    theme:       entries['cdc-theme'] || 'light',
    classes:     parse('sc-classes')   || [],
    sessions:    parse('sc-sessions')  || [],
    devoirs:     parse('cdc-devoirs')  || [],
    fiches:      (() => { const f = parse('cdc-fiches'); return (f && !Array.isArray(f)) ? f : {}; })(),
    plans:       parse('cdc-plans')    || [],
    progs:       parse('cdc-progs')    || [],
    programmes:  parse('cdc-programmes') || [],
    edt:         parse('cdc-edt')      || [],
    liens:       parse('cdc-liens')    || [],
    bulletins:   parse('cdc-data')     || [],
    dashNotes:   parse('dash-notes')   || [],
    dashTaches:  parse('dash-taches')  || [],
    _raw: data, // on garde le brut pour le re-export
  };
}

function fmtDate(isoStr) {
  if (!isoStr) return '—';
  return new Date(isoStr).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function basename(path) {
  return path ? path.split(/[\\/]/).pop() : '';
}

// ── Toast system ─────────────────────────────────────────────────────────────
let _toastId = 0;
function useToast() {
  const [toasts, setToasts] = useState([]);
  const push = useCallback((msg, type = 'info', duration = 3000) => {
    const id = ++_toastId;
    setToasts(t => [...t, { id, msg, type }]);
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), duration);
  }, []);
  return { toasts, push };
}

// ── COMPOSANT TOAST ──────────────────────────────────────────────────────────
function ToastStack({ toasts }) {
  if (!toasts.length) return null;
  const icons = { success: '✅', error: '❌', info: 'ℹ️' };
  return (
    <div className="toast-wrap">
      {toasts.map(t => (
        <div key={t.id} className={`toast ${t.type}`}>
          <span>{icons[t.type] || 'ℹ️'}</span>
          <span>{t.msg}</span>
        </div>
      ))}
    </div>
  );
}

// ── SIDEBAR ───────────────────────────────────────────────────────────────────
function Sidebar({ activeModule, onNavigate, cpData, filePath, appVersion }) {
  const profile = cpData?.profile;
  const fileName = filePath ? basename(filePath) : null;

  return (
    <div className="sidebar">
      <div className="sb-logo">
        <div className="sb-logo-icon" dangerouslySetInnerHTML={{ __html: LOGO_SVG }} />
        <div className="sb-logo-text">
          ClassPro Desktop
          <span>Logiciel parent</span>
        </div>
      </div>

      <div className="sb-nav">
        {NAV.map(section => (
          <div key={section.section}>
            <div className="sb-section-label">{section.section}</div>
            {section.items.map(item => (
              <button
                key={item.id}
                className={`sb-item ${activeModule === item.id ? 'on' : ''}`}
                onClick={() => onNavigate(item.id)}
              >
                <span className="sb-item-icon">{item.icon}</span>
                {item.label}
              </button>
            ))}
          </div>
        ))}
      </div>

      <div className="sb-footer">
        {fileName && (
          <div className="sb-file-info">
            <div className="sb-file-name">📂 {fileName}</div>
            {profile && (
              <div className="sb-file-meta">
                {profile.prenom} {profile.nom} · {profile.etablissement || 'Établissement'}
              </div>
            )}
          </div>
        )}
        <div className="sb-version">ClassPro Desktop v{appVersion}</div>
      </div>
    </div>
  );
}

// ── MODULE ACCUEIL ───────────────────────────────────────────────────────────
function ModuleAccueil({ onOpen, onNavigate, cpData, filePath }) {
  const profile = cpData?.profile;

  // Historique récent (localStorage de l'app Desktop)
  const [recent, setRecent] = useState(() => {
    try { return JSON.parse(localStorage.getItem('cpd-recent') || '[]'); } catch { return []; }
  });

  const openJson = async () => {
    const result = await window.cpd.openJson();
    if (result?.ok) onOpen(result);
  };

  if (cpData) {
    // Fichier déjà ouvert → dashboard résumé
    const stats = [
      { label: 'Classes', value: cpData.classes.length },
      { label: 'Séances', value: cpData.sessions.length },
      { label: 'Devoirs', value: cpData.devoirs.length },
      { label: 'Bulletins', value: cpData.bulletins.length },
    ];
    return (
      <>
        <div className="page-hd">
          <div>
            <div className="phd-badge">🏠 Accueil</div>
            <div className="phd-title">
              {profile ? `${profile.prenom} ${profile.nom}` : 'Données importées'}
            </div>
            <div className="phd-sub">
              {profile?.etablissement || '—'} · Année {profile?.annee || '—'} · JSON v{cpData.version}
            </div>
          </div>
          <div className="phd-actions">
            <button className="btn btn-ghost" onClick={openJson}>📂 Changer de fichier</button>
          </div>
          <div className="phd-stats">
            {stats.map(s => (
              <div key={s.label} className="phstat">
                <div className="phstat-label">{s.label}</div>
                <div className="phstat-value">{s.value}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="page-content">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>

            {/* Profil enseignant */}
            <div className="card">
              <div className="card-hd">
                <div className="card-title">👤 Profil enseignant</div>
              </div>
              <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: '.42rem' }}>
                {[
                  ['Prénom', profile?.prenom],
                  ['Nom', profile?.nom],
                  ['Établissement', profile?.etablissement],
                  ['Année scolaire', profile?.annee],
                  ['Niveaux', (profile?.niveaux || []).join(', ') || '—'],
                ].map(([label, val]) => (
                  <div key={label} className="data-row">
                    <span className="data-row-label">{label}</span>
                    <span className="data-row-value">{val || '—'}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Résumé modules */}
            <div className="card">
              <div className="card-hd">
                <div className="card-title">📦 Contenu du fichier</div>
              </div>
              <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: '.42rem' }}>
                {[
                  ['Classes enregistrées', cpData.classes.length],
                  ['Séances (carnet)', cpData.sessions.length],
                  ['Devoirs / TNR', cpData.devoirs.length],
                  ['Fiches séance', cpData.fiches.length],
                  ['Plans de classe', cpData.plans.length],
                  ['Progressions', cpData.progs.length],
                  ['Bulletins (conseil)', cpData.bulletins.length],
                  ['Créneaux EDT', cpData.edt.length],
                ].map(([label, val]) => (
                  <div key={label} className="data-row">
                    <span className="data-row-label">{label}</span>
                    <span className="data-row-value" style={{ color: val > 0 ? 'var(--accent)' : 'var(--text3)' }}>
                      {val}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Raccourcis modules */}
          <div className="card">
            <div className="card-hd">
              <div className="card-title">⚡ Accès rapide</div>
            </div>
            <div className="card-body" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '.6rem' }}>
              {[
                { id: 'donnees', icon: '📊', label: 'Voir les données' },
                { id: 'suivi', icon: '👥', label: 'Suivi de classe' },
                { id: 'carnet', icon: '📓', label: 'Carnet de bord' },
                { id: 'pdf-progression', icon: '📄', label: 'PDF Progression' },
                { id: 'pdf-carnet', icon: '📄', label: 'PDF Carnet' },
              ].map(item => (
                <button key={item.id}
                  onClick={() => onNavigate(item.id)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '.5rem',
                    padding: '.6rem .875rem', borderRadius: 'var(--r-s)',
                    border: '1px solid var(--border)', background: 'var(--surface2)',
                    cursor: 'pointer', transition: 'all .15s', textAlign: 'left',
                    fontSize: '.8rem', fontWeight: 600, color: 'var(--text)',
                    fontFamily: 'Roboto, sans-serif',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--accent)'; e.currentTarget.style.color = 'var(--accent)'; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text)'; }}
                >
                  <span>{item.icon}</span> {item.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </>
    );
  }

  // Pas de fichier — écran de bienvenue
  return (
    <>
      <div className="page-hd" style={{ minHeight: 80 }}>
        <div>
          <div className="phd-badge">✨ Bienvenue</div>
          <div className="phd-title">ClassPro Desktop</div>
          <div className="phd-sub">Logiciel parent de ClassPro · Éditeur &amp; générateur PDF</div>
        </div>
      </div>
      <div className="page-content">
        <div className="welcome-screen" style={{ minHeight: 'calc(100vh - 200px)' }}>
          <div className="welcome-logo-wrap">
            <div dangerouslySetInnerHTML={{ __html: LOGO_SVG.replace('width="34"', 'width="64"').replace('height="38"', 'height="72"') }} />
            <div className="welcome-title">ClassPro Desktop</div>
            <div className="welcome-sub">Importez votre fichier JSON ClassPro pour commencer</div>
          </div>

          <div className="welcome-actions">
            <button className="welcome-btn primary" onClick={openJson}>
              <div className="welcome-btn-icon">📂</div>
              <div>
                <div className="welcome-btn-label">Ouvrir un fichier ClassPro</div>
                <div className="welcome-btn-hint">Importez le JSON exporté depuis ClassPro sur votre clé</div>
              </div>
            </button>
            <button className="welcome-btn" style={{ gridColumn: '1 / -1', opacity: .5, cursor: 'default' }}>
              <div className="welcome-btn-icon">✨</div>
              <div>
                <div className="welcome-btn-label" style={{ color: 'var(--text)' }}>Nouveau fichier</div>
                <div className="welcome-btn-hint">Créer un profil ClassPro sans clé USB — <em>bientôt disponible</em></div>
              </div>
            </button>
          </div>

          {recent.length > 0 && (
            <div className="welcome-recent">
              <div className="welcome-recent-title">🕐 Fichiers récents</div>
              {recent.slice(0, 4).map(r => (
                <div key={r.path} className="recent-item" onClick={async () => {
                  // On tente de rouvrir depuis l'IPC (le chemin est gardé en mémoire)
                  const result = await window.cpd.openJson();
                  if (result?.ok) onOpen(result);
                }}>
                  <span className="recent-item-icon">📄</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div className="recent-item-name">{r.name}</div>
                    <div className="recent-item-path">{r.path}</div>
                  </div>
                  <div className="recent-item-date">{r.dateStr}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}

// ── MODULE DONNÉES ────────────────────────────────────────────────────────────
function ModuleDonnees({ cpData }) {
  const [activeTab, setActiveTab] = useState('classes');
  if (!cpData) return <ModulePlaceholder icon="📊" title="Aucun fichier chargé" sub="Ouvrez un fichier JSON ClassPro depuis l'accueil." />;

  const tabs = [
    { id: 'classes', label: '👥 Classes', count: cpData.classes.length },
    { id: 'sessions', label: '📓 Séances', count: cpData.sessions.length },
    { id: 'bulletins', label: '🎓 Bulletins', count: cpData.bulletins.length },
    { id: 'edt', label: '📅 EDT', count: cpData.edt.length },
    { id: 'progs', label: '📆 Progressions', count: cpData.progs.length },
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
          cpData.progs.length === 0
            ? <EmptyState icon="📆" label="Aucune progression enregistrée" />
            : <div style={{ display: 'flex', flexDirection: 'column', gap: '.38rem' }}>
                {cpData.progs.map((p, i) => (
                  <div key={i} className="data-row">
                    <span className="data-row-label">{p.titre || p.title || 'Séquence'}</span>
                    <span className="data-row-value" style={{ flex: 1 }}>{p.objectif || p.description || '—'}</span>
                    {p.classe && <span className="pill">{p.classe}</span>}
                  </div>
                ))}
              </div>
        )}
      </div>
    </>
  );
}

// ── MODULE PLACEHOLDER (à venir) ─────────────────────────────────────────────
function ModulePlaceholder({ icon, title, sub, soon = true }) {
  return (
    <>
      <div className="page-hd">
        <div>
          <div className="phd-badge">{icon} Module</div>
          <div className="phd-title">{title}</div>
          <div className="phd-sub">{sub || 'En cours de développement'}</div>
        </div>
      </div>
      <div className="page-content">
        <div className="module-placeholder">
          <div className="module-placeholder-icon">{icon}</div>
          <div className="module-placeholder-title">{title}</div>
          <div className="module-placeholder-sub">{sub || 'Ce module arrive dans une prochaine mise à jour de ClassPro Desktop.'}</div>
          {soon && <div className="badge-soon">🔧 Bientôt disponible</div>}
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

  const cur = classes.find(c => c.id === selId) || null;
  const curSess = useMemo(() =>
    (sessions[selId] || []).slice().sort((a, b) => a.date > b.date ? 1 : -1),
    [sessions, selId]
  );

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
              <div style={{ flex: 1, overflow: 'auto' }}>
                {curSess.length === 0 ? (
                  <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text3)', fontSize: '.82rem' }}>
                    Aucune séance · <button onClick={() => setShowNewSeance(true)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--accent)', fontWeight: 700 }}>+ Ajouter une séance</button>
                  </div>
                ) : cur.eleves.length === 0 ? (
                  <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text3)', fontSize: '.82rem' }}>
                    Aucun élève · <button onClick={() => setVueSuivi('eleves')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--accent)', fontWeight: 700 }}>Gérer les élèves →</button>
                  </div>
                ) : (
                  <table style={{ borderCollapse: 'collapse', minWidth: '100%', fontSize: '.75rem' }}>
                    <thead>
                      <tr style={{ background: 'var(--surface2)', position: 'sticky', top: 0, zIndex: 10 }}>
                        <th style={{ padding: '.55rem .875rem', textAlign: 'left', fontWeight: 700, color: 'var(--text2)', borderBottom: '1px solid var(--border)', minWidth: 140 }}>Élève</th>
                        {curSess.map(s => (
                          <th key={s.id} style={{ padding: '.45rem .5rem', textAlign: 'center', fontWeight: 600, color: 'var(--text2)', borderBottom: '1px solid var(--border)', borderLeft: '1px solid var(--border)', minWidth: 90, position: 'relative' }}>
                            <div style={{ fontSize: '.68rem', fontWeight: 700 }}>{s.date ? new Date(s.date + 'T12:00').toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' }) : '—'}</div>
                            <div style={{ fontSize: '.62rem', color: 'var(--text3)', fontWeight: 400 }}>{s.label}</div>
                            <button onClick={() => delSeance(s.id)} style={{ position: 'absolute', top: 2, right: 2, background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text3)', fontSize: '.6rem', opacity: .5 }} title="Supprimer">×</button>
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {cur.eleves.map((el, i) => (
                        <tr key={el.id} style={{ background: i % 2 === 0 ? 'var(--surface)' : 'var(--surface2)' }}>
                          <td style={{ padding: '.45rem .875rem', fontWeight: 600, borderBottom: '1px solid var(--border)', whiteSpace: 'nowrap' }}>
                            <button onClick={() => setBilanEl(el)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text)', fontWeight: 600, fontSize: '.78rem', textDecoration: 'underline dotted', textUnderlineOffset: 3 }}>{el.nom}</button>
                          </td>
                          {curSess.map(s => (
                            <td key={s.id} style={{ padding: '.3rem .35rem', borderBottom: '1px solid var(--border)', borderLeft: '1px solid var(--border)', textAlign: 'center' }}>
                              <div style={{ display: 'flex', gap: '.1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
                                {OBS.map(o => {
                                  const active = hasObs(s.id, el.id, o.id);
                                  return (
                                    <button key={o.id} onClick={() => toggleObs(s.id, el.id, o.id)} title={o.label} style={{ width: 22, height: 22, borderRadius: 4, border: `1px solid ${active ? obsColor(o.k) : 'var(--border)'}`, background: active ? obsBg(o.k) : 'transparent', cursor: 'pointer', fontSize: '.72rem', opacity: active ? 1 : .3, transition: 'all .12s' }}>
                                      {o.emoji}
                                    </button>
                                  );
                                })}
                              </div>
                            </td>
                          ))}
                        </tr>
                      ))}
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

// ── MODULE CARNET DE BORD ─────────────────────────────────────────────────────
const CHAMPS_FICHE = [
  { key: 'objectif',  label: '🎯 Objectif(s) de la séance',   placeholder: 'Ex : Comprendre le présent de l\'indicatif…', rows: 2 },
  { key: 'activite',  label: '📋 Activité / déroulé',          placeholder: 'Ex : Correction exercices, lecture texte p.42, jeu de rôle…', rows: 3 },
  { key: 'devoirs',   label: '📝 Devoirs donnés',              placeholder: 'Ex : Apprendre vocabulaire p.45, exercice 3…', rows: 2 },
  { key: 'aRevoir',   label: '🔁 Points à revoir',             placeholder: 'Ex : Revoir la conjugaison du verbe ser…', rows: 2 },
  { key: 'documents', label: '📎 Documents / ressources',      placeholder: 'Ex : Fiche de vocabulaire, vidéo YouTube…', rows: 2 },
  { key: 'incidents', label: '⚠️ Incidents / observations',    placeholder: 'Ex : Retard de Thomas, bruit excessif…', rows: 2 },
];

function isoDate(d) {
  return d.toISOString().slice(0, 10);
}

function ModuleCarnet({ cpData, onDataChange }) {
  const [selCls, setSelCls] = useState(null);
  const [selFicheId, setSelFicheId] = useState(null);
  const [fiches, setFiches] = useState(() => cpData?.fiches || {});
  const [draft, setDraft] = useState(null);
  const [savedOk, setSavedOk] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [newForm, setNewForm] = useState({ date: isoDate(new Date()), titre: '' });
  const [showDel, setShowDel] = useState(false);
  const [search, setSearch] = useState('');

  const classes = cpData?.classes || [];

  // Sync fiches → cpData._raw pour le re-export JSON
  useEffect(() => {
    if (onDataChange) onDataChange('cdc-fiches', fiches);
  }, [fiches]);

  // Fiches de la classe sélectionnée, triées par date décroissante
  const clsFiches = useMemo(() => {
    const list = fiches[selCls] || [];
    const filtered = search.trim()
      ? list.filter(f =>
          f.titre?.toLowerCase().includes(search.toLowerCase()) ||
          f.objectif?.toLowerCase().includes(search.toLowerCase())
        )
      : list;
    return [...filtered].sort((a, b) => (b.date || '').localeCompare(a.date || ''));
  }, [fiches, selCls, search]);

  const ficheActive = selFicheId ? (fiches[selCls] || []).find(f => f.id === selFicheId) : null;

  // Quand on change de fiche, initialise le brouillon
  useEffect(() => {
    setDraft(ficheActive ? { ...ficheActive } : null);
    setSavedOk(false);
  }, [selFicheId, selCls]);

  // Auto-select première classe si aucune sélectionnée
  useEffect(() => {
    if (!selCls && classes.length > 0) setSelCls(classes[0].id);
  }, [classes]);

  const updateDraft = (key, val) => setDraft(d => d ? { ...d, [key]: val } : d);

  const saveDraft = () => {
    if (!draft || !selCls || !selFicheId) return;
    setFiches(prev => ({
      ...prev,
      [selCls]: (prev[selCls] || []).map(f => f.id === selFicheId ? { ...draft } : f),
    }));
    setSavedOk(true);
    setTimeout(() => setSavedOk(false), 2500);
  };

  const createFiche = () => {
    if (!selCls || !newForm.titre.trim()) return;
    const f = {
      id: 'f' + Date.now(),
      date: newForm.date,
      titre: newForm.titre.trim(),
      objectif: '', activite: '', devoirs: '',
      documents: '', aRevoir: '', incidents: '',
      absents: [], aRelancer: [],
    };
    setFiches(prev => ({ ...prev, [selCls]: [...(prev[selCls] || []), f] }));
    setSelFicheId(f.id);
    setShowNew(false);
    setNewForm({ date: isoDate(new Date()), titre: '' });
  };

  const deleteFiche = () => {
    if (!selFicheId || !selCls) return;
    setFiches(prev => ({
      ...prev,
      [selCls]: (prev[selCls] || []).filter(f => f.id !== selFicheId),
    }));
    setSelFicheId(null);
    setDraft(null);
    setShowDel(false);
  };

  const totalFiches = Object.values(fiches).reduce((s, arr) => s + (arr?.length || 0), 0);

  const taStyle = {
    width: '100%', padding: '.55rem .75rem',
    border: '1.5px solid var(--border)', borderRadius: 'var(--r-xs)',
    background: 'var(--surface2)', color: 'var(--text)',
    fontFamily: 'Roboto, sans-serif', fontSize: '.82rem',
    lineHeight: 1.6, resize: 'vertical', outline: 'none',
    transition: 'border-color .15s', boxSizing: 'border-box',
  };

  if (!cpData) return <ModulePlaceholder icon="📓" title="Carnet de bord" sub="Ouvrez d'abord un fichier ClassPro." />;

  return (
    <>
      <div className="page-hd">
        <div>
          <div className="phd-badge">📓 Carnet de bord</div>
          <div className="phd-title">Fiches de cours</div>
          <div className="phd-sub">
            {classes.find(c => c.id === selCls)?.name || '—'}
            {' · '}{clsFiches.length} fiche(s) · {totalFiches} au total
          </div>
        </div>
        <div className="phd-actions">
          {selCls && (
            <button className="btn btn-white" onClick={() => { setNewForm({ date: isoDate(new Date()), titre: '' }); setShowNew(true); }}>
              + Nouvelle fiche
            </button>
          )}
        </div>
      </div>

      <div style={{ display: 'flex', flex: 1, overflow: 'hidden', minHeight: 0 }}>

        {/* ── Sidebar classes + liste fiches ── */}
        <div style={{ width: 260, flexShrink: 0, borderRight: '1px solid var(--border)', display: 'flex', flexDirection: 'column', background: 'var(--surface2)', overflow: 'hidden' }}>

          {/* Onglets classes */}
          <div style={{ flexShrink: 0, borderBottom: '1px solid var(--border)', overflowX: 'auto' }}>
            {classes.length === 0 ? (
              <div style={{ padding: '.875rem', fontSize: '.76rem', color: 'var(--text3)', fontStyle: 'italic' }}>Aucune classe dans le fichier</div>
            ) : (
              classes.map(cls => (
                <button key={cls.id}
                  onClick={() => { setSelCls(cls.id); setSelFicheId(null); setSearch(''); }}
                  style={{
                    display: 'block', width: '100%', padding: '.55rem .875rem',
                    border: 'none', borderLeft: `3px solid ${selCls === cls.id ? 'var(--accent)' : 'transparent'}`,
                    background: selCls === cls.id ? 'var(--surface)' : 'transparent',
                    cursor: 'pointer', textAlign: 'left', fontFamily: 'Roboto, sans-serif',
                    fontSize: '.8rem', fontWeight: selCls === cls.id ? 700 : 500,
                    color: selCls === cls.id ? 'var(--accent)' : 'var(--text2)',
                    transition: 'all .15s', borderBottom: '1px solid var(--border)',
                  }}>
                  {cls.name || cls.nom}
                  <span style={{ marginLeft: '.4rem', fontSize: '.68rem', color: 'var(--text3)', fontWeight: 400 }}>
                    ({(fiches[cls.id] || []).length})
                  </span>
                </button>
              ))
            )}
          </div>

          {/* Recherche */}
          {selCls && (
            <div style={{ padding: '.5rem .65rem', flexShrink: 0, borderBottom: '1px solid var(--border)' }}>
              <input
                type="text" placeholder="🔍 Rechercher…" value={search}
                onChange={e => setSearch(e.target.value)}
                style={{ width: '100%', padding: '.38rem .65rem', border: '1.5px solid var(--border)', borderRadius: 'var(--r-s)', background: 'var(--surface)', color: 'var(--text)', fontFamily: 'Roboto, sans-serif', fontSize: '.78rem', outline: 'none' }}
              />
            </div>
          )}

          {/* Liste des fiches */}
          <div style={{ flex: 1, overflowY: 'auto' }}>
            {!selCls ? (
              <div style={{ padding: '1.5rem', textAlign: 'center', color: 'var(--text3)', fontSize: '.8rem' }}>← Sélectionnez une classe</div>
            ) : clsFiches.length === 0 ? (
              <div style={{ padding: '1.5rem', textAlign: 'center', color: 'var(--text3)', fontSize: '.8rem', fontStyle: 'italic' }}>
                {search ? 'Aucun résultat' : 'Aucune fiche · Cliquez sur "+ Nouvelle fiche"'}
              </div>
            ) : (
              clsFiches.map(f => (
                <div key={f.id}
                  onClick={() => setSelFicheId(f.id)}
                  style={{
                    padding: '.6rem .875rem', cursor: 'pointer', transition: 'all .15s',
                    borderLeft: `3px solid ${selFicheId === f.id ? 'var(--accent)' : 'transparent'}`,
                    background: selFicheId === f.id ? 'var(--surface)' : 'transparent',
                    borderBottom: '1px solid var(--border)',
                  }}>
                  <div style={{ fontWeight: selFicheId === f.id ? 700 : 500, fontSize: '.82rem', color: 'var(--text)', marginBottom: '.1rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {f.titre || 'Sans titre'}
                  </div>
                  <div style={{ fontSize: '.68rem', color: 'var(--text3)' }}>
                    {f.date ? new Date(f.date + 'T12:00').toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' }) : '—'}
                    {f.absents?.length > 0 && <span style={{ marginLeft: '.4rem', color: 'var(--warning)' }}>· {f.absents.length} absent(s)</span>}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* ── Éditeur de fiche ── */}
        <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          {!draft ? (
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '.75rem', color: 'var(--text3)' }}>
              <div style={{ fontSize: '3rem', opacity: .15 }}>📓</div>
              <div style={{ fontWeight: 700, color: 'var(--text2)' }}>Sélectionnez une fiche</div>
              <div style={{ fontSize: '.8rem' }}>ou créez-en une nouvelle</div>
            </div>
          ) : (
            <>
              {/* Barre d'actions de la fiche */}
              <div style={{ padding: '.65rem 1.25rem', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: '.65rem', background: 'var(--surface)', flexShrink: 0 }}>
                <input
                  value={draft.titre}
                  onChange={e => updateDraft('titre', e.target.value)}
                  style={{ flex: 1, fontFamily: 'Roboto Slab, serif', fontWeight: 700, fontSize: '1rem', border: 'none', background: 'transparent', color: 'var(--text)', outline: 'none' }}
                  placeholder="Titre de la fiche…"
                />
                <input
                  type="date" value={draft.date || ''}
                  onChange={e => updateDraft('date', e.target.value)}
                  style={{ padding: '.32rem .65rem', border: '1.5px solid var(--border)', borderRadius: 'var(--r-s)', background: 'var(--surface2)', color: 'var(--text)', fontFamily: 'Roboto, sans-serif', fontSize: '.78rem', outline: 'none' }}
                />
                <button
                  onClick={saveDraft}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '.32rem',
                    padding: '.38rem .9rem', borderRadius: 'var(--r-s)',
                    border: '1px solid var(--accent)', background: 'var(--accent)',
                    color: '#fff', fontFamily: 'Roboto, sans-serif', fontSize: '.78rem', fontWeight: 700, cursor: 'pointer',
                    transition: 'all .15s',
                  }}>
                  {savedOk ? '✅ Sauvegardé !' : '💾 Sauvegarder'}
                </button>
                <button
                  onClick={() => setShowDel(true)}
                  style={{ padding: '.38rem .65rem', borderRadius: 'var(--r-s)', border: '1px solid var(--border)', background: 'var(--surface2)', color: 'var(--danger)', fontFamily: 'Roboto, sans-serif', fontSize: '.78rem', cursor: 'pointer' }}
                  title="Supprimer cette fiche">
                  🗑️
                </button>
              </div>

              {/* Corps de la fiche */}
              <div style={{ flex: 1, overflowY: 'auto', padding: '1rem 1.5rem', display: 'flex', flexDirection: 'column', gap: '.875rem' }}>

                {/* Champs texte */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '.875rem' }}>
                  {CHAMPS_FICHE.map(champ => (
                    <div key={champ.key} style={{ display: 'flex', flexDirection: 'column', gap: '.28rem', gridColumn: champ.key === 'activite' || champ.key === 'incidents' ? '1 / -1' : 'auto' }}>
                      <label style={{ fontSize: '.65rem', fontWeight: 700, color: 'var(--text2)', textTransform: 'uppercase', letterSpacing: '.07em' }}>
                        {champ.label}
                      </label>
                      <textarea
                        rows={champ.rows}
                        value={draft[champ.key] || ''}
                        onChange={e => updateDraft(champ.key, e.target.value)}
                        placeholder={champ.placeholder}
                        style={taStyle}
                        onFocus={e => e.target.style.borderColor = 'var(--accent)'}
                        onBlur={e => e.target.style.borderColor = 'var(--border)'}
                      />
                    </div>
                  ))}
                </div>

                {/* Absents */}
                {(() => {
                  const cls = classes.find(c => c.id === selCls);
                  const eleves = cls?.eleves || [];
                  if (eleves.length === 0) return null;
                  return (
                    <div>
                      <div style={{ fontSize: '.65rem', fontWeight: 700, color: 'var(--text2)', textTransform: 'uppercase', letterSpacing: '.07em', marginBottom: '.38rem' }}>
                        😴 Absents ({(draft.absents || []).length}/{eleves.length})
                      </div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '.32rem' }}>
                        {eleves.map(el => {
                          const isAbsent = (draft.absents || []).includes(el.id);
                          return (
                            <button key={el.id}
                              onClick={() => {
                                const curr = draft.absents || [];
                                updateDraft('absents', isAbsent ? curr.filter(x => x !== el.id) : [...curr, el.id]);
                              }}
                              style={{
                                padding: '.2rem .55rem', borderRadius: 99, cursor: 'pointer',
                                border: `1px solid ${isAbsent ? 'rgba(220,38,38,.4)' : 'var(--border)'}`,
                                background: isAbsent ? 'rgba(220,38,38,.1)' : 'var(--surface2)',
                                color: isAbsent ? 'var(--danger)' : 'var(--text2)',
                                fontFamily: 'Roboto, sans-serif', fontSize: '.72rem', fontWeight: isAbsent ? 700 : 500,
                                transition: 'all .15s',
                              }}>
                              {isAbsent ? '✕ ' : ''}{el.nom}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })()}

                {/* À relancer */}
                {(() => {
                  const cls = classes.find(c => c.id === selCls);
                  const eleves = cls?.eleves || [];
                  if (eleves.length === 0) return null;
                  return (
                    <div>
                      <div style={{ fontSize: '.65rem', fontWeight: 700, color: 'var(--text2)', textTransform: 'uppercase', letterSpacing: '.07em', marginBottom: '.38rem' }}>
                        🔔 À relancer ({(draft.aRelancer || []).length})
                      </div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '.32rem' }}>
                        {eleves.map(el => {
                          const isRelancer = (draft.aRelancer || []).includes(el.id);
                          return (
                            <button key={el.id}
                              onClick={() => {
                                const curr = draft.aRelancer || [];
                                updateDraft('aRelancer', isRelancer ? curr.filter(x => x !== el.id) : [...curr, el.id]);
                              }}
                              style={{
                                padding: '.2rem .55rem', borderRadius: 99, cursor: 'pointer',
                                border: `1px solid ${isRelancer ? 'rgba(217,119,6,.4)' : 'var(--border)'}`,
                                background: isRelancer ? 'rgba(217,119,6,.1)' : 'var(--surface2)',
                                color: isRelancer ? 'var(--warning)' : 'var(--text2)',
                                fontFamily: 'Roboto, sans-serif', fontSize: '.72rem', fontWeight: isRelancer ? 700 : 500,
                                transition: 'all .15s',
                              }}>
                              {isRelancer ? '🔔 ' : ''}{el.nom}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })()}

              </div>
            </>
          )}
        </div>
      </div>

      {/* ── Modale nouvelle fiche ── */}
      {showNew && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.45)', zIndex: 9000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          onClick={e => e.target === e.currentTarget && setShowNew(false)}>
          <div style={{ background: 'var(--surface)', borderRadius: 'var(--r)', width: 420, boxShadow: 'var(--shadow-l)', overflow: 'hidden' }}>
            <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'var(--surface2)' }}>
              <div style={{ fontWeight: 700, fontSize: '.95rem' }}>📓 Nouvelle fiche</div>
              <button onClick={() => setShowNew(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.2rem', color: 'var(--text3)' }}>×</button>
            </div>
            <div style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '.75rem' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '.28rem' }}>
                <label style={{ fontSize: '.72rem', fontWeight: 600, color: 'var(--text2)', textTransform: 'uppercase', letterSpacing: '.07em' }}>Titre *</label>
                <input type="text" autoFocus placeholder="Ex : Séance 1 — Présentation, Vocabulaire des couleurs…"
                  value={newForm.titre} onChange={e => setNewForm(f => ({ ...f, titre: e.target.value }))}
                  onKeyDown={e => e.key === 'Enter' && newForm.titre.trim() && createFiche()}
                  style={{ padding: '.6rem .875rem', border: '1.5px solid var(--border)', borderRadius: 'var(--r-s)', background: 'var(--surface2)', color: 'var(--text)', fontFamily: 'Roboto, sans-serif', fontSize: '.88rem', outline: 'none' }} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '.28rem' }}>
                <label style={{ fontSize: '.72rem', fontWeight: 600, color: 'var(--text2)', textTransform: 'uppercase', letterSpacing: '.07em' }}>Date</label>
                <input type="date" value={newForm.date} onChange={e => setNewForm(f => ({ ...f, date: e.target.value }))}
                  style={{ padding: '.6rem .875rem', border: '1.5px solid var(--border)', borderRadius: 'var(--r-s)', background: 'var(--surface2)', color: 'var(--text)', fontFamily: 'Roboto, sans-serif', fontSize: '.88rem', outline: 'none' }} />
              </div>
              <div style={{ display: 'flex', gap: '.5rem', justifyContent: 'flex-end', marginTop: '.25rem' }}>
                <button onClick={() => setShowNew(false)} className="btn">Annuler</button>
                <button onClick={createFiche} className="btn btn-primary" disabled={!newForm.titre.trim()}>Créer la fiche</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Modale confirmation suppression ── */}
      {showDel && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.45)', zIndex: 9000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          onClick={e => e.target === e.currentTarget && setShowDel(false)}>
          <div style={{ background: 'var(--surface)', borderRadius: 'var(--r)', width: 380, boxShadow: 'var(--shadow-l)', overflow: 'hidden' }}>
            <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid var(--border)', background: 'var(--surface2)' }}>
              <div style={{ fontWeight: 700 }}>🗑️ Supprimer cette fiche ?</div>
            </div>
            <div style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ fontSize: '.85rem', color: 'var(--text2)', lineHeight: 1.6 }}>
                La fiche <strong>"{ficheActive?.titre}"</strong> sera définitivement supprimée.<br />
                <span style={{ fontSize: '.78rem', color: 'var(--text3)' }}>Cette action ne peut pas être annulée.</span>
              </div>
              <div style={{ display: 'flex', gap: '.5rem', justifyContent: 'flex-end' }}>
                <button onClick={() => setShowDel(false)} className="btn">Annuler</button>
                <button onClick={deleteFiche} className="btn btn-danger">Supprimer</button>
              </div>
            </div>
          </div>
        </div>
      )}
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

// ── MODULE CARNET DE BORD ─────────────────────────────────────────────────────
function ModuleCarnet({ cpData, onDataChange }) {
  const classes = cpData?.classes || [];
  const [fiches, setFiches] = useState(() => {
    const f = cpData?.fiches;
    return (f && typeof f === 'object' && !Array.isArray(f)) ? f : {};
  });
  const [selCls, setSelCls] = useState(() => classes[0]?.id || null);
  const [selFiche, setSelFiche] = useState(null);
  const [draft, setDraft] = useState(null);
  const [showNew, setShowNew] = useState(false);
  const [newForm, setNewForm] = useState({ date: isoDate(new Date()), titre: '' });
  const [showDel, setShowDel] = useState(false);
  const [savedOk, setSavedOk] = useState(false);
  const [search, setSearch] = useState('');

  // Sync vers parent à chaque modif
  useEffect(() => { onDataChange('cdc-fiches', fiches); }, [fiches]);

  const cls = classes.find(c => c.id === selCls);
  const clsFiches = (fiches[selCls] || [])
    .slice()
    .sort((a, b) => b.date.localeCompare(a.date))
    .filter(f => !search || f.titre?.toLowerCase().includes(search.toLowerCase()) || f.date?.includes(search));

  const ficheActive = selFiche ? (fiches[selCls] || []).find(f => f.id === selFiche) : null;

  useEffect(() => {
    if (ficheActive) setDraft({ ...ficheActive });
    else setDraft(null);
    setSavedOk(false);
  }, [selFiche, selCls]);

  const updateDraft = (key, val) => setDraft(d => d ? { ...d, [key]: val } : d);

  const saveFiche = () => {
    if (!draft || !selCls || !selFiche) return;
    setFiches(p => ({ ...p, [selCls]: (p[selCls] || []).map(f => f.id === selFiche ? { ...draft } : f) }));
    setSavedOk(true);
    setTimeout(() => setSavedOk(false), 2200);
  };

  const createFiche = () => {
    if (!selCls || !newForm.titre.trim()) return;
    const f = { id: 'f' + Date.now(), date: newForm.date, titre: newForm.titre, objectif: '', activite: '', devoirs: '', documents: '', aRevoir: '', incidents: '', absents: [], aRelancer: [] };
    setFiches(p => ({ ...p, [selCls]: [...(p[selCls] || []), f] }));
    setSelFiche(f.id);
    setDraft({ ...f });
    setShowNew(false);
    setNewForm({ date: isoDate(new Date()), titre: '' });
  };

  const deleteFiche = () => {
    if (!selCls || !selFiche) return;
    setFiches(p => ({ ...p, [selCls]: (p[selCls] || []).filter(f => f.id !== selFiche) }));
    setSelFiche(null);
    setDraft(null);
    setShowDel(false);
  };

  const eleves = cls?.eleves || [];

  if (!cpData) return <ModulePlaceholder icon="📓" title="Carnet de bord" sub="Ouvrez d'abord un fichier ClassPro." />;

  return (
    <>
      <div className="page-hd">
        <div>
          <div className="phd-badge">📓 Carnet de bord</div>
          <div className="phd-title">Fiches de cours</div>
          <div className="phd-sub">{cls ? `${cls.name} · ${(fiches[selCls] || []).length} fiche(s)` : 'Sélectionnez une classe'}</div>
        </div>
        <div className="phd-actions">
          {selCls && <button className="btn btn-ghost" onClick={() => setShowNew(true)}>+ Nouvelle fiche</button>}
        </div>
      </div>

      <div style={{ display: 'flex', flex: 1, overflow: 'hidden', minHeight: 0 }}>

        {/* ── Sidebar gauche ── */}
        <div style={{ width: 260, flexShrink: 0, borderRight: '1px solid var(--border)', background: 'var(--surface2)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

          {/* Sélecteur de classe */}
          <div style={{ padding: '.55rem .65rem', borderBottom: '1px solid var(--border)', flexShrink: 0 }}>
            <select value={selCls || ''} onChange={e => { setSelCls(e.target.value); setSelFiche(null); }}
              style={{ ...inputStyle, fontSize: '.78rem', padding: '.42rem .65rem' }}>
              {classes.length === 0 && <option value="">Aucune classe</option>}
              {classes.map(c => <option key={c.id} value={c.id}>{c.name} ({(fiches[c.id] || []).length})</option>)}
            </select>
          </div>

          {/* Recherche */}
          <div style={{ padding: '.45rem .65rem', borderBottom: '1px solid var(--border)', flexShrink: 0 }}>
            <input placeholder="🔍 Rechercher une fiche…" value={search} onChange={e => setSearch(e.target.value)}
              style={{ ...inputStyle, fontSize: '.77rem', padding: '.38rem .65rem' }} />
          </div>

          {/* Liste des fiches */}
          <div style={{ flex: 1, overflowY: 'auto' }}>
            {classes.length === 0 && (
              <div style={{ padding: '1rem', fontSize: '.78rem', color: 'var(--text3)', fontStyle: 'italic', textAlign: 'center' }}>
                Aucune classe dans ce fichier JSON.
              </div>
            )}
            {selCls && clsFiches.length === 0 && (
              <div style={{ padding: '1rem', fontSize: '.78rem', color: 'var(--text3)', fontStyle: 'italic', textAlign: 'center' }}>
                {search ? 'Aucun résultat.' : 'Aucune fiche — créez-en une !'}
              </div>
            )}
            {clsFiches.map(f => {
              const isActive = selFiche === f.id;
              const nbAbsents = (f.absents || []).length;
              return (
                <div key={f.id}
                  onClick={() => setSelFiche(f.id)}
                  style={{
                    padding: '.55rem .875rem', borderBottom: '1px solid var(--border)',
                    cursor: 'pointer', transition: 'all .13s',
                    background: isActive ? 'var(--surface)' : 'transparent',
                    borderLeft: `3px solid ${isActive ? 'var(--accent)' : 'transparent'}`,
                  }}
                  onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = 'var(--surface)'; }}
                  onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = 'transparent'; }}>
                  <div style={{ fontWeight: isActive ? 700 : 500, fontSize: '.82rem', color: isActive ? 'var(--accent)' : 'var(--text)', marginBottom: '.1rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {f.titre || 'Séance sans titre'}
                  </div>
                  <div style={{ fontSize: '.68rem', color: 'var(--text3)', display: 'flex', alignItems: 'center', gap: '.5rem' }}>
                    <span>{fmtDateCourt(f.date)}</span>
                    {nbAbsents > 0 && <span style={{ color: 'var(--danger)' }}>😴 {nbAbsents}</span>}
                    {f.incidents && <span style={{ color: 'var(--warning)' }}>⚠️</span>}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Footer sidebar */}
          {selCls && (
            <div style={{ padding: '.5rem .65rem', borderTop: '1px solid var(--border)', flexShrink: 0 }}>
              <button onClick={() => setShowNew(true)} className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', fontSize: '.75rem' }}>
                + Nouvelle fiche
              </button>
            </div>
          )}
        </div>

        {/* ── Zone principale ── */}
        <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
          {!selFiche || !draft ? (
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '.65rem', color: 'var(--text3)' }}>
              <div style={{ fontSize: '2.5rem', opacity: .2 }}>📓</div>
              <div style={{ fontWeight: 700, color: 'var(--text2)' }}>Sélectionnez une fiche</div>
              <div style={{ fontSize: '.8rem' }}>ou créez-en une nouvelle depuis la liste</div>
            </div>
          ) : (
            <>
              {/* Header fiche */}
              <div style={{ padding: '.875rem 1.25rem', borderBottom: '1px solid var(--border)', background: 'var(--surface2)', display: 'flex', alignItems: 'center', gap: '.75rem', flexShrink: 0 }}>
                <div style={{ flex: 1 }}>
                  <input value={draft.titre || ''} onChange={e => updateDraft('titre', e.target.value)}
                    style={{ ...inputStyle, fontSize: '1rem', fontWeight: 700, background: 'transparent', border: 'none', padding: '0', fontFamily: 'Roboto Slab, serif' }}
                    placeholder="Titre de la séance…" />
                  <input type="date" value={draft.date || ''} onChange={e => updateDraft('date', e.target.value)}
                    style={{ ...inputStyle, fontSize: '.75rem', background: 'transparent', border: 'none', padding: '0', color: 'var(--text2)', marginTop: '.12rem', width: 'auto' }} />
                </div>
                <div style={{ display: 'flex', gap: '.45rem', alignItems: 'center', flexShrink: 0 }}>
                  {savedOk && <span style={{ fontSize: '.72rem', color: 'var(--success)', fontWeight: 600 }}>✅ Sauvegardé</span>}
                  <button onClick={saveFiche} className="btn btn-primary" style={{ fontSize: '.75rem' }}>💾 Sauvegarder</button>
                  <button onClick={() => setShowDel(true)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text3)', fontSize: '.85rem', padding: '.3rem .5rem', borderRadius: 'var(--r-xs)' }} title="Supprimer cette fiche">🗑️</button>
                </div>
              </div>

              {/* Corps de la fiche — grille 2 colonnes */}
              <div style={{ padding: '1rem 1.25rem', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '.875rem' }}>

                {[
                  { key: 'objectif', label: '🎯 Objectif(s)', placeholder: 'Objectif de la séance…' },
                  { key: 'activite', label: '📝 Activité / Déroulement', placeholder: 'Description des activités…' },
                  { key: 'devoirs', label: '📚 Devoirs donnés', placeholder: 'Travail à faire à la maison…' },
                  { key: 'documents', label: '📄 Documents / Supports', placeholder: 'Documents utilisés…' },
                  { key: 'aRevoir', label: '🔄 À revoir / Points à approfondir', placeholder: 'Notions à consolider…' },
                  { key: 'incidents', label: '⚠️ Incidents / Observations', placeholder: 'Remarques particulières…' },
                ].map(({ key, label, placeholder }) => (
                  <div key={key} style={{ display: 'flex', flexDirection: 'column', gap: '.28rem' }}>
                    <label style={{ fontSize: '.65rem', fontWeight: 700, color: 'var(--text2)', textTransform: 'uppercase', letterSpacing: '.07em' }}>{label}</label>
                    <textarea value={draft[key] || ''} onChange={e => updateDraft(key, e.target.value)}
                      placeholder={placeholder} rows={3}
                      style={{ ...taStyle, minHeight: 80 }}
                      onFocus={e => e.target.style.borderColor = 'var(--accent)'}
                      onBlur={e => e.target.style.borderColor = 'var(--border)'} />
                  </div>
                ))}

                {/* Absents */}
                {eleves.length > 0 && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '.28rem' }}>
                    <label style={{ fontSize: '.65rem', fontWeight: 700, color: 'var(--text2)', textTransform: 'uppercase', letterSpacing: '.07em' }}>
                      😴 Absents ({(draft.absents || []).length}/{eleves.length})
                    </label>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '.3rem', padding: '.55rem', background: 'var(--surface2)', borderRadius: 'var(--r-s)', border: '1.5px solid var(--border)', minHeight: 44 }}>
                      {eleves.map(el => {
                        const on = (draft.absents || []).includes(el.id);
                        return (
                          <button key={el.id} onClick={() => updateDraft('absents', on ? (draft.absents || []).filter(x => x !== el.id) : [...(draft.absents || []), el.id])}
                            style={{ padding: '.18rem .5rem', borderRadius: 99, cursor: 'pointer', border: `1px solid ${on ? 'rgba(220,38,38,.5)' : 'var(--border)'}`, background: on ? 'rgba(220,38,38,.12)' : 'var(--surface)', color: on ? 'var(--danger)' : 'var(--text2)', fontFamily: 'Roboto,sans-serif', fontSize: '.72rem', fontWeight: on ? 700 : 400, transition: 'all .13s' }}>
                            {on ? '✕ ' : ''}{el.nom}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* À relancer */}
                {eleves.length > 0 && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '.28rem' }}>
                    <label style={{ fontSize: '.65rem', fontWeight: 700, color: 'var(--text2)', textTransform: 'uppercase', letterSpacing: '.07em' }}>
                      🔔 À relancer ({(draft.aRelancer || []).length})
                    </label>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '.3rem', padding: '.55rem', background: 'var(--surface2)', borderRadius: 'var(--r-s)', border: '1.5px solid var(--border)', minHeight: 44 }}>
                      {eleves.map(el => {
                        const on = (draft.aRelancer || []).includes(el.id);
                        return (
                          <button key={el.id} onClick={() => updateDraft('aRelancer', on ? (draft.aRelancer || []).filter(x => x !== el.id) : [...(draft.aRelancer || []), el.id])}
                            style={{ padding: '.18rem .5rem', borderRadius: 99, cursor: 'pointer', border: `1px solid ${on ? 'rgba(217,119,6,.5)' : 'var(--border)'}`, background: on ? 'rgba(217,119,6,.12)' : 'var(--surface)', color: on ? 'var(--warning)' : 'var(--text2)', fontFamily: 'Roboto,sans-serif', fontSize: '.72rem', fontWeight: on ? 700 : 400, transition: 'all .13s' }}>
                            {on ? '🔔 ' : ''}{el.nom}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

              </div>

              {/* Bouton sauvegarder bas de page */}
              <div style={{ padding: '.875rem 1.25rem', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'flex-end', gap: '.5rem', background: 'var(--surface2)', flexShrink: 0 }}>
                {savedOk && <span style={{ fontSize: '.78rem', color: 'var(--success)', fontWeight: 600, alignSelf: 'center' }}>✅ Modifications sauvegardées</span>}
                <button onClick={saveFiche} className="btn btn-primary">💾 Sauvegarder la fiche</button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* ── Modal nouvelle fiche ── */}
      {showNew && (
        <Modal title="📓 Nouvelle fiche de cours" onClose={() => setShowNew(false)}>
          <Field label="Titre *">
            <input autoFocus value={newForm.titre} onChange={e => setNewForm(f => ({ ...f, titre: e.target.value }))}
              onKeyDown={e => e.key === 'Enter' && newForm.titre.trim() && createFiche()}
              placeholder="Ex : Séance 3 — Le présent de l'indicatif" style={inputStyle} />
          </Field>
          <Field label="Date">
            <input type="date" value={newForm.date} onChange={e => setNewForm(f => ({ ...f, date: e.target.value }))} style={inputStyle} />
          </Field>
          <div style={{ display: 'flex', gap: '.5rem', justifyContent: 'flex-end' }}>
            <button onClick={() => setShowNew(false)} className="btn">Annuler</button>
            <button onClick={createFiche} className="btn btn-primary" disabled={!newForm.titre.trim()}>Créer la fiche</button>
          </div>
        </Modal>
      )}

      {/* ── Modal suppression ── */}
      {showDel && (
        <Modal title="🗑️ Supprimer cette fiche ?" onClose={() => setShowDel(false)} width={380}>
          <div style={{ fontSize: '.88rem', color: 'var(--text2)', lineHeight: 1.6 }}>
            La fiche <strong>"{ficheActive?.titre}"</strong> sera définitivement supprimée.
            <br /><span style={{ fontSize: '.78rem', color: 'var(--text3)' }}>Cette action est irréversible.</span>
          </div>
          <div style={{ display: 'flex', gap: '.5rem', justifyContent: 'flex-end' }}>
            <button onClick={() => setShowDel(false)} className="btn">Annuler</button>
            <button onClick={deleteFiche} className="btn btn-danger">Supprimer</button>
          </div>
        </Modal>
      )}
    </>
  );
}

// ── MODULE DEVOIRS / TRAVAUX NON RENDUS ───────────────────────────────────────
const STATUTS_DV = [
  { id: 'nonrendu', label: 'Non rendu', color: 'var(--danger)',  bg: 'rgba(220,38,38,.1)',   border: 'rgba(220,38,38,.35)' },
  { id: 'retard',   label: 'En retard', color: 'var(--warning)', bg: 'rgba(217,119,6,.1)',  border: 'rgba(217,119,6,.35)' },
  { id: 'rendu',    label: 'Rendu',     color: 'var(--success)', bg: 'rgba(15,155,110,.1)', border: 'rgba(15,155,110,.35)' },
  { id: 'dispense', label: 'Dispensé',  color: 'var(--accent)',  bg: 'rgba(59,91,219,.1)',  border: 'rgba(59,91,219,.35)' },
];

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

// ── SHELL PRINCIPAL ───────────────────────────────────────────────────────────
function Shell() {
  const [module, setModule] = useState('accueil');
  const [cpData, setCpData] = useState(null);       // données parsées
  const [filePath, setFilePath] = useState(null);   // chemin du fichier ouvert
  const [appVersion, setAppVersion] = useState('1.0.0');
  const [theme, setTheme] = useState(() => localStorage.getItem('cpd-theme') || 'light');
  const { toasts, push: pushToast } = useToast();

  // Infos app Electron
  useEffect(() => {
    window.cpd?.getInfo().then(info => {
      if (info?.version) setAppVersion(info.version);
    });
  }, []);

  // Thème
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('cpd-theme', theme);
  }, [theme]);

  // Écoute des événements menu natif
  useEffect(() => {
    window.cpd?.onMenuOpenJson(handleOpenJson);
    window.cpd?.onMenuSaveJson(handleSaveJson);
    window.cpd?.onMenuAbout(() => setModule('accueil'));
    return () => {
      window.cpd?.removeAllListeners('menu:open-json');
      window.cpd?.removeAllListeners('menu:save-json');
      window.cpd?.removeAllListeners('menu:about');
    };
  }, [cpData]); // eslint-disable-line

  // Ouvrir un fichier JSON
  const handleOpenJson = async () => {
    const result = await window.cpd?.openJson();
    if (!result) return;
    if (!result.ok) { pushToast('Impossible de lire le fichier : ' + result.error, 'error'); return; }
    handleOpenResult(result);
  };

  const handleOpenResult = (result) => {
    const parsed = parseClassProJson(result.data);
    if (!parsed) { pushToast('Format de fichier ClassPro invalide.', 'error'); return; }
    setCpData(parsed);
    setFilePath(result.filePath);
    setModule('accueil');
    pushToast(`Fichier chargé avec succès !`, 'success');

    // Historique récent
    const recent = JSON.parse(localStorage.getItem('cpd-recent') || '[]');
    const newEntry = {
      name: basename(result.filePath),
      path: result.filePath,
      dateStr: new Date().toLocaleDateString('fr-FR'),
    };
    const updated = [newEntry, ...recent.filter(r => r.path !== result.filePath)].slice(0, 6);
    localStorage.setItem('cpd-recent', JSON.stringify(updated));
  };

  // Sauvegarder le JSON (re-export)
  const handleSaveJson = async () => {
    if (!cpData) { pushToast('Aucun fichier chargé.', 'error'); return; }
    const p = cpData.profile || {};
    const nom = `${p.prenom || ''}${p.nom || ''}`.replace(/\s+/g, '_').toUpperCase() || 'export';
    const dateStr = new Date().toLocaleDateString('fr-FR').replace(/\//g, '-');
    const defaultName = `ClassPro_${nom}_${dateStr}.json`;
    const result = await window.cpd?.saveJson(cpData._raw, defaultName);
    if (result?.ok) {
      pushToast(`Fichier sauvegardé !`, 'success');
    } else if (result && !result.ok) {
      pushToast('Erreur lors de la sauvegarde.', 'error');
    }
  };

  // Mise à jour d'une clé dans le JSON brut (depuis les modules éditeurs)
  const KEY_MAP = { 'cdc-fiches': 'fiches', 'cdc-devoirs': 'devoirs', 'cdc-progs': 'progs', 'sc-classes': 'classes', 'sc-sessions': 'sessions' };
  const handleDataChange = (key, value) => {
    setCpData(prev => {
      if (!prev) return prev;
      const newRaw = { ...prev._raw, entries: { ...prev._raw.entries, [key]: JSON.stringify(value) } };
      return { ...prev, [KEY_MAP[key] || key]: value, _raw: newRaw };
    });
  };

  // Rendu du module actif
  const renderModule = () => {
    switch (module) {
      case 'accueil':
        return <ModuleAccueil onOpen={handleOpenResult} onNavigate={setModule} cpData={cpData} filePath={filePath} />;
      case 'donnees':
        return <ModuleDonnees cpData={cpData} />;
      case 'suivi':
        return <ModuleSuivi cpData={cpData} onDataChange={handleDataChange} />;
      case 'carnet':
        return <ModuleCarnet cpData={cpData} onDataChange={handleDataChange} />;
      case 'devoirs':
        return <ModuleDevoirs cpData={cpData} onDataChange={handleDataChange} />;
      case 'progression':
        return <ModulePlaceholder icon="📆" title="Progression annuelle" sub="Visualisation et édition de la progression." />;
      case 'conseil':
        return <ModulePlaceholder icon="🎓" title="Conseil de classe" sub="Données bulletins et conseil." />;
      case 'pdf-progression':
        return <ModulePlaceholder icon="📄" title="PDF Progression" sub="Génération du récapitulatif de progression annuelle." />;
      case 'pdf-carnet':
        return <ModulePlaceholder icon="📄" title="PDF Carnet de bord" sub="Génération du PDF des fiches séance." />;
      case 'pdf-bulletins':
        return <ModulePlaceholder icon="📄" title="PDF Bulletins" sub="Export des bulletins pour le conseil de classe." />;
      default:
        return <ModulePlaceholder icon="❓" title="Module introuvable" />;
    }
  };

  return (
    <div className="shell">
      <Sidebar
        activeModule={module}
        onNavigate={setModule}
        cpData={cpData}
        filePath={filePath}
        appVersion={appVersion}
      />

      <div className="main-area">
        {renderModule()}

        <div className="app-footer">
          <div style={{ display: 'flex', alignItems: 'center', gap: '.5rem' }}>
            <span>© {new Date().getFullYear()} Lucas Le Coadou</span>
            <span style={{ color: 'var(--border)' }}>·</span>
            <strong style={{ color: 'var(--text2)' }}>ClassPro Desktop</strong>
            <span style={{ color: 'var(--border)' }}>·</span>
            <span>Tous droits réservés</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '.75rem' }}>
            {cpData && (
              <button onClick={handleSaveJson}
                style={{
                  display: 'flex', alignItems: 'center', gap: '.32rem',
                  padding: '.28rem .75rem', borderRadius: 'var(--r-xs)',
                  border: '1px solid var(--accent)', background: 'var(--accent)',
                  color: '#fff', fontFamily: 'Roboto, sans-serif',
                  fontSize: '.68rem', fontWeight: 700, cursor: 'pointer',
                }}>
                💾 Sauvegarder JSON
              </button>
            )}
            <button onClick={() => setTheme(t => t === 'light' ? 'dark' : 'light')}
              style={{
                padding: '.28rem .65rem', borderRadius: 'var(--r-xs)',
                border: '1px solid var(--border)', background: 'var(--surface2)',
                color: 'var(--text2)', fontFamily: 'Roboto, sans-serif',
                fontSize: '.68rem', cursor: 'pointer',
              }}
              title={theme === 'light' ? 'Passer en mode sombre' : 'Passer en mode clair'}>
              {theme === 'light' ? '🌙' : '☀️'}
            </button>
            <span style={{ color: 'var(--text3)' }}>v{appVersion}</span>
          </div>
        </div>
      </div>

      <ToastStack toasts={toasts} />
    </div>
  );
}

ReactDOM.render(<Shell />, document.getElementById('root'));
