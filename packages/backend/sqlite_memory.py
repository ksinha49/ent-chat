from __future__ import annotations

import sqlite3
from pathlib import Path
from typing import Dict, List, Optional


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

    def add(self, role: str, content: str) -> int:
        """Insert a new message and return its ID."""
        cur = self.conn.cursor()
        cur.execute(
            "INSERT INTO messages (role, content) VALUES (?, ?)",
            (role, content),
        )
        self.conn.commit()
        return int(cur.lastrowid)

    def get(self, message_id: int) -> Optional[Dict[str, str]]:
        """Return a single message or ``None`` if not found."""
        cur = self.conn.cursor()
        cur.execute(
            "SELECT id, role, content FROM messages WHERE id = ?",
            (message_id,),
        )
        row = cur.fetchone()
        if row:
            mid, role, content = row
            return {"id": mid, "role": role, "content": content}
        return None

    def update(
        self,
        message_id: int,
        *,
        role: Optional[str] = None,
        content: Optional[str] = None,
    ) -> bool:
        """Update the message identified by ``message_id``."""
        if role is None and content is None:
            return False
        fields = []
        params = []
        if role is not None:
            fields.append("role = ?")
            params.append(role)
        if content is not None:
            fields.append("content = ?")
            params.append(content)
        params.append(message_id)
        cur = self.conn.cursor()
        cur.execute(
            f"UPDATE messages SET {', '.join(fields)} WHERE id = ?",
            params,
        )
        self.conn.commit()
        return cur.rowcount > 0

    def delete(self, message_id: int) -> bool:
        """Remove the message with the given ``message_id``."""
        cur = self.conn.cursor()
        cur.execute("DELETE FROM messages WHERE id = ?", (message_id,))
        self.conn.commit()
        return cur.rowcount > 0

    def all_messages(self) -> List[Dict[str, str]]:
        """Return all messages in insertion order."""
        cur = self.conn.cursor()
        cur.execute("SELECT id, role, content FROM messages ORDER BY id")
        rows = cur.fetchall()
        return [
            {"id": mid, "role": role, "content": content}
            for mid, role, content in rows
        ]
