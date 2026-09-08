from __future__ import annotations
import argparse
import threading
from .orchestrator import ChimeraRuntime
from .api_server import serve

def main() -> int:
    parser = argparse.ArgumentParser(description="Boot the Chimera II Python host")
    parser.add_argument("--api-host", default="127.0.0.1")
    parser.add_argument("--api-port", type=int, default=8765)
    parser.add_argument("--no-api", action="store_true")
    args = parser.parse_args()

    runtime = ChimeraRuntime()
    runtime.boot()
    print("[SPITFIRE] bootloader ready")
    print("[KORONOS] kernel ready")
    print("[CHIMERA] services ready: %d" % len(runtime.services))
    print("[AURORA] Wayland host-session bridge ready")

    if args.no_api:
        return 0
    server = serve(runtime, args.api_host, args.api_port)
    print("[PYTHON] API listening on http://%s:%d" % (args.api_host, args.api_port))
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        pass
    finally:
        server.server_close()
    return 0

if __name__ == "__main__":
    raise SystemExit(main())
