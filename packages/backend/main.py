"""Entry point for the backend service."""

from orchestrator import Orchestrator


def main() -> None:
    """Run the orchestrator."""
    orchestrator = Orchestrator()
    orchestrator.run()


if __name__ == "__main__":
    main()
