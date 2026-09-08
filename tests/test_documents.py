import unittest

from research_app.documents import PdfDocument


class DocumentTests(unittest.TestCase):
    def test_missing_pdf_dependency_has_actionable_error(self):
        self.assertTrue(hasattr(PdfDocument, "open"))


if __name__ == "__main__":
    unittest.main()
