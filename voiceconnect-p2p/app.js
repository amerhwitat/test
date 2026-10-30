const $ = (id) => document.getElementById(id);
const roomInput = $("room"), joinBtn = $("joinBtn"), leaveBtn = $("leaveBtn");
const startMediaBtn = $("startMediaBtn"), muteBtn = $("muteBtn"), cameraBtn = $("cameraBtn");
const localVideo = $("localVideo"), peersNode = $("peers");
const peerConnections = new Map();
let socket = null, myId = null, roomName = null, localStream = null;
let muted = false, cameraOff = false;
const rtcConfig = { iceServers: [{ urls: "stun:stun.l.google.com:19302" }] };

function status(text, online = false) {
  $("statusText").textContent = text;
  $("statusDot").parentElement.classList.toggle("online", online);
}
function send(data) {
  if (socket?.readyState === WebSocket.OPEN) socket.send(JSON.stringify(data));
}
function signal(to, payload) { send({ type: "signal", to, payload }); }
function makePeerCard(id) {
  const card = document.createElement("article");
  card.className = "peer-card";
  const video = document.createElement("video");
  video.autoplay = true; video.playsInline = true;
  const label = document.createElement("div");
  label.className = "peer-label"; label.textContent = "Peer " + id.slice(0, 8);
  card.append(video, label); peersNode.append(card);
  return { card, video };
}
async function createPeer(id, initiator) {
  if (peerConnections.has(id)) return peerConnections.get(id).pc;
  const ui = makePeerCard(id);
  const pc = new RTCPeerConnection(rtcConfig);
  const record = { pc, ...ui };
  peerConnections.set(id, record);
  if (localStream) for (const track of localStream.getTracks()) pc.addTrack(track, localStream);
  pc.ontrack = (event) => { record.video.srcObject = event.streams[0]; };
  pc.onicecandidate = (event) => { if (event.candidate) signal(id, { candidate: event.candidate }); };
  pc.onconnectionstatechange = () => {
    if (["failed", "closed", "disconnected"].includes(pc.connectionState)) {
      if (pc.connectionState !== "disconnected") removePeer(id);
    }
  };
  if (initiator) {
    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);
    signal(id, { description: pc.localDescription });
  }
  updatePeerCount();
  return pc;
}
function removePeer(id) {
  const record = peerConnections.get(id);
  if (!record) return;
  record.pc.close(); record.card.remove(); peerConnections.delete(id); updatePeerCount();
}
function updatePeerCount() {
  const n = peerConnections.size;
  $("peerCount").textContent = n + (n === 1 ? " peer" : " peers");
  if (!n) peersNode.innerHTML = '<div class="empty panel">No remote peers connected yet.</div>';
}
async function handleSignal(from, payload) {
  const pc = await createPeer(from, false);
  if (payload.description) {
    await pc.setRemoteDescription(payload.description);
    if (payload.description.type === "offer") {
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      signal(from, { description: pc.localDescription });
    }
  } else if (payload.candidate) {
    try { await pc.addIceCandidate(payload.candidate); } catch (err) { console.warn("ICE candidate rejected", err); }
  }
}
function connectSignaling() {
  return new Promise((resolve, reject) => {
    const scheme = location.protocol === "https:" ? "wss:" : "ws:";
    socket = new WebSocket(scheme + "//" + location.host + "/signal");
    const timeout = setTimeout(() => reject(new Error("Signaling server timed out")), 8000);
    socket.onmessage = async (event) => {
      const msg = JSON.parse(event.data);
      if (msg.type === "welcome") myId = msg.peerId;
      if (msg.type === "joined") {
        clearTimeout(timeout); roomName = msg.room; status("In room " + roomName, true);
        joinBtn.disabled = true; leaveBtn.disabled = false; roomInput.disabled = true;
        for (const id of msg.peers) await createPeer(id, true);
        resolve();
      }
      if (msg.type === "peer-joined") status("Peer joined · " + roomName, true);
      if (msg.type === "peer-left") { removePeer(msg.peerId); status("Peer left · " + roomName, true); }
      if (msg.type === "signal") await handleSignal(msg.from, msg.payload);
      if (msg.type === "error") status(msg.message);
    };
    socket.onerror = () => { clearTimeout(timeout); reject(new Error("Could not connect to signaling service")); };
    socket.onclose = () => { if (roomName) cleanupRoom(); };
    socket.onopen = () => send({ type: "join", room: roomInput.value.trim() });
  });
}
async function startMedia() {
  if (!navigator.mediaDevices?.getUserMedia) throw new Error("Camera/microphone access requires HTTPS or localhost in a supported browser.");
  const videoId = $("cameraSelect").value || undefined;
  const audioId = $("micSelect").value || undefined;
  localStream = await navigator.mediaDevices.getUserMedia({
    audio: audioId ? { deviceId: { exact: audioId }, echoCancellation: true, noiseSuppression: true } : { echoCancellation: true, noiseSuppression: true },
    video: videoId ? { deviceId: { exact: videoId }, width: { ideal: 1280 }, height: { ideal: 720 } } : { width: { ideal: 1280 }, height: { ideal: 720 } }
  });
  localVideo.srcObject = localStream;
  for (const { pc } of peerConnections.values()) {
    for (const track of localStream.getTracks()) pc.addTrack(track, localStream);
    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);
    const peerId = [...peerConnections.entries()].find(([, item]) => item.pc === pc)?.[0];
    if (peerId) signal(peerId, { description: pc.localDescription });
  }
  $("mediaState").textContent = "Camera & mic active";
  muteBtn.disabled = cameraBtn.disabled = true ? false : false;
  muteBtn.disabled = cameraBtn.disabled = false;
  startMediaBtn.disabled = true;
  await refreshDevices();
}
async function refreshDevices() {
  const devices = await navigator.mediaDevices.enumerateDevices();
  for (const [kind, id] of [["videoinput", "cameraSelect"], ["audioinput", "micSelect"]]) {
    const select = $(id), selected = select.value;
    select.replaceChildren(new Option(kind === "videoinput" ? "Default camera" : "Default microphone", ""));
    devices.filter(d => d.kind === kind).forEach((d, i) => select.add(new Option(d.label || kind + " " + (i + 1), d.deviceId)));
    if ([...select.options].some(o => o.value === selected)) select.value = selected;
  }
}
function cleanupRoom() {
  for (const id of [...peerConnections.keys()]) removePeer(id);
  roomName = null; joinBtn.disabled = false; leaveBtn.disabled = true; roomInput.disabled = false;
  status("Offline"); updatePeerCount();
}
function leaveRoom() {
  send({ type: "leave" }); socket?.close(); socket = null; cleanupRoom();
}
joinBtn.addEventListener("click", async () => {
  try { joinBtn.disabled = true; status("Connecting…"); await connectSignaling(); }
  catch (err) { status(err.message); joinBtn.disabled = false; socket?.close(); socket = null; }
});
leaveBtn.addEventListener("click", leaveRoom);
startMediaBtn.addEventListener("click", async () => {
  try { await startMedia(); } catch (err) { status(err.message); }
});
muteBtn.addEventListener("click", () => {
  muted = !muted; localStream?.getAudioTracks().forEach(t => t.enabled = !muted);
  muteBtn.textContent = muted ? "Unmute mic" : "Mute mic";
});
cameraBtn.addEventListener("click", () => {
  cameraOff = !cameraOff; localStream?.getVideoTracks().forEach(t => t.enabled = !cameraOff);
  cameraBtn.textContent = cameraOff ? "Turn camera on" : "Turn camera off";
});
if (navigator.mediaDevices?.addEventListener) navigator.mediaDevices.addEventListener("devicechange", refreshDevices);
refreshDevices().catch(() => {});
window.addEventListener("beforeunload", () => { send({ type: "leave" }); socket?.close(); });
