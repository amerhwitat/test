import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { setTimeout as delay } from "node:timers/promises";
const executable=process.argv[2];
if(!executable) throw new Error("Usage: node scripts/windows-click-smoke.mjs <packaged-electron-exe>");
const port=Number(process.env.VOICECONNECT_CDP_PORT||49229);
const child=spawn(executable,[`--remote-debugging-port=${port}`],{stdio:"ignore"});
let socket; let nextId=0; const pending=new Map(); const rendererDiagnostics=[];
function cdp(method,params={}){return new Promise((resolve,reject)=>{const id=++nextId;const timer=setTimeout(()=>{pending.delete(id);reject(new Error("CDP timeout: "+method));},10000);pending.set(id,{resolve,reject,timer,method});socket.send(JSON.stringify({id,method,params}));});}
async function evaluate(expression){const r=await cdp("Runtime.evaluate",{expression,returnByValue:true,awaitPromise:true});if(r.exceptionDetails)throw new Error(r.exceptionDetails.text||"Renderer evaluation failed");return r.result?.value;}
async function pageTarget(){const until=Date.now()+45000;while(Date.now()<until){if(child.exitCode!==null)throw new Error("VoiceConnect exited before window startup: "+child.exitCode);try{const r=await fetch(`http://127.0.0.1:${port}/json/list`);if(r.ok){const a=await r.json();const p=a.find(x=>x.type==="page"&&x.webSocketDebuggerUrl);if(p)return p;}}catch{}await delay(400);}throw new Error("Electron remote-debugging page did not appear");}
async function click(selector){const p=await evaluate(`(()=>{const e=document.querySelector(${JSON.stringify(selector)});if(!e)throw Error("Missing "+${JSON.stringify(selector)});const r=e.getBoundingClientRect(),x=r.left+r.width/2,y=r.top+r.height/2,h=document.elementFromPoint(x,y);return{x,y,disabled:!!e.disabled,visible:r.width>0&&r.height>0,hit:h?.closest("button")?.id||h?.id||h?.tagName||null};})()`);assert.equal(p.disabled,false,selector+" disabled");assert.equal(p.visible,true,selector+" not visible");assert.ok(p.hit===selector.slice(1)||p.hit==="BUTTON",selector+" covered by "+p.hit);for(const type of ["mouseMoved","mousePressed","mouseReleased"]){await cdp("Input.dispatchMouseEvent",{type,x:p.x,y:p.y,button:"left",clickCount:1});}}
try{
 const page=await pageTarget();socket=new WebSocket(page.webSocketDebuggerUrl);
 await new Promise((resolve,reject)=>{socket.addEventListener("open",resolve,{once:true});socket.addEventListener("error",reject,{once:true});});
 socket.addEventListener("message",e=>{let m;try{m=JSON.parse(e.data);}catch{return;}
   if(m.method==="Runtime.exceptionThrown") rendererDiagnostics.push({kind:"exception",details:m.params?.exceptionDetails});
   if(m.method==="Runtime.consoleAPICalled") rendererDiagnostics.push({kind:"console",type:m.params?.type,args:(m.params?.args||[]).map(x=>x.value??x.description??x.type)});
   if(m.method==="Log.entryAdded") rendererDiagnostics.push({kind:"log",entry:m.params?.entry});
   if(m.method==="Network.loadingFailed") rendererDiagnostics.push({kind:"network-failed",requestId:m.params?.requestId,error:m.params?.errorText,url:m.params?.requestId});
   if(m.method==="Network.responseReceived" && /\\.js(?:\\?|$)/.test(m.params?.response?.url||"")) rendererDiagnostics.push({kind:"script-response",url:m.params.response.url,status:m.params.response.status,mimeType:m.params.response.mimeType});
   if(!m.id||!pending.has(m.id))return;const p=pending.get(m.id);pending.delete(m.id);clearTimeout(p.timer);if(m.error)p.reject(new Error(p.method+": "+m.error.message));else p.resolve(m.result||{});});
 await cdp("Runtime.enable"); await cdp("Log.enable"); await cdp("Network.enable");
 // The CDP page target appears before Electron's deferred module script has
 // necessarily finished importing and binding its controls. Wait for the
 // renderer's explicit ready marker instead of racing the module loader.
 let boot={ready:false,title:"",error:null};
 const readyDeadline=Date.now()+30000;
 while(Date.now()<readyDeadline){
   boot=await evaluate('({ready:window.__voiceConnectRendererReady===true,title:document.title,error:window.__voiceConnectRendererError||null,loading:document.readyState})');
   if(boot.ready)break;
   if(boot.error){
     let diagnostics={};
     try{diagnostics=await evaluate('({url:location.href,readyState:document.readyState,scripts:[...document.scripts].map(s=>({src:s.src,type:s.type,async:s.async,defer:s.defer})),resources:performance.getEntriesByType("resource").map(r=>({name:r.name,duration:r.duration,transferSize:r.transferSize,responseStatus:r.responseStatus||null})),bodyText:document.body?.innerText?.slice(0,1200),marker:window.__voiceConnectRendererReady===true,error:window.__voiceConnectRendererError||null})')}catch(error){diagnostics={snapshotError:error.message};}
     throw new Error("Renderer initialization failed: "+JSON.stringify({boot,diagnostics,rendererDiagnostics}));
   }
   await delay(200);
 }
 if(!boot.ready){
   let diagnostics={};
   try{diagnostics=await evaluate('({url:location.href,readyState:document.readyState,scripts:[...document.scripts].map(s=>({src:s.src,type:s.type,async:s.async,defer:s.defer})),resources:performance.getEntriesByType("resource").filter(r=>/app\\.js|storage\\.js|chat-crypto\\.js/.test(r.name)).map(r=>({name:r.name,duration:r.duration,transferSize:r.transferSize,responseStatus:r.responseStatus||null})),bodyText:document.body?.innerText?.slice(0,1200),marker:window.__voiceConnectRendererReady===true})')}catch(error){diagnostics={snapshotError:error.message};}
   throw new Error("Renderer did not bind controls within 30s: "+JSON.stringify({boot,diagnostics,rendererDiagnostics}));
 }
 await evaluate('window.__voiceConnectTrustedClicks=[];for(const id of ["emojiBtn","applyNetworkBtn","clearAvatarBtn"])document.getElementById(id)?.addEventListener("click",e=>window.__voiceConnectTrustedClicks.push({id,trusted:e.isTrusted}),true)');
 await click("#emojiBtn");await delay(100);
 assert.equal(await evaluate('document.getElementById("emojiPicker").hidden'),false,"Emoji button click did not open picker");
 await click("#emojiBtn");await delay(100);
 assert.equal(await evaluate('document.getElementById("emojiPicker").hidden'),true,"Emoji button click did not close picker");
 await click("#applyNetworkBtn");await delay(100);
 await click("#clearAvatarBtn");await delay(100);
 assert.equal(await evaluate('document.getElementById("statusText").textContent'),"ICE configuration applied","Apply ICE handler did not run");
 const trusted=await evaluate("window.__voiceConnectTrustedClicks");
 assert.equal(trusted.length,4,"Expected four delivered clicks: "+JSON.stringify(trusted));
 assert.ok(trusted.every(x=>x.trusted),"Input was not delivered as trusted mouse events");
 console.log("PASS: packaged Windows GUI loaded; Chromium hit-testing and trusted mouse clicks activated UI handlers.");
}finally{try{socket?.close();}catch{}if(child&&child.exitCode===null){child.kill();await Promise.race([new Promise(r=>child.once("exit",r)),delay(5000)]);}}
