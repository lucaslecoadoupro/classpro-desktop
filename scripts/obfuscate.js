/**
 * obfuscate.js — Obfuscation du code avant build
 * Usage : node scripts/obfuscate.js
 * Lance automatiquement avant npm run build:mac / build:win
 */

const JavaScriptObfuscator = require('javascript-obfuscator');
const fs = require('fs');
const path = require('path');

const FILES = [
  // app.js contient du JSX — il est compilé par Babel à la volée
  // et ne peut pas être obfusqué directement. Seuls main.js et preload.js
  // (Node.js pur) sont obfusqués.
  'src/main/main.js',
  'src/main/preload.js',
];

const OPTIONS = {
  compact: true,
  controlFlowFlattening: false,   // désactivé car trop lent sur gros fichiers
  deadCodeInjection: false,
  debugProtection: true,          // bloque l'ouverture des DevTools
  debugProtectionInterval: 2000,
  disableConsoleOutput: true,     // supprime les console.log en prod
  identifierNamesGenerator: 'hexadecimal',
  renameGlobals: false,           // garder false pour ne pas casser React/Electron
  rotateStringArray: true,
  selfDefending: true,            // l'obfuscation se protège elle-même
  shuffleStringArray: true,
  splitStrings: true,
  splitStringsChunkLength: 10,
  stringArray: true,
  stringArrayCallsTransform: true,
  stringArrayEncoding: ['base64'],
  stringArrayThreshold: 0.75,
  unicodeEscapeSequence: false,
};

console.log('🔒 Obfuscation du code ClassPro Desktop...\n');

let ok = 0;
let err = 0;

FILES.forEach(filePath => {
  const fullPath = path.join(__dirname, '..', filePath);

  if (!fs.existsSync(fullPath)) {
    console.log(`⚠️  Ignoré (non trouvé) : ${filePath}`);
    return;
  }

  const originalSize = fs.statSync(fullPath).size;
  const code = fs.readFileSync(fullPath, 'utf-8');

  try {
    // Sauvegarde de l'original
    const backupPath = fullPath + '.bak';
    fs.writeFileSync(backupPath, code, 'utf-8');

    const result = JavaScriptObfuscator.obfuscate(code, OPTIONS);
    fs.writeFileSync(fullPath, result.getObfuscatedCode(), 'utf-8');

    const newSize = fs.statSync(fullPath).size;
    const ratio = ((newSize / originalSize) * 100).toFixed(0);
    console.log(`✅ ${filePath}`);
    console.log(`   ${(originalSize / 1024).toFixed(1)} KB → ${(newSize / 1024).toFixed(1)} KB (${ratio}%)\n`);
    ok++;
  } catch (e) {
    console.log(`❌ Erreur sur ${filePath} : ${e.message}\n`);
    err++;
  }
});

console.log(`\n🔒 Obfuscation terminée : ${ok} fichier(s) traité(s), ${err} erreur(s).`);
if (ok > 0) {
  console.log('   Les fichiers originaux sont sauvegardés en .bak');
  console.log('   Lance maintenant : npm run build:mac ou npm run build:win');
}
