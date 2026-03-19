const { app, BrowserWindow, ipcMain, dialog, Menu, shell, nativeImage } = require('electron');
const path = require('path');
const fs = require('fs');

// ── Constantes ──────────────────────────────────────────────────────────────
const isDev = process.argv.includes('--dev');
const APP_VERSION = '1.0.0';

// ── Fenêtre principale ───────────────────────────────────────────────────────
let mainWindow;

function createWindow() {
  // Chemins icônes selon la plateforme
  const iconMac  = path.join(__dirname, '../../assets/icons/mac/icon.icns');
  const iconWin  = path.join(__dirname, '../../assets/icons/win/icon.ico');
  const iconPng  = path.join(__dirname, '../../assets/icons/png/512x512.png');
  const iconPath = process.platform === 'darwin' ? iconMac
                 : process.platform === 'win32'  ? iconWin
                 : iconPng;
  const iconExists = fs.existsSync(iconPath);

  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 860,
    minHeight: 560,
    title: 'ClassPro Desktop',
    backgroundColor: '#0f1b4d',
    titleBarStyle: process.platform === 'darwin' ? 'hidden' : 'default',
    // Sur Mac : zone draggable étendue pour déplacer la fenêtre
    ...(process.platform === 'darwin' ? { trafficLightPosition: { x: 14, y: 14 } } : {}),
    // Icône dock/taskbar
    ...(iconExists ? { icon: iconPath } : {}),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
    show: false,
  });

  mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'));

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
    // Icône dans le dock macOS (runtime)
    if (process.platform === 'darwin' && iconExists) {
      try {
        const dockIcon = path.join(__dirname, '../../assets/icons/png/512x512.png');
        const img = nativeImage.createFromPath(fs.existsSync(dockIcon) ? dockIcon : iconPath);
        app.dock.setIcon(img);
      } catch (e) { /* ignore */ }
    }
    if (isDev) mainWindow.webContents.openDevTools();
  });

  mainWindow.on('closed', () => { mainWindow = null; });
}

// ── Menu natif ───────────────────────────────────────────────────────────────
function buildMenu() {
  const isMac = process.platform === 'darwin';
  const template = [
    ...(isMac ? [{ role: 'appMenu' }] : []),
    {
      label: 'Fichier',
      submenu: [
        {
          label: 'Ouvrir un JSON ClassPro…',
          accelerator: 'CmdOrCtrl+O',
          click: () => mainWindow?.webContents.send('menu:open-json'),
        },
        {
          label: 'Sauvegarder le JSON…',
          accelerator: 'CmdOrCtrl+S',
          click: () => mainWindow?.webContents.send('menu:save-json'),
        },
        { type: 'separator' },
        {
          label: 'Exporter en PDF…',
          accelerator: 'CmdOrCtrl+P',
          click: () => mainWindow?.webContents.send('menu:export-pdf'),
        },
        { type: 'separator' },
        isMac ? { role: 'close' } : { role: 'quit', label: 'Quitter' },
      ],
    },
    {
      label: 'Affichage',
      submenu: [
        { role: 'reload', label: 'Recharger' },
        { type: 'separator' },
        { role: 'zoomIn', label: 'Zoom +' },
        { role: 'zoomOut', label: 'Zoom -' },
        { role: 'resetZoom', label: 'Zoom par défaut' },
        { type: 'separator' },
        { role: 'togglefullscreen', label: 'Plein écran' },
      ],
    },
    {
      label: 'Aide',
      submenu: [
        {
          label: `ClassPro Desktop v${APP_VERSION}`,
          enabled: false,
        },
        { type: 'separator' },
        {
          label: 'À propos…',
          click: () => mainWindow?.webContents.send('menu:about'),
        },
      ],
    },
  ];
  Menu.setApplicationMenu(Menu.buildFromTemplate(template));
}

// ── IPC Handlers ─────────────────────────────────────────────────────────────

ipcMain.handle('dialog:open-json', async () => {
  const { canceled, filePaths } = await dialog.showOpenDialog(mainWindow, {
    title: 'Ouvrir un fichier ClassPro',
    filters: [{ name: 'Fichier ClassPro', extensions: ['json'] }],
    properties: ['openFile'],
  });
  if (canceled || !filePaths.length) return null;
  try {
    const content = fs.readFileSync(filePaths[0], 'utf-8');
    const data = JSON.parse(content);
    return { ok: true, data, filePath: filePaths[0] };
  } catch (err) {
    return { ok: false, error: err.message };
  }
});

ipcMain.handle('dialog:save-json', async (event, { data, defaultName }) => {
  const { canceled, filePath } = await dialog.showSaveDialog(mainWindow, {
    title: 'Sauvegarder le fichier ClassPro',
    defaultPath: defaultName || 'ClassPro_export.json',
    filters: [{ name: 'Fichier ClassPro', extensions: ['json'] }],
  });
  if (canceled || !filePath) return { ok: false };
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
    return { ok: true, filePath };
  } catch (err) {
    return { ok: false, error: err.message };
  }
});

ipcMain.handle('dialog:save-pdf', async (event, { base64, defaultName }) => {
  const { canceled, filePath } = await dialog.showSaveDialog(mainWindow, {
    title: 'Exporter le PDF',
    defaultPath: defaultName || 'ClassPro_export.pdf',
    filters: [{ name: 'PDF', extensions: ['pdf'] }],
  });
  if (canceled || !filePath) return { ok: false };
  try {
    const buffer = Buffer.from(base64, 'base64');
    fs.writeFileSync(filePath, buffer);
    return { ok: true, filePath };
  } catch (err) {
    return { ok: false, error: err.message };
  }
});

ipcMain.handle('shell:show-file', async (event, filePath) => {
  shell.showItemInFolder(filePath);
});

ipcMain.handle('app:info', () => ({
  version: APP_VERSION,
  platform: process.platform,
  isDev,
}));

// ── App lifecycle ────────────────────────────────────────────────────────────
// Nom affiché dans la barre de menu macOS et au survol taskbar
app.setName('ClassPro Desktop');

app.whenReady().then(() => {
  buildMenu();
  createWindow();
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
