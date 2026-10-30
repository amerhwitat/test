import http from "node:http";
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { extname, join, normalize, dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { WebSocketServer, WebSocket } from "ws";

const root = fileURLToPath(new URL(".", import.meta.url));
const port = Number(process.env.PORT || 8787);
const rooms = new Map();
const registryPath = process.env.VOICECONNECT_REGISTRY || join(root, "data", "peers.json");
const trustProxy = process.env.TRUST_PROXY === "1";
const mime = { ".html": "text/html; charset=utf-8", ".css": "text/css; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".json": "application/json; charset=utf-8", ".svg": "image/svg+xml" };
let registry = { version: 1, peers: [] };
let persistQueue = Promise.resolve();
try {
  const parsed = JSON.parse(await readFile(registryPath, "utf8"));
  if (parsed?.version === 1 && Array.isArray(parsed.peers)) registry = parsed;
} catch { /* first run: create registry on first consented profile */ }

function persistRegistry() {
  persistQueue = persistQueue.then(async () => {
    await mkdir(dirname(registryPath), { recursive: true });
    const temp = registryPath + ".tmp";
    await writeFile(temp, JSON.stringify(registry, null, 2), { mode: 0o600 });
    const { rename } = await import("node:fs/promises");
    await rename(temp, registryPath);
  });
  return persistQueue;
}
function observedIp(req) {
  if (trustProxy) {
    const forwarded = req.headers["x-forwarded-for"];
    if (typeof forwarded === "string" && forwarded.length < 512) return forwarded.split(",")[0].trim();
  }
  return req.socket.remoteAddress || "unknown";
}
const server = http.createServer(async (req, res) => {
  try {
    const pathname = decodeURIComponent(new URL(req.url, "http://localhost").pathname);
    const requested = pathname === "/" ? "/index.html" : pathname;
    const file = normalize(join(root, requested));
    if (!file.startsWith(root)) throw new Error("Invalid path");
    const data = await readFile(file);
    res.writeHead(200, { "Content-Type": mime[extname(file)] || "application/octet-stream", "X-Content-Type-Options": "nosniff", "Referrer-Policy": "no-referrer", "Cache-Control": "no-store" });
    res.end(data);
  } catch {
    res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
    res.end("Not found");
  }
});
const wss = new WebSocketServer({ server, path: "/signal", maxPayload: 256 * 1024 });
function send(ws, message) { if (ws.readyState === WebSocket.OPEN) ws.send(JSON.stringify(message)); }
function profileFor(ws) {
  return { peerId: ws.id, userGuid: ws.profile?.userGuid || ws.id, nickname: ws.profile?.nickname || "Guest", avatar: ws.profile?.avatar || "" };
}
function leave(ws) {
  const room = rooms.get(ws.room);
  if (!room) return;
  room.delete(ws.id);
  for (const peer of room.values()) send(peer, { type: "peer-left", peerId: ws.id });
  if (!room.size) rooms.delete(ws.room);
  ws.room = null;
}
wss.on("connection", (ws, req) => {
  ws.id = crypto.randomUUID();
  ws.room = null;
  ws.ip = observedIp(req);
  ws.profile = { userGuid: ws.id, nickname: "Guest", avatar: "" };
  send(ws, { type: "welcome", peerId: ws.id });
  ws.on("message", async (raw) => {
    let msg;
    try { msg = JSON.parse(raw.toString()); } catch { return send(ws, { type: "error", message: "Invalid JSON" }); }
    if (msg.type === "join") {
      const roomName = String(msg.room || "").trim().slice(0, 64);
      if (!/^[a-zA-Z0-9_-]{3,64}$/.test(roomName)) return send(ws, { type: "error", message: "Room must be 3–64 letters, numbers, _ or -" });
      leave(ws);
      const room = rooms.get(roomName) || new Map();
      if (room.size >= 8) return send(ws, { type: "error", message: "Room is full (maximum 8 peers)" });
      ws.room = roomName;
      const existing = [...room.values()].map(profileFor);
      room.set(ws.id, ws);
      rooms.set(roomName, room);
      send(ws, { type: "joined", room: roomName, peers: existing });
      for (const peer of room.values()) if (peer !== ws) send(peer, { type: "peer-joined", peer: profileFor(ws) });
      return;
    }
    if (msg.type === "profile" && ws.room) {
      const nickname = String(msg.nickname || "Guest").trim().replace(/[<>\u0000-\u001f]/g, "").slice(0, 32) || "Guest";
      const avatar = typeof msg.avatar === "string" && (msg.avatar.length < 160000 && (/^https:\/\//i.test(msg.avatar) || /^data:image\/(png|jpeg|webp|gif);base64,/i.test(msg.avatar))) ? msg.avatar : "";
      const suppliedGuid = typeof msg.userGuid === "string" && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(msg.userGuid) ? msg.userGuid.toLowerCase() : ws.id;
      ws.profile = { userGuid: suppliedGuid, nickname, avatar };
      const consent = msg.saveLocally === true;
      if (consent) {
        const now = new Date().toISOString();
        const previous = registry.peers.find(p => p.peerId === ws.id);
        const entry = { peerId: ws.id, userGuid: suppliedGuid, nickname, avatar, observedIp: ws.ip, firstSeen: previous?.firstSeen || now, lastSeen: now };
        registry.peers = [entry, ...registry.peers.filter(p => p.peerId !== ws.id)].slice(0, 500);
        try { await persistRegistry(); send(ws, { type: "profile-saved", saved: true }); }
        catch (err) { send(ws, { type: "error", message: "Could not save local peer registry: " + err.message }); }
      } else send(ws, { type: "profile-saved", saved: false });
      for (const peer of rooms.get(ws.room)?.values() || []) if (peer !== ws) send(peer, { type: "peer-profile", peer: profileFor(ws) });
      return;
    }
    if (msg.type === "chat" && ws.room) {
      const text = typeof msg.text === "string" ? msg.text.normalize("NFC").slice(0, 4000) : "";
      if (!text.trim()) return;
      const packet = { type: "chat", message: { id: crypto.randomUUID(), peerId: ws.id, userGuid: ws.profile.userGuid, nickname: ws.profile.nickname, text, timestamp: new Date().toISOString() } };
      for (const peer of rooms.get(ws.room)?.values() || []) send(peer, packet);
      return;
    }
    if (msg.type === "signal" && ws.room) {
      const target = rooms.get(ws.room)?.get(String(msg.to || ""));
      if (!target) return send(ws, { type: "error", message: "Peer is no longer in this room" });
      const payload = JSON.stringify(msg.payload ?? {});
      if (payload.length > 48 * 1024) return send(ws, { type: "error", message: "Signaling message too large" });
      send(target, { type: "signal", from: ws.id, payload: JSON.parse(payload) });
    }
    if (msg.type === "leave") leave(ws);
  });
  ws.on("close", () => leave(ws));
  ws.on("error", () => leave(ws));
});
export function startServer() {
  server.listen(port, process.env.HOST || "0.0.0.0", () => console.log(`VoiceConnect P2P listening on http://${process.env.HOST || "0.0.0.0"}:${port}; registry: ${registryPath}`));
  return server;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) startServer();
