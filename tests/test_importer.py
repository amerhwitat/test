import unittest

from tools.import_github_sources import github_path_url, safe_destination, build_manifest_entry


class ImporterTests(unittest.TestCase):
    def test_github_path_url_quotes_special_characters(self):
        url = github_path_url("amerhwitat/nlp", "folder with space/source.py")
        self.assertIn("folder%20with%20space/source.py", url)

    def test_safe_destination_rejects_escape(self):
        with self.assertRaises(ValueError):
            safe_destination("research", "../outside.py")

    def test_manifest_entry_is_machine_readable(self):
        item = build_manifest_entry("amerhwitat/nlp", "a.py", "abc", 3)
        self.assertEqual(item["repo"], "amerhwitat/nlp")
        self.assertEqual(item["blob_sha"], "abc")
        self.assertEqual(item["size"], 3)


if __name__ == "__main__":
    unittest.main()
