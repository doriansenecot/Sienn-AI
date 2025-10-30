from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field


class DatasetUploadResponse(BaseModel):
    """Response model for dataset upload"""
    dataset_id: str
    filename: str
    size_bytes: int
    status: str = "uploaded"
    preview: Optional[dict] = None
    created_at: datetime


class DatasetMetadata(BaseModel):
    """Dataset metadata stored in database"""
    id: str
    filename: str
    original_filename: str
    file_path: str
    size_bytes: int
    content_type: str
    status: str = "uploaded"
    num_rows: Optional[int] = None
    num_columns: Optional[int] = None
    column_names: Optional[list[str]] = None
    created_at: datetime
    updated_at: datetime


class JobStatus(BaseModel):
    """Training job status"""
    job_id: str
    status: str  # pending, running, completed, failed
    progress: float = 0.0
    epochs_completed: Optional[int] = None
    total_epochs: Optional[int] = None
    current_loss: Optional[float] = None
    message: Optional[str] = None
    created_at: datetime
    updated_at: datetime
