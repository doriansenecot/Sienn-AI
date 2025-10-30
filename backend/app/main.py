from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.responses import JSONResponse, StreamingResponse
from datetime import datetime
import uuid
import zipfile
import io
from pathlib import Path

from .core.config import settings
from .db import get_db, init_db
from .services.dataset_service import dataset_service
from .services.model_service import model_service
from .models import (
    DatasetUploadResponse,
    DatasetMetadata,
    JobStatus,
    StartFinetuningRequest,
    StartFinetuningResponse,
    TrainingStatusResponse,
    TestModelRequest,
    TestModelResponse,
)
from .tasks import finetune_model

app = FastAPI(title="Sienn-AI API", version="0.1.0")


@app.on_event("startup")
async def startup_event():
    """Initialize database on startup"""
    await init_db()


@app.get("/health")
async def health():
    """Simple health endpoint"""
    return JSONResponse({"status": "ok", "env": settings.environment})


@app.get("/")
async def root():
    return {"message": "Sienn-AI API", "version": "0.1.0"}


@app.post("/api/upload-dataset", response_model=DatasetUploadResponse)
async def upload_dataset(file: UploadFile = File(...)):
    """
    Upload a dataset file for fine-tuning
    
    Accepts: CSV, JSON, JSONL, TXT files
    Returns: Dataset ID, metadata, and preview
    """
    # Validate file type
    allowed_types = ["text/csv", "application/json", "text/plain", "application/octet-stream"]
    if file.content_type not in allowed_types and not any(
        file.filename.endswith(ext) for ext in ['.csv', '.json', '.jsonl', '.txt']
    ):
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported file type: {file.content_type}. Allowed: CSV, JSON, JSONL, TXT"
        )
    
    # Save file and get metadata
    try:
        metadata, preview = await dataset_service.save_upload(file)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to process upload: {str(e)}")
    
    # Store metadata in database
    try:
        async with get_db() as conn:
            await conn.execute(
                """
                INSERT INTO datasets (
                    id, filename, original_filename, file_path, size_bytes,
                    content_type, status, num_rows, num_columns, column_names,
                    created_at, updated_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    metadata["id"],
                    metadata["filename"],
                    metadata["original_filename"],
                    metadata["file_path"],
                    metadata["size_bytes"],
                    metadata["content_type"],
                    metadata["status"],
                    metadata.get("num_rows"),
                    metadata.get("num_columns"),
                    metadata.get("column_names"),
                    metadata["created_at"],
                    metadata["updated_at"]
                )
            )
            await conn.commit()
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to store metadata: {str(e)}")
    
    return DatasetUploadResponse(
        dataset_id=metadata["id"],
        filename=metadata["original_filename"],
        size_bytes=metadata["size_bytes"],
        status=metadata["status"],
        preview=preview,
        created_at=datetime.fromisoformat(metadata["created_at"])
    )


@app.get("/api/training-status/{job_id}", response_model=TrainingStatusResponse)
async def get_training_status(job_id: str):
    """Get the status of a fine-tuning job"""
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
                raise HTTPException(status_code=404, detail=f"Job with id {job_id} not found")
            
            # Parse meta JSON if present
            import json
            meta = None
            if row[7]:  # meta field
                try:
                    meta = json.loads(row[7])
                except json.JSONDecodeError:
                    meta = None
            
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
        raise HTTPException(status_code=500, detail=f"Failed to get training status: {str(e)}")


@app.post("/api/start-finetuning", response_model=StartFinetuningResponse)
async def start_finetuning(request: StartFinetuningRequest):
    """
    Start a fine-tuning job for a dataset
    
    Creates a job in the database and submits it to the Celery worker queue.
    Returns the job ID for tracking progress.
    """
    # Verify dataset exists
    async with get_db() as conn:
        cursor = await conn.execute(
            "SELECT id FROM datasets WHERE id = ?",
            (request.dataset_id,)
        )
        dataset = await cursor.fetchone()
        
        if not dataset:
            raise HTTPException(
                status_code=404,
                detail=f"Dataset {request.dataset_id} not found"
            )
    
    # Generate job ID
    job_id = str(uuid.uuid4())
    created_at = datetime.utcnow()
    
    # Create job in database
    try:
        async with get_db() as conn:
            await conn.execute(
                """
                INSERT INTO jobs (
                    id, dataset_id, status, progress, message, created_at, updated_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    job_id,
                    request.dataset_id,
                    "pending",
                    0.0,
                    "Job submitted, waiting to start...",
                    created_at.isoformat(),
                    created_at.isoformat()
                )
            )
            await conn.commit()
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to create job: {str(e)}"
        )
    
    # Submit job to Celery
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
        # Update job status to failed
        async with get_db() as conn:
            await conn.execute(
                "UPDATE jobs SET status = ?, message = ? WHERE id = ?",
                ("failed", f"Failed to submit job: {str(e)}", job_id)
            )
            await conn.commit()
        
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


