// ── MODULE CARNET DE BORD ─────────────────────────────────────────────────────

// FIX v0.7.2 : convertit le HTML rich text (importé depuis la version HTML)
// en texte brut pour l'affichage dans les textareas Desktop
function htmlToText(html) {
  if (!html) return '';
  if (!html.includes('<')) return html;
  try {
    const div = document.createElement('div');
    div.innerHTML = html;
    div.querySelectorAll('br').forEach(br => br.replaceWith('\n'));
    div.querySelectorAll('p, div, li').forEach(el => el.insertAdjacentText('afterend', '\n'));
    return (div.textContent || div.innerText || '').replace(/\n{3,}/g, '\n\n').trim();
  } catch (e) {
    return html.replace(/<[^>]+>/g, ' ').replace(/\s{2,}/g, ' ').trim();
  }
}

// FIX v0.7.2 : nettoie tous les champs rich text d'une fiche pour Desktop
const RICH_KEYS = ['objectif', 'activite', 'devoirs', 'documents', 'aRevoir', 'incidents'];
function sanitizeFiche(fiche) {
  if (!fiche) return fiche;
  const out = { ...fiche };
  RICH_KEYS.forEach(k => { if (out[k]) out[k] = htmlToText(out[k]); });
  return out;
}

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
  const [showDelPeriode, setShowDelPeriode] = useState(false);
  const [delPeriode, setDelPeriode] = useState('tout'); // 'jour' | 'semaine' | 'mois' | 'tout'
  const [delPreview, setDelPreview] = useState([]); // fiches à supprimer

  // Sync vers parent à chaque modif
  useEffect(() => { onDataChange('cdc-fiches', fiches); }, [fiches]);

  const cls = classes.find(c => c.id === selCls);

  const getFichesParPeriode = (periode) => {
    const clsFiches = fiches[selCls] || [];
    if (periode === 'tout') return clsFiches;
    const now = new Date();
    const todayIso = isoDate(now);
    if (periode === 'jour') return clsFiches.filter(f => f.date === todayIso);
    if (periode === 'semaine') {
      const lundi = new Date(now); lundi.setDate(now.getDate() - (now.getDay() === 0 ? 6 : now.getDay() - 1));
      const vendredi = new Date(lundi); vendredi.setDate(lundi.getDate() + 4);
      const lunIso = isoDate(lundi), venIso = isoDate(vendredi);
      return clsFiches.filter(f => f.date >= lunIso && f.date <= venIso);
    }
    if (periode === 'mois') {
      const debutMois = isoDate(new Date(now.getFullYear(), now.getMonth(), 1));
      const finMois   = isoDate(new Date(now.getFullYear(), now.getMonth() + 1, 0));
      return clsFiches.filter(f => f.date >= debutMois && f.date <= finMois);
    }
    return [];
  };

  const openDelPeriode = () => {
    const preview = getFichesParPeriode(delPeriode);
    setDelPreview(preview);
    setShowDelPeriode(true);
  };

  const deleteParPeriode = () => {
    const idsToDelete = new Set(delPreview.map(f => f.id));
    setFiches(p => ({ ...p, [selCls]: (p[selCls] || []).filter(f => !idsToDelete.has(f.id)) }));
    if (idsToDelete.has(selFiche)) { setSelFiche(null); setDraft(null); }
    setShowDelPeriode(false);
  };
  const clsFiches = (fiches[selCls] || [])
    .slice()
    .sort((a, b) => b.date.localeCompare(a.date))
    .filter(f => !search || f.titre?.toLowerCase().includes(search.toLowerCase()) || f.date?.includes(search));

  const ficheActive = selFiche ? (fiches[selCls] || []).find(f => f.id === selFiche) : null;

  useEffect(() => {
    if (ficheActive) setDraft({ ...sanitizeFiche(ficheActive) }); // FIX: nettoie le HTML riche à l'affichage
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
    // FIX: vérification doublon — même date + même titre (insensible à la casse)
    const existing = (fiches[selCls] || []).find(
      f => f.date === newForm.date && f.titre.trim().toLowerCase() === newForm.titre.trim().toLowerCase()
    );
    if (existing) {
      // Sélectionne la fiche existante au lieu d'en créer une identique
      setSelFiche(existing.id);
      setDraft({ ...existing });
      setShowNew(false);
      setNewForm({ date: isoDate(new Date()), titre: '' });
      return;
    }
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
          {selCls && (fiches[selCls]||[]).length > 0 && (
            <button className="btn btn-ghost" style={{ color:'var(--danger)', borderColor:'var(--danger)' }}
              onClick={() => { setDelPeriode('tout'); setDelPreview(getFichesParPeriode('tout')); setShowDelPeriode(true); }}>
              🗑️ Supprimer...
            </button>
          )}
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
                    <span>{f.date ? new Date(f.date + 'T12:00').toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' }) : ''}</span>
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
      {/* Modale suppression par période */}
      {showDelPeriode && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,.6)', zIndex:9000, display:'flex', alignItems:'center', justifyContent:'center', padding:'1rem', backdropFilter:'blur(2px)' }}
          onClick={e => e.target===e.currentTarget && setShowDelPeriode(false)}>
          <div style={{ background:'var(--surface)', borderRadius:12, width:460, maxHeight:'80vh', display:'flex', flexDirection:'column', boxShadow:'0 8px 32px rgba(0,0,0,.25)', overflow:'hidden', outline:'none' }}>
            <div style={{ padding:'1rem 1.25rem', borderBottom:'1px solid var(--border)', background:'var(--surface2)', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
              <div style={{ fontWeight:700, fontSize:'.95rem' }}>🗑️ Supprimer des fiches</div>
              <button onClick={() => setShowDelPeriode(false)} style={{ background:'none', border:'none', cursor:'pointer', fontSize:'1.3rem', color:'var(--text3)' }}>×</button>
            </div>
            <div style={{ padding:'1.25rem', display:'flex', flexDirection:'column', gap:'.875rem' }}>
              {/* Sélecteur période */}
              <div style={{ display:'flex', flexDirection:'column', gap:'.5rem' }}>
                <label style={{ fontSize:'.72rem', fontWeight:700, color:'var(--text2)', textTransform:'uppercase', letterSpacing:'.07em' }}>Période</label>
                <div style={{ display:'flex', gap:'.4rem' }}>
                  {[{id:'jour',label:"Aujourd'hui"},{id:'semaine',label:'Cette semaine'},{id:'mois',label:'Ce mois'},{id:'tout',label:'Tout'}].map(p => (
                    <button key={p.id} onClick={() => { setDelPeriode(p.id); setDelPreview(getFichesParPeriode(p.id)); }}
                      style={{ flex:1, padding:'.45rem .3rem', borderRadius:'var(--r-s)', border:`1.5px solid ${delPeriode===p.id ? 'var(--danger)' : 'var(--border)'}`, background: delPeriode===p.id ? 'rgba(220,38,38,.08)' : 'var(--surface)', color: delPeriode===p.id ? 'var(--danger)' : 'var(--text2)', fontFamily:'Roboto,sans-serif', fontSize:'.75rem', fontWeight: delPeriode===p.id ? 700 : 500, cursor:'pointer', transition:'all .13s' }}>
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>
              {/* Aperçu */}
              <div style={{ border:'1px solid var(--border)', borderRadius:'var(--r-s)', overflow:'hidden' }}>
                <div style={{ padding:'.5rem .875rem', background:'var(--surface2)', fontSize:'.72rem', fontWeight:700, color:'var(--text2)', borderBottom:'1px solid var(--border)' }}>
                  {delPreview.length} fiche{delPreview.length>1?'s':''} concernée{delPreview.length>1?'s':''}
                </div>
                <div style={{ maxHeight:200, overflowY:'auto' }}>
                  {delPreview.length === 0 ? (
                    <div style={{ padding:'1rem', textAlign:'center', color:'var(--text3)', fontSize:'.82rem', fontStyle:'italic' }}>Aucune fiche sur cette période</div>
                  ) : delPreview.map(f => (
                    <div key={f.id} style={{ display:'flex', alignItems:'center', gap:'.65rem', padding:'.42rem .875rem', borderBottom:'1px solid var(--border)', fontSize:'.8rem' }}>
                      <span style={{ color:'var(--danger)', fontSize:'.7rem' }}>🗑️</span>
                      <div style={{ flex:1 }}>
                        <div style={{ fontWeight:600, color:'var(--text)' }}>{f.titre}</div>
                        <div style={{ fontSize:'.7rem', color:'var(--text3)' }}>{f.date && new Date(f.date+'T12:00').toLocaleDateString('fr-FR',{weekday:'short',day:'numeric',month:'short'})}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              {delPreview.length > 0 && (
                <div style={{ padding:'.6rem .875rem', background:'rgba(220,38,38,.06)', border:'1px solid rgba(220,38,38,.2)', borderRadius:'var(--r-s)', fontSize:'.78rem', color:'var(--danger)' }}>
                  ⚠️ Cette action est irréversible. {delPreview.length} fiche{delPreview.length>1?'s':''} sera{delPreview.length>1?'nt':''} définitivement supprimée{delPreview.length>1?'s':''}.
                </div>
              )}
              <div style={{ display:'flex', gap:'.5rem', justifyContent:'flex-end' }}>
                <button className="btn" onClick={() => setShowDelPeriode(false)}>Annuler</button>
                <button className="btn btn-danger" disabled={delPreview.length===0} onClick={deleteParPeriode}>
                  Supprimer {delPreview.length > 0 ? `(${delPreview.length})` : ''}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modale suppression par période */}
      {showDelPeriode && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,.6)', zIndex:9000, display:'flex', alignItems:'center', justifyContent:'center', padding:'1rem', backdropFilter:'blur(2px)' }}
          onClick={e => e.target===e.currentTarget && setShowDelPeriode(false)}>
          <div style={{ background:'var(--surface)', borderRadius:12, width:460, maxHeight:'80vh', display:'flex', flexDirection:'column', boxShadow:'0 8px 32px rgba(0,0,0,.25)', overflow:'hidden', outline:'none' }}>
            <div style={{ padding:'1rem 1.25rem', borderBottom:'1px solid var(--border)', background:'var(--surface2)', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
              <div style={{ fontWeight:700, fontSize:'.95rem' }}>🗑️ Supprimer des fiches — {cls?.name}</div>
              <button onClick={() => setShowDelPeriode(false)} style={{ background:'none', border:'none', cursor:'pointer', fontSize:'1.3rem', color:'var(--text3)' }}>×</button>
            </div>
            <div style={{ padding:'1.25rem', display:'flex', flexDirection:'column', gap:'.875rem' }}>
              <div style={{ display:'flex', flexDirection:'column', gap:'.5rem' }}>
                <label style={{ fontSize:'.72rem', fontWeight:700, color:'var(--text2)', textTransform:'uppercase', letterSpacing:'.07em' }}>Période</label>
                <div style={{ display:'flex', gap:'.4rem' }}>
                  {[{id:'jour',label:"Aujourd'hui"},{id:'semaine',label:'Cette semaine'},{id:'mois',label:'Ce mois'},{id:'tout',label:'Tout'}].map(p => (
                    <button key={p.id} onClick={() => { setDelPeriode(p.id); setDelPreview(getFichesParPeriode(p.id)); }}
                      style={{ flex:1, padding:'.45rem .3rem', borderRadius:'var(--r-s)', border:`1.5px solid ${delPeriode===p.id ? 'var(--danger)' : 'var(--border)'}`, background: delPeriode===p.id ? 'rgba(220,38,38,.08)' : 'var(--surface)', color: delPeriode===p.id ? 'var(--danger)' : 'var(--text2)', fontFamily:'Roboto,sans-serif', fontSize:'.75rem', fontWeight: delPeriode===p.id ? 700 : 500, cursor:'pointer', transition:'all .13s' }}>
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>
              <div style={{ border:'1px solid var(--border)', borderRadius:'var(--r-s)', overflow:'hidden' }}>
                <div style={{ padding:'.5rem .875rem', background:'var(--surface2)', fontSize:'.72rem', fontWeight:700, color:'var(--text2)', borderBottom:'1px solid var(--border)' }}>
                  {delPreview.length} fiche{delPreview.length>1?'s':''} concern{delPreview.length>1?'ées':'ée'}
                </div>
                <div style={{ maxHeight:200, overflowY:'auto' }}>
                  {delPreview.length === 0 ? (
                    <div style={{ padding:'1rem', textAlign:'center', color:'var(--text3)', fontSize:'.82rem', fontStyle:'italic' }}>Aucune fiche sur cette période</div>
                  ) : delPreview.map(f => (
                    <div key={f.id} style={{ display:'flex', alignItems:'center', gap:'.65rem', padding:'.42rem .875rem', borderBottom:'1px solid var(--border)', fontSize:'.8rem' }}>
                      <div style={{ flex:1 }}>
                        <div style={{ fontWeight:600, color:'var(--text)' }}>{f.titre}</div>
                        <div style={{ fontSize:'.7rem', color:'var(--text3)' }}>{f.date && new Date(f.date+'T12:00').toLocaleDateString('fr-FR',{weekday:'short',day:'numeric',month:'short'})}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              {delPreview.length > 0 && (
                <div style={{ padding:'.6rem .875rem', background:'rgba(220,38,38,.06)', border:'1px solid rgba(220,38,38,.2)', borderRadius:'var(--r-s)', fontSize:'.78rem', color:'var(--danger)' }}>
                  ⚠️ Action irréversible. {delPreview.length} fiche{delPreview.length>1?'s':''} ser{delPreview.length>1?'ont':'a'} définitivement supprimée{delPreview.length>1?'s':''}.
                </div>
              )}
              <div style={{ display:'flex', gap:'.5rem', justifyContent:'flex-end' }}>
                <button className="btn" onClick={() => setShowDelPeriode(false)}>Annuler</button>
                <button className="btn btn-danger" disabled={delPreview.length===0} onClick={deleteParPeriode}>
                  Supprimer {delPreview.length > 0 ? `(${delPreview.length})` : ''}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

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
