"""Dataset upload and management routes."""

from datetime import datetime

import aiosqlite
from fastapi import APIRouter, File, HTTPException, UploadFile

from app.core.logging_config import get_logger
from app.models import DatasetUploadResponse
from app.services.dataset_service import dataset_service
from app.utils.db_helpers import create_dataset_record
from app.utils.validators import validate_dataset_file

logger = get_logger(__name__)
router = APIRouter(prefix="/api", tags=["datasets"])


@router.post("/upload-dataset", response_model=DatasetUploadResponse)
async def upload_dataset(file: UploadFile = File(...)):
    """Upload a dataset file for fine-tuning."""
    logger.info("Dataset upload started", extra={"file_name": file.filename, "content_type": file.content_type})

    validate_dataset_file(file)

    try:
        metadata, preview = await dataset_service.save_upload(file)
        logger.info(
            "Dataset saved successfully", extra={"dataset_id": metadata["id"], "size_bytes": metadata["size_bytes"]}
        )
    except Exception as e:
        logger.error("Failed to process upload", extra={"file_name": file.filename, "error": str(e)}, exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to process upload: {str(e)}")

    if not await create_dataset_record(metadata):
        logger.error("Failed to store dataset metadata", extra={"dataset_id": metadata["id"]})
        raise HTTPException(status_code=500, detail="Failed to store metadata")

    logger.info("Dataset upload completed", extra={"dataset_id": metadata["id"]})
    return DatasetUploadResponse(
        dataset_id=metadata["id"],
        filename=metadata["original_filename"],
        size_bytes=metadata["size_bytes"],
        status=metadata["status"],
        preview=preview,
        created_at=datetime.fromisoformat(metadata["created_at"]),
    )


@router.get("/datasets")
async def list_datasets():
    """Get all uploaded datasets."""
    logger.info("Listing all datasets")
    
    try:
        from app.db import get_db
        
        async with get_db() as conn:
            conn.row_factory = aiosqlite.Row
            cursor = await conn.execute(
                """
                SELECT id, original_filename, size_bytes, status, created_at
                FROM datasets
                ORDER BY created_at DESC
                """
            )
            rows = await cursor.fetchall()
            
            datasets_list = [
                {
                    "id": row["id"],
                    "filename": row["original_filename"],
                    "size_bytes": row["size_bytes"],
                    "status": row["status"],
                    "created_at": row["created_at"],
                }
                for row in rows
            ]
            
            logger.info(f"Found {len(datasets_list)} datasets")
            return {"datasets": datasets_list}
            
    except Exception as e:
        logger.error("Failed to list datasets", extra={"error": str(e)}, exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to list datasets: {str(e)}")
