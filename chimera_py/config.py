from __future__ import annotations

import os
from dataclasses import asdict, dataclass


@dataclass(frozen=True)
class AppConfig:
    log_level: str = "INFO"
    data_dir: str = "data"
    plugin_package: str = "chimera_py"

    @classmethod
    def from_env(cls) -> "AppConfig":
        return cls(
            log_level=os.environ.get("CHIMERA_LOG_LEVEL", "INFO").upper(),
            data_dir=os.environ.get("CHIMERA_DATA_DIR", "data"),
            plugin_package=os.environ.get("CHIMERA_PLUGIN_PACKAGE", "chimera_py"),
        )

    def as_dict(self):
        return asdict(self)
