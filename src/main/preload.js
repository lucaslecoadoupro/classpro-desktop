const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('cpd', {
  // Ouvrir un fichier JSON ClassPro
  openJson: () => ipcRenderer.invoke('dialog:open-json'),

  // Sauvegarder un fichier JSON
  saveJson: (data, defaultName) =>
    ipcRenderer.invoke('dialog:save-json', { data, defaultName }),

  // Sauvegarder un PDF (base64)
  savePdf: (base64, defaultName) =>
    ipcRenderer.invoke('dialog:save-pdf', { base64, defaultName }),

  // Ouvrir dans le Finder/Explorateur
  showFile: (filePath) => ipcRenderer.invoke('shell:show-file', filePath),

  // Infos app
  getInfo: () => ipcRenderer.invoke('app:info'),

  // Événements menu natif
  onMenuOpenJson: (cb) => ipcRenderer.on('menu:open-json', cb),
  onMenuSaveJson: (cb) => ipcRenderer.on('menu:save-json', cb),
  onMenuAbout:    (cb) => ipcRenderer.on('menu:about', cb),
  onMenuExportPdf:(cb) => ipcRenderer.on('menu:export-pdf', cb),

  // Nettoyage
  removeAllListeners: (channel) => ipcRenderer.removeAllListeners(channel),
});
