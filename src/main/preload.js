const { contextBridge, ipcRenderer } = require('electron');

// ── API exposée au renderer via window.cpd ───────────────────────────────────
contextBridge.exposeInMainWorld('cpd', {

  // ── Fichiers ────────────────────────────────────────────────────────────────
  openJson: () => ipcRenderer.invoke('dialog:open-json'),
  saveJson: (data, defaultName) => ipcRenderer.invoke('dialog:save-json', { data, defaultName }),
  savePdf: (base64, defaultName) => ipcRenderer.invoke('dialog:save-pdf', { base64, defaultName }),
  showFile: (filePath) => ipcRenderer.invoke('shell:show-file', filePath),

  // ── App ─────────────────────────────────────────────────────────────────────
  getInfo: () => ipcRenderer.invoke('app:info'),

  // ── Écoute des événements menu ───────────────────────────────────────────────
  onMenuOpenJson:  (cb) => ipcRenderer.on('menu:open-json',  () => cb()),
  onMenuSaveJson:  (cb) => ipcRenderer.on('menu:save-json',  () => cb()),
  onMenuExportPdf: (cb) => ipcRenderer.on('menu:export-pdf', () => cb()),
  onMenuAbout:     (cb) => ipcRenderer.on('menu:about',      () => cb()),

  // Nettoyage propre
  removeAllListeners: (channel) => ipcRenderer.removeAllListeners(channel),
});
