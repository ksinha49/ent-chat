from __future__ import annotations

import sqlite3
from pathlib import Path
from typing import Dict, List


class SQLiteMemory:
    """SQLite-backed persistent memory for conversations."""

    def __init__(self, path: Path) -> None:
        self.path = path
        self.path.parent.mkdir(parents=True, exist_ok=True)
        self.conn = sqlite3.connect(self.path)
        self._init_db()

    def _init_db(self) -> None:
        cur = self.conn.cursor()
        cur.execute(
            """
            CREATE TABLE IF NOT EXISTS messages (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                role TEXT NOT NULL,
                content TEXT NOT NULL
            )
            """
        )
        self.conn.commit()

    def add(self, role: str, content: str) -> None:
        cur = self.conn.cursor()
        cur.execute(
            "INSERT INTO messages (role, content) VALUES (?, ?)",
            (role, content),
        )
        self.conn.commit()

    def all_messages(self) -> List[Dict[str, str]]:
        cur = self.conn.cursor()
        cur.execute("SELECT role, content FROM messages ORDER BY id")
        rows = cur.fetchall()
        return [{"role": r, "content": c} for r, c in rows]
