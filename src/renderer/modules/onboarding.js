// ── ONBOARDING & GAMIFICATION — ClassPro Desktop ────────────────────────────
// Fichier autonome : wizard premier lancement, profil sidebar, XP/niveaux/badges, animation récompense

// ══════════════════════════════════════════════════════════════════════════════
// CONSTANTES GAMIFICATION
// ══════════════════════════════════════════════════════════════════════════════

const CPD_LEVELS = [
  { level: 1, title: 'Stagiaire',      minXP: 0,    color: '#6b7280', emoji: '🌱' },
  { level: 2, title: 'Enseignant',     minXP: 50,   color: '#3b82f6', emoji: '📚' },
  { level: 3, title: 'Pédagogue',      minXP: 150,  color: '#8b5cf6', emoji: '✏' },
  { level: 4, title: 'Formateur',      minXP: 300,  color: '#f59e0b', emoji: '🏆' },
  { level: 5, title: 'Expert ClassPro',minXP: 600,  color: '#10b981', emoji: '⭐' },
];

const CPD_BADGES = [
  // Onboarding
  { id: 'first_launch',  emoji: '🚀', title: 'Bienvenue !',          desc: 'Premier lancement de ClassPro Desktop',    xp: 10  },
  { id: 'profile_done',  emoji: '👤', title: 'Identité confirmée',   desc: 'Profil enseignant complété',                xp: 20  },
  // Fichiers
  { id: 'first_json',    emoji: '📄', title: 'Premier fichier',      desc: 'Premier fichier JSON créé ou ouvert',       xp: 30  },
  { id: 'json_saved',    emoji: '💾', title: 'Sauvegardeur',         desc: 'Fichier JSON sauvegardé pour la 1ère fois', xp: 15  },
  { id: 'json_5',        emoji: '🗂', title: 'Archiviste',           desc: '5 fichiers ouverts au total',               xp: 25  },
  // EDT
  { id: 'edt_import',    emoji: '📅', title: 'EDT importé',          desc: 'Emploi du temps importé depuis Pronote',    xp: 40  },
  { id: 'edt_manual',    emoji: '✏', title: 'Éditeur EDT',          desc: 'Premier créneau ajouté manuellement',       xp: 15  },
  { id: 'edt_auto',      emoji: '🔁', title: 'Automatiseur',         desc: 'Fiches et suivi générés depuis l\'EDT',     xp: 35  },
  // Classes
  { id: 'first_class',   emoji: '👥', title: 'Ma première classe',   desc: 'Première classe créée',                     xp: 25  },
  { id: 'classes_5',     emoji: '🏫', title: 'Plusieurs classes',    desc: '5 classes enregistrées',                    xp: 30  },
  // Pédagogie
  { id: 'first_prog',    emoji: '📆', title: 'Progressions',         desc: 'Première progression annuelle créée',       xp: 30  },
  { id: 'first_fiche',   emoji: '📓', title: 'Carnet de bord',       desc: 'Première fiche de séance remplie',          xp: 20  },
  { id: 'first_cours',   emoji: '📖', title: 'Créateur de cours',    desc: 'Premier cours créé dans l\'EDT',            xp: 25  },
  { id: 'first_plan',    emoji: '🏫', title: 'Plan de classe',       desc: 'Premier plan de classe enregistré',         xp: 20  },
  // PDF
  { id: 'first_pdf',     emoji: '📄', title: 'Générateur PDF',       desc: 'Premier PDF généré',                        xp: 20  },
  // Fidélité
  { id: 'tour_done',     emoji: '🗺', title: 'Explorateur',          desc: 'Visite guidée terminée',                    xp: 10  },
  { id: 'dark_mode',     emoji: '🌙', title: 'Nuit blanche',         desc: 'Mode sombre activé',                        xp: 5   },
  { id: 'vacances',      emoji: '🏖', title: 'Vacances méritées',    desc: 'Première période de vacances configurée',   xp: 10  },
  // Spéciaux
  { id: 'betatesteur',   emoji: '🧪', title: 'Premier Supporter',    desc: 'Bétatesteur de la première heure — merci !', xp: 100 },
  { id: 'fidele',        emoji: '📱', title: 'Fidèle ClassPro',       desc: 'JSON avec 50 séances ou plus enregistrées',  xp: 50  },
  { id: 'completiste',   emoji: '🎯', title: 'Complétiste',           desc: 'Tous les champs du profil renseignés',        xp: 40  },
  // Assiduité
  { id: 'marathon',      emoji: '🏃', title: 'Marathon',              desc: '10 seances ou plus dans une meme semaine',    xp: 35  },
  { id: 'polyglotte',    emoji: '🗺', title: 'Polyglotte',            desc: '3 classes differentes dans l EDT',             xp: 30  },
  // Communauté
  { id: 'ambassadeur',   emoji: '🤝', title: 'Ambassadeur',           desc: 'Feedback envoye a l equipe ClassPro',          xp: 25  },
  // Progression
  { id: 'perfectionniste', emoji: '✨', title: 'Perfectionniste',     desc: 'Toutes les colonnes remplies dans une prog',   xp: 40  },
  { id: 'bilan',         emoji: '📊', title: 'Bilan complet',         desc: 'Les 3 types de PDF générés',                  xp: 60  },
  // Usage
  { id: 'nomade',        emoji: '🎒', title: 'Nomade',                desc: 'JSON importé sans EDT configuré',             xp: 20  },
  { id: 'veteran',       emoji: '🎖', title: 'Vétéran',               desc: 'JSON créé il y a plus de 6 mois',             xp: 50  },
];

// ══════════════════════════════════════════════════════════════════════════════
// STORE GAMIFICATION (lecture / écriture localStorage)
// ══════════════════════════════════════════════════════════════════════════════

function cpdGamifLoad() {
  try { return JSON.parse(localStorage.getItem('cpd-gamif') || 'null') || { xp: 0, badges: [], openCount: 0 }; }
  catch { return { xp: 0, badges: [], openCount: 0 }; }
}
function cpdGamifSave(g) {
  localStorage.setItem('cpd-gamif', JSON.stringify(g));
}
function cpdLevelFor(xp) {
  let cur = CPD_LEVELS[0];
  for (const l of CPD_LEVELS) { if (xp >= l.minXP) cur = l; else break; }
  return cur;
}
function cpdNextLevel(xp) {
  return CPD_LEVELS.find(l => l.minXP > xp) || null;
}

