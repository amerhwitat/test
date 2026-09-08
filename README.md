# Chimera II Python Research Platform

This repository is the **separate consolidation and improvement target** for the user's Python research/application work. The `amerhwitat/ChimeraIIOS` repository is intentionally **not modified**.

## Unified Chimera II host runtime

`test` now provides a single host-side startup path:

```text
Spitfire boot model -> Koronos kernel -> Chimera services -> Aurora Wayland boundary
                                               |
                                         Python API :8765
                                               |
                                      Node.js/Aurora Web :3000
```

Start everything with:

```bash
python3 start_chimera.py
```

Then open `http://127.0.0.1:3000`. Node.js serves the Aurora web shell and proxies `/api/*` to the Python runtime. No npm dependencies are required.

The bootloader is intentionally a **host/emulation model**: Python cannot replace UEFI/BIOS or directly execute an MBR. A future bare-metal Spitfire image remains a separate firmware target.

## What was added

- Standard-library-first `chimera_py/` runtime with configuration, safe paths, logging, jobs and plugin discovery.
- Portable **8192-bit Chimera II Python execution layer** derived from native C/C++ ISA surfaces.
- Canonical 16-byte instruction encoding/decoding, assembler/disassembler and a 284-entry `0x0001..0x011C` opcode identity registry.
- 1024-register R8192 emulation, 128 × 64-bit lanes, privilege checks, memory operations, scheduler, DMA/service boundaries and JSON state reporting.
- Python compatibility layer corresponding to the native `chimera.h` control/state API.
- Spitfire boot sequence and Koronos/service orchestration.
- RegisterN, Spotnik, VFS, TensorFS, Nucleus, Hive, CEF, Kore, DMA and N-bit service boundaries.
- Python HTTP API and Node.js 24 LTS web supervisor/Aurora shell.
- Headless research/document layer with Unicode normalization, SQLite indexing and optional PyMuPDF support.
- Hardened GitHub source importing with provenance.
- Python 3.8 compatibility plus current Python 3.14 support.

## Native-to-Python port

See `docs/CHIMERA_PYTHON_PORT.md` and `docs/BOOT_WEB_AURORA_ARCHITECTURE.md`.

The native source-of-record repository remains read-only for this project:

- https://github.com/amerhwitat/ChimeraIIOS

Its architecture contains Spit Fire/Jasper boot, Koronos, RegisterN, Spotnik, VFS/TensorFS/Nucleus/Hive, Aurora, CEF, ISA tooling and web explorer surfaces; the Python implementation provides host-compatible runtime adapters rather than claiming to replace firmware or kernel drivers.

## Web interface

```bash
python3 start_chimera.py
```

Or independently:

```bash
python3 -m chimera_py
cd web && npm start
```

Default endpoints:

- Aurora web UI: `http://127.0.0.1:3000`
- Python health: `http://127.0.0.1:8765/api/health`
- Python state: `http://127.0.0.1:8765/api/state`

## Compatibility

Python **3.14.7** is the current stable target. Python 3.8 remains a legacy compatibility lane. Python 3.15.0rc2 is a pre-release and is not the production baseline. Node.js **24.20.0** is the current LTS line; Node.js 26.8.1 is the current release line.

QEMU remains the future machine-level virtualization boundary: its system emulation provides virtual CPU, memory and device models, while TCG supplies CPU emulation.

## Source repositories

- https://github.com/amerhwitat/nlp — Python/NLP/OCR/Thamudic research
- https://github.com/amerhwitat/PDFreaderPY — Python PDF reader
- https://github.com/amerhwitat/bruteforce — isolated security/cryptocurrency research
- https://github.com/amerhwitat/ChimeraIIOS — native Chimera II source of record; **not modified by this project**

## Safety and provenance

Security/cryptocurrency research remains isolated and is not enhanced to facilitate unauthorized access or key recovery. Native firmware, assembly, QEMU, UEFI, Wayland, GPU and device functionality remains behind explicit adapters rather than being falsely represented as pure Python firmware or host-driver implementations.
