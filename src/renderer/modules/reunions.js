// ── MODULE RÉUNIONS ────────────────────────────────────────────────────────────

const REUNION_TYPES = [
  { id: 'famille',      icon: '👨‍👩‍👧', label: 'Réunion famille',       color: '#3b82f6' },
  { id: 'pedagogique',  icon: '📚', label: 'Réunion pédagogique',   color: '#8b5cf6' },
  { id: 'equipe',       icon: '👥', label: "Réunion d'équipe",       color: '#06b6d4' },
  { id: 'conseil-ped',  icon: '🏫', label: 'Conseil pédagogique',   color: '#f59e0b' },
  { id: 'commission',   icon: '⚖️', label: 'Commission éducative',  color: '#f97316' },
  { id: 'discipline',   icon: '🔴', label: 'Conseil de discipline',  color: '#ef4444' },
  { id: 'ca',           icon: '🏛️', label: "Conseil d'administration", color: '#10b981' },
];

const CHAMPS_COMMUNS = [
  { id: 'date',        label: 'Date',          type: 'date',     required: true  },
  { id: 'heure',       label: 'Heure',         type: 'time',     required: false },
  { id: 'lieu',        label: 'Lieu / Salle',  type: 'text',     required: false },
  { id: 'ordre_jour',  label: "Ordre du jour", type: 'textarea', required: true  },
  { id: 'participants',label: 'Participants',   type: 'textarea', required: false },
  { id: 'cr',          label: 'Compte-rendu / Décisions', type: 'textarea', required: false },
  { id: 'suivi',       label: 'Points de suivi / Actions', type: 'textarea', required: false },
  { id: 'docs',        label: 'Documents / Pièces jointes', type: 'textarea', required: false },
];

const CHAMPS_SPECIFIQUES = {
  famille: [
    { id: 'eleve',    label: 'Élève concerné(e)',        type: 'text'     },
    { id: 'motif',    label: 'Motif de convocation',      type: 'textarea' },
    { id: 'decisions',label: 'Décisions prises',          type: 'textarea' },
    { id: 'suivi_el', label: 'Suivi prévu pour cet élève',type: 'textarea' },
  ],
  pedagogique: [
    { id: 'discipline', label: 'Discipline(s) concernée(s)', type: 'text'     },
    { id: 'objectifs',  label: 'Objectifs de la réunion',    type: 'textarea' },
    { id: 'dec_ped',    label: 'Décisions pédagogiques',     type: 'textarea' },
    { id: 'repartition',label: 'Répartition séquences/thèmes', type: 'textarea' },
  ],
  equipe: [
    { id: 'niveaux',    label: 'Niveau(x) concerné(s)',     type: 'text'     },
    { id: 'thematique', label: 'Thématique',                type: 'text'     },
    { id: 'actions',    label: 'Actions / Responsable / Échéance', type: 'textarea' },
  ],
  'conseil-ped': [
    { id: 'odj_chef',  label: "Ordre du jour (chef d'établissement)", type: 'textarea' },
    { id: 'discussion',label: 'Discussion des points',               type: 'textarea' },
    { id: 'votes',     label: 'Votes (pour / contre / abstention)',  type: 'textarea' },
    { id: 'qdiv',      label: 'Questions diverses',                  type: 'textarea' },
  ],
  commission: [
    { id: 'eleve',    label: 'Élève concerné(e)',          type: 'text'     },
    { id: 'mesures',  label: 'Mesures envisagées',         type: 'textarea' },
    { id: 'engagement',label: "Engagement de l'élève",    type: 'textarea' },
    { id: 'decision', label: 'Décision finale',            type: 'textarea' },
  ],
  discipline: [
    { id: 'eleve',     label: 'Élève concerné(e)',         type: 'text'     },
    { id: 'faits',     label: 'Faits reprochés',           type: 'textarea' },
    { id: 'sanctions', label: 'Sanctions proposées',       type: 'textarea' },
    { id: 'decision',  label: 'Décision finale',           type: 'textarea' },
  ],
  ca: [
    { id: 'quorum',     label: 'Quorum (présents / total)', type: 'text'     },
    { id: 'resolutions',label: 'Résolutions adoptées',     type: 'textarea' },
    { id: 'votes',      label: 'Résultats des votes',      type: 'textarea' },
  ],
};

