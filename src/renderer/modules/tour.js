// ── TOUR GUIDÉ — ClassPro Desktop ────────────────────────────────────────────

const TOUR_STEPS = [
  {
    id: 'bienvenue',
    target: null,
    navigate: 'accueil',
    title: '👋 Bienvenue sur ClassPro Desktop !',
    content: 'ClassPro Desktop est le compagnon de ClassPro, votre logiciel de classe sur clé USB. Ici, vous travaillez depuis chez vous : préparez vos cours, suivez vos élèves, générez vos PDF — puis renvoyez tout sur la clé en un clic.',
    position: 'center',
  },
  {
    id: 'import',
    target: '.accueil-import-zone',
    navigate: 'accueil',
    title: '📂 Commencer avec un fichier',
    content: 'Deux options : ouvrez un JSON exporté depuis ClassPro pour retrouver toutes vos données, ou créez un nouveau fichier vierge si vous démarrez sans clé USB.',
    position: 'top',
  },
  {
    id: 'sidebar',
    target: '.sb-nav',
    title: '🗂️ Les modules',
    content: 'La barre latérale donne accès à tous les modules : gestion administrative, préparation de cours, suivi pédagogique… Chaque outil est indépendant et sauvegardé dans votre fichier JSON.',
    position: 'right',
  },
  {
    id: 'edt',
    target: '.sb-item[data-id="edt"]',
    title: '📅 Emploi du temps',
    content: 'Importez votre EDT depuis Pronote (PDF) et liez chaque créneau à un cours préparé. ClassPro Desktop crée automatiquement les fiches et les séances de suivi.',
    position: 'right',
  },
  {
    id: 'pdf',
    target: '.sb-section-pdf',
    title: '📄 Génération PDF',
    content: 'Tout votre travail peut être synthétisé en PDF : carnet de bord, progression annuelle, bulletins de conseil de classe. Pratique pour les réunions ou les archives.',
    position: 'right',
  },
  {
    id: 'save',
    target: '.app-footer',
    title: '💾 Sauvegarder & ré-exporter',
    content: 'Une fois vos modifications terminées, le bouton "Sauvegarder JSON" apparaît ici dès qu\'un fichier est chargé. Replacez ensuite le JSON sur votre clé USB pour retrouver tout votre travail dans ClassPro.',
    position: 'top',
  },
  {
    id: 'academie',
    target: '.sb-item[data-id="academie"]',
    title: '📖 Centre d\'aide',
    content: 'Besoin d\'aide ? ClassPro Académie regroupe 10 guides interactifs sur tous les modules. Vous pouvez aussi revoir cette visite guidée à tout moment depuis ici.',
    position: 'right',
    last: true,
  },
];

// ── Calcul de position du tooltip ────────────────────────────────────────────
function getTooltipStyle(targetEl, position) {
  if (!targetEl) return { top: '50%', left: '50%', transform: 'translate(-50%, -50%)' };
  const rect = targetEl.getBoundingClientRect();
  const GAP = 16;
  const TW = 320;
  const TH = 220;
  const WH = window.innerHeight;
  const WW = window.innerWidth;

  switch (position) {
    case 'right':
      return {
        top: Math.min(WH - TH - 12, Math.max(12, rect.top + rect.height / 2 - 80)),
        left: rect.right + GAP,
      };
    case 'top': {
      const fromTop = rect.top - GAP - TH;
      const left = Math.max(12, Math.min(WW - TW - 12, rect.left + rect.width / 2 - TW / 2));
      if (fromTop < 12) {
        // Pas assez de place en haut → tooltip en bas
        return { top: rect.bottom + GAP, left };
      }
      return { top: rect.top - GAP, left, transform: 'translateY(-100%)' };
    }
    case 'bottom':
      return {
        top: rect.bottom + GAP,
        left: Math.max(12, Math.min(WW - TW - 12, rect.left + rect.width / 2 - TW / 2)),
      };
    default:
      return { top: '50%', left: '50%', transform: 'translate(-50%, -50%)' };
  }
}

// ── Spotlight ─────────────────────────────────────────────────────────────────
function Spotlight({ targetEl }) {
  if (!targetEl) return null;
  const rect = targetEl.getBoundingClientRect();
  const PAD = 6;
  return (
    <div style={{
      position: 'fixed',
      top: rect.top - PAD,
      left: rect.left - PAD,
      width: rect.width + PAD * 2,
      height: rect.height + PAD * 2,
      borderRadius: 10,
      boxShadow: '0 0 0 9999px rgba(0,0,0,0.55)',
      zIndex: 9998,
      pointerEvents: 'none',
      transition: 'all .3s ease',
    }} />
  );
}

