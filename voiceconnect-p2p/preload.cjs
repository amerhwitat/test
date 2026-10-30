const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("voiceConnectDesktop", Object.freeze({
  requestMediaConsent: (kind) => ipcRenderer.invoke("voiceconnect:consent-media", kind),
  listKnownPeers: () => ipcRenderer.invoke("voiceconnect:list-known-peers"),
  rememberPeer: (peer) => ipcRenderer.invoke("voiceconnect:remember-peer", peer),
  forgetPeer: (userGuid) => ipcRenderer.invoke("voiceconnect:forget-peer", userGuid)
}));
