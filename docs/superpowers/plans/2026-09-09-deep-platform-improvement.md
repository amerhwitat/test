# Deep Platform Improvement Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn `amerhwitat/test` into a maintainable Python research platform that consolidates document intelligence, research pipelines, CLI tooling, provenance, and compatibility testing without modifying `amerhwitat/ChimeraIIOS`.

**Architecture:** Add a small standard-library core for configuration, paths, logging, jobs, and plugin discovery; add optional document/research services behind lazy imports; keep legacy source trees separated by provenance; add CLI and CI/test boundaries. Preserve existing ABI/interfaces where applicable and keep security-research code isolated.

**Tech Stack:** Python 3.8-compatible core, optional PyMuPDF/Pillow/NumPy/scikit-learn/OpenCV/TensorFlow adapters, SQLite, pytest, GitHub Actions.

**Spec:** `README.md` and `docs/SOURCE_INVENTORY.md`.

## Global Constraints

- `amerhwitat/ChimeraIIOS` must not be modified.
- Preserve existing interfaces/ABI where applicable.
- UTF-8 and Unicode/Arabic/RTL data must remain supported.
- Core runtime must not require heavyweight ML/PDF dependencies.
- Imported source is provenance-preserving and never executed automatically.
- Security/cryptocurrency research remains isolated and is not enhanced for unauthorized key or credential recovery.
- Python 3.8 compatibility is retained as a compatibility target, but Python 3.8 is EOL and must not be described as a secure production baseline.

---

### Task 1: Core runtime boundaries

**Files:**
- Create: `chimera_py/__init__.py`
- Create: `chimera_py/config.py`
- Create: `chimera_py/paths.py`
- Create: `chimera_py/logging.py`
- Create: `chimera_py/jobs.py`
- Create: `chimera_py/plugins.py`
- Test: `tests/test_core_runtime.py`

**Interfaces:**
- `AppConfig.from_env()` and `.as_dict()`
- `safe_join(base, *parts)` rejects path traversal
- `configure_logging(level)` returns a logger
- `Job` exposes `run()` and structured status
- `discover_plugins(package_name)` discovers modules without importing application side effects

- [ ] Write failing tests for path safety, config defaults, job lifecycle, and plugin discovery.
- [ ] Run the focused tests and verify they fail for the intended missing implementation.
- [ ] Implement the minimal core.
- [ ] Run the focused tests again.
- [ ] Refactor without changing interfaces.

### Task 2: Document intelligence service

**Files:**
- Create: `research_app/__init__.py`
- Create: `research_app/documents.py`
- Create: `research_app/text.py`
- Create: `research_app/index.py`
- Test: `tests/test_documents.py`
- Test: `tests/test_text.py`
- Test: `tests/test_index.py`

**Interfaces:**
- `normalize_text(text)` is deterministic and Unicode-safe.
- `PdfDocument.open(path)` lazily imports PyMuPDF and exposes metadata/page count/text extraction.
- `PdfDocument.search(term)` returns page-numbered matches.
- `DocumentIndex` stores content hashes and searchable extracted text in SQLite.

- [ ] Write failing tests using a small generated text fixture and mocked optional PDF availability only where necessary.
- [ ] Verify RED.
- [ ] Implement lazy optional PDF support and SQLite indexing.
- [ ] Verify GREEN.
- [ ] Refactor and preserve headless operation.

### Task 3: Harden source importer and provenance

**Files:**
- Modify: `tools/import_github_sources.py`
- Create: `tests/test_importer.py`
- Create: `docs/PROVENANCE.md`

**Interfaces:**
- URL-encode GitHub paths safely.
- Detect truncated recursive Git trees and fail clearly instead of silently losing files.
- Accept `GITHUB_TOKEN` from the environment without persisting it.
- Reject unsafe destination paths.
- Emit a machine-readable import manifest containing source repo, path, blob SHA, and import timestamp.

- [ ] Write failing tests for URL encoding, safe destination handling, and manifest generation.
- [ ] Verify RED.
- [ ] Implement the importer changes.
- [ ] Verify GREEN.
- [ ] Document provenance and reproducibility.

### Task 4: CLI and automation

**Files:**
- Create: `research_app/cli.py`
- Create: `tests/test_cli.py`
- Create: `requirements-python38.txt`
- Create: `requirements-modern.txt`
- Create: `.gitignore`

**Interfaces:**
- `python -m research_app.cli info`
- `python -m research_app.cli pdf extract FILE`
- `python -m research_app.cli pdf search FILE TERM`
- `python -m research_app.cli source audit`
- `python -m research_app.cli import`

- [ ] Write failing CLI tests for `info` and source audit.
- [ ] Verify RED.
- [ ] Implement CLI dispatch with standard-library core only.
- [ ] Add conservative Python 3.8 dependency constraints for optional packages and a separate modern track.
- [ ] Verify GREEN.

### Task 5: CI and compatibility documentation

**Files:**
- Create: `.github/workflows/python.yml`
- Create: `docs/COMPATIBILITY.md`
- Modify: `README.md`

- [ ] Add a GitHub Actions matrix for supported modern Python plus the compatibility track where hosted runners permit it.
- [ ] Run syntax and unit tests in CI.
- [ ] Document Python 3.8 EOL and the recommended modern runtime path.
- [ ] Document that `ChimeraIIOS` remains untouched.

### Task 6: Verification and review

- [ ] Run local syntax compilation for all newly created Python files.
- [ ] Run focused unit tests and full tests.
- [ ] Inspect the resulting commit diff.
- [ ] Check GitHub Actions status for the implementation commit.
- [ ] Request code review before merging to `main`.
- [ ] Merge only after verification; otherwise leave the improvement branch available for review.
