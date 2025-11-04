"""Fine-tuning job management routes."""
import json
import uuid
from datetime import datetime
from fastapi import APIRouter, HTTPException

from app.db import get_db
from app.models import (
    StartFinetuningRequest,
    StartFinetuningResponse,
    TrainingStatusResponse
)
from app.tasks import finetune_model
from app.utils.db_helpers import dataset_exists, create_job_record, update_job_status

router = APIRouter(prefix="/api", tags=["jobs"])


@router.post("/start-finetuning", response_model=StartFinetuningResponse)
async def start_finetuning(request: StartFinetuningRequest):
    """Start a fine-tuning job for a dataset."""
    if not await dataset_exists(request.dataset_id):
        raise HTTPException(
            status_code=404,
            detail=f"Dataset {request.dataset_id} not found"
        )
    
    job_id = str(uuid.uuid4())
    created_at = datetime.utcnow()
    
    if not await create_job_record(job_id, request.dataset_id, created_at.isoformat()):
        raise HTTPException(
            status_code=500,
            detail="Failed to create job"
        )
    
    try:
        finetune_model.apply_async(
            args=[
                job_id,
                request.dataset_id,
                request.model_name,
                request.learning_rate,
                request.num_epochs,
                request.batch_size,
                request.max_length,
            ],
            task_id=job_id
        )
    except Exception as e:
        await update_job_status(job_id, "failed", f"Failed to submit job: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to submit job to queue: {str(e)}"
        )
    
    return StartFinetuningResponse(
        job_id=job_id,
        status="pending",
        dataset_id=request.dataset_id,
        message="Fine-tuning job submitted successfully",
        created_at=created_at
    )


@router.get("/training-status/{job_id}", response_model=TrainingStatusResponse)
async def get_training_status(job_id: str):
    """Get the status of a fine-tuning job."""
    try:
        async with get_db() as db:
            cursor = await db.execute(
                """
                SELECT id, dataset_id, status, progress, message, created_at, updated_at, meta
                FROM jobs
                WHERE id = ?
                """,
                (job_id,)
            )
            row = await cursor.fetchone()
            
            if not row:
                raise HTTPException(
                    status_code=404,
                    detail=f"Job with id {job_id} not found"
                )
            
            meta = json.loads(row[7]) if row[7] else None
            
            return TrainingStatusResponse(
                job_id=row[0],
                dataset_id=row[1],
                status=row[2],
                progress=row[3],
                message=row[4],
                created_at=row[5],
                updated_at=row[6],
                meta=meta
            )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to get training status: {str(e)}"
        )


@router.get("/jobs")
async def list_jobs():
    """List all jobs, most recent first."""
    try:
        async with get_db() as db:
            cursor = await db.execute(
                """
                SELECT id, dataset_id, status, progress, message, created_at, updated_at
                FROM jobs
                ORDER BY created_at DESC
                LIMIT 50
                """
            )
            rows = await cursor.fetchall()
            
            jobs = []
            for row in rows:
                jobs.append({
                    "job_id": row[0],
                    "dataset_id": row[1],
                    "status": row[2],
                    "progress": row[3],
                    "message": row[4],
                    "created_at": row[5],
                    "updated_at": row[6]
                })
            
            return {"jobs": jobs, "count": len(jobs)}
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to list jobs: {str(e)}"
        )
