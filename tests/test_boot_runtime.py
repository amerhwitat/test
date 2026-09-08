import unittest

from chimera_py.orchestrator import ChimeraRuntime


class BootRuntimeTests(unittest.TestCase):
    def test_full_host_boot(self):
        runtime = ChimeraRuntime()
        state = runtime.boot()
        self.assertTrue(state["boot"]["booted"])
        self.assertTrue(state["kernel"]["booted"])
        self.assertEqual(state["services"]["kore"]["state"], "ready")
        self.assertEqual(state["services"]["aurora-wayland"]["state"], "ready")
        self.assertIn("spitfire-loader", [x["stage"] for x in state["boot"]["stages"]])

    def test_aurora_mode_is_explicit_without_changing_state_contract(self):
        runtime = ChimeraRuntime()
        runtime.boot()
        session = runtime.services["aurora-wayland"]
        self.assertEqual(session.state, "ready")
        self.assertIn(session.mode, {"native", "host-fallback", "configured", "unavailable"})

    def test_tick_after_boot(self):
        runtime = ChimeraRuntime()
        runtime.boot()
        result = runtime.tick()
        self.assertGreaterEqual(result["ticks"], 1)


if __name__ == "__main__":
    unittest.main()
