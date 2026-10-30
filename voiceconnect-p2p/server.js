import http from "node:http";
import { readFile } from "node:fs/promises";
import { extname, join, normalize } from "node:path";
import { fileURLToPath } from "node:url";
import { WebSocketServer, WebSocket } from "ws";

const root = fileURLToPath(new URL(".", import.meta.url));
const port = Number(process.env.PORT || 8787);
const rooms = new Map();
const mime = { ".html": "text/html; charset=utf-8", ".css": "text/css; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".json": "application/json; charset=utf-8", ".svg": "image/svg+xml" };

const server = http.createServer(async (req, res) => {
  try {
    const pathname = decodeURIComponent(new URL(req.url, "http://localhost").pathname);
    const requested = pathname === "/" ? "/index.html" : pathname;
    const file = normalize(join(root, requested));
    if (!file.startsWith(root)) throw new Error("Invalid path");
    const data = await readFile(file);
    res.writeHead(200, { "Content-Type": mime[extname(file)] || "application/octet-stream", "X-Content-Type-Options": "nosniff", "Referrer-Policy": "no-referrer" });
    res.end(data);
  } catch {
    res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
    res.end("Not found");
  }
});

const wss = new WebSocketServer({ server, path: "/signal", maxPayload: 64 * 1024 });
function send(ws, message) {
  if (ws.readyState === WebSocket.OPEN) ws.send(JSON.stringify(message));
}
function leave(ws) {
  const room = rooms.get(ws.room);
  if (!room) return;
  room.delete(ws.id);
  for (const peer of room.values()) send(peer, { type: "peer-left", peerId: ws.id });
  if (!room.size) rooms.delete(ws.room);
  ws.room = null;
}
wss.on("connection", (ws) => {
  ws.id = crypto.randomUUID();
  ws.room = null;
  send(ws, { type: "welcome", peerId: ws.id });
  ws.on("message", (raw) => {
    let msg;
    try { msg = JSON.parse(raw.toString()); } catch { return send(ws, { type: "error", message: "Invalid JSON" }); }
    if (msg.type === "join") {
      const roomName = String(msg.room || "").trim().slice(0, 64);
      if (!/^[a-zA-Z0-9_-]{3,64}$/.test(roomName)) return send(ws, { type: "error", message: "Room must be 3–64 letters, numbers, _ or -" });
      leave(ws);
      const room = rooms.get(roomName) || new Map();
      if (room.size >= 8) return send(ws, { type: "error", message: "Room is full (maximum 8 peers)" });
      ws.room = roomName;
      const existing = [...room.keys()];
      room.set(ws.id, ws);
      rooms.set(roomName, room);
      send(ws, { type: "joined", room: roomName, peers: existing });
      for (const peer of room.values()) if (peer !== ws) send(peer, { type: "peer-joined", peerId: ws.id });
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
server.listen(port, "0.0.0.0", () => console.log(`VoiceConnect P2P listening on http://localhost:${port}`));
