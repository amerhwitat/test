from __future__ import annotations


class Job:
    """Small synchronous job primitive suitable for GUI/CLI adapters."""

    def __init__(self, name, function):
        self.name = name
        self.function = function
        self.status = "pending"
        self.result = None
        self.error = None

    def run(self):
        self.status = "running"
        try:
            self.result = self.function()
            self.status = "completed"
            return self.result
        except Exception as exc:
            self.error = exc
            self.status = "failed"
            raise
