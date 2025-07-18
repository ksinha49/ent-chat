"""FastAPI backend service entry point."""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from orchestrator import Orchestrator

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
def read_root() -> dict[str, str]:
    """Health check endpoint."""
    return {"status": "Backend running"}


@app.post("/run")
def run_orchestration() -> dict[str, str]:
    """Trigger the orchestrator workflow."""
    orchestrator = Orchestrator()
    orchestrator.run()
    return {"detail": "Orchestration started"}
