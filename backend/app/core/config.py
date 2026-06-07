from functools import lru_cache
from typing import List

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    # Required: set in backend/.env (TiDB Cloud MySQL for local dev and production).
    DATABASE_URL: str
    # TiDB Cloud TLS CA; loaded from .env locally, from process env on Vercel.
    TIDB_CA_PEM: str = ""
    TIDB_CA_PEM_B64: str = ""
    JWT_SECRET: str = "dev-secret-change-me"
    JWT_ALGORITHM: str = "HS256"
    JWT_EXPIRE_DAYS: int = 7
    CORS_ORIGINS: str = "http://localhost:5173"
    REGISTER_CAPTCHA: str = "1234"
    HOST: str = "0.0.0.0"
    PORT: int = 8000
    DEEPSEEK_API_KEY: str = "sk-dummy-for-local-dev"
    DEEPSEEK_BASE_URL: str = "https://api.deepseek.com"
    DEEPSEEK_MODEL: str = "deepseek-chat"
    DEEPSEEK_TIMEOUT: float = 3.0
    AI_MAX_HISTORY: int = 20

    @property
    def cors_origins_list(self) -> List[str]:
        return [origin.strip() for origin in self.CORS_ORIGINS.split(",") if origin.strip()]


@lru_cache
def get_settings() -> Settings:
    return Settings()
