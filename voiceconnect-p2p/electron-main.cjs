const { app, BrowserWindow, dialog, session, ipcMain } = require("electron");
const path = require("node:path");
const fs = require("node:fs");
const { pathToFileURL } = require("node:url");
const net = require("node:net");
const { sanitizeReceivedFilename, decodeReceivedFilePayload, persistSelectedFile } = require("./electron-file-save.cjs");


const graphicsBackend = process.env.VOICECONNECT_GRAPHICS_BACKEND || "auto";
if (process.platform === "win32" && graphicsBackend === "directx") {
  // Chromium's ANGLE Direct3D 11 backend; this is a GPU backend variant,
  // not a claim that the web UI has been rewritten as a native D3D renderer.
  app.commandLine.appendSwitch("use-gl", "angle");
  app.commandLine.appendSwitch("use-angle", "d3d11");
} else if (process.platform === "win32" && graphicsBackend === "opengl") {
  app.commandLine.appendSwitch("use-gl", "angle");
  app.commandLine.appendSwitch("use-angle", "gl");
}

let localServer;
let mainWindow;
let startupLog;
const mediaConsents = new Map();

function trustedRenderer(event) {
  try {
    const url = new URL(event.senderFrame.url);
    const port = localServer?.address()?.port;
    return url.protocol === "http:" && url.hostname === "127.0.0.1" &&
      Number(url.port) === port && Number.isInteger(port);
  } catch { return false; }
}
function knownPeersPath() {
  return path.join(app.getPath("userData"), "data", "known-peers.json");
}
function readKnownPeers() {
  try {
    const parsed = JSON.parse(fs.readFileSync(knownPeersPath(), "utf8"));
    return parsed?.version === 1 && Array.isArray(parsed.peers) ? parsed.peers : [];
  } catch { return []; }
}
function writeKnownPeers(peers) {
  const target = knownPeersPath();
  fs.mkdirSync(path.dirname(target), { recursive: true });
  const temp = target + ".tmp";
  fs.writeFileSync(temp, JSON.stringify({ version: 1, peers: peers.slice(0, 500) }, null, 2), { mode: 0o600 });
  fs.renameSync(temp, target);
}
ipcMain.handle("voiceconnect:list-known-peers", (event) => {
  if (!trustedRenderer(event)) return [];
  return readKnownPeers();
});
ipcMain.handle("voiceconnect:remember-peer", (event, input) => {
  if (!trustedRenderer(event) || !input || typeof input !== "object") return { ok: false, error: "Untrusted request" };
  const peerId = String(input.peerId || "").slice(0, 80);
  const userGuid = String(input.userGuid || "").slice(0, 80);
  const nickname = String(input.nickname || "Peer").replace(/[<>\u0000-\u001f]/g, "").slice(0, 32);
  const observedIp = String(input.observedIp || "");
  if (!peerId || !userGuid || !net.isIP(observedIp)) return { ok: false, error: "A peer ID and explicitly shared valid IP address are required" };
  const now = new Date().toISOString();
  const peers = readKnownPeers();
  const old = peers.find(peer => peer.userGuid === userGuid);
  const record = {
    peerId, userGuid, nickname, observedIp,
    avatar: typeof input.avatar === "string" && input.avatar.length <= 50000 ? input.avatar : "",
    room: String(input.room || "").slice(0, 64),
    firstSeen: old?.firstSeen || now, lastSeen: now,
    source: "peer-consented-room-exchange"
  };
  writeKnownPeers([record, ...peers.filter(peer => peer.userGuid !== userGuid)]);
  return { ok: true, count: Math.min(peers.length + (old ? 0 : 1), 500) };
});
ipcMain.handle("voiceconnect:forget-peer", (event, userGuid) => {
  if (!trustedRenderer(event)) return false;
  writeKnownPeers(readKnownPeers().filter(peer => peer.userGuid !== String(userGuid)));
  return true;
});

ipcMain.handle("voiceconnect:save-received-file", async (event, input) => {
  if (!trustedRenderer(event) || !input || typeof input !== "object") return { ok: false, error: "Untrusted request" };
  let data;
  try { data = decodeReceivedFilePayload(input.data); }
  catch (error) { return { ok: false, error: error.message }; }
  const name = sanitizeReceivedFilename(input.name);
  const result = await dialog.showSaveDialog(mainWindow, {
    title: "Save received file",
    defaultPath: name,
    buttonLabel: "Save file",
    // Electron exposes this explicit flag for Linux. Windows and macOS use
    // their native save-panel overwrite confirmation behavior.
    properties: process.platform === "linux" ? ["showOverwriteConfirmation"] : []
  });
  if (result.canceled || !result.filePath) return { ok: false, canceled: true };
  try {
    const saved = await persistSelectedFile(result.filePath, data, {
      // The native save panel has already asked before returning an existing
      // destination. This callback also handles a path that races into place.
      confirmOverwrite: async () => true
    });
    return saved.ok ? { ok: true, filePath: saved.filePath } : { ok: false, canceled: true };
  } catch (error) {
    log("Received file could not be written to the selected destination", error);
    return { ok: false, error: "The file could not be written to the selected destination." };
  }
});

