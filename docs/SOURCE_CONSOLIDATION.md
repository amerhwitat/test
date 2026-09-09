# Chimera II Source Consolidation

`amerhwitat/test` is the host-side integration and conformance target for related Chimera II work. Source is adapted by function rather than blindly concatenated: Python is the executable integration layer while native C/C++, Java, Node.js, research and desktop code are represented through compatible adapters and provenance records.

## Source families

| Repository | Integrated role | Target |
|---|---|---|
| `amerhwitat/CPU4096` | 4096-bit simulator concepts and fixed-width arithmetic | `chimera_py/isa8192.py`, emulator/conformance tests |
| `amerhwitat/CPU4096Simulator` | Node.js ISA, memory, kernel, network, toolchain, 128D and robotics models | Python contracts and `web/` integration |
| `amerhwitat/keygen` | Java CPU, Koronos/128D, desktop profiles, boot progress and services | `chimera_py/` lifecycle adapters |
| `amerhwitat/amerhwitat.github.io` | Native C/C++ platform and ISA/service architecture | `chimera_py/native_port.py` and compatibility docs |
| `amerhwitat/nlp` | NLP/OCR/Thamudic research | research importer boundary |
| `amerhwitat/PDFreaderPY` | PDF/document tooling | research importer boundary |
| `amerhwitat/bruteforce` | isolated security/cryptocurrency research | provenance only; no credential/private-key recovery features |

## Consolidation mechanism

`docs/SOURCE_REGISTRY.json` is the authoritative source-family manifest. `tools/consolidate_sources.py` can ingest local clones into a deterministic `consolidated_sources/` staging tree while recording SHA-256 provenance. It deliberately excludes VCS metadata, generated output, credentials and binary/private-key material. Upstream repositories are never modified by the tool.

## Boot and desktop lifecycle

```text
POWER ON
  -> Spitfire 8-stage boot
  -> Spitfire = 100%
  -> Koronos kernel
  -> core services READY
  -> Jasper Manager STARTING
  -> Jasper Manager RUNNING
  -> desktop session READY
  -> Aurora host compositor launch
  -> AURORA/DESKTOP READY
```

The launch order is enforced in `chimera_py/orchestrator.py`: Aurora is prepared but not launched until Spitfire has completed, Koronos services are ready, and Jasper has opened the desktop gate. This prevents a compositor or desktop session from appearing early in the lifecycle.

## Desktop contract

A successful logical desktop boot exposes:

- `boot.progress_percent == 100`
- `boot.desktop_gate_open == true`
- `jasper.state == "running"`
- `jasper.desktop_state == "ready"`
- `desktop.ready == true`
- `desktop.manager == "Jasper"`
- default profile `aurora`

`desktop.ready` means the logical desktop/session manager has initialized. `aurora.state` separately describes the actual host compositor process; native Wayland execution remains host-controlled.

## API

The Python API exposes `/api/state`, `/api/boot`, `/api/jasper`, and `/api/desktop`. The Aurora web shell polls `/api/state` and renders the Jasper manager state, service readiness, Spitfire percentage and compositor state.

## ISA boundary

The consolidated runtime preserves the canonical 284-entry opcode identity range `0x0001..0x011C`. Cataloguing an opcode does not imply that its execution semantics are implemented; undefined instructions remain explicit until semantics and conformance tests exist.

## Provenance

Imported research source must retain upstream licensing and provenance. Native firmware, kernel-driver, GPU, Wayland and external OS facilities remain adapters unless they actually execute in the host environment. Proprietary implementation source is not redistributed.
