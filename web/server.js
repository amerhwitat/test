const http = require('http');
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

const HOST = process.env.CHIMERA_WEB_HOST || '127.0.0.1';
const PORT = Number(process.env.CHIMERA_WEB_PORT || 3000);
const PY_HOST = process.env.CHIMERA_PY_HOST || '127.0.0.1';
const PY_PORT = Number(process.env.CHIMERA_PY_PORT || 8765);
const ROOT = __dirname;
let pythonChild = null;

function startPython() {
  if (process.env.CHIMERA_EXTERNAL_PYTHON === '1') return;
  const executable = process.env.PYTHON || (process.platform === 'win32' ? 'python' : 'python3');
  pythonChild = spawn(executable, ['-m', 'chimera_py.main', '--api-host', PY_HOST, '--api-port', String(PY_PORT)], {
    cwd: path.resolve(ROOT, '..'), stdio: 'inherit', env: process.env
  });
  pythonChild.on('exit', (code, signal) => {
    console.log(`[CHIMERA] Python runtime exited code=${code} signal=${signal || ''}`);
  });
}

function proxy(req, res) {
  const options = { host: PY_HOST, port: PY_PORT, path: req.url, method: req.method, headers: req.headers };
  const upstream = http.request(options, response => {
    res.writeHead(response.statusCode || 502, response.headers);
    response.pipe(res);
  });
  upstream.on('error', err => {
    res.writeHead(502, {'content-type':'application/json'});
    res.end(JSON.stringify({ok:false, error:'Python API unavailable', detail:err.message}));
  });
  req.pipe(upstream);
}

function staticFile(req, res) {
  let requestPath = decodeURIComponent(req.url.split('?')[0]);
  if (requestPath === '/') requestPath = '/index.html';
  const safe = path.normalize(requestPath).replace(/^([.][.][/\\])+/, '');
  const file = path.join(ROOT, safe);
  if (!file.startsWith(ROOT)) { res.writeHead(403); return res.end('Forbidden'); }
  fs.readFile(file, (err, data) => {
    if (err) { res.writeHead(404); return res.end('Not found'); }
    const ext = path.extname(file).toLowerCase();
    const types = {'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json; charset=utf-8'};
    res.writeHead(200, {'content-type': types[ext] || 'application/octet-stream', 'cache-control':'no-cache'});
    res.end(data);
  });
}

startPython();
const server = http.createServer((req, res) => req.url.startsWith('/api/') || req.url === '/health' ? proxy(req,res) : staticFile(req,res));
server.listen(PORT, HOST, () => console.log(`[AURORA-WEB] http://${HOST}:${PORT} -> Python ${PY_HOST}:${PY_PORT}`));

function shutdown() {
  server.close();
  if (pythonChild) pythonChild.kill('SIGTERM');
}
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
