from __future__ import annotations
from dataclasses import dataclass, field
import time
from typing import Callable, List

@dataclass
class BootRecord:
    stage: str
    status: str
    timestamp: float = field(default_factory=time.time)
    detail: str = ""

class SpitfireBootloader:
    """Host-side Spitfire/Jasper boot model; firmware remains a separate layer."""
    name = "Spitfire"

    def __init__(self) -> None:
        self.records: List[BootRecord] = []
        self.booted = False

    def stage(self, name: str, action: Callable[[], None]) -> None:
        record = BootRecord(name, "starting")
        self.records.append(record)
        try:
            action()
        except Exception as exc:
            record.status = "failed"
            record.detail = str(exc)
            raise
        record.status = "ready"

    def boot(self, kernel: Callable[[], None]) -> List[BootRecord]:
        self.stage("firmware-handshake", lambda: None)
        self.stage("spitfire-loader", lambda: None)
        self.stage("boot-info", lambda: None)
        self.stage("koronos-handoff", kernel)
        self.booted = True
        return self.records

    def state(self) -> dict:
        return {"name": self.name, "booted": self.booted,
                "stages": [vars(r).copy() for r in self.records]}
