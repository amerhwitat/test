"""Chimera II portable Python execution, kernel, desktop and research layer."""

__version__ = "0.3.0"

from .isa8192 import CPU8192, ExecuteStatus, Instruction, ISA, NAMES, OPCODES
from .emulator import ChimeraABI, ChimeraCore
from .kernel import ChimeraKernel
from .boot import SpitfireBootloader
from .jasper import JasperManager, DesktopSession
from .orchestrator import ChimeraRuntime

__all__ = [
    'CPU8192', 'ExecuteStatus', 'Instruction', 'ISA', 'NAMES', 'OPCODES',
    'ChimeraABI', 'ChimeraCore', 'ChimeraKernel', 'SpitfireBootloader',
    'JasperManager', 'DesktopSession', 'ChimeraRuntime',
]
