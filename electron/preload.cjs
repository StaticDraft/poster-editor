const { contextBridge, ipcRenderer } = require('electron')

// Expose safe desktop API to renderer process
contextBridge.exposeInMainWorld('electronAPI', {
  isElectron: true,
  getMachineCode: () => ipcRenderer.invoke('get-machine-code'),
  showSaveDialog: (options) => ipcRenderer.invoke('show-save-dialog', options),
  showOpenDialog: (options) => ipcRenderer.invoke('show-open-dialog', options),
  saveFile: (options) => ipcRenderer.invoke('save-file', options),
})
