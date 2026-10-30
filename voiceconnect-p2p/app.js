import { deriveChatKey, encryptChatPayload, decryptChatPayload } from "./chat-crypto.js";
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
let muted = false, cameraOff = false, encryptionKey = null;
const defaultIceServers = [{ urls: "stun:stun.l.google.com:19302" }];
let rtcConfig = { iceServers: defaultIceServers };
$("userGuid").textContent = userGuid;
$("nickname").value = savedProfile.nickname || "";
$("savePeer").checked = savedProfile.savePeer === true;
if (savedProfile.avatar) { avatarData = savedProfile.avatar; const preview=$("avatarPreview"); preview.src=avatarData; preview.hidden=false; }
if ($("shareAddress")) $("shareAddress").checked = savedProfile.shareAddress === true;
function status(text, online = false) { $("statusText").textContent = text; $("statusDot").parentElement.classList.toggle("online", online); }
function send(data) { if (socket?.readyState === WebSocket.OPEN) socket.send(JSON.stringify(data)); }
function signal(to, payload) { send({ type: "signal", to, payload }); }

async function encryptChatText(text) {
  if (!encryptionKey) {
    if ($("encryptionEnabled").checked) throw new Error("Wait for chat-key derivation to finish.");
    return { text, encrypted: false };
  }
  return encryptChatPayload(text, encryptionKey);
}
async function receiveChatMessage(message) {
  if (!message?.encrypted) { renderChat(message); return; }
  if (!encryptionKey) {
    renderChat({...message,text:"🔒 Encrypted message — enable chat encryption and enter the shared passphrase.",encrypted:true});
    return;
  }
  try {
    renderChat({...message,text:await decryptChatPayload(message,encryptionKey),encrypted:true});
  } catch {
    renderChat({...message,text:"🔒 Could not decrypt — passphrase mismatch or message authentication failed.",encrypted:true});
  }
}

function profile() { return { userGuid, nickname: $("nickname").value.trim().slice(0,32) || "Guest", avatar: avatarData, saveLocally: $("savePeer").checked, shareAddress: $("shareAddress")?.checked === true }; }
function sendProfile() { const p = profile(); localStorage.setItem("vc-profile", JSON.stringify({ userGuid, nickname:p.nickname, avatar:p.avatar, savePeer:p.saveLocally, shareAddress:p.shareAddress })); send({ type:"profile", ...p }); }

const knownPeers = new Map();
function renderKnownPeers() {
  const host = $("knownPeers");
  if (!host) return;
  host.replaceChildren();
  $("knownPeerCount").textContent = knownPeers.size + (knownPeers.size === 1 ? " saved" : " saved");
  if (!knownPeers.size) { const p=document.createElement("p"); p.className="hint"; p.textContent="No remembered peers yet."; host.append(p); return; }
  for (const peer of knownPeers.values()) {
    const row=document.createElement("div"); row.className="known-peer-row";
    const label=document.createElement("span"); label.textContent=(peer.nickname||"Peer")+" · "+peer.observedIp;
    const remove=document.createElement("button"); remove.type="button"; remove.className="secondary"; remove.textContent="Forget";
    remove.addEventListener("click",async()=>{ if(window.voiceConnectDesktop?.forgetPeer) await window.voiceConnectDesktop.forgetPeer(peer.userGuid); else { const list=JSON.parse(localStorage.getItem("vc-known-peers")||"[]").filter(x=>x.userGuid!==peer.userGuid); localStorage.setItem("vc-known-peers",JSON.stringify(list)); } knownPeers.delete(peer.userGuid); renderKnownPeers(); });
    row.append(label,remove); host.append(row);
  }
}
async function loadKnownPeers() {
  try {
    const list=window.voiceConnectDesktop?.listKnownPeers ? await window.voiceConnectDesktop.listKnownPeers() : JSON.parse(localStorage.getItem("vc-known-peers")||"[]");
    for(const peer of list) if(peer?.userGuid && peer?.observedIp) knownPeers.set(peer.userGuid,peer);
  } catch(error) { console.warn("Known peer cache unavailable",error); }
  renderKnownPeers();
}
async function rememberPeer(id) {
  const peer=peerProfiles.get(id);
  if(!peer?.addressShared || !peer.observedIp) { status("This participant has not consented to share an IP address."); return; }
  const record={peerId:id,userGuid:peer.userGuid||id,nickname:peer.nickname||"Peer",avatar:peer.avatar||"",observedIp:peer.observedIp,room:roomName||""};
  if(window.voiceConnectDesktop?.rememberPeer) {
    const result=await window.voiceConnectDesktop.rememberPeer(record);
    if(!result?.ok) throw new Error(result?.error||"Could not save this peer");
  } else {
    const list=JSON.parse(localStorage.getItem("vc-known-peers")||"[]").filter(x=>x.userGuid!==record.userGuid);
    list.unshift({...record,lastSeen:new Date().toISOString()}); localStorage.setItem("vc-known-peers",JSON.stringify(list.slice(0,500)));
  }
  knownPeers.set(record.userGuid,{...record,lastSeen:new Date().toISOString()}); renderKnownPeers();
  status("Saved consenting peer to your local known-peers JSON cache.");
}

