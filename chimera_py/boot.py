from __future__ import annotations
from dataclasses import dataclass, field
import time
from typing import Callable, List

@dataclass
class BootRecord:
    stage: str
    status: str
    progress_percent: int = 0
    timestamp: float = field(default_factory=time.time)
    detail: str = ""

class SpitfireBootloader:
    """Host-side Spitfire boot state machine with an explicit desktop gate."""
    name = "Spitfire"
    STAGES = (
        "firmware-handshake", "spitfire-loader", "boot-info", "memory-init",
        "cpu-init", "koronos-handoff", "service-discovery", "desktop-handoff"
    )

    def __init__(self) -> None:
        self.records: List[BootRecord] = []
        self.booted = False
        self.progress_percent = 0

    def stage(self, name: str, action: Callable[[], None]) -> None:
        record = BootRecord(name, "starting", self.progress_percent)
        self.records.append(record)
        try:
            action()
        except Exception as exc:
            record.status = "failed"
            record.detail = str(exc)
            raise
        completed = sum(1 for r in self.records if r.status == "ready") + 1
        self.progress_percent = min(100, round(completed * 100 / len(self.STAGES)))
        record.progress_percent = self.progress_percent
        record.status = "ready"

    def boot(self, kernel: Callable[[], None]) -> List[BootRecord]:
        if self.booted:
            return self.records
        actions = {
            "firmware-handshake": lambda: None,
            "spitfire-loader": lambda: None,
            "boot-info": lambda: None,
            "memory-init": lambda: None,
            "cpu-init": lambda: None,
            "koronos-handoff": kernel,
            "service-discovery": lambda: None,
            "desktop-handoff": lambda: None,
        }
        for name in self.STAGES:
            self.stage(name, actions[name])
        self.booted = self.progress_percent == 100
        return self.records

    def state(self) -> dict:
        return {
            "name": self.name,
            "booted": self.booted,
            "progress_percent": self.progress_percent,
            "desktop_gate_open": self.progress_percent >= 100,
            "stages": [vars(r).copy() for r in self.records],
        }
