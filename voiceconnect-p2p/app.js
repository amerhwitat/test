const $ = (id) => document.getElementById(id);
const roomInput = $("room"), joinBtn = $("joinBtn"), leaveBtn = $("leaveBtn");
const startMediaBtn = $("startMediaBtn"), muteBtn = $("muteBtn"), cameraBtn = $("cameraBtn");
const localVideo = $("localVideo"), peersNode = $("peers"), shareScreenBtn = $("shareScreenBtn");
const peerConnections = new Map(), peerProfiles = new Map(), pendingCandidates = new Map();
let socket = null, myId = null, roomName = null, localStream = null, screenStream = null, avatarData = "";
const savedProfile = JSON.parse(localStorage.getItem("vc-profile") || "{}");
const inviteParams = new URLSearchParams(location.search);
if (inviteParams.get("room")) $("room").value = inviteParams.get("room");
if (inviteParams.get("invite")) $("inviteToken").value = inviteParams.get("invite");
const userGuid = savedProfile.userGuid || crypto.randomUUID();
localStorage.setItem("vc-profile", JSON.stringify({...savedProfile, userGuid}));
let muted = false, cameraOff = false;
const defaultIceServers = [{ urls: "stun:stun.l.google.com:19302" }];
let rtcConfig = { iceServers: defaultIceServers };
$("userGuid").textContent = userGuid;
$("nickname").value = savedProfile.nickname || "";
$("savePeer").checked = savedProfile.savePeer === true;
if (savedProfile.avatar) { avatarData = savedProfile.avatar; const preview=$("avatarPreview"); preview.src=avatarData; preview.hidden=false; }
function status(text, online = false) { $("statusText").textContent = text; $("statusDot").parentElement.classList.toggle("online", online); }
function send(data) { if (socket?.readyState === WebSocket.OPEN) socket.send(JSON.stringify(data)); }
function signal(to, payload) { send({ type: "signal", to, payload }); }
function profile() { return { userGuid, nickname: $("nickname").value.trim().slice(0,32) || "Guest", avatar: avatarData, saveLocally: $("savePeer").checked }; }
function sendProfile() { const p = profile(); localStorage.setItem("vc-profile", JSON.stringify({ userGuid, nickname:p.nickname, avatar:p.avatar, savePeer:p.saveLocally })); send({ type:"profile", ...p }); }
function makePeerCard(id, data = {}) {
  const card = document.createElement("article"); card.className = "peer-card";
  const head = document.createElement("div"); head.className = "peer-head";
  const avatar = document.createElement("img"); avatar.className = "peer-avatar"; avatar.alt = ""; avatar.src = data.avatar || "avatar.svg";
  const label = document.createElement("div"); label.className = "peer-label"; label.textContent = (data.nickname || "Peer") + " · " + (data.userGuid || id).slice(0,8);
  head.append(avatar,label);
  const video = document.createElement("video"); video.autoplay = true; video.playsInline = true;
  card.append(head,video); peersNode.append(card);
  return { card, video, label, avatar };
}
function updatePeerCard(id, data) {
  peerProfiles.set(id,data);
  const item=peerConnections.get(id); if(item){ item.label.textContent=(data.nickname || "Peer") + " · " + (data.userGuid || id).slice(0,8); item.avatar.src=data.avatar || "avatar.svg"; }
}
async function createPeer(id, initiator, data = {}) {
  if(peerConnections.has(id)) return peerConnections.get(id).pc;
  const ui=makePeerCard(id,data), pc=new RTCPeerConnection(rtcConfig), record={pc,...ui};
  peerConnections.set(id,record);
  if(localStream) for(const track of localStream.getTracks()) pc.addTrack(track,localStream);
  if(screenStream) for(const track of screenStream.getVideoTracks()) pc.addTrack(track,screenStream);
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
async function connectSignaling(){
  try {
    const response = await fetch("/api/ice-servers", { cache: "no-store" });
    if (response.ok) {
      const config = await response.json();
      rtcConfig = { iceServers: config.iceServers || defaultIceServers };
    }
  } catch (err) { console.warn("Could not load server ICE configuration", err); }
  return new Promise((resolve,reject)=>{
  const scheme=location.protocol==="https:"?"wss:":"ws:";
  socket=new WebSocket(scheme+"//"+location.host+"/signal");
  const timeout=setTimeout(()=>reject(new Error("Signaling server timed out")),10000);
  socket.onmessage=async(event)=>{
    const msg=JSON.parse(event.data);
    if(msg.type==="welcome")myId=msg.peerId;
    if(msg.type==="joined"){
      clearTimeout(timeout);roomName=msg.room;status("Discovering peers · "+roomName,true);joinBtn.disabled=true;leaveBtn.disabled=false;roomInput.disabled=true;shareScreenBtn.disabled=!localStream;$("saveProfileBtn").disabled=false;
      for(const p of msg.peers){peerProfiles.set(p.peerId,p);await createPeer(p.peerId,true,p);}sendProfile();resolve();
    }
    if(msg.type==="peer-joined"){peerProfiles.set(msg.peer.peerId,msg.peer);status("Peer discovered · "+msg.peer.nickname,true);await createPeer(msg.peer.peerId,false,msg.peer);}
    if(msg.type==="peer-profile")updatePeerCard(msg.peer.peerId,msg.peer);
    if(msg.type==="peer-left"){removePeer(msg.peerId);peerProfiles.delete(msg.peerId);status("Peer left · "+roomName,true);}
    if(msg.type==="signal")await handleSignal(msg.from,msg.payload);
    if(msg.type==="chat")renderChat(msg.message);
    if(msg.type==="profile-saved")$("profileStatus").textContent=msg.saved?"Profile and observed IP saved to local JSON registry.":"Profile active for this session; persistent IP logging is off.";
    if(msg.type==="error")status(msg.message);
  };
  socket.onerror=()=>{clearTimeout(timeout);reject(new Error("Could not connect to signaling service"));};
  socket.onclose=()=>{if(roomName)cleanupRoom();};
  socket.onopen=()=>send({type:"join",room:roomInput.value.trim(),inviteToken:$("inviteToken").value.trim()});
});}
async function startMedia(){
  if(!navigator.mediaDevices?.getUserMedia)throw new Error("Camera/microphone requires HTTPS or localhost.");
  const allowCamera=window.confirm("Allow VoiceConnect to access your CAMERA?\n\nYour camera turns on only after you approve this request and your operating system/browser grants access. Video is shared with participants in the room when you join. You can turn it off at any time.");
  const allowMicrophone=window.confirm("Allow VoiceConnect to access your MICROPHONE?\n\nYour microphone audio is shared with participants in the room when you join. You can mute it at any time.");
  if(!allowCamera&&!allowMicrophone)throw new Error("Camera and microphone access were not granted.");
  if(window.voiceConnectDesktop?.requestMediaConsent){
    if(allowCamera)await window.voiceConnectDesktop.requestMediaConsent("camera");
    if(allowMicrophone)await window.voiceConnectDesktop.requestMediaConsent("microphone");
  }
  const videoId=$("cameraSelect").value||undefined,audioId=$("micSelect").value||undefined;
  const audio=allowMicrophone?(audioId?{deviceId:{exact:audioId},echoCancellation:true,noiseSuppression:true}:{echoCancellation:true,noiseSuppression:true}):false;
  const video=allowCamera?(videoId?{deviceId:{exact:videoId},width:{ideal:1280},height:{ideal:720}}:{width:{ideal:1280},height:{ideal:720}}):false;
  localStream=await navigator.mediaDevices.getUserMedia({audio,video});
  localVideo.srcObject=localStream;
  for(const [id,{pc}] of peerConnections){for(const track of localStream.getTracks())pc.addTrack(track,localStream);const offer=await pc.createOffer();await pc.setLocalDescription(offer);signal(id,{description:pc.localDescription});}
  $("mediaState").textContent="Camera & mic active";muteBtn.disabled=cameraBtn.disabled=shareScreenBtn.disabled=false;startMediaBtn.disabled=true;await refreshDevices();
}
async function refreshDevices(){if(!navigator.mediaDevices?.enumerateDevices)return;const devices=await navigator.mediaDevices.enumerateDevices();for(const[kind,id]of[["videoinput","cameraSelect"],["audioinput","micSelect"]]){const select=$(id),selected=select.value;select.replaceChildren(new Option(kind==="videoinput"?"Default camera":"Default microphone",""));devices.filter(d=>d.kind===kind).forEach((d,i)=>select.add(new Option(d.label||kind+" "+(i+1),d.deviceId)));if([...select.options].some(o=>o.value===selected))select.value=selected;}}

async function renegotiatePeer(id, pc) {
  try {
    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);
    signal(id, { description: pc.localDescription });
  } catch (err) { console.warn("Peer renegotiation failed", id, err); }
}
async function startScreenShare() {
  if (!navigator.mediaDevices?.getDisplayMedia) throw new Error("Screen sharing is not supported by this browser.");
  const approved=window.confirm("Allow VoiceConnect to share your DESKTOP or an application window?\n\nThe next system picker lets you choose exactly what to share. If offered, you may separately choose whether to include system audio. Nothing is captured until you approve and select a source. You can stop sharing at any time.");
  if(!approved)throw new Error("Desktop sharing was not approved.");
  screenStream = await navigator.mediaDevices.getDisplayMedia({ video: { frameRate: { ideal: 15, max: 30 } }, audio: true });
  const track = screenStream.getVideoTracks()[0];
  $("localScreenPreview").srcObject = screenStream;
  $("localScreenPreview").hidden = false;
  for (const [id, item] of peerConnections) {
    const sender = item.pc.getSenders().find(s => s.track?.kind === "video");
    if (sender) await sender.replaceTrack(track);
    else item.pc.addTrack(track, screenStream);
    await renegotiatePeer(id, item.pc);
  }
  track.addEventListener("ended", stopScreenShare, { once: true });
  shareScreenBtn.textContent = "Stop sharing";
  status("Sharing your screen", true);
}
async function stopScreenShare() {
  if (!screenStream) return;
  const old = screenStream;
  screenStream = null;
  old.getTracks().forEach(t => t.stop());
  $("localScreenPreview").srcObject = null;
  $("localScreenPreview").hidden = true;
  const cameraTrack = localStream?.getVideoTracks()[0] || null;
  for (const [id, item] of peerConnections) {
    const sender = item.pc.getSenders().find(s => s.track?.kind === "video");
    if (sender && cameraTrack) await sender.replaceTrack(cameraTrack);
    else if (sender && !cameraTrack) { try { item.pc.removeTrack(sender); } catch {} }
    await renegotiatePeer(id, item.pc);
  }
  shareScreenBtn.textContent = "Share screen";
  status("Screen sharing stopped", !!roomName);
}
shareScreenBtn.addEventListener("click", async () => {
  try { if (screenStream) await stopScreenShare(); else await startScreenShare(); }
  catch (err) { status(err.message, !!roomName); }
});

