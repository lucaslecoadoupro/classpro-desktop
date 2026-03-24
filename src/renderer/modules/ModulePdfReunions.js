/* ═══════════════════════════════════════════════════════════════════════════
   ModulePdfReunions.js — Génération PDF Réunions & Rencontres
   ClassPro Desktop — utilise jsPDF (disponible via window.jsPDF ou require)
   ═══════════════════════════════════════════════════════════════════════════ */

function ModulePdfReunions({ cpData }) {
  const reunions   = cpData?.reunions   || [];
  const rencontres = cpData?.rencontres || [];
  const profile    = cpData?.profile    || {};
  const classes    = cpData?.classes    || [];

  const [tab,       setTab]      = useState('reunions');
  const [selIds,    setSelIds]   = useState([]);   // ids sélectionnés pour export
  const [generating, setGen]     = useState(false);

  const isReunion = tab === 'reunions';
  const items     = isReunion ? reunions : rencontres;

  const cls = (id) => classes.find(c => c.id === id);

  // ── Sélection ─────────────────────────────────────────────────────────────
  const toggleSel = (id) => setSelIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  const selectAll = () => setSelIds(items.map(i => i.id));
  const clearSel  = () => setSelIds([]);

  const selected = items.filter(i => selIds.includes(i.id));

  // ── Génération PDF ────────────────────────────────────────────────────────
  const handleGenerate = async () => {
    if (selected.length === 0) return;
    setGen(true);

    try {
      // jsPDF est chargé comme dépendance npm dans le main process et exposé via preload,
      // ou disponible globalement si injecté dans le renderer.
      const { jsPDF } = window.jspdf || require('jspdf');
      require('jspdf-autotable'); // plugin autoTable

      const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      const W = 210, margin = 14;
      let y = 0;

      const pageHeader = (pageNum) => {
        // Bandeau bleu
        doc.setFillColor(30, 58, 138);
        doc.rect(0, 0, W, 28, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(13);
        doc.text(isReunion ? 'Réunions institutionnelles' : 'Rencontres parents-professeurs', margin, 11);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);
        const sub = [profile.prenom, profile.nom].filter(Boolean).join(' ');
        doc.text(`${sub}${profile.etablissement ? ' · ' + profile.etablissement : ''}${profile.annee ? ' · ' + profile.annee : ''}`, margin, 18);
        doc.text(`Généré le ${new Date().toLocaleDateString('fr-FR')} · Page ${pageNum}`, W - margin, 18, { align: 'right' });
        // Trait décoratif doré
        doc.setFillColor(212, 180, 131);
        doc.rect(0, 28, W, 1.2, 'F');
        doc.setTextColor(0, 0, 0);
      };

      let page = 1;
      pageHeader(page);
      y = 38;

      const sorted = [...selected].sort((a, b) => (b.date || '').localeCompare(a.date || ''));

      sorted.forEach((item, idx) => {
        const past = item.date && new Date(item.date + 'T12:00') < new Date();

        // Estimation hauteur nécessaire
        const needH = isReunion ? 75 : 85;
        if (y + needH > 280) {
          doc.addPage();
          page++;
          pageHeader(page);
          y = 38;
        }

        // Carte de l'item
        const cardX = margin;
        const cardW = W - margin * 2;

        // Fond léger
        doc.setFillColor(248, 250, 252);
        doc.roundedRect(cardX, y, cardW, needH, 3, 3, 'F');

        // Bordure gauche colorée
        doc.setFillColor(past ? 148, 163, 184 : 34, 197, 94);
        doc.rect(cardX, y, 3, needH, 'F');

        // Badge statut
        const badgeX = W - margin - 28;
        doc.setFillColor(past ? 241 : 240, past ? 245 : 253, past ? 255 : 244);
        doc.roundedRect(badgeX, y + 4, 26, 6, 2, 2, 'F');
        doc.setFontSize(6.5);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(past ? 100 : 22, past ? 116 : 163, past ? 139 : 74);
        doc.text(past ? 'Passé' : 'À venir', badgeX + 13, y + 8.5, { align: 'center' });

        // Titre / Nom élève
        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(15, 23, 42);
        const mainTitle = isReunion
          ? (item.titre || 'Sans titre')
          : `${item.eleveName || 'Élève inconnu'}${item.parentName ? ' · ' + item.parentName : ''}`;
        doc.text(mainTitle, cardX + 7, y + 10);

        // Sous-titre date/lieu
        doc.setFontSize(8);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(71, 85, 105);
        const sub2 = [
          item.date ? new Date(item.date + 'T12:00').toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' }) : null,
          item.heure || null,
          item.lieu || null,
          (!isReunion && item.classId) ? (cls(item.classId)?.name || item.classId) : null,
        ].filter(Boolean).join(' · ');
        doc.text(sub2, cardX + 7, y + 17);

        // Séparateur léger
        doc.setDrawColor(226, 232, 240);
        doc.line(cardX + 7, y + 21, cardX + cardW - 7, y + 21);

        let fy = y + 27;

        const drawField = (label, val) => {
          if (!val?.trim()) return;
          const lines = doc.splitTextToSize(val, cardW - 22);
          const blockH = 5 + lines.length * 4.5;
          if (fy + blockH > y + needH - 4) return; // overflow guard
          doc.setFontSize(6.5);
          doc.setFont('helvetica', 'bold');
          doc.setTextColor(100, 116, 139);
          doc.text(label.toUpperCase(), cardX + 7, fy);
          fy += 4;
          doc.setFontSize(8);
          doc.setFont('helvetica', 'normal');
          doc.setTextColor(30, 41, 59);
          doc.text(lines, cardX + 7, fy);
          fy += lines.length * 4.5 + 3;
        };

        if (isReunion) {
          drawField('Participants', item.participants);
          drawField("Ordre du jour", item.ordreJour);
          drawField('Compte-rendu', item.compteRendu);
        } else {
          drawField('Motif', item.motif);
          drawField('Compte-rendu', item.compteRendu);
          drawField('Suivi / Actions', item.suivi);
        }

        y += needH + 6;
      });

      // Pied de page — dernière page
      doc.setFontSize(7);
      doc.setTextColor(148, 163, 184);
      doc.setFont('helvetica', 'normal');
      doc.text(`ClassPro Desktop · ${selected.length} ${isReunion ? 'réunion(s)' : 'rencontre(s)'} exportée(s)`, W / 2, 292, { align: 'center' });

      // Nom du fichier
      const nomFichier = [
        isReunion ? 'Reunions' : 'Rencontres',
        profile.nom ? profile.nom.toUpperCase() : '',
        new Date().toLocaleDateString('fr-FR').replace(/\//g, '-'),
      ].filter(Boolean).join('_') + '.pdf';

      doc.save(nomFichier);
    } catch (err) {
      console.error('[ModulePdfReunions] Erreur génération PDF :', err);
      alert('Erreur lors de la génération du PDF : ' + err.message);
    } finally {
      setGen(false);
    }
  };

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <>
      <div className="page-hd">
        <div>
          <div className="phd-badge">📄 Génération PDF</div>
          <div className="phd-title">PDF {isReunion ? 'Réunions' : 'Rencontres parents'}</div>
          <div className="phd-sub">
            {selected.length > 0
              ? `${selected.length} élément(s) sélectionné(s) · prêt à exporter`
              : `${items.length} élément(s) disponible(s)`}
          </div>
        </div>
        <div className="phd-actions">
          {selected.length > 0 && (
            <button
              className="btn btn-ghost"
              onClick={handleGenerate}
              disabled={generating}
              style={{ opacity: generating ? .6 : 1 }}
            >
              {generating ? '⏳ Génération…' : '⬇️ Générer le PDF'}
            </button>
          )}
        </div>
        <div className="phd-stats">
          <div className="phstat"><div className="phstat-label">Disponibles</div><div className="phstat-value">{items.length}</div></div>
          <div className="phstat"><div className="phstat-label">Sélectionnés</div><div className="phstat-value">{selected.length}</div></div>
        </div>
      </div>

      <div className="page-content" style={{ paddingTop: '.875rem' }}>

        {/* Tabs */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '.75rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
          <div className="seg">
            <button className={tab === 'reunions' ? 'on' : ''} onClick={() => { setTab('reunions'); setSelIds([]); }}>
              🏫 Réunions ({reunions.length})
            </button>
            <button className={tab === 'rencontres' ? 'on' : ''} onClick={() => { setTab('rencontres'); setSelIds([]); }}>
              👨‍👩‍👧 Rencontres ({rencontres.length})
            </button>
          </div>
          {items.length > 0 && (
            <div style={{ display: 'flex', gap: '.38rem', marginLeft: 'auto' }}>
              <button className="btn btn-sm" onClick={selectAll}>Tout sélectionner</button>
              {selIds.length > 0 && <button className="btn btn-sm" onClick={clearSel}>Désélectionner</button>}
            </div>
          )}
        </div>

        {/* Aucun item */}
        {items.length === 0 && (
          <div className="empty">
            <div className="empty-icon">📄</div>
            <div>Aucune {isReunion ? 'réunion' : 'rencontre'} enregistrée.</div>
            <div style={{ fontSize: '.78rem', color: 'var(--text3)', marginTop: '.35rem' }}>
              Créez d'abord des entrées dans le module <strong>Réunions & Rencontres</strong>.
            </div>
          </div>
        )}

        {/* Liste de sélection */}
        {items.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '.45rem' }}>
            {[...items].sort((a, b) => (b.date || '').localeCompare(a.date || '')).map(item => {
              const isSel = selIds.includes(item.id);
              const past  = item.date && new Date(item.date + 'T12:00') < new Date();
              return (
                <div
                  key={item.id}
                  onClick={() => toggleSel(item.id)}
                  style={{
                    padding: '.65rem 1rem',
                    borderRadius: 'var(--r-s)',
                    border: `1.5px solid ${isSel ? 'var(--accent)' : 'var(--border)'}`,
                    background: isSel ? 'rgba(59,91,219,.07)' : 'var(--surface)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '.75rem',
                    transition: 'all .13s',
                  }}
                >
                  {/* Checkbox custom */}
                  <div style={{
                    width: 18, height: 18, borderRadius: 5, flexShrink: 0,
                    border: `2px solid ${isSel ? 'var(--accent)' : 'var(--border)'}`,
                    background: isSel ? 'var(--accent)' : 'transparent',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all .13s',
                  }}>
                    {isSel && <span style={{ color: '#fff', fontSize: '.7rem', lineHeight: 1 }}>✓</span>}
                  </div>

                  <div style={{ fontSize: '1.2rem', flexShrink: 0 }}>{isReunion ? '🏫' : '👨‍👩‍👧'}</div>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 700, fontSize: '.85rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {isReunion
                        ? (item.titre || 'Sans titre')
                        : `${item.eleveName || 'Élève inconnu'}${item.parentName ? ' · ' + item.parentName : ''}`}
                    </div>
                    <div style={{ fontSize: '.72rem', color: 'var(--text2)', marginTop: '.1rem' }}>
                      {item.date ? new Date(item.date + 'T12:00').toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' }) : '—'}
                      {item.heure ? ` · ${item.heure}` : ''}
                      {item.lieu ? ` · ${item.lieu}` : ''}
                    </div>
                  </div>

                  <span style={{
                    fontSize: '.62rem', fontWeight: 700, padding: '.12rem .45rem', borderRadius: 99, flexShrink: 0,
                    background: past ? 'var(--surface2)' : 'rgba(34,197,94,.1)',
                    color: past ? 'var(--text3)' : '#16a34a',
                    border: `1px solid ${past ? 'var(--border)' : 'rgba(34,197,94,.25)'}`,
                  }}>
                    {past ? 'Passé' : 'À venir'}
                  </span>
                </div>
              );
            })}
          </div>
        )}

        {/* Bouton export bas de page */}
        {selected.length > 0 && (
          <div style={{ marginTop: '1.5rem', display: 'flex', justifyContent: 'flex-end' }}>
            <button
              className="btn btn-primary"
              onClick={handleGenerate}
              disabled={generating}
              style={{ opacity: generating ? .6 : 1, minWidth: 200 }}
            >
              {generating ? '⏳ Génération en cours…' : `📄 Générer le PDF (${selected.length})`}
            </button>
          </div>
        )}
      </div>
    </>
  );
}
