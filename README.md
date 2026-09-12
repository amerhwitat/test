# Chimera II Python Research Platform

`amerhwitat/test` is the host-side consolidation, integration and conformance target for the related Chimera II work. The native source-of-record repositories are preserved separately; this repository provides executable Python adapters, web integration, tests and desktop lifecycle orchestration.

## Complete source-code citation index

| Area | Source |
|---|---|
| Python/runtime source | [repository source tree](.) |
| Tests | [tests and conformance source](.) |
| Apple shell | [apple/](apple/) |
| Documentation | [docs/](docs/) |
| Complete tracked repository | [source tree](.) |

These links are the README-level citations for the maintained code. The repository tree and component documentation provide the detailed file-level source record.

## Central Apple Objective-C + Flutter implementation

The centralized Apple companion is [`general/Apple-Implementations/test`](https://github.com/amerhwitat/general/tree/master/Apple-Implementations/test). It provides Objective-C/Xcode native integration and Flutter iOS/macOS UI while retaining Python as a host-side research/conformance runtime.

## Apple application boundary

`apple/project.yml` defines native SwiftUI iOS/iPadOS and macOS targets and is generated with XcodeGen. The Apple shell validates the cross-platform contract without pretending Python itself is an iOS runtime. IPA archive/export requires macOS/Xcode and external signing configuration.

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

Start everything with `python3 start_chimera.py`.

## Integrated functionality

- 8192-bit R8192 execution layer and 1024-register model.
- Canonical 16-byte instruction codec, assembler/disassembler and 284-entry opcode identity registry.
- Memory, virtual memory, MMIO/fault and protection models.
- Kernel scheduler, process contexts, capabilities, IPC, syscalls and service management.
- Network packet, UDP/TCP, DNS and Netlink-compatible models.
- 128D/Koronos research vectors and deterministic brain-network simulation boundaries.
- Robotics HAL and swarm scheduling boundaries.
- NLP/OCR/Thamudic and PDF research import boundaries.

## Portfolio 128D + authenticated P2P

This integration target validates the shared 128D semantic state and opt-in peer envelope across the Chimera portfolio. Tests cover deterministic state, peer capabilities, payload hashing, sequencing/replay protection and snapshot/delta compatibility. P2P tests never authorize unsolicited scanning, credential/private-key exchange, arbitrary executable transfer or remote command execution.

See `docs/CHIMERA_128D_P2P_PORTFOLIO.md`.

## Repository policy

This repository is the integration target. Other source repositories are not modified by the Python consolidation workflow.
