"""Adapter for integrating with an OpenAI-compatible Bedrock endpoint."""

from __future__ import annotations

import os
from typing import Any, Dict, List

import requests


class BedrockAdapter:
    """HTTP adapter for AWS Bedrock using the OpenAI chat format."""

    def __init__(self) -> None:
        self.api_base = os.getenv("BEDROCK_API_BASE", "").rstrip("/")
        self.api_key = os.getenv("BEDROCK_API_KEY", "")
        self.model_id = os.getenv("BEDROCK_MODEL_ID", "")
        self.timeout = int(os.getenv("BEDROCK_TIMEOUT", "15"))
        self.max_tokens = int(os.getenv("BEDROCK_MAX_TOKENS", "2048"))
        self.temperature = float(os.getenv("BEDROCK_TEMPERATURE", "0.7"))
        # Honor VERIFY_SSL=false to allow self-signed certificates during development
        self.verify_ssl = os.getenv("VERIFY_SSL", "true").lower() not in {
            "0",
            "false",
            "no",
        }

        self._headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
        }

    # ------------------------------------------------------------------
    # Low-level HTTP helpers

    def _request(self, payload: Dict[str, Any]) -> Dict[str, Any]:
        if not self.api_base or not self.api_key:
            raise RuntimeError("Bedrock API credentials are not configured")

        url = f"{self.api_base}/chat/completions"
        try:
            response = requests.post(
                url,
                headers=self._headers,
                json=payload,
                timeout=self.timeout,
                verify=self.verify_ssl,
            )
            response.raise_for_status()
            return response.json()
        except requests.RequestException as exc:  # pragma: no cover - network
            raise RuntimeError("Failed to call Bedrock API") from exc
        except ValueError as exc:  # pragma: no cover - unlikely
            raise RuntimeError("Invalid response from Bedrock API") from exc

    # ------------------------------------------------------------------
    # Public API used by the orchestrator

    def invoke(self, prompt: str) -> str:
        """Send ``prompt`` and return the model's completion text."""

        messages: List[Dict[str, str]] = [{"role": "user", "content": prompt}]
        payload = {
            "model": self.model_id,
            "messages": messages,
            "max_tokens": self.max_tokens,
            "temperature": self.temperature,
        }

        data = self._request(payload)
        try:
            return data["choices"][0]["message"]["content"]
        except (KeyError, IndexError) as exc:
            raise RuntimeError(
                "Unexpected response structure from Bedrock API"
            ) from exc
