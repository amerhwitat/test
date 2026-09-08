from __future__ import annotations

import hashlib
import sqlite3
from .text import normalize_text


class DocumentIndex:
    def __init__(self, database):
        self.connection = sqlite3.connect(database)
        self.connection.execute(
            "CREATE TABLE IF NOT EXISTS documents (hash TEXT PRIMARY KEY, path TEXT NOT NULL, text TEXT NOT NULL)"
        )
        self.connection.execute("CREATE INDEX IF NOT EXISTS idx_documents_path ON documents(path)")
        self.connection.commit()

    def add(self, path, text):
        normalized = normalize_text(text)
        digest = hashlib.sha256(normalized.encode("utf-8")).hexdigest()
        self.connection.execute(
            "INSERT OR IGNORE INTO documents(hash, path, text) VALUES (?, ?, ?)",
            (digest, str(path), normalized),
        )
        self.connection.commit()
        return digest

    def search(self, term):
        query = "%" + normalize_text(term) + "%"
        rows = self.connection.execute(
            "SELECT path, text FROM documents WHERE text LIKE ? ORDER BY path", (query,)
        ).fetchall()
        return [{"path": path, "text": text} for path, text in rows]

    def close(self):
        self.connection.close()
