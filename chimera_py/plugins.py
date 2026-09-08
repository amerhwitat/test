from __future__ import annotations

import importlib.util
import pkgutil


def discover_plugins(package_name):
    """Return importable module names below a package without importing them."""
    package = importlib.util.find_spec(package_name)
    if package is None or not package.submodule_search_locations:
        return []
    prefix = package_name + "."
    return sorted(prefix + item.name for item in pkgutil.iter_modules(package.submodule_search_locations))
