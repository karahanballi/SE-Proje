const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  pickSavePath: (opts) => ipcRenderer.invoke('fs:pickSavePath', opts),
  writeTextFile: (filePath, text) => ipcRenderer.invoke('fs:writeTextFile', filePath, text),
  readTextFile: (filePath) => ipcRenderer.invoke('fs:readTextFile', filePath),
  showItemInFolder: (filePath) => ipcRenderer.invoke('app:showItemInFolder', filePath),
  openExternal: (url) => ipcRenderer.invoke('app:openExternal', url),
  onDownloadProgress: (cb) => {
    ipcRenderer.on('download:progress', (_e, payload) => cb(payload));
    return () => ipcRenderer.removeAllListeners('download:progress');
  },
  cancelDownload: (id) => ipcRenderer.invoke('download:cancel:' + id),
});

contextBridge.exposeInMainWorld('isElectron', true);
