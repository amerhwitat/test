from __future__ import annotations
import os
import shutil
import subprocess
import sys


def main() -> int:
    node = shutil.which("node")
    if not node:
        print("Node.js 24+ is required for the Aurora web supervisor.", file=sys.stderr)
        return 2
    env = os.environ.copy()
    env.setdefault("CHIMERA_WEB_HOST", "127.0.0.1")
    env.setdefault("CHIMERA_WEB_PORT", "3000")
    env.setdefault("CHIMERA_PY_HOST", "127.0.0.1")
    env.setdefault("CHIMERA_PY_PORT", "8765")
    print("[CHIMERA] Spitfire -> Koronos -> services -> Aurora -> Web")
    proc = subprocess.Popen([node, "web/server.js"], cwd=os.path.dirname(os.path.abspath(__file__)), env=env)
    try:
        return proc.wait()
    except KeyboardInterrupt:
        proc.terminate()
        return proc.wait(timeout=10)


if __name__ == "__main__":
    raise SystemExit(main())
