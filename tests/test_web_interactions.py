from pathlib import Path


ROOT = Path(__file__).parents[1]
APP = (ROOT / "web" / "app.js").read_text(encoding="utf-8")
CSS = (ROOT / "web" / "style.css").read_text(encoding="utf-8")


def test_web_buttons_have_delegated_click_interactions():
    assert "document.addEventListener('click'" in APP
    assert "data-app" in APP
    assert "window-controls" in APP
    assert "toggleStart(false)" in APP


def test_web_interactive_layers_accept_pointer_events():
    assert ".desktop" in CSS
    assert "pointer-events:auto" in CSS
    assert ".topbar" in CSS
    assert ".taskbar" in CSS
    assert ".window" in CSS
