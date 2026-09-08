#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Import Python source from the user's GitHub repositories.

Python 3.8.1-compatible, standard-library-only importer.
It reads repository trees through the public GitHub REST API and writes
Python source files into this repository's separated source areas.

This script never executes imported source code.
"""

import base64
import json
import os
import sys
from urllib.request import Request, urlopen

API_ROOT = "https://api.github.com/repos"

SOURCES = (
    ("amerhwitat/nlp", "research/nlp"),
    ("amerhwitat/PDFreaderPY", "research/pdfreaderPY"),
    ("amerhwitat/bruteforce", "security_research/bruteforce"),
)


def github_json(url):
    request = Request(
        url,
        headers={
            "Accept": "application/vnd.github+json",
            "User-Agent": "ChimeraII-Python38-SourceImporter",
        },
    )
    with urlopen(request, timeout=30) as response:
        return json.loads(response.read().decode("utf-8"))


def fetch_text(repo, path):
    url = "%s/%s/contents/%s" % (API_ROOT, repo, path)
    data = github_json(url)
    encoded = data.get("content", "")
    if data.get("encoding") != "base64":
        raise RuntimeError("Unexpected GitHub encoding for %s:%s" % (repo, path))
    return base64.b64decode(encoded).decode("utf-8")


def import_repo(repo, destination):
    tree = github_json("%s/%s/git/trees/main?recursive=1" % (API_ROOT, repo))
    entries = tree.get("tree", [])
    imported = 0

    for entry in entries:
        path = entry.get("path", "")
        if entry.get("type") != "blob":
            continue
        # Source-first consolidation: import executable/source/documentation text,
        # not large datasets or generated binary assets.
        if not (path.endswith(".py") or path.endswith(".md")):
            continue
        target = os.path.join(destination, path)
        os.makedirs(os.path.dirname(target), exist_ok=True)
        try:
            content = fetch_text(repo, path)
        except Exception as exc:
            print("SKIP %s:%s (%s)" % (repo, path, exc), file=sys.stderr)
            continue
        with open(target, "w", encoding="utf-8", newline="") as handle:
            handle.write(content)
        imported += 1
        print("IMPORTED %s:%s -> %s" % (repo, path, target))

    return imported


def main():
    total = 0
    for repo, destination in SOURCES:
        total += import_repo(repo, destination)
    print("Imported %d source/documentation files." % total)
    print("No imported program is executed by this tool.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
