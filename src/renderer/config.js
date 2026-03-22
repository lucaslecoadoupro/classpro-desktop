/* ═══════════════════════════════════════════════════════════════════════════
   ClassPro Desktop — app.js
   Renderer React principal
   ═══════════════════════════════════════════════════════════════════════════ */
const { useState, useEffect, useCallback, useMemo } = React;

// ── Logo SVG (identique à ClassPro) ─────────────────────────────────────────
const LOGO_SVG = `<svg width="34" height="38" viewBox="0 0 100 110" xmlns="http://www.w3.org/2000/svg"><defs><linearGradient id="sf" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#1a1a1a"/><stop offset="100%" stop-color="#0d0d0d"/></linearGradient><linearGradient id="gs" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#d4b483"/><stop offset="100%" stop-color="#a8864e"/></linearGradient><linearGradient id="bpl" x1="1" y1="0" x2="0" y2="0"><stop offset="0%" stop-color="#ffffff"/><stop offset="100%" stop-color="#c8c8c8"/></linearGradient><linearGradient id="bpr" x1="0" y1="0" x2="1" y2="0"><stop offset="0%" stop-color="#ffffff"/><stop offset="100%" stop-color="#c8c8c8"/></linearGradient></defs><path d="M50 8 L84 22 L84 58 Q84 80 50 96 Q16 80 16 58 L16 22 Z" fill="url(#sf)" stroke="url(#gs)" stroke-width="2.8" stroke-linejoin="round"/><path d="M50 63 Q40 60 30 63 L30 44 Q40 41 50 44 Z" fill="url(#bpl)" stroke="#b8b8b8" stroke-width="0.4"/><path d="M50 63 Q60 60 70 63 L70 44 Q60 41 50 44 Z" fill="url(#bpr)" stroke="#b8b8b8" stroke-width="0.4"/><line x1="50" y1="44" x2="50" y2="63" stroke="#a0a0a0" stroke-width="1.2"/><path d="M30 63 Q40 67 50 65 Q60 67 70 63" fill="none" stroke="#b0b0b0" stroke-width="1"/><ellipse cx="50" cy="66" rx="20" ry="2" fill="#000" opacity="0.25"/><line x1="50" y1="16" x2="50" y2="26" stroke="#d4b483" stroke-width="1.6" stroke-linecap="round"/><line x1="44" y1="21" x2="56" y2="21" stroke="#d4b483" stroke-width="1.6" stroke-linecap="round"/></svg>`;

// ── Navigation ───────────────────────────────────────────────────────────────
const NAV = [
  { section: 'Vue générale', items: [
    { id: 'accueil',      icon: '🏠', label: 'Accueil' },
  ]},
  { section: 'Gestion administrative', items: [
    { id: 'classes',      icon: '👥', label: 'Classes & élèves' },
    { id: 'edt',          icon: '📅', label: 'Emploi du temps' },
  ]},
  { section: 'Préparer', items: [
    { id: 'cours',        icon: '✏️', label: 'Créer un cours' },
    { id: 'progression',  icon: '📆', label: 'Progression annuelle' },
    { id: 'plan-classe',  icon: '🏫', label: 'Plan de classe' },
  ]},
  { section: 'Suivi pédagogique', items: [
    { id: 'suivi',        icon: '👁️', label: 'Suivi de classe' },
    { id: 'carnet',       icon: '📓', label: 'Carnet de bord' },
    { id: 'devoirs',      icon: '📋', label: 'Travaux non rendus' },
    { id: 'conseil',      icon: '🎓', label: 'Conseil de classe' },
  ]},
  { section: 'Génération PDF', items: [
    { id: 'pdf-progression', icon: '📄', label: 'PDF Progression' },
    { id: 'pdf-carnet',      icon: '📄', label: 'PDF Carnet de bord' },
    { id: 'pdf-bulletins',   icon: '📄', label: 'PDF Bulletins' },
  ]},
  { section: 'ClassPro Académie', items: [
    { id: 'academie',  icon: '📖', label: "Centre d'aide" },
    { id: 'classpro',  icon: '🛡️', label: 'ClassPro (logiciel)' },
  ]},
];

// ── Helpers ──────────────────────────────────────────────────────────────────
function parseClassProJson(data) {
  // Le JSON ClassPro a la forme { version, date, entries: { 'cdc-profile': '...', ... } }
  if (!data || !data.entries) return null;
  const entries = data.entries;
  const parse = (key) => { try { return JSON.parse(entries[key] || 'null'); } catch { return null; } };
  return {
    version: data.version || '?',
    date: data.date || null,
    profile:     parse('cdc-profile'),
    theme:       entries['cdc-theme'] || 'light',
    classes:     parse('sc-classes')   || [],
    sessions:    parse('sc-sessions')  || [],
    devoirs:     parse('cdc-devoirs')  || [],
    fiches:      (() => { const f = parse('cdc-fiches'); return (f && !Array.isArray(f)) ? f : {}; })(),
    plans:       parse('cdc-plans')    || [],
    progs:       (() => { const p = parse('cdc-progs'); return (p && typeof p === 'object' && !Array.isArray(p)) ? p : {}; })(),
    programmes:  parse('cdc-programmes') || [],
    edt:         parse('cdc-edt')      || [],
    cours:       parse('cdc-cours')     || {},
    edtRefA:     entries['cdc-edt-refA'] || null,
    liens:       parse('cdc-liens')    || [],
    bulletins:   parse('cdc-data')     || [],
    dashNotes:   parse('dash-notes')   || [],
    dashTaches:  parse('dash-taches')  || [],
    _raw: data, // on garde le brut pour le re-export
  };
}

function fmtDate(isoStr) {
  if (!isoStr) return '—';
  return new Date(isoStr).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function basename(path) {
  return path ? path.split(/[\\/]/).pop() : '';
}

// ── Toast system ─────────────────────────────────────────────────────────────
let _toastId = 0;
function useToast() {
  const [toasts, setToasts] = useState([]);
  const push = useCallback((msg, type = 'info', duration = 3000) => {
    const id = ++_toastId;
    setToasts(t => [...t, { id, msg, type }]);
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), duration);
  }, []);
  return { toasts, push };
}

// ── COMPOSANT TOAST ──────────────────────────────────────────────────────────
function ToastStack({ toasts }) {
  if (!toasts.length) return null;
  const icons = { success: '✅', error: '❌', info: 'ℹ️' };
  return (
    <div className="toast-wrap">
      {toasts.map(t => (
        <div key={t.id} className={`toast ${t.type}`}>
          <span>{icons[t.type] || 'ℹ️'}</span>
          <span>{t.msg}</span>
        </div>
      ))}
    </div>
  );
}

// ── ModulePlaceholder ────────────────────────────────────────────────────────
// Composant partagé — affiché quand un module n'a pas de données ou est indispo
function ModulePlaceholder({ icon = '📦', title = 'Module', sub = '', soon = false }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: '1rem', color: 'var(--text3)', padding: '2rem' }}>
      <div style={{ fontSize: '3rem', opacity: .15 }}>{icon}</div>
      <div style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--text2)' }}>{title}</div>
      {sub && <div style={{ fontSize: '.83rem', color: 'var(--text3)', textAlign: 'center', lineHeight: 1.6, maxWidth: 340 }}>{sub}</div>}
      {soon && <div style={{ fontSize: '.72rem', padding: '.28rem .75rem', borderRadius: 99, background: 'rgba(59,91,219,.08)', border: '1px solid rgba(59,91,219,.2)', color: 'var(--accent)', fontWeight: 600 }}>Bientôt disponible</div>}
    </div>
  );
}
