import unittest

from chimera_py.orchestrator import ChimeraRuntime
from chimera_py.jasper import JasperManager


class BootToDesktopTests(unittest.TestCase):
    def test_jasper_cannot_start_before_spitfire_completes(self):
        runtime = ChimeraRuntime()
        jasper = JasperManager(runtime)
        self.assertFalse(jasper.start())
        self.assertEqual(jasper.state, "blocked")
        self.assertNotEqual(jasper.desktop_state, "ready")

    def test_spitfire_to_jasper_to_desktop_ready(self):
        runtime = ChimeraRuntime()
        state = runtime.boot()
        self.assertTrue(state["boot"]["booted"])
        self.assertEqual(state["boot"]["progress_percent"], 100)
        self.assertEqual(state["jasper"]["state"], "running")
        self.assertEqual(state["jasper"]["desktop_state"], "ready")
        self.assertTrue(state["desktop"]["ready"])

    def test_jasper_exposes_desktop_profile_and_readiness(self):
        runtime = ChimeraRuntime()
        runtime.boot()
        status = runtime.jasper.status()
        self.assertEqual(status["manager"], "Jasper")
        self.assertEqual(status["profile"], "aurora")
        self.assertTrue(status["desktop_ready"])
        self.assertGreaterEqual(status["required_services_ready"], 1)


if __name__ == "__main__":
    unittest.main()