ipcMain.handle("voiceconnect:consent-media", (event, kind) => {
  if (!["camera", "microphone"].includes(kind)) return false;
  try {
    if (!trustedRenderer(event)) return false;
  } catch { return false; }
  mediaConsents.set(event.sender.id, new Set([...(mediaConsents.get(event.sender.id) || []), kind]));
  return true;
});

function log(message, error) {
  const detail = error ? `\n${error.stack || error.message || String(error)}` : "";
  const line = `[${new Date().toISOString()}] ${message}${detail}\n`;
  console.error(line);
  try { if (startupLog) fs.appendFileSync(startupLog, line); } catch {}
}

function showStartupFailure(message, error) {
  log(message, error);
  const detail = error?.message || String(error || "Unknown startup error");
  dialog.showErrorBox("VoiceConnect P2P could not start", `${message}\n\n${detail}\n\nDiagnostic log: ${startupLog || "unavailable"}`);
  app.quit();
}

async function createWindow(url) {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 850,
    minWidth: 760,
    minHeight: 600,
    show: false,
    backgroundColor: "#06111d",
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      preload: path.join(__dirname, "preload.cjs")
    }
  });

  const windowReady = new Promise((resolve, reject) => {
    mainWindow.once("ready-to-show", () => {
      if (mainWindow && !mainWindow.isDestroyed()) mainWindow.show();
      log("Desktop window is ready and visible");
      resolve();
    });
    mainWindow.webContents.once("did-fail-load", (_event, code, description, validatedURL, isMainFrame) => {
      if (isMainFrame) reject(new Error(`Renderer failed to load (${code}): ${description}; URL: ${validatedURL}`));
    });
    mainWindow.webContents.once("render-process-gone", (_event, details) => {
      reject(new Error(`Renderer process exited before the window became visible: ${JSON.stringify(details)}`));
    });
  });
  mainWindow.webContents.on("did-fail-load", (_event, code, description, validatedURL, isMainFrame) => {
    if (isMainFrame) log(`Renderer failed to load (${code}): ${description}; URL: ${validatedURL}`);
  });
  mainWindow.webContents.on("render-process-gone", (_event, details) => {
    log("Renderer process exited unexpectedly", details);
  });
  mainWindow.on("closed", () => { mediaConsents.delete(mainWindow?.webContents?.id); mainWindow = null; });

  await mainWindow.loadURL(url);
  await windowReady;
  log(`Desktop window loaded and visible: ${url}`);
}

async function startDesktop() {
  try {
    startupLog = path.join(app.getPath("userData"), "logs", "startup.log");
    fs.mkdirSync(path.dirname(startupLog), { recursive: true });
    log("Starting VoiceConnect P2P desktop shell; graphics backend: " + graphicsBackend);

    const proxy = process.env.HTTPS_PROXY || process.env.https_proxy || process.env.HTTP_PROXY || process.env.http_proxy;
    if (proxy) {
      await session.defaultSession.setProxy({ proxyRules: proxy });
      log("Configured desktop network proxy");
    }

    // The app's own local UI is trusted. Keep camera/microphone permissions
    // scoped to that local origin; never grant permissions to remote origins.
    session.defaultSession.setPermissionRequestHandler((webContents, permission, callback, details) => {
      let trusted = false;
      try {
        trusted = new URL(webContents.getURL()).hostname === "127.0.0.1";
      } catch {}
      const granted = mediaConsents.get(webContents.id) || new Set();
      const requestedTypes = Array.isArray(details?.mediaTypes) ? details.mediaTypes : [];
      const mediaAllowed = permission === "media" && requestedTypes.length > 0 &&
        requestedTypes.every(type => granted.has(type === "video" ? "camera" : type === "audio" ? "microphone" : ""));
      callback(trusted && (mediaAllowed || permission === "display-capture"));
    });

    const dataDir = path.join(app.getPath("userData"), "data");
    fs.mkdirSync(dataDir, { recursive: true });
    process.env.HOST = "127.0.0.1";
    process.env.VOICECONNECT_REGISTRY = path.join(dataDir, "peers.json");

    const serverModule = await import(pathToFileURL(path.join(__dirname, "server.js")).href);
    // Bind an ephemeral loopback port to avoid collisions with another local
    // service. Do not create the BrowserWindow until the HTTP listener is ready.
    const listening = await serverModule.startServer({ host: "127.0.0.1", port: 0 });
    localServer = listening.server;
    const url = `http://127.0.0.1:${listening.port}/`;
    await createWindow(url);
    log("VoiceConnect desktop startup completed");
  } catch (error) {
    showStartupFailure("The local UI service or desktop window failed to initialize.", error);
  }
}

const hasSingleInstanceLock = app.requestSingleInstanceLock();
if (!hasSingleInstanceLock) {
  app.quit();
} else {
  app.on("second-instance", () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }
  });

  app.whenReady().then(startDesktop).catch(error => {
    showStartupFailure("Electron failed during application initialization.", error);
  });

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0 && localServer) {
      createWindow(`http://127.0.0.1:${localServer.address().port}/`).catch(error => {
        showStartupFailure("The VoiceConnect window could not be reopened.", error);
      });
    }
  });

  app.on("window-all-closed", () => {
    if (process.platform !== "darwin") app.quit();
  });

  app.on("before-quit", () => {
    if (localServer?.listening) localServer.close(error => {
      if (error) log("Local HTTP server shutdown failed", error);
    });
  });
}
