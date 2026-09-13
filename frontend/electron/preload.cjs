const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  isElectron: true,
  openFacebookBrowser: (options) => ipcRenderer.invoke('open-fb-browser', options),
  closeFacebookBrowser: (sessionId) => ipcRenderer.invoke('close-fb-browser', sessionId),
  getActiveSessions: () => ipcRenderer.invoke('get-active-sessions'),
  onFacebookAccountCaptured: (callback) => {
    const handler = (_event, data) => callback(data);
    ipcRenderer.on('fb-account-captured', handler);
    return () => ipcRenderer.removeListener('fb-account-captured', handler);
  }
});
