from __future__ import annotations
import json
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from typing import Any

class ChimeraAPIHandler(BaseHTTPRequestHandler):
    runtime: Any = None

    def _send(self, status: int, payload: dict) -> None:
        data = json.dumps(payload, ensure_ascii=False).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(data)))
        self.send_header("Access-Control-Allow-Origin", "*")
        self.end_headers()
        self.wfile.write(data)

    def do_GET(self) -> None:
        if self.path in ("/", "/health", "/api/health"):
            self._send(200, {"ok": True, "system": "Chimera II OS"})
        elif self.path in ("/api/state", "/api/status"):
            self._send(200, self.runtime.state())
        elif self.path == "/api/boot":
            self._send(200, self.runtime.state()["boot"])
        elif self.path == "/api/jasper":
            self._send(200, self.runtime.jasper.status())
        elif self.path == "/api/desktop":
            self._send(200, self.runtime.state()["desktop"])
        elif self.path == "/api/tick":
            self._send(200, self.runtime.tick())
        else:
            self._send(404, {"ok": False, "error": "not found"})

    def log_message(self, fmt: str, *args: object) -> None:
        return

def serve(runtime: Any, host: str = "127.0.0.1", port: int = 8765) -> ThreadingHTTPServer:
    ChimeraAPIHandler.runtime = runtime
    server = ThreadingHTTPServer((host, port), ChimeraAPIHandler)
    return server
