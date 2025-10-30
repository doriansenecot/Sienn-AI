from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.responses import JSONResponse
from datetime import datetime

from .core.config import settings
from .db import get_db, init_db
from .services.dataset_service import dataset_service
from .models import DatasetUploadResponse

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
        raise HTTPException(status_code=500, detail=f"Failed to save file: {str(e)}")
    
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
