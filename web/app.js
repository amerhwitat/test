const $ = (q) => document.querySelector(q);
const desktop = $('#desktop');
const startMenu = $('#startMenu');

function toggleStart(force) {
  const open = force ?? !startMenu.classList.contains('open');
  startMenu.classList.toggle('open', open);
  startMenu.setAttribute('aria-hidden', String(!open));
  if (open) setTimeout(() => $('#startSearch')?.focus(), 60);
}

$('#startButton')?.addEventListener('click', () => toggleStart());
$('#brand')?.addEventListener('click', () => toggleStart());
$('#searchButton')?.addEventListener('click', () => { toggleStart(true); $('#startSearch')?.focus(); });
$('#refreshButton')?.addEventListener('click', refresh);
document.addEventListener('pointerdown', (e) => { if (!startMenu.contains(e.target) && !$('#startButton')?.contains(e.target) && !$('#brand')?.contains(e.target)) toggleStart(false); });

function updateClock() {
  const now = new Date();
  const text = now.toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'});
  $('#clock').textContent = text;
  $('#trayClock').textContent = text;
}
setInterval(updateClock, 1000); updateClock();

async function getJSON(path) {
  const r = await fetch(path, {cache:'no-store'});
  if (!r.ok) throw new Error(`${r.status} ${r.statusText}`);
  return r.json();
}

async function refresh() {
  const health = await getJSON('/api/health').catch(() => ({ok:false}));
  $('#health').textContent = health.ok ? 'Python runtime online' : 'Python runtime offline';
  $('#healthDot').classList.toggle('online', Boolean(health.ok));
  const state = await getJSON('/api/state').catch(e => ({error:e.message}));
  if (state.error) return;
  const boot = state.boot || {};
  $('#boot').textContent = JSON.stringify(boot, null, 2);
  $('#kernel').textContent = JSON.stringify(state.kernel, null, 2);
  $('#bootPill').textContent = `${boot.progress_percent ?? 0}%`;
  const jasper = state.jasper || {};
  $('#jasper').textContent = `Manager: ${jasper.manager || 'Jasper'} | State: ${jasper.state || 'unknown'} | Desktop: ${jasper.desktop_state || 'unknown'} | Profile: ${jasper.profile || 'aurora'} | Services: ${jasper.required_services_ready || 0}/${jasper.required_services_total || 0}`;
  $('#jasperPill').textContent = String(jasper.state || 'UNKNOWN').toUpperCase();
  $('#aurora').textContent = `${state.aurora.mode}: ${state.aurora.state}`;
  $('#auroraPill').textContent = String(state.aurora.state || 'READY').toUpperCase();
  const services = $('#services'); services.replaceChildren();
  Object.entries(state.services || {}).forEach(([name, value]) => {
    const item = document.createElement('article'); item.className = 'service';
    const title = document.createElement('b'); title.textContent = name;
    const status = document.createElement('small'); status.textContent = String(value.state || 'unknown');
    item.append(title, status); services.appendChild(item);
  });
}
refresh(); setInterval(refresh, 2000);

const demo = $('#interactionDemo');
demo?.addEventListener('pointermove', (e) => {
  const r = demo.getBoundingClientRect();
  const x = ((e.clientX-r.left)/r.width)*100;
  const y = ((e.clientY-r.top)/r.height)*100;
  demo.style.setProperty('--mx', `${x}%`); demo.style.setProperty('--my', `${y}%`);
  $('#pointerReadout').textContent = `${Math.round(e.clientX)}, ${Math.round(e.clientY)}`;
});
demo?.addEventListener('pointerleave', () => { demo.style.setProperty('--mx','50%'); demo.style.setProperty('--my','50%'); });

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') toggleStart(false);
  if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); toggleStart(true); $('#startSearch')?.focus(); }
});

document.querySelectorAll('.task-app').forEach(btn => btn.addEventListener('click', () => {
  const target = document.querySelector(`[data-window="${btn.dataset.target}"]`);
  target?.scrollIntoView({behavior:'smooth', block:'center'});
  document.querySelectorAll('.task-app').forEach(x => x.classList.remove('active')); btn.classList.add('active');
}));

const snapPreview = $('#snapPreview');
desktop?.addEventListener('pointermove', (e) => {
  const edge = 34, w = innerWidth, h = innerHeight;
  let zone = null;
  if (e.clientX < edge) zone = {x:12,y:72,width:w/2-18,height:h-150};
  else if (e.clientX > w-edge) zone = {x:w/2+6,y:72,width:w/2-18,height:h-150};
  else if (e.clientY < edge) zone = {x:12,y:72,width:w-24,height:h/2-45};
  if (zone) { Object.assign(snapPreview.style,{left:`${zone.x}px`,top:`${zone.y}px`,width:`${zone.width}px`,height:`${zone.height}px`,opacity:1}); }
  else snapPreview.style.opacity = 0;
});
desktop?.addEventListener('pointerleave', () => { snapPreview.style.opacity = 0; });

$('#startSearch')?.addEventListener('input', (e) => {
  const q = e.target.value.trim().toLowerCase();
  document.querySelectorAll('.pinned button').forEach(btn => { btn.hidden = q && !btn.textContent.toLowerCase().includes(q); });
});

if (matchMedia('(prefers-reduced-motion: reduce)').matches) document.documentElement.classList.add('reduce-motion');