@app.post("/api/test-model", response_model=TestModelResponse)
async def test_model(request: TestModelRequest):
    """Test a fine-tuned model with a prompt"""
    try:
        # Verify job exists and is completed
        async with get_db() as db:
            cursor = await db.execute(
                "SELECT id, status, meta FROM jobs WHERE id = ?",
                (request.job_id,)
            )
            row = await cursor.fetchone()
            
            if not row:
                raise HTTPException(
                    status_code=404,
                    detail=f"Job with id {request.job_id} not found"
                )
            
            job_status = row[1]
            if job_status != "completed":
                raise HTTPException(
                    status_code=400,
                    detail=f"Job status is '{job_status}', model testing is only available for completed jobs"
                )
            
            # Get model path from meta
            import json
            meta = json.loads(row[2]) if row[2] else {}
            model_path = meta.get("model_path")
            
            if not model_path:
                raise HTTPException(
                    status_code=500,
                    detail="Model path not found in job metadata"
                )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to retrieve job information: {str(e)}"
        )
    
    # Check if model exists
    if not model_service.model_exists(model_path):
        raise HTTPException(
            status_code=404,
            detail=f"Model not found at path: {model_path}"
        )
    
    # Test the model
    try:
        generated_text, generation_time = await model_service.test_model(
            model_path=model_path,
            prompt=request.prompt,
            max_new_tokens=request.max_new_tokens,
            temperature=request.temperature
        )
        
        return TestModelResponse(
            job_id=request.job_id,
            prompt=request.prompt,
            generated_text=generated_text,
            model_path=model_path,
            generation_time=generation_time,
            timestamp=datetime.utcnow()
        )
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to generate text: {str(e)}"
        )


@app.get("/api/download-model/{job_id}")
async def download_model(job_id: str):
    """
    Download fine-tuned model as a ZIP archive
    
    Args:
        job_id: The job ID of the completed fine-tuning job
        
    Returns:
        ZIP file containing the fine-tuned model (adapter, tokenizer, metadata)
    """
    # Validate and get job information
    try:
        async with get_db() as db:
            cursor = await db.execute(
                "SELECT id, status, meta FROM jobs WHERE id = ?",
                (job_id,)
            )
            row = await cursor.fetchone()
            
            if not row:
                raise HTTPException(
                    status_code=404,
                    detail=f"Job with id {job_id} not found"
                )
            
            job_status = row[1]
            if job_status != "completed":
                raise HTTPException(
                    status_code=400,
                    detail=f"Job status is '{job_status}', model download is only available for completed jobs"
                )
            
            # Get model path from meta
            import json
            meta = json.loads(row[2]) if row[2] else {}
            model_path = meta.get("model_path")
            
            if not model_path:
                raise HTTPException(
                    status_code=500,
                    detail="Model path not found in job metadata"
                )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to retrieve job information: {str(e)}"
        )
    
    # Check if model directory exists
    model_dir = Path(model_path)
    if not model_dir.exists() or not model_dir.is_dir():
        raise HTTPException(
            status_code=404,
            detail=f"Model directory not found: {model_path}"
        )
    
    # Create ZIP archive in memory
    try:
        zip_buffer = io.BytesIO()
        
        with zipfile.ZipFile(zip_buffer, mode='w', compression=zipfile.ZIP_DEFLATED) as zip_file:
            # Add all files from model directory
            for file_path in model_dir.rglob('*'):
                if file_path.is_file():
                    # Get relative path for archive
                    arcname = file_path.relative_to(model_dir)
                    zip_file.write(file_path, arcname=str(arcname))
        
        # Reset buffer position
        zip_buffer.seek(0)
        
        # Return as streaming response
        return StreamingResponse(
            zip_buffer,
            media_type="application/zip",
            headers={
                "Content-Disposition": f"attachment; filename=model_{job_id}.zip"
            }
        )
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to create model archive: {str(e)}"
        )
