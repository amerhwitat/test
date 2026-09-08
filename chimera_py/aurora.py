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
        self.mode = "unavailable"

    def prepare(self) -> None:
        configured = os.environ.get("CHIMERA_AURORA_COMMAND")
        if configured:
            self.command = configured
            self.mode = "native" if os.path.basename(configured) == "aurora-compositor" else "configured"
        else:
            for candidate in ("aurora-compositor", "weston", "sway", "labwc"):
                if shutil.which(candidate):
                    self.command = candidate
                    self.mode = "native" if candidate == "aurora-compositor" else "host-fallback"
                    break
        # Preserve the existing public state contract: preparation is "ready".
        self.state = "ready"

    def launch(self) -> bool:
        if os.environ.get("CHIMERA_START_AURORA") != "1":
            self.state = "ready"
            return False
        if not self.command:
            self.state = "unavailable"
            self.mode = "unavailable"
            return False
        executable = self.command if os.path.sep in self.command else shutil.which(self.command)
        if not executable:
            self.state = "unavailable"
            self.mode = "unavailable"
            return False
        self.process = subprocess.Popen([executable], start_new_session=True)
        self.state = "running"
        return True

    def stop(self) -> None:
        if self.process and self.process.poll() is None:
            self.process.terminate()
        self.state = "stopped"
