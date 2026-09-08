from __future__ import annotations
import os
import shutil
import subprocess
from pathlib import Path
from typing import Optional


class AuroraSession:
    """Wayland session adapter with an opt-in native Aurora compositor."""

    def __init__(self) -> None:
        self.process: Optional[subprocess.Popen] = None
        self.command: Optional[str] = None
        self.state = "prepared"

    @staticmethod
    def _native_candidates() -> list[str]:
        root = Path(__file__).resolve().parents[1]
        return [
            str(root / "build" / "aurora-native" / "aurora-compositor"),
            str(root / "build" / "aurora-native" / "aurora-compositor.exe"),
        ]

    def prepare(self) -> None:
        configured = os.environ.get("CHIMERA_AURORA_COMMAND")
        if configured:
            self.command = configured
        else:
            self.command = next(
                (candidate for candidate in self._native_candidates() if Path(candidate).is_file()),
                None,
            )
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
