const { app, BrowserWindow, dialog, session } = require("electron");
const path = require("node:path");
const fs = require("node:fs");
const { pathToFileURL } = require("node:url");

let localServer;
let mainWindow;
let startupLog;

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
      sandbox: true
    }
  });

  mainWindow.once("ready-to-show", () => {
    if (mainWindow && !mainWindow.isDestroyed()) mainWindow.show();
  });
  mainWindow.webContents.on("did-fail-load", (_event, code, description, validatedURL, isMainFrame) => {
    if (isMainFrame) log(`Renderer failed to load (${code}): ${description}; URL: ${validatedURL}`);
  });
  mainWindow.webContents.on("render-process-gone", (_event, details) => {
    log("Renderer process exited unexpectedly", details);
  });
  mainWindow.on("closed", () => { mainWindow = null; });

  await mainWindow.loadURL(url);
  log(`Desktop window loaded: ${url}`);
}

async function startDesktop() {
  try {
    startupLog = path.join(app.getPath("userData"), "logs", "startup.log");
    fs.mkdirSync(path.dirname(startupLog), { recursive: true });
    log("Starting VoiceConnect P2P desktop shell");

    const proxy = process.env.HTTPS_PROXY || process.env.https_proxy || process.env.HTTP_PROXY || process.env.http_proxy;
    if (proxy) {
      await session.defaultSession.setProxy({ proxyRules: proxy });
      log("Configured desktop network proxy");
    }

    // The app's own local UI is trusted. Keep camera/microphone permissions
    // scoped to that local origin; never grant permissions to remote origins.
    session.defaultSession.setPermissionRequestHandler((webContents, permission, callback) => {
      let trusted = false;
      try {
        trusted = new URL(webContents.getURL()).hostname === "127.0.0.1";
      } catch {}
      callback(trusted && ["media", "display-capture"].includes(permission));
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
