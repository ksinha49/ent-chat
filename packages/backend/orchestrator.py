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

# System prompt instructing the language model how to craft the final
# conversational answer.  The model receives a ranked list of
# applications and the user's original question.  It should reply with a
# concise Markdown formatted summary mentioning the top applications.
synthesizer_system_prompt = (
    "You are an assistant that turns ranked applications into a helpful "
    "answer. Using the provided list and user question, generate a short "
    "Markdown response describing the most relevant applications as a "
    "bullet list."
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
            self._vector_model = self.__class__._vector_model
            self.index = self.__class__._index
            self.entries = self.__class__._entries
            self.capabilities = self.__class__._capabilities
            self.applications = self.__class__._applications
            self._cap_index_map = self.__class__._cap_index_map
            return

        self.client = AbacusClient()
        self.adapter = BedrockAdapter()

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
            # Fallback: load data and build the index, persisting it for later use.
            self.capabilities = self._load_capabilities()
            self.applications = self._load_applications()
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

    def run(self, query: str) -> str:
        """Run the recommendation workflow for a user ``query``."""
        capability_id = self.recommend_capability(query)
        applications = self.recommend_applications(capability_id, query)
        return self.generate_response(applications, query)

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

    def generate_response(self, applications: List[Dict[str, str]], query: str) -> str:
        """Generate a conversational response summarizing ``applications``."""
        llm = _BedrockLLM(self.adapter)
        template = (
            f"{synthesizer_system_prompt}\n"
            "User query: {query}\n"
            "Ranked applications:\n{apps}\n"
        )
        prompt = PromptTemplate.from_template(template)
        chain = LLMChain(llm=llm, prompt=prompt)

        app_text = "\n".join(
            f"- {app.get('name', app.get('id', ''))}: {app.get('description', '')}"
            for app in applications
        )
        return chain.run(query=query, apps=app_text)
