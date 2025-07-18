import sys
from pathlib import Path
import numpy as np

BACKEND_DIR = Path(__file__).resolve().parents[1] / "packages" / "backend"
if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))

import orchestrator as orch_module  # type: ignore


def test_orchestrator_fetches_catalog(monkeypatch):
    vector_dir = BACKEND_DIR / "vector_store"
    if vector_dir.exists():
        for item in vector_dir.iterdir():
            item.unlink()
        vector_dir.rmdir()

    monkeypatch.setattr(
        orch_module.SentenceTransformer,
        "encode",
        lambda self, texts, convert_to_numpy=True: np.ones((len(texts), 1), dtype="float32"),
    )
    monkeypatch.setattr(orch_module.faiss, "write_index", lambda index, path: None)

    calls = []

    def fake_query_data(self, endpoint, params=None):
        calls.append(endpoint)
        if endpoint == "capabilities":
            return [{"id": "cap1", "name": "Cap", "category": "cat", "description": "desc"}]
        if endpoint == "applications":
            return [
                {
                    "id": "app1",
                    "name": "App",
                    "description": "desc",
                    "technologies": ["Cap"],
                }
            ]
        return []

    monkeypatch.setattr(orch_module.AbacusClient, "query_data", fake_query_data)

    orch_module.Orchestrator()

    assert "capabilities" in calls
    assert "applications" in calls

    if vector_dir.exists():
        for item in vector_dir.iterdir():
            item.unlink()
        vector_dir.rmdir()
