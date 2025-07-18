"""Coordinates the backend components."""

from __future__ import annotations

import json
from pathlib import Path
from typing import Dict, List, Optional, Tuple

import faiss
from sentence_transformers import SentenceTransformer

from abacus_client import AbacusClient
from bedrock_adapter import BedrockAdapter
from prompt_library import get_prompt
from memory import LongTermMemory, ShortTermMemory


# System prompt used to instruct the language model on the format of the
# search request object it must return.  The model should respond with a JSON
# object containing a single ``query`` field whose value is a short string of
# keywords to use for vector search.  Example response::
#
#     {"query": "object storage"}
#


class Orchestrator:
    """Simple orchestrator placeholder using a Singleton pattern."""

    _instance: Optional["Orchestrator"] = None
    _initialized = False

    _vector_model: Optional[SentenceTransformer] = None
    _index: Optional[faiss.Index] = None
    _entries: List[Dict[str, str]] = []
    _capabilities: List[Dict[str, str]] = []
    _applications: List[Dict[str, str]] = []
    _cap_index_map: Dict[int, str] = {}

    def __new__(cls) -> "Orchestrator":
        if cls._instance is None:
            cls._instance = super().__new__(cls)
        return cls._instance

    def __init__(self) -> None:
        if self.__class__._initialized:
            # Share the already-loaded resources with the new instance
            self.client = AbacusClient()
            self.adapter = BedrockAdapter()
            self.short_memory = ShortTermMemory()
            self.long_memory = LongTermMemory(
                Path(__file__).with_name("memory") / "long_term.json"
            )
            self._vector_model = self.__class__._vector_model
            self.index = self.__class__._index
            self.entries = self.__class__._entries
            self.capabilities = self.__class__._capabilities
            self.applications = self.__class__._applications
            self._cap_index_map = self.__class__._cap_index_map
            return

        self.client = AbacusClient()
        self.adapter = BedrockAdapter()
        self.short_memory = ShortTermMemory()
        self.long_memory = LongTermMemory(
            Path(__file__).with_name("memory") / "long_term.json"
        )

        if self.__class__._vector_model is None:
            self.__class__._vector_model = SentenceTransformer("all-MiniLM-L6-v2")
        self._vector_model = self.__class__._vector_model

        vector_dir = Path(__file__).with_name("vector_store")
        index_path = vector_dir / "index.faiss"
        meta_path = vector_dir / "metadata.json"

        index_loaded = False
        if index_path.exists() and meta_path.exists():
            try:
                if self.__class__._index is None:
                    self.__class__._index = faiss.read_index(str(index_path))
                    with meta_path.open("r", encoding="utf-8") as fh:
                        entries = json.load(fh)
                        if not isinstance(entries, list):
                            entries = []
                    self.__class__._entries = entries
                    self.__class__._capabilities = [e for e in entries if "category" in e]
                    self.__class__._applications = [e for e in entries if "technologies" in e]
                    self.__class__._cap_index_map = {
                        i: entries[i].get("id", "")
                        for i, e in enumerate(entries)
                        if "category" in e
                    }
                self.index = self.__class__._index
                self.entries = self.__class__._entries
                self.capabilities = self.__class__._capabilities
                self.applications = self.__class__._applications
                self._cap_index_map = self.__class__._cap_index_map
                index_loaded = True
            except Exception as exc:  # pragma: no cover - start-up fallback
                print(f"Failed to load vector store: {exc}. Rebuilding index.")

        if not index_loaded:
            # Fallback: fetch data and build the index, persisting it for later use.
            self.capabilities = self.client.query_data("capabilities")
            self.applications = self.client.query_data("applications")
            texts = [
                e.get("description", "")
                for e in self.capabilities + self.applications
            ]
            if not texts:
                raise RuntimeError(
                    "No catalog data available to build vector store."
                )
            embeddings = self._vector_model.encode(texts, convert_to_numpy=True)
            embeddings = embeddings.astype("float32")
            self.index = faiss.IndexFlatL2(embeddings.shape[1])
            if len(embeddings):
                self.index.add(embeddings)
            self.entries = self.capabilities + self.applications
            self._cap_index_map = {
                i: self.capabilities[i].get("id", "")
                for i in range(len(self.capabilities))
            }
            vector_dir.mkdir(exist_ok=True)
            faiss.write_index(self.index, str(index_path))
            with meta_path.open("w", encoding="utf-8") as fh:
                json.dump(self.entries, fh, indent=2)

            self.__class__._index = self.index
            self.__class__._entries = self.entries
            self.__class__._capabilities = self.capabilities
            self.__class__._applications = self.applications
        self.__class__._cap_index_map = self._cap_index_map

        self.__class__._initialized = True

    # ------------------------------------------------------------------
    # Low-level LLM helper

    def _call_llm(self, system_prompt: str, user_prompt: str) -> str:
        """Send formatted messages to the Bedrock adapter."""
        messages = [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt},
        ]
        data = self.adapter.create(self.adapter.model_id, messages)
        try:
            return data["choices"][0]["message"]["content"]
        except (KeyError, IndexError) as exc:
            raise RuntimeError("Unexpected response structure from Bedrock API") from exc

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

    def run(self, query: str) -> str:
        """Run the recommendation workflow for a user ``query``."""
        self.short_memory.add("user", query)
        capability_id = self.recommend_capability(query)
        applications = self.recommend_applications(capability_id, query)
        draft = self.generate_response(applications, query)
        final = self._review_answer(draft)
        self.short_memory.add("assistant", final)
        self.long_memory.add("user", query)
        self.long_memory.add("assistant", final)
        return final

    # ------------------------------------------------------------------
    # Capability recommendation logic

    def _llm_chain(self, query: str) -> str:
        """Run the query through the Bedrock LLM with the planner prompt."""
        user_prompt = f"User query: {query}"
        return self._call_llm(get_prompt("planner"), user_prompt)

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
        k = min(len(self.entries), 5)
        distances, indices = self.index.search(embedding, k)
        for idx in indices[0]:
            if idx in self._cap_index_map:
                return self._cap_index_map[idx]
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

        app_text = "\n".join(
            f"- {a['id']}: {a.get('description', '')}" for a in candidates
        )
        user_prompt = f"User query: {query}\nApplications:\n{app_text}"
        try:
            result = self._call_llm(get_prompt("ranker"), user_prompt)
            ranked_ids = json.loads(result)
        except Exception:
            ranked_ids = [a["id"] for a in candidates]

        ranked = [
            next((a for a in candidates if a.get("id") == rid), None)
            for rid in ranked_ids
        ]
        return [r for r in ranked if r]

    def generate_response(self, applications: List[Dict[str, str]], query: str) -> str:
        """Generate a conversational response summarizing ``applications``."""
        app_text = "\n".join(
            f"- {app.get('name', app.get('id', ''))}: {app.get('description', '')}"
            for app in applications
        )
        user_prompt = f"User query: {query}\nRanked applications:\n{app_text}"
        return self._call_llm(get_prompt("synthesizer"), user_prompt)

    def _review_answer(self, answer: str) -> str:
        """Run the reviewer agent to polish the final answer."""
        review_prompt = f"Answer to review:\n{answer}"
        return self._call_llm(get_prompt("reviewer"), review_prompt)