function makeEmptyReunion(type) {
  const champs = {};
  CHAMPS_COMMUNS.forEach(c => { champs[c.id] = ''; });
  (CHAMPS_SPECIFIQUES[type] || []).forEach(c => { champs[c.id] = ''; });
  return {
    id: 'reun-' + Date.now() + Math.random().toString(36).slice(2),
    type,
    titre: '',
    createdAt: new Date().toISOString(),
    champs,
  };
}

function typeInfo(typeId) {
  return REUNION_TYPES.find(t => t.id === typeId) || REUNION_TYPES[0];
}

function fmtDateReun(iso) {
  if (!iso) return '—';
  return new Date(iso + 'T12:00').toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'long', year: 'numeric' });
}

// ── Composant champ éditable ──────────────────────────────────────────────────
function ChampReunion({ champ, value, onChange }) {
  const base = {
    width: '100%', padding: '.6rem .875rem',
    border: '1.5px solid var(--border)', borderRadius: 'var(--r-s)',
    background: 'var(--surface2)', color: 'var(--text)',
    fontFamily: 'Roboto, sans-serif', fontSize: '.86rem', outline: 'none',
    transition: 'border-color .15s', boxSizing: 'border-box',
  };
  const focus = e => e.target.style.borderColor = 'var(--accent)';
  const blur  = e => e.target.style.borderColor = 'var(--border)';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '.28rem', marginBottom: '.75rem' }}>
      <label style={{ fontSize: '.7rem', fontWeight: 700, color: 'var(--text2)', textTransform: 'uppercase', letterSpacing: '.07em' }}>
        {champ.label}
      </label>
      {champ.type === 'textarea' ? (
        <textarea value={value} onChange={e => onChange(champ.id, e.target.value)}
          rows={4} onFocus={focus} onBlur={blur}
          style={{ ...base, resize: 'vertical', minHeight: 80, lineHeight: 1.6 }} />
      ) : (
        <input type={champ.type} value={value} onChange={e => onChange(champ.id, e.target.value)}
          onFocus={focus} onBlur={blur} style={base} />
      )}
    </div>
  );
}

