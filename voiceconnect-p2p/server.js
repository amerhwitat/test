import http from "node:http";
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { extname, join, normalize, dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { createHmac, randomUUID, timingSafeEqual } from "node:crypto";
import { WebSocketServer, WebSocket } from "ws";

const root = fileURLToPath(new URL(".", import.meta.url));
const port = Number(process.env.PORT || 8787);
const rooms = new Map();
const registryPath = process.env.VOICECONNECT_REGISTRY || join(root, "data", "peers.json");
const trustProxy = process.env.TRUST_PROXY === "1";
const authSecret = process.env.VOICECONNECT_AUTH_SECRET || "";
const adminSecret = process.env.VOICECONNECT_ADMIN_SECRET || "";
const allowedOrigins = new Set((process.env.ALLOWED_ORIGINS || "").split(",").map(x => x.trim()).filter(Boolean));
const rateBuckets = new Map();
const production = process.env.NODE_ENV === "production";
if (production && authSecret.length < 32) throw new Error("Production requires VOICECONNECT_AUTH_SECRET (32+ chars).");
if (production && allowedOrigins.size === 0) throw new Error("Production requires ALLOWED_ORIGINS.");
if (production && (!process.env.TURN_URL || !process.env.TURN_SHARED_SECRET)) throw new Error("Production requires TURN_URL and TURN_SHARED_SECRET.");
function rateAllowed(key, limit = 30, windowMs = 60000) {
  const now = Date.now(), bucket = rateBuckets.get(key);
  if (!bucket || now - bucket.start >= windowMs) { rateBuckets.set(key, { start: now, count: 1 }); return true; }
  return ++bucket.count <= limit;
}
function signInvite(room, expires, nonce) {
  const payload = Buffer.from(JSON.stringify({ room, exp: expires, nonce })).toString("base64url");
  return payload + "." + createHmac("sha256", authSecret).update(payload).digest("base64url");
}
function verifyInvite(token, room) {
  if (!authSecret) return !production;
  if (typeof token !== "string" || token.length > 2048) return false;
  const [payload, signature, extra] = token.split(".");
  if (!payload || !signature || extra) return false;
  const expected = createHmac("sha256", authSecret).update(payload).digest();
  const actual = Buffer.from(signature, "base64url");
  if (actual.length !== expected.length || !timingSafeEqual(actual, expected)) return false;
  try { const data = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")); return data.room === room && Number.isInteger(data.exp) && data.exp > Math.floor(Date.now()/1000); } catch { return false; }
}
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
    const origin = req.headers.origin;
    if (production && (!origin || !allowedOrigins.has(origin))) { res.writeHead(403); res.end("Origin not allowed"); return; }
    const clientIp = observedIp(req);
    if (!rateAllowed("http:" + clientIp, 120)) { res.writeHead(429, { "Retry-After": "60" }); res.end("Rate limit exceeded"); return; }
    const requestUrl = new URL(req.url, "http://localhost");
    if (requestUrl.pathname === "/api/invitations" && req.method === "POST") {
      if (!authSecret || !adminSecret || req.headers.authorization !== "Bearer " + adminSecret) { res.writeHead(401); res.end("Unauthorized"); return; }
      let body = "";
      for await (const chunk of req) { body += chunk; if (body.length > 4096) { res.writeHead(413); res.end("Too large"); return; } }
      const input = JSON.parse(body || "{}"), room = String(input.room || "");
      if (!/^[a-zA-Z0-9_-]{3,64}$/.test(room)) { res.writeHead(400); res.end("Invalid room"); return; }
      const ttl = Math.min(86400, Math.max(60, Number(input.ttlSeconds) || 3600));
      const token = signInvite(room, Math.floor(Date.now()/1000) + ttl, randomUUID());
      res.writeHead(201, { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" });
      res.end(JSON.stringify({ room, token, expiresInSeconds: ttl })); return;
    }
    if (requestUrl.pathname === "/api/ice-servers" && req.method === "GET") {
      const turnUrl = process.env.TURN_URL;
      const turnSecret = process.env.TURN_SHARED_SECRET;
      const iceServers = [{ urls: process.env.STUN_URL || "stun:stun.l.google.com:19302" }];
      if (turnUrl && turnSecret) {
        const expiry = Math.floor(Date.now() / 1000) + 3600;
        const username = `${expiry}:${randomUUID()}`;
        const credential = createHmac("sha1", turnSecret).update(username).digest("base64");
        iceServers.push({ urls: turnUrl.split(",").map(value => value.trim()), username, credential });
      }
      res.writeHead(200, { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" });
      res.end(JSON.stringify({ iceServers, turnConfigured: Boolean(turnUrl && turnSecret), credentialTtlSeconds: 3600 }));
      return;
    }
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
const wss = new WebSocketServer({ noServer: true, maxPayload: 256 * 1024 });
server.on("upgrade", (req, socket, head) => {
  const origin = req.headers.origin, ip = observedIp(req);
  if ((production && (!origin || !allowedOrigins.has(origin))) || !rateAllowed("ws:" + ip, 20, 60000)) { socket.write("HTTP/1.1 403 Forbidden\\r\\n\\r\\n"); socket.destroy(); return; }
  if (new URL(req.url, "http://localhost").pathname !== "/signal") { socket.destroy(); return; }
  wss.handleUpgrade(req, socket, head, ws => wss.emit("connection", ws, req));
});
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
      if (!rateAllowed("join:" + ws.ip, 10, 60000)) return send(ws, { type: "error", message: "Too many join attempts" });
      if (!verifyInvite(msg.inviteToken, roomName)) return send(ws, { type: "error", message: "A valid, unexpired room invitation is required" });
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
        const previous = registry.peers.find(p => p.userGuid === suppliedGuid);
        const entry = { peerId: ws.id, userGuid: suppliedGuid, nickname, avatar, observedIp: ws.ip, firstSeen: previous?.firstSeen || now, lastSeen: now };
        registry.peers = [entry, ...registry.peers.filter(p => p.userGuid !== suppliedGuid)].slice(0, 500);
        try { await persistRegistry(); send(ws, { type: "profile-saved", saved: true }); }
        catch (err) { send(ws, { type: "error", message: "Could not save local peer registry: " + err.message }); }
      } else send(ws, { type: "profile-saved", saved: false });
      for (const peer of rooms.get(ws.room)?.values() || []) if (peer !== ws) send(peer, { type: "peer-profile", peer: profileFor(ws) });
      return;
    }
    if (msg.type === "chat" && ws.room) {
      if (!rateAllowed("chat:" + ws.id, 20, 10000)) return send(ws, { type: "error", message: "Chat rate limit exceeded" });
      const text = typeof msg.text === "string" ? msg.text.normalize("NFC").slice(0, 4000) : "";
      if (!text.trim()) return;
      const packet = { type: "chat", message: { id: crypto.randomUUID(), peerId: ws.id, userGuid: ws.profile.userGuid, nickname: ws.profile.nickname, text, timestamp: new Date().toISOString() } };
      for (const peer of rooms.get(ws.room)?.values() || []) send(peer, packet);
      return;
    }
    if (msg.type === "signal" && ws.room) {
      if (!rateAllowed("signal:" + ws.id, 120, 10000)) return send(ws, { type: "error", message: "Signaling rate limit exceeded" });
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