// ── Tooltip ───────────────────────────────────────────────────────────────────
function TourTooltip({ step, stepIdx, total, onNext, onSkip, targetEl }) {
  const isCenter = step.position === 'center' || !targetEl;
  const style = isCenter
    ? { position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', zIndex: 9999, width: 420 }
    : { position: 'fixed', ...getTooltipStyle(targetEl, step.position), zIndex: 9999, width: 320 };

  return (
    <div style={{
      ...style,
      background: 'var(--surface)',
      borderRadius: 14,
      boxShadow: '0 8px 40px rgba(0,0,0,.3)',
      border: '1px solid var(--border)',
      overflow: 'hidden',
    }}>
      <div style={{ height: 3, background: 'var(--border)' }}>
        <div style={{
          height: '100%',
          width: `${((stepIdx + 1) / total) * 100}%`,
          background: 'var(--accent)',
          transition: 'width .3s ease',
          borderRadius: 3,
        }} />
      </div>

      <div style={{ padding: '1.25rem 1.25rem 1rem' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '.75rem', gap: '.5rem' }}>
          <div style={{ fontWeight: 700, fontSize: '.95rem', color: 'var(--text)', lineHeight: 1.35 }}>{step.title}</div>
          <button onClick={onSkip} style={{
            flexShrink: 0, width: 24, height: 24, borderRadius: 6,
            background: 'var(--surface2)', border: '1px solid var(--border)',
            cursor: 'pointer', color: 'var(--text3)', fontSize: '.8rem',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }} title="Passer la visite">×</button>
        </div>
        <p style={{ fontSize: '.83rem', color: 'var(--text2)', lineHeight: 1.6, margin: 0 }}>
          {step.content}
        </p>
      </div>

      <div style={{
        padding: '.75rem 1.25rem',
        borderTop: '1px solid var(--border)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        background: 'var(--surface2)',
      }}>
        <span style={{ fontSize: '.68rem', color: 'var(--text3)' }}>{stepIdx + 1} / {total}</span>
        <div style={{ display: 'flex', gap: '.5rem' }}>
          <button onClick={onSkip} style={{
            padding: '.3rem .75rem', borderRadius: 'var(--r-xs)',
            border: '1px solid var(--border)', background: 'transparent',
            color: 'var(--text3)', fontSize: '.75rem', cursor: 'pointer',
            fontFamily: 'Roboto, sans-serif',
          }}>Passer</button>
          <button onClick={onNext} style={{
            padding: '.3rem .9rem', borderRadius: 'var(--r-xs)',
            border: 'none', background: 'var(--accent)',
            color: '#fff', fontSize: '.75rem', fontWeight: 700,
            cursor: 'pointer', fontFamily: 'Roboto, sans-serif',
          }}>{step.last ? '🎉 Terminer' : 'Suivant →'}</button>
        </div>
      </div>
    </div>
  );
}

// ── COMPOSANT PRINCIPAL ───────────────────────────────────────────────────────
function TourGuide({ onFinish, onNavigate }) {
  const [stepIdx, setStepIdx] = useState(0);
  const [targetEl, setTargetEl] = useState(null);

  const step = TOUR_STEPS[stepIdx];

  useEffect(() => {
    // Naviguer si l'étape le demande
    if (step.navigate && onNavigate) onNavigate(step.navigate);
    // Délai plus long si navigation (laisser le module se monter)
    const delay = step.navigate ? 150 : 80;
    const t = setTimeout(() => {
      if (!step.target) { setTargetEl(null); return; }
      setTargetEl(document.querySelector(step.target) || null);
    }, delay);
    return () => clearTimeout(t);
  }, [stepIdx]);

  const handleNext = () => {
    if (stepIdx < TOUR_STEPS.length - 1) setStepIdx(i => i + 1);
    else handleFinish();
  };

  const handleFinish = () => {
    localStorage.setItem('cpd-tour-done', '1');
    onFinish && onFinish();
  };

  return (
    <>
      <div style={{ position: 'fixed', inset: 0, zIndex: 9997, cursor: 'default' }} onClick={e => e.stopPropagation()} />
      <Spotlight targetEl={targetEl} />
      <TourTooltip step={step} stepIdx={stepIdx} total={TOUR_STEPS.length} onNext={handleNext} onSkip={handleFinish} targetEl={targetEl} />
    </>
  );
}
