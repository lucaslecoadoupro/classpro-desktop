function ModulePdfBulletins({ cpData }) {
  const tousLesBulletins = cpData?.bulletins || [];
  const profile = cpData?.profile || {};

  // Classes disponibles dans les bulletins
  const classesDispos = useMemo(() => {
    const s = new Set(tousLesBulletins.map(b => b.classe).filter(Boolean));
    return [...s].sort();
  }, [tousLesBulletins]);

  const [selClasse, setSelClasse] = useState(() => classesDispos[0] || null);
  const [modeSelection, setModeSelection] = useState('tous'); // 'tous' | 'choix'
  const [generating, setGenerating] = useState(false);
  const [done, setDone] = useState(false);
  const [optionsPdf, setOptionsPdf] = useState({
    moyennes: true,
    notes: true,
    moyClasse: true,
    appreciation: true,
    absences: true,
    orientation: true,
  });

  const toggleOpt = (key) => setOptionsPdf(p => ({ ...p, [key]: !p[key] }));

  // Bulletins de la classe selectionnee
  const bulletins = useMemo(() => {
    if (!selClasse) return tousLesBulletins;
    return tousLesBulletins.filter(b => b.classe === selClasse);
  }, [tousLesBulletins, selClasse]);

  const [selEleves, setSelEleves] = useState(() => new Set(bulletins.map(b => b.id)));

  // Resync selEleves quand la classe change
  useEffect(() => {
    setSelEleves(new Set(bulletins.map(b => b.id)));
    setModeSelection('tous');
  }, [selClasse]);

  const elevesExportes = modeSelection === 'tous'
    ? bulletins
    : bulletins.filter(b => selEleves.has(b.id));

  const toggleEleve = (id) => {
    setSelEleves(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const toggleTous = () => {
    if (selEleves.size === bulletins.length) setSelEleves(new Set());
    else setSelEleves(new Set(bulletins.map(b => b.id)));
  };

  const colorMoy = (v) => {
    if (v == null || isNaN(v)) return [100, 116, 139];
    if (v >= 16) return [15, 155, 110];
    if (v >= 12) return [59, 91, 219];
    if (v >= 10) return [217, 119, 6];
    return [220, 38, 38];
  };

  const fmtNote = (v) => {
    if (v == null || isNaN(v)) return '-';
    return parseFloat(v).toFixed(2);
  };

  const genererPdf = async () => {
    if (elevesExportes.length === 0) return;
    if (!window.jspdf) { alert('jsPDF non chargé. Vérifiez vendor/jspdf.umd.min.js'); return; }

    setGenerating(true);
    setDone(false);

    try {
      const { jsPDF } = window.jspdf;
      const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      const PW = 210, PH = 297, ML = 12, MR = 12, MB = 12;
      const CW = PW - ML - MR;
      const ACCENT  = [59, 91, 219];
      const DARK    = [15, 23, 42];
      const GRAY    = [100, 116, 139];
      const LIGHT   = [241, 245, 249];
      const WHITE   = [255, 255, 255];
      const SUCCESS = [15, 155, 110];
      const WARN    = [217, 119, 6];
      const DANGER  = [220, 38, 38];

      const drawPageHeader = (eleve, pageNum, totalPages) => {
        // Bande accent
        doc.setFillColor(...ACCENT);
        doc.rect(0, 0, PW, 24, 'F');

        // Etablissement + classe
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(9.5);
        doc.setTextColor(...WHITE);
        doc.text(profile.etablissement || 'ClassPro Desktop', ML, 8);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);
        doc.text(
          (profile.prenom || '') + ' ' + (profile.nom || '') +
          '   |   Classe : ' + (profile.classe || '?') +
          '   |   Annee : ' + (profile.annee || '?'),
          ML, 14
        );

        // Nom eleve (droite)
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(11);
        doc.text(eleve.name || '', PW - MR, 9, { align: 'right' });
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);
        doc.text('Trimestre ' + (eleve.trimester || '?'), PW - MR, 14.5, { align: 'right' });

        // Ligne separatrice
        doc.setDrawColor(220, 230, 250);
        doc.setLineWidth(0.3);
        doc.line(ML, 26, PW - MR, 26);

        // Pied de page
        doc.setFontSize(7);
        doc.setTextColor(...GRAY);
        doc.text('ClassPro Desktop', ML, PH - 6);
        doc.text(pageNum + ' / ' + totalPages, PW - MR, PH - 6, { align: 'right' });
      };

      const drawMoyenneBox = (eleve, x, y, w) => {
        const moy = eleve.generalAverage;
        const moyT1 = eleve.generalAverageT1;
        const moyClasse = eleve.generalAverageClass;
        const [r, g, b] = colorMoy(moy);

        doc.setFillColor(...LIGHT);
        doc.roundedRect(x, y, w, 18, 2, 2, 'F');

        // Moyenne T2
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(7);
        doc.setTextColor(...GRAY);
        doc.text('MOY. T2', x + 4, y + 5);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(15);
        doc.setTextColor(r, g, b);
        doc.text(fmtNote(moy) + '/20', x + 4, y + 13);

        // Moyenne T1
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7);
        doc.setTextColor(...GRAY);
        doc.text('T1 : ' + fmtNote(moyT1), x + w / 2 - 5, y + 6);
        doc.text('Classe : ' + fmtNote(moyClasse), x + w / 2 - 5, y + 11);

        // Variation
        if (moy != null && moyT1 != null) {
          const diff = parseFloat((moy - moyT1).toFixed(2));
          const [dr, dg, db] = diff >= 0 ? SUCCESS : DANGER;
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(8);
          doc.setTextColor(dr, dg, db);
          const arrow = diff > 0.05 ? '+' : diff < -0.05 ? '' : '';
          doc.text(arrow + diff.toFixed(2), x + w - 12, y + 10);
        }

        return y + 20;
      };

      const totalPages = elevesExportes.length;

      elevesExportes.forEach((eleve, eleveIdx) => {
        if (eleveIdx > 0) doc.addPage();
        drawPageHeader(eleve, eleveIdx + 1, totalPages);

        let y = 29;

        // Ligne infos rapides (absences, orientation)
        const infos = [];
        if (optionsPdf.absences && eleve.absences?.demiJournees != null)
          infos.push('Absences : ' + eleve.absences.demiJournees + ' demi-journees');
        if (optionsPdf.absences && eleve.retards) infos.push('Retards : ' + eleve.retards);
        if (optionsPdf.orientation && eleve.orientation?.filiere) infos.push('Orientation : ' + eleve.orientation.filiere);
        if (optionsPdf.orientation && eleve.orientation?.avis) infos.push('Avis : ' + eleve.orientation.avis);

        if (infos.length > 0) {
          doc.setFont('helvetica', 'normal');
          doc.setFontSize(7.5);
          doc.setTextColor(...GRAY);
          doc.text(infos.join('   |   '), ML, y + 3);
          y += 7;
        }

        // Box moyenne generale
        if (optionsPdf.moyennes) y = drawMoyenneBox(eleve, ML, y, CW);
        else y += 2;

        // Tableau des matieres
        const subjects = eleve.subjects || [];
        if (optionsPdf.notes && subjects.length > 0) {
          // En-tete tableau
          const cols = { nom: 74, t2: 22, t1: 22, classe: 22, reste: CW - 74 - 22 - 22 - 22 };
          const rowH = 6.5;
          const headerH = 7;

          doc.setFillColor(...ACCENT);
          doc.rect(ML, y, CW, headerH, 'F');
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(7);
          doc.setTextColor(...WHITE);
          doc.text('Matiere', ML + 2, y + 4.8);
          doc.text('T2', ML + cols.nom + 2, y + 4.8);
          doc.text('T1', ML + cols.nom + cols.t2 + 2, y + 4.8);
          doc.text('Classe', ML + cols.nom + cols.t2 + cols.t1 + 2, y + 4.8);
          y += headerH;

          subjects.forEach((sub, si) => {
            // Verifier debordement page
            if (y + rowH > PH - MB - 30) {
              doc.addPage();
              drawPageHeader(eleve, eleveIdx + 1, totalPages);
              y = 29;
              // Re-dessiner en-tete tableau
              doc.setFillColor(...ACCENT);
              doc.rect(ML, y, CW, headerH, 'F');
              doc.setFont('helvetica', 'bold');
              doc.setFontSize(7);
              doc.setTextColor(...WHITE);
              doc.text('Matiere (suite)', ML + 2, y + 4.8);
              doc.text('T2', ML + cols.nom + 2, y + 4.8);
              doc.text('T1', ML + cols.nom + cols.t2 + 2, y + 4.8);
              doc.text('Classe', ML + cols.nom + cols.t2 + cols.t1 + 2, y + 4.8);
              y += headerH;
            }

            const bg = si % 2 === 0 ? WHITE : LIGHT;
            doc.setFillColor(...bg);
            doc.rect(ML, y, CW, rowH, 'F');

            // Bordure legere
            doc.setDrawColor(220, 230, 250);
            doc.setLineWidth(0.2);
            doc.line(ML, y + rowH, ML + CW, y + rowH);

            // Nom matiere
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(7);
            doc.setTextColor(...DARK);
            const nomMat = (sub.name || '').length > 28
              ? (sub.name || '').slice(0, 27) + '.'
              : (sub.name || '');
            doc.text(nomMat, ML + 2, y + 4.5);

            // Note T2
            const [r2, g2, b2] = colorMoy(sub.gradeStudent);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(r2, g2, b2);
            doc.text(fmtNote(sub.gradeStudent), ML + cols.nom + 2, y + 4.5);

            // Note T1
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(...GRAY);
            doc.text(fmtNote(sub.gradeT1), ML + cols.nom + cols.t2 + 2, y + 4.5);

            // Moyenne classe
            doc.text(fmtNote(sub.gradeClass), ML + cols.nom + cols.t2 + cols.t1 + 2, y + 4.5);

            y += rowH;
          });

          y += 5;
        }

        // Appreciation generale
        const appGen = (eleve.appreciationGenerale || '').trim();
        if (optionsPdf.appreciation && appGen && y < PH - MB - 25) {
          doc.setFillColor(...LIGHT);
          doc.roundedRect(ML, y, CW, 6, 1, 1, 'F');
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(7.5);
          doc.setTextColor(...ACCENT);
          doc.text('Appreciation generale du conseil', ML + 2.5, y + 4.2);
          y += 7.5;

          doc.setFont('helvetica', 'italic');
          doc.setFontSize(7.5);
          doc.setTextColor(...DARK);
          const appLines = doc.splitTextToSize('"' + appGen + '"', CW - 4);
          const maxLines = Math.floor((PH - MB - y - 5) / 4.5);
          appLines.slice(0, maxLines).forEach(line => {
            doc.text(line, ML + 2, y + 3.5);
            y += 4.5;
          });
          if (appLines.length > maxLines) {
            doc.setTextColor(...GRAY);
            doc.text('...', ML + 2, y);
          }
        }
      });

      // Sauvegarder
      const dateStr = new Date().toLocaleDateString('fr-FR').replace(/\//g, '-');
      const nomClasse = (selClasse || profile.classe || 'classe').replace(/[^a-zA-Z0-9]/g, '_');
      const defaultName = 'Bulletins_' + nomClasse + '_T' + (bulletins[0]?.trimester || '?') + '_' + dateStr + '.pdf';
      const pdfBase64 = doc.output('datauristring').split(',')[1];
      const result = await window.cpd.savePdf(pdfBase64, defaultName);
      if (result?.ok) { setDone(true); setTimeout(() => setDone(false), 3000); }

    } catch (err) {
      console.error('Erreur PDF Bulletins:', err);
      alert('Erreur : ' + err.message);
    }
    setGenerating(false);
  };

  if (!cpData || bulletins.length === 0) {
    return <ModulePlaceholder icon="📄" title="PDF Bulletins" sub="Aucun bulletin disponible dans ce fichier ClassPro." soon={false} />;
  }

  return (
    <>
      <div className="page-hd">
        <div>
          <div className="phd-badge">📄 PDF</div>
          <div className="phd-title">PDF Bulletins — Conseil de classe</div>
          <div className="phd-sub">
            {selClasse || profile.classe || '?'} · Trimestre {bulletins[0]?.trimester || '?'} · {elevesExportes.length} eleve(s) a exporter
          </div>
        </div>
        <div className="phd-actions">
          <button
            className="btn btn-primary"
            onClick={genererPdf}
            disabled={elevesExportes.length === 0 || generating}
          >
            {generating ? 'Generation...' : done ? 'PDF sauvegarde !' : 'Generer le PDF (' + elevesExportes.length + ')'}
          </button>
        </div>
      </div>

      <div className="page-content">

        {/* Selecteur de classe */}
        {classesDispos.length > 1 && (
          <div style={{ marginBottom: '1rem' }}>
            <div style={{ fontSize: '.72rem', fontWeight: 700, color: 'var(--text2)', textTransform: 'uppercase', letterSpacing: '.07em', marginBottom: '.4rem' }}>Classe</div>
            <div style={{ display: 'flex', gap: '.38rem', flexWrap: 'wrap' }}>
              {classesDispos.map(cls => (
                <button key={cls} onClick={() => setSelClasse(cls)}
                  style={{ padding: '.38rem .875rem', borderRadius: 'var(--r-s)', border: '1.5px solid ' + (selClasse === cls ? 'var(--accent)' : 'var(--border)'), background: selClasse === cls ? 'var(--accent)' : 'var(--surface)', color: selClasse === cls ? '#fff' : 'var(--text2)', fontFamily: 'Roboto, sans-serif', fontSize: '.82rem', fontWeight: 600, cursor: 'pointer', transition: 'all .15s' }}>
                  {cls} <span style={{ opacity: .7, fontSize: '.72rem' }}>({tousLesBulletins.filter(b => b.classe === cls).length})</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Options PDF */}
        <div className="card" style={{ marginBottom: '1rem' }}>
          <div className="card-hd"><div className="card-title">⚙️ Contenu du PDF</div></div>
          <div className="card-body" style={{ display: 'flex', flexWrap: 'wrap', gap: '.5rem' }}>
            {[
              { key: 'moyennes',    label: 'Moyennes T1 / T2' },
              { key: 'notes',       label: 'Notes par matière' },
              { key: 'moyClasse',   label: 'Moyenne classe' },
              { key: 'appreciation',label: 'Appréciation générale' },
              { key: 'absences',    label: 'Absences / Retards' },
              { key: 'orientation', label: 'Orientation' },
            ].map(opt => (
              <button key={opt.key} onClick={() => toggleOpt(opt.key)}
                style={{ display: 'flex', alignItems: 'center', gap: '.45rem', padding: '.35rem .75rem', borderRadius: 99, border: '1.5px solid ' + (optionsPdf[opt.key] ? 'var(--accent)' : 'var(--border)'), background: optionsPdf[opt.key] ? 'rgba(59,91,219,.1)' : 'var(--surface2)', color: optionsPdf[opt.key] ? 'var(--accent)' : 'var(--text3)', fontFamily: 'Roboto, sans-serif', fontSize: '.78rem', fontWeight: optionsPdf[opt.key] ? 700 : 400, cursor: 'pointer', transition: 'all .15s' }}>
                <span style={{ fontSize: '.8rem' }}>{optionsPdf[opt.key] ? '✓' : '○'}</span>
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Mode selection */}
        <div style={{ display: 'flex', gap: '.5rem', marginBottom: '1rem' }}>
          {[
            { id: 'tous', label: 'Tous les eleves (' + bulletins.length + ')' },
            { id: 'choix', label: 'Selection manuelle' },
          ].map(opt => (
            <button key={opt.id} onClick={() => setModeSelection(opt.id)}
              style={{ padding: '.42rem .875rem', borderRadius: 'var(--r-s)', border: '1.5px solid ' + (modeSelection === opt.id ? 'var(--accent)' : 'var(--border)'), background: modeSelection === opt.id ? 'var(--accent)' : 'var(--surface)', color: modeSelection === opt.id ? '#fff' : 'var(--text2)', fontFamily: 'Roboto, sans-serif', fontSize: '.8rem', fontWeight: 600, cursor: 'pointer', transition: 'all .15s' }}>
              {opt.label}
            </button>
          ))}
          {modeSelection === 'choix' && (
            <button onClick={toggleTous}
              style={{ padding: '.42rem .875rem', borderRadius: 'var(--r-s)', border: '1px solid var(--border)', background: 'var(--surface2)', color: 'var(--text2)', fontFamily: 'Roboto, sans-serif', fontSize: '.78rem', cursor: 'pointer' }}>
              {selEleves.size === bulletins.length ? 'Tout deselectionner' : 'Tout selectionner'}
            </button>
          )}
        </div>

        {/* Liste eleves */}
        <div className="card">
          <div className="card-hd">
            <div className="card-title">
              {modeSelection === 'tous' ? 'Eleves inclus dans le PDF' : 'Selectionner les eleves (' + selEleves.size + ' selectionnes)'}
            </div>
          </div>
          <div className="card-body" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '.38rem' }}>
            {bulletins.map(b => {
              const inclus = modeSelection === 'tous' || selEleves.has(b.id);
              const [r, g, bv] = colorMoy(b.generalAverage);
              return (
                <button key={b.id}
                  onClick={() => modeSelection === 'choix' && toggleEleve(b.id)}
                  style={{ display: 'flex', alignItems: 'center', gap: '.65rem', padding: '.45rem .75rem', border: '1.5px solid ' + (inclus ? 'var(--accent)' : 'var(--border)'), borderRadius: 'var(--r-s)', background: inclus ? 'rgba(59,91,219,.06)' : 'var(--surface2)', cursor: modeSelection === 'choix' ? 'pointer' : 'default', fontFamily: 'Roboto, sans-serif', transition: 'all .13s', textAlign: 'left' }}>
                  {modeSelection === 'choix' && (
                    <div style={{ width: 16, height: 16, borderRadius: 4, border: '2px solid ' + (inclus ? 'var(--accent)' : 'var(--border)'), background: inclus ? 'var(--accent)' : 'transparent', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {inclus && <span style={{ color: '#fff', fontSize: '.6rem', fontWeight: 900 }}>✓</span>}
                    </div>
                  )}
                  <span style={{ flex: 1, fontSize: '.82rem', fontWeight: inclus ? 600 : 400, color: inclus ? 'var(--text)' : 'var(--text3)' }}>{b.name}</span>
                  <span style={{ fontSize: '.78rem', fontWeight: 700, color: 'rgb(' + r + ',' + g + ',' + bv + ')' }}>
                    {b.generalAverage != null ? parseFloat(b.generalAverage).toFixed(1) : '-'}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Resume contenu PDF */}
        <div className="card" style={{ marginTop: '1rem' }}>
          <div className="card-hd"><div className="card-title">Contenu du PDF</div></div>
          <div className="card-body" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '.5rem' }}>
            {[
              { label: 'Moyenne T1 et T2', ok: true },
              { label: 'Notes par matiere', ok: true },
              { label: 'Moyenne classe / matiere', ok: true },
              { label: 'Appreciation generale', ok: true },
              { label: 'Absences et retards', ok: true },
              { label: 'Orientation', ok: true },
              { label: 'Une page par eleve', ok: true },
              { label: 'En-tete etablissement', ok: true },
            ].map(item => (
              <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: '.5rem', fontSize: '.8rem', color: 'var(--text2)' }}>
                <span style={{ color: 'var(--success)', fontWeight: 700 }}>✓</span>
                {item.label}
              </div>
            ))}
          </div>
        </div>

      </div>
    </>
  );
}

// ── MODULE PDF PROGRESSION ────────────────────────────────────────────────────