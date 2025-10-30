from celery import Celery
from .core.config import settings

# Create Celery app
celery_app = Celery(
    "sienn_ai_worker",
    broker=settings.redis_url,
    backend=settings.redis_url,
    include=["backend.app.tasks"]
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
)
