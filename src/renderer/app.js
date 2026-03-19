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
  { section: 'Gestion administrative', items: [
    { id: 'classes',      icon: '👥', label: 'Classes & élèves' },
    { id: 'edt',          icon: '📅', label: 'Emploi du temps' },
  ]},
  { section: 'Préparer', items: [
    { id: 'cours',        icon: '✏️', label: 'Créer un cours' },
    { id: 'progression',  icon: '📆', label: 'Progression annuelle' },
    { id: 'plan-classe',  icon: '🏫', label: 'Plan de classe' },
  ]},
  { section: 'Suivi pédagogique', items: [
    { id: 'suivi',        icon: '👁️', label: 'Suivi de classe' },
    { id: 'carnet',       icon: '📓', label: 'Carnet de bord' },
    { id: 'devoirs',      icon: '📋', label: 'Travaux non rendus' },
    { id: 'conseil',      icon: '🎓', label: 'Conseil de classe' },
  ]},
  { section: 'Génération PDF', items: [
    { id: 'pdf-progression', icon: '📄', label: 'PDF Progression' },
    { id: 'pdf-carnet',      icon: '📄', label: 'PDF Carnet de bord' },
    { id: 'pdf-bulletins',   icon: '📄', label: 'PDF Bulletins' },
  ]},
  { section: 'ClassPro Académie', items: [
    { id: 'academie', icon: '📖', label: "Centre d'aide" },
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
    progs:       (() => { const p = parse('cdc-progs'); return (p && typeof p === 'object' && !Array.isArray(p)) ? p : {}; })(),
    programmes:  parse('cdc-programmes') || [],
    edt:         parse('cdc-edt')      || [],
    cours:       parse('cdc-cours')     || {},
    edtRefA:     entries['cdc-edt-refA'] || null,
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
      {/* Zone invisible draggable en haut de la sidebar pour déplacer la fenêtre */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 52, WebkitAppRegion: 'drag', zIndex: 0 }} />
      <div className="sb-logo" style={{ WebkitAppRegion: 'drag', cursor: 'default', userSelect: 'none', position: 'relative', zIndex: 1 }}>
        <div className="sb-logo-icon" style={{ WebkitAppRegion: 'no-drag' }} dangerouslySetInnerHTML={{ __html: LOGO_SVG }} />
        <div className="sb-logo-text" style={{ WebkitAppRegion: 'no-drag' }}>
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

  const [showNewProfil, setShowNewProfil] = useState(false);
  const [newProfil, setNewProfil] = useState({
    prenom: '', nom: '', etablissement: '', annee: '2025/2026', classe: '', matiere: ''
  });

  const openJson = async () => {
    const result = await window.cpd.openJson();
    if (result?.ok) onOpen(result);
  };

  const creerNouveauFichier = () => {
    const { prenom, nom, etablissement, annee, classe, matiere } = newProfil;
    if (!prenom.trim() || !nom.trim()) return;

    // Générer un JSON ClassPro vide avec le profil renseigné
    const profile = { prenom: prenom.trim(), nom: nom.trim().toUpperCase(), etablissement: etablissement.trim(), annee, classe: classe.trim(), matiere: matiere.trim() };
    const data = {
      version: '6.5',
      date: new Date().toISOString(),
      entries: {
        'cdc-profile': JSON.stringify(profile),
        'cdc-theme': 'light',
        'cdc-data': '[]',
        'sc-classes': '[]',
        'sc-sessions': '{}',
        'cdc-devoirs': '[]',
        'cdc-fiches': '{}',
        'cdc-plans': '{}',
        'cdc-progs': '{}',
        'cdc-programmes': '[]',
        'cdc-edt': '[]',
        'cdc-liens': '[]',
        'dash-notes': '[]',
        'dash-taches': '[]',
      }
    };
    const defaultName = `ClassPro_${nom.trim().toUpperCase()}_${prenom.trim()}_nouveau.json`;
    onOpen({ data, filePath: defaultName });
    setShowNewProfil(false);
    setNewProfil({ prenom: '', nom: '', etablissement: '', annee: '2025/2026', classe: '', matiere: '' });
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
                  ['Progressions', Object.values(cpData.progs || {}).reduce((s, v) => s + ((v?.rows?.length) || 0), 0)],
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
            <button className="welcome-btn" onClick={() => setShowNewProfil(true)}>
              <div className="welcome-btn-icon">✨</div>
              <div>
                <div className="welcome-btn-label">Nouveau fichier</div>
                <div className="welcome-btn-hint">Créer un profil ClassPro Desktop sans clé USB</div>
              </div>
            </button>
          </div>

          {recent.length > 0 && (
            <div className="welcome-recent">
              <div className="welcome-recent-title">🕐 Fichiers récents</div>
              {recent.slice(0, 4).map(r => (
                <div key={r.path} className="recent-item" onClick={async () => {
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

      {/* Modale création nouveau profil */}
      {showNewProfil && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.5)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}
          onClick={e => e.target === e.currentTarget && setShowNewProfil(false)}>
          <div style={{ background: 'var(--surface)', borderRadius: 16, width: 480, boxShadow: '0 24px 64px rgba(0,0,0,.3)', overflow: 'hidden' }}>
            {/* Header */}
            <div style={{ background: 'linear-gradient(135deg, #1e3a8a 0%, #3b5bdb 60%, #7c3aed 100%)', padding: '1.5rem 1.75rem' }}>
              <div style={{ fontWeight: 800, fontSize: '1.15rem', color: '#fff', fontFamily: 'Roboto Slab, serif', marginBottom: '.25rem' }}>✨ Nouveau fichier ClassPro</div>
              <div style={{ fontSize: '.82rem', color: 'rgba(255,255,255,.75)' }}>Créez votre profil pour commencer à utiliser ClassPro Desktop</div>
            </div>
            {/* Formulaire */}
            <div style={{ padding: '1.5rem 1.75rem', display: 'flex', flexDirection: 'column', gap: '.875rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '.75rem' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '.28rem' }}>
                  <label style={{ fontSize: '.7rem', fontWeight: 700, color: 'var(--text2)', textTransform: 'uppercase', letterSpacing: '.07em' }}>Prénom *</label>
                  <input autoFocus value={newProfil.prenom} onChange={e => setNewProfil(p => ({ ...p, prenom: e.target.value }))}
                    placeholder="Prénom" style={{ padding: '.6rem .875rem', border: '1.5px solid var(--border)', borderRadius: 'var(--r-s)', background: 'var(--surface2)', color: 'var(--text)', fontFamily: 'Roboto, sans-serif', fontSize: '.86rem', outline: 'none' }}
                    onFocus={e => e.target.style.borderColor = 'var(--accent)'} onBlur={e => e.target.style.borderColor = 'var(--border)'} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '.28rem' }}>
                  <label style={{ fontSize: '.7rem', fontWeight: 700, color: 'var(--text2)', textTransform: 'uppercase', letterSpacing: '.07em' }}>Nom *</label>
                  <input value={newProfil.nom} onChange={e => setNewProfil(p => ({ ...p, nom: e.target.value.toUpperCase() }))}
                    placeholder="Nom" style={{ padding: '.6rem .875rem', border: '1.5px solid var(--border)', borderRadius: 'var(--r-s)', background: 'var(--surface2)', color: 'var(--text)', fontFamily: 'Roboto, sans-serif', fontSize: '.86rem', outline: 'none' }}
                    onFocus={e => e.target.style.borderColor = 'var(--accent)'} onBlur={e => e.target.style.borderColor = 'var(--border)'} />
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '.28rem' }}>
                <label style={{ fontSize: '.7rem', fontWeight: 700, color: 'var(--text2)', textTransform: 'uppercase', letterSpacing: '.07em' }}>Établissement</label>
                <input value={newProfil.etablissement} onChange={e => setNewProfil(p => ({ ...p, etablissement: e.target.value }))}
                  placeholder="Nom de votre établissement" style={{ padding: '.6rem .875rem', border: '1.5px solid var(--border)', borderRadius: 'var(--r-s)', background: 'var(--surface2)', color: 'var(--text)', fontFamily: 'Roboto, sans-serif', fontSize: '.86rem', outline: 'none' }}
                  onFocus={e => e.target.style.borderColor = 'var(--accent)'} onBlur={e => e.target.style.borderColor = 'var(--border)'} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '.75rem' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '.28rem' }}>
                  <label style={{ fontSize: '.7rem', fontWeight: 700, color: 'var(--text2)', textTransform: 'uppercase', letterSpacing: '.07em' }}>Matière enseignée</label>
                  <input value={newProfil.matiere} onChange={e => setNewProfil(p => ({ ...p, matiere: e.target.value }))}
                    placeholder="Ex : Mathématiques" style={{ padding: '.6rem .875rem', border: '1.5px solid var(--border)', borderRadius: 'var(--r-s)', background: 'var(--surface2)', color: 'var(--text)', fontFamily: 'Roboto, sans-serif', fontSize: '.86rem', outline: 'none' }}
                    onFocus={e => e.target.style.borderColor = 'var(--accent)'} onBlur={e => e.target.style.borderColor = 'var(--border)'} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '.28rem' }}>
                  <label style={{ fontSize: '.7rem', fontWeight: 700, color: 'var(--text2)', textTransform: 'uppercase', letterSpacing: '.07em' }}>Année scolaire</label>
                  <input value={newProfil.annee} onChange={e => setNewProfil(p => ({ ...p, annee: e.target.value }))}
                    placeholder="2025/2026" style={{ padding: '.6rem .875rem', border: '1.5px solid var(--border)', borderRadius: 'var(--r-s)', background: 'var(--surface2)', color: 'var(--text)', fontFamily: 'Roboto, sans-serif', fontSize: '.86rem', outline: 'none' }}
                    onFocus={e => e.target.style.borderColor = 'var(--accent)'} onBlur={e => e.target.style.borderColor = 'var(--border)'} />
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '.28rem' }}>
                <label style={{ fontSize: '.7rem', fontWeight: 700, color: 'var(--text2)', textTransform: 'uppercase', letterSpacing: '.07em' }}>Classe principale</label>
                <input value={newProfil.classe} onChange={e => setNewProfil(p => ({ ...p, classe: e.target.value }))}
                  placeholder="Ex : 3A, 5B…" style={{ padding: '.6rem .875rem', border: '1.5px solid var(--border)', borderRadius: 'var(--r-s)', background: 'var(--surface2)', color: 'var(--text)', fontFamily: 'Roboto, sans-serif', fontSize: '.86rem', outline: 'none' }}
                  onFocus={e => e.target.style.borderColor = 'var(--accent)'} onBlur={e => e.target.style.borderColor = 'var(--border)'} />
              </div>
              <div style={{ fontSize: '.75rem', color: 'var(--text3)', padding: '.5rem .75rem', background: 'var(--surface2)', borderRadius: 'var(--r-s)', lineHeight: 1.5 }}>
                💡 Un fichier JSON vide sera créé avec votre profil. Pensez à le sauvegarder depuis le bouton <strong>Sauvegarder JSON</strong> après vos premières saisies.
              </div>
            </div>
            {/* Footer */}
            <div style={{ padding: '.875rem 1.75rem', borderTop: '1px solid var(--border)', display: 'flex', gap: '.5rem', justifyContent: 'flex-end', background: 'var(--surface2)' }}>
              <button onClick={() => setShowNewProfil(false)} className="btn">Annuler</button>
              <button onClick={creerNouveauFichier} className="btn btn-primary"
                disabled={!newProfil.prenom.trim() || !newProfil.nom.trim()}>
                ✨ Créer mon fichier
              </button>
            </div>
          </div>
        </div>
      )}
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
                  <table style={{ borderCollapse: 'collapse', tableLayout: 'fixed', fontSize: '.75rem' }}>
                    <thead>
                      <tr style={{ background: 'var(--surface2)', position: 'sticky', top: 0, zIndex: 10 }}>
                        <th style={{ padding: '.55rem .875rem', textAlign: 'left', fontWeight: 700, color: 'var(--text2)', borderBottom: '1px solid var(--border)', width: 160, minWidth: 160 }}>Élève</th>
                        {curSess.map(s => (
                          <th key={s.id} style={{ width: 108, minWidth: 108, padding: '.35rem .3rem', textAlign: 'center', fontWeight: 600, color: 'var(--text2)', borderBottom: '1px solid var(--border)', borderLeft: '1px solid var(--border)', position: 'relative' }}>
                            <div style={{ fontSize: '.65rem', fontWeight: 700, color: 'var(--accent)' }}>{s.date ? new Date(s.date + 'T12:00').toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' }) : '—'}</div>
                            <div style={{ fontSize: '.58rem', color: 'var(--text3)', fontWeight: 400 }}>{s.label}</div>
                            <button onClick={() => delSeance(s.id)} style={{ position: 'absolute', top: 2, right: 2, background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text3)', fontSize: '.55rem', opacity: .4 }} title="Supprimer">×</button>
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {cur.eleves.map((el, i) => (
                        <tr key={el.id} style={{ background: i % 2 === 0 ? 'var(--surface)' : 'var(--surface2)' }}>
                          <td style={{ padding: '.38rem .875rem', fontWeight: 600, borderBottom: '1px solid var(--border)', whiteSpace: 'nowrap', width: 160 }}>
                            <button onClick={() => setBilanEl(el)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text)', fontWeight: 600, fontSize: '.78rem', textDecoration: 'underline dotted', textUnderlineOffset: 3 }}>{el.nom}</button>
                          </td>
                          {curSess.map(s => (
                            <td key={s.id} style={{ padding: '.28rem .25rem', borderBottom: '1px solid var(--border)', borderLeft: '1px solid var(--border)', textAlign: 'center', width: 108 }}>
                              <div style={{ display: 'flex', gap: '1px', justifyContent: 'center', flexWrap: 'nowrap' }}>
                                {OBS.map(o => {
                                  const active = hasObs(s.id, el.id, o.id);
                                  return (
                                    <button key={o.id} onClick={() => toggleObs(s.id, el.id, o.id)} title={o.label}
                                      style={{ width: 16, height: 16, borderRadius: 3, border: `1px solid ${active ? obsColor(o.k) : 'var(--border)'}`, background: active ? obsBg(o.k) : 'transparent', cursor: 'pointer', fontSize: '.56rem', opacity: active ? 1 : .2, transition: 'all .12s', flexShrink: 0, padding: 0, lineHeight: 1 }}>
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
function ModuleConseil({ cpData }) {
  const bulletins = cpData?.bulletins || [];
  const [vue, setVue] = useState('recap');
  const [selEleve, setSelEleve] = useState(null);
  const [search, setSearch] = useState('');
  const [filtPole, setFiltPole] = useState('');

  if (!cpData || bulletins.length === 0) {
    return <ModulePlaceholder icon="🎓" title="Conseil de classe" sub="Aucun bulletin importé dans ce fichier ClassPro." soon={false} />;
  }

  const poles = useMemo(() => {
    const s = new Set();
    bulletins.forEach(b => (b.subjects || []).forEach(sub => { if (sub.pole) s.add(sub.pole); }));
    return [...s].sort();
  }, [bulletins]);

  const elevesFiltered = useMemo(() => bulletins.filter(b => !search || b.name?.toLowerCase().includes(search.toLowerCase())), [bulletins, search]);

  const allMatieres = useMemo(() => {
    const s = new Set();
    bulletins.forEach(b => (b.subjects || []).forEach(sub => { if (!filtPole || sub.pole === filtPole) s.add(sub.name); }));
    return [...s].sort();
  }, [bulletins, filtPole]);

  const colorMoy = (v) => {
    if (v === null || v === undefined || isNaN(v)) return 'var(--text3)';
    if (v >= 16) return 'var(--success)';
    if (v >= 12) return 'var(--accent)';
    if (v >= 10) return 'var(--warning)';
    return 'var(--danger)';
  };

  const diffBadge = (t2, t1) => {
    if (t1 == null || t2 == null || isNaN(t1) || isNaN(t2)) return null;
    const d = parseFloat((t2 - t1).toFixed(2));
    if (Math.abs(d) < 0.05) return <span style={{ fontSize: '.62rem', color: 'var(--text3)' }}>≈</span>;
    return <span style={{ fontSize: '.62rem', fontWeight: 700, color: d > 0 ? 'var(--success)' : 'var(--danger)' }}>{d > 0 ? '▲' : '▼'}{Math.abs(d).toFixed(1)}</span>;
  };

  const eleveActif = selEleve ? bulletins.find(b => b.id === selEleve) : null;
  const tabBtn = (id) => ({ padding: '.38rem .875rem', borderRadius: 'var(--r-s)', border: vue === id ? '1px solid var(--accent)' : '1px solid var(--border)', background: vue === id ? 'var(--accent)' : 'var(--surface)', color: vue === id ? '#fff' : 'var(--text2)', fontFamily: 'Roboto, sans-serif', fontSize: '.77rem', fontWeight: 600, cursor: 'pointer' });

  return (
    <>
      <div className="page-hd">
        <div>
          <div className="phd-badge">🎓 Conseil de classe</div>
          <div className="phd-title">{cpData.profile ? `${cpData.profile.classe || ''} · ${cpData.profile.annee || ''}` : 'Conseil de classe'}</div>
          <div className="phd-sub">{bulletins.length} élève(s) · Trimestre {bulletins[0]?.trimester || '?'} · Moy. classe {bulletins[0]?.generalAverageClass ?? '—'}/20</div>
        </div>
        <div className="phd-stats">
          {[
            { label: 'Moy. ≥ 16', value: bulletins.filter(b => b.generalAverage >= 16).length },
            { label: 'Moy. 12–16', value: bulletins.filter(b => b.generalAverage >= 12 && b.generalAverage < 16).length },
            { label: 'Moy. 10–12', value: bulletins.filter(b => b.generalAverage >= 10 && b.generalAverage < 12).length },
            { label: 'Moy. < 10', value: bulletins.filter(b => b.generalAverage < 10).length },
          ].map(s => (
            <div key={s.label} className="phstat">
              <div className="phstat-label">{s.label}</div>
              <div className="phstat-value">{s.value}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="page-content" style={{ paddingTop: '.75rem' }}>
        <div style={{ display: 'flex', gap: '.5rem', marginBottom: '.875rem', alignItems: 'center', flexWrap: 'wrap' }}>
          {[{ id: 'recap', label: '📊 Tableau récap' }, { id: 'eleve', label: '👤 Fiche élève' }, { id: 'matiere', label: '📚 Par matière' }].map(v => (
            <button key={v.id} style={tabBtn(v.id)} onClick={() => setVue(v.id)}>{v.label}</button>
          ))}
          <div style={{ flex: 1 }} />
          <input placeholder="🔍 Rechercher un élève…" value={search} onChange={e => setSearch(e.target.value)} style={{ ...inputStyle, width: 200, fontSize: '.78rem', padding: '.38rem .65rem' }} />
          {vue !== 'recap' && (
            <select value={filtPole} onChange={e => setFiltPole(e.target.value)} style={{ ...inputStyle, width: 160, fontSize: '.78rem', padding: '.38rem .65rem' }}>
              <option value="">Tous les pôles</option>
              {poles.map(p => <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>)}
            </select>
          )}
        </div>

        {vue === 'recap' && (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ borderCollapse: 'collapse', width: '100%', fontSize: '.78rem' }}>
              <thead>
                <tr style={{ background: 'var(--surface2)', position: 'sticky', top: 0 }}>
                  <th style={{ padding: '.5rem .875rem', textAlign: 'left', fontWeight: 700, color: 'var(--text2)', borderBottom: '2px solid var(--border)', minWidth: 180 }}>Élève</th>
                  <th style={{ padding: '.5rem .65rem', textAlign: 'center', fontWeight: 700, color: 'var(--text2)', borderBottom: '2px solid var(--border)', minWidth: 80 }}>Moy. T2</th>
                  <th style={{ padding: '.5rem .65rem', textAlign: 'center', fontWeight: 700, color: 'var(--text2)', borderBottom: '2px solid var(--border)', minWidth: 80 }}>Moy. T1</th>
                  <th style={{ padding: '.5rem .65rem', textAlign: 'center', fontWeight: 700, color: 'var(--text2)', borderBottom: '2px solid var(--border)', minWidth: 70 }}>Évol.</th>
                  <th style={{ padding: '.5rem .65rem', textAlign: 'center', fontWeight: 700, color: 'var(--text2)', borderBottom: '2px solid var(--border)', minWidth: 70 }}>Abs.</th>
                  <th style={{ padding: '.5rem .65rem', textAlign: 'center', fontWeight: 700, color: 'var(--text2)', borderBottom: '2px solid var(--border)', minWidth: 80 }}>Orientation</th>
                  <th style={{ padding: '.5rem .65rem', textAlign: 'left', fontWeight: 700, color: 'var(--text2)', borderBottom: '2px solid var(--border)' }}>Appréciation générale</th>
                </tr>
              </thead>
              <tbody>
                {elevesFiltered.map((b, i) => (
                  <tr key={b.id} style={{ background: i % 2 === 0 ? 'var(--surface)' : 'var(--surface2)', cursor: 'pointer' }} onClick={() => { setSelEleve(b.id); setVue('eleve'); }} onMouseEnter={e => e.currentTarget.style.background = 'rgba(59,91,219,.07)'} onMouseLeave={e => e.currentTarget.style.background = i % 2 === 0 ? 'var(--surface)' : 'var(--surface2)'}>
                    <td style={{ padding: '.42rem .875rem', borderBottom: '1px solid var(--border)', fontWeight: 600 }}>
                      {b.recompense === 'tf' && <span title="Tableau d'honneur" style={{ marginRight: '.3rem' }}>🏅</span>}
                      {b.recompense === 'mgtc' && <span title="Mention" style={{ marginRight: '.3rem' }}>⭐</span>}
                      {b.name}
                    </td>
                    <td style={{ padding: '.42rem .65rem', borderBottom: '1px solid var(--border)', textAlign: 'center', fontWeight: 800, color: colorMoy(b.generalAverage) }}>{b.generalAverage?.toFixed(2) ?? '—'}</td>
                    <td style={{ padding: '.42rem .65rem', borderBottom: '1px solid var(--border)', textAlign: 'center', color: 'var(--text2)' }}>{b.generalAverageT1?.toFixed(2) ?? '—'}</td>
                    <td style={{ padding: '.42rem .65rem', borderBottom: '1px solid var(--border)', textAlign: 'center' }}>{diffBadge(b.generalAverage, b.generalAverageT1)}</td>
                    <td style={{ padding: '.42rem .65rem', borderBottom: '1px solid var(--border)', textAlign: 'center', color: (b.absences?.demiJournees || 0) > 5 ? 'var(--danger)' : 'var(--text2)' }}>{b.absences?.demiJournees ?? 0} DJ</td>
                    <td style={{ padding: '.42rem .65rem', borderBottom: '1px solid var(--border)', textAlign: 'center' }}>
                      {b.orientation?.avis ? <span style={{ fontSize: '.68rem', fontWeight: 700, padding: '.1rem .42rem', borderRadius: 99, background: b.orientation.avis === 'Favorable' ? 'rgba(15,155,110,.12)' : 'rgba(217,119,6,.12)', color: b.orientation.avis === 'Favorable' ? 'var(--success)' : 'var(--warning)' }}>{b.orientation.filiere || b.orientation.avis}</span> : <span style={{ color: 'var(--text3)', fontSize: '.7rem' }}>—</span>}
                    </td>
                    <td style={{ padding: '.42rem .875rem', borderBottom: '1px solid var(--border)', color: 'var(--text2)', fontSize: '.73rem', maxWidth: 320 }}>
                      <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{b.appreciationGenerale || '—'}</div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {elevesFiltered.length === 0 && <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text3)' }}>Aucun élève trouvé.</div>}
          </div>
        )}

        {vue === 'eleve' && (
          <div style={{ display: 'grid', gridTemplateColumns: '220px 1fr', gap: '1rem', minHeight: 400 }}>
            <div style={{ background: 'var(--surface2)', borderRadius: 'var(--r)', border: '1px solid var(--border)', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
              <div style={{ padding: '.42rem .65rem', fontSize: '.6rem', fontWeight: 700, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '.07em', borderBottom: '1px solid var(--border)' }}>Élèves</div>
              <div style={{ flex: 1, overflowY: 'auto' }}>
                {elevesFiltered.map(b => (
                  <button key={b.id} onClick={() => setSelEleve(b.id)} style={{ display: 'flex', alignItems: 'center', gap: '.5rem', width: '100%', padding: '.48rem .75rem', border: 'none', borderLeft: `3px solid ${selEleve === b.id ? 'var(--accent)' : 'transparent'}`, background: selEleve === b.id ? 'var(--surface)' : 'transparent', cursor: 'pointer', fontFamily: 'Roboto, sans-serif', fontSize: '.78rem', fontWeight: selEleve === b.id ? 700 : 400, color: selEleve === b.id ? 'var(--accent)' : 'var(--text2)', borderBottom: '1px solid var(--border)', transition: 'all .12s', textAlign: 'left' }}>
                    <span style={{ flex: 1 }}>{b.name}</span>
                    <span style={{ fontSize: '.7rem', fontWeight: 800, color: colorMoy(b.generalAverage) }}>{b.generalAverage?.toFixed(1)}</span>
                  </button>
                ))}
              </div>
            </div>
            {!eleveActif ? (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text3)', flexDirection: 'column', gap: '.5rem' }}>
                <div style={{ fontSize: '2rem', opacity: .2 }}>👤</div>
                <div>Sélectionnez un élève</div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '.875rem' }}>
                <div className="card" style={{ padding: '1rem 1.25rem' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem' }}>
                    <div style={{ width: 48, height: 48, borderRadius: 12, background: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 800, fontSize: '.9rem', flexShrink: 0 }}>
                      {eleveActif.name.split(' ').map(w => w[0]).slice(0, 2).join('')}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 800, fontSize: '1.05rem', marginBottom: '.2rem' }}>{eleveActif.name}</div>
                      <div style={{ display: 'flex', gap: '.75rem', flexWrap: 'wrap', fontSize: '.75rem', color: 'var(--text2)' }}>
                        <span>Moy. T2 : <strong style={{ color: colorMoy(eleveActif.generalAverage) }}>{eleveActif.generalAverage?.toFixed(2)}/20</strong></span>
                        <span>Moy. T1 : <strong>{eleveActif.generalAverageT1?.toFixed(2)}/20</strong></span>
                        <span>Moy. classe : <strong>{eleveActif.generalAverageClass}/20</strong></span>
                        <span>Absences : <strong style={{ color: (eleveActif.absences?.demiJournees || 0) > 5 ? 'var(--danger)' : 'inherit' }}>{eleveActif.absences?.demiJournees ?? 0} demi-journées</strong></span>
                        {eleveActif.retards > 0 && <span>Retards : <strong>{eleveActif.retards}</strong></span>}
                        {eleveActif.orientation?.avis && <span>Orientation : <strong>{eleveActif.orientation.filiere || eleveActif.orientation.avis}</strong></span>}
                      </div>
                    </div>
                    {eleveActif.recompense && <div style={{ fontSize: '1.5rem' }}>{eleveActif.recompense === 'tf' ? '🏅' : '⭐'}</div>}
                  </div>
                </div>
                <div className="card" style={{ overflow: 'hidden' }}>
                  <div className="card-hd"><div className="card-title">📊 Notes par matière</div></div>
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ borderCollapse: 'collapse', width: '100%', fontSize: '.77rem' }}>
                      <thead>
                        <tr style={{ background: 'var(--surface2)' }}>
                          <th style={{ padding: '.42rem .75rem', textAlign: 'left', fontWeight: 700, color: 'var(--text2)', borderBottom: '1px solid var(--border)' }}>Matière</th>
                          <th style={{ padding: '.42rem .65rem', textAlign: 'center', fontWeight: 700, color: 'var(--text2)', borderBottom: '1px solid var(--border)' }}>T2</th>
                          <th style={{ padding: '.42rem .65rem', textAlign: 'center', fontWeight: 700, color: 'var(--text2)', borderBottom: '1px solid var(--border)' }}>T1</th>
                          <th style={{ padding: '.42rem .65rem', textAlign: 'center', fontWeight: 700, color: 'var(--text2)', borderBottom: '1px solid var(--border)' }}>Évol.</th>
                          {optionsPdf.moyClasse && <th style={{ padding: '.42rem .65rem', textAlign: 'center', fontWeight: 700, color: 'var(--text2)', borderBottom: '1px solid var(--border)' }}>Classe</th>}
                          <th style={{ padding: '.42rem .75rem', textAlign: 'left', fontWeight: 700, color: 'var(--text2)', borderBottom: '1px solid var(--border)' }}>Appréciation</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(eleveActif.subjects || []).filter(sub => !filtPole || sub.pole === filtPole).map((sub, i) => (
                          <tr key={i} style={{ background: i % 2 === 0 ? 'var(--surface)' : 'var(--surface2)' }}>
                            <td style={{ padding: '.38rem .75rem', borderBottom: '1px solid var(--border)', fontWeight: 600 }}>
                              <div>{sub.name}</div>
                              {sub.teacher && <div style={{ fontSize: '.65rem', color: 'var(--text3)', fontWeight: 400 }}>{sub.teacher}</div>}
                            </td>
                            <td style={{ padding: '.38rem .65rem', borderBottom: '1px solid var(--border)', textAlign: 'center', fontWeight: 800, color: colorMoy(sub.gradeStudent) }}>{sub.gradeStudent?.toFixed(2) ?? '—'}</td>
                            <td style={{ padding: '.38rem .65rem', borderBottom: '1px solid var(--border)', textAlign: 'center', color: 'var(--text2)' }}>{sub.gradeT1?.toFixed(2) ?? '—'}</td>
                            <td style={{ padding: '.38rem .65rem', borderBottom: '1px solid var(--border)', textAlign: 'center' }}>{diffBadge(sub.gradeStudent, sub.gradeT1)}</td>
                            {optionsPdf.moyClasse && <td style={{ padding: '.38rem .65rem', borderBottom: '1px solid var(--border)', textAlign: 'center', color: 'var(--text3)' }}>{sub.gradeClass?.toFixed(1) ?? '—'}</td>}
                            <td style={{ padding: '.38rem .75rem', borderBottom: '1px solid var(--border)', color: 'var(--text2)', fontSize: '.72rem', maxWidth: 300 }}>
                              <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={sub.appreciation}>{sub.appreciation || '—'}</div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
                {eleveActif.appreciationGenerale && (
                  <div className="card" style={{ padding: '1rem 1.25rem' }}>
                    <div style={{ fontSize: '.65rem', fontWeight: 700, color: 'var(--text2)', textTransform: 'uppercase', letterSpacing: '.07em', marginBottom: '.5rem' }}>💬 Appréciation générale</div>
                    <div style={{ fontSize: '.83rem', color: 'var(--text)', lineHeight: 1.65, fontStyle: 'italic' }}>"{eleveActif.appreciationGenerale}"</div>
                  </div>
                )}
                {eleveActif.vieScolaire && (
                  <div className="card" style={{ padding: '.875rem 1.25rem' }}>
                    <div style={{ fontSize: '.65rem', fontWeight: 700, color: 'var(--text2)', textTransform: 'uppercase', letterSpacing: '.07em', marginBottom: '.38rem' }}>🏫 Vie scolaire</div>
                    <div style={{ fontSize: '.83rem', color: 'var(--text2)' }}>{eleveActif.vieScolaire}</div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {vue === 'matiere' && (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ borderCollapse: 'collapse', width: '100%', fontSize: '.77rem' }}>
              <thead>
                <tr style={{ background: 'var(--surface2)', position: 'sticky', top: 0 }}>
                  <th style={{ padding: '.48rem .875rem', textAlign: 'left', fontWeight: 700, color: 'var(--text2)', borderBottom: '2px solid var(--border)', minWidth: 180 }}>Élève</th>
                  {allMatieres.map(m => (
                    <th key={m} style={{ padding: '.4rem .5rem', textAlign: 'center', fontWeight: 700, color: 'var(--text2)', borderBottom: '2px solid var(--border)', borderLeft: '1px solid var(--border)', minWidth: 80, fontSize: '.65rem', whiteSpace: 'nowrap' }} title={m}>{m.length > 14 ? m.slice(0, 13) + '…' : m}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {elevesFiltered.map((b, i) => (
                  <tr key={b.id} style={{ background: i % 2 === 0 ? 'var(--surface)' : 'var(--surface2)', cursor: 'pointer' }} onClick={() => { setSelEleve(b.id); setVue('eleve'); }} onMouseEnter={e => e.currentTarget.style.background = 'rgba(59,91,219,.07)'} onMouseLeave={e => e.currentTarget.style.background = i % 2 === 0 ? 'var(--surface)' : 'var(--surface2)'}>
                    <td style={{ padding: '.38rem .875rem', borderBottom: '1px solid var(--border)', fontWeight: 600 }}>{b.name}</td>
                    {allMatieres.map(m => {
                      const sub = (b.subjects || []).find(s => s.name === m);
                      return <td key={m} style={{ padding: '.38rem .5rem', borderBottom: '1px solid var(--border)', borderLeft: '1px solid var(--border)', textAlign: 'center', fontWeight: 700, color: sub ? colorMoy(sub.gradeStudent) : 'var(--text3)' }}>{sub ? sub.gradeStudent?.toFixed(1) ?? '—' : <span style={{ opacity: .3 }}>—</span>}</td>;
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
            {elevesFiltered.length === 0 && <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text3)' }}>Aucun élève trouvé.</div>}
          </div>
        )}
      </div>
    </>
  );
}

// ── MODULE PDF CARNET DE BORD ────────────────────────────────────────────────
function ModulePdfCarnet({ cpData }) {
  const classes = cpData?.classes || [];
  const fiches = cpData?.fiches || {};
  const profile = cpData?.profile || {};

  const [selCls, setSelCls] = useState(() => classes[0]?.id || null);
  const [mode, setMode] = useState('une'); // 'une' | 'plusieurs'
  const [generating, setGenerating] = useState(false);
  const [done, setDone] = useState(false);

  const cls = classes.find(c => c.id === selCls);
  const clsFiches = (fiches[selCls] || [])
    .slice()
    .sort((a, b) => (a.date || '').localeCompare(b.date || ''));

  const fmtD = (iso) => {
    if (!iso) return '';
    return new Date(iso + 'T12:00').toLocaleDateString('fr-FR', {
      weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
    });
  };

  const CHAMPS = [
    { key: 'objectif',  label: 'Objectifs' },
    { key: 'activite',  label: 'Activite / Deroulement' },
    { key: 'devoirs',   label: 'Devoirs donnes' },
    { key: 'documents', label: 'Documents / Supports' },
    { key: 'aRevoir',   label: 'A revoir' },
  ];

  const drawHeader = (doc, PW, PH, ML, MR, WHITE, ACCENT, GRAY, titre, date, cls, profile, pageNum, total) => {
    doc.setFillColor(...ACCENT);
    doc.rect(0, 0, PW, 22, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(...WHITE);
    doc.text(profile.etablissement || 'ClassPro Desktop', ML, 8);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.text((profile.prenom || '') + ' ' + (profile.nom || '') + ' - ' + (cls?.name || ''), ML, 13.5);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.text(titre || 'Fiche de cours', PW - MR, 8, { align: 'right' });
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    if (date) doc.text(fmtD(date), PW - MR, 13.5, { align: 'right' });
    doc.setFontSize(7);
    doc.setTextColor(...GRAY);
    doc.text(pageNum + ' / ' + total, PW - MR, PH - 8, { align: 'right' });
    doc.text('ClassPro Desktop', ML, PH - 8);
  };

  const genererPdf = async () => {
    if (!cls || clsFiches.length === 0) return;
    if (!window.jspdf) { alert('jsPDF non chargé. Vérifiez que vendor/jspdf.umd.min.js est présent.'); return; }

    setGenerating(true);
    setDone(false);

    try {
      const { jsPDF } = window.jspdf;
      const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      const PW = 210, PH = 297, ML = 15, MR = 15, MB = 15;
      const CW = PW - ML - MR;
      const ACCENT = [59, 91, 219];
      const DARK = [15, 23, 42];
      const GRAY = [100, 116, 139];
      const LIGHT = [241, 245, 249];
      const WHITE = [255, 255, 255];

      if (mode === 'une') {
        // UNE FICHE PAR PAGE
        clsFiches.forEach((fiche, idx) => {
          if (idx > 0) doc.addPage();
          drawHeader(doc, PW, PH, ML, MR, WHITE, ACCENT, GRAY, fiche.titre, fiche.date, cls, profile, idx + 1, clsFiches.length);

          let y = 28;

          CHAMPS.forEach(({ key, label }) => {
            const val = (fiche[key] || '').trim();
            if (!val) return;

            // Label
            doc.setFillColor(...LIGHT);
            doc.roundedRect(ML, y, CW, 6.5, 1, 1, 'F');
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(8);
            doc.setTextColor(...ACCENT);
            doc.text(label, ML + 2.5, y + 4.5);
            y += 8;

            // Contenu
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(9);
            doc.setTextColor(...DARK);
            const lines = doc.splitTextToSize(val, CW - 4);
            lines.forEach(line => {
              if (y > PH - MB - 10) {
                doc.addPage();
                drawHeader(doc, PW, PH, ML, MR, WHITE, ACCENT, GRAY, fiche.titre, fiche.date, cls, profile, idx + 1, clsFiches.length);
                y = 28;
              }
              doc.text(line, ML + 2, y + 3.5);
              y += 5;
            });
            y += 4;
          });

          // Absents
          const elevesCls = cls?.eleves || [];
          const nomsAbsents = (fiche.absents || [])
            .map(id => elevesCls.find(e => e.id === id)?.nom)
            .filter(Boolean).join(', ');
          if (nomsAbsents) {
            doc.setFillColor(254, 242, 242);
            doc.roundedRect(ML, y, CW, 6.5, 1, 1, 'F');
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(8);
            doc.setTextColor(220, 38, 38);
            doc.text('Absents', ML + 2.5, y + 4.5);
            y += 8;
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(9);
            doc.setTextColor(...DARK);
            doc.splitTextToSize(nomsAbsents, CW - 4).forEach(line => {
              doc.text(line, ML + 2, y + 3.5); y += 5;
            });
          }
        });

      } else {
        // PLUSIEURS FICHES PAR PAGE (2x2)
        const colW = (CW - 5) / 2;
        const colH = 112;
        const totalPages = Math.ceil(clsFiches.length / 4);
        let page = 0;

        for (let ficheIdx = 0; ficheIdx < clsFiches.length; ficheIdx++) {
          const slot = ficheIdx % 4;
          if (slot === 0) {
            if (page > 0) doc.addPage();
            page++;
            drawHeader(doc, PW, PH, ML, MR, WHITE, ACCENT, GRAY, cls.name + ' - Carnet de bord', null, cls, profile, page, totalPages);
          }
          const fiche = clsFiches[ficheIdx];
          const col = slot % 2;
          const row = Math.floor(slot / 2);
          const x = ML + col * (colW + 5);
          const y0 = 26 + row * (colH + 4);

          // Cadre
          doc.setDrawColor(220, 230, 250);
          doc.setLineWidth(0.4);
          doc.roundedRect(x, y0, colW, colH, 2, 2, 'S');

          // Header fiche
          doc.setFillColor(...ACCENT);
          doc.roundedRect(x, y0, colW, 11, 2, 2, 'F');
          doc.rect(x, y0 + 6, colW, 5, 'F');
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(7.5);
          doc.setTextColor(...WHITE);
          const titreShort = (fiche.titre || 'Sans titre').slice(0, 32);
          doc.text(titreShort, x + 2.5, y0 + 5);
          doc.setFont('helvetica', 'normal');
          doc.setFontSize(6.5);
          doc.text(fmtD(fiche.date), x + 2.5, y0 + 9.5);

          let fy = y0 + 14;
          const maxY = y0 + colH - 3;

          CHAMPS.forEach(({ key, label }) => {
            const val = (fiche[key] || '').trim();
            if (!val || fy >= maxY - 8) return;
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(6);
            doc.setTextColor(...ACCENT);
            doc.text(label, x + 2, fy);
            fy += 3.5;
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(6.5);
            doc.setTextColor(...DARK);
            const lines = doc.splitTextToSize(val, colW - 4);
            const maxLines = Math.max(1, Math.floor((maxY - fy) / 4));
            lines.slice(0, maxLines).forEach(line => { doc.text(line, x + 2, fy); fy += 4; });
            if (lines.length > maxLines) { doc.setTextColor(...GRAY); doc.text('...', x + 2, fy); }
            fy += 2;
          });
        }
      }

      // Sauvegarder
      const nomClasse = (cls.name || 'classe').replace(/[^a-zA-Z0-9]/g, '_');
      const dateStr = new Date().toLocaleDateString('fr-FR').replace(/\//g, '-');
      const defaultName = 'Carnet_' + nomClasse + '_' + dateStr + '.pdf';
      const pdfBase64 = doc.output('datauristring').split(',')[1];
      const result = await window.cpd.savePdf(pdfBase64, defaultName);
      if (result?.ok) { setDone(true); setTimeout(() => setDone(false), 3000); }

    } catch (err) {
      console.error('Erreur PDF:', err);
      alert('Erreur : ' + err.message);
    }
    setGenerating(false);
  };

  if (!cpData) return <ModulePlaceholder icon="📄" title="PDF Carnet de bord" sub="Ouvrez d'abord un fichier ClassPro." />;

  return (
    <>
      <div className="page-hd">
        <div>
          <div className="phd-badge">📄 PDF</div>
          <div className="phd-title">PDF Carnet de bord</div>
          <div className="phd-sub">{cls ? cls.name + ' · ' + clsFiches.length + ' fiche(s)' : 'Selectionnez une classe'}</div>
        </div>
        <div className="phd-actions">
          <button className="btn btn-primary" onClick={genererPdf} disabled={!selCls || clsFiches.length === 0 || generating}>
            {generating ? 'Generation...' : done ? 'PDF sauvegarde !' : 'Generer le PDF'}
          </button>
        </div>
      </div>

      <div className="page-content">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', maxWidth: 760 }}>

          <div className="card">
            <div className="card-hd"><div className="card-title">Classe a exporter</div></div>
            <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: '.5rem' }}>
              {classes.length === 0 ? (
                <div style={{ color: 'var(--text3)', fontSize: '.82rem' }}>Aucune classe disponible.</div>
              ) : classes.map(c => {
                const nb = (fiches[c.id] || []).length;
                return (
                  <button key={c.id} onClick={() => setSelCls(c.id)}
                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '.55rem .875rem', border: '1.5px solid ' + (selCls === c.id ? 'var(--accent)' : 'var(--border)'), borderRadius: 'var(--r-s)', background: selCls === c.id ? 'rgba(59,91,219,.07)' : 'var(--surface)', cursor: 'pointer', fontFamily: 'Roboto, sans-serif', fontSize: '.85rem', fontWeight: selCls === c.id ? 700 : 400, color: selCls === c.id ? 'var(--accent)' : 'var(--text)', transition: 'all .15s' }}>
                    <span>{c.name}</span>
                    <span style={{ fontSize: '.72rem', color: 'var(--text3)' }}>{nb} fiche{nb > 1 ? 's' : ''}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="card">
            <div className="card-hd"><div className="card-title">Options de mise en page</div></div>
            <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: '.75rem' }}>
              <div style={{ fontSize: '.72rem', fontWeight: 700, color: 'var(--text2)', textTransform: 'uppercase', letterSpacing: '.07em' }}>Format</div>
              {[
                { id: 'une', label: 'Une fiche par page', desc: 'Detaille, ideal pour l\'impression individuelle' },
                { id: 'plusieurs', label: 'Plusieurs fiches par page', desc: '4 fiches par page (2x2), format compact' },
              ].map(opt => (
                <button key={opt.id} onClick={() => setMode(opt.id)}
                  style={{ display: 'flex', alignItems: 'flex-start', gap: '.75rem', padding: '.65rem .875rem', border: '1.5px solid ' + (mode === opt.id ? 'var(--accent)' : 'var(--border)'), borderRadius: 'var(--r-s)', background: mode === opt.id ? 'rgba(59,91,219,.07)' : 'var(--surface)', cursor: 'pointer', textAlign: 'left', transition: 'all .15s', fontFamily: 'Roboto, sans-serif' }}>
                  <div style={{ width: 16, height: 16, borderRadius: '50%', border: '2px solid ' + (mode === opt.id ? 'var(--accent)' : 'var(--border)'), background: mode === opt.id ? 'var(--accent)' : 'transparent', flexShrink: 0, marginTop: 2, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {mode === opt.id && <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#fff' }} />}
                  </div>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '.85rem', color: mode === opt.id ? 'var(--accent)' : 'var(--text)' }}>{opt.label}</div>
                    <div style={{ fontSize: '.73rem', color: 'var(--text3)', marginTop: '.15rem' }}>{opt.desc}</div>
                  </div>
                </button>
              ))}
              <div style={{ padding: '.65rem', background: 'var(--surface2)', borderRadius: 'var(--r-s)', border: '1px solid var(--border)', fontSize: '.75rem', color: 'var(--text2)', lineHeight: 1.6 }}>
                Contenu inclus : titre, date, objectifs, activite, devoirs, documents, a revoir, absents
              </div>
            </div>
          </div>
        </div>

        {selCls && (
          <div className="card" style={{ marginTop: '1rem', maxWidth: 760 }}>
            <div className="card-hd"><div className="card-title">Fiches a exporter ({clsFiches.length})</div></div>
            <div className="card-body">
              {clsFiches.length === 0 ? (
                <div style={{ color: 'var(--text3)', fontSize: '.82rem', fontStyle: 'italic' }}>
                  Aucune fiche pour cette classe. Creez des fiches dans le module Carnet de bord.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '.32rem' }}>
                  {clsFiches.map((f, i) => (
                    <div key={f.id} style={{ display: 'flex', alignItems: 'center', gap: '.75rem', padding: '.38rem .65rem', background: 'var(--surface2)', borderRadius: 'var(--r-xs)', fontSize: '.8rem' }}>
                      <span style={{ color: 'var(--text3)', fontWeight: 600, minWidth: 24 }}>#{i + 1}</span>
                      <span style={{ flex: 1, fontWeight: 500 }}>{f.titre || 'Sans titre'}</span>
                      <span style={{ color: 'var(--text3)', fontSize: '.72rem' }}>{fmtD(f.date)}</span>
                      {(f.absents || []).length > 0 && <span style={{ color: 'var(--danger)', fontSize: '.7rem', fontWeight: 600 }}>{f.absents.length} absent(s)</span>}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </>
  );
}

// ── MODULE PDF BULLETINS ─────────────────────────────────────────────────────
function ModulePdfBulletins({ cpData }) {
  const tousLesBulletins = cpData?.bulletins || [];
  const profile = cpData?.profile || {};

  // Classes disponibles dans les bulletins
  const classesDispos = useMemo(() => {
    const s = new Set(tousLesBulletins.map(b => b.classe).filter(Boolean));
    return [...s].sort();
  }, [tousLesBulletins]);

  const [selClasse, setSelClasse] = useState(() => classesDispos[0] || null);
  const [modeSelection, setModeSelection] = useState('tous'); // 'tous' | 'choix'
  const [generating, setGenerating] = useState(false);
  const [done, setDone] = useState(false);
  const [optionsPdf, setOptionsPdf] = useState({
    moyennes: true,
    notes: true,
    moyClasse: true,
    appreciation: true,
    absences: true,
    orientation: true,
  });

  const toggleOpt = (key) => setOptionsPdf(p => ({ ...p, [key]: !p[key] }));

  // Bulletins de la classe selectionnee
  const bulletins = useMemo(() => {
    if (!selClasse) return tousLesBulletins;
    return tousLesBulletins.filter(b => b.classe === selClasse);
  }, [tousLesBulletins, selClasse]);

  const [selEleves, setSelEleves] = useState(() => new Set(bulletins.map(b => b.id)));

  // Resync selEleves quand la classe change
  useEffect(() => {
    setSelEleves(new Set(bulletins.map(b => b.id)));
    setModeSelection('tous');
  }, [selClasse]);

  const elevesExportes = modeSelection === 'tous'
    ? bulletins
    : bulletins.filter(b => selEleves.has(b.id));

  const toggleEleve = (id) => {
    setSelEleves(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const toggleTous = () => {
    if (selEleves.size === bulletins.length) setSelEleves(new Set());
    else setSelEleves(new Set(bulletins.map(b => b.id)));
  };

  const colorMoy = (v) => {
    if (v == null || isNaN(v)) return [100, 116, 139];
    if (v >= 16) return [15, 155, 110];
    if (v >= 12) return [59, 91, 219];
    if (v >= 10) return [217, 119, 6];
    return [220, 38, 38];
  };

  const fmtNote = (v) => {
    if (v == null || isNaN(v)) return '-';
    return parseFloat(v).toFixed(2);
  };

  const genererPdf = async () => {
    if (elevesExportes.length === 0) return;
    if (!window.jspdf) { alert('jsPDF non chargé. Vérifiez vendor/jspdf.umd.min.js'); return; }

    setGenerating(true);
    setDone(false);

    try {
      const { jsPDF } = window.jspdf;
      const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      const PW = 210, PH = 297, ML = 12, MR = 12, MB = 12;
      const CW = PW - ML - MR;
      const ACCENT  = [59, 91, 219];
      const DARK    = [15, 23, 42];
      const GRAY    = [100, 116, 139];
      const LIGHT   = [241, 245, 249];
      const WHITE   = [255, 255, 255];
      const SUCCESS = [15, 155, 110];
      const WARN    = [217, 119, 6];
      const DANGER  = [220, 38, 38];

      const drawPageHeader = (eleve, pageNum, totalPages) => {
        // Bande accent
        doc.setFillColor(...ACCENT);
        doc.rect(0, 0, PW, 24, 'F');

        // Etablissement + classe
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(9.5);
        doc.setTextColor(...WHITE);
        doc.text(profile.etablissement || 'ClassPro Desktop', ML, 8);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);
        doc.text(
          (profile.prenom || '') + ' ' + (profile.nom || '') +
          '   |   Classe : ' + (profile.classe || '?') +
          '   |   Annee : ' + (profile.annee || '?'),
          ML, 14
        );

        // Nom eleve (droite)
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(11);
        doc.text(eleve.name || '', PW - MR, 9, { align: 'right' });
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);
        doc.text('Trimestre ' + (eleve.trimester || '?'), PW - MR, 14.5, { align: 'right' });

        // Ligne separatrice
        doc.setDrawColor(220, 230, 250);
        doc.setLineWidth(0.3);
        doc.line(ML, 26, PW - MR, 26);

        // Pied de page
        doc.setFontSize(7);
        doc.setTextColor(...GRAY);
        doc.text('ClassPro Desktop', ML, PH - 6);
        doc.text(pageNum + ' / ' + totalPages, PW - MR, PH - 6, { align: 'right' });
      };

      const drawMoyenneBox = (eleve, x, y, w) => {
        const moy = eleve.generalAverage;
        const moyT1 = eleve.generalAverageT1;
        const moyClasse = eleve.generalAverageClass;
        const [r, g, b] = colorMoy(moy);

        doc.setFillColor(...LIGHT);
        doc.roundedRect(x, y, w, 18, 2, 2, 'F');

        // Moyenne T2
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(7);
        doc.setTextColor(...GRAY);
        doc.text('MOY. T2', x + 4, y + 5);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(15);
        doc.setTextColor(r, g, b);
        doc.text(fmtNote(moy) + '/20', x + 4, y + 13);

        // Moyenne T1
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7);
        doc.setTextColor(...GRAY);
        doc.text('T1 : ' + fmtNote(moyT1), x + w / 2 - 5, y + 6);
        doc.text('Classe : ' + fmtNote(moyClasse), x + w / 2 - 5, y + 11);

        // Variation
        if (moy != null && moyT1 != null) {
          const diff = parseFloat((moy - moyT1).toFixed(2));
          const [dr, dg, db] = diff >= 0 ? SUCCESS : DANGER;
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(8);
          doc.setTextColor(dr, dg, db);
          const arrow = diff > 0.05 ? '+' : diff < -0.05 ? '' : '';
          doc.text(arrow + diff.toFixed(2), x + w - 12, y + 10);
        }

        return y + 20;
      };

      const totalPages = elevesExportes.length;

      elevesExportes.forEach((eleve, eleveIdx) => {
        if (eleveIdx > 0) doc.addPage();
        drawPageHeader(eleve, eleveIdx + 1, totalPages);

        let y = 29;

        // Ligne infos rapides (absences, orientation)
        const infos = [];
        if (optionsPdf.absences && eleve.absences?.demiJournees != null)
          infos.push('Absences : ' + eleve.absences.demiJournees + ' demi-journees');
        if (optionsPdf.absences && eleve.retards) infos.push('Retards : ' + eleve.retards);
        if (optionsPdf.orientation && eleve.orientation?.filiere) infos.push('Orientation : ' + eleve.orientation.filiere);
        if (optionsPdf.orientation && eleve.orientation?.avis) infos.push('Avis : ' + eleve.orientation.avis);

        if (infos.length > 0) {
          doc.setFont('helvetica', 'normal');
          doc.setFontSize(7.5);
          doc.setTextColor(...GRAY);
          doc.text(infos.join('   |   '), ML, y + 3);
          y += 7;
        }

        // Box moyenne generale
        if (optionsPdf.moyennes) y = drawMoyenneBox(eleve, ML, y, CW);
        else y += 2;

        // Tableau des matieres
        const subjects = eleve.subjects || [];
        if (optionsPdf.notes && subjects.length > 0) {
          // En-tete tableau
          const cols = { nom: 74, t2: 22, t1: 22, classe: 22, reste: CW - 74 - 22 - 22 - 22 };
          const rowH = 6.5;
          const headerH = 7;

          doc.setFillColor(...ACCENT);
          doc.rect(ML, y, CW, headerH, 'F');
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(7);
          doc.setTextColor(...WHITE);
          doc.text('Matiere', ML + 2, y + 4.8);
          doc.text('T2', ML + cols.nom + 2, y + 4.8);
          doc.text('T1', ML + cols.nom + cols.t2 + 2, y + 4.8);
          doc.text('Classe', ML + cols.nom + cols.t2 + cols.t1 + 2, y + 4.8);
          y += headerH;

          subjects.forEach((sub, si) => {
            // Verifier debordement page
            if (y + rowH > PH - MB - 30) {
              doc.addPage();
              drawPageHeader(eleve, eleveIdx + 1, totalPages);
              y = 29;
              // Re-dessiner en-tete tableau
              doc.setFillColor(...ACCENT);
              doc.rect(ML, y, CW, headerH, 'F');
              doc.setFont('helvetica', 'bold');
              doc.setFontSize(7);
              doc.setTextColor(...WHITE);
              doc.text('Matiere (suite)', ML + 2, y + 4.8);
              doc.text('T2', ML + cols.nom + 2, y + 4.8);
              doc.text('T1', ML + cols.nom + cols.t2 + 2, y + 4.8);
              doc.text('Classe', ML + cols.nom + cols.t2 + cols.t1 + 2, y + 4.8);
              y += headerH;
            }

            const bg = si % 2 === 0 ? WHITE : LIGHT;
            doc.setFillColor(...bg);
            doc.rect(ML, y, CW, rowH, 'F');

            // Bordure legere
            doc.setDrawColor(220, 230, 250);
            doc.setLineWidth(0.2);
            doc.line(ML, y + rowH, ML + CW, y + rowH);

            // Nom matiere
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(7);
            doc.setTextColor(...DARK);
            const nomMat = (sub.name || '').length > 28
              ? (sub.name || '').slice(0, 27) + '.'
              : (sub.name || '');
            doc.text(nomMat, ML + 2, y + 4.5);

            // Note T2
            const [r2, g2, b2] = colorMoy(sub.gradeStudent);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(r2, g2, b2);
            doc.text(fmtNote(sub.gradeStudent), ML + cols.nom + 2, y + 4.5);

            // Note T1
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(...GRAY);
            doc.text(fmtNote(sub.gradeT1), ML + cols.nom + cols.t2 + 2, y + 4.5);

            // Moyenne classe
            doc.text(fmtNote(sub.gradeClass), ML + cols.nom + cols.t2 + cols.t1 + 2, y + 4.5);

            y += rowH;
          });

          y += 5;
        }

        // Appreciation generale
        const appGen = (eleve.appreciationGenerale || '').trim();
        if (optionsPdf.appreciation && appGen && y < PH - MB - 25) {
          doc.setFillColor(...LIGHT);
          doc.roundedRect(ML, y, CW, 6, 1, 1, 'F');
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(7.5);
          doc.setTextColor(...ACCENT);
          doc.text('Appreciation generale du conseil', ML + 2.5, y + 4.2);
          y += 7.5;

          doc.setFont('helvetica', 'italic');
          doc.setFontSize(7.5);
          doc.setTextColor(...DARK);
          const appLines = doc.splitTextToSize('"' + appGen + '"', CW - 4);
          const maxLines = Math.floor((PH - MB - y - 5) / 4.5);
          appLines.slice(0, maxLines).forEach(line => {
            doc.text(line, ML + 2, y + 3.5);
            y += 4.5;
          });
          if (appLines.length > maxLines) {
            doc.setTextColor(...GRAY);
            doc.text('...', ML + 2, y);
          }
        }
      });

      // Sauvegarder
      const dateStr = new Date().toLocaleDateString('fr-FR').replace(/\//g, '-');
      const nomClasse = (selClasse || profile.classe || 'classe').replace(/[^a-zA-Z0-9]/g, '_');
      const defaultName = 'Bulletins_' + nomClasse + '_T' + (bulletins[0]?.trimester || '?') + '_' + dateStr + '.pdf';
      const pdfBase64 = doc.output('datauristring').split(',')[1];
      const result = await window.cpd.savePdf(pdfBase64, defaultName);
      if (result?.ok) { setDone(true); setTimeout(() => setDone(false), 3000); }

    } catch (err) {
      console.error('Erreur PDF Bulletins:', err);
      alert('Erreur : ' + err.message);
    }
    setGenerating(false);
  };

  if (!cpData || bulletins.length === 0) {
    return <ModulePlaceholder icon="📄" title="PDF Bulletins" sub="Aucun bulletin disponible dans ce fichier ClassPro." soon={false} />;
  }

  return (
    <>
      <div className="page-hd">
        <div>
          <div className="phd-badge">📄 PDF</div>
          <div className="phd-title">PDF Bulletins — Conseil de classe</div>
          <div className="phd-sub">
            {selClasse || profile.classe || '?'} · Trimestre {bulletins[0]?.trimester || '?'} · {elevesExportes.length} eleve(s) a exporter
          </div>
        </div>
        <div className="phd-actions">
          <button
            className="btn btn-primary"
            onClick={genererPdf}
            disabled={elevesExportes.length === 0 || generating}
          >
            {generating ? 'Generation...' : done ? 'PDF sauvegarde !' : 'Generer le PDF (' + elevesExportes.length + ')'}
          </button>
        </div>
      </div>

      <div className="page-content">

        {/* Selecteur de classe */}
        {classesDispos.length > 1 && (
          <div style={{ marginBottom: '1rem' }}>
            <div style={{ fontSize: '.72rem', fontWeight: 700, color: 'var(--text2)', textTransform: 'uppercase', letterSpacing: '.07em', marginBottom: '.4rem' }}>Classe</div>
            <div style={{ display: 'flex', gap: '.38rem', flexWrap: 'wrap' }}>
              {classesDispos.map(cls => (
                <button key={cls} onClick={() => setSelClasse(cls)}
                  style={{ padding: '.38rem .875rem', borderRadius: 'var(--r-s)', border: '1.5px solid ' + (selClasse === cls ? 'var(--accent)' : 'var(--border)'), background: selClasse === cls ? 'var(--accent)' : 'var(--surface)', color: selClasse === cls ? '#fff' : 'var(--text2)', fontFamily: 'Roboto, sans-serif', fontSize: '.82rem', fontWeight: 600, cursor: 'pointer', transition: 'all .15s' }}>
                  {cls} <span style={{ opacity: .7, fontSize: '.72rem' }}>({tousLesBulletins.filter(b => b.classe === cls).length})</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Options PDF */}
        <div className="card" style={{ marginBottom: '1rem' }}>
          <div className="card-hd"><div className="card-title">⚙️ Contenu du PDF</div></div>
          <div className="card-body" style={{ display: 'flex', flexWrap: 'wrap', gap: '.5rem' }}>
            {[
              { key: 'moyennes',    label: 'Moyennes T1 / T2' },
              { key: 'notes',       label: 'Notes par matière' },
              { key: 'moyClasse',   label: 'Moyenne classe' },
              { key: 'appreciation',label: 'Appréciation générale' },
              { key: 'absences',    label: 'Absences / Retards' },
              { key: 'orientation', label: 'Orientation' },
            ].map(opt => (
              <button key={opt.key} onClick={() => toggleOpt(opt.key)}
                style={{ display: 'flex', alignItems: 'center', gap: '.45rem', padding: '.35rem .75rem', borderRadius: 99, border: '1.5px solid ' + (optionsPdf[opt.key] ? 'var(--accent)' : 'var(--border)'), background: optionsPdf[opt.key] ? 'rgba(59,91,219,.1)' : 'var(--surface2)', color: optionsPdf[opt.key] ? 'var(--accent)' : 'var(--text3)', fontFamily: 'Roboto, sans-serif', fontSize: '.78rem', fontWeight: optionsPdf[opt.key] ? 700 : 400, cursor: 'pointer', transition: 'all .15s' }}>
                <span style={{ fontSize: '.8rem' }}>{optionsPdf[opt.key] ? '✓' : '○'}</span>
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Mode selection */}
        <div style={{ display: 'flex', gap: '.5rem', marginBottom: '1rem' }}>
          {[
            { id: 'tous', label: 'Tous les eleves (' + bulletins.length + ')' },
            { id: 'choix', label: 'Selection manuelle' },
          ].map(opt => (
            <button key={opt.id} onClick={() => setModeSelection(opt.id)}
              style={{ padding: '.42rem .875rem', borderRadius: 'var(--r-s)', border: '1.5px solid ' + (modeSelection === opt.id ? 'var(--accent)' : 'var(--border)'), background: modeSelection === opt.id ? 'var(--accent)' : 'var(--surface)', color: modeSelection === opt.id ? '#fff' : 'var(--text2)', fontFamily: 'Roboto, sans-serif', fontSize: '.8rem', fontWeight: 600, cursor: 'pointer', transition: 'all .15s' }}>
              {opt.label}
            </button>
          ))}
          {modeSelection === 'choix' && (
            <button onClick={toggleTous}
              style={{ padding: '.42rem .875rem', borderRadius: 'var(--r-s)', border: '1px solid var(--border)', background: 'var(--surface2)', color: 'var(--text2)', fontFamily: 'Roboto, sans-serif', fontSize: '.78rem', cursor: 'pointer' }}>
              {selEleves.size === bulletins.length ? 'Tout deselectionner' : 'Tout selectionner'}
            </button>
          )}
        </div>

        {/* Liste eleves */}
        <div className="card">
          <div className="card-hd">
            <div className="card-title">
              {modeSelection === 'tous' ? 'Eleves inclus dans le PDF' : 'Selectionner les eleves (' + selEleves.size + ' selectionnes)'}
            </div>
          </div>
          <div className="card-body" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '.38rem' }}>
            {bulletins.map(b => {
              const inclus = modeSelection === 'tous' || selEleves.has(b.id);
              const [r, g, bv] = colorMoy(b.generalAverage);
              return (
                <button key={b.id}
                  onClick={() => modeSelection === 'choix' && toggleEleve(b.id)}
                  style={{ display: 'flex', alignItems: 'center', gap: '.65rem', padding: '.45rem .75rem', border: '1.5px solid ' + (inclus ? 'var(--accent)' : 'var(--border)'), borderRadius: 'var(--r-s)', background: inclus ? 'rgba(59,91,219,.06)' : 'var(--surface2)', cursor: modeSelection === 'choix' ? 'pointer' : 'default', fontFamily: 'Roboto, sans-serif', transition: 'all .13s', textAlign: 'left' }}>
                  {modeSelection === 'choix' && (
                    <div style={{ width: 16, height: 16, borderRadius: 4, border: '2px solid ' + (inclus ? 'var(--accent)' : 'var(--border)'), background: inclus ? 'var(--accent)' : 'transparent', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {inclus && <span style={{ color: '#fff', fontSize: '.6rem', fontWeight: 900 }}>✓</span>}
                    </div>
                  )}
                  <span style={{ flex: 1, fontSize: '.82rem', fontWeight: inclus ? 600 : 400, color: inclus ? 'var(--text)' : 'var(--text3)' }}>{b.name}</span>
                  <span style={{ fontSize: '.78rem', fontWeight: 700, color: 'rgb(' + r + ',' + g + ',' + bv + ')' }}>
                    {b.generalAverage != null ? parseFloat(b.generalAverage).toFixed(1) : '-'}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Resume contenu PDF */}
        <div className="card" style={{ marginTop: '1rem' }}>
          <div className="card-hd"><div className="card-title">Contenu du PDF</div></div>
          <div className="card-body" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '.5rem' }}>
            {[
              { label: 'Moyenne T1 et T2', ok: true },
              { label: 'Notes par matiere', ok: true },
              { label: 'Moyenne classe / matiere', ok: true },
              { label: 'Appreciation generale', ok: true },
              { label: 'Absences et retards', ok: true },
              { label: 'Orientation', ok: true },
              { label: 'Une page par eleve', ok: true },
              { label: 'En-tete etablissement', ok: true },
            ].map(item => (
              <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: '.5rem', fontSize: '.8rem', color: 'var(--text2)' }}>
                <span style={{ color: 'var(--success)', fontWeight: 700 }}>✓</span>
                {item.label}
              </div>
            ))}
          </div>
        </div>

      </div>
    </>
  );
}

// ── MODULE PDF PROGRESSION ────────────────────────────────────────────────────
function ModulePdfProgression({ cpData }) {
  const classes = cpData?.classes || [];
  const progs = cpData?.progs || {};
  const profile = cpData?.profile || {};

  // Classes qui ont une progression
  const classesAvecProg = useMemo(() =>
    classes.filter(c => progs[c.id]?.rows?.length > 0),
    [classes, progs]
  );

  const [modeExport, setModeExport] = useState('toutes'); // 'toutes' | 'choix'
  const [selClasses, setSelClasses] = useState(() => new Set(classesAvecProg.map(c => c.id)));
  const [generating, setGenerating] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    setSelClasses(new Set(classesAvecProg.map(c => c.id)));
  }, [classesAvecProg.length]);

  const classesExportees = modeExport === 'toutes'
    ? classesAvecProg
    : classesAvecProg.filter(c => selClasses.has(c.id));

  const toggleClasse = (id) => {
    setSelClasses(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const toggleToutes = () => {
    if (selClasses.size === classesAvecProg.length) setSelClasses(new Set());
    else setSelClasses(new Set(classesAvecProg.map(c => c.id)));
  };

  const genererPdf = async () => {
    if (classesExportees.length === 0) return;
    if (!window.jspdf) { alert('jsPDF non charge. Verifiez vendor/jspdf.umd.min.js'); return; }

    setGenerating(true);
    setDone(false);

    try {
      const { jsPDF } = window.jspdf;
      // Paysage A4
      const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
      const PW = 297, PH = 210, ML = 12, MR = 12, MT = 12, MB = 12;
      const CW = PW - ML - MR;
      const ACCENT = [59, 91, 219];
      const DARK   = [15, 23, 42];
      const GRAY   = [100, 116, 139];
      const LIGHT  = [241, 245, 249];
      const WHITE  = [255, 255, 255];

      const drawHeader = (cls, pageNum, totalPages) => {
        // Bande accent
        doc.setFillColor(...ACCENT);
        doc.rect(0, 0, PW, 20, 'F');

        // Etablissement
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(9.5);
        doc.setTextColor(...WHITE);
        doc.text(profile.etablissement || 'ClassPro Desktop', ML, 8);

        // Prof + annee
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);
        doc.text(
          (profile.prenom || '') + ' ' + (profile.nom || '') +
          '   |   Annee : ' + (profile.annee || '?'),
          ML, 14
        );

        // Classe (droite)
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(13);
        doc.text('Progression annuelle — ' + (cls?.name || ''), PW - MR, 9, { align: 'right' });

        // Pagination
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7);
        doc.setTextColor(...GRAY);
        doc.text('ClassPro Desktop', ML, PH - 6);
        doc.text(pageNum + ' / ' + totalPages, PW - MR, PH - 6, { align: 'right' });
      };

      let pageNum = 0;
      const totalPages = classesExportees.length;

      classesExportees.forEach((cls, clsIdx) => {
        if (clsIdx > 0) doc.addPage();
        pageNum++;
        drawHeader(cls, pageNum, totalPages);

        const prog = progs[cls.id];
        const cols = prog?.cols || [];
        const rows = prog?.rows || [];

        if (cols.length === 0 || rows.length === 0) {
          doc.setFont('helvetica', 'italic');
          doc.setFontSize(10);
          doc.setTextColor(...GRAY);
          doc.text('Aucune sequence enregistree pour cette classe.', ML, 35);
          return;
        }

        // Calcul des largeurs de colonnes
        const availW = CW;
        // Largeur min par colonne, proportionnelle
        const totalConfigW = cols.reduce((s, c) => s + (c.width || 120), 0);
        const colWidths = cols.map(c => Math.max(15, ((c.width || 120) / totalConfigW) * availW));

        const rowH = 8;
        const headerH = 9;
        let y = 23;

        // En-tete du tableau
        doc.setFillColor(...ACCENT);
        doc.rect(ML, y, CW, headerH, 'F');

        let x = ML;
        cols.forEach((col, ci) => {
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(7.5);
          doc.setTextColor(...WHITE);
          const label = (col.label || '').slice(0, 18);
          doc.text(label, x + 2, y + 6);
          x += colWidths[ci];
        });
        y += headerH;

        // Lignes du tableau
        rows.forEach((row, ri) => {
          // Verifier debordement
          if (y + rowH > PH - MB - 10) {
            doc.addPage();
            pageNum++;
            // Note: on ne compte pas ces pages dans totalPages car on ne peut pas savoir à l'avance
            drawHeader(cls, pageNum, totalPages);
            y = 23;

            // Re-dessiner en-tete tableau
            doc.setFillColor(...ACCENT);
            doc.rect(ML, y, CW, headerH, 'F');
            let xh = ML;
            cols.forEach((col, ci) => {
              doc.setFont('helvetica', 'bold');
              doc.setFontSize(7.5);
              doc.setTextColor(...WHITE);
              doc.text((col.label || '').slice(0, 18), xh + 2, y + 6);
              xh += colWidths[ci];
            });
            y += headerH;
          }

          // Fond alterné
          doc.setFillColor(...(ri % 2 === 0 ? WHITE : LIGHT));
          doc.rect(ML, y, CW, rowH, 'F');

          // Bordure basse
          doc.setDrawColor(220, 230, 250);
          doc.setLineWidth(0.2);
          doc.line(ML, y + rowH, ML + CW, y + rowH);

          // Cellules
          let cx = ML;
          cols.forEach((col, ci) => {
            const val = (row[col.id] || '').toString().trim();
            const maxChars = Math.floor(colWidths[ci] / 1.8);
            const display = val.length > maxChars ? val.slice(0, maxChars - 1) + '...' : val;

            doc.setFont('helvetica', ci === 0 ? 'bold' : 'normal');
            doc.setFontSize(7.5);
            doc.setTextColor(...DARK);
            doc.text(display, cx + 2, y + 5.5);

            // Separateur vertical
            doc.setDrawColor(220, 230, 250);
            doc.setLineWidth(0.2);
            doc.line(cx + colWidths[ci], y, cx + colWidths[ci], y + rowH);

            cx += colWidths[ci];
          });

          y += rowH;
        });

        // Bordure du tableau
        doc.setDrawColor(200, 215, 245);
        doc.setLineWidth(0.4);
        doc.rect(ML, 23, CW, y - 23, 'S');

        // Recap bas de page
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7.5);
        doc.setTextColor(...GRAY);
        doc.text(rows.length + ' sequence(s) · ' + cols.length + ' colonne(s)', ML, PH - 10);
      });

      // Sauvegarder
      const dateStr = new Date().toLocaleDateString('fr-FR').replace(/\//g, '-');
      const suffixe = classesExportees.length === 1
        ? classesExportees[0].name.replace(/[^a-zA-Z0-9]/g, '_')
        : 'toutes_classes';
      const defaultName = 'Progression_' + suffixe + '_' + dateStr + '.pdf';
      const pdfBase64 = doc.output('datauristring').split(',')[1];
      const result = await window.cpd.savePdf(pdfBase64, defaultName);
      if (result?.ok) { setDone(true); setTimeout(() => setDone(false), 3000); }

    } catch (err) {
      console.error('Erreur PDF Progression:', err);
      alert('Erreur : ' + err.message);
    }
    setGenerating(false);
  };

  if (!cpData) return <ModulePlaceholder icon="📄" title="PDF Progression" sub="Ouvrez d'abord un fichier ClassPro." />;

  if (classesAvecProg.length === 0) {
    return (
      <>
        <div className="page-hd">
          <div>
            <div className="phd-badge">📄 PDF</div>
            <div className="phd-title">PDF Progression annuelle</div>
            <div className="phd-sub">Aucune progression renseignee</div>
          </div>
        </div>
        <div className="page-content">
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem', padding: '3rem', color: 'var(--text3)' }}>
            <div style={{ fontSize: '3rem', opacity: .15 }}>📆</div>
            <div style={{ fontWeight: 700, color: 'var(--text2)' }}>Aucune progression a exporter</div>
            <div style={{ fontSize: '.83rem' }}>Creez des progressions dans le module Progression annuelle.</div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <div className="page-hd">
        <div>
          <div className="phd-badge">📄 PDF</div>
          <div className="phd-title">PDF Progression annuelle</div>
          <div className="phd-sub">{classesExportees.length} classe(s) a exporter · Format paysage A4</div>
        </div>
        <div className="phd-actions">
          <button
            className="btn btn-primary"
            onClick={genererPdf}
            disabled={classesExportees.length === 0 || generating}
          >
            {generating ? 'Generation...' : done ? 'PDF sauvegarde !' : 'Generer le PDF (' + classesExportees.length + ' classe' + (classesExportees.length > 1 ? 's' : '') + ')'}
          </button>
        </div>
      </div>

      <div className="page-content">

        {/* Mode export */}
        <div style={{ display: 'flex', gap: '.5rem', marginBottom: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
          {[
            { id: 'toutes', label: 'Toutes les classes (' + classesAvecProg.length + ')' },
            { id: 'choix',  label: 'Selection manuelle' },
          ].map(opt => (
            <button key={opt.id} onClick={() => setModeExport(opt.id)}
              style={{ padding: '.42rem .875rem', borderRadius: 'var(--r-s)', border: '1.5px solid ' + (modeExport === opt.id ? 'var(--accent)' : 'var(--border)'), background: modeExport === opt.id ? 'var(--accent)' : 'var(--surface)', color: modeExport === opt.id ? '#fff' : 'var(--text2)', fontFamily: 'Roboto, sans-serif', fontSize: '.8rem', fontWeight: 600, cursor: 'pointer', transition: 'all .15s' }}>
              {opt.label}
            </button>
          ))}
          {modeExport === 'choix' && (
            <button onClick={toggleToutes}
              style={{ padding: '.42rem .875rem', borderRadius: 'var(--r-s)', border: '1px solid var(--border)', background: 'var(--surface2)', color: 'var(--text2)', fontFamily: 'Roboto, sans-serif', fontSize: '.78rem', cursor: 'pointer' }}>
              {selClasses.size === classesAvecProg.length ? 'Tout deselectionner' : 'Tout selectionner'}
            </button>
          )}
        </div>

        {/* Liste des classes */}
        <div className="card">
          <div className="card-hd">
            <div className="card-title">
              {modeExport === 'toutes' ? 'Classes incluses' : 'Selectionner les classes (' + selClasses.size + ')'}
            </div>
          </div>
          <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: '.38rem' }}>
            {classesAvecProg.map(cls => {
              const prog = progs[cls.id];
              const nb = prog?.rows?.length || 0;
              const nbCols = prog?.cols?.length || 0;
              const incluse = modeExport === 'toutes' || selClasses.has(cls.id);
              return (
                <button key={cls.id}
                  onClick={() => modeExport === 'choix' && toggleClasse(cls.id)}
                  style={{ display: 'flex', alignItems: 'center', gap: '.75rem', padding: '.55rem .875rem', border: '1.5px solid ' + (incluse ? 'var(--accent)' : 'var(--border)'), borderRadius: 'var(--r-s)', background: incluse ? 'rgba(59,91,219,.06)' : 'var(--surface2)', cursor: modeExport === 'choix' ? 'pointer' : 'default', fontFamily: 'Roboto, sans-serif', transition: 'all .13s', textAlign: 'left' }}>
                  {modeExport === 'choix' && (
                    <div style={{ width: 16, height: 16, borderRadius: 4, border: '2px solid ' + (incluse ? 'var(--accent)' : 'var(--border)'), background: incluse ? 'var(--accent)' : 'transparent', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {incluse && <span style={{ color: '#fff', fontSize: '.6rem', fontWeight: 900 }}>✓</span>}
                    </div>
                  )}
                  <div style={{ width: 40, height: 40, borderRadius: 10, background: incluse ? 'var(--accent)' : 'var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: incluse ? '#fff' : 'var(--text3)', fontWeight: 800, fontSize: '.82rem', flexShrink: 0 }}>
                    {(cls.name || '?').slice(0, 2).toUpperCase()}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, fontSize: '.9rem', color: incluse ? 'var(--text)' : 'var(--text3)' }}>{cls.name}</div>
                    <div style={{ fontSize: '.73rem', color: 'var(--text3)', marginTop: '.1rem' }}>
                      {nb} sequence{nb > 1 ? 's' : ''} · {nbCols} colonne{nbCols > 1 ? 's' : ''}
                    </div>
                  </div>
                  <div style={{ fontSize: '.72rem', color: 'var(--text3)' }}>1 page</div>
                </button>
              );
            })}

            {/* Classes sans progression */}
            {classes.filter(c => !progs[c.id]?.rows?.length).map(cls => (
              <div key={cls.id} style={{ display: 'flex', alignItems: 'center', gap: '.75rem', padding: '.55rem .875rem', border: '1px dashed var(--border)', borderRadius: 'var(--r-s)', opacity: .45 }}>
                <div style={{ width: 40, height: 40, borderRadius: 10, background: 'var(--surface2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text3)', fontWeight: 800, fontSize: '.82rem', flexShrink: 0 }}>
                  {(cls.name || '?').slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <div style={{ fontWeight: 600, fontSize: '.88rem', color: 'var(--text3)' }}>{cls.name}</div>
                  <div style={{ fontSize: '.72rem', color: 'var(--text3)' }}>Aucune progression — non exportable</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Info format */}
        <div className="card" style={{ marginTop: '1rem' }}>
          <div className="card-hd"><div className="card-title">Format du PDF</div></div>
          <div className="card-body" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '.5rem' }}>
            {[
              'Format paysage A4',
              'Une page par classe',
              'Toutes les colonnes',
              'En-tete etablissement + prof',
              'Tableau alterne bicolore',
              'Pagination automatique',
            ].map(item => (
              <div key={item} style={{ display: 'flex', alignItems: 'center', gap: '.5rem', fontSize: '.8rem', color: 'var(--text2)' }}>
                <span style={{ color: 'var(--success)', fontWeight: 700 }}>✓</span>
                {item}
              </div>
            ))}
          </div>
        </div>

      </div>
    </>
  );
}

// ── MODULE CLASSPRO ACADÉMIE ──────────────────────────────────────────────────

const GUIDES = [
  {
    id: 'demarrage',
    icon: '🚀',
    titre: 'Démarrage rapide',
    tags: ['début', 'premier lancement', 'installation', 'démarrage'],
    sections: [
      {
        titre: 'Bienvenue dans ClassPro Desktop',
        contenu: `ClassPro Desktop est le logiciel complémentaire à ClassPro (l'outil web utilisé en classe). Il vous permet de travailler sur vos données depuis votre ordinateur personnel, sans connexion internet, et de générer des documents PDF professionnels.`,
      },
      {
        titre: '1. Lancer l\'application',
        contenu: `Au premier lancement, vous arrivez sur l'écran d'accueil. Vous verrez deux options :\n\n• Ouvrir un fichier ClassPro — pour charger un JSON exporté depuis ClassPro\n• Nouveau fichier — bientôt disponible`,
      },
      {
        titre: '2. Naviguer dans l\'interface',
        contenu: `L'interface est divisée en deux parties :\n\n• La sidebar à gauche — contient toute la navigation organisée en sections : Vue générale, Modules pédagogiques, Génération PDF, et ClassPro Académie\n• La zone principale à droite — affiche le module sélectionné\n\nEn bas de l'écran, vous trouvez un bouton Sauvegarder JSON pour exporter vos modifications, et un bouton pour basculer entre le thème clair et sombre.`,
      },
      {
        titre: '3. Premier pas recommandé',
        contenu: `Commencez par importer votre fichier JSON depuis ClassPro, puis explorez vos données dans "Données importées". Vous pourrez ensuite utiliser les différents modules pour enrichir votre suivi pédagogique.`,
      },
    ],
  },
  {
    id: 'import',
    icon: '📂',
    titre: 'Importer un fichier JSON',
    tags: ['import', 'json', 'fichier', 'ouvrir', 'charger', 'classpro'],
    sections: [
      {
        titre: 'Qu\'est-ce que le fichier JSON ClassPro ?',
        contenu: `ClassPro (l'outil web sur clé USB) exporte toutes vos données dans un fichier JSON unique. Ce fichier contient : votre profil, vos classes, séances, fiches de cours, bulletins, progression, emploi du temps et plus encore.`,
      },
      {
        titre: 'Comment exporter depuis ClassPro',
        contenu: `Dans ClassPro (sur votre clé USB ou navigateur) :\n\n1. Allez dans les Paramètres ou le menu principal\n2. Cherchez "Exporter" ou "Sauvegarder"\n3. Téléchargez le fichier JSON sur votre ordinateur\n\nLe nom du fichier ressemble à : ClassPro_NOM_PRENOM_date.json`,
      },
      {
        titre: 'Importer dans ClassPro Desktop',
        contenu: `Depuis l'écran d'accueil :\n\n1. Cliquez sur "Ouvrir un fichier ClassPro"\n2. Une fenêtre de sélection s'ouvre — naviguez jusqu'à votre fichier JSON\n3. Sélectionnez-le et cliquez sur Ouvrir\n\nAlternativement, utilisez le menu Fichier → Ouvrir un JSON ClassPro… ou le raccourci Cmd+O (Mac) / Ctrl+O (Windows).`,
      },
      {
        titre: 'Après l\'import',
        contenu: `Une fois le fichier chargé, vous êtes redirigé vers l'Accueil avec un résumé de vos données. Le nom du fichier apparaît en bas de la sidebar.\n\nVos fichiers récents sont mémorisés pour un accès rapide lors des prochains lancements.`,
      },
      {
        titre: 'Sauvegarder vos modifications',
        contenu: `Après avoir édité vos données dans les différents modules, cliquez sur "Sauvegarder JSON" en bas de l'écran (ou Cmd+S). Cela crée un nouveau fichier JSON que vous pouvez réimporter dans ClassPro pour mettre à jour vos données sur la clé.`,
      },
    ],
  },
  {
    id: 'suivi',
    icon: '👥',
    titre: 'Suivi de classe',
    tags: ['suivi', 'classe', 'séance', 'observation', 'élève', 'comportement'],
    sections: [
      {
        titre: 'À quoi sert le Suivi de classe ?',
        contenu: `Le module Suivi de classe vous permet d'enregistrer des observations pour chaque élève, séance par séance. C'est un outil de suivi comportemental et participatif qui vous donne une vue d'ensemble en un coup d'œil.`,
      },
      {
        titre: 'Les 6 observations disponibles',
        contenu: `Pour chaque élève et chaque séance, vous pouvez activer jusqu'à 6 types d'observations :\n\n💬 Bavardage\n📚 Manque de travail\n😶 Dispersé\n✋ Participation\n👍 Bon comportement\n⭐ Excellent`,
      },
      {
        titre: 'Créer une classe',
        contenu: `1. Cliquez sur "+ Classe" en haut à droite\n2. Saisissez le nom de la classe (ex: 3A, 5B…)\n3. Cliquez sur Créer\n\nVous pouvez créer autant de classes que nécessaire. Elles apparaissent dans la sidebar gauche du module.`,
      },
      {
        titre: 'Ajouter des élèves',
        contenu: `Sélectionnez une classe, puis allez dans l'onglet "Élèves" :\n\n• Ajout manuel — saisissez NOM Prénom et appuyez sur Entrée\n• Import liste — collez une liste (un élève par ligne, format NOM Prénom)`,
      },
      {
        titre: 'Enregistrer une séance',
        contenu: `1. Sélectionnez la classe souhaitée\n2. Cliquez sur "+ Séance"\n3. Choisissez la date et un label (ex: Cours, Interro, TP…)\n4. Cliquez sur Créer\n\nLa séance apparaît comme une nouvelle colonne dans le tableau.`,
      },
      {
        titre: 'Saisir des observations',
        contenu: `Dans l'onglet Observations, le tableau affiche tous vos élèves en lignes et vos séances en colonnes. Pour chaque cellule, cliquez sur un emoji pour l'activer (il s'illumine) ou le désactiver.\n\nCliquez sur le nom d'un élève pour voir son bilan complet sur toutes les séances.`,
      },
    ],
  },
  {
    id: 'carnet',
    icon: '📓',
    titre: 'Carnet de bord',
    tags: ['carnet', 'fiche', 'cours', 'séance', 'objectif', 'activité', 'absent'],
    sections: [
      {
        titre: 'À quoi sert le Carnet de bord ?',
        contenu: `Le Carnet de bord est votre journal de cours numérique. Pour chaque séance, vous pouvez noter les objectifs, le déroulement, les devoirs donnés, les documents utilisés, les points à revoir, et marquer les élèves absents.`,
      },
      {
        titre: 'Créer une fiche de cours',
        contenu: `1. Sélectionnez une classe dans le menu déroulant (en haut de la sidebar gauche)\n2. Cliquez sur "+ Nouvelle fiche"\n3. Saisissez un titre (ex: Séance 1 — Le présent de l'indicatif)\n4. Choisissez la date\n5. Cliquez sur Créer la fiche`,
      },
      {
        titre: 'Remplir une fiche',
        contenu: `La fiche est organisée en 6 champs :\n\n🎯 Objectifs — ce que les élèves doivent apprendre\n📝 Activité / Déroulement — comment se déroule la séance\n📚 Devoirs donnés — le travail à faire à la maison\n📄 Documents / Supports — les ressources utilisées\n🔄 À revoir — les notions à consolider\n⚠️ Incidents / Observations — remarques particulières\n\nRemplissez les champs souhaités et cliquez sur Sauvegarder.`,
      },
      {
        titre: 'Marquer les absents',
        contenu: `Si vous avez des élèves enregistrés dans votre classe (via le Suivi de classe), ils apparaissent dans la section "Absents". Cliquez sur un nom pour le marquer absent (il devient rouge). Cliquez à nouveau pour annuler.`,
      },
      {
        titre: 'Retrouver une fiche',
        contenu: `Toutes vos fiches sont listées dans la sidebar gauche, triées par date (la plus récente en premier). Utilisez la barre de recherche pour filtrer par titre ou date.`,
      },
    ],
  },
  {
    id: 'progression',
    icon: '📆',
    titre: 'Progression annuelle',
    tags: ['progression', 'séquence', 'tableau', 'colonne', 'annuelle', 'planification'],
    sections: [
      {
        titre: 'À quoi sert la Progression annuelle ?',
        contenu: `Ce module vous permet de planifier et visualiser votre progression pédagogique sur l'année. Chaque classe dispose d'un tableau personnalisable où vous organisez vos séquences avec les colonnes de votre choix.`,
      },
      {
        titre: 'Créer une progression pour une classe',
        contenu: `1. Sélectionnez une classe dans la sidebar gauche\n2. Si aucune progression n'existe, cliquez sur "+ Créer la progression"\n3. Un tableau vide s'ouvre avec des colonnes par défaut`,
      },
      {
        titre: 'Colonnes par défaut',
        contenu: `Le tableau démarre avec ces colonnes :\n\nN° — numéro de séquence\nTitre — nom de la séquence\nObjectifs — compétences visées\nSupport — manuel ou ressource\nDébut — date de début\nFin — date de fin\nDurée (h) — nombre d'heures\nÉvaluation — type d'éval\nRemarques — notes libres`,
      },
      {
        titre: 'Personnaliser les colonnes',
        contenu: `• Ajouter une colonne — cliquez sur "+ Colonne" et saisissez un nom\n• Renommer une colonne — cliquez sur l'icône ✏️ dans l'en-tête\n• Supprimer une colonne — cliquez sur × dans l'en-tête (les données sont perdues)\n• Réinitialiser — remet les colonnes par défaut (efface toutes les données)`,
      },
      {
        titre: 'Saisir et éditer les données',
        contenu: `Cliquez directement dans une cellule pour la modifier. Les colonnes de type "date" affichent un sélecteur de date. Appuyez sur Tab pour passer à la cellule suivante.\n\nAjoutez une ligne avec "+ Séquence" (en haut à droite ou en bas du tableau). Supprimez une ligne avec l'icône 🗑️ en fin de ligne.`,
      },
    ],
  },
  {
    id: 'conseil',
    icon: '🎓',
    titre: 'Conseil de classe',
    tags: ['conseil', 'bulletin', 'moyenne', 'note', 'élève', 'trimestre', 'appréciation'],
    sections: [
      {
        titre: 'À quoi sert le Conseil de classe ?',
        contenu: `Ce module exploite les données de bulletins importées depuis ClassPro. Il vous offre une vue analytique complète de votre classe pour préparer le conseil de classe : moyennes, évolutions, appréciations et orientations.`,
      },
      {
        titre: 'Les trois vues disponibles',
        contenu: `📊 Tableau récap — liste tous les élèves avec leur moyenne T1, T2, l'évolution, les absences et l'orientation. Cliquez sur un élève pour accéder à sa fiche détaillée.\n\n👤 Fiche élève — vue complète d'un élève : toutes ses notes par matière (T1 et T2), l'évolution par discipline, et l'appréciation générale du conseil.\n\n📚 Par matière — grille élèves × matières avec code couleur des notes pour repérer d'un coup d'œil les forces et faiblesses de la classe.`,
      },
      {
        titre: 'Code couleur des moyennes',
        contenu: `Les notes sont colorées automatiquement :\n\n🟢 Vert — 16/20 et plus (très bien)\n🔵 Bleu — 12 à 16/20 (bien)\n🟡 Orange — 10 à 12/20 (passable)\n🔴 Rouge — moins de 10/20 (insuffisant)`,
      },
      {
        titre: 'Filtrer par pôle',
        contenu: `Dans les vues "Fiche élève" et "Par matière", un menu déroulant vous permet de filtrer les matières par pôle (artistique, littéraire, scientifique) pour une analyse ciblée.`,
      },
      {
        titre: 'Rechercher un élève',
        contenu: `La barre de recherche en haut à droite filtre les élèves en temps réel dans toutes les vues. Tapez quelques lettres du nom pour retrouver rapidement un élève.`,
      },
    ],
  },
  {
    id: 'pdf',
    icon: '📄',
    titre: 'Générer un PDF',
    tags: ['pdf', 'export', 'imprimer', 'bulletin', 'carnet', 'progression', 'génération'],
    sections: [
      {
        titre: 'Les trois modules PDF',
        contenu: `ClassPro Desktop propose trois générateurs PDF accessibles depuis la section "Génération PDF" de la sidebar :\n\n📄 PDF Progression — tableau de progression par classe (format paysage)\n📄 PDF Carnet de bord — fiches de cours (1 ou 4 par page)\n📄 PDF Bulletins — récapitulatif conseil de classe par élève`,
      },
      {
        titre: 'PDF Carnet de bord',
        contenu: `1. Sélectionnez la classe à exporter\n2. Choisissez le format :\n   • Une fiche par page — détaillé, idéal pour imprimer individuellement\n   • 4 fiches par page — compact, pratique pour avoir un aperçu\n3. Vérifiez la liste des fiches dans l'aperçu\n4. Cliquez sur "Générer le PDF"\n5. Choisissez où sauvegarder le fichier`,
      },
      {
        titre: 'PDF Progression',
        contenu: `1. Choisissez le mode d'export :\n   • Toutes les classes — un PDF avec une page par classe\n   • Sélection manuelle — cochez les classes souhaitées\n2. Les classes sans progression apparaissent grisées (non exportables)\n3. Cliquez sur "Générer le PDF"`,
      },
      {
        titre: 'PDF Bulletins',
        contenu: `1. Sélectionnez la classe (si vous avez plusieurs classes dans les bulletins)\n2. Choisissez le contenu à inclure en activant/désactivant les options :\n   Moyennes T1/T2, Notes par matière, Moyenne classe, Appréciation générale, Absences/Retards, Orientation\n3. Choisissez les élèves :\n   • Tous les élèves — export complet\n   • Sélection manuelle — cochez les élèves souhaités\n4. Cliquez sur "Générer le PDF"`,
      },
      {
        titre: 'Prérequis pour les PDF',
        contenu: `Les modules PDF nécessitent la bibliothèque jsPDF. Si le bouton "Générer" ne répond pas, vérifiez que le fichier vendor/jspdf.umd.min.js est bien présent dans src/renderer/vendor/ et qu'il est chargé dans index.html.`,
      },
    ],
  },
  {
    id: 'classes-eleves',
    icon: '👥',
    titre: 'Classes et élèves',
    tags: ['classe', 'eleve', 'liste', 'pronote', 'import', 'gestion'],
    sections: [
      {
        titre: 'À quoi sert ce module ?',
        contenu: `Le module Classes et élèves (Gestion administrative) vous permet de créer et gérer vos classes indépendamment de ClassPro sur clé USB. C'est le point de départ si vous utilisez ClassPro Desktop en premier, avant d'avoir exporté un JSON.`,
      },
      {
        titre: 'Créer une classe',
        contenu: `1. Cliquez sur "+ Nouvelle classe" en haut à droite\n2. Saisissez le nom de la classe (ex : 3A, 5B, Terminale)\n3. Cliquez sur "Créer la classe"\n4. Une fenêtre s'ouvre immédiatement pour importer la liste des élèves`,
      },
      {
        titre: 'Importer la liste depuis PRONOTE',
        contenu: `Après la création d'une classe, une fenêtre d'import s'ouvre automatiquement.\n\nComment récupérer la liste depuis PRONOTE :\n1. Allez sur PRONOTE (version web)\n2. Mes données → Liste d'élèves\n3. Sélectionnez la classe souhaitée\n4. Cliquez sur l'icône des carrés entremêlés (en haut à droite) pour copier le CSV\n5. Collez la première colonne (noms) dans le champ de ClassPro Desktop\n6. Cliquez sur Importer\n\nLe compteur d'élèves détectés s'affiche en temps réel pendant la saisie.`,
      },
      {
        titre: 'Ajouter des élèves manuellement',
        contenu: `Dans la zone principale, saisissez un nom dans le champ en haut (format NOM Prénom) et appuyez sur Entrée. L'élève est ajouté immédiatement à la liste.`,
      },
      {
        titre: 'Renommer ou supprimer une classe',
        contenu: `Dans la sidebar gauche, chaque classe a une icône ✏️ pour la renommer en ligne. Le bouton "Supprimer la classe" dans le header supprime la classe et tous ses élèves (confirmation demandée).`,
      },
    ],
  },
  {
    id: 'edt',
    icon: '📅',
    titre: 'Emploi du temps',
    tags: ['edt', 'emploi', 'temps', 'pronote', 'pdf', 'semaine', 'AB', 'cours', 'créneau'],
    sections: [
      {
        titre: 'À quoi sert ce module ?',
        contenu: `Le module Emploi du temps affiche votre planning hebdomadaire sous forme de grille horaire (lundi → vendredi, 8h → 18h). Il gère les semaines A/B et permet de lier chaque créneau à un cours préparé.`,
      },
      {
        titre: 'Importer depuis un PDF Pronote',
        contenu: `Cliquez sur "📄 Importer PDF Pronote" dans le header.\n\nComment exporter depuis Pronote :\n• Emploi du temps → Imprimer → Format PDF → Toutes semaines\n\nClassPro Desktop analyse le PDF et détecte automatiquement :\n• Les jours et horaires de chaque cours\n• Les semaines A et B\n• Le nom de chaque matière\n• La couleur assignée automatiquement\n\nUne prévisualisation s'affiche avant l'import. Vous pouvez vérifier tous les cours détectés avant de les ajouter. Les doublons sont automatiquement ignorés.`,
      },
      {
        titre: 'Ajouter un cours manuellement',
        contenu: `Cliquez sur "+ Ajouter un cours" pour saisir manuellement un créneau.\n\nChamps disponibles :\n• Matière / Titre — nom affiché sur la grille\n• Salle — optionnel, affiché sous le titre\n• Jour — lundi à vendredi\n• Semaine — A, B, ou A et B (toutes)\n• Heure de début et de fin — au pas de 5 minutes\n• Classe liée — pour l'automatisation\n• Couleur — 6 teintes disponibles\n\nCliquez sur un bloc existant pour le modifier.`,
      },
      {
        titre: 'Semaines A et B',
        contenu: `Cliquez sur "⚙️ Réf. A/B" pour définir quelle semaine est la semaine A de référence. ClassPro Desktop calcule ensuite automatiquement le type de chaque semaine (A ou B) pour toute l'année.\n\nLes cours peuvent être configurés en Semaine A uniquement, Semaine B uniquement, ou toutes les semaines (A et B).`,
      },
      {
        titre: 'Automatisation — Créer fiches et suivi',
        contenu: `Clic droit sur un bloc de cours → "Créer fiches et suivi".\n\nCette fonction crée automatiquement pour les N prochaines semaines :\n• Les séances dans le module Suivi de classe\n• Les fiches de cours dans le Carnet de bord\n\nElle respecte les semaines A/B et évite les doublons si les séances existent déjà.`,
      },
      {
        titre: 'Lier un cours préparé à un créneau',
        contenu: `Clic droit sur un bloc EDT → "Créer un cours pour ce créneau" ou "Consulter le cours lié".\n\n• Si aucun cours n'est lié : vous pouvez créer un nouveau cours vide pré-lié, ou lier un cours existant depuis la liste\n• Si un cours est déjà lié : vous voyez un résumé et pouvez le délier\n\nLes blocs avec un cours lié affichent un petit icône 📖.`,
      },
    ],
  },
  {
    id: 'creer-cours',
    icon: '✏️',
    titre: 'Créer un cours',
    tags: ['cours', 'préparer', 'fiche', 'objectif', 'déroulement', 'section', 'aperçu', 'pdf'],
    sections: [
      {
        titre: 'À quoi sert ce module ?',
        contenu: `Le module Créer un cours (section Préparer) est un éditeur de fiches de préparation de cours. Contrairement au Carnet de bord qui enregistre ce qui s'est passé, ce module sert à préparer en amont ce que vous allez faire.`,
      },
      {
        titre: 'Créer un nouveau cours',
        contenu: `Cliquez sur "+ Nouveau cours".\n\nRenseignez :\n• Titre — nom du cours (obligatoire)\n• Date de la séance — optionnel\n• Classe liée — pour retrouver le cours facilement\n• Séquence liée — si la classe a une progression annuelle, vous pouvez rattacher le cours à une séquence\n\nLe cours est créé avec 3 sections par défaut : Objectifs, Déroulement / Activité, Devoirs.`,
      },
      {
        titre: 'Mise en forme du contenu',
        contenu: `Chaque section dispose d'une barre d'outils de mise en forme :\n\n• G — Gras (**texte**)\n• I — Italique (_texte_)\n• S — Souligné (__texte__)\n• Liste à puces (• élément)\n• Liste numérotée (1. élément)\n• Titre (## Titre)\n• Sous-titre (### Sous-titre)\n\nLa mise en forme utilise un format Markdown simple, visible dans l'aperçu.`,
      },
      {
        titre: 'Réorganiser les sections',
        contenu: `Chaque section a une poignée ⠿ à gauche. Glissez-déposez les sections pour les réorganiser dans l'ordre souhaité.\n\nPour ajouter une section personnalisée, cliquez sur "+ Ajouter une section" en bas de l'éditeur et saisissez un nom.`,
      },
      {
        titre: 'Documents et pièces jointes',
        contenu: `La section Documents / Supports vous permet d'attacher des fichiers et des liens au cours :\n\n• 🖼️ Image / PDF — sélectionnez un fichier jpg, jpeg, png ou pdf. Il est encodé et stocké dans le JSON.\n• 🔗 Lien — ajoutez une URL avec un nom optionnel\n\nEn mode aperçu, les images sont affichées en pleine largeur et les liens sont cliquables.`,
      },
      {
        titre: 'Mode aperçu',
        contenu: `Cliquez sur "👁 Aperçu" dans le header pour basculer en mode lecture.\n\nL'aperçu affiche le cours comme un document propre :\n• En-tête avec classe, séquence et date\n• Sections avec titre et contenu mis en forme\n• Images affichées en pleine largeur\n• Liens cliquables\n\nCe rendu peut servir de base pour l'impression ou le partage.`,
      },
      {
        titre: 'Lier un cours à un créneau EDT',
        contenu: `Depuis l'Emploi du temps, faites un clic droit sur un bloc de cours → "Créer un cours pour ce créneau".\n\nVous pouvez aussi lier un cours existant à un créneau ou le consulter directement depuis l'EDT. Un icône 📖 apparaît sur les blocs qui ont un cours lié.`,
      },
    ],
  },
];

function ModuleAcademie() {
  const [search, setSearch] = useState('');
  const [selGuide, setSelGuide] = useState(null);

  const guidesFiltered = useMemo(() => {
    if (!search.trim()) return GUIDES;
    const q = search.toLowerCase();
    return GUIDES.filter(g =>
      g.titre.toLowerCase().includes(q) ||
      g.tags.some(t => t.includes(q)) ||
      g.sections.some(s =>
        s.titre.toLowerCase().includes(q) ||
        s.contenu.toLowerCase().includes(q)
      )
    );
  }, [search]);

  // Sections filtrées pour le guide actif
  const sectionsFiltered = useMemo(() => {
    if (!selGuide) return [];
    const guide = GUIDES.find(g => g.id === selGuide);
    if (!guide) return [];
    if (!search.trim()) return guide.sections;
    const q = search.toLowerCase();
    return guide.sections.filter(s =>
      s.titre.toLowerCase().includes(q) ||
      s.contenu.toLowerCase().includes(q)
    );
  }, [selGuide, search]);

  const guideActif = GUIDES.find(g => g.id === selGuide);

  // Highlight du texte de recherche
  const highlight = (text) => {
    if (!search.trim()) return text;
    const q = search.trim();
    const regex = new RegExp('(' + q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + ')', 'gi');
    return text.split(regex).map((part, i) =>
      regex.test(part)
        ? <mark key={i} style={{ background: 'rgba(59,91,219,.2)', color: 'var(--accent)', borderRadius: 3, padding: '0 2px' }}>{part}</mark>
        : part
    );
  };

  const formatContenu = (texte) => {
    return texte.split('\n').map((line, i) => {
      if (!line.trim()) return <br key={i} />;
      // Lignes commençant par • ou emoji liste
      if (line.trim().startsWith('•') || /^[💬📚😶✋👍⭐🎯📝📄🔄⚠️🟢🔵🟡🔴📊👤📆]/u.test(line.trim())) {
        return (
          <div key={i} style={{ display: 'flex', gap: '.5rem', marginBottom: '.25rem', paddingLeft: '.5rem' }}>
            <span style={{ color: 'var(--accent)', flexShrink: 0 }}>›</span>
            <span>{highlight(line.trim().replace(/^•\s*/, ''))}</span>
          </div>
        );
      }
      // Lignes numérotées
      if (/^\d+\./.test(line.trim())) {
        return (
          <div key={i} style={{ display: 'flex', gap: '.5rem', marginBottom: '.25rem', paddingLeft: '.5rem' }}>
            <span style={{ color: 'var(--accent)', fontWeight: 700, flexShrink: 0, minWidth: 18 }}>{line.match(/^\d+/)[0]}.</span>
            <span>{highlight(line.replace(/^\d+\.\s*/, '').trim())}</span>
          </div>
        );
      }
      return <span key={i}>{highlight(line)}</span>;
    });
  };

  return (
    <>
      <div className="page-hd">
        <div>
          <div className="phd-badge">🎓 Académie</div>
          <div className="phd-title">ClassPro Académie</div>
          <div className="phd-sub">Centre d'aide · {GUIDES.length} guides disponibles</div>
        </div>
      </div>

      <div style={{ display: 'flex', flex: 1, overflow: 'hidden', minHeight: 0 }}>

        {/* Sidebar guides */}
        <div style={{ width: 240, flexShrink: 0, borderRight: '1px solid var(--border)', background: 'var(--surface2)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

          {/* Barre de recherche */}
          <div style={{ padding: '.65rem .75rem', borderBottom: '1px solid var(--border)', flexShrink: 0 }}>
            <div style={{ position: 'relative' }}>
              <span style={{ position: 'absolute', left: '.65rem', top: '50%', transform: 'translateY(-50%)', fontSize: '.85rem', opacity: .5, pointerEvents: 'none' }}>🔍</span>
              <input
                type="text"
                placeholder="Rechercher dans les guides…"
                value={search}
                onChange={e => setSearch(e.target.value)}
                style={{ width: '100%', padding: '.45rem .65rem .45rem 2rem', border: '1.5px solid var(--border)', borderRadius: 'var(--r-s)', background: 'var(--surface)', color: 'var(--text)', fontFamily: 'Roboto, sans-serif', fontSize: '.78rem', outline: 'none', boxSizing: 'border-box', transition: 'border-color .15s' }}
                onFocus={e => e.target.style.borderColor = 'var(--accent)'}
                onBlur={e => e.target.style.borderColor = 'var(--border)'}
              />
            </div>
          </div>

          {/* Liste des guides */}
          <div style={{ flex: 1, overflowY: 'auto' }}>
            {guidesFiltered.length === 0 && (
              <div style={{ padding: '1.5rem', textAlign: 'center', color: 'var(--text3)', fontSize: '.8rem', fontStyle: 'italic' }}>
                Aucun résultat pour "{search}"
              </div>
            )}
            {guidesFiltered.map(guide => (
              <button key={guide.id}
                onClick={() => setSelGuide(guide.id)}
                style={{ display: 'flex', alignItems: 'center', gap: '.65rem', width: '100%', padding: '.6rem .875rem', border: 'none', borderLeft: `3px solid ${selGuide === guide.id ? 'var(--accent)' : 'transparent'}`, background: selGuide === guide.id ? 'var(--surface)' : 'transparent', cursor: 'pointer', fontFamily: 'Roboto, sans-serif', fontSize: '.82rem', fontWeight: selGuide === guide.id ? 700 : 500, color: selGuide === guide.id ? 'var(--accent)' : 'var(--text2)', borderBottom: '1px solid var(--border)', transition: 'all .13s', textAlign: 'left' }}>
                <span style={{ fontSize: '1.1rem', flexShrink: 0 }}>{guide.icon}</span>
                <div>
                  <div>{guide.titre}</div>
                  <div style={{ fontSize: '.68rem', color: 'var(--text3)', fontWeight: 400, marginTop: '.08rem' }}>{guide.sections.length} sections</div>
                </div>
              </button>
            ))}
          </div>

          {/* Footer sidebar */}
          <div style={{ padding: '.65rem .875rem', borderTop: '1px solid var(--border)', flexShrink: 0 }}>
            <div style={{ fontSize: '.68rem', color: 'var(--text3)', textAlign: 'center', lineHeight: 1.5 }}>
              ClassPro Académie<br />
              <span style={{ color: 'var(--accent)', fontWeight: 600 }}>v1.0 · {GUIDES.length} guides</span>
            </div>
          </div>
        </div>

        {/* Zone principale */}
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {!selGuide ? (
            /* Écran d'accueil Académie */
            <div style={{ padding: '2rem 2.5rem' }}>
              <div style={{ maxWidth: 640, margin: '0 auto' }}>
                {/* Hero */}
                <div style={{ background: 'linear-gradient(135deg, #1e3a8a 0%, #3b5bdb 60%, #7c3aed 100%)', borderRadius: 16, padding: '2rem', marginBottom: '2rem', color: '#fff' }}>
                  <div style={{ fontSize: '2.5rem', marginBottom: '.75rem' }}>🎓</div>
                  <div style={{ fontWeight: 800, fontSize: '1.4rem', fontFamily: 'Roboto Slab, serif', marginBottom: '.5rem' }}>ClassPro Académie</div>
                  <div style={{ fontSize: '.9rem', opacity: .85, lineHeight: 1.6 }}>
                    Bienvenue dans le centre d'aide de ClassPro Desktop. Retrouvez ici tous les guides pour maîtriser l'application et tirer le meilleur parti de vos outils pédagogiques.
                  </div>
                </div>

                {/* Grille des guides */}
                <div style={{ fontSize: '.72rem', fontWeight: 700, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: '.75rem' }}>
                  Tous les guides
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '.75rem' }}>
                  {GUIDES.map(guide => (
                    <button key={guide.id}
                      onClick={() => setSelGuide(guide.id)}
                      style={{ display: 'flex', alignItems: 'flex-start', gap: '.75rem', padding: '1rem', border: '1.5px solid var(--border)', borderRadius: 12, background: 'var(--surface)', cursor: 'pointer', textAlign: 'left', transition: 'all .15s', fontFamily: 'Roboto, sans-serif' }}
                      onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--accent)'; e.currentTarget.style.background = 'rgba(59,91,219,.04)'; }}
                      onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.background = 'var(--surface)'; }}>
                      <div style={{ width: 40, height: 40, borderRadius: 10, background: 'rgba(59,91,219,.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.3rem', flexShrink: 0 }}>
                        {guide.icon}
                      </div>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: '.88rem', color: 'var(--text)', marginBottom: '.2rem' }}>{guide.titre}</div>
                        <div style={{ fontSize: '.72rem', color: 'var(--text3)' }}>{guide.sections.length} sections</div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            /* Guide sélectionné */
            <div style={{ padding: '1.75rem 2.5rem', maxWidth: 760 }}>

              {/* Breadcrumb */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '.5rem', marginBottom: '1.25rem', fontSize: '.78rem', color: 'var(--text3)' }}>
                <button onClick={() => setSelGuide(null)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--accent)', fontFamily: 'Roboto, sans-serif', fontSize: '.78rem', padding: 0, fontWeight: 600 }}>
                  ← Tous les guides
                </button>
                <span>/</span>
                <span style={{ color: 'var(--text2)' }}>{guideActif?.titre}</span>
              </div>

              {/* Titre du guide */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.75rem', paddingBottom: '1.25rem', borderBottom: '2px solid var(--border)' }}>
                <div style={{ width: 52, height: 52, borderRadius: 14, background: 'rgba(59,91,219,.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.6rem', flexShrink: 0 }}>
                  {guideActif?.icon}
                </div>
                <div>
                  <h1 style={{ margin: 0, fontFamily: 'Roboto Slab, serif', fontSize: '1.4rem', fontWeight: 800, color: 'var(--text)' }}>{guideActif?.titre}</h1>
                  <div style={{ fontSize: '.78rem', color: 'var(--text3)', marginTop: '.25rem' }}>{guideActif?.sections.length} sections</div>
                </div>
              </div>

              {/* Message si recherche sans résultat dans ce guide */}
              {search.trim() && sectionsFiltered.length === 0 && (
                <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text3)', fontSize: '.85rem', fontStyle: 'italic' }}>
                  Aucun résultat pour "{search}" dans ce guide.
                </div>
              )}

              {/* Sections */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                {sectionsFiltered.map((section, i) => (
                  <div key={i} style={{ padding: '1.25rem 1.5rem', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, borderLeft: '4px solid var(--accent)' }}>
                    <h2 style={{ margin: '0 0 .75rem', fontFamily: 'Roboto, sans-serif', fontSize: '.95rem', fontWeight: 700, color: 'var(--text)' }}>
                      {highlight(section.titre)}
                    </h2>
                    <div style={{ fontSize: '.85rem', color: 'var(--text2)', lineHeight: 1.75 }}>
                      {formatContenu(section.contenu)}
                    </div>
                  </div>
                ))}
              </div>

              {/* Navigation entre guides */}
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '2rem', paddingTop: '1.25rem', borderTop: '1px solid var(--border)' }}>
                {(() => {
                  const idx = GUIDES.findIndex(g => g.id === selGuide);
                  const prev = GUIDES[idx - 1];
                  const next = GUIDES[idx + 1];
                  return (
                    <>
                      {prev ? (
                        <button onClick={() => setSelGuide(prev.id)}
                          style={{ display: 'flex', alignItems: 'center', gap: '.5rem', padding: '.6rem 1rem', border: '1px solid var(--border)', borderRadius: 'var(--r-s)', background: 'var(--surface)', cursor: 'pointer', fontFamily: 'Roboto, sans-serif', fontSize: '.8rem', color: 'var(--text2)', fontWeight: 500 }}>
                          ← {prev.icon} {prev.titre}
                        </button>
                      ) : <div />}
                      {next && (
                        <button onClick={() => setSelGuide(next.id)}
                          style={{ display: 'flex', alignItems: 'center', gap: '.5rem', padding: '.6rem 1rem', border: '1px solid var(--accent)', borderRadius: 'var(--r-s)', background: 'var(--accent)', cursor: 'pointer', fontFamily: 'Roboto, sans-serif', fontSize: '.8rem', color: '#fff', fontWeight: 600 }}>
                          {next.icon} {next.titre} →
                        </button>
                      )}
                    </>
                  );
                })()}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

// ── MODULE CLASSES & ÉLÈVES ───────────────────────────────────────────────────
function ModuleClasses({ cpData, onDataChange }) {
  const classes = cpData?.classes || [];
  const [selCls, setSelCls] = useState(classes[0]?.id || null);
  const [newEleve, setNewEleve] = useState('');
  const [showImportEleves, setShowImportEleves] = useState(false);
  const [importText, setImportText] = useState('');
  const [showNewCls, setShowNewCls] = useState(false);
  const [newClsName, setNewClsName] = useState('');
  const [editingCls, setEditingCls] = useState(null);
  const [editClsVal, setEditClsVal] = useState('');

  const cls = classes.find(c => c.id === selCls);
  const save = (newClasses) => onDataChange('sc-classes', newClasses);

  const addClasse = () => {
    if (!newClsName.trim()) return;
    const nc = { id: 'cls-' + Date.now(), name: newClsName.trim(), eleves: [] };
    save([...classes, nc]);
    setSelCls(nc.id);
    setNewClsName('');
    setShowNewCls(false);
    // Enchaîner directement sur l'import de liste
    setImportText('');
    setShowImportEleves(true);
  };

  const deleteClasse = (id) => {
    if (!window.confirm('Supprimer cette classe et tous ses élèves ?')) return;
    save(classes.filter(c => c.id !== id));
    if (selCls === id) setSelCls(classes.find(c => c.id !== id)?.id || null);
  };

  const startRename = (c) => { setEditingCls(c.id); setEditClsVal(c.name); };
  const confirmRename = () => {
    if (!editClsVal.trim()) { setEditingCls(null); return; }
    save(classes.map(c => c.id === editingCls ? { ...c, name: editClsVal.trim() } : c));
    setEditingCls(null);
  };

  const addEleve = () => {
    if (!newEleve.trim() || !cls) return;
    const ne = { id: 'el-' + Date.now(), nom: newEleve.trim() };
    save(classes.map(c => c.id === selCls ? { ...c, eleves: [...(c.eleves || []), ne] } : c));
    setNewEleve('');
  };

  const deleteEleve = (eleveId) => {
    save(classes.map(c => c.id === selCls ? { ...c, eleves: c.eleves.filter(e => e.id !== eleveId) } : c));
  };

  const importEleves = () => {
    if (!importText.trim() || !cls) return;
    const noms = importText.split('\n').map(l => l.trim()).filter(Boolean);
    const newEleves = noms.map(nom => ({ id: 'el-' + Date.now() + Math.random().toString(36).slice(2), nom }));
    save(classes.map(c => c.id === selCls ? { ...c, eleves: [...(c.eleves || []), ...newEleves] } : c));
    setImportText('');
    setShowImportEleves(false);
  };

  if (!cpData) return <ModulePlaceholder icon="👥" title="Classes et eleves" sub="Ouvrez d'abord un fichier ClassPro." />;

  return (
    <>
      <div className="page-hd">
        <div>
          <div className="phd-badge">👥 Gestion</div>
          <div className="phd-title">{cls ? cls.name : 'Classes et eleves'}</div>
          <div className="phd-sub">
            {cls
              ? `${cls.eleves?.length || 0} eleve(s) · ${classes.length} classe(s) au total`
              : `${classes.length} classe(s) · ${classes.reduce((s,c) => s+(c.eleves?.length||0),0)} eleve(s) au total`
            }
          </div>
        </div>
        <div className="phd-actions">
          {cls && (
            <button className="btn btn-ghost" onClick={() => deleteClasse(selCls)}
              style={{ color: 'var(--danger)', borderColor: 'var(--danger)' }}>
              🗑️ Supprimer la classe
            </button>
          )}
          <button className="btn btn-primary" onClick={() => { setNewClsName(''); setShowNewCls(true); }}>
            + Nouvelle classe
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', flex: 1, overflow: 'hidden', minHeight: 0 }}>

        {/* Sidebar classes */}
        <div style={{ width: 200, flexShrink: 0, borderRight: '1px solid var(--border)', background: 'var(--surface2)', overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
          <div style={{ padding: '.5rem .65rem', fontSize: '.65rem', fontWeight: 700, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '.08em', borderBottom: '1px solid var(--border)' }}>
            Classes ({classes.length})
          </div>
          {classes.length === 0 && (
            <div style={{ padding: '1.5rem .875rem', color: 'var(--text3)', fontSize: '.8rem', fontStyle: 'italic' }}>
              Aucune classe — cliquez sur + Nouvelle classe
            </div>
          )}
          {classes.map(c => (
            <div key={c.id} style={{ borderBottom: '1px solid var(--border)' }}>
              {editingCls === c.id ? (
                <div style={{ padding: '.4rem .5rem', display: 'flex', gap: '.3rem' }}>
                  <input autoFocus value={editClsVal} onChange={e => setEditClsVal(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') confirmRename(); if (e.key === 'Escape') setEditingCls(null); }}
                    style={{ flex: 1, padding: '.3rem .5rem', border: '1.5px solid var(--accent)', borderRadius: 'var(--r-xs)', background: 'var(--surface)', color: 'var(--text)', fontFamily: 'Roboto,sans-serif', fontSize: '.82rem', outline: 'none' }} />
                  <button onClick={confirmRename} style={{ background: 'var(--accent)', border: 'none', borderRadius: 'var(--r-xs)', color: '#fff', cursor: 'pointer', padding: '.3rem .5rem', fontSize: '.75rem' }}>✓</button>
                </div>
              ) : (
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <button onClick={() => setSelCls(c.id)}
                    style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '.55rem .875rem', border: 'none', borderLeft: `3px solid ${selCls===c.id ? 'var(--accent)' : 'transparent'}`, background: selCls===c.id ? 'var(--surface)' : 'transparent', cursor: 'pointer', fontFamily: 'Roboto,sans-serif', fontSize: '.85rem', fontWeight: selCls===c.id ? 700 : 500, color: selCls===c.id ? 'var(--accent)' : 'var(--text2)', transition: 'all .13s', textAlign: 'left' }}>
                    <span>{c.name}</span>
                    <span style={{ fontSize: '.7rem', color: 'var(--text3)', fontWeight: 400 }}>{c.eleves?.length || 0}</span>
                  </button>
                  <button onClick={() => startRename(c)} title="Renommer"
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text3)', padding: '.4rem .4rem', fontSize: '.7rem', opacity: .6 }}>✏️</button>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Zone principale élèves */}
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {!cls ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: '1rem', color: 'var(--text3)' }}>
              <div style={{ fontSize: '3rem', opacity: .12 }}>👥</div>
              <div style={{ fontWeight: 600, color: 'var(--text2)' }}>Selectionnez une classe</div>
              <div style={{ fontSize: '.82rem' }}>ou creez-en une nouvelle depuis le bouton en haut a droite</div>
            </div>
          ) : (
            <div style={{ padding: '1.25rem' }}>
              {/* Barre ajout élève */}
              <div style={{ display: 'flex', gap: '.5rem', marginBottom: '1rem' }}>
                <input value={newEleve} onChange={e => setNewEleve(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && addEleve()}
                  placeholder="NOM Prenom — Entree pour ajouter"
                  style={{ flex: 1, padding: '.55rem .875rem', border: '1.5px solid var(--border)', borderRadius: 'var(--r-s)', background: 'var(--surface2)', color: 'var(--text)', fontFamily: 'Roboto,sans-serif', fontSize: '.85rem', outline: 'none' }}
                  onFocus={e => e.target.style.borderColor='var(--accent)'} onBlur={e => e.target.style.borderColor='var(--border)'} />
                <button onClick={addEleve} disabled={!newEleve.trim()} className="btn btn-primary">+ Ajouter</button>
              </div>

              {/* Liste élèves */}
              {(cls.eleves||[]).length === 0 ? (
                <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text3)', fontSize: '.85rem', fontStyle: 'italic' }}>
                  Aucun eleve dans cette classe.<br/>Saisissez un nom ci-dessus ou importez une liste.
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(230px, 1fr))', gap: '.38rem' }}>
                  {(cls.eleves||[]).map((el, i) => (
                    <div key={el.id} style={{ display: 'flex', alignItems: 'center', gap: '.65rem', padding: '.48rem .75rem', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--r-s)' }}>
                      <div style={{ width: 30, height: 30, borderRadius: '50%', background: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '.62rem', fontWeight: 700, flexShrink: 0 }}>
                        {el.nom.slice(0,2).toUpperCase()}
                      </div>
                      <span style={{ flex: 1, fontWeight: 600, fontSize: '.83rem' }}>{el.nom}</span>
                      <span style={{ fontSize: '.7rem', color: 'var(--text3)' }}>#{i+1}</span>
                      <button onClick={() => deleteEleve(el.id)}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text3)', fontSize: '.75rem', padding: '.15rem .3rem', borderRadius: 4 }}
                        onMouseEnter={e => e.target.style.color='var(--danger)'} onMouseLeave={e => e.target.style.color='var(--text3)'}>🗑️</button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Modale nouvelle classe */}
      {showNewCls && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,.45)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:9999 }}
          onClick={e => e.target===e.currentTarget && setShowNewCls(false)}>
          <div style={{ background:'var(--surface)', borderRadius:'var(--r)', padding:'1.5rem', width:340, boxShadow:'var(--shadow-l)' }}>
            <div style={{ fontFamily:'Roboto Slab,serif', fontWeight:800, fontSize:'1rem', marginBottom:'1rem' }}>+ Nouvelle classe</div>
            <input autoFocus value={newClsName} onChange={e => setNewClsName(e.target.value)}
              onKeyDown={e => { if(e.key==='Enter') addClasse(); if(e.key==='Escape') setShowNewCls(false); }}
              placeholder="Ex : 3A, 5B, Terminale..."
              style={{ width:'100%', padding:'.6rem .875rem', border:'1.5px solid var(--accent)', borderRadius:'var(--r-s)', background:'var(--surface2)', color:'var(--text)', fontFamily:'Roboto,sans-serif', fontSize:'.9rem', outline:'none', boxSizing:'border-box', marginBottom:'1rem' }} />
            <div style={{ display:'flex', gap:'.5rem', justifyContent:'flex-end' }}>
              <button className="btn" onClick={() => setShowNewCls(false)}>Annuler</button>
              <button className="btn btn-primary" disabled={!newClsName.trim()} onClick={addClasse}>Creer la classe</button>
            </div>
          </div>
        </div>
      )}

      {/* Modale import liste élèves */}
      {showImportEleves && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,.45)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:9999, padding:'1rem' }}
          onClick={e => e.target===e.currentTarget && setShowImportEleves(false)}>
          <div style={{ background:'var(--surface)', borderRadius:'var(--r)', padding:'1.5rem', width:480, boxShadow:'var(--shadow-l)', display:'flex', flexDirection:'column', gap:'1rem' }}>
            <div>
              <div style={{ fontFamily:'Roboto Slab,serif', fontWeight:800, fontSize:'1.05rem' }}>
                📋 Importer la liste d&apos;élèves
                {cls && <span style={{ fontWeight:400, fontSize:'.85rem', color:'var(--text3)', marginLeft:'.5rem' }}>— {cls.name}</span>}
              </div>
            </div>

            {/* Instructions Pronote */}
            <div style={{ padding:'.75rem 1rem', background:'rgba(59,91,219,.07)', border:'1px solid rgba(59,91,219,.25)', borderRadius:'var(--r-s)', fontSize:'.8rem', lineHeight:1.75 }}>
              <div style={{ fontWeight:700, color:'var(--accent)', marginBottom:'.3rem' }}>Comment récupérer la liste depuis PRONOTE</div>
              Allez sur <strong>PRONOTE (version web)</strong> → <strong>Mes données</strong> → <strong>Liste d&apos;élèves</strong>.
              Sélectionnez la classe souhaitée et affichez la liste.
              Cliquez en haut à droite sur l&apos;icône des <strong>carrés entremêlés</strong> pour copier la liste CSV.
              Collez ensuite la <strong>première colonne (noms)</strong> dans le champ ci-dessous.
            </div>

            <div>
              <div style={{ fontSize:'.72rem', fontWeight:700, color:'var(--text2)', textTransform:'uppercase', letterSpacing:'.07em', marginBottom:'.35rem' }}>
                Liste — un élève par ligne (NOM Prénom)
              </div>
              <textarea value={importText} onChange={e => setImportText(e.target.value)}
                placeholder={"DUPONT Marie\nMARTIN Paul\nBERNARD Lea\n..."}
                rows={8} style={{ width:'100%', padding:'.65rem', border:'1.5px solid var(--border)', borderRadius:'var(--r-s)', background:'var(--surface2)', color:'var(--text)', fontFamily:'Roboto,sans-serif', fontSize:'.85rem', outline:'none', resize:'vertical', boxSizing:'border-box' }} />
            </div>

            <div style={{ display:'flex', gap:'.5rem', justifyContent:'space-between', alignItems:'center' }}>
              <div style={{ fontSize:'.75rem', color:'var(--text3)' }}>
                {importText.trim() ? importText.trim().split('\n').filter(Boolean).length + ' élève(s) détecté(s)' : 'Collez votre liste ci-dessus'}
              </div>
              <div style={{ display:'flex', gap:'.5rem' }}>
                <button className="btn" onClick={() => { setShowImportEleves(false); setImportText(''); }}>
                  {importText.trim() ? 'Passer' : 'Fermer'}
                </button>
                <button className="btn btn-primary" disabled={!importText.trim()} onClick={importEleves}>
                  Importer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// ── MODULE CRÉER UN COURS ────────────────────────────────────────────────────

const COURS_SECTIONS_DEFAULT = [
  { id: 'objectifs',  label: 'Objectifs',            icon: '🎯', placeholder: 'Ce que les élèves vont apprendre et savoir faire...' },
  { id: 'deroulement',label: 'Déroulement / Activité',icon: '📋', placeholder: 'Déroulement de la séance, activités, étapes...' },
  { id: 'devoirs',    label: 'Devoirs',               icon: '📝', placeholder: 'Travail à faire à la maison...' },
];

// Mini toolbar de mise en forme
function FormatToolbar({ onFormat }) {
  const btn = (label, action, title) => (
    <button onClick={() => onFormat(action)} title={title}
      style={{ background:'none', border:'1px solid var(--border)', borderRadius:4, padding:'.2rem .45rem', cursor:'pointer', fontSize:'.78rem', color:'var(--text2)', fontFamily:'Roboto,sans-serif', transition:'all .1s' }}
      onMouseEnter={e => e.currentTarget.style.background='var(--surface2)'}
      onMouseLeave={e => e.currentTarget.style.background='none'}>
      {label}
    </button>
  );
  return (
    <div style={{ display:'flex', gap:'.25rem', padding:'.35rem .5rem', background:'var(--surface2)', borderBottom:'1px solid var(--border)', flexWrap:'wrap' }}>
      {btn('G', 'bold', 'Gras')}
      {btn('I', 'italic', 'Italique')}
      {btn('S', 'underline', 'Souligner')}
      <div style={{ width:1, background:'var(--border)', margin:'0 .15rem' }} />
      {btn('• Liste', 'ul', 'Liste à puces')}
      {btn('1. Liste', 'ol', 'Liste numérotée')}
      <div style={{ width:1, background:'var(--border)', margin:'0 .15rem' }} />
      {btn('Titre', 'h2', 'Titre de section')}
      {btn('Sous-titre', 'h3', 'Sous-titre')}
    </div>
  );
}

function RichTextarea({ value, onChange, placeholder, onRef }) {
  const ref = React.useRef(null);

  React.useEffect(() => {
    if (onRef) onRef(ref);
  }, []);

  const applyFormat = (action) => {
    const el = ref.current;
    if (!el) return;
    const start = el.selectionStart;
    const end   = el.selectionEnd;
    const sel   = value.slice(start, end);
    let insert  = '';
    let cursor  = 0;

    switch (action) {
      case 'bold':      insert = `**${sel || 'texte'}**`; cursor = sel ? insert.length : 2; break;
      case 'italic':    insert = `_${sel || 'texte'}_`;   cursor = sel ? insert.length : 1; break;
      case 'underline': insert = `__${sel || 'texte'}__`; cursor = sel ? insert.length : 2; break;
      case 'ul':        insert = `\n• ${sel || 'élément'}`; cursor = insert.length; break;
      case 'ol':        insert = `\n1. ${sel || 'élément'}`; cursor = insert.length; break;
      case 'h2':        insert = `\n## ${sel || 'Titre'}\n`; cursor = insert.length - 1; break;
      case 'h3':        insert = `\n### ${sel || 'Sous-titre'}\n`; cursor = insert.length - 1; break;
      default: return;
    }

    const newVal = value.slice(0, start) + insert + value.slice(end);
    onChange(newVal);
    setTimeout(() => {
      el.focus();
      el.setSelectionRange(start + cursor, start + cursor);
    }, 10);
  };

  return (
    <div style={{ border:'1.5px solid var(--border)', borderRadius:'var(--r-s)', overflow:'hidden', background:'var(--surface)' }}
      onFocus={() => ref.current?.parentElement?.style && (ref.current.parentElement.style.borderColor='var(--accent)')}
      onBlur={() => ref.current?.parentElement?.style && (ref.current.parentElement.style.borderColor='var(--border)')}>
      <FormatToolbar onFormat={applyFormat} />
      <textarea ref={ref} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
        rows={5}
        style={{ width:'100%', padding:'.75rem', border:'none', background:'transparent', color:'var(--text)', fontFamily:'Roboto,sans-serif', fontSize:'.88rem', outline:'none', resize:'vertical', boxSizing:'border-box', lineHeight:1.7 }} />
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
                  <div style={{ fontSize:'.88rem', color:'var(--text)', lineHeight:1.75, paddingLeft:'.25rem' }}>
                    {renderMarkdown(sec.contenu)}
                  </div>
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

  const weekType = edtGetWeekType(viewMonday, refWeekA);
  const todayStr = edtIso(new Date());
  const isCurrentWeek = edtIso(viewMonday) === edtIso(edtGetMonday(new Date()));

  const dayHeaders = EDT_DAYS.map((label, i) => {
    const date = edtDateForDay(viewMonday, i);
    return { label, date, isToday: edtIso(date) === todayStr };
  });

  const visibleBlocks = edtData.filter(b => {
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
      if (w === 'AB' || w === wt) targetWeeks.push(new Date(cursor));
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
          {/* Navigation */}
          <div style={{ display:'flex', alignItems:'center', gap:'.3rem', background:'rgba(255,255,255,.12)', border:'1px solid rgba(255,255,255,.2)', borderRadius:'var(--r-s)', padding:'.28rem .5rem' }}>
            <button onClick={prevWeek} style={{ background:'none', border:'none', color:'#fff', cursor:'pointer', fontSize:'.9rem', padding:'.1rem .35rem', borderRadius:4, opacity:.8 }}>◀</button>
            <span style={{ fontSize:'.75rem', color:'#fff', fontWeight:700, minWidth:80, textAlign:'center' }}>Sem. {weekType}</span>
            <button onClick={nextWeek} style={{ background:'none', border:'none', color:'#fff', cursor:'pointer', fontSize:'.9rem', padding:'.1rem .35rem', borderRadius:4, opacity:.8 }}>▶</button>
          </div>
          {!isCurrentWeek && <button className="btn btn-ghost" onClick={goToday} style={{ fontSize:'.75rem' }}>Aujourd&apos;hui</button>}
          <button className="btn btn-ghost"
            style={{ fontSize:'.72rem', background:'rgba(255,255,255,.15)', border:'1px solid rgba(255,255,255,.3)', color:'#fff' }}
            onClick={() => { setAutoClassId(''); setAutoResult(null); setAutoPopup({ block: null, fromHeader: true }); }}>
            🔁 Créer fiches et suivi
          </button>
          <button className="btn btn-ghost"
            style={{ fontSize:'.75rem', background:'rgba(255,255,255,.15)', border:'1px solid rgba(255,255,255,.3)', color:'#fff' }}
            onClick={() => setShowImport(true)}>
            📄 Importer PDF Pronote
          </button>
          <button className="btn btn-primary" onClick={() => { setEditId(null); setForm(EMPTY_FORM); setShowAdd(true); }}>
            + Ajouter un cours
          </button>
          {edtData.length > 0 && (
            <button className="btn" style={{ background:'rgba(220,38,38,.15)', border:'1px solid rgba(220,38,38,.3)', color:'#fca5a5', fontSize:'.72rem' }}
              onClick={() => { if (window.confirm('Supprimer tous les cours ?')) saveBlocks([]); }}>
              🗑️ Purger
            </button>
          )}
        </div>
      </div>

      {/* Grille EDT */}
      <div className="page-content" style={{ paddingTop:0, overflow:'hidden', flex:1, display:'flex', flexDirection:'column' }}>
        <div style={{ flex:1, overflow:'auto' }}>
          <div style={{ display:'grid', gridTemplateColumns:'54px repeat(5,1fr)', minWidth:680 }} onClick={() => ctxMenu && setCtxMenu(null)}>
            {/* Header vide */}
            <div style={{ background:'var(--surface2)', position:'sticky', top:0, zIndex:20, borderRight:'1px solid var(--border)', borderBottom:'2px solid var(--border)' }} />
            {/* Headers jours */}
            {dayHeaders.map((dh, i) => (
              <div key={i} style={{ padding:'.45rem .4rem', textAlign:'center', fontSize:'.74rem', fontWeight:700, borderRight:'1px solid var(--border)', borderBottom: dh.isToday ? '2px solid var(--accent)' : '2px solid var(--border)', background: dh.isToday ? 'rgba(59,91,219,.06)' : 'var(--surface2)', position:'sticky', top:0, zIndex:20, color: dh.isToday ? 'var(--accent)' : 'var(--text2)' }}>
                <div style={{ fontWeight: dh.isToday ? 800 : 700 }}>{dh.label}</div>
                <div style={{ fontSize:'.62rem', fontWeight:400, color:'var(--text3)', marginTop:'.06rem' }}>{edtFmtShort(dh.date)}</div>
              </div>
            ))}
            {/* Colonne heures */}
            <div style={{ borderRight:'1px solid var(--border)', background:'var(--surface)' }}>
              {EDT_HOURS.map(h => (
                <div key={h} style={{ height:60, display:'flex', alignItems:'flex-start', justifyContent:'flex-end', padding:'.15rem .4rem 0', fontSize:'.65rem', color:'var(--text3)', borderBottom:'1px solid rgba(0,0,0,.04)' }}>{h}h</div>
              ))}
            </div>
            {/* Colonnes jours avec blocs */}
            {EDT_DAYS.map((_, di) => {
              const isToday = edtIso(edtDateForDay(viewMonday, di)) === todayStr;
              const colH = ROWS * 60;
              const dayBlocks = visibleBlocks.filter(b => b.day === di);
              return (
                <div key={di} style={{ position:'relative', height:colH, borderRight:'1px solid var(--border)', background: isToday ? 'rgba(59,91,219,.02)' : 'var(--surface)' }}>
                  {EDT_HOURS.map((h, hi) => (
                    <div key={h} style={{ position:'absolute', top:hi*60, left:0, right:0, height:60, borderBottom:'1px solid rgba(0,0,0,.04)', pointerEvents:'none' }} />
                  ))}
                  {dayBlocks.map(b => {
                    const col = EDT_COLORS[b.colorIdx || 0];
                    const topPx = (b.startH - 8)*60 + b.startM;
                    const hPx  = Math.max(22, (b.endH - b.startH)*60 + (b.endM - b.startM));
                    const w    = b.weeks || 'AB';
                    return (
                      <div key={b.id}
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

// ── SHELL PRINCIPAL ───────────────────────────────────────────────────────────
function Shell() {
  const [module, setModule] = useState('accueil');
  const [cpData, setCpData] = useState(null);       // données parsées
  const [filePath, setFilePath] = useState(null);   // chemin du fichier ouvert
  const [appVersion, setAppVersion] = useState('1.0.0');
  const [theme, setTheme] = useState(() => localStorage.getItem('cpd-theme') || 'light');
  const [showAbout, setShowAbout] = useState(false);
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
  const KEY_MAP = { 'cdc-fiches': 'fiches', 'cdc-devoirs': 'devoirs', 'cdc-progs': 'progs', 'sc-classes': 'classes', 'sc-sessions': 'sessions', 'cdc-edt': 'edt', 'cdc-edt-refA': 'edtRefA', 'cdc-cours': 'cours' };
  const handleDataChange = (key, value) => {
    setCpData(prev => {
      if (!prev) return prev;
      // Garantir que progs reste toujours un objet
      const safeValue = key === 'cdc-progs'
        ? (value && typeof value === 'object' && !Array.isArray(value) ? value : {})
        : value;
      const newRaw = { ...prev._raw, entries: { ...prev._raw.entries, [key]: JSON.stringify(safeValue) } };
      return { ...prev, [KEY_MAP[key] || key]: safeValue, _raw: newRaw };
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
        return <ModuleProgression cpData={cpData} onDataChange={handleDataChange} />;
      case 'conseil':
        return <ModuleConseil cpData={cpData} />;
      case 'pdf-progression':
        return <ModulePdfProgression cpData={cpData} />;
      case 'pdf-carnet':
        return <ModulePdfCarnet cpData={cpData} />;
      case 'pdf-bulletins':
        return <ModulePdfBulletins cpData={cpData} />;
      case 'classes':
        return <ModuleClasses cpData={cpData} onDataChange={handleDataChange} />;
      case 'edt':
        return <ModuleEDT cpData={cpData} onDataChange={handleDataChange} />;
      case 'cours':
        return <ModuleCours cpData={cpData} onDataChange={handleDataChange} />;
      case 'plan-classe':
        return <ModulePlaceholder icon="🏫" title="Plan de classe" sub="Module en cours de développement — disponible prochainement." soon={true} />;
      case 'academie':
        return <ModuleAcademie />;
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
            <button onClick={() => setShowAbout(true)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'Roboto, sans-serif', fontSize: 'inherit', fontWeight: 700, color: 'var(--accent)', padding: 0, textDecoration: 'underline dotted', textUnderlineOffset: 3 }}>ClassPro Desktop</button>
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

      {/* Modale À propos */}
      {showAbout && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.55)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}
          onClick={e => e.target === e.currentTarget && setShowAbout(false)}>
          <div style={{ background: 'var(--surface)', borderRadius: 16, width: 460, maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 24px 64px rgba(0,0,0,.35)' }}>

            {/* Hero gradient */}
            <div style={{ background: 'linear-gradient(135deg, #1e3a8a 0%, #3b5bdb 50%, #7c3aed 100%)', padding: '2rem 1.75rem 1.75rem', position: 'relative' }}>
              <button onClick={() => setShowAbout(false)}
                style={{ position: 'absolute', top: '1rem', right: '1rem', width: 30, height: 30, borderRadius: 8, background: 'rgba(255,255,255,.15)', border: 'none', cursor: 'pointer', color: '#fff', fontSize: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(4px)' }}>
                ×
              </button>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
                <div style={{ width: 56, height: 56, borderRadius: 14, background: 'rgba(255,255,255,.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(4px)' }}
                  dangerouslySetInnerHTML={{ __html: LOGO_SVG.replace('width="34"', 'width="36"').replace('height="38"', 'height="40"') }} />
                <div>
                  <div style={{ fontWeight: 800, fontSize: '1.4rem', color: '#fff', fontFamily: 'Roboto Slab, serif', letterSpacing: '-.01em' }}>ClassPro Desktop</div>
                  <div style={{ fontSize: '.85rem', color: 'rgba(255,255,255,.7)', marginTop: '.2rem' }}>Logiciel parent de ClassPro · v{appVersion}</div>
                </div>
              </div>
              <p style={{ fontSize: '.88rem', color: 'rgba(255,255,255,.85)', lineHeight: 1.65, margin: 0 }}>
                Outil de gestion pédagogique pour les enseignants — progressions, carnet de bord, suivi de classe, bulletins et génération PDF. Tout fonctionne localement, sans serveur.
              </p>
            </div>

            {/* Carte auteur */}
            <div style={{ margin: '1.25rem 1.5rem', padding: '1rem 1.25rem', background: 'var(--surface2)', borderRadius: 12, border: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 800, fontSize: '.9rem', flexShrink: 0 }}>LL</div>
              <div>
                <div style={{ fontWeight: 700, fontSize: '.95rem' }}>Lucas Le Coadou</div>
                <div style={{ fontSize: '.78rem', color: 'var(--text2)', marginTop: '.15rem' }}>Professeur d'Espagnol · Collège Alfred Crouzet</div>
                <div style={{ fontSize: '.75rem', color: 'var(--text3)' }}>Développeur de ClassPro</div>
              </div>
            </div>

            {/* Infos techniques en grille */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '.75rem', padding: '0 1.5rem 1.25rem' }}>
              {[
                { label: 'VERSION', value: 'v' + appVersion, icon: '🔖' },
                { label: 'LICENCE', value: 'Privée', icon: '🔒' },
                { label: 'PLATEFORME', value: typeof navigator !== 'undefined' ? navigator.platform : '—', icon: '💻' },
                { label: 'DONNÉES', value: 'Locales uniquement', icon: '🗄️' },
              ].map(item => (
                <div key={item.label} style={{ padding: '.75rem 1rem', background: 'var(--surface2)', borderRadius: 10, border: '1px solid var(--border)' }}>
                  <div style={{ fontSize: '.6rem', fontWeight: 700, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: '.3rem' }}>{item.icon} {item.label}</div>
                  <div style={{ fontWeight: 700, fontSize: '.88rem', color: 'var(--text)' }}>{item.value}</div>
                </div>
              ))}
            </div>

            {/* Modules disponibles */}
            <div style={{ padding: '0 1.5rem 1.25rem' }}>
              <div style={{ fontSize: '.65rem', fontWeight: 700, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: '.6rem' }}>Modules disponibles</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '.38rem' }}>
                {[
                  '🏠 Accueil', '👥 Suivi de classe', '📓 Carnet de bord',
                  '📋 Travaux non rendus', '📆 Progression annuelle', '🎓 Conseil de classe',
                  '📄 PDF Carnet', '📄 PDF Progression', '📄 PDF Bulletins',
                ].map(m => (
                  <span key={m} style={{ fontSize: '.72rem', padding: '.25rem .65rem', borderRadius: 99, background: 'var(--surface2)', border: '1px solid var(--border)', color: 'var(--text2)', fontWeight: 500 }}>{m}</span>
                ))}
              </div>
            </div>

            {/* Footer */}
            <div style={{ padding: '.875rem 1.5rem', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '.73rem', color: 'var(--text3)' }}>© {new Date().getFullYear()} Lucas Le Coadou · Tous droits réservés</span>
              <button onClick={() => setShowAbout(false)} className="btn btn-primary" style={{ fontSize: '.78rem' }}>Fermer</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

ReactDOM.render(<Shell />, document.getElementById('root'));