// Fonction globale : déclencher un ou plusieurs badges depuis n'importe quel module
// Usage : window.cpdUnlockBadge('first_json')
// Retourne { xp, level, newBadge, levelUp } si badge débloqué, null sinon
function cpdUnlockBadge(badgeId) {
  const badge = CPD_BADGES.find(b => b.id === badgeId);
  if (!badge) return null;
  const g = cpdGamifLoad();
  if (g.badges.includes(badgeId)) return null; // déjà débloqué
  const prevLevel = cpdLevelFor(g.xp);
  g.xp += badge.xp;
  g.badges.push(badgeId);
  cpdGamifSave(g);
  const newLevel = cpdLevelFor(g.xp);
  const levelUp = newLevel.level > prevLevel.level;
  // Émettre un événement custom pour que le shell réagisse
  window.dispatchEvent(new CustomEvent('cpd-reward', { detail: { badge, xp: g.xp, level: newLevel, levelUp } }));
  return { badge, xp: g.xp, level: newLevel, levelUp };
}


// Tracker streak jours consécutifs
function cpdTrackStreak() {
  try {
    const today = new Date().toISOString().slice(0, 10);
    const data  = JSON.parse(localStorage.getItem('cpd-streak') || '{"last":"","count":0}');
    const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
    if (data.last === today) return; // déjà compté aujourd'hui
    data.count = data.last === yesterday ? data.count + 1 : 1;
    data.last  = today;
    localStorage.setItem('cpd-streak', JSON.stringify(data));
    if (data.count >= 7) cpdUnlockBadge('assidu');
  } catch (_) {}
}

// Tracker PDF générés (cumul par type)
function cpdTrackPdf(type) { // type: 'carnet' | 'bulletins' | 'progression'
  try {
    const data = JSON.parse(localStorage.getItem('cpd-pdf-types') || '[]');
    if (!data.includes(type)) data.push(type);
    localStorage.setItem('cpd-pdf-types', JSON.stringify(data));
    if (data.length >= 3) cpdUnlockBadge('bilan');
  } catch (_) {}
}

// Incrémenter le compteur d'ouvertures de fichiers
function cpdCountOpen() {
  const g = cpdGamifLoad();
  g.openCount = (g.openCount || 0) + 1;
  cpdGamifSave(g);
  if (g.openCount >= 5) cpdUnlockBadge('json_5');
}

// ══════════════════════════════════════════════════════════════════════════════
// ANIMATION RÉCOMPENSE (overlay élégant)
// ══════════════════════════════════════════════════════════════════════════════

