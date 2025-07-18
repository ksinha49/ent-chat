from __future__ import annotations

import json
from pathlib import Path
from typing import Dict, List


class ShortTermMemory:
    """In-memory storage of the recent conversation."""

    def __init__(self, limit: int = 5) -> None:
        self.limit = limit
        self.messages: List[Dict[str, str]] = []

    def add(self, role: str, content: str) -> None:
        self.messages.append({"role": role, "content": content})
        # Trim to the last ``limit`` messages
        if len(self.messages) > self.limit:
            self.messages = self.messages[-self.limit :]

    def context(self) -> List[Dict[str, str]]:
        return list(self.messages)


class LongTermMemory:
    """Simple file-based memory for persisting conversations."""

    def __init__(self, path: Path) -> None:
        self.path = path
        self.path.parent.mkdir(parents=True, exist_ok=True)
        self._messages: List[Dict[str, str]] = []
        self._load()

    def _load(self) -> None:
        if self.path.exists():
            try:
                with self.path.open("r", encoding="utf-8") as fh:
                    self._messages = json.load(fh)
            except Exception:
                self._messages = []

    def _save(self) -> None:
        with self.path.open("w", encoding="utf-8") as fh:
            json.dump(self._messages, fh, indent=2)

    def add(self, role: str, content: str) -> None:
        self._messages.append({"role": role, "content": content})
        self._save()

    def all_messages(self) -> List[Dict[str, str]]:
        return list(self._messages)
