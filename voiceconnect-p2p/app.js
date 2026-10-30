const $ = (id) => document.getElementById(id);
const roomInput = $("room"), joinBtn = $("joinBtn"), leaveBtn = $("leaveBtn");
const startMediaBtn = $("startMediaBtn"), muteBtn = $("muteBtn"), cameraBtn = $("cameraBtn");
const localVideo = $("localVideo"), peersNode = $("peers");
const peerConnections = new Map(), peerProfiles = new Map(), pendingCandidates = new Map();
let socket = null, myId = null, roomName = null, localStream = null, avatarData = "";
let muted = false, cameraOff = false;
const defaultIceServers = [{ urls: "stun:stun.l.google.com:19302" }];
let rtcConfig = { iceServers: defaultIceServers };
const savedProfile = JSON.parse(localStorage.getItem("vc-profile") || "{}");
$("nickname").value = savedProfile.nickname || "";
$("savePeer").checked = savedProfile.savePeer === true;
if (savedProfile.avatar) avatarData = savedProfile.avatar;
function status(text, online = false) { $("statusText").textContent = text; $("statusDot").parentElement.classList.toggle("online", online); }
function send(data) { if (socket?.readyState === WebSocket.OPEN) socket.send(JSON.stringify(data)); }
function signal(to, payload) { send({ type: "signal", to, payload }); }
function profile() { return { nickname: $("nickname").value.trim().slice(0,32) || "Guest", avatar: avatarData, saveLocally: $("savePeer").checked }; }
function sendProfile() { const p = profile(); localStorage.setItem("vc-profile", JSON.stringify({ nickname:p.nickname, avatar:p.avatar, savePeer:p.saveLocally })); send({ type:"profile", ...p }); }
function makePeerCard(id, data = {}) {
  const card = document.createElement("article"); card.className = "peer-card";
  const head = document.createElement("div"); head.className = "peer-head";
  const avatar = document.createElement("img"); avatar.className = "peer-avatar"; avatar.alt = ""; avatar.src = data.avatar || "avatar.svg";
  const label = document.createElement("div"); label.className = "peer-label"; label.textContent = data.nickname || "Peer " + id.slice(0,8);
  head.append(avatar,label);
  const video = document.createElement("video"); video.autoplay = true; video.playsInline = true;
  card.append(head,video); peersNode.append(card);
  return { card, video, label, avatar };
}
function updatePeerCard(id, data) {
  peerProfiles.set(id,data);
  const item=peerConnections.get(id); if(item){ item.label.textContent=data.nickname || "Peer "+id.slice(0,8); item.avatar.src=data.avatar || "avatar.svg"; }
}
async function createPeer(id, initiator, data = {}) {
  if(peerConnections.has(id)) return peerConnections.get(id).pc;
  const ui=makePeerCard(id,data), pc=new RTCPeerConnection(rtcConfig), record={pc,...ui};
  peerConnections.set(id,record);
  if(localStream) for(const track of localStream.getTracks()) pc.addTrack(track,localStream);
  pc.ontrack=(event)=>{record.video.srcObject=event.streams[0];};
  pc.onicecandidate=(event)=>{if(event.candidate)signal(id,{candidate:event.candidate});};
  pc.onconnectionstatechange=()=>{if(["failed","closed"].includes(pc.connectionState))removePeer(id);};
  pc.onicecandidateerror=(event)=>console.warn("ICE candidate error",event.errorText);
  updatePeerCount();
  if(initiator){const offer=await pc.createOffer();await pc.setLocalDescription(offer);signal(id,{description:pc.localDescription});}
  return pc;
}
function removePeer(id){const item=peerConnections.get(id);if(!item)return;item.pc.close();item.card.remove();peerConnections.delete(id);pendingCandidates.delete(id);updatePeerCount();}
function updatePeerCount(){const n=peerConnections.size;$("peerCount").textContent=n+(n===1?" peer":" peers");if(!n)peersNode.innerHTML='<div class="empty panel">No remote peers discovered yet.</div>';}
async function handleSignal(from,payload){
  const pc=await createPeer(from,false,peerProfiles.get(from)||{});
  if(payload.description){
    await pc.setRemoteDescription(payload.description);
    const queued=pendingCandidates.get(from)||[];for(const c of queued)await pc.addIceCandidate(c);pendingCandidates.delete(from);
    if(payload.description.type==="offer"){const answer=await pc.createAnswer();await pc.setLocalDescription(answer);signal(from,{description:pc.localDescription});}
  }else if(payload.candidate){
    if(pc.remoteDescription)try{await pc.addIceCandidate(payload.candidate);}catch(err){console.warn("ICE candidate rejected",err);}
    else{const q=pendingCandidates.get(from)||[];q.push(payload.candidate);pendingCandidates.set(from,q);}
  }
}
function connectSignaling(){return new Promise((resolve,reject)=>{
  const scheme=location.protocol==="https:"?"wss:":"ws:";
  socket=new WebSocket(scheme+"//"+location.host+"/signal");
  const timeout=setTimeout(()=>reject(new Error("Signaling server timed out")),10000);
  socket.onmessage=async(event)=>{
    const msg=JSON.parse(event.data);
    if(msg.type==="welcome")myId=msg.peerId;
    if(msg.type==="joined"){
      clearTimeout(timeout);roomName=msg.room;status("Discovering peers · "+roomName,true);joinBtn.disabled=true;leaveBtn.disabled=false;roomInput.disabled=true;$("saveProfileBtn").disabled=false;
      for(const p of msg.peers){peerProfiles.set(p.peerId,p);await createPeer(p.peerId,true,p);}sendProfile();resolve();
    }
    if(msg.type==="peer-joined"){peerProfiles.set(msg.peer.peerId,msg.peer);status("Peer discovered · "+msg.peer.nickname,true);await createPeer(msg.peer.peerId,false,msg.peer);}
    if(msg.type==="peer-profile")updatePeerCard(msg.peer.peerId,msg.peer);
    if(msg.type==="peer-left"){removePeer(msg.peerId);peerProfiles.delete(msg.peerId);status("Peer left · "+roomName,true);}
    if(msg.type==="signal")await handleSignal(msg.from,msg.payload);\n    if(msg.type==="chat")renderChat(msg.message);
    if(msg.type==="profile-saved")$("profileStatus").textContent=msg.saved?"Profile and observed IP saved to local JSON registry.":"Profile active for this session; persistent IP logging is off.";
    if(msg.type==="error")status(msg.message);
  };
  socket.onerror=()=>{clearTimeout(timeout);reject(new Error("Could not connect to signaling service"));};
  socket.onclose=()=>{if(roomName)cleanupRoom();};
  socket.onopen=()=>send({type:"join",room:roomInput.value.trim()});
});}
async function startMedia(){
  if(!navigator.mediaDevices?.getUserMedia)throw new Error("Camera/microphone requires HTTPS or localhost.");
  const videoId=$("cameraSelect").value||undefined,audioId=$("micSelect").value||undefined;
  localStream=await navigator.mediaDevices.getUserMedia({audio:audioId?{deviceId:{exact:audioId},echoCancellation:true,noiseSuppression:true}:{echoCancellation:true,noiseSuppression:true},video:videoId?{deviceId:{exact:videoId},width:{ideal:1280},height:{ideal:720}}:{width:{ideal:1280},height:{ideal:720}}});
  localVideo.srcObject=localStream;
  for(const [id,{pc}] of peerConnections){for(const track of localStream.getTracks())pc.addTrack(track,localStream);const offer=await pc.createOffer();await pc.setLocalDescription(offer);signal(id,{description:pc.localDescription});}
  $("mediaState").textContent="Camera & mic active";muteBtn.disabled=cameraBtn.disabled=false;startMediaBtn.disabled=true;await refreshDevices();
}
async function refreshDevices(){if(!navigator.mediaDevices?.enumerateDevices)return;const devices=await navigator.mediaDevices.enumerateDevices();for(const[kind,id]of[["videoinput","cameraSelect"],["audioinput","micSelect"]]){const select=$(id),selected=select.value;select.replaceChildren(new Option(kind==="videoinput"?"Default camera":"Default microphone",""));devices.filter(d=>d.kind===kind).forEach((d,i)=>select.add(new Option(d.label||kind+" "+(i+1),d.deviceId)));if([...select.options].some(o=>o.value===selected))select.value=selected;}}
function cleanupRoom(){for(const id of[...peerConnections.keys()])removePeer(id);peerProfiles.clear();roomName=null;joinBtn.disabled=false;leaveBtn.disabled=true;roomInput.disabled=false;$("saveProfileBtn").disabled=true;status("Offline");updatePeerCount();}
function leaveRoom(){send({type:"leave"});socket?.close();socket=null;cleanupRoom();}
joinBtn.addEventListener("click",async()=>{try{joinBtn.disabled=true;status("Connecting…");await connectSignaling();}catch(err){status(err.message);joinBtn.disabled=false;socket?.close();socket=null;}});
leaveBtn.addEventListener("click",leaveRoom);
startMediaBtn.addEventListener("click",async()=>{try{await startMedia();}catch(err){status(err.message);}});
muteBtn.addEventListener("click",()=>{muted=!muted;localStream?.getAudioTracks().forEach(t=>t.enabled=!muted);muteBtn.textContent=muted?"Unmute mic":"Mute mic";});
cameraBtn.addEventListener("click",()=>{cameraOff=!cameraOff;localStream?.getVideoTracks().forEach(t=>t.enabled=!cameraOff);cameraBtn.textContent=cameraOff?"Turn camera on":"Turn camera off";});
$("saveProfileBtn").addEventListener("click",sendProfile);
$("avatarFile").addEventListener("change",async(e)=>{const file=e.target.files?.[0];if(!file)return;if(file.size>100000) return status("Avatar must be 100 KB or smaller");if(!/^image\/(png|jpeg|webp|gif)$/.test(file.type))return status("Choose PNG, JPEG, WebP or GIF");avatarData=await new Promise((resolve,reject)=>{const r=new FileReader();r.onload=()=>resolve(r.result);r.onerror=reject;r.readAsDataURL(file);});if(roomName)sendProfile();});
$("applyNetworkBtn").addEventListener("click",async()=>{
  const url=$("turnUrl").value.trim(),username=$("turnUser").value.trim(),credential=$("turnPass").value;
  rtcConfig={iceServers:[...defaultIceServers,...(url?[{urls:url,username,credential}]:[])]};
  for(const[id,item]of peerConnections){try{await item.pc.setConfiguration(rtcConfig);const offer=await item.pc.createOffer({iceRestart:true});await item.pc.setLocalDescription(offer);signal(id,{description:item.pc.localDescription});}catch(err){console.warn(err);}}
  status("ICE configuration applied",!!roomName);
});
if(navigator.mediaDevices?.addEventListener)navigator.mediaDevices.addEventListener("devicechange",refreshDevices);
refreshDevices().catch(()=>{});
window.addEventListener("beforeunload",()=>{send({type:"leave"});socket?.close();});

