function ModuleClasses({ cpData, onDataChange, pushToast }) {
  const classes = cpData?.classes || [];
  const [selCls, setSelCls] = useState(classes[0]?.id || null);
  const [newEleve, setNewEleve] = useState('');
  const [showImportEleves, setShowImportEleves] = useState(false);
  const [importText, setImportText] = useState('');
  const [showNewCls, setShowNewCls] = useState(false);
  const [newClsName, setNewClsName] = useState('');
  const [editingCls, setEditingCls] = useState(null);
  const [editClsVal, setEditClsVal] = useState('');
  const [importOnglet, setImportOnglet] = useState('csv');

  const cls = classes.find(c => c.id === selCls);
  const save = (newClasses) => onDataChange('sc-classes', newClasses);

  // Import CSV — lit la première colonne, ignore l'en-tête si non alphanumérique dominant
  const importCsv = (e) => {
    const file = e.target.files?.[0];
    if (!file || !cls) return;
    e.target.value = '';
    const reader = new FileReader();
    reader.onload = (ev) => {
      const lines = ev.target.result.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
      // Ignorer la première ligne si c'est un en-tête (contient "nom", "élève", "name" ou commence par une minuscule)
      const firstCell = lines[0]?.split(/[;,\t]/)[0].replace(/['"]/g, '').trim().toLowerCase();
      const isHeader = /^(nom|prenom|prénom|name|eleve|élève|student)/.test(firstCell) || /^[a-z]/.test(firstCell);
      const start = isHeader ? 1 : 0;
      const existNoms = (cls.eleves || []).map(el => el.nom.toLowerCase());
      const nouveaux = lines.slice(start)
        .map(l => l.split(/[;,\t]/)[0].replace(/['"«»""'']/g, '').trim()) // supprimer guillemets
        .filter(nom => nom.length > 1 && !existNoms.includes(nom.toLowerCase()))
        .map(nom => ({ id: 'el-' + Date.now() + Math.random().toString(36).slice(2), nom }));
      if (!nouveaux.length) { alert('Aucun nom détecté ou tous les élèves existent déjà.'); return; }
      save(classes.map(c => c.id === selCls ? { ...c, eleves: [...(c.eleves || []), ...nouveaux] } : c));
      setShowImportEleves(false);
      if (pushToast) pushToast(`${nouveaux.length} élève(s) importé(s) avec succès !`, 'success');
    };
    reader.readAsText(file, 'UTF-8');
  };

  const addClasse = () => {
    if (!newClsName.trim()) return;
    const nc = { id: 'cls-' + Date.now(), name: newClsName.trim(), eleves: [] };
    const newClasses = [...classes, nc];
    save(newClasses);
    setSelCls(nc.id);
    setNewClsName('');
    setShowNewCls(false);
    // Badges gamification
    if (newClasses.length === 1) cpdUnlockBadge('first_class');
    if (newClasses.length >= 5) cpdUnlockBadge('classes_5');
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
    if (pushToast) pushToast(`${newEleves.length} élève(s) importé(s) avec succès !`, 'success');
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
                <button className="btn" onClick={() => { setShowImportEleves(true); setImportText(''); }}>
                  📋 Importer une liste
                </button>
                <input id="csv-import-input" type="file" accept=".csv,.txt" onChange={importCsv}
                  style={{ display: 'none' }} />
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

      {/* Modale import liste élèves — guidée CSV + texte */}
      {showImportEleves && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,.5)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:9999, padding:'1rem' }}
          onClick={e => e.target===e.currentTarget && setShowImportEleves(false)}>
          <div style={{ background:'var(--surface)', borderRadius:16, width:520, maxHeight:'90vh', overflowY:'auto', boxShadow:'0 24px 64px rgba(0,0,0,.3)', display:'flex', flexDirection:'column' }}>

            {/* Header */}
            <div style={{ background:'linear-gradient(135deg,#1e3a8a,#3b5bdb)', padding:'1.25rem 1.5rem', borderRadius:'16px 16px 0 0', flexShrink:0 }}>
              <div style={{ fontFamily:'Roboto Slab,serif', fontWeight:800, fontSize:'1.05rem', color:'#fff', marginBottom:'.2rem' }}>
                📋 Importer une liste d&apos;élèves
              </div>
              <div style={{ fontSize:'.78rem', color:'rgba(255,255,255,.75)' }}>
                {cls ? cls.name : ''} — choisissez votre méthode d&apos;import
              </div>
            </div>

            {/* Onglets */}
            <div style={{ display:'flex', borderBottom:'1px solid var(--border)', background:'var(--surface2)', flexShrink:0 }}>
              {[
                {id:'csv', label:'📂 Depuis PRONOTE (CSV)', recommended:true},
                {id:'texte', label:'✏️ Coller une liste texte'}
              ].map(o => (
                <button key={o.id} onClick={() => setImportOnglet(o.id)}
                  style={{ flex:1, padding:'.65rem 1rem', border:'none', borderBottom:`2.5px solid ${importOnglet===o.id ? 'var(--accent)' : 'transparent'}`, background:'none', cursor:'pointer', fontFamily:'Roboto,sans-serif', fontSize:'.8rem', fontWeight:importOnglet===o.id ? 700 : 500, color:importOnglet===o.id ? 'var(--accent)' : 'var(--text2)', display:'flex', alignItems:'center', justifyContent:'center', gap:'.4rem' }}>
                  {o.label}
                  {o.recommended && <span style={{ fontSize:'.58rem', padding:'.08rem .4rem', borderRadius:99, background:'rgba(59,91,219,.12)', color:'var(--accent)', fontWeight:700 }}>Recommandé</span>}
                </button>
              ))}
            </div>

            {/* Onglet CSV */}
            {importOnglet === 'csv' && (
              <div style={{ padding:'1.25rem 1.5rem', display:'flex', flexDirection:'column', gap:'.875rem' }}>
                <div style={{ fontSize:'.8rem', color:'var(--text2)', lineHeight:1.6, padding:'.65rem .875rem', background:'rgba(59,91,219,.05)', border:'1px solid rgba(59,91,219,.15)', borderRadius:10 }}>
                  💡 Exportez votre liste depuis <strong>PRONOTE</strong> en quelques clics — ClassPro lit automatiquement la première colonne.
                </div>
                <div style={{ display:'flex', flexDirection:'column', gap:'.42rem' }}>
                  <div style={{ display:'flex', gap:'.875rem', alignItems:'flex-start', padding:'.65rem .75rem', background:'var(--surface2)', border:'1px solid var(--border)', borderRadius:10 }}>
                    <div style={{ width:26, height:26, borderRadius:'50%', background:'var(--border)', display:'flex', alignItems:'center', justifyContent:'center', color:'var(--text2)', fontSize:'.72rem', fontWeight:800, flexShrink:0, marginTop:'.05rem' }}>
                      1
                    </div>
                    <div style={{ flex:1 }}>
                      <div style={{ fontWeight:700, fontSize:'.83rem', color:'var(--text)', marginBottom:'.2rem' }}>Ouvrez PRONOTE</div>
                      <div style={{ fontSize:'.76rem', color:'var(--text2)', lineHeight:1.55 }}>Connectez-vous sur la version web de PRONOTE (pronote.net ou ENT de votre académie).</div>
                    </div>
                  </div>
                  <div style={{ display:'flex', gap:'.875rem', alignItems:'flex-start', padding:'.65rem .75rem', background:'var(--surface2)', border:'1px solid var(--border)', borderRadius:10 }}>
                    <div style={{ width:26, height:26, borderRadius:'50%', background:'var(--border)', display:'flex', alignItems:'center', justifyContent:'center', color:'var(--text2)', fontSize:'.72rem', fontWeight:800, flexShrink:0, marginTop:'.05rem' }}>
                      2
                    </div>
                    <div style={{ flex:1 }}>
                      <div style={{ fontWeight:700, fontSize:'.83rem', color:'var(--text)', marginBottom:'.2rem' }}>Allez dans "Mes données"</div>
                      <div style={{ fontSize:'.76rem', color:'var(--text2)', lineHeight:1.55 }}>Dans le menu principal, cliquez sur Mes données → Liste d'élèves.</div>
                    </div>
                  </div>
                  <div style={{ display:'flex', gap:'.875rem', alignItems:'flex-start', padding:'.65rem .75rem', background:'var(--surface2)', border:'1px solid var(--border)', borderRadius:10 }}>
                    <div style={{ width:26, height:26, borderRadius:'50%', background:'var(--border)', display:'flex', alignItems:'center', justifyContent:'center', color:'var(--text2)', fontSize:'.72rem', fontWeight:800, flexShrink:0, marginTop:'.05rem' }}>
                      3
                    </div>
                    <div style={{ flex:1 }}>
                      <div style={{ fontWeight:700, fontSize:'.83rem', color:'var(--text)', marginBottom:'.2rem' }}>Sélectionnez la classe</div>
                      <div style={{ fontSize:'.76rem', color:'var(--text2)', lineHeight:1.55 }}>Choisissez la classe dont vous voulez importer les élèves dans le menu déroulant.</div>
                    </div>
                  </div>
                  <div style={{ display:'flex', gap:'.875rem', alignItems:'flex-start', padding:'.65rem .75rem', background:'var(--surface2)', border:'1px solid var(--border)', borderRadius:10 }}>
                    <div style={{ width:26, height:26, borderRadius:'50%', background:'var(--border)', display:'flex', alignItems:'center', justifyContent:'center', color:'var(--text2)', fontSize:'.72rem', fontWeight:800, flexShrink:0, marginTop:'.05rem' }}>
                      4
                    </div>
                    <div style={{ flex:1 }}>
                      <div style={{ fontWeight:700, fontSize:'.83rem', color:'var(--text)', marginBottom:'.2rem' }}>Exportez en CSV</div>
                      <div style={{ fontSize:'.76rem', color:'var(--text2)', lineHeight:1.55 }}>Cliquez sur le bouton Export (icône carrés entremêlés en haut à droite) puis choisissez CSV.</div>
                    </div>
                  </div>
                  <div style={{ display:'flex', gap:'.875rem', alignItems:'flex-start', padding:'.65rem .75rem', background:'rgba(59,91,219,.05)', border:'1px solid rgba(59,91,219,.2)', borderRadius:10 }}>
                    <div style={{ width:26, height:26, borderRadius:'50%', background:'var(--accent)', display:'flex', alignItems:'center', justifyContent:'center', color:'#fff', fontSize:'.72rem', fontWeight:800, flexShrink:0, marginTop:'.05rem' }}>
                      5
                    </div>
                    <div style={{ flex:1 }}>
                      <div style={{ fontWeight:700, fontSize:'.83rem', color:'var(--text)', marginBottom:'.2rem' }}>Importez le fichier ici</div>
                      <div style={{ fontSize:'.76rem', color:'var(--text2)', lineHeight:1.55 }}>Cliquez sur le bouton ci-dessous et sélectionnez le fichier .csv téléchargé. ClassPro lit automatiquement la première colonne.</div>
                    </div>
                  </div>
                </div>
                <div style={{ display:'flex', gap:'.5rem', justifyContent:'flex-end', paddingTop:'.25rem' }}>
                  <button className="btn" onClick={() => setShowImportEleves(false)}>Annuler</button>
                  <button className="btn btn-primary" onClick={() => document.getElementById('csv-import-input').click()}>
                    📂 Sélectionner le fichier CSV
                  </button>
                </div>
              </div>
            )}

            {/* Onglet texte */}
            {importOnglet === 'texte' && (
              <div style={{ padding:'1.25rem 1.5rem', display:'flex', flexDirection:'column', gap:'.875rem' }}>
                <div style={{ fontSize:'.8rem', color:'var(--text2)', lineHeight:1.6, padding:'.65rem .875rem', background:'var(--surface2)', border:'1px solid var(--border)', borderRadius:10 }}>
                  Collez directement votre liste — <strong>un élève par ligne</strong>, au format <code style={{ background:'var(--surface)', padding:'.1rem .3rem', borderRadius:4, fontSize:'.74rem' }}>NOM Prénom</code>. Les doublons sont ignorés.
                </div>
                <textarea value={importText} onChange={e => setImportText(e.target.value)}
                  autoFocus
                  placeholder={"DUPONT Marie\nMARTIN Paul\nBERNARD Léa\n..."}
                  rows={9} style={{ width:'100%', padding:'.65rem', border:'1.5px solid var(--border)', borderRadius:'var(--r-s)', background:'var(--surface2)', color:'var(--text)', fontFamily:'Roboto,sans-serif', fontSize:'.85rem', outline:'none', resize:'vertical', boxSizing:'border-box' }} />
                <div style={{ display:'flex', gap:'.5rem', justifyContent:'space-between', alignItems:'center' }}>
                  <div style={{ fontSize:'.75rem', color:'var(--text3)' }}>
                    {importText.trim() ? importText.trim().split('\n').filter(Boolean).length + ' élève(s) détecté(s)' : 'Collez votre liste ci-dessus'}
                  </div>
                  <div style={{ display:'flex', gap:'.5rem' }}>
                    <button className="btn" onClick={() => { setShowImportEleves(false); setImportText(''); }}>Annuler</button>
                    <button className="btn btn-primary" disabled={!importText.trim()} onClick={importEleves}>Importer</button>
                  </div>
                </div>
              </div>
            )}

          </div>
        </div>
      )}
    </>
  );
}
