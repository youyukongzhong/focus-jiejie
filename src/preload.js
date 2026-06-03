const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('focusJiejie', {
  getState: () => ipcRenderer.invoke('app:getState'),
  startSession: (payload) => ipcRenderer.invoke('app:startSession', payload),
  breakSession: (phrase) => ipcRenderer.invoke('app:breakSession', phrase),
  restoreNow: () => ipcRenderer.invoke('app:restoreNow'),
  completeSession: () => ipcRenderer.invoke('app:completeSession'),
  showWindow: () => ipcRenderer.invoke('app:showWindow'),
  onStateUpdated: (callback) => {
    const listener = (_event, state) => callback(state);
    ipcRenderer.on('state-updated', listener);
    return () => ipcRenderer.removeListener('state-updated', listener);
  },
});
