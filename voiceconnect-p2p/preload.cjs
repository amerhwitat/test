const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("voiceConnectDesktop", Object.freeze({
  saveReceivedFile: (file) => ipcRenderer.invoke("voiceconnect:save-received-file", file),
  requestMediaConsent: (kind) => ipcRenderer.invoke("voiceconnect:consent-media", kind),
  revokeMediaConsent: (kind) => ipcRenderer.invoke("voiceconnect:revoke-media-consent", kind),
  listKnownPeers: () => ipcRenderer.invoke("voiceconnect:list-known-peers"),
  rememberPeer: (peer) => ipcRenderer.invoke("voiceconnect:remember-peer", peer),
  forgetPeer: (userGuid) => ipcRenderer.invoke("voiceconnect:forget-peer", userGuid)
}));
