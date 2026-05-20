const { contextBridge, ipcRenderer } = require('electron');

// Exposer des API sécurisées au processus de rendu
contextBridge.exposeInMainWorld('electronAPI', {
  // Version de l'application
  getAppVersion: () => ipcRenderer.invoke('get-app-version'),
  
  // Dialogues
  showSaveDialog: (options) => ipcRenderer.invoke('show-save-dialog', options),
  writeFile: (filePath, data) => ipcRenderer.invoke('write-file', filePath, data),
  
  // Écouteurs d'événements
  onMenuExport: (callback) => ipcRenderer.on('menu-export', callback),
  
  // Plateforme
  platform: process.platform
});

// Informations sur l'environnement
contextBridge.exposeInMainWorld('appInfo', {
  isElectron: true,
  platform: process.platform,
  version: '1.0.0'
});
