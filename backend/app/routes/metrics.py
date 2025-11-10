"""Metrics and monitoring routes."""

from datetime import datetime
from typing import Any

import psutil
from fastapi import APIRouter, Response
from prometheus_client import CONTENT_TYPE_LATEST, CollectorRegistry, Counter, Gauge, Histogram, generate_latest

from app.core.logging_config import get_logger
from app.db import get_db
from app.utils.health_check import check_all_services

logger = get_logger(__name__)
router = APIRouter(prefix="/api", tags=["metrics"])

# Prometheus metrics registry
registry = CollectorRegistry()

# Define Prometheus metrics
jobs_total = Counter("sienn_jobs_total", "Total number of jobs created", ["status"], registry=registry)
jobs_active = Gauge("sienn_jobs_active", "Number of active jobs", ["status"], registry=registry)
training_duration_seconds = Histogram(
    "sienn_training_duration_seconds", "Training duration in seconds", registry=registry
)
datasets_total = Gauge("sienn_datasets_total", "Total number of datasets", registry=registry)
dataset_size_bytes = Gauge("sienn_dataset_size_bytes_total", "Total size of datasets in bytes", registry=registry)
system_cpu_percent = Gauge("sienn_system_cpu_percent", "CPU usage percentage", registry=registry)
system_memory_percent = Gauge("sienn_system_memory_percent", "Memory usage percentage", registry=registry)
system_disk_percent = Gauge("sienn_system_disk_percent", "Disk usage percentage", registry=registry)


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


@router.get("/health/services")
async def services_health() -> dict[str, Any]:
    """
    Comprehensive health check for all services.
    Checks: Database, Redis, MinIO, Celery workers.
    """
    logger.debug("Services health check called")
    return await check_all_services()


@router.get("/metrics/prometheus")
async def prometheus_metrics() -> Response:
    """
    Expose metrics in Prometheus format.
    This endpoint can be scraped by Prometheus server.
    """
    logger.debug("Prometheus metrics endpoint called")

    try:
        # Update system metrics
        system_cpu_percent.set(psutil.cpu_percent(interval=0.1))
        memory = psutil.virtual_memory()
        system_memory_percent.set(memory.percent)
        disk = psutil.disk_usage("/")
        system_disk_percent.set(disk.percent)

        # Update application metrics from database
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

            # Update gauges for active jobs
            for status in ["pending", "running", "completed", "failed"]:
                jobs_active.labels(status=status).set(jobs_by_status.get(status, 0))

            # Total datasets
            cursor = await conn.execute("SELECT COUNT(*) FROM datasets")
            total_datasets = (await cursor.fetchone())[0]
            datasets_total.set(total_datasets)

            # Total dataset size
            cursor = await conn.execute("SELECT SUM(size_bytes) FROM datasets")
            total_size = (await cursor.fetchone())[0] or 0
            dataset_size_bytes.set(total_size)

        # Generate Prometheus format
        metrics_output = generate_latest(registry)
        return Response(content=metrics_output, media_type=CONTENT_TYPE_LATEST)

    except Exception as e:
        logger.error("Error generating Prometheus metrics", extra={"error": str(e)})
        return Response(content=f"# Error: {str(e)}\n", media_type="text/plain", status_code=500)
