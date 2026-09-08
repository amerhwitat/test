from __future__ import annotations
from dataclasses import dataclass
from typing import Dict
from .aurora import AuroraSession
from .boot import SpitfireBootloader
from .kernel import ChimeraKernel

@dataclass
class RuntimeService:
    name: str
    state: str = "stopped"
    detail: str = ""

class ChimeraRuntime:
    """Single-process boot/service supervisor for the Python Chimera II host."""
    SERVICE_NAMES = (
        "registern", "spotnik", "vfs", "tensorfs", "nucleus", "hive",
        "cef", "kore", "dma", "nbit", "python-api", "aurora-wayland"
    )

    def __init__(self) -> None:
        self.bootloader = SpitfireBootloader()
        self.kernel = ChimeraKernel()
        self.aurora = AuroraSession()
        self.services: Dict[str, RuntimeService] = {name: RuntimeService(name) for name in self.SERVICE_NAMES}
        self.running = False

    def boot(self) -> dict:
        self.bootloader.boot(self.kernel.boot)
        self.aurora.prepare()
        for service in self.services.values():
            service.state = "ready"
        self.services["aurora-wayland"].state = self.aurora.state
        if self.aurora.launch():
            self.services["aurora-wayland"].state = "running"
        self.running = True
        self.kernel.create_task("koronos-idle", priority=-1)
        self.kernel.create_task("chimera-services", priority=5)
        return self.state()

    def tick(self) -> dict:
        if not self.running:
            self.boot()
        return self.kernel.tick()

    def state(self) -> dict:
        return {
            "system": "Chimera II OS",
            "boot": self.bootloader.state(),
            "kernel": self.kernel.state(),
            "services": {name: vars(item).copy() for name, item in self.services.items()},
            "aurora": {"mode": "wayland-host-session", "state": self.services["aurora-wayland"].state,
                       "command": self.aurora.command},
        }
