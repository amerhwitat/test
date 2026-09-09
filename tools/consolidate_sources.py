#!/usr/bin/env python3
"""Consolidate source trees from local clones into a provenance-preserving staging tree.

The tool deliberately copies source text only after an explicit allowlist is supplied.
It skips secrets, VCS metadata, generated/build output and common credential material.
It never modifies upstream repositories.
"""
from __future__ import annotations

import argparse
import hashlib
import json
import shutil
from pathlib import Path

DEFAULT_EXCLUDES = {
    ".git", ".github", "node_modules", "__pycache__", ".pytest_cache",
    "build", "dist", "target", "bin", "obj", ".venv", "venv"
}
SECRET_NAMES = {".env", ".env.local", ".env.production", "id_rsa", "id_ed25519"}
TEXT_EXTENSIONS = {
    ".c", ".h", ".cc", ".cpp", ".cxx", ".hpp", ".java", ".js", ".mjs",
    ".ts", ".py", ".sh", ".bash", ".zsh", ".json", ".yaml", ".yml", ".md",
    ".txt", ".toml", ".ini", ".cmake", ".qml", ".css", ".html", ".xml"
}


def digest(path: Path) -> str:
    h = hashlib.sha256()
    with path.open("rb") as f:
        for chunk in iter(lambda: f.read(1024 * 1024), b""):
            h.update(chunk)
    return h.hexdigest()


def consolidate(source: Path, destination: Path, repo: str) -> list[dict]:
    records: list[dict] = []
    for path in source.rglob("*"):
        if not path.is_file():
            continue
        rel = path.relative_to(source)
        if any(part in DEFAULT_EXCLUDES for part in rel.parts):
            continue
        if path.name in SECRET_NAMES or path.name.lower().endswith(('.pem', '.key', '.p12')):
            continue
        if path.suffix.lower() not in TEXT_EXTENSIONS:
            continue
        target = destination / repo.replace("/", "__") / rel
        target.parent.mkdir(parents=True, exist_ok=True)
        shutil.copy2(path, target)
        records.append({"repo": repo, "path": str(rel), "sha256": digest(path)})
    return records


def main() -> int:
    p = argparse.ArgumentParser()
    p.add_argument("--manifest", default="docs/SOURCE_REGISTRY.json")
    p.add_argument("--source-root", type=Path, required=True, help="directory containing local repository clones")
    p.add_argument("--destination", type=Path, default=Path("consolidated_sources"))
    p.add_argument("--write-manifest", type=Path, default=Path("docs/CONSOLIDATED_SOURCES.json"))
    args = p.parse_args()

    manifest = json.loads(Path(args.manifest).read_text(encoding="utf-8"))
    args.destination.mkdir(parents=True, exist_ok=True)
    all_records: list[dict] = []
    missing: list[str] = []
    for item in manifest["repositories"]:
        repo = item["repo"]
        local = args.source_root / repo.split("/", 1)[-1]
        if not local.exists():
            missing.append(repo)
            continue
        all_records.extend(consolidate(local, args.destination, repo))

    output = {
        "tool": "tools/consolidate_sources.py",
        "source_count": len(manifest["repositories"]),
        "files_copied": len(all_records),
        "missing_local_clones": missing,
        "files": all_records,
    }
    args.write_manifest.parent.mkdir(parents=True, exist_ok=True)
    args.write_manifest.write_text(json.dumps(output, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    print(json.dumps({"files_copied": len(all_records), "missing": missing}, indent=2))
    return 0 if not missing else 2


if __name__ == "__main__":
    raise SystemExit(main())
