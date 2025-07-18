"""Coordinates the backend components."""

from __future__ import annotations

import json
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple

import faiss
from sentence_transformers import SentenceTransformer
from langchain.chains import LLMChain
from langchain.prompts import PromptTemplate
from langchain.llms.base import LLM

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


class _BedrockLLM(LLM):
    """LangChain LLM wrapper for :class:`BedrockAdapter`."""

    def __init__(self, adapter: BedrockAdapter) -> None:
        super().__init__()
        self.adapter = adapter

    @property
    def _llm_type(self) -> str:  # pragma: no cover - simple property
        return "bedrock"

    def _call(self, prompt: str, stop: Optional[List[str]] = None, **kwargs: Any) -> str:
        return self.adapter.invoke(prompt)


class Orchestrator:
    """Simple orchestrator placeholder."""

    def __init__(self) -> None:
        self.client = AbacusClient()
        self.adapter = BedrockAdapter()

        # Load catalog data and build the search indices.
        self.capabilities = self._load_capabilities()
        self._vector_model = SentenceTransformer("all-MiniLM-L6-v2")
        self.index, self._id_map = self._build_capability_index(self.capabilities)

        self.applications = self._load_applications()
        self._app_index, self._app_id_map = self._build_application_index(self.applications)

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

    # ------------------------------------------------------------------
    # Application catalog utilities

    def _load_applications(self) -> List[Dict[str, str]]:
        """Load application records from the JSON catalog."""
        path = Path(__file__).with_name("applications.json")
        if not path.exists():
            return []
        with path.open("r", encoding="utf-8") as fh:
            records = json.load(fh)
            if isinstance(records, list):
                return records
        return []

    def _build_application_index(
        self, applications: List[Dict[str, str]]
    ) -> Tuple[faiss.Index, List[str]]:
        """Create a FAISS index from application descriptions."""
        texts = [a.get("description", "") for a in applications]
        embeddings = self._vector_model.encode(texts, convert_to_numpy=True)
        embeddings = embeddings.astype("float32")
        index = faiss.IndexFlatL2(embeddings.shape[1])
        if len(embeddings):
            index.add(embeddings)
        id_map = [a.get("id", "") for a in applications]
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

    # ------------------------------------------------------------------
    # Application recommendation logic

    def recommend_applications(self, capability_id: str, query: str) -> List[Dict[str, str]]:
        """Return applications ranked for ``query`` filtered by ``capability_id``."""
        capability = next(
            (c for c in self.capabilities if c.get("id") == capability_id),
            None,
        )
        if not capability:
            return []

        capability_name = capability.get("name", "").lower()
        candidates = [
            app
            for app in self.applications
            if capability_name in " ".join(app.get("technologies", [])).lower()
            or capability_name in app.get("description", "").lower()
        ]
        if not candidates:
            candidates = self.applications

        llm = _BedrockLLM(self.adapter)
        template = (
            "Rank the following applications in relevance to the user query.\n"
            "User query: {query}\nApplications:{apps}\n"
            "Return a JSON list of application IDs ordered most to least relevant."
        )
        prompt = PromptTemplate.from_template(template)
        chain = LLMChain(llm=llm, prompt=prompt)

        app_text = "\n".join(
            f"- {a['id']}: {a.get('description', '')}" for a in candidates
        )
        try:
            result = chain.run(query=query, apps=app_text)
            ranked_ids = json.loads(result)
        except Exception:
            ranked_ids = [a["id"] for a in candidates]

        ranked = [
            next((a for a in candidates if a.get("id") == rid), None)
            for rid in ranked_ids
        ]
        return [r for r in ranked if r]
