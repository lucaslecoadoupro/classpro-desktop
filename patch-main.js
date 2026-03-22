const fs = require('fs');
let code = fs.readFileSync('src/main/main.js', 'utf8');

// Cherche openPath ou openExternal et affiche le contexte
['openPath', 'openExternal'].forEach(term => {
  const idx = code.indexOf(term);
  if (idx > -1) {
    console.log('Trouvé: ' + term);
    console.log(JSON.stringify(code.substring(idx - 20, idx + 80)));
  }
});

// Patch : remplace shell.openPath(found) ou shell.openExternal(...found...)
const replaced = code.replace(
  /await shell\.(openPath|openExternal)\([^)]+\);/,
  "require('child_process').exec('explorer \"' + found + '\"');"
);

if (replaced !== code) {
  fs.writeFileSync('src/main/main.js', replaced);
  console.log('Patch appliqué avec succès !');
} else {
  console.log('Aucun remplacement effectué.');
}
