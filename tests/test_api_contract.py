import json
import re
import threading
import unittest
from pathlib import Path
from urllib.request import urlopen

from chimera_py.api_server import serve
from chimera_py.orchestrator import ChimeraRuntime


class ApiContractTests(unittest.TestCase):
    def setUp(self):
        self.runtime = ChimeraRuntime()
        self.runtime.boot()
        self.server = serve(self.runtime, "127.0.0.1", 0)
        self.thread = threading.Thread(target=self.server.serve_forever, daemon=True)
        self.thread.start()
        self.base = f"http://127.0.0.1:{self.server.server_port}"

    def tearDown(self):
        self.server.shutdown()
        self.server.server_close()
        self.thread.join(timeout=2)

    def get(self, path):
        with urlopen(self.base + path, timeout=2) as response:
            self.assertEqual(response.status, 200)
            return json.load(response)

    def test_boot_endpoint(self):
        boot = self.get("/api/boot")
        self.assertEqual(boot["progress_percent"], 100)
        self.assertTrue(boot["desktop_gate_open"])

    def test_jasper_endpoint(self):
        jasper = self.get("/api/jasper")
        self.assertEqual(jasper["manager"], "Jasper")
        self.assertEqual(jasper["state"], "running")
        self.assertTrue(jasper["desktop_ready"])

    def test_desktop_endpoint(self):
        desktop = self.get("/api/desktop")
        self.assertTrue(desktop["ready"])
        self.assertEqual(desktop["manager"], "Jasper")


class WebInteractionContractTests(unittest.TestCase):
    ROOT = Path(__file__).resolve().parents[1]

    def read(self, name):
        return (self.ROOT / "web" / name).read_text(encoding="utf-8")

    def test_keyboard_command_dispatch_is_present(self):
        js = self.read("app.js")
        self.assertIn("function executeCommand", js)
        self.assertRegex(js, r"e\.key\s*===\s*['\"]Enter['\"]")
        self.assertIn("startSearch", js)
        self.assertIn("refresh()", js)

    def test_click_dispatch_is_delegated(self):
        js = self.read("app.js")
        self.assertIn("document.addEventListener('click'", js)
        self.assertIn("closest('.task-app')", js)
        self.assertIn("closest('.pinned button[data-app]')", js)

    def test_controls_are_keyboard_focusable(self):
        html = self.read("index.html")
        self.assertIn('id="startSearch"', html)
        self.assertIn('id="refreshButton"', html)
        self.assertIn('id="startButton"', html)


if __name__ == "__main__":
    unittest.main()
