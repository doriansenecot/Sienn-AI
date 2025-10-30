"""Dataset upload and management routes."""
from datetime import datetime
from fastapi import APIRouter, UploadFile, File, HTTPException

from app.models import DatasetUploadResponse
from app.services.dataset_service import dataset_service
from app.utils.validators import validate_dataset_file
from app.utils.db_helpers import create_dataset_record

router = APIRouter(prefix="/api", tags=["datasets"])


@router.post("/upload-dataset", response_model=DatasetUploadResponse)
async def upload_dataset(file: UploadFile = File(...)):
    """Upload a dataset file for fine-tuning."""
    validate_dataset_file(file)
    
    try:
        metadata, preview = await dataset_service.save_upload(file)
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to process upload: {str(e)}"
        )
    
    if not await create_dataset_record(metadata):
        raise HTTPException(
            status_code=500,
            detail="Failed to store metadata"
        )
    
    return DatasetUploadResponse(
        dataset_id=metadata["id"],
        filename=metadata["original_filename"],
        size_bytes=metadata["size_bytes"],
        status=metadata["status"],
        preview=preview,
        created_at=datetime.fromisoformat(metadata["created_at"])
    )
