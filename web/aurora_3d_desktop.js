import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.180.0/build/three.module.js';

const canvas=document.querySelector('#aurora3d');
const renderer=new THREE.WebGLRenderer({canvas,antialias:true,alpha:true});
renderer.setPixelRatio(Math.min(devicePixelRatio,2)); renderer.setSize(innerWidth,innerHeight);
const scene=new THREE.Scene(); scene.fog=new THREE.FogExp2(0x07111f,.025);
const camera=new THREE.PerspectiveCamera(55,innerWidth/innerHeight,.1,200); camera.position.set(0,5,18);
scene.add(new THREE.AmbientLight(0x8abfff,1.8));
const moon=new THREE.Mesh(new THREE.SphereGeometry(1.8,32,32),new THREE.MeshBasicMaterial({color:0xbfe8ff,transparent:true,opacity:.13})); moon.position.set(-8,7,-12); scene.add(moon);
const lake=new THREE.Mesh(new THREE.PlaneGeometry(100,80),new THREE.MeshStandardMaterial({color:0x071b31,metalness:.7,roughness:.18,transparent:true,opacity:.9})); lake.rotation.x=-Math.PI/2; lake.position.y=-2; scene.add(lake);
function ridge(z,h){const pts=[];for(let i=0;i<=60;i++){const x=i-30;pts.push(new THREE.Vector3(x,(Math.sin(i*.62)*.7+Math.sin(i*.19)*1.8+Math.random()*.7)*h*.35-1,z));}const g=new THREE.BufferGeometry().setFromPoints(pts);const m=new THREE.LineBasicMaterial({color:0x41688c,transparent:true,opacity:.5});scene.add(new THREE.Line(g,m));}
ridge(-5,2.2); ridge(-9,3.1); ridge(-14,4);
const stars=new THREE.BufferGeometry();const positions=[];for(let i=0;i<900;i++)positions.push((Math.random()-.5)*80,Math.random()*40-2,(Math.random()-.5)*70-15);stars.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));scene.add(new THREE.Points(stars,new THREE.PointsMaterial({color:0xbbe8ff,size:.045,transparent:true,opacity:.8})));
const rings=[];for(let i=0;i<5;i++){const r=new THREE.Mesh(new THREE.TorusGeometry(5+i*.7,.025,8,160),new THREE.MeshBasicMaterial({color:i%2?0x8f8cff:0x55d8ff,transparent:true,opacity:.2}));r.rotation.x=1.18;r.position.y=3+i*.18;r.position.z=-8;rings.push(r);scene.add(r)}
function animate(t){requestAnimationFrame(animate);rings.forEach((r,i)=>{r.rotation.z=t*.00008*(i+1);r.position.x=Math.sin(t*.00025+i)*.7});renderer.render(scene,camera)} animate(0);
addEventListener('resize',()=>{camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight)});

const $=s=>document.querySelector(s); const windows=[...document.querySelectorAll('.app-window')];
function open(id){windows.forEach(w=>w.classList.add('hidden'));$( '#'+id).classList.remove('hidden')}
$('#openTerminal').onclick=()=>open('terminalWindow'); $('#openHelp').onclick=()=>open('helpWindow');
document.querySelectorAll('[data-open]').forEach(b=>b.onclick=()=>open(b.dataset.open));
document.querySelectorAll('[data-window-action="close"]').forEach(b=>b.onclick=()=>b.closest('.window').classList.add('hidden'));
$('#profileButton').onclick=()=>$('#profileMenu').classList.toggle('hidden'); $('#dockLauncher').onclick=()=>$('#profileMenu').classList.toggle('hidden'); $('#launcher').onclick=()=>$('#profileMenu').classList.toggle('hidden');
document.querySelectorAll('[data-profile]').forEach(b=>b.onclick=()=>{$('#profile').textContent=b.dataset.profile;$('#profileMenu').classList.add('hidden')});
setInterval(()=>$('#clock').textContent=new Date().toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'}),1000);

const help=[
 ['linux','ls','list directory contents','1'],['linux','bash','GNU Bourne Again shell','1'],['linux','gcc','GNU C compiler','1'],['linux','g++','GNU C++ compiler','1'],['linux','cmake','cross-platform build system','1'],
 ['windows','cmd','Windows Command Prompt reference','windows'],['powershell','Get-Process','Gets processes running on a computer','powershell'],['powershell','Get-Help','Displays help about PowerShell commands and concepts','powershell'],['chimera','chimera-isa','Chimera II instruction-set reference','1'],['chimera','chimera-help','Unified Chimera II documentation command','1']
];
function renderHelp(q=''){const rows=help.filter(x=>x.join(' ').toLowerCase().includes(q.toLowerCase()));$('#helpResults').innerHTML=rows.map(x=>`<article class="help-card"><b>${x[1]} <small>${x[0]}:${x[3]}</small></b><span>${x[2]}</span></article>`).join('')||'<p>No indexed help entry.</p>'}
$('#helpSearch').oninput=e=>renderHelp(e.target.value); renderHelp();
$('#terminalForm').onsubmit=e=>{e.preventDefault();const raw=$('#terminalInput').value.trim();if(!raw)return;const out=$('#terminalOut');const lines=out.textContent.split('\n');lines.push(`chimera@aurora:$ ${raw}`);if(raw==='help')lines.push('man | apropos | whatis | info | desktop | clear');else if(raw==='clear')lines.splice(0,lines.length);else if(raw.startsWith('man ')){const q=raw.slice(4).trim();const hit=help.find(x=>x[1].toLowerCase()===q.toLowerCase()||`${x[0]}:${x[1]}`.toLowerCase()===q.toLowerCase());lines.push(hit?`${hit[1]} (${hit[3]}) — ${hit[2]}`:'No indexed manual entry.');}else if(raw==='desktop')lines.push('Aurora 3D desktop profiles: Linux + Windows');else lines.push('Command catalog entry available through the unified Chimera resolver.');out.textContent=lines.slice(-18).join('\n');$('#terminalInput').value='';out.scrollTop=out.scrollHeight};
