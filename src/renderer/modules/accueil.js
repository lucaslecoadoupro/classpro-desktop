// ── MODULE ACCUEIL ───────────────────────────────────────────────────────────
function ModuleAccueil({ onOpen, onNavigate, cpData, filePath }) {
  const profile = cpData?.profile;

  // Historique récent (localStorage de l'app Desktop)
  const [recent, setRecent] = useState(() => {
    try { return JSON.parse(localStorage.getItem('cpd-recent') || '[]'); } catch { return []; }
  });

  const [showNewProfil, setShowNewProfil] = useState(false);

  // Pré-remplir depuis le profil onboarding si disponible
  const [newProfil, setNewProfil] = useState(() => {
    try {
      const up = JSON.parse(localStorage.getItem('cpd-user-profile') || 'null');
      return {
        prenom:        up?.prenom        || '',
        nom:           up?.nom           || '',
        etablissement: up?.etablissement || '',
        annee:         '2025/2026',
        classe:        '',
        matiere:       up?.matieres      || '',
      };
    } catch { return { prenom:'', nom:'', etablissement:'', annee:'2025/2026', classe:'', matiere:'' }; }
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
    const totalSeances = Object.values(cpData.sessions || {}).reduce((s, arr) => s + (Array.isArray(arr) ? arr.length : 0), 0);
    const stats = [
      { label: 'Classes', value: cpData.classes.length },
      { label: 'Séances', value: totalSeances },
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
                  ['Séances (carnet)', totalSeances],
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

          <div className="welcome-actions accueil-import-zone">
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

          {/* Conseil organisation fichiers */}
          <div style={{ maxWidth: 480, width: '100%', margin: '0 auto', padding: '.75rem 1rem', background: 'rgba(59,91,219,.06)', border: '1px solid rgba(59,91,219,.18)', borderRadius: 12, display: 'flex', alignItems: 'flex-start', gap: '.75rem' }}>
            <span style={{ fontSize: '1.1rem', flexShrink: 0, marginTop: '.05rem' }}>💡</span>
            <div style={{ fontSize: '.78rem', color: 'var(--text2)', lineHeight: 1.6 }}>
              <strong style={{ color: 'var(--text)' }}>Conseil d'organisation :</strong> enregistrez vos fichiers JSON dans le dossier{' '}
              <code style={{ background: 'var(--surface2)', padding: '.1rem .35rem', borderRadius: 4, fontSize: '.74rem', fontFamily: 'monospace', color: 'var(--accent)' }}>Documents/ClassPro</code>
              {' '}pour que ClassPro Desktop les retrouve automatiquement à l'ouverture.
            </div>
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
