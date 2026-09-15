const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  isElectron: true,
  openFacebookBrowser: (options) => ipcRenderer.invoke('open-fb-browser', options),
  openInstagramBrowser: (options) => ipcRenderer.invoke('open-ig-browser', options),
  openAccountSession: (options) => ipcRenderer.invoke('open-account-session', options),
  closeFacebookBrowser: (sessionId) => ipcRenderer.invoke('close-fb-browser', sessionId),
  closeInstagramBrowser: (sessionId) => ipcRenderer.invoke('close-ig-browser', sessionId),
  getActiveSessions: () => ipcRenderer.invoke('get-active-sessions'),
  onFacebookAccountCaptured: (callback) => {
    const handler = (_event, data) => callback(data);
    ipcRenderer.on('fb-account-captured', handler);
    return () => ipcRenderer.removeListener('fb-account-captured', handler);
  },
  onInstagramAccountCaptured: (callback) => {
    const handler = (_event, data) => callback(data);
    ipcRenderer.on('ig-account-captured', handler);
    return () => ipcRenderer.removeListener('ig-account-captured', handler);
  },

  // Auto Updater
  checkForUpdates: () => ipcRenderer.invoke('check-for-updates'),
  startDownloadUpdate: () => ipcRenderer.invoke('start-download-update'),
  installUpdateNow: () => ipcRenderer.invoke('install-update-now'),
  getAppVersion: () => ipcRenderer.invoke('get-app-version'),
  getMachineId: () => ipcRenderer.invoke('get-machine-id'),
  onUpdateChecking: (callback) => {
    const handler = () => callback();
    ipcRenderer.on('update-checking', handler);
    return () => ipcRenderer.removeListener('update-checking', handler);
  },
  onUpdateAvailable: (callback) => {
    const handler = (_event, info) => callback(info);
    ipcRenderer.on('update-available', handler);
    return () => ipcRenderer.removeListener('update-available', handler);
  },
  onUpdateNotAvailable: (callback) => {
    const handler = (_event, info) => callback(info);
    ipcRenderer.on('update-not-available', handler);
    return () => ipcRenderer.removeListener('update-not-available', handler);
  },
  onUpdateProgress: (callback) => {
    const handler = (_event, progress) => callback(progress);
    ipcRenderer.on('update-progress', handler);
    return () => ipcRenderer.removeListener('update-progress', handler);
  },
  onUpdateDownloaded: (callback) => {
    const handler = (_event, info) => callback(info);
    ipcRenderer.on('update-downloaded', handler);
    return () => ipcRenderer.removeListener('update-downloaded', handler);
  },
  onUpdateError: (callback) => {
    const handler = (_event, err) => callback(err);
    ipcRenderer.on('update-error', handler);
    return () => ipcRenderer.removeListener('update-error', handler);
  }
});
