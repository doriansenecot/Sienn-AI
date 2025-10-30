import asyncio
import json
import logging
from datetime import datetime
from pathlib import Path
from typing import Optional

from .celery_app import celery_app
from .db import get_db
from .services.finetuning_service import finetuning_service

logger = logging.getLogger(__name__)


@celery_app.task(bind=True, name="app.tasks.finetune_model")
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
    Fine-tune a language model on a dataset
    
    This is a simplified version for demonstration.
    In production, this would use transformers + PEFT for LoRA fine-tuning.
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
                (status, progress, message, datetime.utcnow().isoformat(), job_id)
            )
            await conn.commit()
    
    async def _get_dataset_path():
        """Get dataset file path from database"""
        async with get_db() as conn:
            cursor = await conn.execute(
                "SELECT file_path FROM datasets WHERE id = ?",
                (dataset_id,)
            )
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
                )
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
                    (json.dumps(metadata_to_store), job_id)
                )
                await conn.commit()
            
            await _update_job_status("completed", 100.0, "Fine-tuning completed successfully!")
            
            return {
                "status": "completed",
                "job_id": job_id,
                "model_path": str(model_output_dir)
            }
            
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
    Cleanup old completed jobs
    This can be scheduled to run periodically
    """
    # TODO: Implement cleanup logic
    pass
