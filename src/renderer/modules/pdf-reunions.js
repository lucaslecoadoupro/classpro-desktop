// ── MODULE PDF RÉUNIONS ────────────────────────────────────────────────────────

function ModulePdfReunions({ cpData }) {
  const reunions = cpData?.reunions || [];
  const profile  = cpData?.profile  || {};

  const [selId,      setSelId]      = useState(reunions[0]?.id || null);
  const [generating, setGenerating] = useState(false);
  const [done,       setDone]       = useState(false);

  const reunion = reunions.find(r => r.id === selId) || null;
  const type    = reunion ? (REUNION_TYPES.find(t => t.id === reunion.type) || REUNION_TYPES[0]) : null;

  const hexToRgb = hex => {
    const r = parseInt(hex.slice(1,3),16);
    const g = parseInt(hex.slice(3,5),16);
    const b = parseInt(hex.slice(5,7),16);
    return [r, g, b];
  };

  const genererPdf = async () => {
    if (!reunion) return;
    if (!window.jspdf) { alert('jsPDF non chargé.'); return; }
    setGenerating(true); setDone(false);

    try {
      const { jsPDF } = window.jspdf;
      const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      const PW = 210, PH = 297, ML = 16, MR = 16, MB = 16;
      const CW = PW - ML - MR;

      const NAVY   = [30, 58, 138];
      const WHITE  = [255, 255, 255];
      const DARK   = [15, 23, 42];
      const GRAY   = [100, 116, 139];
      const LIGHT  = [241, 245, 249];
      const BORDER = [226, 232, 240];
      const TYPE_C = hexToRgb(type.color);

      let y = 0;

      // ── Header ──────────────────────────────────────────────────────────────
      // Bande navy
      doc.setFillColor(...NAVY);
      doc.rect(0, 0, PW, 30, 'F');
      // Accent couleur type
      doc.setFillColor(...TYPE_C);
      doc.rect(0, 30, PW, 4, 'F');

      // Établissement
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(...WHITE);
      doc.text(profile.etablissement || 'ClassPro Desktop', ML, 10);

      // Prof
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(147, 197, 253); // bleu clair
      doc.text((profile.prenom || '') + ' ' + (profile.nom || ''), ML, 16);

      // Type de réunion (droite)
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(...WHITE);
      doc.text(type.label, PW - MR, 10, { align: 'right' });

      // Date (droite)
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(147, 197, 253);
      const dateStr = reunion.champs?.date ? new Date(reunion.champs.date + 'T12:00').toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }) : '';
      doc.text(dateStr, PW - MR, 16, { align: 'right' });

      // Titre réunion
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.setTextColor(...WHITE);
      const titre = reunion.titre || type.label;
      doc.text(titre.length > 60 ? titre.slice(0, 57) + '…' : titre, ML, 24);

      y = 42;

      // ── Bloc méta ────────────────────────────────────────────────────────────
      const metaItems = [
        reunion.champs?.heure  && ['🕐 Heure', reunion.champs.heure],
        reunion.champs?.lieu   && ['📍 Lieu', reunion.champs.lieu],
      ].filter(Boolean);

      if (metaItems.length > 0) {
        const bw = CW / metaItems.length;
        metaItems.forEach(([label, val], i) => {
          const x = ML + i * bw;
          doc.setFillColor(...LIGHT);
          doc.roundedRect(x, y, bw - 2, 12, 2, 2, 'F');
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(7);
          doc.setTextColor(...GRAY);
          doc.text(label, x + 3, y + 5);
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(9);
          doc.setTextColor(...DARK);
          doc.text(val, x + 3, y + 10);
        });
        y += 17;
      }

      // ── Fonction pour dessiner un bloc ────────────────────────────────────
      const drawBloc = (label, content, accentColor) => {
        if (!content?.trim()) return;
        const c = accentColor || NAVY;

        // Vérifier si on déborde
        const lines = doc.splitTextToSize(content, CW - 6);
        const blocH = 8 + lines.length * 5 + 4;
        if (y + blocH > PH - MB - 10) {
          doc.addPage();
          // Mini header page 2+
          doc.setFillColor(...NAVY);
          doc.rect(0, 0, PW, 14, 'F');
          doc.setFillColor(...TYPE_C);
          doc.rect(0, 14, PW, 2, 'F');
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(8);
          doc.setTextColor(...WHITE);
          doc.text(titre.length > 50 ? titre.slice(0, 47) + '…' : titre, ML, 9);
          doc.setFont('helvetica', 'normal');
          doc.setFontSize(7);
          doc.setTextColor(147, 197, 253);
          doc.text(type.label, PW - MR, 9, { align: 'right' });
          y = 22;
        }

        // Label section
        doc.setFillColor(...c, 0.08);
        doc.setFillColor(c[0], c[1], c[2]);
        doc.rect(ML, y, 3, 6.5, 'F');
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8);
        doc.setTextColor(...c);
        doc.text(label.toUpperCase(), ML + 5, y + 4.8);
        y += 8;

        // Contenu
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9);
        doc.setTextColor(...DARK);
        lines.forEach(line => {
          if (y > PH - MB - 8) {
            doc.addPage();
            doc.setFillColor(...NAVY);
            doc.rect(0, 0, PW, 14, 'F');
            doc.setFillColor(...TYPE_C);
            doc.rect(0, 14, PW, 2, 'F');
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(8);
            doc.setTextColor(...WHITE);
            doc.text(titre.length > 50 ? titre.slice(0, 47) + '…' : titre, ML, 9);
            y = 22;
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(9);
            doc.setTextColor(...DARK);
          }
          doc.text(line, ML + 5, y);
          y += 5;
        });

        // Filet bas
        doc.setDrawColor(...BORDER);
        doc.setLineWidth(0.3);
        doc.line(ML, y + 2, ML + CW, y + 2);
        y += 7;
      };

      // ── Champs communs ────────────────────────────────────────────────────
      const champsCommuns = CHAMPS_COMMUNS.slice(3); // date/heure/lieu déjà dans méta
      champsCommuns.forEach(c => {
        drawBloc(c.label, reunion.champs?.[c.id], NAVY);
      });

      // ── Séparateur type ───────────────────────────────────────────────────
      const specifiques = CHAMPS_SPECIFIQUES[reunion.type] || [];
      if (specifiques.some(c => reunion.champs?.[c.id]?.trim())) {
        doc.setFillColor(...TYPE_C);
        doc.rect(ML, y, CW, 8, 'F');
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8);
        doc.setTextColor(...WHITE);
        doc.text(`${type.label} — Informations spécifiques`, ML + 4, y + 5.5);
        y += 12;
      }

      // ── Champs spécifiques ────────────────────────────────────────────────
      specifiques.forEach(c => {
        drawBloc(c.label, reunion.champs?.[c.id], TYPE_C);
      });

      // ── Footer ────────────────────────────────────────────────────────────
      const totalPages = doc.internal.getNumberOfPages();
      for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i);
        doc.setDrawColor(...BORDER);
        doc.setLineWidth(0.4);
        doc.line(ML, PH - 10, PW - MR, PH - 10);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7);
        doc.setTextColor(...GRAY);
        doc.text('ClassPro Desktop', ML, PH - 6);
        doc.text(`${i} / ${totalPages}`, PW - MR, PH - 6, { align: 'right' });
      }

      // ── Sauvegarde ────────────────────────────────────────────────────────
      const slug = (reunion.titre || type.label).replace(/[^a-zA-Z0-9]/g, '_').slice(0, 30);
      const dateSlug = reunion.champs?.date?.replace(/-/g, '') || new Date().toLocaleDateString('fr-FR').replace(/\//g, '');
      const defaultName = `Reunion_${slug}_${dateSlug}.pdf`;
      const pdfBase64 = doc.output('datauristring').split(',')[1];
      const result = await window.cpd.savePdf(pdfBase64, defaultName);
      if (result?.ok) {
        setDone(true);
        setTimeout(() => setDone(false), 3000);
        cpdUnlockBadge && cpdUnlockBadge('first_pdf');
        cpdTrackPdf && cpdTrackPdf('reunion');
      }

    } catch (err) {
      console.error('Erreur PDF Réunion:', err);
      alert('Erreur : ' + err.message);
    }
    setGenerating(false);
  };

  if (!cpData) return <ModulePlaceholder icon="📄" title="PDF Réunion" sub="Ouvrez d'abord un fichier ClassPro." />;

  return (
    <>
      <div className="page-hd">
        <div>
          <div className="phd-badge">📄 PDF</div>
          <div className="phd-title">PDF Réunion</div>
          <div className="phd-sub">{reunion ? (reunion.titre || type?.label) : 'Sélectionnez une réunion'}</div>
        </div>
        <div className="phd-actions">
          <button className="btn btn-primary"
            onClick={genererPdf}
            disabled={!selId || !reunion || generating}>
            {generating ? 'Génération…' : done ? '✅ PDF sauvegardé !' : '📄 Générer le PDF'}
          </button>
        </div>
      </div>

      <div className="page-content">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', maxWidth: 760 }}>

          {/* Sélection réunion */}
          <div className="card">
            <div className="card-hd"><div className="card-title">Réunion à exporter</div></div>
            <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: '.4rem' }}>
              {reunions.length === 0 ? (
                <div style={{ color: 'var(--text3)', fontSize: '.82rem', fontStyle: 'italic' }}>
                  Aucune réunion. Créez-en une depuis le module Réunions.
                </div>
              ) : reunions.map(r => {
                const t = REUNION_TYPES.find(x => x.id === r.type) || REUNION_TYPES[0];
                return (
                  <button key={r.id} onClick={() => setSelId(r.id)}
                    style={{ display: 'flex', alignItems: 'center', gap: '.65rem', padding: '.5rem .875rem', border: `1.5px solid ${selId === r.id ? t.color : 'var(--border)'}`, borderRadius: 'var(--r-s)', background: selId === r.id ? t.color + '10' : 'var(--surface)', cursor: 'pointer', fontFamily: 'Roboto, sans-serif', textAlign: 'left', transition: 'all .13s' }}>
                    <span style={{ fontSize: '1rem' }}>{t.icon}</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 600, fontSize: '.85rem', color: selId === r.id ? t.color : 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.titre || t.label}</div>
                      <div style={{ fontSize: '.7rem', color: 'var(--text3)' }}>{r.champs?.date ? new Date(r.champs.date + 'T12:00').toLocaleDateString('fr-FR') : '—'}</div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Aperçu */}
          <div className="card">
            <div className="card-hd"><div className="card-title">Aperçu du contenu</div></div>
            <div className="card-body">
              {!reunion ? (
                <div style={{ color: 'var(--text3)', fontSize: '.82rem', fontStyle: 'italic' }}>Sélectionnez une réunion.</div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '.5rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '.5rem', padding: '.5rem .75rem', background: type.color + '10', borderRadius: 8, border: `1px solid ${type.color}25` }}>
                    <span style={{ fontSize: '1.1rem' }}>{type.icon}</span>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '.85rem', color: type.color }}>{type.label}</div>
                      <div style={{ fontSize: '.72rem', color: 'var(--text3)' }}>{reunion.titre}</div>
                    </div>
                  </div>
                  {[...CHAMPS_COMMUNS.slice(3), ...(CHAMPS_SPECIFIQUES[reunion.type] || [])].map(c => {
                    const val = reunion.champs?.[c.id];
                    if (!val?.trim()) return null;
                    return (
                      <div key={c.id} style={{ display: 'flex', alignItems: 'center', gap: '.4rem', fontSize: '.75rem' }}>
                        <span style={{ color: 'var(--success)', fontWeight: 700 }}>✓</span>
                        <span style={{ color: 'var(--text2)' }}>{c.label}</span>
                      </div>
                    );
                  })}
                  {[...CHAMPS_COMMUNS.slice(3), ...(CHAMPS_SPECIFIQUES[reunion.type] || [])].every(c => !reunion.champs?.[c.id]?.trim()) && (
                    <div style={{ fontSize: '.78rem', color: 'var(--text3)', fontStyle: 'italic' }}>
                      Aucun champ rempli — le PDF sera vide.
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Info format */}
        <div className="card" style={{ marginTop: '1rem', maxWidth: 760 }}>
          <div className="card-hd"><div className="card-title">Format du PDF</div></div>
          <div className="card-body" style={{ display: 'flex', flexWrap: 'wrap', gap: '.5rem' }}>
            {['Format portrait A4', 'En-tête établissement + prof', 'Couleur par type de réunion', 'Champs communs + spécifiques', 'Pagination automatique'].map(item => (
              <div key={item} style={{ display: 'flex', alignItems: 'center', gap: '.4rem', fontSize: '.8rem', color: 'var(--text2)', minWidth: 200 }}>
                <span style={{ color: 'var(--success)', fontWeight: 700 }}>✓</span> {item}
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
