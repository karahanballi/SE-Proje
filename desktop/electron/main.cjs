const { app, BrowserWindow, ipcMain, Tray, Menu, dialog, shell } = require('electron');
const path = require('path');
const fs = require('fs');

const isDev = !app.isPackaged;

let mainWindow;
let tray;

function getIconPath() {
  return path.join(__dirname, '..', 'assets', process.platform === 'win32' ? 'icon.ico' : 'icon.png');
}

function getRendererEntry() {
  // Dev: load Vite dev server. Prod: load bundled web build copied as an extraResource.
  if (isDev) return process.env.ELECTRON_RENDERER_URL || 'http://localhost:5173';
  return path.join(process.resourcesPath, 'web-dist', 'index.html');
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    show: false,
    icon: getIconPath(),
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
  });

  mainWindow.once('ready-to-show', () => mainWindow.show());

  if (isDev) {
    mainWindow.loadURL(getRendererEntry());
    mainWindow.webContents.openDevTools({ mode: 'detach' });
  } else {
    mainWindow.loadFile(getRendererEntry());
  }

  mainWindow.on('close', (e) => {
    // Keep the app in tray unless the user explicitly quits
    if (!app.isQuiting) {
      e.preventDefault();
      mainWindow.hide();
    }
  });

  setupDownloads(mainWindow);
}

function createTray() {
  tray = new Tray(getIconPath());
  tray.setToolTip('LMS Desktop');

  const contextMenu = Menu.buildFromTemplate([
    {
      label: 'Show / Hide',
      click: () => {
        if (!mainWindow) return;
        if (mainWindow.isVisible()) mainWindow.hide();
        else mainWindow.show();
      },
    },
    { type: 'separator' },
    {
      label: 'Check Updates',
      click: async () => {
        const ok = await checkUpdates();
        if (!ok) dialog.showMessageBox({ type: 'info', message: 'Auto-update is only available in packaged builds.' });
      },
    },
    { type: 'separator' },
    {
      label: 'Quit',
      click: () => {
        app.isQuiting = true;
        app.quit();
      },
    },
  ]);

  tray.setContextMenu(contextMenu);
  tray.on('double-click', () => {
    if (!mainWindow) return;
    mainWindow.show();
  });
}

function setupDownloads(win) {
  const ses = win.webContents.session;

  ses.on('will-download', (event, item) => {
    const id = Date.now().toString(36) + Math.random().toString(36).slice(2);
    const filename = item.getFilename();

    // Default to OS Downloads folder
    const defaultPath = path.join(app.getPath('downloads'), filename);
    item.setSavePath(defaultPath);

    const send = (payload) => win.webContents.send('download:progress', payload);

    send({
      id,
      filename,
      receivedBytes: item.getReceivedBytes(),
      totalBytes: item.getTotalBytes(),
      state: 'started',
      savePath: defaultPath,
    });

    item.on('updated', () => {
      send({
        id,
        filename,
        receivedBytes: item.getReceivedBytes(),
        totalBytes: item.getTotalBytes(),
        state: 'progress',
        savePath: item.getSavePath(),
      });
    });

    item.once('done', (_e, state) => {
      send({
        id,
        filename,
        receivedBytes: item.getReceivedBytes(),
        totalBytes: item.getTotalBytes(),
        state,
        savePath: item.getSavePath(),
      });
    });

    ipcMain.handleOnce('download:cancel:' + id, () => item.cancel());
  });
}

async function checkUpdates() {
  if (isDev) return false;
  try {
    const { autoUpdater } = require('electron-updater');
    autoUpdater.autoDownload = false;

    autoUpdater.removeAllListeners();

    autoUpdater.on('update-available', async () => {
      const r = await dialog.showMessageBox({
        type: 'info',
        buttons: ['Download', 'Later'],
        defaultId: 0,
        message: 'Update available. Download now?',
      });
      if (r.response === 0) autoUpdater.downloadUpdate();
    });

    autoUpdater.on('update-downloaded', async () => {
      const r = await dialog.showMessageBox({
        type: 'info',
        buttons: ['Install and Restart', 'Later'],
        defaultId: 0,
        message: 'Update downloaded. Install now?',
      });
      if (r.response === 0) autoUpdater.quitAndInstall();
    });

    await autoUpdater.checkForUpdates();
    return true;
  } catch (e) {
    dialog.showErrorBox('Update Error', String(e?.message || e));
    return true; // feature exists, but errored
  }
}

// --- IPC: minimal native features for the assignment/demo ---
ipcMain.handle('fs:pickSavePath', async (_e, opts) => {
  const res = await dialog.showSaveDialog({
    title: opts?.title || 'Save file',
    defaultPath: opts?.defaultPath || app.getPath('downloads'),
    filters: opts?.filters,
  });
  if (res.canceled) return null;
  return res.filePath;
});

ipcMain.handle('fs:writeTextFile', async (_e, filePath, text) => {
  await fs.promises.writeFile(filePath, text, 'utf-8');
  return true;
});

ipcMain.handle('fs:readTextFile', async (_e, filePath) => {
  const data = await fs.promises.readFile(filePath, 'utf-8');
  return data;
});

ipcMain.handle('app:showItemInFolder', async (_e, filePath) => {
  shell.showItemInFolder(filePath);
  return true;
});

ipcMain.handle('app:openExternal', async (_e, url) => {
  await shell.openExternal(url);
  return true;
});

app.whenReady().then(() => {
  createWindow();
  createTray();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  // keep app running in tray on macOS/Windows
  if (process.platform === 'darwin') return;
});