function cleanupRoom(){for(const id of[...peerConnections.keys()])removePeer(id);peerProfiles.clear();if(screenStream){screenStream.getTracks().forEach(t=>t.stop());screenStream=null;} $("localScreenPreview").srcObject=null;$("localScreenPreview").hidden=true;shareScreenBtn.disabled=true;shareScreenBtn.textContent="Share screen";roomName=null;joinBtn.disabled=false;leaveBtn.disabled=true;roomInput.disabled=false;$("saveProfileBtn").disabled=true;status("Offline");updatePeerCount();}
function leaveRoom(){if(screenStream)stopScreenShare();send({type:"leave"});socket?.close();socket=null;cleanupRoom();}
joinBtn.addEventListener("click",async()=>{try{joinBtn.disabled=true;status("Connecting…");await connectSignaling();}catch(err){status(err.message);joinBtn.disabled=false;socket?.close();socket=null;}});
leaveBtn.addEventListener("click",leaveRoom);
startMediaBtn.addEventListener("click",async()=>{try{await startMedia();}catch(err){status(err.message);}});
muteBtn.addEventListener("click",()=>{muted=!muted;localStream?.getAudioTracks().forEach(t=>t.enabled=!muted);muteBtn.textContent=muted?"Unmute mic":"Mute mic";});
cameraBtn.addEventListener("click",()=>{cameraOff=!cameraOff;localStream?.getVideoTracks().forEach(t=>t.enabled=!cameraOff);cameraBtn.textContent=cameraOff?"Turn camera on":"Turn camera off";});
$("saveProfileBtn").addEventListener("click",sendProfile);
$("avatarFile").addEventListener("change",async(e)=>{const file=e.target.files?.[0];if(!file)return;
  if(file.size>12*1024*1024)return status("Choose an image smaller than 12 MB");
  if(!/^image\/(png|jpeg|webp|gif)$/.test(file.type))return status("Choose PNG, JPEG, WebP or GIF");
  try{
    const source=await createImageBitmap(file);
    const scale=Math.min(1,512/Math.max(source.width,source.height));
    const canvas=document.createElement("canvas");canvas.width=Math.max(1,Math.round(source.width*scale));canvas.height=Math.max(1,Math.round(source.height*scale));
    const ctx=canvas.getContext("2d");ctx.drawImage(source,0,0,canvas.width,canvas.height);source.close();
    avatarData=canvas.toDataURL("image/webp",0.82);
    const preview=$("avatarPreview");if(preview){preview.src=avatarData;preview.hidden=false;}
    const p=profile();localStorage.setItem("vc-profile",JSON.stringify({userGuid,nickname:p.nickname,avatar:avatarData,savePeer:p.saveLocally}));
    if(roomName)sendProfile();status("Local avatar loaded and saved on this device",!!roomName);
  }catch(err){status("Could not read that image: "+err.message);}
});
$("clearAvatarBtn").addEventListener("click",()=>{avatarData="";$("avatarPreview").removeAttribute("src");$("avatarPreview").hidden=true;$("avatarFile").value="";const p=profile();localStorage.setItem("vc-profile",JSON.stringify({userGuid,nickname:p.nickname,avatar:"",savePeer:p.saveLocally}));if(roomName)sendProfile();});
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
