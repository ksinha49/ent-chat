import sys
from pathlib import Path

import pytest
from httpx import AsyncClient

# Ensure backend modules can be imported
BACKEND_DIR = Path(__file__).resolve().parents[1] / "packages" / "backend"
if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))

import main as backend_main  # type: ignore  # noqa: E402


@pytest.mark.anyio
async def test_read_root():
    async with AsyncClient(app=backend_main.app, base_url="http://test") as client:
        resp = await client.get("/")
    assert resp.status_code == 200
    assert resp.json() == {"status": "Backend running"}


@pytest.mark.anyio
async def test_ask_endpoint(monkeypatch):
    class DummyOrchestrator:
        async def run(self, question: str) -> str:
            return "dummy answer"

    monkeypatch.setattr(backend_main, "Orchestrator", DummyOrchestrator)
    async with AsyncClient(app=backend_main.app, base_url="http://test") as client:
        resp = await client.post("/ask", json={"question": "test"})
    assert resp.status_code == 200
    assert resp.json() == {"answer": "dummy answer"}
