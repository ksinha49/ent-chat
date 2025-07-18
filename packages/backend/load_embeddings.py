"""Generate and store vector embeddings for technology data."""

from __future__ import annotations

import json
from pathlib import Path
from typing import List, Dict

import faiss
from sentence_transformers import SentenceTransformer

DATA_FILES = [
    Path(__file__).with_name("technology_capabilities.json"),
    Path(__file__).with_name("applications.json"),
]


def load_entries() -> List[Dict[str, str]]:
    """Load technology catalog entries from JSON files."""
    entries: List[Dict[str, str]] = []
    for path in DATA_FILES:
        if path.exists():
            with path.open("r", encoding="utf-8") as fh:
                records = json.load(fh)
                if isinstance(records, list):
                    entries.extend(records)
    return entries


def build_index(texts: List[str], model_name: str = "all-MiniLM-L6-v2") -> faiss.Index:
    """Create a FAISS index from the provided texts."""
    model = SentenceTransformer(model_name)
    embeddings = model.encode(texts, convert_to_numpy=True)
    embeddings = embeddings.astype("float32")
    index = faiss.IndexFlatL2(embeddings.shape[1])
    index.add(embeddings)
    return index


def main() -> None:
    entries = load_entries()
    texts = [e.get("description", "") for e in entries]
    index = build_index(texts)

    out_dir = Path(__file__).with_name("vector_store")
    out_dir.mkdir(exist_ok=True)
    faiss.write_index(index, str(out_dir / "index.faiss"))
    with (out_dir / "metadata.json").open("w", encoding="utf-8") as fh:
        json.dump(entries, fh, indent=2)


if __name__ == "__main__":
    main()
