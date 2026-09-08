from __future__ import annotations


class PdfDocument:
    def __init__(self, path, document):
        self.path = str(path)
        self._document = document

    @classmethod
    def open(cls, path):
        try:
            import fitz
        except ImportError as exc:
            raise RuntimeError(
                "PyMuPDF is optional. Install the compatible PDF dependency for this runtime."
            ) from exc
        return cls(path, fitz.open(path))

    @property
    def page_count(self):
        return len(self._document)

    @property
    def metadata(self):
        return dict(self._document.metadata or {})

    def text(self, page_number):
        return self._document[page_number - 1].get_text("text")

    def search(self, term):
        needle = str(term).casefold()
        matches = []
        for page_number in range(1, self.page_count + 1):
            text = self.text(page_number)
            if needle in text.casefold():
                matches.append({"page": page_number, "text": text})
        return matches

    def render(self, page_number, dpi=144):
        page = self._document[page_number - 1]
        matrix = page.get_pixmap(dpi=dpi)
        return matrix.tobytes("png")

    def close(self):
        self._document.close()
