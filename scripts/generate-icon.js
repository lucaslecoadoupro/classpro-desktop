#!/usr/bin/env node
/**
 * generate-icon.js
 * Génère assets/icon.png (512×512) depuis le SVG ClassPro.
 * Usage : node scripts/generate-icon.js
 * Nécessite : npm install canvas (ou sharp)
 */

const fs = require('fs');
const path = require('path');

const SVG = `<svg width="512" height="512" viewBox="0 0 100 110" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="sf" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#1a1a1a"/>
      <stop offset="100%" stop-color="#0d0d0d"/>
    </linearGradient>
    <linearGradient id="gs" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#d4b483"/>
      <stop offset="100%" stop-color="#a8864e"/>
    </linearGradient>
    <linearGradient id="bpl" x1="1" y1="0" x2="0" y2="0">
      <stop offset="0%" stop-color="#ffffff"/>
      <stop offset="100%" stop-color="#c8c8c8"/>
    </linearGradient>
    <linearGradient id="bpr" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="#ffffff"/>
      <stop offset="100%" stop-color="#c8c8c8"/>
    </linearGradient>
  </defs>
  <!-- Fond arrondi accent -->
  <rect x="4" y="4" width="92" height="102" rx="18" fill="#3b5bdb"/>
  <!-- Bouclier -->
  <path d="M50 14 L80 26 L80 58 Q80 76 50 90 Q20 76 20 58 L20 26 Z" fill="url(#sf)" stroke="url(#gs)" stroke-width="2.5" stroke-linejoin="round"/>
  <!-- Livre gauche -->
  <path d="M50 61 Q41 58 32 61 L32 44 Q41 41 50 44 Z" fill="url(#bpl)" stroke="#b8b8b8" stroke-width="0.4"/>
  <!-- Livre droite -->
  <path d="M50 61 Q59 58 68 61 L68 44 Q59 41 50 44 Z" fill="url(#bpr)" stroke="#b8b8b8" stroke-width="0.4"/>
  <!-- Reliure -->
  <line x1="50" y1="44" x2="50" y2="61" stroke="#a0a0a0" stroke-width="1.2"/>
  <!-- Arc bas livre -->
  <path d="M32 61 Q41 65 50 63 Q59 65 68 61" fill="none" stroke="#b0b0b0" stroke-width="1"/>
  <!-- Ombre livre -->
  <ellipse cx="50" cy="64" rx="18" ry="2" fill="#000" opacity="0.2"/>
  <!-- Croix dorée -->
  <line x1="50" y1="18" x2="50" y2="27" stroke="#d4b483" stroke-width="1.8" stroke-linecap="round"/>
  <line x1="45" y1="22.5" x2="55" y2="22.5" stroke="#d4b483" stroke-width="1.8" stroke-linecap="round"/>
</svg>`;

const outDir = path.join(__dirname, '..', 'assets');
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

const svgPath = path.join(outDir, 'icon.svg');
fs.writeFileSync(svgPath, SVG, 'utf-8');
console.log('✅ SVG écrit :', svgPath);
console.log('');
console.log('Pour générer icon.png, icon.icns et icon.ico :');
console.log('');
console.log('  Option 1 — electron-icon-builder (recommandé) :');
console.log('    npm install --save-dev electron-icon-builder');
console.log('    npx electron-icon-builder --input=assets/icon.svg --output=assets/');
console.log('');
console.log('  Option 2 — svg2png en ligne :');
console.log('    Ouvrir assets/icon.svg dans un navigateur → screenshot 512×512 → sauvegarder en icon.png');
console.log('    Puis : npx png2icons assets/icon.png assets/icon -icns -ico');
console.log('');
console.log('  Option 3 — site en ligne :');
console.log('    https://www.icoconverter.com/ ou https://cloudconvert.com/svg-to-icns');
