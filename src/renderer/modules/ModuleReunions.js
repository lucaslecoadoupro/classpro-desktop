/* ═══════════════════════════════════════════════════════════════════════════
   ModuleReunions.js — Réunions & Rencontres parents
   ClassPro Desktop
   ═══════════════════════════════════════════════════════════════════════════ */

// ── ModuleReunions ───────────────────────────────────────────────────────────
function ModuleReunions({ cpData, onDataChange, pushToast }) {
  const reunions   = cpData?.reunions   || [];
  const rencontres = cpData?.rencontres || [];
  const classes    = cpData?.classes    || [];

  const [tab,        setTab]        = useState('reunions');   // 'reunions' | 'rencontres'
  const [showForm,   setShowForm]   = useState(false);
  const [editItem,   setEditItem]   = useState(null);         // item en cours d'édition
  const [selItem,    setSelItem]    = useState(null);         // item dans le panneau détail
  const [search,     setSearch]     = useState('');

  // ── Formulaire réunion ─────────────────────────────────────────────────────
  const emptyReunion = { titre: '', date: '', heure: '', lieu: '', ordreJour: '', compteRendu: '', participants: '', classIds: [] };
  const emptyRencontre = { eleveName: '', parentName: '', classId: '', date: '', heure: '', lieu: '', motif: '', compteRendu: '', suivi: '' };

  const [form, setForm] = useState(emptyReunion);
  const setF = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const isReunion = tab === 'reunions';
  const items     = isReunion ? reunions : rencontres;
  const filtered  = items.filter(item => {
    const q = search.toLowerCase();
    if (isReunion) return (item.titre || '').toLowerCase().includes(q) || (item.lieu || '').toLowerCase().includes(q);
    return (item.eleveName || '').toLowerCase().includes(q) || (item.parentName || '').toLowerCase().includes(q);
  });

  // ── Ouvrir formulaire création / édition ────────────────────────────────
  const openNew = () => {
    setEditItem(null);
    setForm(isReunion ? { ...emptyReunion } : { ...emptyRencontre });
    setShowForm(true);
  };

  const openEdit = (item) => {
    setEditItem(item);
    setForm({ ...item });
    setShowForm(true);
    setSelItem(null);
  };

  // ── Sauvegarder ──────────────────────────────────────────────────────────
  const handleSave = () => {
    if (isReunion) {
      if (!form.titre?.trim()) { pushToast('Le titre est obligatoire.', 'error'); return; }
      if (!form.date)          { pushToast('La date est obligatoire.', 'error'); return; }
      const next = editItem
        ? reunions.map(r => r.id === editItem.id ? { ...form, id: editItem.id } : r)
        : [...reunions, { ...form, id: 'reu' + Date.now() }];
      onDataChange('cdc-reunions', next);
      pushToast(editItem ? 'Réunion mise à jour.' : 'Réunion créée.', 'success');
    } else {
      if (!form.eleveName?.trim()) { pushToast("Le nom de l'élève est obligatoire.", 'error'); return; }
      if (!form.date)              { pushToast('La date est obligatoire.', 'error'); return; }
      const next = editItem
        ? rencontres.map(r => r.id === editItem.id ? { ...form, id: editItem.id } : r)
        : [...rencontres, { ...form, id: 'ren' + Date.now() }];
      onDataChange('cdc-rencontres', next);
      pushToast(editItem ? 'Rencontre mise à jour.' : 'Rencontre créée.', 'success');
    }
    setShowForm(false);
    setEditItem(null);
  };

  // ── Supprimer ─────────────────────────────────────────────────────────────
  const handleDelete = (item) => {
    if (!confirm('Supprimer cet élément ?')) return;
    if (isReunion) {
      onDataChange('cdc-reunions', reunions.filter(r => r.id !== item.id));
    } else {
      onDataChange('cdc-rencontres', rencontres.filter(r => r.id !== item.id));
    }
    if (selItem?.id === item.id) setSelItem(null);
    pushToast('Supprimé.', 'success');
  };

  // ── Stats header ─────────────────────────────────────────────────────────
  const statsR = {
    total: reunions.length,
    avenir: reunions.filter(r => r.date && new Date(r.date + 'T12:00') >= new Date()).length,
    avecCR: reunions.filter(r => r.compteRendu?.trim()).length,
  };
  const statsRen = {
    total: rencontres.length,
    avenir: rencontres.filter(r => r.date && new Date(r.date + 'T12:00') >= new Date()).length,
    avecSuivi: rencontres.filter(r => r.suivi?.trim()).length,
  };

  const cls = (id) => classes.find(c => c.id === id);

  return (
    <>
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="page-hd">
        <div>
          <div className="phd-badge">🤝 Réunions & Rencontres</div>
          <div className="phd-title">{isReunion ? 'Réunions institutionnelles' : 'Rencontres parents-profs'}</div>
          <div className="phd-sub">
            {isReunion
              ? `${statsR.total} réunion(s) · ${statsR.avenir} à venir · ${statsR.avecCR} avec compte-rendu`
              : `${statsRen.total} rencontre(s) · ${statsRen.avenir} à venir · ${statsRen.avecSuivi} avec suivi`}
          </div>
        </div>
        <div className="phd-actions">
          <button className="btn btn-ghost" onClick={openNew}>
            ＋ {isReunion ? 'Nouvelle réunion' : 'Nouvelle rencontre'}
          </button>
        </div>

        {/* Stats */}
        {isReunion ? (
          <div className="phd-stats">
            <div className="phstat"><div className="phstat-label">Total</div><div className="phstat-value">{statsR.total}</div></div>
            <div className="phstat"><div className="phstat-label">À venir</div><div className="phstat-value">{statsR.avenir}</div></div>
            <div className="phstat"><div className="phstat-label">Avec C.R.</div><div className="phstat-value">{statsR.avecCR}</div></div>
          </div>
        ) : (
          <div className="phd-stats">
            <div className="phstat"><div className="phstat-label">Total</div><div className="phstat-value">{statsRen.total}</div></div>
            <div className="phstat"><div className="phstat-label">À venir</div><div className="phstat-value">{statsRen.avenir}</div></div>
            <div className="phstat"><div className="phstat-label">Avec suivi</div><div className="phstat-value">{statsRen.avecSuivi}</div></div>
          </div>
        )}
      </div>

      {/* ── Content ──────────────────────────────────────────────────────────── */}
      <div className="page-content" style={{ paddingTop: '.875rem' }}>

        {/* Tabs + search */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '.75rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
          <div className="seg">
            <button className={tab === 'reunions' ? 'on' : ''} onClick={() => { setTab('reunions'); setSelItem(null); setSearch(''); }}>
              🏫 Réunions ({reunions.length})
            </button>
            <button className={tab === 'rencontres' ? 'on' : ''} onClick={() => { setTab('rencontres'); setSelItem(null); setSearch(''); }}>
              👨‍👩‍👧 Rencontres ({rencontres.length})
            </button>
          </div>
          <input
            className="search"
            type="text"
            placeholder="🔍 Rechercher…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ marginLeft: 'auto', width: 220 }}
          />
        </div>

        {/* Liste vide */}
        {filtered.length === 0 && (
          <div className="empty">
            <div className="empty-icon">{isReunion ? '🏫' : '👨‍👩‍👧'}</div>
            <div>{search ? 'Aucun résultat pour cette recherche.' : `Aucune ${isReunion ? 'réunion' : 'rencontre'} enregistrée.`}</div>
            {!search && (
              <button className="btn btn-primary" style={{ marginTop: '.75rem' }} onClick={openNew}>
                ＋ {isReunion ? 'Créer une réunion' : 'Créer une rencontre'}
              </button>
            )}
          </div>
        )}

        {/* Liste principale + panneau détail */}
        {filtered.length > 0 && (
          <div style={{ display: 'grid', gridTemplateColumns: selItem ? '1fr 340px' : '1fr', gap: '1rem', alignItems: 'start' }}>

            {/* Liste */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '.5rem' }}>
              {[...filtered].sort((a, b) => (b.date || '').localeCompare(a.date || '')).map(item => {
                const past = item.date && new Date(item.date + 'T12:00') < new Date();
                const sel  = selItem?.id === item.id;
                return (
                  <div
                    key={item.id}
                    onClick={() => setSelItem(sel ? null : item)}
                    style={{
                      padding: '.75rem 1rem',
                      borderRadius: 'var(--r-s)',
                      border: `1.5px solid ${sel ? 'var(--accent)' : 'var(--border)'}`,
                      background: sel ? 'rgba(59,91,219,.06)' : 'var(--surface)',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '.75rem',
                      transition: 'all .13s',
                    }}
                  >
                    <div style={{ fontSize: '1.4rem', flexShrink: 0 }}>{isReunion ? '🏫' : '👨‍👩‍👧'}</div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      {isReunion ? (
                        <>
                          <div style={{ fontWeight: 700, fontSize: '.88rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {item.titre || 'Sans titre'}
                          </div>
                          <div style={{ fontSize: '.75rem', color: 'var(--text2)', marginTop: '.15rem' }}>
                            {item.date ? fmtDate(item.date).split('à')[0].trim() : '—'}
                            {item.heure ? ` · ${item.heure}` : ''}
                            {item.lieu ? ` · ${item.lieu}` : ''}
                          </div>
                        </>
                      ) : (
                        <>
                          <div style={{ fontWeight: 700, fontSize: '.88rem' }}>
                            {item.eleveName || 'Élève inconnu'}
                            {item.parentName ? <span style={{ fontWeight: 400, color: 'var(--text2)' }}> · {item.parentName}</span> : ''}
                          </div>
                          <div style={{ fontSize: '.75rem', color: 'var(--text2)', marginTop: '.15rem' }}>
                            {item.date ? fmtDate(item.date).split('à')[0].trim() : '—'}
                            {item.heure ? ` · ${item.heure}` : ''}
                            {item.classId ? ` · ${cls(item.classId)?.name || item.classId}` : ''}
                          </div>
                        </>
                      )}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '.38rem', flexShrink: 0 }}>
                      {past
                        ? <span style={{ fontSize: '.65rem', fontWeight: 700, padding: '.15rem .5rem', borderRadius: 99, background: 'var(--surface2)', color: 'var(--text3)', border: '1px solid var(--border)' }}>Passé</span>
                        : <span style={{ fontSize: '.65rem', fontWeight: 700, padding: '.15rem .5rem', borderRadius: 99, background: 'rgba(34,197,94,.12)', color: '#16a34a', border: '1px solid rgba(34,197,94,.25)' }}>À venir</span>
                      }
                      {(isReunion ? item.compteRendu : item.suivi)?.trim() &&
                        <span style={{ fontSize: '.65rem', fontWeight: 700, padding: '.15rem .5rem', borderRadius: 99, background: 'rgba(59,91,219,.1)', color: 'var(--accent)', border: '1px solid rgba(59,91,219,.2)' }}>C.R.</span>
                      }
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Panneau détail */}
            {selItem && (
              <div style={{ background: 'var(--surface)', border: '1.5px solid var(--border)', borderRadius: 'var(--r)', padding: '1.25rem', position: 'sticky', top: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                  <div style={{ fontWeight: 700, fontSize: '.95rem' }}>
                    {isReunion ? selItem.titre || 'Sans titre' : selItem.eleveName || 'Élève inconnu'}
                  </div>
                  <button onClick={() => setSelItem(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.1rem', color: 'var(--text3)', padding: '2px 6px' }}>×</button>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '.6rem', fontSize: '.82rem' }}>
                  {[
                    isReunion
                      ? [
                          ['Date', selItem.date ? fmtDate(selItem.date).split('à')[0].trim() : '—'],
                          ['Heure', selItem.heure || '—'],
                          ['Lieu', selItem.lieu || '—'],
                          ['Participants', selItem.participants || '—'],
                          ['Ordre du jour', selItem.ordreJour || '—'],
                          ['Compte-rendu', selItem.compteRendu || '—'],
                        ]
                      : [
                          ['Élève', selItem.eleveName || '—'],
                          ['Parent / Tuteur', selItem.parentName || '—'],
                          ['Classe', selItem.classId ? (cls(selItem.classId)?.name || selItem.classId) : '—'],
                          ['Date', selItem.date ? fmtDate(selItem.date).split('à')[0].trim() : '—'],
                          ['Heure', selItem.heure || '—'],
                          ['Lieu', selItem.lieu || '—'],
                          ['Motif', selItem.motif || '—'],
                          ['Compte-rendu', selItem.compteRendu || '—'],
                          ['Suivi / Actions', selItem.suivi || '—'],
                        ]
                  ][0].map(([label, val]) => (
                    <div key={label}>
                      <div style={{ fontSize: '.65rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.07em', color: 'var(--text3)', marginBottom: '.18rem' }}>{label}</div>
                      <div style={{ color: val === '—' ? 'var(--text3)' : 'var(--text)', lineHeight: 1.5, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{val}</div>
                    </div>
                  ))}
                </div>

                <div style={{ display: 'flex', gap: '.5rem', marginTop: '1.25rem' }}>
                  <button className="btn btn-primary btn-sm" style={{ flex: 1 }} onClick={() => openEdit(selItem)}>✏️ Modifier</button>
                  <button className="btn btn-danger btn-sm" onClick={() => handleDelete(selItem)}>🗑️</button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Modale formulaire ────────────────────────────────────────────────── */}
      {showForm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.55)', zIndex: 9998, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}
          onClick={e => e.target === e.currentTarget && setShowForm(false)}>
          <div style={{ background: 'var(--surface)', borderRadius: 16, width: 520, maxHeight: '88vh', overflowY: 'auto', boxShadow: '0 24px 64px rgba(0,0,0,.3)' }}>

            {/* Header modale */}
            <div style={{ background: 'linear-gradient(135deg,#1e3a8a,#3b5bdb)', padding: '1.25rem 1.5rem', position: 'relative', borderRadius: '16px 16px 0 0' }}>
              <button onClick={() => setShowForm(false)} style={{ position: 'absolute', top: '.875rem', right: '1rem', width: 28, height: 28, borderRadius: 7, background: 'rgba(255,255,255,.15)', border: 'none', cursor: 'pointer', color: '#fff', fontSize: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>×</button>
              <div style={{ fontSize: '1.5rem', marginBottom: '.35rem' }}>{isReunion ? '🏫' : '👨‍👩‍👧'}</div>
              <div style={{ fontWeight: 800, fontSize: '1rem', color: '#fff', fontFamily: 'Roboto Slab, serif' }}>
                {editItem ? 'Modifier' : 'Nouvelle'} {isReunion ? 'réunion' : 'rencontre'}
              </div>
            </div>

            {/* Champs */}
            <div style={{ padding: '1.25rem 1.5rem', display: 'flex', flexDirection: 'column', gap: '.875rem' }}>
              {isReunion ? (
                <>
                  <Field label="Titre *" value={form.titre} onChange={v => setF('titre', v)} placeholder="Ex : Réunion de rentrée, Conseil de classe T1…" />
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '.75rem' }}>
                    <Field label="Date *" type="date" value={form.date} onChange={v => setF('date', v)} />
                    <Field label="Heure" value={form.heure} onChange={v => setF('heure', v)} placeholder="Ex : 17h30" />
                  </div>
                  <Field label="Lieu" value={form.lieu} onChange={v => setF('lieu', v)} placeholder="Ex : Salle des professeurs, B12…" />
                  <Field label="Participants" value={form.participants} onChange={v => setF('participants', v)} placeholder="Ex : Équipe pédagogique 3ème A, CPE…" />
                  <Field label="Ordre du jour" textarea value={form.ordreJour} onChange={v => setF('ordreJour', v)} placeholder="Points abordés lors de la réunion…" rows={3} />
                  <Field label="Compte-rendu" textarea value={form.compteRendu} onChange={v => setF('compteRendu', v)} placeholder="Notes, décisions prises, actions à mener…" rows={4} />
                </>
              ) : (
                <>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '.75rem' }}>
                    <Field label="Élève *" value={form.eleveName} onChange={v => setF('eleveName', v)} placeholder="Prénom Nom" />
                    <Field label="Parent / Tuteur" value={form.parentName} onChange={v => setF('parentName', v)} placeholder="Prénom Nom" />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '.3rem' }}>
                    <label style={{ fontSize: '.72rem', fontWeight: 700, color: 'var(--text2)', textTransform: 'uppercase', letterSpacing: '.06em' }}>Classe</label>
                    <select value={form.classId || ''} onChange={e => setF('classId', e.target.value)}
                      style={{ padding: '.5rem .75rem', borderRadius: 'var(--r-xs)', border: '1.5px solid var(--border)', background: 'var(--surface2)', color: 'var(--text)', fontSize: '.83rem', fontFamily: 'Roboto, sans-serif' }}>
                      <option value="">— Aucune classe —</option>
                      {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '.75rem' }}>
                    <Field label="Date *" type="date" value={form.date} onChange={v => setF('date', v)} />
                    <Field label="Heure" value={form.heure} onChange={v => setF('heure', v)} placeholder="Ex : 17h00" />
                  </div>
                  <Field label="Lieu" value={form.lieu} onChange={v => setF('lieu', v)} placeholder="Ex : Bureau du CPE, salle 12…" />
                  <Field label="Motif / Objet" value={form.motif} onChange={v => setF('motif', v)} placeholder="Ex : Difficultés scolaires, orientation, comportement…" />
                  <Field label="Compte-rendu" textarea value={form.compteRendu} onChange={v => setF('compteRendu', v)} placeholder="Résumé de l'entretien…" rows={3} />
                  <Field label="Suivi / Actions à mener" textarea value={form.suivi} onChange={v => setF('suivi', v)} placeholder="Décisions prises, points de vigilance, relances…" rows={3} />
                </>
              )}
            </div>

            {/* Footer modale */}
            <div style={{ padding: '.875rem 1.5rem', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'flex-end', gap: '.5rem' }}>
              <button className="btn btn-sm" onClick={() => setShowForm(false)}>Annuler</button>
              <button className="btn btn-primary btn-sm" onClick={handleSave}>
                {editItem ? '💾 Enregistrer' : '＋ Créer'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// ── Petit composant champ de formulaire ──────────────────────────────────────
function Field({ label, value, onChange, placeholder = '', type = 'text', textarea = false, rows = 2 }) {
  const style = {
    padding: '.5rem .75rem',
    borderRadius: 'var(--r-xs)',
    border: '1.5px solid var(--border)',
    background: 'var(--surface2)',
    color: 'var(--text)',
    fontSize: '.83rem',
    fontFamily: 'Roboto, sans-serif',
    width: '100%',
    boxSizing: 'border-box',
    resize: textarea ? 'vertical' : undefined,
  };
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '.3rem' }}>
      <label style={{ fontSize: '.72rem', fontWeight: 700, color: 'var(--text2)', textTransform: 'uppercase', letterSpacing: '.06em' }}>{label}</label>
      {textarea
        ? <textarea value={value || ''} onChange={e => onChange(e.target.value)} placeholder={placeholder} rows={rows} style={style} />
        : <input type={type} value={value || ''} onChange={e => onChange(e.target.value)} placeholder={placeholder} style={style} />
      }
    </div>
  );
}
