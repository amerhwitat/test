const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("voiceConnectDesktop", Object.freeze({
  requestMediaConsent: (kind) => ipcRenderer.invoke("voiceconnect:consent-media", kind)
}));
