import unittest
from research_app.text import normalize_text


class TextTests(unittest.TestCase):
    def test_normalize_text_is_unicode_safe_and_deterministic(self):
        value = "  \u0627\u0644\u0643\u062a\u0627\u0628  \n  \u00a0"
        self.assertEqual(normalize_text(value), "\u0627\u0644\u0643\u062a\u0627\u0628")
        self.assertEqual(normalize_text(value), normalize_text(value))


if __name__ == "__main__":
    unittest.main()
