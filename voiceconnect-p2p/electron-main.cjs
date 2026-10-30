const { app, BrowserWindow, session } = require("electron");
const path = require("node:path");
const fs = require("node:fs");

let localServer;
const port = Number(process.env.PORT || 8787);
function createWindow(){
  const win=new BrowserWindow({width:1280,height:850,minWidth:760,minHeight:600,backgroundColor:"#06111d",webPreferences:{contextIsolation:true,nodeIntegration:false,sandbox:true}});
  win.loadURL(`http://127.0.0.1:${port}`);
}
app.whenReady().then(()=>{
  const proxy=process.env.HTTPS_PROXY||process.env.https_proxy||process.env.HTTP_PROXY||process.env.http_proxy;
  if(proxy)session.defaultSession.setProxy({proxyRules:proxy}).catch(err=>console.error("Proxy configuration failed:",err));
  const dataDir=path.join(app.getPath("userData"),"data");
  fs.mkdirSync(dataDir,{recursive:true});
  process.env.HOST="127.0.0.1";
  process.env.VOICECONNECT_REGISTRY=path.join(dataDir,"peers.json");
  import(path.join(__dirname,"server.js")).then(({startServer})=>{localServer=startServer();createWindow();}).catch(err=>{console.error("Could not start local VoiceConnect service:",err);app.quit();});
  app.on("activate",()=>{if(BrowserWindow.getAllWindows().length===0)createWindow();});
});
app.on("window-all-closed",()=>{if(process.platform!=="darwin")app.quit();});
app.on("before-quit",()=>{localServer?.close();});
