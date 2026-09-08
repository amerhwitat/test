#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Import source/documentation from configured GitHub repositories.

Python 3.8-compatible and standard-library-only. Imported programs are never
executed. The importer records source blob SHAs in a JSON manifest.
"""

import base64
import json
import os
import sys
from datetime import datetime, timezone
from urllib.parse import quote
from urllib.request import Request, urlopen

API_ROOT = "https://api.github.com/repos"
MANIFEST_PATH = "docs/import-manifest.json"
MAX_TEXT_BYTES = 2 * 1024 * 1024

SOURCES = (
    ("amerhwitat/nlp", "research/nlp"),
    ("amerhwitat/PDFreaderPY", "research/pdfreaderPY"),
    ("amerhwitat/bruteforce", "security_research/bruteforce"),
)


def github_path_url(repo, path):
    return "%s/%s/contents/%s" % (API_ROOT, repo, quote(path, safe="/"))


def safe_destination(destination, path):
    root = os.path.realpath(os.path.abspath(destination))
    candidate = os.path.realpath(os.path.abspath(os.path.join(root, path)))
    if os.path.commonpath([root, candidate]) != root:
        raise ValueError("source path escapes destination")
    return candidate


def github_json(url):
    headers = {
        "Accept": "application/vnd.github+json",
        "User-Agent": "ChimeraII-Python38-SourceImporter",
    }
    token = os.environ.get("GITHUB_TOKEN")
    if token:
        headers["Authorization"] = "Bearer " + token
    request = Request(url, headers=headers)
    with urlopen(request, timeout=30) as response:
        return json.loads(response.read().decode("utf-8"))


def fetch_text(repo, path):
    data = github_json(github_path_url(repo, path))
    encoded = data.get("content", "")
    if data.get("encoding") != "base64":
        raise RuntimeError("Unexpected GitHub encoding for %s:%s" % (repo, path))
    raw = base64.b64decode(encoded)
    if len(raw) > MAX_TEXT_BYTES:
        raise RuntimeError("Refusing oversized text source: %s:%s" % (repo, path))
    return raw.decode("utf-8")


def build_manifest_entry(repo, path, blob_sha, size):
    return {
        "repo": repo,
        "path": path,
        "blob_sha": blob_sha,
        "size": size,
        "imported_at": datetime.now(timezone.utc).isoformat(),
    }


def import_repo(repo, destination, manifest):
    tree = github_json("%s/%s/git/trees/main?recursive=1" % (API_ROOT, repo))
    if tree.get("truncated"):
        raise RuntimeError("GitHub returned a truncated tree for %s; refusing partial import" % repo)
    imported = 0
    for entry in tree.get("tree", []):
        path = entry.get("path", "")
        if entry.get("type") != "blob":
            continue
        if not (path.endswith(".py") or path.endswith(".md")):
            continue
        target = safe_destination(destination, path)
        os.makedirs(os.path.dirname(target), exist_ok=True)
        try:
            content = fetch_text(repo, path)
        except Exception as exc:
            print("SKIP %s:%s (%s)" % (repo, path, exc), file=sys.stderr)
            continue
        with open(target, "w", encoding="utf-8", newline="") as handle:
            handle.write(content)
        manifest.append(build_manifest_entry(repo, path, entry.get("sha"), len(content.encode("utf-8"))))
        imported += 1
        print("IMPORTED %s:%s -> %s" % (repo, path, target))
    return imported


def main():
    total = 0
    manifest = []
    for repo, destination in SOURCES:
        total += import_repo(repo, destination, manifest)
    os.makedirs(os.path.dirname(MANIFEST_PATH), exist_ok=True)
    with open(MANIFEST_PATH, "w", encoding="utf-8") as handle:
        json.dump({"version": 1, "sources": manifest}, handle, ensure_ascii=False, indent=2, sort_keys=True)
        handle.write("\n")
    print("Imported %d source/documentation files." % total)
    print("No imported program is executed by this tool.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
