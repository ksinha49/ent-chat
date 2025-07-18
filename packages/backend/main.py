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


@app.post("/ask")
def ask_question(request: dict[str, str]) -> dict[str, str]:
    """Run the orchestrator with the provided question."""
    question = request.get("question", "")
    orchestrator = Orchestrator()
    answer = orchestrator.run(question)
    return {"answer": answer}
