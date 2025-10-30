"""Helper functions for file validation and processing."""
from typing import List
from fastapi import UploadFile, HTTPException

ALLOWED_CONTENT_TYPES = [
    "text/csv",
    "application/json",
    "text/plain",
    "application/octet-stream"
]

ALLOWED_EXTENSIONS = [".csv", ".json", ".jsonl", ".txt"]


def validate_dataset_file(file: UploadFile) -> None:
    """
    Validate uploaded dataset file type.
    
    Args:
        file: Uploaded file object
        
    Raises:
        HTTPException: If file type is not supported
    """
    if file.content_type not in ALLOWED_CONTENT_TYPES and not any(
        file.filename.endswith(ext) for ext in ALLOWED_EXTENSIONS
    ):
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported file type: {file.content_type}. "
                   f"Allowed: {', '.join(ALLOWED_EXTENSIONS)}"
        )
