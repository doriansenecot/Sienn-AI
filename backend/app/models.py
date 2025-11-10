from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict, Field


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

    model_config = ConfigDict(protected_namespaces=())

    dataset_id: str
    model_name: str = "gpt2"  # Model ID (gpt2, gpt2-medium, gpt2-large, distilgpt2)
    learning_rate: Optional[float] = Field(default=None, gt=0, le=1e-3)  # None = use model default
    num_epochs: int = Field(default=5, ge=1, le=20)
    batch_size: Optional[int] = Field(default=None, ge=1, le=32)  # None = use model default
    max_length: Optional[int] = Field(default=None, ge=128, le=2048)  # None = use model default


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
    top_p: float = Field(default=0.95, ge=0.1, le=1.0)
    repetition_penalty: float = Field(default=1.2, ge=1.0, le=2.0)
    do_sample: bool = Field(default=True)


class TestModelResponse(BaseModel):
    """Response from model testing"""

    model_config = ConfigDict(protected_namespaces=())

    job_id: str
    prompt: str
    generated_text: str
    model_path: str
    generation_time: float
    timestamp: datetime


class ExportModelRequest(BaseModel):
    """Request to export a model"""

    model_config = ConfigDict(protected_namespaces=())

    format: str = Field(..., pattern="^(ollama|huggingface|gguf)$")
    model_name: Optional[str] = Field(default=None, min_length=1, max_length=100)
    temperature: float = Field(default=0.7, ge=0.1, le=2.0)
    top_p: float = Field(default=0.9, ge=0.0, le=1.0)
    top_k: int = Field(default=40, ge=1, le=100)
    quantization: str = Field(default="q4_k_m", pattern="^(q4_k_m|q5_k_m|q8_0|f16|f32)$")


class ExportModelResponse(BaseModel):
    """Response from model export"""

    job_id: str
    format: str
    status: str
    message: str
    download_url: Optional[str] = None
    file_size_bytes: Optional[int] = None
    timestamp: datetime
