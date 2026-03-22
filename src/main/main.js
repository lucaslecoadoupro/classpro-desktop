// src/main/main.js — wrapper propre autour du main obfusqué
// 1. Charge tout le code obfusqué original
require('./main.obf.js');

const { ipcMain, dialog, app, shell } = require('electron');
const fs   = require('fs');
const path = require('path');

// ── Dossier Documents/ClassPro ───────────────────────────────────────────────
// Créé au démarrage pour que l'utilisateur sache où ranger ses fichiers
function ensureClassProFolder() {
  const dir = path.join(app.getPath('documents'), 'ClassPro');
  if (!fs.existsSync(dir)) {
    try { fs.mkdirSync(dir, { recursive: true }); } catch (_) {}
  }
  return dir;
}

// ── defaultPath intelligent ──────────────────────────────────────────────────
// Priorité : 1. Documents/ClassPro s'il contient des .json
//            2. Téléchargements (là où le navigateur dépose les exports ClassPro web)
//            3. Documents/ClassPro en fallback
function getDefaultPath() {
  const classproDir = ensureClassProFolder();

  // Y a-t-il déjà des JSON dans Documents/ClassPro ?
  try {
    const files = fs.readdirSync(classproDir);
    if (files.some(f => f.endsWith('.json'))) return classproDir;
  } catch (_) {}

  // Sinon, pointer vers les Téléchargements (export ClassPro web)
  try {
    const downloads = app.getPath('downloads');
    if (fs.existsSync(downloads)) return downloads;
  } catch (_) {}

  return classproDir;
}

// ── Handler dialog:open-classpro-folder ──────────────────────────────────────
// Ouvre le dossier assets/classpro dans le Finder (Mac) ou l'Explorateur (Windows)
ipcMain.removeHandler('dialog:open-classpro-folder');
ipcMain.handle('dialog:open-classpro-folder', () => {
  // En mode buildé, les ressources non-asar sont à côté de l'exe dans resources/
  const candidates = [
    path.join(path.dirname(app.getPath('exe')), 'resources', 'assets', 'classpro'),
    path.join(path.dirname(app.getPath('exe')), 'resources', 'app', 'assets', 'classpro'),
    path.join(app.getAppPath(), '..', 'assets', 'classpro'),
    path.join(app.getAppPath(), 'assets', 'classpro'),
  ];
  const found = candidates.find(p => fs.existsSync(p));
  shell.openPath(found || path.dirname(app.getPath('exe')));
});

// ── Remplacement du handler dialog:open-json ─────────────────────────────────
ipcMain.removeHandler('dialog:open-json');

ipcMain.handle('dialog:open-json', async () => {
  const { canceled, filePaths } = await dialog.showOpenDialog({
    title: 'Ouvrir un fichier ClassPro',
    defaultPath: getDefaultPath(),
    filters: [{ name: 'Fichiers ClassPro', extensions: ['json'] }],
    properties: ['openFile'],
  });

  if (canceled || !filePaths.length) return null;

  try {
    const content = fs.readFileSync(filePaths[0], 'utf-8');
    const data    = JSON.parse(content);
    return { ok: true, data, filePath: filePaths[0] };
  } catch (e) {
    return { ok: false, error: e.message };
  }
});
