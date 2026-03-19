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
        return <ModulePlanClasse cpData={cpData} onDataChange={handlePlanChange} />;
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
