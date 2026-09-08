from __future__ import annotations

import unicodedata


def normalize_text(text):
    if text is None:
        return ""
    value = unicodedata.normalize("NFC", str(text)).replace("\r\n", "\n").replace("\r", "\n")
    lines = [" ".join(line.split()) for line in value.split("\n")]
    return "\n".join(line for line in lines if line).strip()
