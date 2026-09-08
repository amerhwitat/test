from __future__ import annotations

import os


def safe_join(base, *parts):
    """Join paths and reject traversal outside *base*."""
    base_abs = os.path.realpath(os.path.abspath(os.fspath(base)))
    candidate = os.path.realpath(os.path.abspath(os.path.join(base_abs, *(os.fspath(p) for p in parts))))
    try:
        common = os.path.commonpath([base_abs, candidate])
    except ValueError:
        raise ValueError("path is on a different filesystem")
    if common != base_abs:
        raise ValueError("path escapes base directory")
    return candidate