// ── MODULE PRINCIPAL ──────────────────────────────────────────────────────────
function ModuleReunions({ cpData, onDataChange, pushToast }) {
  const reunions = useMemo(() => cpData?.reunions || [], [cpData?.reunions]);

  const [vue, setVue] = useState('liste');        // 'liste' | 'new' | 'edit' | 'detail'
  const [selId, setSelId] = useState(null);
  const [selType, setSelType] = useState(null);   // pour la création
  const [draft, setDraft] = useState(null);
  const [search, setSearch] = useState('');
  const [filtreType, setFiltreType] = useState('');

  const save = (newList) => onDataChange('cdc-reunions', newList);

  const startNew = (typeId) => {
    const r = makeEmptyReunion(typeId);
    setDraft(r);
    setVue('edit');
    setSelId(r.id);
  };

  const startEdit = (r) => {
    setDraft({ ...r, champs: { ...r.champs } });
    setSelId(r.id);
    setVue('edit');
  };

  const saveDraft = () => {
    if (!draft) return;
    if (!draft.titre.trim()) { if (pushToast) pushToast('Le titre est obligatoire.', 'error'); return; }
    const exists = reunions.find(r => r.id === draft.id);
    const newList = exists
      ? reunions.map(r => r.id === draft.id ? draft : r)
      : [...reunions, draft];
    save(newList);
    if (pushToast) pushToast('Réunion sauvegardée !', 'success');
    setVue('detail');
    cpdUnlockBadge && cpdUnlockBadge('first_reunion');
  };

  const deleteReunion = (id) => {
    if (!window.confirm('Supprimer cette réunion ?')) return;
    save(reunions.filter(r => r.id !== id));
    setVue('liste');
    setSelId(null);
    if (pushToast) pushToast('Réunion supprimée.', 'info');
  };

  const updateChamp = (champId, val) => {
    setDraft(d => ({ ...d, champs: { ...d.champs, [champId]: val } }));
  };

  const reunionActive = reunions.find(r => r.id === selId) || null;
  const draftType = draft ? typeInfo(draft.type) : null;

  const reunionsFiltrees = useMemo(() => {
    return reunions
      .filter(r => !filtreType || r.type === filtreType)
      .filter(r => !search || r.titre.toLowerCase().includes(search.toLowerCase()) ||
        r.champs?.ordre_jour?.toLowerCase().includes(search.toLowerCase()))
      .slice().sort((a, b) => (b.champs?.date || b.createdAt) > (a.champs?.date || a.createdAt) ? 1 : -1);
  }, [reunions, filtreType, search]);

  if (!cpData) return <ModulePlaceholder icon="🤝" title="Réunions" sub="Ouvrez d'abord un fichier ClassPro." />;

  // ── Vue : choisir un type ─────────────────────────────────────────────────
  if (vue === 'new') return (
    <>
      <div className="page-hd">
        <div>
          <div className="phd-badge">🤝 Réunions</div>
          <div className="phd-title">Nouvelle réunion</div>
          <div className="phd-sub">Choisissez le type de réunion</div>
        </div>
        <div className="phd-actions">
          <button className="btn" onClick={() => setVue('liste')}>← Retour</button>
        </div>
      </div>
      <div className="page-content">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '1rem', maxWidth: 900 }}>
          {REUNION_TYPES.map(t => (
            <button key={t.id} onClick={() => startNew(t.id)}
              style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1.25rem', border: `1.5px solid ${t.color}33`, borderRadius: 14, background: `${t.color}08`, cursor: 'pointer', textAlign: 'left', fontFamily: 'Roboto, sans-serif', transition: 'all .15s' }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = t.color; e.currentTarget.style.background = `${t.color}15`; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = `${t.color}33`; e.currentTarget.style.background = `${t.color}08`; }}>
              <div style={{ width: 48, height: 48, borderRadius: 12, background: `${t.color}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.4rem', flexShrink: 0 }}>
                {t.icon}
              </div>
              <div>
                <div style={{ fontWeight: 700, fontSize: '.92rem', color: 'var(--text)', marginBottom: '.25rem' }}>{t.label}</div>
                <div style={{ fontSize: '.72rem', color: 'var(--text3)' }}>{(CHAMPS_SPECIFIQUES[t.id] || []).length} champs spécifiques</div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </>
  );

  // ── Vue : édition ─────────────────────────────────────────────────────────
  if (vue === 'edit' && draft) {
    const specifiques = CHAMPS_SPECIFIQUES[draft.type] || [];
    return (
      <>
        <div className="page-hd">
          <div>
            <div className="phd-badge" style={{ background: draftType?.color + '22', color: draftType?.color }}>
              {draftType?.icon} {draftType?.label}
            </div>
            <div className="phd-title">{draft.id && reunions.find(r => r.id === draft.id) ? 'Modifier la réunion' : 'Nouvelle réunion'}</div>
            <div className="phd-sub">{draft.champs?.date ? fmtDateReun(draft.champs.date) : 'Date non définie'}</div>
          </div>
          <div className="phd-actions">
            <button className="btn" onClick={() => setVue(reunions.find(r => r.id === draft.id) ? 'detail' : 'liste')}>Annuler</button>
            <button className="btn btn-primary" onClick={saveDraft}>💾 Sauvegarder</button>
          </div>
        </div>
        <div className="page-content">
          <div style={{ maxWidth: 700 }}>
            {/* Titre */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '.28rem', marginBottom: '1.25rem' }}>
              <label style={{ fontSize: '.7rem', fontWeight: 700, color: 'var(--text2)', textTransform: 'uppercase', letterSpacing: '.07em' }}>Titre de la réunion *</label>
              <input value={draft.titre} onChange={e => setDraft(d => ({ ...d, titre: e.target.value }))}
                placeholder={`${draftType?.label} — `}
                style={{ width: '100%', padding: '.7rem .875rem', border: '1.5px solid var(--border)', borderRadius: 'var(--r-s)', background: 'var(--surface2)', color: 'var(--text)', fontFamily: 'Roboto, sans-serif', fontSize: '1rem', fontWeight: 600, outline: 'none', boxSizing: 'border-box' }}
                onFocus={e => e.target.style.borderColor = 'var(--accent)'}
                onBlur={e => e.target.style.borderColor = 'var(--border)'} />
            </div>

            {/* Champs communs */}
            <div style={{ padding: '.75rem 1rem', background: 'rgba(59,91,219,.05)', border: '1px solid rgba(59,91,219,.15)', borderRadius: 10, marginBottom: '1.25rem' }}>
              <div style={{ fontSize: '.65rem', fontWeight: 700, color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: '.75rem' }}>
                Informations générales
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 1rem' }}>
                {CHAMPS_COMMUNS.slice(0, 3).map(c => (
                  <ChampReunion key={c.id} champ={c} value={draft.champs[c.id] || ''} onChange={updateChamp} />
                ))}
              </div>
              {CHAMPS_COMMUNS.slice(3).map(c => (
                <ChampReunion key={c.id} champ={c} value={draft.champs[c.id] || ''} onChange={updateChamp} />
              ))}
            </div>

            {/* Champs spécifiques */}
            {specifiques.length > 0 && (
              <div style={{ padding: '.75rem 1rem', background: `${draftType?.color}08`, border: `1px solid ${draftType?.color}25`, borderRadius: 10 }}>
                <div style={{ fontSize: '.65rem', fontWeight: 700, color: draftType?.color, textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: '.75rem' }}>
                  {draftType?.icon} Champs spécifiques — {draftType?.label}
                </div>
                {specifiques.map(c => (
                  <ChampReunion key={c.id} champ={c} value={draft.champs[c.id] || ''} onChange={updateChamp} />
                ))}
              </div>
            )}
          </div>
        </div>
      </>
    );
  }

  // ── Vue : détail ──────────────────────────────────────────────────────────
  if (vue === 'detail' && reunionActive) {
    const type = typeInfo(reunionActive.type);
    const specifiques = CHAMPS_SPECIFIQUES[reunionActive.type] || [];
    const ChampDetail = ({ label, value }) => value?.trim() ? (
      <div style={{ marginBottom: '1rem' }}>
        <div style={{ fontSize: '.65rem', fontWeight: 700, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: '.35rem' }}>{label}</div>
        <div style={{ fontSize: '.88rem', color: 'var(--text)', lineHeight: 1.7, whiteSpace: 'pre-wrap', padding: '.65rem .875rem', background: 'var(--surface2)', borderRadius: 8, border: '1px solid var(--border)' }}>{value}</div>
      </div>
    ) : null;

    return (
      <>
        <div className="page-hd">
          <div>
            <div className="phd-badge" style={{ background: type.color + '22', color: type.color }}>{type.icon} {type.label}</div>
            <div className="phd-title">{reunionActive.titre || type.label}</div>
            <div className="phd-sub">
              {reunionActive.champs?.date ? fmtDateReun(reunionActive.champs.date) : '—'}
              {reunionActive.champs?.heure ? ` · ${reunionActive.champs.heure}` : ''}
              {reunionActive.champs?.lieu ? ` · ${reunionActive.champs.lieu}` : ''}
            </div>
          </div>
          <div className="phd-actions">
            <button className="btn" onClick={() => setVue('liste')}>← Retour</button>
            <button className="btn btn-ghost" onClick={() => startEdit(reunionActive)}>✏️ Modifier</button>
            <button className="btn" style={{ color: 'var(--danger)', borderColor: 'var(--danger)' }}
              onClick={() => deleteReunion(reunionActive.id)}>🗑️ Supprimer</button>
          </div>
        </div>
        <div className="page-content">
          <div style={{ maxWidth: 700 }}>
            {/* Bloc méta */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '.5rem', marginBottom: '1.25rem' }}>
              {[
                ['📅 Date', fmtDateReun(reunionActive.champs?.date)],
                ['🕐 Heure', reunionActive.champs?.heure || '—'],
                ['📍 Lieu', reunionActive.champs?.lieu || '—'],
              ].map(([label, val]) => (
                <div key={label} style={{ padding: '.6rem .875rem', background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 10 }}>
                  <div style={{ fontSize: '.65rem', fontWeight: 700, color: 'var(--text3)', marginBottom: '.2rem' }}>{label}</div>
                  <div style={{ fontSize: '.88rem', fontWeight: 600, color: 'var(--text)' }}>{val}</div>
                </div>
              ))}
            </div>

            {/* Champs communs */}
            {CHAMPS_COMMUNS.slice(3).map(c => (
              <ChampDetail key={c.id} label={c.label} value={reunionActive.champs?.[c.id]} />
            ))}

            {/* Champs spécifiques */}
            {specifiques.length > 0 && (
              <div style={{ padding: '.75rem 1rem', background: `${type.color}06`, border: `1px solid ${type.color}25`, borderRadius: 10, marginTop: '.5rem' }}>
                <div style={{ fontSize: '.65rem', fontWeight: 700, color: type.color, textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: '.75rem' }}>
                  {type.icon} {type.label}
                </div>
                {specifiques.map(c => (
                  <ChampDetail key={c.id} label={c.label} value={reunionActive.champs?.[c.id]} />
                ))}
              </div>
            )}
          </div>
        </div>
      </>
    );
  }

  // ── Vue : liste ───────────────────────────────────────────────────────────
  return (
    <>
      <div className="page-hd">
        <div>
          <div className="phd-badge">🤝 Réunions</div>
          <div className="phd-title">Réunions</div>
          <div className="phd-sub">{reunions.length} réunion{reunions.length > 1 ? 's' : ''} enregistrée{reunions.length > 1 ? 's' : ''}</div>
        </div>
        <div className="phd-actions">
          <button className="btn btn-primary" onClick={() => setVue('new')}>+ Nouvelle réunion</button>
        </div>
      </div>
      <div className="page-content">
        {/* Filtres */}
        <div style={{ display: 'flex', gap: '.5rem', marginBottom: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <input placeholder="🔍 Rechercher…" value={search} onChange={e => setSearch(e.target.value)}
            style={{ padding: '.45rem .75rem', border: '1.5px solid var(--border)', borderRadius: 'var(--r-s)', background: 'var(--surface2)', color: 'var(--text)', fontFamily: 'Roboto, sans-serif', fontSize: '.82rem', outline: 'none', width: 200 }} />
          <select value={filtreType} onChange={e => setFiltreType(e.target.value)}
            style={{ padding: '.45rem .75rem', border: '1.5px solid var(--border)', borderRadius: 'var(--r-s)', background: 'var(--surface2)', color: 'var(--text)', fontFamily: 'Roboto, sans-serif', fontSize: '.82rem', outline: 'none' }}>
            <option value="">Tous les types</option>
            {REUNION_TYPES.map(t => <option key={t.id} value={t.id}>{t.icon} {t.label}</option>)}
          </select>
        </div>

        {reunionsFiltrees.length === 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '4rem', gap: '1rem', color: 'var(--text3)' }}>
            <div style={{ fontSize: '3rem', opacity: .15 }}>🤝</div>
            <div style={{ fontWeight: 700, color: 'var(--text2)' }}>{reunions.length === 0 ? 'Aucune réunion' : 'Aucun résultat'}</div>
            <div style={{ fontSize: '.83rem' }}>{reunions.length === 0 ? 'Créez votre première réunion avec le bouton ci-dessus.' : 'Modifiez vos filtres.'}</div>
            {reunions.length === 0 && (
              <button className="btn btn-primary" onClick={() => setVue('new')}>+ Nouvelle réunion</button>
            )}
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '.5rem' }}>
            {reunionsFiltrees.map(r => {
              const type = typeInfo(r.type);
              return (
                <div key={r.id}
                  onClick={() => { setSelId(r.id); setVue('detail'); }}
                  style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '.875rem 1.25rem', background: 'var(--surface)', border: '1.5px solid var(--border)', borderRadius: 12, cursor: 'pointer', transition: 'all .15s', borderLeft: `4px solid ${type.color}` }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = type.color; e.currentTarget.style.background = `${type.color}06`; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.background = 'var(--surface)'; e.currentTarget.style.borderLeftColor = type.color; }}>
                  <div style={{ width: 42, height: 42, borderRadius: 10, background: `${type.color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem', flexShrink: 0 }}>
                    {type.icon}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 700, fontSize: '.92rem', color: 'var(--text)', marginBottom: '.2rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {r.titre || type.label}
                    </div>
                    <div style={{ fontSize: '.75rem', color: 'var(--text3)', display: 'flex', gap: '.75rem', flexWrap: 'wrap' }}>
                      <span style={{ color: type.color, fontWeight: 600 }}>{type.label}</span>
                      {r.champs?.date && <span>📅 {fmtDateReun(r.champs.date)}</span>}
                      {r.champs?.lieu && <span>📍 {r.champs.lieu}</span>}
                    </div>
                  </div>
                  <div style={{ fontSize: '.75rem', color: 'var(--text3)', flexShrink: 0 }}>→</div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}
