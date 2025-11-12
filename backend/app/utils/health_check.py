"""
Health check utilities for monitoring service dependencies.
"""

import logging
from typing import Any

import redis
from minio import Minio

from app.core.config import settings
from app.db import get_db

logger = logging.getLogger(__name__)


async def check_database() -> dict[str, Any]:
    """Check database connectivity and basic operations."""
    try:
        async with get_db() as conn:
            cursor = await conn.execute("SELECT 1")
            await cursor.fetchone()

            # Check if tables exist
            cursor = await conn.execute(
                "SELECT name FROM sqlite_master WHERE type='table' AND name IN ('jobs', 'datasets')"
            )
            tables = [row[0] for row in await cursor.fetchall()]

            return {
                "status": "healthy",
                "tables": tables,
                "responsive": True,
            }
    except Exception as e:
        logger.error(f"Database health check failed: {e}")
        return {
            "status": "unhealthy",
            "error": str(e),
            "responsive": False,
        }


def check_redis() -> dict[str, Any]:
    """Check Redis connectivity and basic operations."""
    try:
        r = redis.from_url(settings.redis_url, socket_connect_timeout=5)
        r.ping()
        info = r.info("memory")

        return {
            "status": "healthy",
            "responsive": True,
            "memory_used_mb": round(info["used_memory"] / (1024 * 1024), 2),
            "memory_peak_mb": round(info["used_memory_peak"] / (1024 * 1024), 2),
        }
    except Exception as e:
        logger.error(f"Redis health check failed: {e}")
        return {
            "status": "unhealthy",
            "error": str(e),
            "responsive": False,
        }


def check_minio() -> dict[str, Any]:
    """Check MinIO connectivity and access."""
    try:
        client = Minio(
            settings.minio_endpoint,
            access_key=settings.minio_access_key,
            secret_key=settings.minio_secret_key,
            secure=settings.minio_secure,
        )

        # Check if bucket exists or create it
        bucket_name = settings.minio_bucket_name
        bucket_exists = client.bucket_exists(bucket_name)

        return {
            "status": "healthy",
            "responsive": True,
            "bucket_exists": bucket_exists,
            "bucket_name": bucket_name,
        }
    except Exception as e:
        logger.error(f"MinIO health check failed: {e}")
        return {
            "status": "unhealthy",
            "error": str(e),
            "responsive": False,
        }


def check_celery_worker() -> dict[str, Any]:
    """Check if Celery workers are running."""
    try:
        from app.celery_app import celery_app

        # Get active workers
        stats = celery_app.control.inspect().stats()
        active = celery_app.control.inspect().active()

        if stats:
            worker_count = len(stats)
            active_tasks = sum(len(tasks) for tasks in (active or {}).values())

            return {
                "status": "healthy",
                "responsive": True,
                "worker_count": worker_count,
                "active_tasks": active_tasks,
            }
        else:
            return {
                "status": "degraded",
                "responsive": False,
                "worker_count": 0,
                "message": "No workers found",
            }
    except Exception as e:
        logger.error(f"Celery health check failed: {e}")
        return {
            "status": "unhealthy",
            "error": str(e),
            "responsive": False,
        }


async def check_all_services() -> dict[str, Any]:
    """Check health of all critical services."""
    checks = {
        "database": await check_database(),
        "redis": check_redis(),
        "minio": check_minio(),
        "celery_worker": check_celery_worker(),
    }

    # Determine overall status
    statuses = [check["status"] for check in checks.values()]
    if all(s == "healthy" for s in statuses):
        overall_status = "healthy"
    elif any(s == "unhealthy" for s in statuses):
        overall_status = "unhealthy"
    else:
        overall_status = "degraded"

    return {
        "status": overall_status,
        "services": checks,
    }
