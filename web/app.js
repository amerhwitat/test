async function refresh() {
  const health = await fetch('/api/health').then(r => r.json()).catch(() => ({ok:false}));
  document.querySelector('#health').textContent = health.ok ? 'Python runtime online' : 'Python runtime offline';
  const state = await fetch('/api/state').then(r => r.json()).catch(e => ({error:e.message}));
  if (state.error) return;
  document.querySelector('#boot').textContent = JSON.stringify(state.boot, null, 2);
  document.querySelector('#kernel').textContent = JSON.stringify(state.kernel, null, 2);
  document.querySelector('#aurora').textContent = `${state.aurora.mode}: ${state.aurora.state}`;
  const services = document.querySelector('#services');
  services.replaceChildren();
  Object.entries(state.services).forEach(([name, value]) => {
    const item = document.createElement('span'); item.className = 'service';
    item.textContent = `${name}: ${value.state}`; services.appendChild(item);
  });
}
refresh(); setInterval(refresh, 2000);
