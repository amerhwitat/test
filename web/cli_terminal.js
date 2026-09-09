(() => {
  'use strict';
  const out = document.querySelector('#terminalOutput');
  const input = document.querySelector('#terminalInput');
  const form = document.querySelector('#terminalForm');
  if (!out || !input || !form) return;
  const history=[]; let hi=0; let catalog=null;
  const print=s=>{const d=document.createElement('div');d.textContent=String(s);out.appendChild(d);out.scrollTop=out.scrollHeight;};
  const all=()=>catalog?Object.values(catalog).filter(Array.isArray).flat():[];
  const safeOutput=(cmd,args)=>{
    const c=cmd.toLowerCase();
    if(c==='help'||c==='man'){const list=all().filter(Boolean);print(`CLI compatibility catalog: ${list.length} command entries.`);print('Linux/POSIX + Bash/Zsh + Windows CMD + PowerShell + Chimera commands are catalogued.');print('Use: help <command>, man <command>, which <command>, clear');return true;}
    if(c==='clear'||c==='cls'){out.replaceChildren();return true;}
    if(c==='echo'||c==='printf'){print(args);return true;}
    if(c==='pwd'||c==='cd'){print(c==='pwd'?'/home/chimera':`Current virtual directory: ${args||'/home/chimera'}`);return true;}
    if(c==='ls'||c==='dir'){print('Desktop  Documents  Downloads  Projects  System  Workspaces');return true;}
    if(c==='whoami'){print('chimera');return true;}
    if(c==='uname'){print('Chimera II OS / Aurora Wayland / Koronos');return true;}
    if(c==='hostname'){print('aurora-web');return true;}
    if(c==='date'||c==='time'){print(new Date().toString());return true;}
    if(c==='true'){return true;} if(c==='false'){print('');return true;}
    if(c==='history'){history.forEach((x,i)=>print(`${i+1}  ${x}`));return true;}
    if(c==='which'||c==='where'){const q=(args||'').toLowerCase();const hit=all().find(x=>String(x).toLowerCase()===q);print(hit?`/usr/bin/${hit}`:`${q}: not found`);return true;}
    if(c==='ver'||c==='systeminfo'){print('Chimera II OS compatibility environment\nHost execution: sandboxed web terminal');return true;}
    if(c==='ps'||c==='tasklist'){print('PID     STATE   NAME\n1       RUNNING aurora\n2       RUNNING koronos\n3       RUNNING jasper');return true;}
    if(c==='ipconfig'||c==='ifconfig'||c==='ip'){print('aurora0  UP  127.0.0.1  virtual/sandbox');return true;}
    if(c==='ping'||c==='test-connection'){print('PING virtual-host: sandbox response 127.0.0.1');return true;}
    if(c==='curl'||c==='wget'||c==='invoke-webrequest'){print('Web terminal: network operation is represented, not executed against the host.');return true;}
    if(c==='rm'||c==='del'||c==='erase'||c==='format'||c==='shutdown'||c==='reboot'||c==='taskkill'||c==='kill'||c==='sudo'){print(`${cmd}: blocked in browser sandbox; no host-side destructive operation is performed.`);return true;}
    if(c==='aurora'){print('Aurora Wayland: READY');return true;} if(c==='spitfire'||c==='boot'){print('Spitfire boot monitor: use the Aurora Boot window for live state.');return true;} if(c==='koronos'||c==='kernel'){print('Koronos kernel: RUNNING');return true;} if(c==='jasper'){print('Jasper Desktop Manager: RUNNING');return true;} if(c==='chimera'){print('Chimera II OS: ONLINE');return true;}
    return false;
  };
  async function load(){try{catalog=await fetch('/cli_catalog.json',{cache:'no-store'}).then(r=>r.json());}catch(e){print('CLI catalog unavailable; built-in compatibility subset active.');}}
  form.addEventListener('submit',e=>{e.preventDefault();e.stopImmediatePropagation();const raw=input.value.trim();if(!raw)return;history.push(raw);hi=history.length;print(`chimera@aurora:~$ ${raw}`);const m=raw.match(/^\s*([^\s]+)(?:\s+(.+))?$/);const cmd=m?.[1]||'';const args=m?.[2]||'';if(!safeOutput(cmd,args))print(`${cmd}: catalogued but not implemented for host execution in the browser sandbox. Use man ${cmd} for compatibility intent.`);input.value='';},{capture:true});
  input.addEventListener('keydown',e=>{if(e.key==='ArrowUp'){e.preventDefault();hi=Math.max(0,hi-1);input.value=history[hi]||'';}else if(e.key==='ArrowDown'){e.preventDefault();hi=Math.min(history.length,hi+1);input.value=history[hi]||'';}else if(e.key==='Tab'){e.preventDefault();const q=input.value.toLowerCase();const hit=all().find(x=>String(x).toLowerCase().startsWith(q));if(hit)input.value=hit;}});
  load();
})();
