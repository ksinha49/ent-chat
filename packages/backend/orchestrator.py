"""Coordinates the backend components."""

from __future__ import annotations

import json
from pathlib import Path
from typing import Dict, List, Tuple

import faiss
from sentence_transformers import SentenceTransformer

from abacus_client import AbacusClient
from bedrock_adapter import BedrockAdapter


# System prompt used to instruct the language model on the format of the
# search request object it must return.  The model should respond with a JSON
# object containing a single ``query`` field whose value is a short string of
# keywords to use for vector search.  Example response::
#
#     {"query": "object storage"}
#
planner_system_prompt = (
    "You generate search keywords for the technology catalog. "
    "Given a user request, respond with JSON containing a single key 'query'. "
    "Return **only** the JSON object."
)


class Orchestrator:
    """Simple orchestrator placeholder."""

    def __init__(self) -> None:
        self.client = AbacusClient()
        self.adapter = BedrockAdapter()

        # Load catalog data and build the search index.
        self.capabilities = self._load_capabilities()
        self._vector_model = SentenceTransformer("all-MiniLM-L6-v2")
        self.index, self._id_map = self._build_capability_index(self.capabilities)

    def _load_capabilities(self) -> List[Dict[str, str]]:
        """Load technology capabilities from the JSON catalog."""
        path = Path(__file__).with_name("technology_capabilities.json")
        if not path.exists():
            return []
        with path.open("r", encoding="utf-8") as fh:
            records = json.load(fh)
            if isinstance(records, list):
                return records
        return []

    def _build_capability_index(
        self, capabilities: List[Dict[str, str]]
    ) -> Tuple[faiss.Index, List[str]]:
        """Build a FAISS index from capability descriptions."""
        texts = [c.get("description", "") for c in capabilities]
        embeddings = self._vector_model.encode(texts, convert_to_numpy=True)
        embeddings = embeddings.astype("float32")
        index = faiss.IndexFlatL2(embeddings.shape[1])
        if len(embeddings):
            index.add(embeddings)
        id_map = [c.get("id", "") for c in capabilities]
        return index, id_map

    def run(self) -> None:
        """Run a placeholder workflow."""
        # In a real implementation this would orchestrate calls between
        # `AbacusClient` and `BedrockAdapter`.
        raise NotImplementedError("Orchestration logic not implemented yet")

    # ------------------------------------------------------------------
    # Capability recommendation logic

    def _llm_chain(self, query: str) -> str:
        """Run the query through the Bedrock LLM with the planner prompt."""
        prompt = f"{planner_system_prompt}\nUser query: {query}"
        return self.adapter.invoke(prompt)

    def recommend_capability(self, query: str) -> str:
        """Return the ID of the capability most relevant to ``query``."""
        try:
            result = self._llm_chain(query)
            search_obj = json.loads(result)
        except Exception:
            # Fall back to using the raw query if the model output cannot be parsed.
            search_obj = {"query": query}

        search_text = search_obj.get("query", query)
        embedding = self._vector_model.encode([search_text], convert_to_numpy=True)
        embedding = embedding.astype("float32")
        distances, indices = self.index.search(embedding, 1)
        if indices.size > 0 and indices[0][0] < len(self._id_map):
            return self._id_map[indices[0][0]]
        return ""
