// ── SIDEBAR ───────────────────────────────────────────────────────────────────
function Sidebar({ activeModule, onNavigate, cpData, filePath, appVersion, onOpenProfile }) {
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
          <div key={section.section} className={section.section === 'Génération PDF' ? 'sb-section-pdf' : ''}>
            <div className="sb-section-label">{section.section}</div>
            {section.items.map(item => (
              <button
                key={item.id}
                className={`sb-item ${activeModule === item.id ? 'on' : ''}`}
                data-id={item.id}
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
        {/* Profil utilisateur gamifié */}
        <SidebarProfile onOpenProfile={onOpenProfile} />
        <div className="sb-version">ClassPro Desktop v{appVersion}</div>
      </div>
    </div>
  );
}


// ── SHELL PRINCIPAL ───────────────────────────────────────────────────────────
function Shell() {
  const [module, setModule] = useState('accueil');
  const [cpData, setCpData] = useState(null);       // données parsées
  const [filePath, setFilePath] = useState(null);   // chemin du fichier ouvert
  const [appVersion, setAppVersion] = useState('1.0.0');
  const [theme, setTheme] = useState(() => localStorage.getItem('cpd-theme') || 'light');
  const [showAbout,    setShowAbout]    = useState(false);
  const [showTour,     setShowTour]     = useState(() => !localStorage.getItem('cpd-tour-done'));
  const [showOnboarding, setShowOnboarding] = useState(() => !localStorage.getItem('cpd-onboarding-done'));
  const [showProfile,  setShowProfile]  = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);
  const [rewards,      setRewards]      = useState([]); // file d'attente d'animations récompense
  const { toasts, push: pushToast } = useToast();

  // Infos app Electron
  useEffect(() => {
    window.cpd?.getInfo().then(info => {
      if (info?.version) setAppVersion(info.version);
    });
    // Tracker streak jours consécutifs
    cpdTrackStreak();
  }, []);

  // Écouter les récompenses gamification
  useEffect(() => {
    const handler = (e) => setRewards(r => [...r, { ...e.detail, key: Date.now() + Math.random() }]);
    window.addEventListener('cpd-reward', handler);
    return () => window.removeEventListener('cpd-reward', handler);
  }, []);

  // Thème
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('cpd-theme', theme);
    if (theme === 'dark') cpdUnlockBadge('dark_mode');
  }, [theme]);

  const handleOpenResult = (result) => {
    const parsed = parseClassProJson(result.data);
    if (!parsed) { pushToast('Format de fichier ClassPro invalide.', 'error'); return; }
    setCpData(parsed);
    setFilePath(result.filePath);
    setModule('accueil');
    pushToast(`Fichier chargé avec succès !`, 'success');
    cpdUnlockBadge('first_json');
    cpdCountOpen();
    // Badge fidèle — 50+ séances dans le JSON
    const totalSeancesJson = Object.values(result.data?.entries?.['sc-sessions']
      ? (() => { try { return JSON.parse(result.data.entries['sc-sessions']); } catch { return {}; } })()
      : {}).reduce((s, arr) => s + (Array.isArray(arr) ? arr.length : 0), 0);
    if (totalSeancesJson >= 50) cpdUnlockBadge('fidele');
    // Badge nomade — pas d'EDT configuré
    const edtJson = (() => { try { return JSON.parse(result.data?.entries?.['cdc-edt'] || '[]'); } catch { return []; } })();
    if (edtJson.length === 0) cpdUnlockBadge('nomade');
    // Badge vétéran — JSON créé il y a plus de 6 mois
    if (result.data?.date) {
      const mois = (Date.now() - new Date(result.data.date).getTime()) / (1000 * 60 * 60 * 24 * 30);
      if (mois >= 6) cpdUnlockBadge('veteran');
    }
    // Badge marathon — 10+ séances dans une même semaine lundi-vendredi
    const sessionsJson = (() => { try { return JSON.parse(result.data?.entries?.['sc-sessions'] || '{}'); } catch { return {}; } })();
    const weekCounts = {};
    Object.values(sessionsJson).forEach(arr => {
      (Array.isArray(arr) ? arr : []).forEach(s => {
        if (!s.date) return;
        const d = new Date(s.date + 'T12:00');
        const day = d.getDay();
        if (day === 0 || day === 6) return;
        const monday = new Date(d); monday.setDate(d.getDate() - (day - 1));
        const key = monday.toISOString().slice(0, 10);
        weekCounts[key] = (weekCounts[key] || 0) + 1;
      });
    });
    if (Object.values(weekCounts).some(c => c >= 10)) cpdUnlockBadge('marathon');

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

  // Ouvrir un fichier JSON — déclaré avant le useEffect qui l'utilise
  const handleOpenJson = useCallback(async () => {
    const result = await window.cpd?.openJson();
    if (!result) return;
    if (!result.ok) { pushToast('Impossible de lire le fichier : ' + result.error, 'error'); return; }
    handleOpenResult(result);
  }, [pushToast, cpData]); // eslint-disable-line

  // Sauvegarder le JSON (re-export) — déclaré avant le useEffect qui l'utilise
  const handleSaveJson = useCallback(async () => {
    if (!cpData) { pushToast('Aucun fichier chargé.', 'error'); return; }
    const p = cpData.profile || {};
    const nom = `${p.prenom || ''}${p.nom || ''}`.replace(/\s+/g, '_').toUpperCase() || 'export';
    const dateStr = new Date().toLocaleDateString('fr-FR').replace(/\//g, '-');
    const defaultName = `ClassPro_${nom}_${dateStr}.json`;
    const result = await window.cpd?.saveJson(cpData._raw, defaultName);
    if (result?.ok) {
      pushToast(`Fichier sauvegardé !`, 'success');
      cpdUnlockBadge('json_saved');
    } else if (result && !result.ok) {
      pushToast('Erreur lors de la sauvegarde.', 'error');
    }
  }, [cpData, pushToast]);

  // Écoute des événements menu natif — après les déclarations des handlers
  useEffect(() => {
    window.cpd?.onMenuOpenJson((_event) => handleOpenJson());
    window.cpd?.onMenuSaveJson((_event) => handleSaveJson());
    window.cpd?.onMenuAbout(() => setModule('accueil'));
    return () => {
      window.cpd?.removeAllListeners('menu:open-json');
      window.cpd?.removeAllListeners('menu:save-json');
      window.cpd?.removeAllListeners('menu:about');
    };
  }, [handleOpenJson, handleSaveJson]);

  // Mise à jour d'une clé dans le JSON brut (depuis les modules éditeurs)
  const KEY_MAP = {
    'cdc-fiches':   'fiches',
    'cdc-devoirs':  'devoirs',
    'cdc-progs':    'progs',
    'sc-classes':   'classes',
    'sc-sessions':  'sessions',
    'cdc-edt':      'edt',
    'cdc-edt-refA': 'edtRefA',
    'cdc-cours':    'cours',
    'cdc-plans':    'plans',   // ← Plan de classe
  };
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

  // Callback spécifique pour ModulePlanClasse (passe { plans } directement)
  const handlePlanChange = ({ plans }) => {
    handleDataChange('cdc-plans', plans);
  };

  // Rendu du module actif
  const renderModule = () => {
    // Guard global : tous les modules sauf accueil et classpro nécessitent un fichier
    if (!cpData && module !== 'accueil' && module !== 'classpro' && module !== 'academie') {
      return (
        <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', height:'100%', gap:'1rem', color:'var(--text3)' }}>
          <div style={{ fontSize:'3rem', opacity:.2 }}>📂</div>
          <div style={{ fontWeight:700, fontSize:'1rem', color:'var(--text2)' }}>Aucun fichier ouvert</div>
          <div style={{ fontSize:'.83rem', color:'var(--text3)', textAlign:'center', lineHeight:1.6 }}>
            Ouvrez un fichier ClassPro depuis l'Accueil pour accéder à ce module,<br/>ou créez votre fichier directement.
          </div>
          <button className="btn btn-primary" style={{ marginTop:'.5rem' }} onClick={() => setModule('accueil')}>
            Aller à l'Accueil
          </button>
        </div>
      );
    }
    switch (module) {
      case 'accueil':
        return <ModuleAccueil onOpen={handleOpenResult} onNavigate={setModule} cpData={cpData} filePath={filePath} />;
      case 'classpro':
        return <ModuleClassPro cpData={cpData} />;
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
        return <ModuleClasses cpData={cpData} onDataChange={handleDataChange} pushToast={pushToast} />;
      case 'edt':
        return <ModuleEDT cpData={cpData} onDataChange={handleDataChange} />;
      case 'cours':
        return <ModuleCours cpData={cpData} onDataChange={handleDataChange} />;
      case 'plan-classe':
        return <ModulePlanClasse cpData={cpData} onDataChange={handlePlanChange} />;
      case 'academie':
        return <ModuleAcademie onStartTour={() => { localStorage.removeItem('cpd-tour-done'); setShowTour(true); }} />;
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
        onOpenProfile={() => setShowProfile(true)}
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
            <span style={{ color: 'var(--border)' }}>·</span>
            <button onClick={() => setShowFeedback(true)}
              style={{ background:'none', border:'none', cursor:'pointer', fontFamily:'Roboto, sans-serif', fontSize:'inherit', color:'var(--text3)', padding:0 }}
              title="Donner mon avis">
              💬 Feedback
            </button>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '.75rem' }}>
            {cpData && (
              <button onClick={handleSaveJson}
                className="tour-save-btn"
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

      {/* Visite guidée */}
      {showTour && <TourGuide onFinish={() => { setShowTour(false); cpdUnlockBadge('tour_done'); }} onNavigate={setModule} />}

      {/* Onboarding premier lancement */}
      {showOnboarding && <OnboardingPage onComplete={() => setShowOnboarding(false)} />}

      {/* Modale profil */}
      {showProfile && <ProfileModal onClose={() => setShowProfile(false)} />}

      {/* File d'animations récompenses */}
      {rewards.length > 0 && (
        <RewardToast
          key={rewards[0].key}
          reward={rewards[0]}
          onDone={() => setRewards(r => r.slice(1))}
        />
      )}

      {/* Modale Feedback */}
      {showFeedback && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,.55)', zIndex:9998, display:'flex', alignItems:'center', justifyContent:'center', padding:'1rem' }}
          onClick={e => e.target === e.currentTarget && setShowFeedback(false)}>
          <div style={{ background:'var(--surface)', borderRadius:16, width:440, boxShadow:'0 24px 64px rgba(0,0,0,.3)', overflow:'hidden' }}>
            <div style={{ background:'linear-gradient(135deg,#1e3a8a,#3b5bdb)', padding:'1.5rem 1.75rem', position:'relative' }}>
              <button onClick={() => setShowFeedback(false)} style={{ position:'absolute', top:'1rem', right:'1rem', width:28, height:28, borderRadius:7, background:'rgba(255,255,255,.15)', border:'none', cursor:'pointer', color:'#fff', fontSize:'1rem', display:'flex', alignItems:'center', justifyContent:'center' }}>×</button>
              <div style={{ fontSize:'2rem', marginBottom:'.5rem' }}>💬</div>
              <div style={{ fontFamily:'Roboto Slab,serif', fontWeight:800, fontSize:'1.1rem', color:'#fff' }}>Votre avis est précieux</div>
              <div style={{ fontSize:'.8rem', color:'rgba(255,255,255,.75)', marginTop:'.3rem', lineHeight:1.6 }}>
                ClassPro Desktop est développé par un enseignant, pour les enseignants. Chaque retour compte pour faire avancer l'application.
              </div>
            </div>
            <div style={{ padding:'1.5rem 1.75rem', display:'flex', flexDirection:'column', gap:'1rem' }}>
              <div style={{ fontSize:'.83rem', color:'var(--text2)', lineHeight:1.7 }}>
                Que vous ayez trouvé un <strong>bug</strong>, une <strong>idée d'amélioration</strong> ou simplement envie de dire ce que vous pensez — Lucas lit chaque message avec attention.
              </div>
              <div style={{ display:'flex', flexDirection:'column', gap:'.4rem' }}>
                {['Un bug ou comportement inattendu','Une idée de fonctionnalité','Une suggestion de design','Un module manquant pour ma discipline'].map(item => (
                  <div key={item} style={{ display:'flex', alignItems:'center', gap:'.55rem', fontSize:'.78rem', color:'var(--text2)', padding:'.32rem .5rem' }}>
                    <span style={{ color:'var(--accent)', flexShrink:0 }}>→</span> {item}
                  </div>
                ))}
              </div>
              <a href="mailto:lucas.le-coadou@ac-montpellier.fr?subject=Feedback ClassPro Desktop"
                onClick={() => { setShowFeedback(false); cpdUnlockBadge('ambassadeur'); }}
                style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:'.6rem', padding:'.875rem', background:'var(--accent)', color:'#fff', borderRadius:'var(--r-s)', textDecoration:'none', fontWeight:700, fontSize:'.88rem', fontFamily:'Roboto,sans-serif', transition:'opacity .15s' }}
                onMouseEnter={e => e.currentTarget.style.opacity='.88'}
                onMouseLeave={e => e.currentTarget.style.opacity='1'}>
                📧 Envoyer un email à Lucas
              </a>
              <div style={{ textAlign:'center', fontSize:'.7rem', color:'var(--text3)' }}>
                lucas.le-coadou@ac-montpellier.fr
              </div>
            </div>
          </div>
        </div>
      )}

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
                  '🪑 Plan de classe',
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
