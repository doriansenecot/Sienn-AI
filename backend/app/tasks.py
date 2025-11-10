import asyncio
import json
import logging
from datetime import datetime
from pathlib import Path

from .celery_app import celery_app
from .core.config import settings
from .db import get_db
from .services.finetuning_service import finetuning_service

logger = logging.getLogger(__name__)


@celery_app.task(
    bind=True,
    name="app.tasks.finetune_model",
    autoretry_for=(Exception,),
    retry_backoff=True,
    retry_backoff_max=600,
    retry_jitter=True,
    max_retries=3,
)
def finetune_model(
    self,
    job_id: str,
    dataset_id: str,
    model_name: str = "gpt2",
    learning_rate: float = 2e-5,
    num_epochs: int = 3,
    batch_size: int = 4,
    max_length: int = 512,
):
    """
    Fine-tune a language model on a dataset with automatic retry on failure.

    Retry policy:
    - Max 3 retries
    - Exponential backoff with jitter
    - Max backoff: 10 minutes
    """

    async def _update_job_status(status: str, progress: float = 0.0, message: str = None):
        """Update job status in database"""
        async with get_db() as conn:
            await conn.execute(
                """
                UPDATE jobs
                SET status = ?, progress = ?, message = ?, updated_at = ?
                WHERE id = ?
                """,
                (status, progress, message, datetime.utcnow().isoformat(), job_id),
            )
            await conn.commit()

    async def _get_dataset_path():
        """Get dataset file path from database"""
        async with get_db() as conn:
            cursor = await conn.execute("SELECT file_path FROM datasets WHERE id = ?", (dataset_id,))
            row = await cursor.fetchone()
            if row:
                return row[0]
            return None

    async def _run_finetuning():
        """Main fine-tuning logic using real Transformers + PEFT"""
        try:
            # Update status to running
            await _update_job_status("running", 0.0, "Initializing fine-tuning...")

            # Get dataset path
            dataset_path = await _get_dataset_path()
            if not dataset_path:
                await _update_job_status("failed", 0.0, f"Dataset {dataset_id} not found")
                return {"status": "failed", "error": "Dataset not found"}

            logger.info(f"Starting fine-tuning job {job_id} with dataset {dataset_path}")

            # Prepare output directory
            model_output_dir = Path(f"./data/models/{job_id}")
            model_output_dir.mkdir(parents=True, exist_ok=True)

            # Progress callback for finetuning service
            async def progress_callback(progress: float, message: str):
                await _update_job_status("running", progress, message)
                logger.info(f"Job {job_id}: {progress}% - {message}")

            # Run real fine-tuning
            logger.info(f"Calling finetuning_service for job {job_id}")

            # Execute fine-tuning synchronously (it's CPU/GPU intensive)
            import functools

            metadata = await asyncio.get_event_loop().run_in_executor(
                None,
                functools.partial(
                    finetuning_service.finetune,
                    model_name=model_name,
                    dataset_path=dataset_path,
                    output_dir=str(model_output_dir),
                    learning_rate=learning_rate,
                    num_epochs=num_epochs,
                    batch_size=batch_size,
                    max_length=max_length,
                    progress_callback=lambda p, m: asyncio.run(_update_job_status("running", p, m)),
                ),
            )

            logger.info(f"Fine-tuning completed for job {job_id}")

            # Store model metadata
            metadata_to_store = {
                **metadata,
                "model_path": str(model_output_dir),
            }

            async with get_db() as conn:
                await conn.execute(
                    """
                    UPDATE jobs
                    SET meta = ?
                    WHERE id = ?
                    """,
                    (json.dumps(metadata_to_store), job_id),
                )
                await conn.commit()

            await _update_job_status("completed", 100.0, "Fine-tuning completed successfully!")

            return {"status": "completed", "job_id": job_id, "model_path": str(model_output_dir)}

        except Exception as e:
            error_msg = f"Fine-tuning failed: {str(e)}"
            logger.error(f"Job {job_id} failed: {error_msg}", exc_info=True)
            await _update_job_status("failed", 0.0, error_msg)
            return {"status": "failed", "error": error_msg}

    # Run the async function
    loop = asyncio.new_event_loop()
    asyncio.set_event_loop(loop)
    try:
        result = loop.run_until_complete(_run_finetuning())
        return result
    finally:
        loop.close()


@celery_app.task(name="app.tasks.cleanup_old_jobs")
def cleanup_old_jobs(days: int = 7):
    """
    Cleanup old completed/failed jobs and their associated files.
    This can be scheduled to run periodically (e.g., daily via celery beat).

    Args:
        days: Delete jobs older than this many days (default: 7)

    Returns:
        dict: Cleanup statistics (jobs deleted, files deleted, space freed)
    """
    import shutil
    from datetime import datetime, timedelta
    from pathlib import Path

    logger.info(f"Starting cleanup of jobs older than {days} days")

    cutoff_date = datetime.now() - timedelta(days=days)
    stats = {
        "jobs_deleted": 0,
        "files_deleted": 0,
        "space_freed_bytes": 0,
        "errors": [],
    }

    try:
        import asyncio

        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)

        async def _cleanup():
            from app.db import get_db

            async with get_db() as conn:
                # Find old completed/failed jobs
                cursor = await conn.execute(
                    """
                    SELECT id, dataset_id, status, created_at
                    FROM jobs
                    WHERE (status = 'completed' OR status = 'failed')
                      AND datetime(created_at) < datetime(?)
                    """,
                    (cutoff_date.isoformat(),),
                )
                old_jobs = await cursor.fetchall()

                for row in old_jobs:
                    job_id, dataset_id, status, created_at = row

                    try:
                        # Delete model files
                        model_path = Path(settings.models_dir) / job_id
                        if model_path.exists():
                            size = sum(f.stat().st_size for f in model_path.rglob("*") if f.is_file())
                            shutil.rmtree(model_path)
                            stats["files_deleted"] += 1
                            stats["space_freed_bytes"] += size
                            logger.info(f"Deleted model directory: {model_path} ({size / 1024 / 1024:.2f} MB)")

                        # Delete export files
                        export_path = Path(settings.export_dir) / job_id
                        if export_path.exists():
                            size = sum(f.stat().st_size for f in export_path.rglob("*") if f.is_file())
                            shutil.rmtree(export_path)
                            stats["files_deleted"] += 1
                            stats["space_freed_bytes"] += size
                            logger.info(f"Deleted export directory: {export_path} ({size / 1024 / 1024:.2f} MB)")

                        # Delete job from database
                        await conn.execute("DELETE FROM jobs WHERE id = ?", (job_id,))
                        stats["jobs_deleted"] += 1
                        logger.info(f"Deleted job {job_id} (status: {status}, created: {created_at})")

                    except Exception as e:
                        error_msg = f"Error cleaning up job {job_id}: {str(e)}"
                        logger.error(error_msg)
                        stats["errors"].append(error_msg)

                await conn.commit()

        loop.run_until_complete(_cleanup())
        loop.close()

        logger.info(
            f"Cleanup completed: {stats['jobs_deleted']} jobs deleted, "
            f"{stats['files_deleted']} file sets removed, "
            f"{stats['space_freed_bytes'] / 1024 / 1024:.2f} MB freed"
        )

        return stats

    except Exception as e:
        logger.error(f"Critical error during cleanup: {str(e)}")
        stats["errors"].append(str(e))
        return stats
