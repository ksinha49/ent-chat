"""Coordinates the backend components."""

from abacus_client import AbacusClient
from bedrock_adapter import BedrockAdapter


class Orchestrator:
    """Simple orchestrator placeholder."""

    def __init__(self) -> None:
        self.client = AbacusClient()
        self.adapter = BedrockAdapter()

    def run(self) -> None:
        """Run a placeholder workflow."""
        # In a real implementation this would orchestrate calls between
        # `AbacusClient` and `BedrockAdapter`.
        raise NotImplementedError("Orchestration logic not implemented yet")
