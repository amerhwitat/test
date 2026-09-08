# Chimera II Python Research Platform

This repository is the **separate consolidation and improvement target** for the user's Python research/application work. The `amerhwitat/ChimeraIIOS` repository is intentionally **not modified**.

## What was added

- A standard-library-first `chimera_py/` runtime with configuration, safe paths, logging, jobs and plugin discovery.
- A portable **8192-bit Chimera II Python execution layer** derived from the native C/C++ ISA surfaces.
- Canonical 16-byte instruction encoding/decoding, assembler/disassembler and a 284-entry `0x0001..0x011C` opcode identity registry.
- 1024-register R8192 emulation, 128 × 64-bit lanes, privilege checks, memory operations, scheduler, DMA/service boundaries and JSON state reporting.
- A Python compatibility layer corresponding to the native `chimera.h` control/state API.
- A headless `research_app/` layer for Unicode text normalization, SQLite document indexing, optional PyMuPDF PDF extraction/search/rendering, and CLI automation.
- Hardened GitHub source importing with URL-safe paths, traversal protection, truncated-tree detection, optional environment-token authentication, size limits, and provenance manifests.
- Python 3.8 compatibility plus a current Python 3.14 CI lane.
- Provenance, native-port and compatibility documentation.

## Chimera native-to-Python port

See `docs/CHIMERA_PYTHON_PORT.md` for the conversion matrix and deep integration audit.

```bash
python -c "from chimera_py import ISA; print(ISA.opcodes['ADD'], hex(ISA.opcodes['POLICY_AUDIT']))"
python -c "from chimera_py.assembler import assemble_text, disassemble; print(disassemble(assemble_text('ADD R1,R2,R3')))"
python -c "from chimera_py import ChimeraCore; c=ChimeraCore(); c.step(); print(c.state()['ticks'])"
```

## Source repositories

- https://github.com/amerhwitat/nlp — Python/NLP/OCR/Thamudic and related research programs
- https://github.com/amerhwitat/PDFreaderPY — Python PDF reader
- https://github.com/amerhwitat/bruteforce — security/cryptocurrency research scripts
- https://github.com/amerhwitat/ChimeraIIOS — native Chimera II source of record; **read-only for this project**

## Layout

- `chimera_py/` — portable Chimera II runtime, ISA and kernel/service compatibility
- `research_app/` — document/research services and CLI
- `tools/` — developer/import utilities
- `research/` — NLP, OCR, Thamudic and other research programs
- `security_research/` — isolated security research material
- `docs/` — architecture, compatibility, provenance and native-port documentation
- `tests/` — regression/conformance tests

## CLI

```bash
python -m research_app.cli info
python -m research_app.cli source audit
python -m research_app.cli pdf extract FILE.pdf
python -m research_app.cli pdf search FILE.pdf TERM
python -m research_app.cli import
```

The PDF commands load PyMuPDF lazily, so the core CLI remains usable without the PDF dependency.

## Compatibility

Python **3.14.7** is the current stable target. Python 3.8 remains a legacy compatibility lane only. Use a currently supported Python release for new production deployments; see `docs/COMPATIBILITY.md` and `docs/CHIMERA_PYTHON_PORT.md`.

## Safety and provenance

Source material is kept separated by origin. Security/cryptocurrency research code is not treated as Chimera II core code and is not enhanced to facilitate unauthorized access or key recovery.

Imported programs are never executed by the source importer. The importer records source blob identifiers in `docs/import-manifest.json`.

## Relationship to Chimera II OS

This repository is the Python application/research and emulator consolidation layer. Native firmware, assembly, QEMU, UEFI, Wayland, GPU and device functionality remains behind explicit adapters rather than being falsely represented as pure Python firmware or host-driver implementations.
