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


class StartFinetuningRequest(BaseModel):
    """Request to start fine-tuning"""
    dataset_id: str
    model_name: str = "gpt2"
    learning_rate: float = Field(default=2e-5, gt=0, le=1e-3)
    num_epochs: int = Field(default=3, ge=1, le=20)
    batch_size: int = Field(default=4, ge=1, le=32)
    max_length: int = Field(default=512, ge=128, le=2048)


class StartFinetuningResponse(BaseModel):
    """Response after starting fine-tuning"""
    job_id: str
    status: str = "pending"
    dataset_id: str
    message: str = "Fine-tuning job submitted successfully"
    created_at: datetime


class TrainingStatusResponse(BaseModel):
    """Response for training status query"""
    job_id: str
    dataset_id: Optional[str]
    status: str
    progress: float
    message: Optional[str]
    created_at: datetime
    updated_at: datetime
    meta: Optional[dict] = None


class TestModelRequest(BaseModel):
    """Request to test a fine-tuned model"""
    job_id: str
    prompt: str = Field(..., min_length=1, max_length=2000)
    max_new_tokens: int = Field(default=100, ge=10, le=500)
    temperature: float = Field(default=0.7, ge=0.1, le=2.0)


class TestModelResponse(BaseModel):
    """Response from model testing"""
    job_id: str
    prompt: str
    generated_text: str
    model_path: str
    generation_time: float
    timestamp: datetime
