from pydantic_settings import BaseSettings
from typing import List


class Settings(BaseSettings):
    APP_NAME: str = "Ránṣẹ́"
    APP_ENV: str = "development"

    SECRET_KEY: str = "change-this-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440

    DATABASE_URL: str = "postgresql+asyncpg://ranshe:ranshe_password@localhost:5432/ranshe_db"
    REDIS_URL: str = "redis://localhost:6379/0"

    MAX_RETRY_ATTEMPTS: int = 5
    RETRY_DELAYS_SECONDS: str = "60,300,1800,7200,28800"

    DELIVERY_TIMEOUT_SECONDS: int = 30
    DELIVERY_USER_AGENT: str = "Ranshe-Webhook/1.0"

    CORS_ORIGINS: str = "http://localhost:5173,http://localhost:3000"

    @property
    def cors_origins_list(self) -> List[str]:
        return [o.strip() for o in self.CORS_ORIGINS.split(",")]

    @property
    def retry_delays(self) -> List[int]:
        return [int(x) for x in self.RETRY_DELAYS_SECONDS.split(",")]

    class Config:
        env_file = ".env"
        extra = "ignore"


settings = Settings()
