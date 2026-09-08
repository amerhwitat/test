from __future__ import annotations
from dataclasses import dataclass,asdict
from typing import Dict,List

@dataclass(frozen=True)
class PortRecord:
    native_path:str; language:str; python_target:str; status:str; notes:str

PORTS:List[PortRecord]=[
PortRecord('include/chimera.h','C header','chimera_py.emulator.ChimeraABI','ported','Public state/control/JSON ABI preserved.'),
PortRecord('src/chimera.c','C','chimera_py.emulator.ChimeraCore','ported','Graph, scheduler, counters, memory and JSON state.'),
PortRecord('src/isa/chimera_isa.cpp','C++','chimera_py.isa8192.CPU8192','ported','8192-bit execution core and canonical 16-byte packet decoder.'),
PortRecord('src/isa/ISA_EncoderDecoder.cpp','C++','chimera_py.isa8192.ISA','ported','Canonical packet assembly and bitfield helpers.'),
PortRecord('src/isa/isa_bitfields.cpp','C++','chimera_py.isa8192.ISA.bitmask','ported','128-bit field operations use Python arbitrary-precision integers.'),
PortRecord('src/isa/unified_isa.cpp','C++','chimera_py.isa8192.OPCODES','ported','Unified opcode namespace.'),
PortRecord('src/kernel/*.cpp','C++','chimera_py.kernel','ported-surface','Kernel lifecycle/task boundary mapped to Python.'),
PortRecord('src/dma/dma.cpp','C++','chimera_py.services.DMAEngine','ported-surface','Host-safe DMA model.'),
PortRecord('src/net/*.cpp','C++','chimera_py.services.NetworkBridge','ported-surface','Explicit packet injection/egress boundary.'),
PortRecord('src/runtime/nbit_runtime.cpp','C++','chimera_py.services.NBitRuntime','ported-surface','Arbitrary-width arithmetic boundary.'),
PortRecord('src/services/kore.cpp','C++','chimera_py.services.KoreService','ported-surface','Service/event boundary.'),
PortRecord('src/server.c','C','research_app Python service layer','ported-surface','Server-facing state API maps to application services.'),
PortRecord('src/arch/x86_64/chimera_fastpath.S','x86-64 ASM','chimera_py.emulator','emulated','Portable Python semantics replace host assembly fast path.'),
PortRecord('boot/x86/mbr/boot.asm','x86 ASM','chimera_py.boot model','modeled','Firmware/BIOS execution remains a model, not Python firmware.'),
]

def manifest()->List[Dict[str,str]]: return [asdict(x) for x in PORTS]
def audit()->Dict[str,object]:
    counts:Dict[str,int]={}
    for item in PORTS: counts[item.status]=counts.get(item.status,0)+1
    return {'records':len(PORTS),'by_status':counts,'native_repository':'amerhwitat/ChimeraIIOS'}
