import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
WEB = ROOT / "web"


def test_manifest_and_profiles_are_consistent():
    manifest = json.loads((WEB / "web_ui_manifest.json").read_text(encoding="utf-8"))
    profiles = json.loads((WEB / "desktop_profiles.json").read_text(encoding="utf-8"))
    assert manifest["renderer"]["primary"] == "three.js-webgl"
    assert manifest["security"]["arbitrary_host_shell"] is False
    assert manifest["security"]["arbitrary_host_filesystem"] is False
    ids = {p["id"] for p in profiles["profiles"]}
    assert {"aurora", "gnome", "kde-plasma", "windows-11", "windows-10"} <= ids
    assert len(ids) == len(profiles["profiles"])


def test_desktop_has_shared_surfaces():
    html = (WEB / "aurora_3d_desktop.html").read_text(encoding="utf-8")
    js = (WEB / "aurora_3d_desktop.js").read_text(encoding="utf-8")
    for token in ("terminalWindow", "helpWindow", "filesWindow", "profileMenu"):
        assert token in html
    for token in ("three.module.js", "desktop_profiles.json", "arbitrary host execution"):
        assert token in js


def test_help_commands_are_present():
    js = (WEB / "aurora_3d_desktop.js").read_text(encoding="utf-8")
    for command in ("man", "apropos", "whatis", "info", "help"):
        assert command in js


if __name__ == "__main__":
    test_manifest_and_profiles_are_consistent()
    test_desktop_has_shared_surfaces()
    test_help_commands_are_present()
    print("Web UI contract tests passed")
