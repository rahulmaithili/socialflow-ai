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
  }
});
