import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { setTimeout as delay } from "node:timers/promises";

const executable = process.argv[2];
if (!executable) throw new Error("Usage: node scripts/windows-click-smoke.mjs <packaged-electron-exe>");
const port = Number(process.env.VOICECONNECT_CDP_PORT || 49229);
const child = spawn(executable, [`--remote-debugging-port=${port}`], { stdio: "ignore" });
let socket;
let nextId = 0;
const pending = new Map();
const rendererDiagnostics = [];

function cdp(method, params = {}) {
  return new Promise((resolve, reject) => {
    const id = ++nextId;
    const timer = setTimeout(() => {
      pending.delete(id);
      reject(new Error("CDP timeout: " + method));
    }, 10000);
    pending.set(id, { resolve, reject, timer, method });
    socket.send(JSON.stringify({ id, method, params }));
  });
}
async function evaluate(expression) {
  const result = await cdp("Runtime.evaluate", {
    expression, returnByValue: true, awaitPromise: true
  });
  if (result.exceptionDetails) {
    throw new Error("Renderer evaluation failed: " + JSON.stringify(result.exceptionDetails));
  }
  return result.result?.value;
}
async function pageTarget() {
  const until = Date.now() + 45000;
  while (Date.now() < until) {
    if (child.exitCode !== null) {
      throw new Error("VoiceConnect exited before window startup: " + child.exitCode);
    }
    try {
      const response = await fetch(`http://127.0.0.1:${port}/json/list`);
      if (response.ok) {
        const targets = await response.json();
        const page = targets.find(item => item.type === "page" && item.webSocketDebuggerUrl);
        if (page) return page;
      }
    } catch {}
    await delay(400);
  }
  throw new Error("Electron remote-debugging page did not appear");
}
async function click(selector) {
  const point = await evaluate(`(() => {
    const e = document.querySelector(${JSON.stringify(selector)});
    if (!e) throw Error("Missing " + ${JSON.stringify(selector)});
    e.scrollIntoView({ block: "center", inline: "center", behavior: "instant" });
    const r = e.getBoundingClientRect();
    const x = r.left + r.width / 2, y = r.top + r.height / 2;
    const inViewport = x >= 0 && y >= 0 && x < window.innerWidth && y < window.innerHeight;
    const hit = inViewport ? document.elementFromPoint(x, y) : null;
    return {
      x, y, viewport: { width: window.innerWidth, height: window.innerHeight },
      disabled: !!e.disabled, visible: r.width > 0 && r.height > 0 && inViewport,
      hit: hit?.closest("button")?.id || hit?.id || hit?.tagName || null
    };
  })()`);
  assert.equal(point.disabled, false, selector + " disabled");
  assert.equal(point.visible, true, selector + " not visible");
  assert.ok(point.hit === selector.slice(1) || point.hit === "BUTTON",
    selector + " covered by " + point.hit);
  for (const type of ["mouseMoved", "mousePressed", "mouseReleased"]) {
    await cdp("Input.dispatchMouseEvent", {
      type, x: point.x, y: point.y, button: "left", clickCount: 1
    });
  }
}

try {
  const page = await pageTarget();
  socket = new WebSocket(page.webSocketDebuggerUrl);
  await new Promise((resolve, reject) => {
    socket.addEventListener("open", resolve, { once: true });
    socket.addEventListener("error", reject, { once: true });
  });
  socket.addEventListener("message", event => {
    let message;
    try { message = JSON.parse(event.data); } catch { return; }
    if (message.method === "Runtime.exceptionThrown" ||
        message.method === "Log.entryAdded" ||
        (message.method === "Runtime.consoleAPICalled" &&
         ["error", "assert"].includes(message.params?.type))) {
      rendererDiagnostics.push({ method: message.method, params: message.params });
      if (rendererDiagnostics.length > 30) rendererDiagnostics.shift();
    }
    if (!message.id || !pending.has(message.id)) return;
    const item = pending.get(message.id);
    pending.delete(message.id);
    clearTimeout(item.timer);
    if (message.error) item.reject(new Error(item.method + ": " + message.error.message));
    else item.resolve(message.result || {});
  });

  await cdp("Runtime.enable");
  await cdp("Log.enable");
  let boot = { ready: false, title: "", error: null, loading: "" };
  const readyDeadline = Date.now() + 30000;
  while (Date.now() < readyDeadline) {
    boot = await evaluate(`({
      ready: window.__voiceConnectRendererReady === true,
      title: document.title,
      error: window.__voiceConnectRendererError || null,
      loading: document.readyState,
      appScript: [...document.scripts].map(s => ({ src: s.src, type: s.type }))
    })`);
    if (boot.ready) break;
    if (boot.error) {
      throw new Error("Renderer initialization failed: " +
        JSON.stringify({ boot, diagnostics: rendererDiagnostics }));
    }
    await delay(200);
  }
  assert.equal(boot.ready, true,
    "Renderer did not finish binding controls within 30s: " +
    JSON.stringify({ boot, diagnostics: rendererDiagnostics }));

  await evaluate(`window.__voiceConnectTrustedClicks = [];
    for (const id of ["emojiBtn", "applyNetworkBtn", "clearAvatarBtn"]) {
      document.getElementById(id)?.addEventListener("click", event =>
        window.__voiceConnectTrustedClicks.push({ id, trusted: event.isTrusted }), true);
    }`);
  await click("#emojiBtn");
  await delay(100);
  assert.equal(await evaluate('document.getElementById("emojiPicker").hidden'),
    false, "Emoji button click did not open picker");
  await click("#emojiBtn");
  await delay(100);
  assert.equal(await evaluate('document.getElementById("emojiPicker").hidden'),
    true, "Emoji button click did not close picker");
  await click("#applyNetworkBtn");
  await delay(100);
  await click("#clearAvatarBtn");
  await delay(100);
  assert.equal(await evaluate('document.getElementById("statusText").textContent'),
    "ICE configuration applied", "Apply ICE handler did not run");
  const trusted = await evaluate("window.__voiceConnectTrustedClicks");
  assert.equal(trusted.length, 4, "Expected four delivered clicks: " + JSON.stringify(trusted));
  assert.ok(trusted.every(item => item.trusted), "Input was not delivered as trusted mouse events");
  console.log("PASS: packaged Windows GUI loaded; Chromium hit-testing and trusted mouse clicks activated UI handlers.");
} catch (error) {
  console.error(error);
  if (rendererDiagnostics.length) {
    console.error("Captured Chromium renderer diagnostics:",
      JSON.stringify(rendererDiagnostics, null, 2));
  }
  throw error;
} finally {
  try { socket?.close(); } catch {}
  if (child && child.exitCode === null) {
    child.kill();
    await Promise.race([new Promise(resolve => child.once("exit", resolve)), delay(5000)]);
  }
}
