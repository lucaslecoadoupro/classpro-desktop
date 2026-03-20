// ── MODULE CLASSPRO — Guide de démarrage & téléchargement ───────────────────
function ModuleClassPro({ cpData }) {
  const [showDownload, setShowDownload] = React.useState(false);

  const steps = [
    {
      num: 1,
      icon: '💾',
      title: 'Télécharger ClassPro',
      desc: 'ClassPro est inclus dans ClassPro Desktop. Copiez le dossier classpro sur votre cle USB. Aucune installation, aucune connexion.',
      action: {
        label: '⬇️ Télécharger ClassPro',
        href: 'DOWNLOAD_DIRECT',
      },
      detail: 'Cliquez sur Ouvrir le dossier ClassPro ci-dessus. Copiez le dossier entier sur votre cle USB.',
    },
    {
      num: 2,
      icon: '🔌',
      title: 'Brancher la clé USB en classe',
      desc: 'Ouvrez le fichier index.html depuis la clé USB dans votre navigateur. Aucun réseau internet requis.',
      detail: 'Compatible Chrome, Firefox, Edge. Fonctionne sur le poste enseignant ou l\'ordinateur de classe.',
    },
    {
      num: 3,
      icon: '📤',
      title: 'Exporter le JSON depuis ClassPro',
      desc: 'Dans ClassPro, allez dans Paramètres → Exporter mes données. Un fichier JSON est téléchargé.',
      detail: 'Ce fichier contient toutes vos classes, séances, progressions, EDT et bulletins.',
    },
    {
      num: 4,
      icon: '📂',
      title: 'Importer dans ClassPro Desktop',
      desc: 'De retour ici, cliquez sur Accueil → Ouvrir un fichier ClassPro et sélectionnez le JSON.',
      detail: 'Toutes vos données apparaissent immédiatement dans les modules de ClassPro Desktop.',
    },
    {
      num: 5,
      icon: '✏️',
      title: 'Travailler chez vous',
      desc: 'Préparez vos cours, mettez à jour votre suivi, générez des PDF — tout depuis ClassPro Desktop.',
      detail: 'Vos modifications sont automatiquement reflétées dans le JSON.',
    },
    {
      num: 6,
      icon: '🔄',
      title: 'Ré-exporter vers ClassPro',
      desc: 'Cliquez sur "Sauvegarder JSON" en bas à droite, puis replacez le fichier sur votre clé USB.',
      detail: 'Relancez ClassPro en classe et importez le nouveau JSON : tout est synchronisé.',
    },
  ];

  const faq = [
    {
      q: 'ClassPro fonctionne-t-il sans connexion internet ?',
      a: 'Oui, totalement. ClassPro tourne en local depuis la clé USB. ClassPro Desktop aussi fonctionne hors-ligne.',
    },
    {
      q: 'Mes données sont-elles stockées sur un serveur ?',
      a: 'Non. Tout reste sur votre clé USB et votre ordinateur, sous forme de fichier JSON. Aucune donnée n\'est envoyée sur internet.',
    },
    {
      q: 'Que se passe-t-il si je perds ma clé USB ?',
      a: 'Si vous avez exporté votre JSON via ClassPro Desktop, vous pouvez recréer votre environnement à partir du fichier sauvegardé. Pensez à sauvegarder régulièrement !',
    },
    {
      q: 'ClassPro Desktop remplace-t-il ClassPro ?',
      a: 'Non, ils sont complémentaires. ClassPro s\'utilise en classe (sur clé USB), ClassPro Desktop s\'utilise chez vous pour préparer et éditer.',
    },
  ];

  return (
    <>
      <div className="page-hd">
        <div>
          <div className="phd-badge">🛡️ ClassPro</div>
          <div className="phd-title">Démarrer avec ClassPro</div>
          <div className="phd-sub">Comment utiliser ClassPro en classe et synchroniser avec ClassPro Desktop</div>
        </div>
        <div className="phd-actions">
          <button className="btn btn-primary"
            style={{ display:'flex', alignItems:'center', gap:'.4rem' }}
            onClick={() => setShowDownload(true)}>
            ⬇️ Télécharger ClassPro
          </button>
        </div>
      </div>

      <div className="page-content">

        {/* Bandeau statut si JSON ouvert */}
        {cpData ? (
          <div style={{ display:'flex', alignItems:'center', gap:'.75rem', padding:'.75rem 1rem', background:'rgba(16,185,129,.08)', border:'1px solid rgba(16,185,129,.25)', borderRadius:'var(--r-s)', marginBottom:'1.25rem' }}>
            <span style={{ fontSize:'1.2rem' }}>✅</span>
            <div>
              <div style={{ fontWeight:700, fontSize:'.85rem', color:'var(--success)' }}>Fichier ClassPro chargé</div>
              <div style={{ fontSize:'.75rem', color:'var(--text2)', marginTop:'.1rem' }}>
                {cpData.profile?.prenom} {cpData.profile?.nom} · {cpData.classes?.length || 0} classe{(cpData.classes?.length||0)>1?'s':''} · JSON v{cpData.version}
              </div>
            </div>
          </div>
        ) : (
          <div style={{ display:'flex', alignItems:'center', gap:'.75rem', padding:'.75rem 1rem', background:'rgba(245,158,11,.08)', border:'1px solid rgba(245,158,11,.25)', borderRadius:'var(--r-s)', marginBottom:'1.25rem' }}>
            <span style={{ fontSize:'1.2rem' }}>⚠️</span>
            <div>
              <div style={{ fontWeight:700, fontSize:'.85rem', color:'var(--warning)' }}>Aucun fichier chargé</div>
              <div style={{ fontSize:'.75rem', color:'var(--text2)', marginTop:'.1rem' }}>
                Importez votre JSON ClassPro depuis l'Accueil pour accéder à vos données, ou créez votre fichier directement.
              </div>
            </div>
          </div>
        )}

        {/* Flux de travail visuel */}
        <div className="card" style={{ marginBottom:'1.25rem' }}>
          <div className="card-hd">
            <div className="card-title">🔄 Flux de travail ClassPro ↔ ClassPro Desktop</div>
          </div>
          <div className="card-body">
            <div style={{ display:'flex', alignItems:'center', gap:'.5rem', flexWrap:'wrap', padding:'.5rem 0' }}>
              {['ClassPro (clé USB)', '→ Exporter JSON →', 'ClassPro Desktop (maison)', '→ Sauvegarder JSON →', 'ClassPro (clé USB)'].map((step, i) => (
                <div key={i} style={{
                  padding: step.startsWith('→') ? '0' : '.4rem .85rem',
                  background: step.startsWith('→') ? 'none' : i === 2 ? 'rgba(59,91,219,.1)' : 'var(--surface2)',
                  border: step.startsWith('→') ? 'none' : `1px solid ${i === 2 ? 'rgba(59,91,219,.3)' : 'var(--border)'}`,
                  borderRadius: 'var(--r-s)',
                  fontSize: step.startsWith('→') ? '.75rem' : '.8rem',
                  fontWeight: step.startsWith('→') ? 400 : 700,
                  color: step.startsWith('→') ? 'var(--text3)' : i === 2 ? 'var(--accent)' : 'var(--text2)',
                }}>
                  {step}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Guide pas à pas */}
        <div className="card" style={{ marginBottom:'1.25rem' }}>
          <div className="card-hd">
            <div className="card-title">📋 Guide de démarrage</div>
          </div>
          <div className="card-body" style={{ display:'flex', flexDirection:'column', gap:'.5rem' }}>
            {steps.map((s, i) => (
              <div key={i} style={{ display:'flex', gap:'1rem', padding:'.75rem', background:'var(--surface2)', borderRadius:'var(--r-s)', border:'1px solid var(--border)', alignItems:'flex-start' }}>
                {/* Numéro + icône */}
                <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:'.25rem', flexShrink:0 }}>
                  <div style={{ width:28, height:28, borderRadius:'50%', background:'var(--accent)', color:'#fff', fontWeight:800, fontSize:'.75rem', display:'flex', alignItems:'center', justifyContent:'center' }}>{s.num}</div>
                  <span style={{ fontSize:'1rem' }}>{s.icon}</span>
                </div>
                <div style={{ flex:1 }}>
                  <div style={{ fontWeight:700, fontSize:'.85rem', marginBottom:'.2rem' }}>{s.title}</div>
                  <div style={{ fontSize:'.78rem', color:'var(--text2)', lineHeight:1.6 }}>{s.desc}</div>
                  <div style={{ fontSize:'.72rem', color:'var(--text3)', marginTop:'.3rem', lineHeight:1.5 }}>💡 {s.detail}</div>
                  {s.action && (
                    <button onClick={() => setShowDownload(true)}
                      style={{ display:'inline-flex', alignItems:'center', marginTop:'.5rem', padding:'.3rem .75rem', background:'var(--accent)', color:'#fff', borderRadius:'var(--r-xs)', fontSize:'.75rem', fontWeight:700, border:'none', cursor:'pointer', fontFamily:'Roboto,sans-serif' }}>
                      {s.action.label}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* FAQ */}
        <div className="card">
          <div className="card-hd">
            <div className="card-title">❓ Questions fréquentes</div>
          </div>
          <div className="card-body" style={{ display:'flex', flexDirection:'column', gap:'.6rem' }}>
            {faq.map((f, i) => (
              <div key={i} style={{ padding:'.65rem .875rem', background:'var(--surface2)', borderRadius:'var(--r-s)', border:'1px solid var(--border)' }}>
                <div style={{ fontWeight:700, fontSize:'.82rem', marginBottom:'.25rem' }}>Q. {f.q}</div>
                <div style={{ fontSize:'.78rem', color:'var(--text2)', lineHeight:1.6 }}>→ {f.a}</div>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* Modale téléchargement ClassPro */}
      {showDownload && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,.55)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:9999, padding:'1rem' }}
          onClick={e => e.target === e.currentTarget && setShowDownload(false)}>
          <div style={{ background:'var(--surface)', borderRadius:16, width:460, boxShadow:'0 24px 64px rgba(0,0,0,.3)', overflow:'hidden' }}>
            <div style={{ background:'linear-gradient(135deg,#1e3a8a,#3b5bdb,#7c3aed)', padding:'1.5rem 1.75rem' }}>
              <div style={{ display:'flex', alignItems:'center', gap:'.75rem', marginBottom:'.75rem' }}>
                <span style={{ fontSize:'2rem' }}>🛡️</span>
                <div>
                  <div style={{ fontFamily:'Roboto Slab,serif', fontWeight:800, fontSize:'1.1rem', color:'#fff' }}>Télécharger ClassPro</div>
                  <div style={{ fontSize:'.75rem', color:'rgba(255,255,255,.7)', marginTop:'.1rem' }}>L'application à utiliser en classe sur clé USB</div>
                </div>
              </div>
            </div>
            <div style={{ padding:'1.5rem 1.75rem', display:'flex', flexDirection:'column', gap:'1rem' }}>
              <div style={{ padding:'.75rem', background:'rgba(59,91,219,.07)', border:'1px solid rgba(59,91,219,.2)', borderRadius:'var(--r-s)', fontSize:'.8rem', color:'var(--text2)', lineHeight:1.65 }}>
                ClassPro est inclus directement dans ClassPro Desktop. Copiez le dossier <strong>classpro</strong> sur votre clé USB, puis ouvrez <strong>index.html</strong> dans votre navigateur — aucune connexion internet requise.
              </div>
              <div style={{ display:'flex', flexDirection:'column', gap:'.5rem' }}>
                {/* Bouton principal : ouvrir le dossier classpro dans le Finder/Explorateur */}
                <button
                  onClick={async () => { if (window.cpd?.openClassproFolder) { await window.cpd.openClassproFolder(); setShowDownload(false); } }}
                  style={{ display:'flex', alignItems:'center', gap:'.75rem', padding:'.875rem 1rem', background:'var(--accent)', border:'1px solid var(--accent)', borderRadius:'var(--r-s)', cursor:'pointer', fontFamily:'Roboto,sans-serif', textAlign:'left', width:'100%' }}
                  onMouseEnter={e => e.currentTarget.style.opacity='.85'}
                  onMouseLeave={e => e.currentTarget.style.opacity='1'}>
                  <span style={{ fontSize:'1.5rem', flexShrink:0 }}>📂</span>
                  <div>
                    <div style={{ fontWeight:700, fontSize:'.88rem', color:'#fff' }}>Ouvrir le dossier ClassPro</div>
                    <div style={{ fontSize:'.72rem', color:'rgba(255,255,255,.75)', marginTop:'.15rem' }}>Ouvre le dossier dans le Finder (Mac) ou l'Explorateur (Windows)</div>
                  </div>
                </button>
                {/* Versions beta sur GitHub */}
                <button
                  onClick={() => window.open('https://github.com/lucaslecoadoupro/classpro/releases','_blank')}
                  style={{ display:'flex', alignItems:'center', gap:'.75rem', padding:'.65rem .875rem', background:'var(--surface2)', border:'1px solid var(--border)', borderRadius:'var(--r-s)', cursor:'pointer', fontFamily:'Roboto,sans-serif', textAlign:'left', width:'100%', opacity:.7 }}
                  onMouseEnter={e => e.currentTarget.style.opacity='1'}
                  onMouseLeave={e => e.currentTarget.style.opacity='.7'}>
                  <span style={{ fontSize:'1.1rem', flexShrink:0 }}>🧪</span>
                  <div>
                    <div style={{ fontWeight:600, fontSize:'.8rem', color:'var(--text2)' }}>Versions bêta (GitHub)</div>
                    <div style={{ fontSize:'.68rem', color:'var(--text3)', marginTop:'.1rem' }}>Pour les utilisateurs avancés uniquement — Mac et Windows</div>
                  </div>
                </button>
              </div>
              <div style={{ fontSize:'.72rem', color:'var(--text3)', lineHeight:1.6, padding:'.5rem .75rem', background:'var(--surface2)', borderRadius:'var(--r-s)' }}>
                💡 Apres avoir copie le dossier sur votre cle USB, revenez ici et suivez le guide etape par etape.
              </div>
              <div style={{ display:'flex', justifyContent:'flex-end' }}>
                <button className="btn" onClick={() => setShowDownload(false)}>Fermer</button>
              </div>
            </div>
          </div>
        </div>
      )}

    </>
  );
}
