from pydantic_settings import BaseSettings
from typing import List


class Settings(BaseSettings):
    APP_NAME: str = "Ránṣẹ́"
    APP_ENV: str = "development"

    # JWT
    SECRET_KEY: str = "change-this-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440

    # Database
    DATABASE_URL: str = "postgresql+asyncpg://ranshe:ranshe_password@localhost:5432/ranshe_db"

    # Redis
    REDIS_URL: str = "redis://localhost:6379/0"

    # Worker / Retry
    MAX_RETRY_ATTEMPTS: int = 5
    RETRY_DELAYS_SECONDS: str = "60,300,1800,7200,28800"

    # Delivery
    DELIVERY_TIMEOUT_SECONDS: int = 30
    DELIVERY_USER_AGENT: str = "Ranshe-Webhook/1.0"

    # CORS
    CORS_ORIGINS: List[str] = ["http://localhost:5173", "http://localhost:3000"]

    @property
    def retry_delays(self) -> List[int]:
        return [int(x) for x in self.RETRY_DELAYS_SECONDS.split(",")]

    class Config:
        env_file = ".env"
        extra = "ignore"


settings = Settings()
