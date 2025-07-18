"""Client wrapper for the ABACUS service."""

from __future__ import annotations

import os
from typing import Any, Dict

import requests


class AbacusClient:
    """HTTP client for the ABACUS recommendation service."""

    def __init__(self) -> None:
        self.base_url = os.getenv("ABACUS_BASE_URL", "").rstrip("/")
        self.client_secret = os.getenv("ABACUS_CLIENT_SECRET", "")
        self.timeout = int(os.getenv("ABACUS_TIMEOUT", "15"))
        # Honor VERIFY_SSL=false to allow self-signed certificates during development
        self.verify_ssl = os.getenv("VERIFY_SSL", "true").lower() not in {
            "0",
            "false",
            "no",
        }

        self._headers = {
            "Authorization": f"Bearer {self.client_secret}",
            "Content-Type": "application/json",
        }

    # ------------------------------------------------------------------
    # Low-level HTTP helpers

    def _request(self, payload: Dict[str, Any]) -> Dict[str, Any]:
        if not self.base_url or not self.client_secret:
            raise RuntimeError("ABACUS API credentials are not configured")

        url = f"{self.base_url}/query"
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
            raise RuntimeError("Failed to call ABACUS service") from exc
        except ValueError as exc:  # pragma: no cover - unlikely
            raise RuntimeError("Invalid response from ABACUS service") from exc

    # ------------------------------------------------------------------
    # Public API used by the orchestrator

    def query(self, plan: str) -> str:
        """Send ``plan`` to the ABACUS backend and return the response text."""

        payload = {"plan": plan}
        data = self._request(payload)
        try:
            return data["response"]
        except KeyError as exc:
            raise RuntimeError(
                "Unexpected response structure from ABACUS service"
            ) from exc
