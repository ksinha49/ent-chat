from __future__ import annotations

from dataclasses import dataclass
import os


@dataclass
class Settings:
    """Application configuration loaded from environment variables."""

    # Bedrock
    BEDROCK_API_BASE: str = os.getenv("BEDROCK_API_BASE", "").rstrip("/")
    BEDROCK_API_KEY: str = os.getenv("BEDROCK_API_KEY", "")
    BEDROCK_MODEL_ID: str = os.getenv("BEDROCK_MODEL_ID", "")
    BEDROCK_TIMEOUT: int = int(os.getenv("BEDROCK_TIMEOUT", "15"))
    BEDROCK_MAX_TOKENS: int = int(os.getenv("BEDROCK_MAX_TOKENS", "2048"))
    BEDROCK_TEMPERATURE: float = float(os.getenv("BEDROCK_TEMPERATURE", "0.7"))

    # ABACUS
    ABACUS_BASE_URL: str = os.getenv("ABACUS_BASE_URL", "").rstrip("/")
    ABACUS_CLIENT_SECRET: str = os.getenv("ABACUS_CLIENT_SECRET", "")
    ABACUS_TIMEOUT: int = int(os.getenv("ABACUS_TIMEOUT", "15"))

    # Misc
    VERIFY_SSL: bool = os.getenv("VERIFY_SSL", "true").lower() not in {"0", "false", "no"}

    # FastAPI
    ALLOWED_ORIGINS: str = os.getenv("ALLOWED_ORIGINS", "http://localhost:3000")

    # UI
    APP_NAME: str = os.getenv("APP_NAME", "AskABACUS")
    APP_LOGO: str = os.getenv("APP_LOGO", "/images/ameritas-logo.png")


settings = Settings()