function makePeerCard(id, data = {}) {
  const card = document.createElement("article"); card.className = "peer-card";
  const head = document.createElement("div"); head.className = "peer-head";
  const avatar = document.createElement("img"); avatar.className = "peer-avatar"; avatar.alt = ""; avatar.src = data.avatar || "avatar.svg";
  const label = document.createElement("div"); label.className = "peer-label"; label.textContent = (data.nickname || "Peer") + " · " + (data.userGuid || id).slice(0,8) + (knownPeers.has(data.userGuid) ? " · Known" : "");
  head.append(avatar,label);
  const state = document.createElement("span"); state.className = "peer-connection-state"; state.textContent = "Discovered · connecting";
  const video = document.createElement("video"); video.autoplay = true; video.playsInline = true;
  const remember=document.createElement("button"); remember.type="button"; remember.className="secondary"; remember.textContent="Remember peer"; remember.disabled=!data.addressShared; remember.addEventListener("click",()=>rememberPeer(id).catch(error=>status(error.message)));\n  card.append(head,state,video,remember); peersNode.append(card);
  return { card, video, label, avatar, remember, state };
}
function updatePeerCard(id, data) {
  peerProfiles.set(id,data);
  const item=peerConnections.get(id); if(item){ item.label.textContent=(data.nickname || "Peer") + " · " + (data.userGuid || id).slice(0,8) + (knownPeers.has(data.userGuid) ? " · Known" : ""); item.avatar.src=data.avatar || "avatar.svg"; item.remember.disabled=!data.addressShared; }
}
async function createPeer(id, initiator, data = {}) {
  if(peerConnections.has(id)) return peerConnections.get(id).pc;
  const ui=makePeerCard(id,data), pc=new RTCPeerConnection(rtcConfig), record={pc,...ui};
  peerConnections.set(id,record);
  if(localStream) for(const track of localStream.getTracks()) pc.addTrack(track,localStream);
  if(screenStream) for(const track of screenStream.getVideoTracks()) pc.addTrack(track,screenStream);
  pc.ontrack=(event)=>{record.video.srcObject=event.streams[0];};
  pc.onicecandidate=(event)=>{if(event.candidate)signal(id,{candidate:event.candidate});};
  pc.onconnectionstatechange=()=>{record.state.textContent="WebRTC · "+pc.connectionState;if(["failed","closed"].includes(pc.connectionState))removePeer(id);};
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
let directPeerConnection = null;
let directDataChannel = null;
let directRemoteProfile = {nickname:"Peer",avatar:""};
function directStatus(message){ $("directStatus").textContent=message; }
function sendDirectProfile(){
  if(directDataChannel?.readyState==="open"){
    const p=profile();
    directDataChannel.send(JSON.stringify({type:"profile",nickname:p.nickname,avatar:p.avatar,userGuid:p.userGuid}));
  }
}
function attachDirectDataChannel(channel){
  directDataChannel=channel;
  channel.onopen=()=>{
    directStatus("Direct peer connection established. Media and chat travel peer-to-peer.");
    sendDirectProfile();
  };
  channel.onclose=()=>directStatus("Direct data channel closed.");
  channel.onmessage=async event=>{
    try{
      const msg=JSON.parse(event.data);
      if(msg.type==="profile"){
        directRemoteProfile={nickname:String(msg.nickname||"Peer").slice(0,32),avatar:typeof msg.avatar==="string"?msg.avatar:"",userGuid:msg.userGuid||""};
        $("directRemoteNickname").textContent=directRemoteProfile.nickname;
        $("directRemoteAvatar").src=directRemoteProfile.avatar||"avatar.svg";
      }
      if(msg.type==="chat")await receiveChatMessage({...msg,nickname:msg.nickname||directRemoteProfile.nickname,timestamp:msg.timestamp||new Date().toISOString(),avatar:msg.avatar||directRemoteProfile.avatar});
    }
    catch{console.warn("Invalid direct data-channel message");}
  };
}
async function makeDirectPeer(initiator){
  if(directPeerConnection)directPeerConnection.close();
  const pc=new RTCPeerConnection(rtcConfig);
  directPeerConnection=pc;
  pc.ontrack=event=>{$("directRemoteVideo").srcObject=event.streams[0];};
  pc.onconnectionstatechange=()=>directStatus("Direct connection: "+pc.connectionState);
  if(initiator)attachDirectDataChannel(pc.createDataChannel("voiceconnect-chat"));
  else pc.ondatachannel=event=>attachDirectDataChannel(event.channel);
  // Reserve a video media section up front so later screen sharing can replace
  // the track without a second signaling round-trip.
  const videoTransceiver=pc.addTransceiver("video",{direction:"sendrecv"});
  if(localStream)for(const track of localStream.getTracks()){
    if(track.kind==="video")await videoTransceiver.sender.replaceTrack(track);
    else pc.addTrack(track,localStream);
  }
  if(screenStream)for(const track of screenStream.getVideoTracks())await videoTransceiver.sender.replaceTrack(track);
  return pc;
}
async function waitForIceGathering(pc){
  if(pc.iceGatheringState==="complete")return;
  await new Promise((resolve,reject)=>{
    const timeout=setTimeout(()=>reject(new Error("ICE gathering timed out. Check network access and retry.")),20000);
    pc.addEventListener("icegatheringstatechange",()=>{
      if(pc.iceGatheringState==="complete"){clearTimeout(timeout);resolve();}
    });
  });
}
async function createDirectOffer(){
  const pc=await makeDirectPeer(true);
  await pc.setLocalDescription(await pc.createOffer());
  directStatus("Gathering connection candidates. Keep this window open…");
  await waitForIceGathering(pc);
  $("directSignalOutput").value=JSON.stringify(pc.localDescription);
  directStatus("Offer ready. Copy it and send it privately to the other participant.");
}
async function createDirectAnswer(){
  const offerText=$("directOfferInput").value.trim();
  if(!offerText)throw new Error("Paste the caller's offer first.");
  const offer=JSON.parse(offerText);
  if(offer.type!=="offer"||!offer.sdp)throw new Error("The supplied text is not a valid WebRTC offer.");
  const pc=await makeDirectPeer(false);
  await pc.setRemoteDescription(offer);
  await pc.setLocalDescription(await pc.createAnswer());
  directStatus("Gathering connection candidates. Keep this window open…");
  await waitForIceGathering(pc);
  $("directSignalOutput").value=JSON.stringify(pc.localDescription);
  directStatus("Answer ready. Send it privately to the caller.");
}
async function applyDirectAnswer(){
  if(!directPeerConnection)throw new Error("Create an offer before applying an answer.");
  const answer=JSON.parse($("directOfferInput").value.trim());
  if(answer.type!=="answer"||!answer.sdp)throw new Error("The supplied text is not a valid WebRTC answer.");
  await directPeerConnection.setRemoteDescription(answer);
  directStatus("Answer applied. Establishing direct peer connection…");
}
function resetDirectConnection(){
  directDataChannel?.close();directDataChannel=null;
  directPeerConnection?.close();directPeerConnection=null;
  $("directRemoteVideo").srcObject=null;
  $("directOfferInput").value="";$("directSignalOutput").value="";
  directRemoteProfile={nickname:"Peer",avatar:""};$("directRemoteNickname").textContent="Waiting for participant";$("directRemoteAvatar").src="avatar.svg";directStatus("Direct connection reset.");
}
$("directCreateOffer").addEventListener("click",()=>createDirectOffer().catch(e=>directStatus(e.message)));
$("directCreateAnswer").addEventListener("click",()=>createDirectAnswer().catch(e=>directStatus(e.message)));
$("directApplyAnswer").addEventListener("click",()=>applyDirectAnswer().catch(e=>directStatus(e.message)));
$("directReset").addEventListener("click",resetDirectConnection);
$("directCopyOutput").addEventListener("click",async()=>{if(!$("directSignalOutput").value)return;try{await navigator.clipboard.writeText($("directSignalOutput").value);directStatus("Connection text copied.");}catch{directStatus("Clipboard unavailable; select and copy the text manually.");}});
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
    if(msg.type==="peer-exchange"){for(const peer of msg.peers||[]){peerProfiles.set(peer.peerId,peer);updatePeerCard(peer.peerId,peer);}}
    if(msg.type==="peer-left"){removePeer(msg.peerId);peerProfiles.delete(msg.peerId);status("Peer left · "+roomName,true);}
    if(msg.type==="signal")await handleSignal(msg.from,msg.payload);
    if(msg.type==="chat")await receiveChatMessage(msg.message);
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
  if(directPeerConnection)for(const track of localStream.getTracks()){
    if(track.kind==="video"){
      const sender=directPeerConnection.getSenders().find(s=>s.track?.kind==="video"||s.track===null);
      if(sender)await sender.replaceTrack(track);else directPeerConnection.addTrack(track,localStream);
    }else directPeerConnection.addTrack(track,localStream);
  }
  for(const [id,{pc}] of peerConnections){for(const track of localStream.getTracks())pc.addTrack(track,localStream);const offer=await pc.createOffer();await pc.setLocalDescription(offer);signal(id,{description:pc.localDescription});}
  $("mediaState").textContent=[allowCamera?"Camera":"",allowMicrophone?"microphone":""].filter(Boolean).join(" & ")+" active";muteBtn.disabled=!allowMicrophone;cameraBtn.disabled=!allowCamera;shareScreenBtn.disabled=false;startMediaBtn.disabled=true;await refreshDevices();
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
  if(directPeerConnection){const videoTransceiver=directPeerConnection.getTransceivers().find(t=>t.receiver.track.kind==="video");if(videoTransceiver)await videoTransceiver.sender.replaceTrack(track);else directPeerConnection.addTrack(track,screenStream);}
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
  if(directPeerConnection){const videoTransceiver=directPeerConnection.getTransceivers().find(t=>t.receiver.track.kind==="video");if(videoTransceiver)await videoTransceiver.sender.replaceTrack(cameraTrack);}
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
$("saveProfileBtn").addEventListener("click",()=>{sendProfile();sendDirectProfile();$("profileStatus").textContent="Profile updated. Your IP is shared only if you explicitly enabled address sharing.";});
$("shareAddress").addEventListener("change",()=>{const p=profile();localStorage.setItem("vc-profile",JSON.stringify({userGuid,nickname:p.nickname,avatar:p.avatar,savePeer:p.saveLocally,shareAddress:p.shareAddress}));if(roomName)sendProfile();});
$("nickname").addEventListener("change",()=>{const p=profile();localStorage.setItem("vc-profile",JSON.stringify({userGuid,nickname:p.nickname,avatar:p.avatar,savePeer:p.saveLocally,shareAddress:p.shareAddress}));if(roomName)sendProfile();sendDirectProfile();});
$("avatarFile").addEventListener("change",async(e)=>{const file=e.target.files?.[0];if(!file)return;
  if(file.size>12*1024*1024)return status("Choose an image smaller than 12 MB");
  if(!/^image\/(png|jpeg|webp|gif)$/.test(file.type))return status("Choose PNG, JPEG, WebP or GIF");
  try{
    const source=await createImageBitmap(file);
    const scale=Math.min(1,256/Math.max(source.width,source.height));
    const canvas=document.createElement("canvas");canvas.width=Math.max(1,Math.round(source.width*scale));canvas.height=Math.max(1,Math.round(source.height*scale));
    const ctx=canvas.getContext("2d");ctx.drawImage(source,0,0,canvas.width,canvas.height);source.close();
    let quality=0.72;avatarData=canvas.toDataURL("image/webp",quality);
    while(avatarData.length>48000&&quality>0.32){quality-=0.08;avatarData=canvas.toDataURL("image/webp",quality);}
    if(avatarData.length>48000)throw new Error("Image is too detailed to share safely; choose a smaller image.");
    const preview=$("avatarPreview");if(preview){preview.src=avatarData;preview.hidden=false;}
    const p=profile();localStorage.setItem("vc-profile",JSON.stringify({userGuid,nickname:p.nickname,avatar:avatarData,savePeer:p.saveLocally,shareAddress:p.shareAddress}));
    if(roomName)sendProfile();sendDirectProfile();status("Local avatar loaded and saved on this device",!!roomName);
  }catch(err){status("Could not read that image: "+err.message);}
});
$("clearAvatarBtn").addEventListener("click",()=>{avatarData="";$("avatarPreview").removeAttribute("src");$("avatarPreview").hidden=true;$("avatarFile").value="";const p=profile();localStorage.setItem("vc-profile",JSON.stringify({userGuid,nickname:p.nickname,avatar:"",savePeer:p.saveLocally,shareAddress:p.shareAddress}));if(roomName)sendProfile();sendDirectProfile();});
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
$("chatForm").addEventListener("submit",async e=>{e.preventDefault();const text=$("chatInput").value.normalize("NFC").trim();if(!text)return;if(!roomName&&directDataChannel?.readyState!=="open")return;try{const payload=await encryptChatText(text);if(roomName){send({type:"chat",...payload});}else{directDataChannel.send(JSON.stringify({type:"chat",nickname:profile().nickname,avatar:profile().avatar,text:payload.text,encrypted:payload.encrypted,iv:payload.iv,ciphertext:payload.ciphertext,timestamp:new Date().toISOString()}));renderChat({nickname:profile().nickname,avatar:profile().avatar,text,encrypted:payload.encrypted,timestamp:new Date().toISOString()});} $("chatInput").value="";}catch(error){$("encryptionStatus").textContent="Could not encrypt message: "+error.message;}});

$("encryptionPassphrase").disabled=false;
$("encryptionEnabled").addEventListener("change",async()=>{
  if(!$("encryptionEnabled").checked){encryptionKey=null;$("encryptionPassphrase").disabled=false;$("encryptionState").textContent="Off";$("encryptionStatus").textContent="Chat encryption is off. WebRTC media and data channels remain encrypted in transit.";return;}
  const passphrase=$("encryptionPassphrase").value;
  if(passphrase.length<12){$("encryptionEnabled").checked=false;$("encryptionStatus").textContent="Enter a passphrase of at least 12 characters first.";return;}
  $("encryptionStatus").textContent="Deriving encryption key…";
  try{encryptionKey=await deriveChatKey(passphrase);$("encryptionPassphrase").disabled=true;$("encryptionState").textContent="AES-GCM on";$("encryptionStatus").textContent="Application-level chat encryption enabled. Share the exact passphrase privately with every participant.";}
  catch(error){encryptionKey=null;$("encryptionEnabled").checked=false;$("encryptionStatus").textContent="Encryption setup failed: "+error.message;}
});
$("encryptionPassphrase").addEventListener("change",()=>{if($("encryptionEnabled").checked){$("encryptionEnabled").checked=false;encryptionKey=null;$("encryptionPassphrase").disabled=false;$("encryptionState").textContent="Off";$("encryptionStatus").textContent="Passphrase changed. Enable encryption again to derive a new key."; }});
loadKnownPeers();

function renderChat(message){const row=document.createElement("article");row.className="chat-message";const meta=document.createElement("div");meta.className="meta";const avatar=document.createElement("img");avatar.className="chat-avatar";avatar.alt="";avatar.src=message.avatar||"avatar.svg";const who=document.createElement("span");who.textContent=message.nickname||"Guest";const when=document.createElement("time");when.textContent=new Date(message.timestamp).toLocaleTimeString();meta.append(avatar,who,when);const body=document.createElement("p");body.textContent=message.text;if(message.encrypted){const lock=document.createElement("span");lock.className="encrypted-indicator";lock.textContent=" · encrypted";meta.append(lock);}row.append(meta,body);$("chatMessages").append(row);$("chatMessages").scrollTop=$("chatMessages").scrollHeight;}
