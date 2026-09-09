from __future__ import annotations

from dataclasses import dataclass, field
from typing import Dict, Iterable, Optional


@dataclass
class DesktopSession:
    profile: str = "aurora"
    state: str = "stopped"
    ready: bool = False
    started_at: Optional[float] = None
    capabilities: Dict[str, bool] = field(default_factory=lambda: {
        "window_manager": True,
        "shell": True,
        "network": True,
        "files": True,
        "ipc": True,
    })


class JasperManager:
    """Host-side desktop/session manager between Koronos services and Aurora."""

    REQUIRED_SERVICES = ("registern", "vfs", "nucleus", "cef", "kore", "nbit")

    def __init__(self, runtime, profile: str = "aurora") -> None:
        self.runtime = runtime
        self.profile = profile
        self.state = "stopped"
        self.desktop_state = "stopped"
        self.reason = "not started"
        self.session = DesktopSession(profile=profile)
        self.events = []

    def _record(self, event: str, state: str, detail: str = "") -> None:
        self.events.append({"event": event, "state": state, "detail": detail})

    def _services_ready(self, names: Iterable[str]) -> bool:
        services = self.runtime.services
        return all(name in services and services[name].state in {"ready", "running"} for name in names)

    def start(self) -> bool:
        if not self.runtime.bootloader.booted or self.runtime.bootloader.progress_percent < 100:
            self.state = "blocked"
            self.desktop_state = "blocked"
            self.reason = "Spitfire boot is not complete"
            self._record("desktop-gate", self.state, self.reason)
            return False
        if not self._services_ready(self.REQUIRED_SERVICES):
            self.state = "blocked"
            self.desktop_state = "blocked"
            self.reason = "required Koronos services are not ready"
            self._record("service-gate", self.state, self.reason)
            return False
        self.state = "starting"
        self.desktop_state = "starting"
        self.reason = "all boot and service gates satisfied"
        self._record("jasper-start", self.state, self.reason)
        self.session.state = "ready"
        self.session.ready = True
        self.state = "running"
        self.desktop_state = "ready"
        self.reason = "desktop session ready"
        self._record("desktop-ready", self.state, self.reason)
        return True

    def stop(self) -> None:
        self.session.state = "stopped"
        self.session.ready = False
        self.state = "stopped"
        self.desktop_state = "stopped"
        self.reason = "desktop session stopped"
        self._record("desktop-stop", self.state, self.reason)

    def status(self) -> dict:
        ready_count = sum(
            1 for name in self.REQUIRED_SERVICES
            if name in self.runtime.services and self.runtime.services[name].state in {"ready", "running"}
        )
        return {
            "manager": "Jasper",
            "state": self.state,
            "desktop_state": self.desktop_state,
            "desktop_ready": self.session.ready,
            "profile": self.profile,
            "reason": self.reason,
            "required_services_ready": ready_count,
            "required_services_total": len(self.REQUIRED_SERVICES),
            "session": {
                "profile": self.session.profile,
                "state": self.session.state,
                "capabilities": dict(self.session.capabilities),
            },
            "events": list(self.events),
        }
