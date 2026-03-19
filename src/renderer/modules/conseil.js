function ModuleConseil({ cpData }) {
  const bulletins = cpData?.bulletins || [];
  const [vue, setVue] = useState('recap');
  const [selEleve, setSelEleve] = useState(null);
  const [search, setSearch] = useState('');
  const [filtPole, setFiltPole] = useState('');

  if (!cpData || bulletins.length === 0) {
    return <ModulePlaceholder icon="🎓" title="Conseil de classe" sub="Aucun bulletin importé dans ce fichier ClassPro." soon={false} />;
  }

  const poles = useMemo(() => {
    const s = new Set();
    bulletins.forEach(b => (b.subjects || []).forEach(sub => { if (sub.pole) s.add(sub.pole); }));
    return [...s].sort();
  }, [bulletins]);

  const elevesFiltered = useMemo(() => bulletins.filter(b => !search || b.name?.toLowerCase().includes(search.toLowerCase())), [bulletins, search]);

  const allMatieres = useMemo(() => {
    const s = new Set();
    bulletins.forEach(b => (b.subjects || []).forEach(sub => { if (!filtPole || sub.pole === filtPole) s.add(sub.name); }));
    return [...s].sort();
  }, [bulletins, filtPole]);

  const colorMoy = (v) => {
    if (v === null || v === undefined || isNaN(v)) return 'var(--text3)';
    if (v >= 16) return 'var(--success)';
    if (v >= 12) return 'var(--accent)';
    if (v >= 10) return 'var(--warning)';
    return 'var(--danger)';
  };

  const diffBadge = (t2, t1) => {
    if (t1 == null || t2 == null || isNaN(t1) || isNaN(t2)) return null;
    const d = parseFloat((t2 - t1).toFixed(2));
    if (Math.abs(d) < 0.05) return <span style={{ fontSize: '.62rem', color: 'var(--text3)' }}>≈</span>;
    return <span style={{ fontSize: '.62rem', fontWeight: 700, color: d > 0 ? 'var(--success)' : 'var(--danger)' }}>{d > 0 ? '▲' : '▼'}{Math.abs(d).toFixed(1)}</span>;
  };

  const eleveActif = selEleve ? bulletins.find(b => b.id === selEleve) : null;
  const tabBtn = (id) => ({ padding: '.38rem .875rem', borderRadius: 'var(--r-s)', border: vue === id ? '1px solid var(--accent)' : '1px solid var(--border)', background: vue === id ? 'var(--accent)' : 'var(--surface)', color: vue === id ? '#fff' : 'var(--text2)', fontFamily: 'Roboto, sans-serif', fontSize: '.77rem', fontWeight: 600, cursor: 'pointer' });

  return (
    <>
      <div className="page-hd">
        <div>
          <div className="phd-badge">🎓 Conseil de classe</div>
          <div className="phd-title">{cpData.profile ? `${cpData.profile.classe || ''} · ${cpData.profile.annee || ''}` : 'Conseil de classe'}</div>
          <div className="phd-sub">{bulletins.length} élève(s) · Trimestre {bulletins[0]?.trimester || '?'} · Moy. classe {bulletins[0]?.generalAverageClass ?? '—'}/20</div>
        </div>
        <div className="phd-stats">
          {[
            { label: 'Moy. ≥ 16', value: bulletins.filter(b => b.generalAverage >= 16).length },
            { label: 'Moy. 12–16', value: bulletins.filter(b => b.generalAverage >= 12 && b.generalAverage < 16).length },
            { label: 'Moy. 10–12', value: bulletins.filter(b => b.generalAverage >= 10 && b.generalAverage < 12).length },
            { label: 'Moy. < 10', value: bulletins.filter(b => b.generalAverage < 10).length },
          ].map(s => (
            <div key={s.label} className="phstat">
              <div className="phstat-label">{s.label}</div>
              <div className="phstat-value">{s.value}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="page-content" style={{ paddingTop: '.75rem' }}>
        <div style={{ display: 'flex', gap: '.5rem', marginBottom: '.875rem', alignItems: 'center', flexWrap: 'wrap' }}>
          {[{ id: 'recap', label: '📊 Tableau récap' }, { id: 'eleve', label: '👤 Fiche élève' }, { id: 'matiere', label: '📚 Par matière' }].map(v => (
            <button key={v.id} style={tabBtn(v.id)} onClick={() => setVue(v.id)}>{v.label}</button>
          ))}
          <div style={{ flex: 1 }} />
          <input placeholder="🔍 Rechercher un élève…" value={search} onChange={e => setSearch(e.target.value)} style={{ ...inputStyle, width: 200, fontSize: '.78rem', padding: '.38rem .65rem' }} />
          {vue !== 'recap' && (
            <select value={filtPole} onChange={e => setFiltPole(e.target.value)} style={{ ...inputStyle, width: 160, fontSize: '.78rem', padding: '.38rem .65rem' }}>
              <option value="">Tous les pôles</option>
              {poles.map(p => <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>)}
            </select>
          )}
        </div>

        {vue === 'recap' && (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ borderCollapse: 'collapse', width: '100%', fontSize: '.78rem' }}>
              <thead>
                <tr style={{ background: 'var(--surface2)', position: 'sticky', top: 0 }}>
                  <th style={{ padding: '.5rem .875rem', textAlign: 'left', fontWeight: 700, color: 'var(--text2)', borderBottom: '2px solid var(--border)', minWidth: 180 }}>Élève</th>
                  <th style={{ padding: '.5rem .65rem', textAlign: 'center', fontWeight: 700, color: 'var(--text2)', borderBottom: '2px solid var(--border)', minWidth: 80 }}>Moy. T2</th>
                  <th style={{ padding: '.5rem .65rem', textAlign: 'center', fontWeight: 700, color: 'var(--text2)', borderBottom: '2px solid var(--border)', minWidth: 80 }}>Moy. T1</th>
                  <th style={{ padding: '.5rem .65rem', textAlign: 'center', fontWeight: 700, color: 'var(--text2)', borderBottom: '2px solid var(--border)', minWidth: 70 }}>Évol.</th>
                  <th style={{ padding: '.5rem .65rem', textAlign: 'center', fontWeight: 700, color: 'var(--text2)', borderBottom: '2px solid var(--border)', minWidth: 70 }}>Abs.</th>
                  <th style={{ padding: '.5rem .65rem', textAlign: 'center', fontWeight: 700, color: 'var(--text2)', borderBottom: '2px solid var(--border)', minWidth: 80 }}>Orientation</th>
                  <th style={{ padding: '.5rem .65rem', textAlign: 'left', fontWeight: 700, color: 'var(--text2)', borderBottom: '2px solid var(--border)' }}>Appréciation générale</th>
                </tr>
              </thead>
              <tbody>
                {elevesFiltered.map((b, i) => (
                  <tr key={b.id} style={{ background: i % 2 === 0 ? 'var(--surface)' : 'var(--surface2)', cursor: 'pointer' }} onClick={() => { setSelEleve(b.id); setVue('eleve'); }} onMouseEnter={e => e.currentTarget.style.background = 'rgba(59,91,219,.07)'} onMouseLeave={e => e.currentTarget.style.background = i % 2 === 0 ? 'var(--surface)' : 'var(--surface2)'}>
                    <td style={{ padding: '.42rem .875rem', borderBottom: '1px solid var(--border)', fontWeight: 600 }}>
                      {b.recompense === 'tf' && <span title="Tableau d'honneur" style={{ marginRight: '.3rem' }}>🏅</span>}
                      {b.recompense === 'mgtc' && <span title="Mention" style={{ marginRight: '.3rem' }}>⭐</span>}
                      {b.name}
                    </td>
                    <td style={{ padding: '.42rem .65rem', borderBottom: '1px solid var(--border)', textAlign: 'center', fontWeight: 800, color: colorMoy(b.generalAverage) }}>{b.generalAverage?.toFixed(2) ?? '—'}</td>
                    <td style={{ padding: '.42rem .65rem', borderBottom: '1px solid var(--border)', textAlign: 'center', color: 'var(--text2)' }}>{b.generalAverageT1?.toFixed(2) ?? '—'}</td>
                    <td style={{ padding: '.42rem .65rem', borderBottom: '1px solid var(--border)', textAlign: 'center' }}>{diffBadge(b.generalAverage, b.generalAverageT1)}</td>
                    <td style={{ padding: '.42rem .65rem', borderBottom: '1px solid var(--border)', textAlign: 'center', color: (b.absences?.demiJournees || 0) > 5 ? 'var(--danger)' : 'var(--text2)' }}>{b.absences?.demiJournees ?? 0} DJ</td>
                    <td style={{ padding: '.42rem .65rem', borderBottom: '1px solid var(--border)', textAlign: 'center' }}>
                      {b.orientation?.avis ? <span style={{ fontSize: '.68rem', fontWeight: 700, padding: '.1rem .42rem', borderRadius: 99, background: b.orientation.avis === 'Favorable' ? 'rgba(15,155,110,.12)' : 'rgba(217,119,6,.12)', color: b.orientation.avis === 'Favorable' ? 'var(--success)' : 'var(--warning)' }}>{b.orientation.filiere || b.orientation.avis}</span> : <span style={{ color: 'var(--text3)', fontSize: '.7rem' }}>—</span>}
                    </td>
                    <td style={{ padding: '.42rem .875rem', borderBottom: '1px solid var(--border)', color: 'var(--text2)', fontSize: '.73rem', maxWidth: 320 }}>
                      <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{b.appreciationGenerale || '—'}</div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {elevesFiltered.length === 0 && <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text3)' }}>Aucun élève trouvé.</div>}
          </div>
        )}

        {vue === 'eleve' && (
          <div style={{ display: 'grid', gridTemplateColumns: '220px 1fr', gap: '1rem', minHeight: 400 }}>
            <div style={{ background: 'var(--surface2)', borderRadius: 'var(--r)', border: '1px solid var(--border)', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
              <div style={{ padding: '.42rem .65rem', fontSize: '.6rem', fontWeight: 700, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '.07em', borderBottom: '1px solid var(--border)' }}>Élèves</div>
              <div style={{ flex: 1, overflowY: 'auto' }}>
                {elevesFiltered.map(b => (
                  <button key={b.id} onClick={() => setSelEleve(b.id)} style={{ display: 'flex', alignItems: 'center', gap: '.5rem', width: '100%', padding: '.48rem .75rem', border: 'none', borderLeft: `3px solid ${selEleve === b.id ? 'var(--accent)' : 'transparent'}`, background: selEleve === b.id ? 'var(--surface)' : 'transparent', cursor: 'pointer', fontFamily: 'Roboto, sans-serif', fontSize: '.78rem', fontWeight: selEleve === b.id ? 700 : 400, color: selEleve === b.id ? 'var(--accent)' : 'var(--text2)', borderBottom: '1px solid var(--border)', transition: 'all .12s', textAlign: 'left' }}>
                    <span style={{ flex: 1 }}>{b.name}</span>
                    <span style={{ fontSize: '.7rem', fontWeight: 800, color: colorMoy(b.generalAverage) }}>{b.generalAverage?.toFixed(1)}</span>
                  </button>
                ))}
              </div>
            </div>
            {!eleveActif ? (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text3)', flexDirection: 'column', gap: '.5rem' }}>
                <div style={{ fontSize: '2rem', opacity: .2 }}>👤</div>
                <div>Sélectionnez un élève</div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '.875rem' }}>
                <div className="card" style={{ padding: '1rem 1.25rem' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem' }}>
                    <div style={{ width: 48, height: 48, borderRadius: 12, background: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 800, fontSize: '.9rem', flexShrink: 0 }}>
                      {eleveActif.name.split(' ').map(w => w[0]).slice(0, 2).join('')}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 800, fontSize: '1.05rem', marginBottom: '.2rem' }}>{eleveActif.name}</div>
                      <div style={{ display: 'flex', gap: '.75rem', flexWrap: 'wrap', fontSize: '.75rem', color: 'var(--text2)' }}>
                        <span>Moy. T2 : <strong style={{ color: colorMoy(eleveActif.generalAverage) }}>{eleveActif.generalAverage?.toFixed(2)}/20</strong></span>
                        <span>Moy. T1 : <strong>{eleveActif.generalAverageT1?.toFixed(2)}/20</strong></span>
                        <span>Moy. classe : <strong>{eleveActif.generalAverageClass}/20</strong></span>
                        <span>Absences : <strong style={{ color: (eleveActif.absences?.demiJournees || 0) > 5 ? 'var(--danger)' : 'inherit' }}>{eleveActif.absences?.demiJournees ?? 0} demi-journées</strong></span>
                        {eleveActif.retards > 0 && <span>Retards : <strong>{eleveActif.retards}</strong></span>}
                        {eleveActif.orientation?.avis && <span>Orientation : <strong>{eleveActif.orientation.filiere || eleveActif.orientation.avis}</strong></span>}
                      </div>
                    </div>
                    {eleveActif.recompense && <div style={{ fontSize: '1.5rem' }}>{eleveActif.recompense === 'tf' ? '🏅' : '⭐'}</div>}
                  </div>
                </div>
                <div className="card" style={{ overflow: 'hidden' }}>
                  <div className="card-hd"><div className="card-title">📊 Notes par matière</div></div>
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ borderCollapse: 'collapse', width: '100%', fontSize: '.77rem' }}>
                      <thead>
                        <tr style={{ background: 'var(--surface2)' }}>
                          <th style={{ padding: '.42rem .75rem', textAlign: 'left', fontWeight: 700, color: 'var(--text2)', borderBottom: '1px solid var(--border)' }}>Matière</th>
                          <th style={{ padding: '.42rem .65rem', textAlign: 'center', fontWeight: 700, color: 'var(--text2)', borderBottom: '1px solid var(--border)' }}>T2</th>
                          <th style={{ padding: '.42rem .65rem', textAlign: 'center', fontWeight: 700, color: 'var(--text2)', borderBottom: '1px solid var(--border)' }}>T1</th>
                          <th style={{ padding: '.42rem .65rem', textAlign: 'center', fontWeight: 700, color: 'var(--text2)', borderBottom: '1px solid var(--border)' }}>Évol.</th>
                          {optionsPdf.moyClasse && <th style={{ padding: '.42rem .65rem', textAlign: 'center', fontWeight: 700, color: 'var(--text2)', borderBottom: '1px solid var(--border)' }}>Classe</th>}
                          <th style={{ padding: '.42rem .75rem', textAlign: 'left', fontWeight: 700, color: 'var(--text2)', borderBottom: '1px solid var(--border)' }}>Appréciation</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(eleveActif.subjects || []).filter(sub => !filtPole || sub.pole === filtPole).map((sub, i) => (
                          <tr key={i} style={{ background: i % 2 === 0 ? 'var(--surface)' : 'var(--surface2)' }}>
                            <td style={{ padding: '.38rem .75rem', borderBottom: '1px solid var(--border)', fontWeight: 600 }}>
                              <div>{sub.name}</div>
                              {sub.teacher && <div style={{ fontSize: '.65rem', color: 'var(--text3)', fontWeight: 400 }}>{sub.teacher}</div>}
                            </td>
                            <td style={{ padding: '.38rem .65rem', borderBottom: '1px solid var(--border)', textAlign: 'center', fontWeight: 800, color: colorMoy(sub.gradeStudent) }}>{sub.gradeStudent?.toFixed(2) ?? '—'}</td>
                            <td style={{ padding: '.38rem .65rem', borderBottom: '1px solid var(--border)', textAlign: 'center', color: 'var(--text2)' }}>{sub.gradeT1?.toFixed(2) ?? '—'}</td>
                            <td style={{ padding: '.38rem .65rem', borderBottom: '1px solid var(--border)', textAlign: 'center' }}>{diffBadge(sub.gradeStudent, sub.gradeT1)}</td>
                            {optionsPdf.moyClasse && <td style={{ padding: '.38rem .65rem', borderBottom: '1px solid var(--border)', textAlign: 'center', color: 'var(--text3)' }}>{sub.gradeClass?.toFixed(1) ?? '—'}</td>}
                            <td style={{ padding: '.38rem .75rem', borderBottom: '1px solid var(--border)', color: 'var(--text2)', fontSize: '.72rem', maxWidth: 300 }}>
                              <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={sub.appreciation}>{sub.appreciation || '—'}</div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
                {eleveActif.appreciationGenerale && (
                  <div className="card" style={{ padding: '1rem 1.25rem' }}>
                    <div style={{ fontSize: '.65rem', fontWeight: 700, color: 'var(--text2)', textTransform: 'uppercase', letterSpacing: '.07em', marginBottom: '.5rem' }}>💬 Appréciation générale</div>
                    <div style={{ fontSize: '.83rem', color: 'var(--text)', lineHeight: 1.65, fontStyle: 'italic' }}>"{eleveActif.appreciationGenerale}"</div>
                  </div>
                )}
                {eleveActif.vieScolaire && (
                  <div className="card" style={{ padding: '.875rem 1.25rem' }}>
                    <div style={{ fontSize: '.65rem', fontWeight: 700, color: 'var(--text2)', textTransform: 'uppercase', letterSpacing: '.07em', marginBottom: '.38rem' }}>🏫 Vie scolaire</div>
                    <div style={{ fontSize: '.83rem', color: 'var(--text2)' }}>{eleveActif.vieScolaire}</div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {vue === 'matiere' && (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ borderCollapse: 'collapse', width: '100%', fontSize: '.77rem' }}>
              <thead>
                <tr style={{ background: 'var(--surface2)', position: 'sticky', top: 0 }}>
                  <th style={{ padding: '.48rem .875rem', textAlign: 'left', fontWeight: 700, color: 'var(--text2)', borderBottom: '2px solid var(--border)', minWidth: 180 }}>Élève</th>
                  {allMatieres.map(m => (
                    <th key={m} style={{ padding: '.4rem .5rem', textAlign: 'center', fontWeight: 700, color: 'var(--text2)', borderBottom: '2px solid var(--border)', borderLeft: '1px solid var(--border)', minWidth: 80, fontSize: '.65rem', whiteSpace: 'nowrap' }} title={m}>{m.length > 14 ? m.slice(0, 13) + '…' : m}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {elevesFiltered.map((b, i) => (
                  <tr key={b.id} style={{ background: i % 2 === 0 ? 'var(--surface)' : 'var(--surface2)', cursor: 'pointer' }} onClick={() => { setSelEleve(b.id); setVue('eleve'); }} onMouseEnter={e => e.currentTarget.style.background = 'rgba(59,91,219,.07)'} onMouseLeave={e => e.currentTarget.style.background = i % 2 === 0 ? 'var(--surface)' : 'var(--surface2)'}>
                    <td style={{ padding: '.38rem .875rem', borderBottom: '1px solid var(--border)', fontWeight: 600 }}>{b.name}</td>
                    {allMatieres.map(m => {
                      const sub = (b.subjects || []).find(s => s.name === m);
                      return <td key={m} style={{ padding: '.38rem .5rem', borderBottom: '1px solid var(--border)', borderLeft: '1px solid var(--border)', textAlign: 'center', fontWeight: 700, color: sub ? colorMoy(sub.gradeStudent) : 'var(--text3)' }}>{sub ? sub.gradeStudent?.toFixed(1) ?? '—' : <span style={{ opacity: .3 }}>—</span>}</td>;
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
            {elevesFiltered.length === 0 && <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text3)' }}>Aucun élève trouvé.</div>}
          </div>
        )}
      </div>
    </>
  );
}

// ── MODULE PDF CARNET DE BORD ────────────────────────────────────────────────