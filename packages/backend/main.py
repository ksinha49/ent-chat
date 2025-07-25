"""FastAPI backend service entry point."""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from orchestrator import Orchestrator
from env import settings

app = FastAPI()

origins = [o.strip() for o in settings.ALLOWED_ORIGINS.split(",") if o.strip()]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
def read_root() -> dict[str, str]:
    """Health check endpoint."""
    return {"status": "Backend running"}


@app.post("/ask")
async def ask_question(request: dict[str, str]) -> dict[str, str]:
    """Run the orchestrator with the provided question."""
    question = request.get("question", "")
    orchestrator = Orchestrator()
    answer = await orchestrator.run(question)
    return {"answer": answer}
