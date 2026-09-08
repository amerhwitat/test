# Chimera II native-to-Python port

## Scope

The Python layer in this repository is a portable execution and research implementation of the native Chimera II surfaces found in `amerhwitat/ChimeraIIOS`. The native repository is **not modified**.

The native tree currently exposes C/C++/assembly surfaces including:

- `src/chimera.c` and `include/chimera.h`
- R8192 ISA implementation under `src/isa/`
- kernel sources under `src/kernel/`
- DMA under `src/dma/`
- networking under `src/net/`
- arbitrary-width runtime under `src/runtime/`
- service layer under `src/services/`
- x86-64 assembly fast path under `src/arch/x86_64/`
- x86 MBR boot assembly under `boot/x86/mbr/`

The repository tree confirms the ISA implementation consists of four C++ translation units, while the kernel, DMA, networking, runtime and service layers are separate native boundaries. fileciteturn91file0L2-L2 fileciteturn92file0L2-L2 fileciteturn93file0L2-L2 fileciteturn94file0L2-L2 fileciteturn95file0L2-L2 fileciteturn96file0L2-L2

## Canonical ABI

The native ISA uses a 16-byte host-emulation instruction packet:

```text
opcode[16] | rd[16] | rs[16] | rt[16] | immediate[64]
```

The Python `Instruction` class preserves this byte layout exactly. The native specification explicitly identifies the 16-bit opcode requirement because the catalog reaches `0x011C`. fileciteturn77file0L2-L2

The Python implementation models:

- 8192-bit general registers as Python arbitrary-precision integers.
- 128 × 64-bit lanes.
- 1024 architectural GPRs by default in `CPU8192`.
- canonical instruction encoding/decoding.
- arithmetic, logic, shifts, rotates, comparisons, memory primitives and SHA operations.
- explicit privilege checks.
- explicit `Executed`, `PrivilegeViolation`, `InvalidOpcode`, and `UnimplementedService` outcomes.
- scheduler, memory, message counters and brain-graph activity.
- a compatibility class corresponding to the public C API in `chimera.h`.

## ISA coverage

The native C++ opcode name table contains 284 assigned instructions, from opcode `0x0001` through `0x011C`. The Python registry contains the same 284-name identity map. The native source identifies this catalog as extending through `0x011C`. fileciteturn76file0L2-L2

Recognition is intentionally separated from subsystem completion. The native ISA specification makes the same distinction: recognized operations may dispatch to kernel, DMA, networking, VFS, database, Aurora/GPU, security, media and service boundaries without pretending that every operation is implemented by the CPU core. fileciteturn77file0L2-L2

## What was converted versus modeled

### Directly portable semantics

- register representation
- arbitrary-width arithmetic
- canonical instruction packet
- decoder/assembler/disassembler
- opcode identity
- privilege boundary
- CPU scheduler model
- memory model
- state JSON
- DMA memory-copy model
- task/service boundaries

### Host-bound surfaces

The x86-64 assembly fast path is represented by the same portable semantics rather than emitted as Python source pretending to be machine instructions. Likewise, the 16-bit BIOS/MBR boot code is represented as a boot model; Python cannot itself replace firmware execution.

The original boot sector initializes real-mode segments, prints a message through BIOS interrupt `10h`, then halts. fileciteturn88file0L2-L2

## Missing / incomplete areas found during the audit

1. **Canonical catalog source mismatch:** the documentation refers to `tools/isa/chimera_isa_r8192_complete.csv`, but the current public tree exposes the R8192 opcode index and extension CSVs rather than that exact file path. This is recorded as a provenance gap rather than fabricated.
2. **Encoding gaps:** the native documentation explicitly flags `ECC_POINT_ADD`, 8-bit templates for opcodes above `0x00FF`, and `separate field` metadata as requiring normative encoding clarification. fileciteturn77file0L2-L2
3. **Subsystem implementations:** many ISA entries are service boundaries, not CPU-local implementations. Python therefore returns `UnimplementedService` until an owning backend is connected.
4. **Firmware:** UEFI/BIOS execution must remain a firmware/VM boundary. UEFI defines Boot Services before `ExitBootServices()` and Runtime Services before and after it; the Python layer models the boundary rather than claiming to implement firmware. citeturn3search0turn3search1
5. **Graphics protocol:** Aurora's Wayland-facing functionality should follow Wayland's object/request/event protocol model rather than inventing a private wire format. citeturn3search6
6. **Virtualization:** a future QEMU integration should expose Chimera as a guest architecture/device model and translate the guest ISA into a host TCG target; QEMU's documentation distinguishes the guest emulated architecture from the TCG host target. citeturn3search11

## Latest Python target

As of this repository update, Python **3.14.7** is the latest stable Python release. It was released August 5, 2026. citeturn3search3

CI therefore tests Python 3.14 while retaining Python 3.8 as a legacy compatibility lane. New deployments should use a currently supported Python release.

## Recommended next integration layers

1. Generate the full opcode/bitfield registry from the authoritative CSV/JSON metadata.
2. Add conformance vectors for every defined opcode.
3. Add a capability-based service dispatcher for SPOTNIK, AURORA, VFS, NDB/HIVE and HYBRID operations.
4. Add a QEMU adapter boundary without coupling the Python emulator to QEMU internals.
5. Add a UEFI-loader model and boot-memory map.
6. Add a Wayland protocol adapter and keep host compositor operations outside the ISA core.
7. Add optional accelerated backends (NumPy, Numba or native extensions) behind the same Python API, while keeping the standard-library implementation authoritative.
