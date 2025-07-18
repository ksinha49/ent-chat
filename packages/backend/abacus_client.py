"""Client wrapper for the ABACUS service."""

from __future__ import annotations

from typing import Any, Dict, Optional

import requests

from env import settings


class AbacusClient:
    """HTTP client for the ABACUS recommendation service."""

    def __init__(
        self,
        base_url: Optional[str] = None,
        client_secret: Optional[str] = None,
        timeout: Optional[int] = None,
        verify_ssl: Optional[bool] = None,
    ) -> None:
        self.base_url = (base_url or settings.ABACUS_BASE_URL).rstrip("/")
        self.client_secret = client_secret or settings.ABACUS_CLIENT_SECRET
        self.timeout = timeout if timeout is not None else settings.ABACUS_TIMEOUT
        # Honor VERIFY_SSL=false to allow self-signed certificates during development
        self.verify_ssl = (
            verify_ssl
            if verify_ssl is not None
            else settings.VERIFY_SSL
        )

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

    def query_data(self, endpoint: str, params: Optional[Dict[str, Any]] = None) -> Any:
        """Fetch JSON data from the ABACUS API using OData query parameters."""

        if not self.base_url or not self.client_secret:
            raise RuntimeError("ABACUS API credentials are not configured")

        url = f"{self.base_url}/{endpoint.lstrip('/') }"
        try:
            response = requests.get(
                url,
                headers=self._headers,
                params=params or {},
                timeout=self.timeout,
                verify=self.verify_ssl,
            )
            response.raise_for_status()
            data = response.json()
            return data.get("value", data)
        except requests.RequestException as exc:  # pragma: no cover - network
            raise RuntimeError("Failed to query ABACUS service") from exc
        except ValueError as exc:  # pragma: no cover - unlikely
            raise RuntimeError("Invalid response from ABACUS service") from exc
