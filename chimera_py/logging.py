from __future__ import annotations

import logging


def configure_logging(level=logging.INFO):
    logger = logging.getLogger("chimera")
    logger.setLevel(level)
    if not logger.handlers:
        handler = logging.StreamHandler()
        handler.setFormatter(logging.Formatter("%(asctime)s %(levelname)s %(name)s: %(message)s"))
        logger.addHandler(handler)
    return logger