const emojiSet = [..."😀 😃 😄 😁 😆 😅 😂 🙂 🙃 😉 😊 😇 🥰 😍 🤩 😘 😗 😚 😙 🥲 😋 😛 😜 🤪 😝 🤑 🤗 🤭 🫢 🫣 🤫 🤔 🫡 🤐 🤨 😐 😑 😶 🫥 😏 😒 🙄 😬 😮‍💨 🤥 😌 😔 😪 🤤 😴 😷 🤒 🤕 🤢 🤮 🤧 🥵 🥶 🥴 😵 🤯 🤠 🥳 🥸 😎 🤓 🧐 😕 🫤 😟 🙁 ☹️ 😮 😯 😲 😳 🥺 🥹 😦 😧 😨 😰 😥 😢 😭 😱 😖 😣 😞 😓 😩 😫 🥱 😤 😡 😠 🤬 😈 👿 💀 ☠️ 💩 🤡 👻 👽 👾 🤖 🎃 😺 😸 😹 😻 😼 😽 🙀 😿 😾".split(" "),
..."👋 🤚 🖐️ ✋ 🖖 🫱 🫲 🫳 🫴 👌 🤌 🤏 ✌️ 🤞 🫰 🤟 🤘 🤙 👈 👉 👆 🖕 👇 ☝️ 👍 👎 ✊ 👊 🤛 🤜 👏 🙌 🫶 👐 🤲 🙏 ✍️ 💅 🤳 💪 🦾 🦿 🦵 🦶 👂 🦻 👃 🧠 🫀 🫁 🦷 🦴 👀 👁️ 👅 👄".split(" "),
..."❤️ 🧡 💛 💚 💙 💜 🖤 🤍 🤎 💔 ❣️ 💕 💞 💓 💗 💖 💘 💝 💟 ♥️ 💌 💋 💯 💢 💥 💫 💦 💨 🕳️ 💣 💬 👁️‍🗨️ 🗨️ 🗯️ 💭 💤".split(" "),
..."🐶 🐱 🐭 🐹 🐰 🦊 🐻 🐼 🐻‍❄️ 🐨 🐯 🦁 🐮 🐷 🐸 🐵 🙈 🙉 🙊 🐔 🐧 🐦 🐤 🦆 🦅 🦉 🦇 🐺 🐗 🐴 🦄 🐝 🪱 🦋 🐌 🐞 🐜 🪰 🪲 🦟 🦗 🕷️ 🦂 🐢 🐍 🦎 🦖 🦕 🐙 🦑 🦐 🦞 🦀 🐡 🐠 🐟 🐬 🐳 🦈 🐊 🐅 🐆 🦓 🦍 🦧 🐘 🦛 🦏 🐪 🐫 🦒 🦘 🦬 🐃 🐂 🐄 🐎 🐖 🐏 🐑 🦙 🐐 🦌 🐕 🐩 🦮 🐈 🐓 🦃 🦚 🦜 🦢 🦩 🕊️ 🐇 🦝 🦨 🦡 🦦 🦥 🐁 🐀 🐿️ 🦔".split(" "),
..."🍏 🍎 🍐 🍊 🍋 🍌 🍉 🍇 🍓 🫐 🍈 🍒 🍑 🥭 🍍 🥥 🥝 🍅 🍆 🥑 🥦 🥬 🥒 🌶️ 🫑 🌽 🥕 🫒 🧄 🧅 🥔 🍠 🥐 🥯 🍞 🥖 🥨 🧀 🥚 🍳 🧈 🥞 🧇 🥓 🥩 🍗 🍖 🌭 🍔 🍟 🍕 🫓 🥪 🥙 🧆 🌮 🌯 🫔 🥗 🥘 🫕 🍝 🍜 🍲 🍛 🍣 🍱 🥟 🦪 🍤 🍙 🍚 🍘 🍥 🥠 🥮 🍢 🍡 🍧 🍨 🍦 🥧 🧁 🍰 🎂 🍮 🍭 🍬 🍫 🍿 🍩 🍪 🌰 🥜 🍯 🥛 🍼 ☕ 🫖 🍵 🧃 🥤 🧋 🍶 🍺 🍻 🥂 🍷 🥃 🍸 🍹 🧉 🧊".split(" "),
..."⚽ 🏀 🏈 ⚾ 🥎 🎾 🏐 🏉 🎱 🏓 🏸 🥅 🏒 🏑 🥍 🏏 🪃 🥏 🎯 🪀 🪁 🎳 🎮 🕹️ 🎰 🎲 🧩 ♟️ 🃏 🀄 🎴 🎭 🎨 🧵 🪡 🎼 🎤 🎧 🎷 🪗 🎸 🎹 🎺 🎻 🥁 🪘 🎬 🎥 📷 📸 📹 📺 📻 🎙️ 🎚️ 🎛️ 🧭 ⏰ ⌚ 📱 💻 🖥️ 🖨️ ⌨️ 🖱️ 💾 💿 📀 🧮".split(" "),
..."🚗 🚕 🚙 🚌 🚎 🏎️ 🚓 🚑 🚒 🚐 🛻 🚚 🚛 🚜 🏍️ 🛵 🚲 🛴 🛹 🛼 🚂 🚆 🚇 🚊 🚉 ✈️ 🛫 🛬 🛩️ 🚀 🛸 🚁 ⛵ 🚤 🛥️ 🛳️ 🚢 ⚓ ⛽ 🚧 🚦 🚥 🗺️ 🏕️ 🏖️ 🏜️ 🏝️ 🏞️ 🏟️ 🏛️ 🏗️ 🏘️ 🏙️ 🌆 🌇 🌉 🌌 🌠 🎇 🎆 🌈 ☀️ 🌤️ ⛅ 🌥️ ☁️ 🌦️ 🌧️ ⛈️ 🌩️ 🌨️ ❄️ ☃️ ⛄ 🌬️ 💨 💧 💦 ☔ 🌊 🔥 🌪️ 🌫️".split(" "),
..."✅ ☑️ ✔️ ❌ ❎ ➕ ➖ ➗ ✖️ ♾️ ‼️ ⁉️ ❓ ❔ ❕ ❗ 💱 💲 🔱 ⚜️ 🔰 🔴 🟠 🟡 🟢 🔵 🟣 ⚫ ⚪ 🟤 🟥 🟧 🟨 🟩 🟦 🟪 ⬛ ⬜ 🟫 ⭐ 🌟 ✨ ⚡ ☄️ 💥 🎉 🎊 🎈 🏆 🥇 🥈 🥉 🏅 🎖️ 🏵️ 🎗️ 🎀 🧧 🎁".split(" ")];
const emojiPicker=$("emojiPicker");
for(const emoji of [...new Set(emojiSet)]){const b=document.createElement("button");b.type="button";b.textContent=emoji;b.title=emoji;b.addEventListener("click",()=>{$("chatInput").value+=emoji;$("chatInput").focus();});emojiPicker.append(b);}
$("emojiBtn").addEventListener("click",()=>{emojiPicker.hidden=!emojiPicker.hidden;});
$("chatForm").addEventListener("submit",e=>{e.preventDefault();const text=$("chatInput").value.normalize("NFC").trim();if(!text||!roomName)return;send({type:"chat",text});$("chatInput").value="";});
function renderChat(message){const row=document.createElement("article");row.className="chat-message";const meta=document.createElement("div");meta.className="meta";const who=document.createElement("span");who.textContent=message.nickname||"Guest";const when=document.createElement("time");when.textContent=new Date(message.timestamp).toLocaleTimeString();meta.append(who,when);const body=document.createElement("p");body.textContent=message.text;row.append(meta,body);$("chatMessages").append(row);$("chatMessages").scrollTop=$("chatMessages").scrollHeight;}
