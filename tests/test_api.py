import sys
from pathlib import Path

from fastapi.testclient import TestClient

# Ensure backend modules can be imported
BACKEND_DIR = Path(__file__).resolve().parents[1] / "packages" / "backend"
if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))

import main as backend_main  # type: ignore  # noqa: E402


def test_read_root():
    client = TestClient(backend_main.app)
    resp = client.get("/")
    assert resp.status_code == 200
    assert resp.json() == {"status": "Backend running"}


def test_ask_endpoint(monkeypatch):
    class DummyOrchestrator:
        def run(self, question: str) -> str:
            return "dummy answer"

    monkeypatch.setattr(backend_main, "Orchestrator", DummyOrchestrator)
    client = TestClient(backend_main.app)
    resp = client.post("/ask", json={"question": "test"})
    assert resp.status_code == 200
    assert resp.json() == {"answer": "dummy answer"}
