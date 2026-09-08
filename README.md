# Chimera II Python Research Platform

This repository is the **separate consolidation and improvement target** for the user's Python research/application work. The `amerhwitat/ChimeraIIOS` repository is intentionally **not modified**.

## What was added

- A standard-library-first `chimera_py/` runtime with configuration, safe paths, logging, jobs and plugin discovery.
- A headless `research_app/` layer for Unicode text normalization, SQLite document indexing, optional PyMuPDF PDF extraction/search/rendering, and CLI automation.
- Hardened GitHub source importing with URL-safe paths, traversal protection, truncated-tree detection, optional environment-token authentication, size limits, and provenance manifests.
- Python 3.8 compatibility and modern dependency tracks.
- Multi-version GitHub Actions tests and compile checks.
- Provenance and compatibility documentation.

## Source repositories

- https://github.com/amerhwitat/nlp — Python/NLP/OCR/Thamudic and related research programs
- https://github.com/amerhwitat/PDFreaderPY — Python PDF reader
- https://github.com/amerhwitat/bruteforce — security/cryptocurrency research scripts

## Layout

- `chimera_py/` — core runtime primitives
- `research_app/` — document/research services and CLI
- `tools/` — developer/import utilities
- `research/` — NLP, OCR, Thamudic and other research programs
- `security_research/` — isolated security research material
- `docs/` — architecture, compatibility and provenance documentation
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

The source remains Python 3.8-compatible to preserve legacy interfaces, but Python 3.8 reached end-of-life on 2024-10-07. Use a currently supported Python release for new production deployments; see `docs/COMPATIBILITY.md`.

## Safety and provenance

Source material is kept separated by origin. Security/cryptocurrency research code is not treated as Chimera II core code and is not enhanced to facilitate unauthorized access or key recovery.

Imported programs are never executed by the source importer. The importer records source blob identifiers in `docs/import-manifest.json`.

## Relationship to Chimera II OS

This repository is an application/research consolidation layer. Future ISA/emulator adapters can be connected through explicit interfaces without coupling the application to a specific `ChimeraIIOS` checkout.
