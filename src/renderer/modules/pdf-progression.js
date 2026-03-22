function ModulePdfProgression({ cpData }) {
  const classes = cpData?.classes || [];
  const progs = cpData?.progs || {};
  const profile = cpData?.profile || {};

  // Classes qui ont une progression
  const classesAvecProg = useMemo(() =>
    classes.filter(c => progs[c.id]?.rows?.length > 0),
    [classes, progs]
  );

  const [modeExport, setModeExport] = useState('toutes'); // 'toutes' | 'choix'
  const [selClasses, setSelClasses] = useState(() => new Set(classesAvecProg.map(c => c.id)));
  const [generating, setGenerating] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    setSelClasses(new Set(classesAvecProg.map(c => c.id)));
  }, [classesAvecProg.length]);

  const classesExportees = modeExport === 'toutes'
    ? classesAvecProg
    : classesAvecProg.filter(c => selClasses.has(c.id));

  const toggleClasse = (id) => {
    setSelClasses(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const toggleToutes = () => {
    if (selClasses.size === classesAvecProg.length) setSelClasses(new Set());
    else setSelClasses(new Set(classesAvecProg.map(c => c.id)));
  };

  const genererPdf = async () => {
    if (classesExportees.length === 0) return;
    if (!window.jspdf) { alert('jsPDF non charge. Verifiez vendor/jspdf.umd.min.js'); return; }

    setGenerating(true);
    setDone(false);

    try {
      const { jsPDF } = window.jspdf;
      // Paysage A4
      const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
      const PW = 297, PH = 210, ML = 12, MR = 12, MT = 12, MB = 12;
      const CW = PW - ML - MR;
      const ACCENT = [59, 91, 219];
      const DARK   = [15, 23, 42];
      const GRAY   = [100, 116, 139];
      const LIGHT  = [241, 245, 249];
      const WHITE  = [255, 255, 255];

      const drawHeader = (cls, pageNum, totalPages) => {
        // Bande accent
        doc.setFillColor(...ACCENT);
        doc.rect(0, 0, PW, 20, 'F');

        // Etablissement
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(9.5);
        doc.setTextColor(...WHITE);
        doc.text(profile.etablissement || 'ClassPro Desktop', ML, 8);

        // Prof + annee
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);
        doc.text(
          (profile.prenom || '') + ' ' + (profile.nom || '') +
          '   |   Annee : ' + (profile.annee || '?'),
          ML, 14
        );

        // Classe (droite)
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(13);
        doc.text('Progression annuelle — ' + (cls?.name || ''), PW - MR, 9, { align: 'right' });

        // Pagination
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7);
        doc.setTextColor(...GRAY);
        doc.text('ClassPro Desktop', ML, PH - 6);
        doc.text(pageNum + ' / ' + totalPages, PW - MR, PH - 6, { align: 'right' });
      };

      let pageNum = 0;
      const totalPages = classesExportees.length;

      classesExportees.forEach((cls, clsIdx) => {
        if (clsIdx > 0) doc.addPage();
        pageNum++;
        drawHeader(cls, pageNum, totalPages);

        const prog = progs[cls.id];
        const cols = prog?.cols || [];
        const rows = prog?.rows || [];

        if (cols.length === 0 || rows.length === 0) {
          doc.setFont('helvetica', 'italic');
          doc.setFontSize(10);
          doc.setTextColor(...GRAY);
          doc.text('Aucune sequence enregistree pour cette classe.', ML, 35);
          return;
        }

        // Calcul des largeurs de colonnes
        const availW = CW;
        // Largeur min par colonne, proportionnelle
        const totalConfigW = cols.reduce((s, c) => s + (c.width || 120), 0);
        const colWidths = cols.map(c => Math.max(15, ((c.width || 120) / totalConfigW) * availW));

        const rowH = 8;
        const headerH = 9;
        let y = 23;

        // En-tete du tableau
        doc.setFillColor(...ACCENT);
        doc.rect(ML, y, CW, headerH, 'F');

        let x = ML;
        cols.forEach((col, ci) => {
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(7.5);
          doc.setTextColor(...WHITE);
          const label = (col.label || '').slice(0, 18);
          doc.text(label, x + 2, y + 6);
          x += colWidths[ci];
        });
        y += headerH;

        // Lignes du tableau
        rows.forEach((row, ri) => {
          // Verifier debordement
          if (y + rowH > PH - MB - 10) {
            doc.addPage();
            pageNum++;
            // Note: on ne compte pas ces pages dans totalPages car on ne peut pas savoir à l'avance
            drawHeader(cls, pageNum, totalPages);
            y = 23;

            // Re-dessiner en-tete tableau
            doc.setFillColor(...ACCENT);
            doc.rect(ML, y, CW, headerH, 'F');
            let xh = ML;
            cols.forEach((col, ci) => {
              doc.setFont('helvetica', 'bold');
              doc.setFontSize(7.5);
              doc.setTextColor(...WHITE);
              doc.text((col.label || '').slice(0, 18), xh + 2, y + 6);
              xh += colWidths[ci];
            });
            y += headerH;
          }

          // Fond alterné
          doc.setFillColor(...(ri % 2 === 0 ? WHITE : LIGHT));
          doc.rect(ML, y, CW, rowH, 'F');

          // Bordure basse
          doc.setDrawColor(220, 230, 250);
          doc.setLineWidth(0.2);
          doc.line(ML, y + rowH, ML + CW, y + rowH);

          // Cellules
          let cx = ML;
          cols.forEach((col, ci) => {
            const val = (row[col.id] || '').toString().trim();
            const maxChars = Math.floor(colWidths[ci] / 1.8);
            const display = val.length > maxChars ? val.slice(0, maxChars - 1) + '...' : val;

            doc.setFont('helvetica', ci === 0 ? 'bold' : 'normal');
            doc.setFontSize(7.5);
            doc.setTextColor(...DARK);
            doc.text(display, cx + 2, y + 5.5);

            // Separateur vertical
            doc.setDrawColor(220, 230, 250);
            doc.setLineWidth(0.2);
            doc.line(cx + colWidths[ci], y, cx + colWidths[ci], y + rowH);

            cx += colWidths[ci];
          });

          y += rowH;
        });

        // Bordure du tableau
        doc.setDrawColor(200, 215, 245);
        doc.setLineWidth(0.4);
        doc.rect(ML, 23, CW, y - 23, 'S');

        // Recap bas de page
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7.5);
        doc.setTextColor(...GRAY);
        doc.text(rows.length + ' sequence(s) · ' + cols.length + ' colonne(s)', ML, PH - 10);
      });

      // Sauvegarder
      const dateStr = new Date().toLocaleDateString('fr-FR').replace(/\//g, '-');
      const suffixe = classesExportees.length === 1
        ? classesExportees[0].name.replace(/[^a-zA-Z0-9]/g, '_')
        : 'toutes_classes';
      const defaultName = 'Progression_' + suffixe + '_' + dateStr + '.pdf';
      const pdfBase64 = doc.output('datauristring').split(',')[1];
      const result = await window.cpd.savePdf(pdfBase64, defaultName);
      if (result?.ok) {
        setDone(true); setTimeout(() => setDone(false), 3000);
        cpdUnlockBadge('first_pdf');
        cpdTrackPdf('progression');
        // Badge perfectionniste — toutes les cellules de toutes les progressions exportées remplies
        const toutesRemplies = classesExportees.every(cls => {
          const prog = progs[cls.id];
          return (prog?.rows || []).every(row =>
            (prog?.cols || []).every(col => (row[col.id] || '').trim().length > 0)
          );
        });
        if (toutesRemplies && classesExportees.length > 0) cpdUnlockBadge('perfectionniste');
      }

    } catch (err) {
      console.error('Erreur PDF Progression:', err);
      alert('Erreur : ' + err.message);
    }
    setGenerating(false);
  };

  if (!cpData) return <ModulePlaceholder icon="📄" title="PDF Progression" sub="Ouvrez d'abord un fichier ClassPro." />;

  if (classesAvecProg.length === 0) {
    return (
      <>
        <div className="page-hd">
          <div>
            <div className="phd-badge">📄 PDF</div>
            <div className="phd-title">PDF Progression annuelle</div>
            <div className="phd-sub">Aucune progression renseignee</div>
          </div>
        </div>
        <div className="page-content">
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem', padding: '3rem', color: 'var(--text3)' }}>
            <div style={{ fontSize: '3rem', opacity: .15 }}>📆</div>
            <div style={{ fontWeight: 700, color: 'var(--text2)' }}>Aucune progression a exporter</div>
            <div style={{ fontSize: '.83rem' }}>Creez des progressions dans le module Progression annuelle.</div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <div className="page-hd">
        <div>
          <div className="phd-badge">📄 PDF</div>
          <div className="phd-title">PDF Progression annuelle</div>
          <div className="phd-sub">{classesExportees.length} classe(s) a exporter · Format paysage A4</div>
        </div>
        <div className="phd-actions">
          <button
            className="btn btn-primary"
            onClick={genererPdf}
            disabled={classesExportees.length === 0 || generating}
          >
            {generating ? 'Generation...' : done ? 'PDF sauvegarde !' : 'Generer le PDF (' + classesExportees.length + ' classe' + (classesExportees.length > 1 ? 's' : '') + ')'}
          </button>
        </div>
      </div>

      <div className="page-content">

        {/* Mode export */}
        <div style={{ display: 'flex', gap: '.5rem', marginBottom: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
          {[
            { id: 'toutes', label: 'Toutes les classes (' + classesAvecProg.length + ')' },
            { id: 'choix',  label: 'Selection manuelle' },
          ].map(opt => (
            <button key={opt.id} onClick={() => setModeExport(opt.id)}
              style={{ padding: '.42rem .875rem', borderRadius: 'var(--r-s)', border: '1.5px solid ' + (modeExport === opt.id ? 'var(--accent)' : 'var(--border)'), background: modeExport === opt.id ? 'var(--accent)' : 'var(--surface)', color: modeExport === opt.id ? '#fff' : 'var(--text2)', fontFamily: 'Roboto, sans-serif', fontSize: '.8rem', fontWeight: 600, cursor: 'pointer', transition: 'all .15s' }}>
              {opt.label}
            </button>
          ))}
          {modeExport === 'choix' && (
            <button onClick={toggleToutes}
              style={{ padding: '.42rem .875rem', borderRadius: 'var(--r-s)', border: '1px solid var(--border)', background: 'var(--surface2)', color: 'var(--text2)', fontFamily: 'Roboto, sans-serif', fontSize: '.78rem', cursor: 'pointer' }}>
              {selClasses.size === classesAvecProg.length ? 'Tout deselectionner' : 'Tout selectionner'}
            </button>
          )}
        </div>

        {/* Liste des classes */}
        <div className="card">
          <div className="card-hd">
            <div className="card-title">
              {modeExport === 'toutes' ? 'Classes incluses' : 'Selectionner les classes (' + selClasses.size + ')'}
            </div>
          </div>
          <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: '.38rem' }}>
            {classesAvecProg.map(cls => {
              const prog = progs[cls.id];
              const nb = prog?.rows?.length || 0;
              const nbCols = prog?.cols?.length || 0;
              const incluse = modeExport === 'toutes' || selClasses.has(cls.id);
              return (
                <button key={cls.id}
                  onClick={() => modeExport === 'choix' && toggleClasse(cls.id)}
                  style={{ display: 'flex', alignItems: 'center', gap: '.75rem', padding: '.55rem .875rem', border: '1.5px solid ' + (incluse ? 'var(--accent)' : 'var(--border)'), borderRadius: 'var(--r-s)', background: incluse ? 'rgba(59,91,219,.06)' : 'var(--surface2)', cursor: modeExport === 'choix' ? 'pointer' : 'default', fontFamily: 'Roboto, sans-serif', transition: 'all .13s', textAlign: 'left' }}>
                  {modeExport === 'choix' && (
                    <div style={{ width: 16, height: 16, borderRadius: 4, border: '2px solid ' + (incluse ? 'var(--accent)' : 'var(--border)'), background: incluse ? 'var(--accent)' : 'transparent', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {incluse && <span style={{ color: '#fff', fontSize: '.6rem', fontWeight: 900 }}>✓</span>}
                    </div>
                  )}
                  <div style={{ width: 40, height: 40, borderRadius: 10, background: incluse ? 'var(--accent)' : 'var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: incluse ? '#fff' : 'var(--text3)', fontWeight: 800, fontSize: '.82rem', flexShrink: 0 }}>
                    {(cls.name || '?').slice(0, 2).toUpperCase()}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, fontSize: '.9rem', color: incluse ? 'var(--text)' : 'var(--text3)' }}>{cls.name}</div>
                    <div style={{ fontSize: '.73rem', color: 'var(--text3)', marginTop: '.1rem' }}>
                      {nb} sequence{nb > 1 ? 's' : ''} · {nbCols} colonne{nbCols > 1 ? 's' : ''}
                    </div>
                  </div>
                  <div style={{ fontSize: '.72rem', color: 'var(--text3)' }}>1 page</div>
                </button>
              );
            })}

            {/* Classes sans progression */}
            {classes.filter(c => !progs[c.id]?.rows?.length).map(cls => (
              <div key={cls.id} style={{ display: 'flex', alignItems: 'center', gap: '.75rem', padding: '.55rem .875rem', border: '1px dashed var(--border)', borderRadius: 'var(--r-s)', opacity: .45 }}>
                <div style={{ width: 40, height: 40, borderRadius: 10, background: 'var(--surface2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text3)', fontWeight: 800, fontSize: '.82rem', flexShrink: 0 }}>
                  {(cls.name || '?').slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <div style={{ fontWeight: 600, fontSize: '.88rem', color: 'var(--text3)' }}>{cls.name}</div>
                  <div style={{ fontSize: '.72rem', color: 'var(--text3)' }}>Aucune progression — non exportable</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Info format */}
        <div className="card" style={{ marginTop: '1rem' }}>
          <div className="card-hd"><div className="card-title">Format du PDF</div></div>
          <div className="card-body" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '.5rem' }}>
            {[
              'Format paysage A4',
              'Une page par classe',
              'Toutes les colonnes',
              'En-tete etablissement + prof',
              'Tableau alterne bicolore',
              'Pagination automatique',
            ].map(item => (
              <div key={item} style={{ display: 'flex', alignItems: 'center', gap: '.5rem', fontSize: '.8rem', color: 'var(--text2)' }}>
                <span style={{ color: 'var(--success)', fontWeight: 700 }}>✓</span>
                {item}
              </div>
            ))}
          </div>
        </div>

      </div>
    </>
  );
}