function RewardToast({ reward, onDone }) {
  const [visible, setVisible] = React.useState(false);
  const [exiting, setExiting] = React.useState(false);

  React.useEffect(() => {
    requestAnimationFrame(() => setVisible(true));
    const t1 = setTimeout(() => setExiting(true), 3200);
    const t2 = setTimeout(() => onDone(), 3700);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);

  const { badge, levelUp, level } = reward;

  return (
    <div style={{
      position: 'fixed', bottom: 80, left: '50%',
      transform: `translateX(-50%) translateY(${visible && !exiting ? 0 : 60}px)`,
      opacity: visible && !exiting ? 1 : 0,
      transition: 'transform .45s cubic-bezier(.22,1,.36,1), opacity .35s ease',
      zIndex: 99999, pointerEvents: 'none',
    }}>
      <div style={{
        display: 'flex', alignItems: 'center', gap: '1rem',
        background: levelUp
          ? `linear-gradient(135deg, ${level.color}dd, ${level.color}99)`
          : 'var(--surface)',
        border: `1.5px solid ${levelUp ? level.color : 'var(--border)'}`,
        borderRadius: 16, padding: '.875rem 1.25rem',
        boxShadow: `0 8px 32px ${levelUp ? level.color + '55' : 'rgba(0,0,0,.25)'}`,
        backdropFilter: 'blur(12px)',
        minWidth: 280,
      }}>
        {/* Icone animee */}
        <div style={{
          width: 44, height: 44, borderRadius: 12, flexShrink: 0,
          background: levelUp ? 'rgba(255,255,255,.2)' : 'rgba(59,91,219,.1)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '1.5rem',
          animation: 'cpd-bounce .6s ease',
        }}>
          {levelUp ? level.emoji : badge.emoji}
        </div>
        <div>
          {levelUp ? (
            <>
              <div style={{ fontSize: '.65rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.1em', color: '#fff', opacity: .8, marginBottom: '.1rem' }}>Niveau atteint !</div>
              <div style={{ fontWeight: 800, fontSize: '.95rem', color: '#fff' }}>{level.emoji} {level.title}</div>
              <div style={{ fontSize: '.73rem', color: 'rgba(255,255,255,.8)', marginTop: '.1rem' }}>+ badge : {badge.emoji} {badge.title}</div>
            </>
          ) : (
            <>
              <div style={{ fontSize: '.65rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.1em', color: 'var(--accent)', opacity: .8, marginBottom: '.1rem' }}>Badge débloqué !</div>
              <div style={{ fontWeight: 800, fontSize: '.9rem', color: 'var(--text)' }}>{badge.emoji} {badge.title}</div>
              <div style={{ fontSize: '.73rem', color: 'var(--text2)', marginTop: '.1rem' }}>{badge.desc} · +{badge.xp} XP</div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// PROFIL SIDEBAR (bas à gauche)
// ══════════════════════════════════════════════════════════════════════════════

function SidebarProfile({ onOpenProfile }) {
  const [gamif, setGamif] = React.useState(cpdGamifLoad);
  const [userProfile, setUserProfile] = React.useState(() => {
    try { return JSON.parse(localStorage.getItem('cpd-user-profile') || 'null'); } catch { return null; }
  });

  // Écouter les récompenses pour rafraîchir
  React.useEffect(() => {
    const handler = () => setGamif(cpdGamifLoad());
    window.addEventListener('cpd-reward', handler);
    return () => window.removeEventListener('cpd-reward', handler);
  }, []);

  const level = cpdLevelFor(gamif.xp);
  const next  = cpdNextLevel(gamif.xp);
  const pct   = next ? Math.round(((gamif.xp - level.minXP) / (next.minXP - level.minXP)) * 100) : 100;
  const initials = userProfile && (userProfile.prenom || userProfile.nom)
    ? ((userProfile.prenom?.[0] || '') + (userProfile.nom?.[0] || '')).toUpperCase()
    : '';

  return (
    <>
    <button
      onClick={onOpenProfile}
      style={{
        display: 'flex', alignItems: 'center', gap: '.6rem',
        width: '100%', padding: '.6rem .75rem',
        background: 'rgba(255,255,255,.05)', border: '1px solid rgba(255,255,255,.1)',
        borderRadius: 'var(--r-s)', cursor: 'pointer', textAlign: 'left',
        transition: 'background .15s',
      }}
      onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,.1)'}
      onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,.05)'}
      title="Mon profil & badges"
    >
      {/* Avatar */}
      <div style={{
        width: 34, height: 34, borderRadius: '50%', flexShrink: 0,
        background: `linear-gradient(135deg, ${level.color}, ${level.color}99)`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: '#fff', fontWeight: 800, fontSize: '.78rem', letterSpacing: '.02em',
        boxShadow: `0 0 0 2px ${level.color}55`,
      }}>
        {initials || level.emoji}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ fontWeight: 700, fontSize: '.75rem', color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {userProfile ? `${userProfile.prenom} ${userProfile.nom}` : 'Mon profil'}
          </div>
          <div style={{ fontSize: '.6rem', color: level.color, fontWeight: 700, flexShrink: 0, marginLeft: '.25rem' }}>
            Niv.{level.level}
          </div>
        </div>
        {/* Barre XP */}
        <div style={{ marginTop: '.22rem', height: 3, background: 'rgba(255,255,255,.12)', borderRadius: 99, overflow: 'hidden' }}>
          <div style={{ height: '100%', width: `${pct}%`, background: level.color, borderRadius: 99, transition: 'width .4s ease' }} />
        </div>
        <div style={{ fontSize: '.58rem', color: 'rgba(255,255,255,.45)', marginTop: '.18rem' }}>
          {gamif.xp} XP · {gamif.badges.length} badge{gamif.badges.length !== 1 ? 's' : ''}
        </div>
      </div>
    </button>

    </>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// MODALE PROFIL COMPLET (accessible depuis la sidebar)
// ══════════════════════════════════════════════════════════════════════════════

function ProfileModal({ onClose }) {
  const [gamif, setGamif] = React.useState(cpdGamifLoad);
  const [tab, setTab] = React.useState('profil'); // 'profil' | 'badges' | 'memo'
  const [showMdp, setShowMdp] = React.useState(false);
  const [codeSecret, setCodeSecret] = React.useState('');
  const [codeResult, setCodeResult] = React.useState(null); // null | 'ok' | 'already' | 'error'
  const [profile, setProfile] = React.useState(() => {
    try { return JSON.parse(localStorage.getItem('cpd-user-profile') || 'null') || {}; }
    catch { return {}; }
  });
  const [editing, setEditing] = React.useState(false);
  const [form, setForm] = React.useState({ ...profile });

  React.useEffect(() => {
    const h = () => setGamif(cpdGamifLoad());
    window.addEventListener('cpd-reward', h);
    return () => window.removeEventListener('cpd-reward', h);
  }, []);

  const level = cpdLevelFor(gamif.xp);
  const next  = cpdNextLevel(gamif.xp);
  const pct   = next ? Math.round(((gamif.xp - level.minXP) / (next.minXP - level.minXP)) * 100) : 100;

  const saveProfile = () => {
    const p = {
      prenom: (form.prenom || '').trim(),
      nom:    (form.nom || '').trim().toUpperCase(),
      matieres: (form.matieres || '').trim(),
      etablissement: (form.etablissement || '').trim(),
      loginPoste: (form.loginPoste || '').trim(),
      mdpPoste:   (form.mdpPoste || '').trim(),
      codePhotocopieuse: (form.codePhotocopieuse || '').trim(),
    };
    localStorage.setItem('cpd-user-profile', JSON.stringify(p));
    setProfile(p);
    setEditing(false);
    if (p.prenom && p.nom) cpdUnlockBadge('profile_done');
    if (p.prenom && p.nom && p.matieres && p.etablissement) cpdUnlockBadge('completiste');
  };

  const tryCode = () => {
    const code = codeSecret.trim().toUpperCase();
    if (code === 'PREMIERSUPPORTER') {
      const result = cpdUnlockBadge('betatesteur');
      setCodeResult(result ? 'ok' : 'already');
      if (result) setGamif(cpdGamifLoad());
    } else {
      setCodeResult('error');
    }
    setTimeout(() => setCodeResult(null), 3000);
    setCodeSecret('');
  };

  const unlockedIds = new Set(gamif.badges);
  const xpToNext = next ? next.minXP - gamif.xp : 0;

  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,.55)', zIndex:9998, display:'flex', alignItems:'center', justifyContent:'center', padding:'1rem' }}
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{ background:'var(--surface)', borderRadius:16, width:520, maxHeight:'88vh', display:'flex', flexDirection:'column', boxShadow:'0 24px 64px rgba(0,0,0,.35)', overflow:'hidden' }}>

        {/* Hero */}
        <div style={{ background:`linear-gradient(135deg, #1e3a8a 0%, ${level.color} 60%, #7c3aed 100%)`, padding:'1.5rem 1.75rem', position:'relative', flexShrink:0 }}>
          <button onClick={onClose} style={{ position:'absolute', top:'1rem', right:'1rem', width:28, height:28, borderRadius:7, background:'rgba(255,255,255,.15)', border:'none', cursor:'pointer', color:'#fff', fontSize:'1rem', display:'flex', alignItems:'center', justifyContent:'center' }}>×</button>
          <div style={{ display:'flex', alignItems:'center', gap:'1rem' }}>
            <div style={{ width:56, height:56, borderRadius:'50%', background:'rgba(255,255,255,.2)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, position:'relative' }}>
              {(profile.prenom || profile.nom) ? (
                <span style={{ fontWeight:800, fontSize:'1.1rem', color:'#fff', letterSpacing:'.02em' }}>
                  {(profile.prenom?.[0] || '').toUpperCase()}{(profile.nom?.[0] || '').toUpperCase()}
                </span>
              ) : (
                <span style={{ fontSize:'1.8rem' }}>{level.emoji}</span>
              )}
              <span style={{ position:'absolute', bottom:-2, right:-2, fontSize:'.9rem', lineHeight:1 }}>{level.emoji}</span>
            </div>
            <div>
              <div style={{ fontWeight:800, fontSize:'1.2rem', color:'#fff', fontFamily:'Roboto Slab,serif' }}>
                {profile.prenom || 'Mon'} {profile.nom || 'Profil'}
              </div>
              <div style={{ fontSize:'.8rem', color:'rgba(255,255,255,.8)', marginTop:'.2rem' }}>
                {level.emoji} {level.title} · Niveau {level.level}
              </div>
              {profile.matieres && <div style={{ fontSize:'.72rem', color:'rgba(255,255,255,.65)', marginTop:'.1rem' }}>📚 {profile.matieres}</div>}
            </div>
          </div>
          {/* Barre XP */}
          <div style={{ marginTop:'1rem' }}>
            <div style={{ display:'flex', justifyContent:'space-between', fontSize:'.65rem', color:'rgba(255,255,255,.7)', marginBottom:'.3rem' }}>
              <span>{gamif.xp} XP</span>
              {next ? <span>{xpToNext} XP pour {next.emoji} {next.title}</span> : <span>Niveau max atteint 🎉</span>}
            </div>
            <div style={{ height:6, background:'rgba(255,255,255,.2)', borderRadius:99, overflow:'hidden' }}>
              <div style={{ height:'100%', width:`${pct}%`, background:'#fff', borderRadius:99, transition:'width .5s ease' }} />
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display:'flex', borderBottom:'1px solid var(--border)', flexShrink:0 }}>
          {[['profil','👤 Profil'],['badges','🏆 Badges'],['memo','🔐 Mémo'],['feedback','💬 Feedback']].map(([id,label]) => (
            <button key={id} onClick={() => setTab(id)}
              style={{ flex:1, padding:'.65rem', border:'none', background:'none', cursor:'pointer', fontFamily:'Roboto,sans-serif', fontSize:'.78rem', fontWeight: tab===id ? 700 : 400, color: tab===id ? 'var(--accent)' : 'var(--text2)', borderBottom: tab===id ? '2px solid var(--accent)' : '2px solid transparent', marginBottom:-1, transition:'all .15s' }}>
              {label}
            </button>
          ))}
        </div>

        {/* Body */}
        <div style={{ flex:1, overflowY:'auto', padding:'1.25rem 1.75rem' }}>

          {/* Onglet Profil */}
          {tab === 'profil' && (
            <div style={{ display:'flex', flexDirection:'column', gap:'.75rem' }}>
              {editing ? (
                <>
                  {[
                    ['prenom','Prénom *','Prénom'],
                    ['nom','Nom *','NOM'],
                    ['matieres','Matière(s) enseignée(s)','Espagnol, Italien…'],
                    ['etablissement','Établissement','Nom de l\'établissement'],
                  ].map(([key, label, ph]) => (
                    <div key={key} style={{ display:'flex', flexDirection:'column', gap:'.25rem' }}>
                      <label style={{ fontSize:'.7rem', fontWeight:700, color:'var(--text2)', textTransform:'uppercase', letterSpacing:'.07em' }}>{label}</label>
                      <input value={form[key] || ''} onChange={e => setForm(f => ({...f, [key]: key==='nom' ? e.target.value.toUpperCase() : e.target.value}))}
                        placeholder={ph}
                        style={{ padding:'.55rem .75rem', border:'1.5px solid var(--border)', borderRadius:'var(--r-s)', background:'var(--surface2)', color:'var(--text)', fontFamily:'Roboto,sans-serif', fontSize:'.85rem', outline:'none' }}
                        onFocus={e=>e.target.style.borderColor='var(--accent)'} onBlur={e=>e.target.style.borderColor='var(--border)'} />
                    </div>
                  ))}
                  <div style={{ display:'flex', gap:'.5rem', justifyContent:'flex-end', marginTop:'.5rem' }}>
                    <button className="btn" onClick={() => { setForm({...profile}); setEditing(false); }}>Annuler</button>
                    <button className="btn btn-primary" onClick={saveProfile} disabled={!form.prenom?.trim() || !form.nom?.trim()}>Enregistrer</button>
                  </div>
                </>
              ) : (
                <>
                  {[
                    ['Prénom', profile.prenom],
                    ['Nom', profile.nom],
                    ['Matière(s)', profile.matieres],
                    ['Établissement', profile.etablissement],
                  ].map(([label, val]) => (
                    <div key={label} className="data-row">
                      <span className="data-row-label">{label}</span>
                      <span className="data-row-value">{val || <span style={{color:'var(--text3)',fontStyle:'italic'}}>Non renseigné</span>}</span>
                    </div>
                  ))}
                  <button className="btn" style={{ alignSelf:'flex-start', marginTop:'.5rem', fontSize:'.78rem' }} onClick={() => { setForm({...profile}); setEditing(true); }}>
                    ✏️ Modifier le profil
                  </button>
                  {/* Module Pro teaser dans le profil */}
                  <div style={{ marginTop:'1rem', padding:'.875rem 1rem', background:'linear-gradient(135deg,rgba(245,158,11,.08),rgba(234,88,12,.05))', border:'1px solid rgba(245,158,11,.2)', borderRadius:'var(--r-s)' }}>
                    <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'.5rem' }}>
                      <div style={{ display:'flex', alignItems:'center', gap:'.4rem' }}>
                        <span>⭐</span>
                        <span style={{ fontWeight:800, fontSize:'.82rem', color:'#f59e0b' }}>Module Pro</span>
                      </div>
                      <span style={{ fontSize:'.58rem', fontWeight:700, background:'rgba(245,158,11,.15)', color:'#f59e0b', padding:'.1rem .45rem', borderRadius:99, textTransform:'uppercase', letterSpacing:'.07em' }}>v1.1 - Bientot</span>
                    </div>
                    <div style={{ fontSize:'.75rem', color:'var(--text2)', lineHeight:1.6, marginBottom:'.6rem' }}>
                      Des outils supplementaires adaptes a votre discipline enseignee, integres directement dans ClassPro Desktop.
                    </div>
                    <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:'.35rem' }}>
                      {[['🔢','ClassMath'],['🔬','ClassScience'],['🌍','ClassLangue']].map(([icon,name]) => (
                        <div key={name} style={{ padding:'.38rem .5rem', background:'rgba(245,158,11,.08)', border:'1px solid rgba(245,158,11,.15)', borderRadius:6, textAlign:'center' }}>
                          <div style={{ fontSize:'.85rem' }}>{icon}</div>
                          <div style={{ fontSize:'.62rem', fontWeight:700, color:'var(--text3)', marginTop:'.1rem' }}>{name}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          {/* Onglet Badges */}
          {tab === 'badges' && (
            <div style={{ display:'flex', flexDirection:'column', gap:'1rem' }}>
              {/* Stats rapides */}
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:'.5rem' }}>
                {[
                  { label:'XP total', value: gamif.xp, icon:'⚡' },
                  { label:'Badges', value: `${gamif.badges.length}/${CPD_BADGES.length}`, icon:'🏅' },
                  { label:'Niveau', value: level.level, icon:level.emoji },
                ].map(s => (
                  <div key={s.label} style={{ padding:'.6rem .75rem', background:'var(--surface2)', borderRadius:10, border:'1px solid var(--border)', textAlign:'center' }}>
                    <div style={{ fontSize:'.8rem' }}>{s.icon}</div>
                    <div style={{ fontWeight:800, fontSize:'.95rem', color:'var(--text)', marginTop:'.1rem' }}>{s.value}</div>
                    <div style={{ fontSize:'.6rem', color:'var(--text3)', textTransform:'uppercase', letterSpacing:'.06em' }}>{s.label}</div>
                  </div>
                ))}
              </div>
              {/* Niveaux */}
              <div style={{ display:'flex', flexDirection:'column', gap:'.3rem' }}>
                <div style={{ fontSize:'.65rem', fontWeight:700, color:'var(--text3)', textTransform:'uppercase', letterSpacing:'.08em', marginBottom:'.15rem' }}>Progression des niveaux</div>
                {CPD_LEVELS.map(l => {
                  const reached = gamif.xp >= l.minXP;
                  const isCurrent = l.level === level.level;
                  return (
                    <div key={l.level} style={{ display:'flex', alignItems:'center', gap:'.75rem', padding:'.45rem .65rem', background: isCurrent ? `${l.color}18` : 'var(--surface2)', border:`1px solid ${isCurrent ? l.color+'55' : 'var(--border)'}`, borderRadius:8, opacity: reached ? 1 : .45 }}>
                      <span style={{ fontSize:'1rem' }}>{l.emoji}</span>
                      <div style={{ flex:1 }}>
                        <div style={{ fontWeight: isCurrent ? 700 : 500, fontSize:'.8rem', color: isCurrent ? l.color : 'var(--text2)' }}>{l.title}</div>
                        <div style={{ fontSize:'.65rem', color:'var(--text3)' }}>{l.minXP} XP requis</div>
                      </div>
                      {isCurrent && <span style={{ fontSize:'.65rem', fontWeight:700, color:l.color, background:`${l.color}22`, padding:'.15rem .45rem', borderRadius:99 }}>EN COURS</span>}
                      {reached && !isCurrent && <span style={{ fontSize:'.8rem' }}>✅</span>}
                    </div>
                  );
                })}
              </div>
              {/* Grille badges */}
              <div>
                <div style={{ fontSize:'.65rem', fontWeight:700, color:'var(--text3)', textTransform:'uppercase', letterSpacing:'.08em', marginBottom:'.5rem' }}>Tous les badges</div>
                <div style={{ display:'grid', gridTemplateColumns:'minmax(0,1fr) minmax(0,1fr)', gap:'.4rem', overflowX:'hidden' }}>
                  {CPD_BADGES.map(b => {
                    const has = unlockedIds.has(b.id);
                    return (
                      <div key={b.id} style={{ display:'flex', alignItems:'center', gap:'.55rem', padding:'.5rem .65rem', background: has ? 'rgba(59,91,219,.06)' : 'var(--surface2)', border:`1px solid ${has ? 'rgba(59,91,219,.25)' : 'var(--border)'}`, borderRadius:8, opacity: has ? 1 : .45, filter: has ? 'none' : 'grayscale(1)', minWidth:0, overflow:'hidden' }}>
                        <span style={{ fontSize:'1.1rem', flexShrink:0 }}>{b.emoji}</span>
                        <div style={{ minWidth:0 }}>
                          <div style={{ fontWeight: has ? 700 : 500, fontSize:'.75rem', color:'var(--text)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', minWidth:0 }}>{b.title}</div>
                          <div style={{ fontSize:'.62rem', color:'var(--text3)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', minWidth:0 }}>{has ? `+${b.xp} XP · débloqué` : b.desc}</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
              {/* Code secret */}
              <div style={{ marginTop:'.5rem', padding:'.875rem 1rem', background:'var(--surface2)', border:'1px solid var(--border)', borderRadius:10 }}>
                <div style={{ fontSize:'.65rem', fontWeight:700, color:'var(--text3)', textTransform:'uppercase', letterSpacing:'.08em', marginBottom:'.5rem' }}>🔑 Code de déverrouillage</div>
                <div style={{ display:'flex', gap:'.5rem' }}>
                  <input value={codeSecret} onChange={e => setCodeSecret(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && tryCode()}
                    placeholder="Saisissez un code…"
                    style={{ flex:1, padding:'.5rem .75rem', border:'1.5px solid var(--border)', borderRadius:'var(--r-s)', background:'var(--surface)', color:'var(--text)', fontFamily:'Roboto,sans-serif', fontSize:'.82rem', outline:'none' }}
                    onFocus={e => e.target.style.borderColor='var(--accent)'} onBlur={e => e.target.style.borderColor='var(--border)'} />
                  <button className="btn btn-primary" onClick={tryCode} disabled={!codeSecret.trim()} style={{ fontSize:'.78rem' }}>Valider</button>
                </div>
                {codeResult === 'ok'      && <div style={{ marginTop:'.5rem', fontSize:'.75rem', color:'var(--success)', fontWeight:600 }}>✅ Badge débloqué ! Félicitations 🎉</div>}
                {codeResult === 'already' && <div style={{ marginTop:'.5rem', fontSize:'.75rem', color:'var(--text3)' }}>Tu possèdes déjà ce badge.</div>}
                {codeResult === 'error'   && <div style={{ marginTop:'.5rem', fontSize:'.75rem', color:'var(--danger)' }}>❌ Code invalide.</div>}
              </div>
            </div>
          )}

          {/* Onglet Memo */}
          {tab === 'memo' && (
            <div style={{ display:'flex', flexDirection:'column', gap:'.75rem' }}>
              <div style={{ padding:'.65rem .875rem', background:'rgba(245,158,11,.08)', border:'1px solid rgba(245,158,11,.25)', borderRadius:'var(--r-s)', fontSize:'.75rem', color:'var(--text2)', lineHeight:1.6 }}>
                ⚠️ Ces informations sont stockées <strong>en clair</strong> sur cet appareil uniquement. Ne les partagez pas et ne saisissez que ce dont vous avez besoin.
              </div>
              {editing ? (
                <>
                  {[
                    ['loginPoste','Identifiant poste','prenom.nom@ac-academie.fr','text'],
                    ['mdpPoste','Mot de passe poste','••••••••','password'],
                    ['codePhotocopieuse','Code photocopieuse','ex: 1234','text'],
                  ].map(([key,label,ph,type]) => (
                    <div key={key} style={{ display:'flex', flexDirection:'column', gap:'.25rem' }}>
                      <label style={{ fontSize:'.7rem', fontWeight:700, color:'var(--text2)', textTransform:'uppercase', letterSpacing:'.07em' }}>{label}</label>
                      <input type={type} value={form[key] || ''} onChange={e => setForm(f => ({...f, [key]: e.target.value}))}
                        placeholder={ph}
                        style={{ padding:'.55rem .75rem', border:'1.5px solid var(--border)', borderRadius:'var(--r-s)', background:'var(--surface2)', color:'var(--text)', fontFamily:'Roboto,sans-serif', fontSize:'.85rem', outline:'none' }}
                        onFocus={e=>e.target.style.borderColor='var(--accent)'} onBlur={e=>e.target.style.borderColor='var(--border)'} />
                    </div>
                  ))}
                  <div style={{ display:'flex', gap:'.5rem', justifyContent:'flex-end', marginTop:'.5rem' }}>
                    <button className="btn" onClick={() => { setForm({...profile}); setEditing(false); }}>Annuler</button>
                    <button className="btn btn-primary" onClick={saveProfile}>Enregistrer</button>
                  </div>
                </>
              ) : (
                <>
                  {[
                    ['loginPoste','Identifiant poste','🔐'],
                    ['mdpPoste','Mot de passe poste','🔑'],
                    ['codePhotocopieuse','Code photocopieuse','🖨️'],
                  ].map(([key,label,icon]) => (
                    <div key={key} style={{ display:'flex', alignItems:'center', gap:'.75rem', padding:'.6rem .875rem', background:'var(--surface2)', border:'1px solid var(--border)', borderRadius:'var(--r-s)' }}>
                      <span style={{ fontSize:'1rem', flexShrink:0 }}>{icon}</span>
                      <div style={{ flex:1 }}>
                        <div style={{ fontSize:'.65rem', color:'var(--text3)', textTransform:'uppercase', letterSpacing:'.06em', fontWeight:700 }}>{label}</div>
                        <div style={{ fontSize:'.85rem', color: profile[key] ? 'var(--text)' : 'var(--text3)', fontStyle: profile[key] ? 'normal' : 'italic', marginTop:'.1rem' }}>
                          {key === 'mdpPoste' && profile[key]
                            ? (showMdp ? profile[key] : '•'.repeat(Math.min(profile[key].length, 12)))
                            : (profile[key] || 'Non renseigné')}
                        </div>
                      </div>
                      {key === 'mdpPoste' && profile[key] && (
                        <button onClick={() => setShowMdp(v => !v)}
                          style={{ background:'none', border:'none', cursor:'pointer', fontSize:'.85rem', color:'var(--text3)', padding:'.2rem .35rem', borderRadius:4, flexShrink:0 }}
                          title={showMdp ? 'Masquer' : 'Afficher'}>
                          {showMdp ? '🙈' : '👁️'}
                        </button>
                      )}
                    </div>
                  ))}
                  <button className="btn" style={{ alignSelf:'flex-start', fontSize:'.78rem', marginTop:'.25rem' }} onClick={() => { setForm({...profile}); setEditing(true); }}>
                    ✏️ Modifier le mémo
                  </button>
                </>
              )}
            </div>
          )}

          {/* Onglet Feedback */}
          {tab === 'feedback' && (
            <div style={{ display:'flex', flexDirection:'column', gap:'1rem' }}>
              <div style={{ textAlign:'center', padding:'.5rem 0 .25rem' }}>
                <div style={{ fontSize:'2rem', marginBottom:'.5rem' }}>💬</div>
                <div style={{ fontWeight:700, fontSize:'.92rem', color:'var(--text)', marginBottom:'.35rem' }}>Votre avis compte !</div>
                <div style={{ fontSize:'.8rem', color:'var(--text2)', lineHeight:1.65 }}>
                  ClassPro Desktop évolue grâce à vos retours. Un bug, une idée, une suggestion ? Lucas lit chaque message.
                </div>
              </div>
              <a href="mailto:lucas.le-coadou@ac-montpellier.fr?subject=Feedback ClassPro Desktop"
                style={{ display:'flex', alignItems:'center', gap:'.75rem', padding:'.875rem 1rem', background:'rgba(59,91,219,.07)', border:'1px solid rgba(59,91,219,.2)', borderRadius:'var(--r-s)', textDecoration:'none' }}
                onMouseEnter={e => e.currentTarget.style.background='rgba(59,91,219,.13)'}
                onMouseLeave={e => e.currentTarget.style.background='rgba(59,91,219,.07)'}>
                <span style={{ fontSize:'1.4rem' }}>📧</span>
                <div>
                  <div style={{ fontWeight:700, fontSize:'.85rem', color:'var(--accent)' }}>Envoyer un email</div>
                  <div style={{ fontSize:'.72rem', color:'var(--text3)', marginTop:'.1rem' }}>lucas.le-coadou@ac-montpellier.fr</div>
                </div>
              </a>
              <div style={{ display:'flex', flexDirection:'column', gap:'.4rem' }}>
                <div style={{ fontSize:'.65rem', fontWeight:700, color:'var(--text3)', textTransform:'uppercase', letterSpacing:'.08em' }}>Que remonter ?</div>
                {['Un bug ou comportement inattendu', 'Une idee de fonctionnalite', 'Une suggestion d\'ergonomie ou de design', 'Un module manquant pour votre discipline'].map(item => (
                  <div key={item} style={{ padding:'.4rem .65rem', background:'var(--surface2)', borderRadius:8, border:'1px solid var(--border)', fontSize:'.78rem', color:'var(--text2)' }}>
                    {item}
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// WIZARD ONBOARDING (page dédiée — premier lancement)
// ══════════════════════════════════════════════════════════════════════════════

const ONBOARDING_STEPS = [
  { id:'welcome',  title:'Bienvenue sur ClassPro Desktop !', sub:'Votre compagnon pédagogique' },
  { id:'identity', title:'Qui êtes-vous ?',                  sub:'Votre identité enseignante' },
  { id:'matieres', title:'Vos matières',                     sub:'Ce que vous enseignez' },
  { id:'memo',     title:'Mémo pratique',                    sub:'Vos accès au travail (optionnel)' },
  { id:'flux',     title:'Comment ça marche ?',              sub:'Le lien entre ClassPro et Desktop' },
  { id:'done',     title:'Tout est prêt !',                  sub:'Bonne rentrée 🎉' },
];

function OnboardingPage({ onComplete }) {
  const [step, setStep] = React.useState(0);
  const [form, setForm] = React.useState({
    prenom:'', nom:'', etablissement:'',
    matieres:'',
    loginPoste:'', mdpPoste:'', codePhotocopieuse:'',
  });
  const [animDir, setAnimDir] = React.useState(1); // 1=forward, -1=back
  const [visible, setVisible] = React.useState(true);

  const totalSteps = ONBOARDING_STEPS.length;
  const current = ONBOARDING_STEPS[step];

  const goNext = () => {
    setVisible(false);
    setTimeout(() => { setAnimDir(1); setStep(s => s+1); setVisible(true); }, 180);
  };
  const goPrev = () => {
    setVisible(false);
    setTimeout(() => { setAnimDir(-1); setStep(s => s-1); setVisible(true); }, 180);
  };

  const finish = () => {
    const p = {
      prenom: form.prenom.trim(),
      nom: form.nom.trim().toUpperCase(),
      matieres: form.matieres.trim(),
      etablissement: form.etablissement.trim(),
      loginPoste: form.loginPoste.trim(),
      mdpPoste: form.mdpPoste,
      codePhotocopieuse: form.codePhotocopieuse.trim(),
    };
    localStorage.setItem('cpd-user-profile', JSON.stringify(p));
    localStorage.setItem('cpd-onboarding-done', '1');
    cpdUnlockBadge('first_launch');
    if (p.prenom && p.nom) cpdUnlockBadge('profile_done');
    if (p.prenom && p.nom && p.matieres && p.etablissement) cpdUnlockBadge('completiste');
    onComplete();
  };

  const canNext = () => {
    if (step === 1) return form.prenom.trim() && form.nom.trim();
    return true;
  };

  const inputStyle = {
    padding:'.6rem .875rem', border:'1.5px solid var(--border)', borderRadius:'var(--r-s)',
    background:'var(--surface2)', color:'var(--text)', fontFamily:'Roboto,sans-serif',
    fontSize:'.88rem', outline:'none', width:'100%', boxSizing:'border-box',
  };
  const labelStyle = { fontSize:'.7rem', fontWeight:700, color:'var(--text2)', textTransform:'uppercase', letterSpacing:'.07em', display:'block', marginBottom:'.28rem' };
  const fieldWrap = { display:'flex', flexDirection:'column', gap:'.28rem' };

  return (
    <div style={{ position:'fixed', inset:0, background:'var(--bg, #f3f4f6)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:99990, padding:'1rem' }}>
      {/* Fond degrade subtil */}
      <div style={{ position:'absolute', inset:0, background:'linear-gradient(135deg, rgba(59,91,219,.08) 0%, rgba(124,58,237,.06) 100%)', pointerEvents:'none' }} />

      <div style={{ background:'var(--surface)', borderRadius:20, width:'100%', maxWidth:480, boxShadow:'0 24px 80px rgba(0,0,0,.18)', overflow:'hidden', position:'relative' }}>

        {/* Barre de progression */}
        <div style={{ height:4, background:'var(--border)' }}>
          <div style={{ height:'100%', width:`${((step) / (totalSteps-1)) * 100}%`, background:'var(--accent)', borderRadius:4, transition:'width .4s ease' }} />
        </div>

        {/* Header colore */}
        <div style={{ background:'linear-gradient(135deg, #1e3a8a 0%, #3b5bdb 55%, #7c3aed 100%)', padding:'2rem 2rem 1.5rem' }}>
          {/* Logo */}
          <div style={{ display:'flex', alignItems:'center', gap:'.65rem', marginBottom:'1.25rem' }}>
            <div dangerouslySetInnerHTML={{ __html: LOGO_SVG }} />
            <div style={{ fontFamily:'Roboto Slab,serif', fontWeight:800, color:'#fff', fontSize:'.95rem', letterSpacing:'-.01em' }}>ClassPro Desktop</div>
          </div>
          <div style={{ opacity: visible ? 1 : 0, transform: visible ? 'none' : `translateX(${animDir * 20}px)`, transition:'opacity .2s, transform .2s' }}>
            <div style={{ fontFamily:'Roboto Slab,serif', fontWeight:800, fontSize:'1.4rem', color:'#fff', lineHeight:1.2 }}>{current.title}</div>
            <div style={{ fontSize:'.82rem', color:'rgba(255,255,255,.7)', marginTop:'.3rem' }}>{current.sub}</div>
          </div>
          {/* Etapes */}
          <div style={{ display:'flex', gap:'.3rem', marginTop:'1.25rem' }}>
            {ONBOARDING_STEPS.map((_, i) => (
              <div key={i} style={{ flex:1, height:3, borderRadius:99, background: i <= step ? 'rgba(255,255,255,.8)' : 'rgba(255,255,255,.2)', transition:'background .3s' }} />
            ))}
          </div>
        </div>

        {/* Corps */}
        <div style={{ padding:'1.75rem 2rem', minHeight:220, opacity: visible ? 1 : 0, transform: visible ? 'none' : `translateY(${animDir * 10}px)`, transition:'opacity .2s, transform .2s' }}>

          {/* Etape 0 - Bienvenue */}
          {step === 0 && (
            <div style={{ textAlign:'center', padding:'.5rem 0' }}>
              <div style={{ fontSize:'3rem', marginBottom:'.75rem' }}>👋</div>
              <div style={{ fontWeight:700, fontSize:'1rem', color:'var(--text)', marginBottom:'.6rem' }}>
                ClassPro Desktop vous accompagne au quotidien.
              </div>
              <div style={{ fontSize:'.85rem', color:'var(--text2)', lineHeight:1.7, marginBottom:'1rem' }}>
                En 3 étapes rapides, configurez votre profil pour personnaliser votre expérience et débloquer votre premier badge !
              </div>
              <div style={{ display:'flex', justifyContent:'center', gap:'.5rem', flexWrap:'wrap' }}>
                {['🏆 Système de badges', '💾 Mémo sécurisé', '📚 Profil enseignant'].map(t => (
                  <span key={t} style={{ padding:'.28rem .75rem', background:'var(--surface2)', border:'1px solid var(--border)', borderRadius:99, fontSize:'.73rem', color:'var(--text2)' }}>{t}</span>
                ))}
              </div>
            </div>
          )}

          {/* Etape 1 - Identite */}
          {step === 1 && (
            <div style={{ display:'flex', flexDirection:'column', gap:'.75rem' }}>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'.6rem' }}>
                <div style={fieldWrap}>
                  <label style={labelStyle}>Prénom *</label>
                  <input autoFocus value={form.prenom} onChange={e => setForm(f=>({...f, prenom:e.target.value}))}
                    placeholder="Prénom" style={inputStyle}
                    onFocus={e=>e.target.style.borderColor='var(--accent)'} onBlur={e=>e.target.style.borderColor='var(--border)'} />
                </div>
                <div style={fieldWrap}>
                  <label style={labelStyle}>Nom *</label>
                  <input value={form.nom} onChange={e => setForm(f=>({...f, nom:e.target.value.toUpperCase()}))}
                    placeholder="NOM" style={inputStyle}
                    onFocus={e=>e.target.style.borderColor='var(--accent)'} onBlur={e=>e.target.style.borderColor='var(--border)'} />
                </div>
              </div>
              <div style={fieldWrap}>
                <label style={labelStyle}>Établissement</label>
                <input value={form.etablissement} onChange={e => setForm(f=>({...f, etablissement:e.target.value}))}
                  placeholder="Nom de votre établissement" style={inputStyle}
                  onFocus={e=>e.target.style.borderColor='var(--accent)'} onBlur={e=>e.target.style.borderColor='var(--border)'} />
              </div>
            </div>
          )}

          {/* Etape 2 - Matieres */}
          {step === 2 && (
            <div style={{ display:'flex', flexDirection:'column', gap:'.75rem' }}>
              <div style={fieldWrap}>
                <label style={labelStyle}>Matière(s) enseignée(s)</label>
                <input autoFocus value={form.matieres} onChange={e => setForm(f=>({...f, matieres:e.target.value}))}
                  placeholder="Ex : Espagnol, Italien, LCE…" style={inputStyle}
                  onFocus={e=>e.target.style.borderColor='var(--accent)'} onBlur={e=>e.target.style.borderColor='var(--border)'} />
              </div>
              <div style={{ fontSize:'.78rem', color:'var(--text3)', lineHeight:1.6, padding:'.55rem .75rem', background:'var(--surface2)', borderRadius:'var(--r-s)' }}>
                💡 Vous pouvez saisir plusieurs matières séparées par des virgules. Cette information apparaîtra dans votre profil sidebar.
              </div>
            </div>
          )}

          {/* Etape 3 - Memo */}
          {step === 3 && (
            <div style={{ display:'flex', flexDirection:'column', gap:'.6rem' }}>
              <div style={{ padding:'.5rem .75rem', background:'rgba(245,158,11,.08)', border:'1px solid rgba(245,158,11,.2)', borderRadius:'var(--r-s)', fontSize:'.73rem', color:'var(--text2)', lineHeight:1.6 }}>
                ⚠️ Ces données sont stockées <strong>localement sur cet appareil</strong>. Tout est optionnel.
              </div>
              {[
                ['loginPoste','Identifiant poste','identifiant@ac-academie.fr','text'],
                ['mdpPoste','Mot de passe poste','••••••••','password'],
                ['codePhotocopieuse','Code photocopieuse','Ex : 1234','text'],
              ].map(([key,label,ph,type]) => (
                <div key={key} style={fieldWrap}>
                  <label style={labelStyle}>{label}</label>
                  <input type={type} value={form[key]||''} onChange={e=>setForm(f=>({...f,[key]:e.target.value}))}
                    placeholder={ph} style={inputStyle}
                    onFocus={e=>e.target.style.borderColor='var(--accent)'} onBlur={e=>e.target.style.borderColor='var(--border)'} />
                </div>
              ))}
            </div>
          )}

          {/* Etape 4 - Flux ClassPro */}
          {step === 4 && (
            <div style={{ display:'flex', flexDirection:'column', gap:'.875rem' }}>
              {/* Schéma flux */}
              <div style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:'.5rem', padding:'1rem', background:'var(--surface2)', borderRadius:12, border:'1px solid var(--border)' }}>
                <div style={{ textAlign:'center' }}>
                  <div style={{ fontSize:'1.6rem' }}>📱</div>
                  <div style={{ fontSize:'.68rem', fontWeight:700, color:'var(--text2)', marginTop:'.25rem' }}>ClassPro</div>
                  <div style={{ fontSize:'.62rem', color:'var(--text3)' }}>En classe</div>
                </div>
                <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:'.15rem', flex:1 }}>
                  <div style={{ fontSize:'.62rem', color:'var(--accent)', fontWeight:600 }}>Export JSON</div>
                  <div style={{ width:'100%', height:2, background:'linear-gradient(90deg, var(--accent), var(--accent))', borderRadius:99, position:'relative' }}>
                    <div style={{ position:'absolute', right:-4, top:-4, width:10, height:10, borderTop:'2px solid var(--accent)', borderRight:'2px solid var(--accent)', transform:'rotate(45deg)' }} />
                  </div>
                  <div style={{ fontSize:'.62rem', color:'var(--text3)' }}>→ Téléchargements</div>
                </div>
                <div style={{ textAlign:'center' }}>
                  <div style={{ fontSize:'1.6rem' }}>🖥️</div>
                  <div style={{ fontSize:'.68rem', fontWeight:700, color:'var(--text2)', marginTop:'.25rem' }}>Desktop</div>
                  <div style={{ fontSize:'.62rem', color:'var(--text3)' }}>À la maison</div>
                </div>
              </div>

              <div style={{ fontSize:'.82rem', color:'var(--text2)', lineHeight:1.7 }}>
                <strong style={{ color:'var(--text)' }}>ClassPro</strong> (l'outil HTML utilisé en classe) génère un fichier <code style={{ background:'var(--surface2)', padding:'.1rem .3rem', borderRadius:4, fontSize:'.76rem' }}>.json</code> qui contient toutes vos données du jour.
              </div>

              <div style={{ padding:'.75rem 1rem', background:'rgba(59,91,219,.06)', border:'1px solid rgba(59,91,219,.18)', borderRadius:10, fontSize:'.8rem', color:'var(--text2)', lineHeight:1.65 }}>
                💡 <strong style={{ color:'var(--text)' }}>Conseil :</strong> enregistrez ce fichier JSON dans{' '}
                <code style={{ background:'var(--surface)', padding:'.1rem .35rem', borderRadius:4, fontSize:'.75rem', color:'var(--accent)', fontWeight:600 }}>Documents/ClassPro</code>
                {' '}— ClassPro Desktop s'ouvrira directement dans ce dossier lors de l'import.
              </div>

              <div style={{ display:'flex', flexDirection:'column', gap:'.45rem' }}>
                {[
                  '1. Exportez votre JSON depuis ClassPro en fin de journée',
                  '2. Déplacez-le dans Documents/ClassPro sur votre ordinateur',
                  '3. Ouvrez ClassPro Desktop et importez-le depuis l\'Accueil',
                ].map((step, i) => (
                  <div key={i} style={{ display:'flex', alignItems:'flex-start', gap:'.6rem', fontSize:'.78rem', color:'var(--text2)' }}>
                    <span style={{ color:'var(--accent)', fontWeight:700, flexShrink:0 }}>→</span>
                    <span>{step}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Etape 5 - Done */}
          {step === 5 && (
            <div style={{ textAlign:'center', padding:'.5rem 0' }}>
              <div style={{ fontSize:'3rem', marginBottom:'.75rem' }}>🎉</div>
              <div style={{ fontWeight:800, fontSize:'1rem', color:'var(--text)', marginBottom:'.6rem' }}>
                Bonjour {form.prenom || 'enseignant'} !
              </div>
              <div style={{ fontSize:'.85rem', color:'var(--text2)', lineHeight:1.7, marginBottom:'1rem' }}>
                Votre profil est configuré. Votre premier badge <strong>🚀 Bienvenue !</strong> vous attend.
              </div>
              <div style={{ display:'inline-flex', alignItems:'center', gap:'.6rem', padding:'.65rem 1.1rem', background:'rgba(59,91,219,.08)', border:'1px solid rgba(59,91,219,.2)', borderRadius:12 }}>
                <span style={{ fontSize:'1.3rem' }}>🌱</span>
                <div style={{ textAlign:'left' }}>
                  <div style={{ fontWeight:700, fontSize:'.82rem' }}>Niveau 1 — Stagiaire</div>
                  <div style={{ fontSize:'.7rem', color:'var(--text3)' }}>Utilisez ClassPro pour monter en niveau !</div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer navigation */}
        <div style={{ padding:'1rem 2rem 1.5rem', display:'flex', alignItems:'center', justifyContent:'space-between', borderTop:'1px solid var(--border)', background:'var(--surface2)' }}>
          <div>
            {step > 0 && step < totalSteps - 1 && (
              <button className="btn" onClick={goPrev} style={{ fontSize:'.8rem' }}>← Retour</button>
            )}
          </div>
          <div style={{ display:'flex', gap:'.5rem', alignItems:'center' }}>
            {step < totalSteps - 2 && (
              <button onClick={goNext} style={{ background:'none', border:'none', cursor:'pointer', fontSize:'.75rem', color:'var(--text3)', fontFamily:'Roboto,sans-serif', textDecoration:'underline dotted' }}>
                Passer
              </button>
            )}
            {step < totalSteps - 1 ? (
              <button className="btn btn-primary" onClick={goNext} disabled={!canNext()} style={{ fontSize:'.85rem' }}>
                {step === totalSteps - 2 ? 'Terminer la config →' : 'Suivant →'}
              </button>
            ) : (
              <button className="btn btn-primary" onClick={finish} style={{ fontSize:'.85rem' }}>
                🚀 Lancer ClassPro Desktop
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
