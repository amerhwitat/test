import tempfile
import unittest

from research_app.index import DocumentIndex


class IndexTests(unittest.TestCase):
    def test_index_deduplicates_by_content_hash(self):
        with tempfile.NamedTemporaryFile(suffix=".db") as handle:
            index = DocumentIndex(handle.name)
            first = index.add("doc.txt", "hello")
            second = index.add("doc.txt", "hello")
            self.assertEqual(first, second)
            self.assertEqual(index.search("hello")[0]["path"], "doc.txt")
            index.close()


if __name__ == "__main__":
    unittest.main()
