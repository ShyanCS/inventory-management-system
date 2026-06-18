"""
Application settings loaded from environment variables.

Uses pydantic-settings to parse and validate configuration.
All secrets come from env vars — never hardcoded.
"""
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """Application configuration sourced from environment variables."""

    # Database
    database_url: str = "postgresql+psycopg2://inventory_user:changeme@localhost:5432/inventory"

    # Application
    environment: str = "development"
    log_level: str = "INFO"
    backend_cors_origins: str = "http://localhost:5173,http://localhost:3000"

    model_config = {"env_file": ".env", "env_file_encoding": "utf-8"}


settings = Settings()
