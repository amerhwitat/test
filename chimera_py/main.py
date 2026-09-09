from __future__ import annotations
import argparse
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
    state = runtime.state()
    print("[SPITFIRE] bootloader ready: %d%%" % state["boot"]["progress_percent"])
    print("[KORONOS] kernel ready")
    print("[CHIMERA] services ready: %d" % len(runtime.services))
    print("[JASPER] desktop manager: %s / %s" % (state["jasper"]["state"], state["jasper"]["desktop_state"]))
    print("[AURORA] Wayland host-session bridge: %s" % state["aurora"]["state"])
    print("[DESKTOP] ready=%s profile=%s" % (state["desktop"]["ready"], state["desktop"]["profile"]))

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
