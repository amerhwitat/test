# Chimera II Python Research Platform

`amerhwitat/test` is the host-side consolidation, integration and conformance target for the related Chimera II work. The native source-of-record repositories are preserved separately; this repository provides executable Python adapters, web integration, tests and desktop lifecycle orchestration.

## Unified startup

```text
Spitfire boot (100%)
        ↓
Koronos kernel
        ↓
Chimera services
        ↓
Jasper Desktop Manager
        ↓
Desktop session READY
        ↓
Aurora Wayland boundary
```

Start everything with:

```bash
python3 start_chimera.py
```

Then open `http://127.0.0.1:3000` when the web bridge is enabled. Python API defaults to `http://127.0.0.1:8765`.

### Boot gate

The desktop **cannot start before Spitfire reaches 100%**. Jasper additionally verifies required Koronos services before transitioning the logical desktop session to `ready`.

The runtime state exposes:

- `boot.progress_percent`
- `boot.desktop_gate_open`
- `jasper.state`
- `jasper.desktop_state`
- `desktop.ready`
- `desktop.manager`
- `desktop.profile`
- `aurora.state`

## Integrated functionality

- 8192-bit R8192 execution layer and 1024-register model.
- Canonical 16-byte instruction codec, assembler/disassembler and 284-entry opcode identity registry.
- Memory, virtual memory, MMIO/fault and protection models.
- Kernel scheduler, process contexts, capabilities, IPC, syscalls and service management.
- Network packet, UDP/TCP, DNS and Netlink-compatible models.
- 128D/Koronos research vectors and deterministic brain-network simulation boundaries.
- Robotics HAL and swarm scheduling boundaries.
- Key-generation/hash/HMAC-compatible host security primitives.
- Spitfire boot state machine and Koronos service orchestration.
- **Jasper Desktop Manager** with explicit boot/service gates.
- Aurora desktop/web shell and native compositor integration tests.
- NLP/OCR/Thamudic and PDF research import boundaries.
- Provenance-aware source importing and compatibility documentation.

## Source consolidation

See `docs/SOURCE_CONSOLIDATION.md` for the repository-by-repository mapping. Related source families include `CPU4096`, `CPU4096Simulator`, `keygen`, native `amerhwitat.github.io`, `nlp`, and `PDFreaderPY`. Security/cryptocurrency research remains isolated and is not converted into unauthorized credential or private-key recovery functionality.

## ISA status

The canonical **284 opcode slots** are retained as an identity/catalogue boundary. A catalogued opcode is not automatically a fully implemented instruction. Execution semantics are implemented incrementally with conformance tests; undefined operations remain explicit.

## Host/emulation boundary

Spitfire and Jasper in this repository are host-side models. Python does not replace UEFI/BIOS, MBR execution, kernel-mode drivers, firmware or physical hardware. Aurora can launch a host compositor when explicitly configured, while the logical desktop session can still be marked ready for headless CI and research environments.

## Compatibility

Python 3.8 remains a legacy compatibility lane; current Python 3.14 is the primary target. Node.js 24 LTS is used by CI. QEMU remains the future machine-level virtualization boundary.

## Repository policy

This repository is the integration target. Other source repositories are not modified by the Python consolidation workflow.
