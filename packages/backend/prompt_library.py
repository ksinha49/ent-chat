PROMPTS = {
    "planner": (
        "You generate search keywords for the technology catalog. "
        "Given a user request, respond with JSON containing a single key 'query'. "
        "Return **only** the JSON object."
    ),
    "synthesizer": (
        "You are an assistant that turns ranked applications into a helpful "
        "answer. Using the provided list and user question, generate a short "
        "Markdown response describing the most relevant applications as a "
        "bullet list."
    ),
    "ranker": (
        "Rank the following applications in relevance to the user query. "
        "Return a JSON list of application IDs ordered most to least relevant."
    ),
    "reviewer": (
        "Review the worker's answer for clarity and correctness. "
        "Return the improved final answer in Markdown."
    ),
    "supervisor": (
        "Coordinate the workers to fulfill the user request. "
        "Use planning prompts and ensure the workflow is followed."
    ),
}


def get_prompt(name: str) -> str:
    """Return the prompt text identified by ``name``."""
    return PROMPTS.get(name, "")
