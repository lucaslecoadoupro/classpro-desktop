// make-icon.js — génère assets/icon.png 512x512 sans dépendances externes
// Usage: node make-icon.js (depuis la racine du projet)
const fs = require('fs');
const path = require('path');

// SVG 512x512 avec fond arrondi bleu gradient + bouclier propre
const svg = `<svg width="512" height="512" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#4c6ef5"/>
      <stop offset="100%" stop-color="#3b5bdb"/>
    </linearGradient>
    <linearGradient id="shield" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#1a1a2e"/>
      <stop offset="100%" stop-color="#0d0d1a"/>
    </linearGradient>
    <linearGradient id="gold" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#d4b483"/>
      <stop offset="100%" stop-color="#a8864e"/>
    </linearGradient>
    <linearGradient id="bookL" x1="1" y1="0" x2="0" y2="0">
      <stop offset="0%" stop-color="#ffffff"/>
      <stop offset="100%" stop-color="#d0d0d0"/>
    </linearGradient>
    <linearGradient id="bookR" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="#ffffff"/>
      <stop offset="100%" stop-color="#d0d0d0"/>
    </linearGradient>
    <filter id="shadow">
      <feDropShadow dx="0" dy="8" stdDeviation="16" flood-color="#000" flood-opacity="0.35"/>
    </filter>
  </defs>

  <!-- Fond arrondi bleu -->
  <rect x="0" y="0" width="512" height="512" rx="116" ry="116" fill="url(#bg)"/>

  <!-- Bouclier avec ombre -->
  <g filter="url(#shadow)">
    <path d="M256 80 L390 134 L390 290 Q390 390 256 440 Q122 390 122 290 L122 134 Z"
          fill="url(#shield)" stroke="url(#gold)" stroke-width="10" stroke-linejoin="round"/>
  </g>

  <!-- Livre gauche -->
  <path d="M256 310 Q218 298 182 310 L182 218 Q218 206 256 218 Z"
        fill="url(#bookL)" stroke="#b0b0b0" stroke-width="1.5"/>
  <!-- Livre droite -->
  <path d="M256 310 Q294 298 330 310 L330 218 Q294 206 256 218 Z"
        fill="url(#bookR)" stroke="#b0b0b0" stroke-width="1.5"/>
  <!-- Reliure centrale -->
  <line x1="256" y1="218" x2="256" y2="310" stroke="#909090" stroke-width="5"/>
  <!-- Arc bas du livre -->
  <path d="M182 310 Q218 328 256 322 Q294 328 330 310"
        fill="none" stroke="#a0a0a0" stroke-width="4"/>
  <!-- Ombre livre -->
  <ellipse cx="256" cy="325" rx="74" ry="8" fill="#000" opacity="0.18"/>

  <!-- Croix dorée -->
  <line x1="256" y1="108" x2="256" y2="152" stroke="url(#gold)" stroke-width="8" stroke-linecap="round"/>
  <line x1="234" y1="130" x2="278" y2="130" stroke="url(#gold)" stroke-width="8" stroke-linecap="round"/>
</svg>`;

const outDir = path.join(__dirname, 'assets');
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

const svgPath = path.join(outDir, 'icon-source.svg');
fs.writeFileSync(svgPath, svg, 'utf-8');
console.log('✅ SVG source écrit :', svgPath);
console.log('');
console.log('Maintenant convertis ce SVG en PNG 512x512 :');
console.log('');
console.log('Sur Mac (méthode recommandée) :');
console.log('  brew install librsvg');
console.log('  rsvg-convert -w 512 -h 512 assets/icon-source.svg -o assets/icon.png');
console.log('');
console.log('Puis génère icns/ico :');
console.log('  npx electron-icon-builder --input=assets/icon.png --output=assets/');
