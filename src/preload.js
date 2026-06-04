const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('focusJiejie', {
  getState: () => ipcRenderer.invoke('app:getState'),
  startSession: (payload) => ipcRenderer.invoke('app:startSession', payload),
  breakSession: (phrase) => ipcRenderer.invoke('app:breakSession', phrase),
  restoreNow: () => ipcRenderer.invoke('app:restoreNow'),
  completeSession: () => ipcRenderer.invoke('app:completeSession'),
  setStartupEnabled: (enabled) => ipcRenderer.invoke('app:setStartupEnabled', enabled),
  setLanguage: (language) => ipcRenderer.invoke('app:setLanguage', language),
  checkForUpdates: () => ipcRenderer.invoke('app:checkForUpdates'),
  downloadUpdate: () => ipcRenderer.invoke('app:downloadUpdate'),
  installUpdate: () => ipcRenderer.invoke('app:installUpdate'),
  showWindow: () => ipcRenderer.invoke('app:showWindow'),
  onStateUpdated: (callback) => {
    const listener = (_event, state) => callback(state);
    ipcRenderer.on('state-updated', listener);
    return () => ipcRenderer.removeListener('state-updated', listener);
  },
});
