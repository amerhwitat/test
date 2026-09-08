import io
import unittest
from contextlib import redirect_stdout

from research_app.cli import main


class CliTests(unittest.TestCase):
    def test_info_command_reports_runtime(self):
        output = io.StringIO()
        with redirect_stdout(output):
            code = main(["info"])
        self.assertEqual(code, 0)
        self.assertIn("Chimera II", output.getvalue())

    def test_source_audit_command_reports_layout(self):
        output = io.StringIO()
        with redirect_stdout(output):
            code = main(["source", "audit"])
        self.assertEqual(code, 0)
        self.assertIn("security_research", output.getvalue())


if __name__ == "__main__":
    unittest.main()
