"""Metrics and monitoring routes."""

from datetime import datetime
from typing import Any

import psutil
from fastapi import APIRouter

from app.core.logging_config import get_logger
from app.db import get_db

logger = get_logger(__name__)
router = APIRouter(prefix="/api", tags=["metrics"])


@router.get("/metrics")
async def get_metrics() -> dict[str, Any]:
    """Get basic system and application metrics."""
    logger.debug("Metrics endpoint called")

    # System metrics
    cpu_percent = psutil.cpu_percent(interval=0.1)
    memory = psutil.virtual_memory()
    disk = psutil.disk_usage("/")

    # Database metrics
    async with get_db() as conn:
        # Count jobs by status
        cursor = await conn.execute(
            """
            SELECT status, COUNT(*) as count
            FROM jobs
            GROUP BY status
        """
        )
        jobs_by_status = {row[0]: row[1] for row in await cursor.fetchall()}

        # Total jobs
        cursor = await conn.execute("SELECT COUNT(*) FROM jobs")
        total_jobs = (await cursor.fetchone())[0]

        # Count total datasets
        cursor = await conn.execute("SELECT COUNT(*) FROM datasets")
        total_datasets = (await cursor.fetchone())[0]

        # Count completed jobs in last 24h
        cursor = await conn.execute(
            """
            SELECT COUNT(*) FROM jobs
            WHERE status = 'completed'
            AND datetime(updated_at) > datetime('now', '-1 day')
        """
        )
        completed_last_24h = (await cursor.fetchone())[0]

        # Failed jobs in last 24h
        cursor = await conn.execute(
            """
            SELECT COUNT(*) FROM jobs
            WHERE status = 'failed'
            AND datetime(updated_at) > datetime('now', '-1 day')
        """
        )
        failed_last_24h = (await cursor.fetchone())[0]

        # Average training time for completed jobs
        cursor = await conn.execute(
            """
            SELECT AVG(
                (julianday(updated_at) - julianday(created_at)) * 24 * 60
            ) as avg_minutes
            FROM jobs
            WHERE status = 'completed'
        """
        )
        avg_training_time_minutes = (await cursor.fetchone())[0] or 0

        # Total dataset size
        cursor = await conn.execute("SELECT SUM(size_bytes) FROM datasets")
        total_dataset_size_bytes = (await cursor.fetchone())[0] or 0

    metrics = {
        "timestamp": datetime.utcnow().isoformat(),
        "system": {
            "cpu_percent": round(cpu_percent, 2),
            "memory_percent": round(memory.percent, 2),
            "memory_available_mb": round(memory.available / (1024 * 1024), 2),
            "memory_total_mb": round(memory.total / (1024 * 1024), 2),
            "disk_percent": round(disk.percent, 2),
            "disk_free_gb": round(disk.free / (1024**3), 2),
            "disk_total_gb": round(disk.total / (1024**3), 2),
        },
        "application": {
            "jobs": {
                "total": total_jobs,
                "by_status": jobs_by_status,
                "pending": jobs_by_status.get("pending", 0),
                "running": jobs_by_status.get("running", 0),
                "completed": jobs_by_status.get("completed", 0),
                "failed": jobs_by_status.get("failed", 0),
                "completed_last_24h": completed_last_24h,
                "failed_last_24h": failed_last_24h,
                "success_rate_24h": round(
                    (
                        (completed_last_24h / (completed_last_24h + failed_last_24h) * 100)
                        if (completed_last_24h + failed_last_24h) > 0
                        else 0
                    ),
                    2,
                ),
                "avg_training_time_minutes": round(avg_training_time_minutes, 2),
            },
            "datasets": {
                "total": total_datasets,
                "total_size_mb": round(total_dataset_size_bytes / (1024 * 1024), 2),
                "total_size_gb": round(total_dataset_size_bytes / (1024**3), 2),
            },
        },
    }

    logger.info(
        "Metrics collected",
        extra={
            "cpu": cpu_percent,
            "memory": memory.percent,
            "total_jobs": total_jobs,
            "total_datasets": total_datasets,
        },
    )
    return metrics


@router.get("/health/detailed")
async def detailed_health() -> dict[str, Any]:
    """Detailed health check with component status."""
    logger.debug("Detailed health check called")

    health_status = {"status": "healthy", "timestamp": datetime.utcnow().isoformat(), "components": {}}

    # Check database
    try:
        async with get_db() as conn:
            await conn.execute("SELECT 1")
        health_status["components"]["database"] = {"status": "healthy"}
    except Exception as e:
        logger.error("Database health check failed", extra={"error": str(e)})
        health_status["components"]["database"] = {"status": "unhealthy", "error": str(e)}
        health_status["status"] = "degraded"

    # Check disk space
    disk = psutil.disk_usage("/")
    disk_free_percent = (disk.free / disk.total) * 100
    if disk_free_percent < 10:
        health_status["components"]["disk"] = {"status": "warning", "free_percent": disk_free_percent}
        health_status["status"] = "degraded"
    else:
        health_status["components"]["disk"] = {"status": "healthy", "free_percent": disk_free_percent}

    # Check memory
    memory = psutil.virtual_memory()
    if memory.percent > 90:
        health_status["components"]["memory"] = {"status": "warning", "used_percent": memory.percent}
        health_status["status"] = "degraded"
    else:
        health_status["components"]["memory"] = {"status": "healthy", "used_percent": memory.percent}

    return health_status
