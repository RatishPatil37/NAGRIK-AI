"""Configuration management for Nagrik AI using Pydantic Settings."""

import os
from typing import List
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    # Application Info
    APP_NAME: str = "Nagrik AI"
    APP_VERSION: str = "1.0.0"
    ENVIRONMENT: str = "development"
    TESTING: bool = False
    DEBUG: bool = False

    # Server & Port
    HOST: str = "0.0.0.0"
    PORT: int = 8000
    CORS_ORIGINS: List[str] = [
        "http://localhost:3000",
        "http://localhost:5173",
        "https://nagrik-ai.vercel.app",
        "https://nagrik-ai.onrender.com",
    ]

    # Primary & Secondary LLM Models (Google Gemini & Groq Fallback)
    GEMINI_API_KEY: str = ""
    PRIMARY_MODEL: str = "gemini-3.7-flash"
    SECONDARY_MODEL: str = "gemini-3.5-flash-lite"
    
    GROQ_API_KEY: str = ""
    FALLBACK_MODEL: str = "llama-3.3-70b-versatile"
    GROQ_WHISPER_MODEL: str = "whisper-large-v3"

    # Vector Database (Qdrant Cloud with Local Fallback)
    QDRANT_URL: str = ""
    QDRANT_API_KEY: str = ""
    QDRANT_COLLECTION: str = "municipal_knowledge"
    QDRANT_LOCAL_PATH: str = "data/qdrant_local"

    # Database & Auth (Supabase with Local SQLite Fallback)
    SUPABASE_URL: str = ""
    SUPABASE_ANON_KEY: str = ""
    SUPABASE_SERVICE_ROLE_KEY: str = ""
    SUPABASE_JWT_SECRET: str = ""
    SQLITE_DB_PATH: str = "data/nagrik_local.db"

    # Observability & Tracing (Langfuse)
    LANGFUSE_PUBLIC_KEY: str = ""
    LANGFUSE_SECRET_KEY: str = ""
    LANGFUSE_HOST: str = "https://cloud.langfuse.com"

    # Render Free-Tier Survival Limits (512MB RAM Ceiling)
    MAX_UPLOAD_SIZE_MB: int = 20
    RATE_LIMIT_ANON_RPM: int = 10
    RATE_LIMIT_AUTH_RPM: int = 30
    RATE_LIMIT_MAX_TRACKED_IPS: int = 10000
    RATE_LIMIT_WINDOW_SECONDS: int = 60

    @property
    def is_qdrant_cloud_configured(self) -> bool:
        return bool(self.QDRANT_URL and self.QDRANT_API_KEY)

    @property
    def is_supabase_configured(self) -> bool:
        return bool(self.SUPABASE_URL and self.SUPABASE_ANON_KEY)

    @property
    def is_langfuse_configured(self) -> bool:
        return bool(self.LANGFUSE_PUBLIC_KEY and self.LANGFUSE_SECRET_KEY)


settings = Settings()
