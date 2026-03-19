function ModulePdfCarnet({ cpData }) {
  const classes = cpData?.classes || [];
  const fiches = cpData?.fiches || {};
  const profile = cpData?.profile || {};

  const [selCls, setSelCls] = useState(() => classes[0]?.id || null);
  const [mode, setMode] = useState('une'); // 'une' | 'plusieurs'
  const [generating, setGenerating] = useState(false);
  const [done, setDone] = useState(false);

  const cls = classes.find(c => c.id === selCls);
  const clsFiches = (fiches[selCls] || [])
    .slice()
    .sort((a, b) => (a.date || '').localeCompare(b.date || ''));

  const fmtD = (iso) => {
    if (!iso) return '';
    return new Date(iso + 'T12:00').toLocaleDateString('fr-FR', {
      weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
    });
  };

  const CHAMPS = [
    { key: 'objectif',  label: 'Objectifs' },
    { key: 'activite',  label: 'Activite / Deroulement' },
    { key: 'devoirs',   label: 'Devoirs donnes' },
    { key: 'documents', label: 'Documents / Supports' },
    { key: 'aRevoir',   label: 'A revoir' },
  ];

  const drawHeader = (doc, PW, PH, ML, MR, WHITE, ACCENT, GRAY, titre, date, cls, profile, pageNum, total) => {
    doc.setFillColor(...ACCENT);
    doc.rect(0, 0, PW, 22, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(...WHITE);
    doc.text(profile.etablissement || 'ClassPro Desktop', ML, 8);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.text((profile.prenom || '') + ' ' + (profile.nom || '') + ' - ' + (cls?.name || ''), ML, 13.5);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.text(titre || 'Fiche de cours', PW - MR, 8, { align: 'right' });
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    if (date) doc.text(fmtD(date), PW - MR, 13.5, { align: 'right' });
    doc.setFontSize(7);
    doc.setTextColor(...GRAY);
    doc.text(pageNum + ' / ' + total, PW - MR, PH - 8, { align: 'right' });
    doc.text('ClassPro Desktop', ML, PH - 8);
  };

  const genererPdf = async () => {
    if (!cls || clsFiches.length === 0) return;
    if (!window.jspdf) { alert('jsPDF non chargé. Vérifiez que vendor/jspdf.umd.min.js est présent.'); return; }

    setGenerating(true);
    setDone(false);

    try {
      const { jsPDF } = window.jspdf;
      const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      const PW = 210, PH = 297, ML = 15, MR = 15, MB = 15;
      const CW = PW - ML - MR;
      const ACCENT = [59, 91, 219];
      const DARK = [15, 23, 42];
      const GRAY = [100, 116, 139];
      const LIGHT = [241, 245, 249];
      const WHITE = [255, 255, 255];

      if (mode === 'une') {
        // UNE FICHE PAR PAGE
        clsFiches.forEach((fiche, idx) => {
          if (idx > 0) doc.addPage();
          drawHeader(doc, PW, PH, ML, MR, WHITE, ACCENT, GRAY, fiche.titre, fiche.date, cls, profile, idx + 1, clsFiches.length);

          let y = 28;

          CHAMPS.forEach(({ key, label }) => {
            const val = (fiche[key] || '').trim();
            if (!val) return;

            // Label
            doc.setFillColor(...LIGHT);
            doc.roundedRect(ML, y, CW, 6.5, 1, 1, 'F');
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(8);
            doc.setTextColor(...ACCENT);
            doc.text(label, ML + 2.5, y + 4.5);
            y += 8;

            // Contenu
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(9);
            doc.setTextColor(...DARK);
            const lines = doc.splitTextToSize(val, CW - 4);
            lines.forEach(line => {
              if (y > PH - MB - 10) {
                doc.addPage();
                drawHeader(doc, PW, PH, ML, MR, WHITE, ACCENT, GRAY, fiche.titre, fiche.date, cls, profile, idx + 1, clsFiches.length);
                y = 28;
              }
              doc.text(line, ML + 2, y + 3.5);
              y += 5;
            });
            y += 4;
          });

          // Absents
          const elevesCls = cls?.eleves || [];
          const nomsAbsents = (fiche.absents || [])
            .map(id => elevesCls.find(e => e.id === id)?.nom)
            .filter(Boolean).join(', ');
          if (nomsAbsents) {
            doc.setFillColor(254, 242, 242);
            doc.roundedRect(ML, y, CW, 6.5, 1, 1, 'F');
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(8);
            doc.setTextColor(220, 38, 38);
            doc.text('Absents', ML + 2.5, y + 4.5);
            y += 8;
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(9);
            doc.setTextColor(...DARK);
            doc.splitTextToSize(nomsAbsents, CW - 4).forEach(line => {
              doc.text(line, ML + 2, y + 3.5); y += 5;
            });
          }
        });

      } else {
        // PLUSIEURS FICHES PAR PAGE (2x2)
        const colW = (CW - 5) / 2;
        const colH = 112;
        const totalPages = Math.ceil(clsFiches.length / 4);
        let page = 0;

        for (let ficheIdx = 0; ficheIdx < clsFiches.length; ficheIdx++) {
          const slot = ficheIdx % 4;
          if (slot === 0) {
            if (page > 0) doc.addPage();
            page++;
            drawHeader(doc, PW, PH, ML, MR, WHITE, ACCENT, GRAY, cls.name + ' - Carnet de bord', null, cls, profile, page, totalPages);
          }
          const fiche = clsFiches[ficheIdx];
          const col = slot % 2;
          const row = Math.floor(slot / 2);
          const x = ML + col * (colW + 5);
          const y0 = 26 + row * (colH + 4);

          // Cadre
          doc.setDrawColor(220, 230, 250);
          doc.setLineWidth(0.4);
          doc.roundedRect(x, y0, colW, colH, 2, 2, 'S');

          // Header fiche
          doc.setFillColor(...ACCENT);
          doc.roundedRect(x, y0, colW, 11, 2, 2, 'F');
          doc.rect(x, y0 + 6, colW, 5, 'F');
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(7.5);
          doc.setTextColor(...WHITE);
          const titreShort = (fiche.titre || 'Sans titre').slice(0, 32);
          doc.text(titreShort, x + 2.5, y0 + 5);
          doc.setFont('helvetica', 'normal');
          doc.setFontSize(6.5);
          doc.text(fmtD(fiche.date), x + 2.5, y0 + 9.5);

          let fy = y0 + 14;
          const maxY = y0 + colH - 3;

          CHAMPS.forEach(({ key, label }) => {
            const val = (fiche[key] || '').trim();
            if (!val || fy >= maxY - 8) return;
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(6);
            doc.setTextColor(...ACCENT);
            doc.text(label, x + 2, fy);
            fy += 3.5;
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(6.5);
            doc.setTextColor(...DARK);
            const lines = doc.splitTextToSize(val, colW - 4);
            const maxLines = Math.max(1, Math.floor((maxY - fy) / 4));
            lines.slice(0, maxLines).forEach(line => { doc.text(line, x + 2, fy); fy += 4; });
            if (lines.length > maxLines) { doc.setTextColor(...GRAY); doc.text('...', x + 2, fy); }
            fy += 2;
          });
        }
      }

      // Sauvegarder
      const nomClasse = (cls.name || 'classe').replace(/[^a-zA-Z0-9]/g, '_');
      const dateStr = new Date().toLocaleDateString('fr-FR').replace(/\//g, '-');
      const defaultName = 'Carnet_' + nomClasse + '_' + dateStr + '.pdf';
      const pdfBase64 = doc.output('datauristring').split(',')[1];
      const result = await window.cpd.savePdf(pdfBase64, defaultName);
      if (result?.ok) { setDone(true); setTimeout(() => setDone(false), 3000); }

    } catch (err) {
      console.error('Erreur PDF:', err);
      alert('Erreur : ' + err.message);
    }
    setGenerating(false);
  };

  if (!cpData) return <ModulePlaceholder icon="📄" title="PDF Carnet de bord" sub="Ouvrez d'abord un fichier ClassPro." />;

  return (
    <>
      <div className="page-hd">
        <div>
          <div className="phd-badge">📄 PDF</div>
          <div className="phd-title">PDF Carnet de bord</div>
          <div className="phd-sub">{cls ? cls.name + ' · ' + clsFiches.length + ' fiche(s)' : 'Selectionnez une classe'}</div>
        </div>
        <div className="phd-actions">
          <button className="btn btn-primary" onClick={genererPdf} disabled={!selCls || clsFiches.length === 0 || generating}>
            {generating ? 'Generation...' : done ? 'PDF sauvegarde !' : 'Generer le PDF'}
          </button>
        </div>
      </div>

      <div className="page-content">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', maxWidth: 760 }}>

          <div className="card">
            <div className="card-hd"><div className="card-title">Classe a exporter</div></div>
            <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: '.5rem' }}>
              {classes.length === 0 ? (
                <div style={{ color: 'var(--text3)', fontSize: '.82rem' }}>Aucune classe disponible.</div>
              ) : classes.map(c => {
                const nb = (fiches[c.id] || []).length;
                return (
                  <button key={c.id} onClick={() => setSelCls(c.id)}
                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '.55rem .875rem', border: '1.5px solid ' + (selCls === c.id ? 'var(--accent)' : 'var(--border)'), borderRadius: 'var(--r-s)', background: selCls === c.id ? 'rgba(59,91,219,.07)' : 'var(--surface)', cursor: 'pointer', fontFamily: 'Roboto, sans-serif', fontSize: '.85rem', fontWeight: selCls === c.id ? 700 : 400, color: selCls === c.id ? 'var(--accent)' : 'var(--text)', transition: 'all .15s' }}>
                    <span>{c.name}</span>
                    <span style={{ fontSize: '.72rem', color: 'var(--text3)' }}>{nb} fiche{nb > 1 ? 's' : ''}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="card">
            <div className="card-hd"><div className="card-title">Options de mise en page</div></div>
            <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: '.75rem' }}>
              <div style={{ fontSize: '.72rem', fontWeight: 700, color: 'var(--text2)', textTransform: 'uppercase', letterSpacing: '.07em' }}>Format</div>
              {[
                { id: 'une', label: 'Une fiche par page', desc: 'Detaille, ideal pour l\'impression individuelle' },
                { id: 'plusieurs', label: 'Plusieurs fiches par page', desc: '4 fiches par page (2x2), format compact' },
              ].map(opt => (
                <button key={opt.id} onClick={() => setMode(opt.id)}
                  style={{ display: 'flex', alignItems: 'flex-start', gap: '.75rem', padding: '.65rem .875rem', border: '1.5px solid ' + (mode === opt.id ? 'var(--accent)' : 'var(--border)'), borderRadius: 'var(--r-s)', background: mode === opt.id ? 'rgba(59,91,219,.07)' : 'var(--surface)', cursor: 'pointer', textAlign: 'left', transition: 'all .15s', fontFamily: 'Roboto, sans-serif' }}>
                  <div style={{ width: 16, height: 16, borderRadius: '50%', border: '2px solid ' + (mode === opt.id ? 'var(--accent)' : 'var(--border)'), background: mode === opt.id ? 'var(--accent)' : 'transparent', flexShrink: 0, marginTop: 2, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {mode === opt.id && <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#fff' }} />}
                  </div>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '.85rem', color: mode === opt.id ? 'var(--accent)' : 'var(--text)' }}>{opt.label}</div>
                    <div style={{ fontSize: '.73rem', color: 'var(--text3)', marginTop: '.15rem' }}>{opt.desc}</div>
                  </div>
                </button>
              ))}
              <div style={{ padding: '.65rem', background: 'var(--surface2)', borderRadius: 'var(--r-s)', border: '1px solid var(--border)', fontSize: '.75rem', color: 'var(--text2)', lineHeight: 1.6 }}>
                Contenu inclus : titre, date, objectifs, activite, devoirs, documents, a revoir, absents
              </div>
            </div>
          </div>
        </div>

        {selCls && (
          <div className="card" style={{ marginTop: '1rem', maxWidth: 760 }}>
            <div className="card-hd"><div className="card-title">Fiches a exporter ({clsFiches.length})</div></div>
            <div className="card-body">
              {clsFiches.length === 0 ? (
                <div style={{ color: 'var(--text3)', fontSize: '.82rem', fontStyle: 'italic' }}>
                  Aucune fiche pour cette classe. Creez des fiches dans le module Carnet de bord.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '.32rem' }}>
                  {clsFiches.map((f, i) => (
                    <div key={f.id} style={{ display: 'flex', alignItems: 'center', gap: '.75rem', padding: '.38rem .65rem', background: 'var(--surface2)', borderRadius: 'var(--r-xs)', fontSize: '.8rem' }}>
                      <span style={{ color: 'var(--text3)', fontWeight: 600, minWidth: 24 }}>#{i + 1}</span>
                      <span style={{ flex: 1, fontWeight: 500 }}>{f.titre || 'Sans titre'}</span>
                      <span style={{ color: 'var(--text3)', fontSize: '.72rem' }}>{fmtD(f.date)}</span>
                      {(f.absents || []).length > 0 && <span style={{ color: 'var(--danger)', fontSize: '.7rem', fontWeight: 600 }}>{f.absents.length} absent(s)</span>}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </>
  );
}

// ── MODULE PDF BULLETINS ─────────────────────────────────────────────────────