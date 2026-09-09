# Chimera II Source Consolidation

`amerhwitat/test` is the host-side integration and conformance target for related Chimera II work. Source is adapted by function rather than blindly concatenated: Python is the executable integration layer while native C/C++, Java, Node.js, research and desktop code are represented through compatible adapters and provenance records.

## Source families

| Repository | Integrated role | Target |
|---|---|---|
| `amerhwitat/CPU4096` | 4096-bit simulator concepts and fixed-width arithmetic | `chimera_py/isa8192.py`, emulator/conformance tests |
| `amerhwitat/CPU4096Simulator` | Node.js ISA, memory, kernel, network, toolchain, 128D and robotics models | Python contracts and `web/` integration |
| `amerhwitat/keygen` | Java CPU, Koronos/128D, desktop profiles, boot progress and services | `chimera_py/` lifecycle adapters |
| `amerhwitat/amerhwitat.github.io` | Native C/C++ platform and ISA/service architecture | `chimera_py/native_port.py` and compatibility docs |
| `amerhwitat/nlp` | NLP/OCR/Thamudic research | `research/nlp/` importer boundary |
| `amerhwitat/PDFreaderPY` | PDF/document tooling | `research/pdfreaderPY/` importer boundary |
| `amerhwitat/bruteforce` | isolated security/cryptocurrency research | provenance only; no credential/private-key recovery features |

## Boot and desktop lifecycle

```text
Spitfire 100%
    -> Koronos kernel
    -> core services
    -> Jasper Manager
    -> desktop session
    -> Aurora Wayland boundary
```

Jasper cannot start the desktop while Spitfire is below 100% or required Koronos services are unavailable. The state is exposed through the Python API and Aurora web shell.

## Desktop contract

A successful host boot exposes:

- `boot.progress_percent == 100`
- `boot.desktop_gate_open == true`
- `jasper.state == "running"`
- `jasper.desktop_state == "ready"`
- `desktop.ready == true`
- `desktop.manager == "Jasper"`
- default profile `aurora`

`desktop.ready` means the logical desktop session is initialized. `aurora.state` separately describes the actual host compositor process.

## ISA boundary

The consolidated runtime preserves the canonical 284-entry opcode identity range `0x0001..0x011C`. Cataloguing an opcode does not imply that its execution semantics are implemented; undefined instructions remain explicit until semantics and conformance tests exist.

## Provenance

Imported research source must retain upstream licensing and provenance. Native firmware, kernel-driver, GPU, Wayland and external OS facilities remain adapters unless they actually execute in the host environment. Proprietary implementation source is not redistributed.
