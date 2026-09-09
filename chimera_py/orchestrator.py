from __future__ import annotations

from dataclasses import dataclass
from typing import Dict

from .aurora import AuroraSession
from .boot import SpitfireBootloader
from .jasper import JasperManager
from .kernel import ChimeraKernel


@dataclass
class RuntimeService:
    name: str
    state: str = "stopped"
    detail: str = ""


class ChimeraRuntime:
    """Single-process Chimera II host supervisor: Spitfire -> Koronos -> Jasper -> Aurora."""

    SERVICE_NAMES = (
        "registern", "spotnik", "vfs", "tensorfs", "nucleus", "hive",
        "cef", "kore", "dma", "nbit", "python-api", "aurora-wayland"
    )

    def __init__(self) -> None:
        self.bootloader = SpitfireBootloader()
        self.kernel = ChimeraKernel()
        self.aurora = AuroraSession()
        self.services: Dict[str, RuntimeService] = {name: RuntimeService(name) for name in self.SERVICE_NAMES}
        self.jasper = JasperManager(self, profile="aurora")
        self.desktop_ready = False
        self.running = False

    def boot(self) -> dict:
        # Stage 1: firmware/Spitfire must reach 100% before any desktop work.
        self.bootloader.boot(self.kernel.boot)
        if not self.bootloader.booted:
            return self.state()

        # Stage 2: prepare the host compositor without launching it yet.
        self.aurora.prepare()

        # Stage 3: Koronos service discovery/readiness.
        for service in self.services.values():
            service.state = "ready"

        self.running = True
        self.kernel.create_task("koronos-idle", priority=-1)
        self.kernel.create_task("chimera-services", priority=5)

        # Stage 4: Jasper is the authoritative desktop/session gate.
        self.desktop_ready = self.jasper.start()
        if not self.desktop_ready:
            self.services["aurora-wayland"].state = "blocked"
            return self.state()

        # Stage 5: only now may the host compositor launch.
        if self.aurora.launch():
            self.services["aurora-wayland"].state = "running"
        else:
            self.services["aurora-wayland"].state = self.aurora.state
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
            "jasper": self.jasper.status(),
            "desktop": {
                "ready": self.desktop_ready,
                "profile": self.jasper.profile,
                "manager": "Jasper",
                "compositor": self.aurora.state,
            },
            "aurora": {
                "mode": self.aurora.mode,
                "state": self.services["aurora-wayland"].state,
                "command": self.aurora.command,
            },
        }
