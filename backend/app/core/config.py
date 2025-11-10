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
    minio_bucket_name: str = "sienn-ai-models"

    # Storage paths
    models_dir: Path = Path("data/models")
    datasets_dir: Path = Path("data/uploads")
    export_dir: Path = Path("data/exports")

    # Logging configuration
    log_level: str = "INFO"
    log_dir: Optional[Path] = Path("data/logs")
    enable_json_logs: bool = True
    enable_log_rotation: bool = True

    # Rate limiting configuration
    rate_limit_enabled: bool = False  # Set to True to enable
    rate_limit_requests: int = 100  # Max requests per window
    rate_limit_window: int = 60  # Time window in seconds

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


settings = Settings()
