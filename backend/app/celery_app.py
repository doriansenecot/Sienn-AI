from celery import Celery
from celery.signals import after_setup_logger, after_setup_task_logger

from .core.config import settings
from .core.logging_config import setup_logging

# Create Celery app
celery_app = Celery(
    "sienn_ai_worker",
    broker=settings.redis_url,
    backend=settings.redis_url,
    include=["app.tasks"]
)


@after_setup_logger.connect
def setup_celery_logging(logger, *args, **kwargs):
    """Setup structured logging for Celery worker."""
    setup_logging(
        level=settings.log_level,
        log_dir=settings.log_dir,
        enable_json=settings.enable_json_logs,
        enable_file_rotation=settings.enable_log_rotation
    )


@after_setup_task_logger.connect
def setup_task_logger(logger, *args, **kwargs):
    """Setup structured logging for Celery tasks."""
    setup_logging(
        level=settings.log_level,
        log_dir=settings.log_dir,
        enable_json=settings.enable_json_logs,
        enable_file_rotation=settings.enable_log_rotation
    )

# Configure Celery
celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="UTC",
    enable_utc=True,
    task_track_started=True,
    task_time_limit=3600 * 12,  # 12 hours max
    result_expires=3600 * 24,  # Results expire after 24 hours
    broker_connection_retry_on_startup=True,  # Celery 6.0+ compatibility
)
