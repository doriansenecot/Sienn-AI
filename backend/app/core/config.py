from pathlib import Path
from typing import Optional

from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    environment: str = "development"
    database_path: str = "data/data.db"
    redis_url: str = "redis://redis:6379/0"
    minio_endpoint: str = "minio:9000"
    minio_access_key: str = "minioadmin"
    minio_secret_key: str = "minioadmin"
    minio_secure: bool = False

    # Logging configuration
    log_level: str = "INFO"
    log_dir: Optional[Path] = Path("data/logs")
    enable_json_logs: bool = True
    enable_log_rotation: bool = True

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


settings = Settings()
