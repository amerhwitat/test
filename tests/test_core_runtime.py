import logging
import os
import tempfile
import unittest

from chimera_py.config import AppConfig
from chimera_py.jobs import Job
from chimera_py.paths import safe_join
from chimera_py.plugins import discover_plugins


class CoreRuntimeTests(unittest.TestCase):
    def test_safe_join_rejects_path_escape(self):
        with tempfile.TemporaryDirectory() as root:
            with self.assertRaises(ValueError):
                safe_join(root, "..", "escape.txt")

    def test_config_reads_environment(self):
        old = os.environ.get("CHIMERA_LOG_LEVEL")
        os.environ["CHIMERA_LOG_LEVEL"] = "DEBUG"
        try:
            config = AppConfig.from_env()
            self.assertEqual(config.log_level, "DEBUG")
            self.assertIn("log_level", config.as_dict())
        finally:
            if old is None:
                os.environ.pop("CHIMERA_LOG_LEVEL", None)
            else:
                os.environ["CHIMERA_LOG_LEVEL"] = old

    def test_job_lifecycle(self):
        job = Job("example", lambda: 42)
        self.assertEqual(job.status, "pending")
        self.assertEqual(job.run(), 42)
        self.assertEqual(job.status, "completed")
        self.assertEqual(job.result, 42)

    def test_plugin_discovery_returns_module_names(self):
        modules = discover_plugins("chimera_py")
        self.assertIn("chimera_py.config", modules)

    def test_logging_config_returns_logger(self):
        from chimera_py.logging import configure_logging
        logger = configure_logging(logging.INFO)
        self.assertTrue(hasattr(logger, "info"))


if __name__ == "__main__":
    unittest.main()
