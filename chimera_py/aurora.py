from __future__ import annotations
import os
import shutil
import subprocess
from typing import Optional

class AuroraSession:
    """Wayland session adapter. Native compositor execution is host-controlled."""
    def __init__(self) -> None:
        self.process: Optional[subprocess.Popen] = None
        self.command: Optional[str] = None
        self.state = "prepared"

    def prepare(self) -> None:
        self.command = os.environ.get("CHIMERA_AURORA_COMMAND")
        if not self.command:
            for candidate in ("aurora-compositor", "weston", "sway", "labwc"):
                if shutil.which(candidate):
                    self.command = candidate
                    break
        self.state = "ready-host-session"

    def launch(self) -> bool:
        if os.environ.get("CHIMERA_START_AURORA") != "1":
            self.state = "ready-host-session"
            return False
        if not self.command:
            self.state = "unavailable"
            return False
        self.process = subprocess.Popen([self.command], start_new_session=True)
        self.state = "running"
        return True

    def stop(self) -> None:
        if self.process and self.process.poll() is None:
            self.process.terminate()
        self.state = "stopped"
