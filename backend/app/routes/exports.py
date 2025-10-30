"""Model export and download routes."""
import io
import zipfile
from datetime import datetime
from pathlib import Path
from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse

from app.models import ExportModelRequest, ExportModelResponse
from app.services.export_service import export_service
from app.services.storage_service import storage_service
from app.utils.db_helpers import get_job_metadata

router = APIRouter(prefix="/api", tags=["exports"])


@router.get("/download-model/{job_id}")
async def download_model(job_id: str):
    """Download fine-tuned model as a ZIP archive."""
    job_data = await get_job_metadata(job_id)
    
    if not job_data:
        raise HTTPException(
            status_code=404,
            detail=f"Job with id {job_id} not found"
        )
    
    status, meta, model_path = job_data
    
    if status != "completed":
        raise HTTPException(
            status_code=400,
            detail=f"Job status is '{status}', model download is only available for completed jobs"
        )
    
    if not model_path:
        raise HTTPException(
            status_code=500,
            detail="Model path not found in job metadata"
        )
    
    model_dir = Path(model_path)
    if not model_dir.exists() or not model_dir.is_dir():
        raise HTTPException(
            status_code=404,
            detail=f"Model directory not found: {model_path}"
        )
    
    try:
        zip_buffer = io.BytesIO()
        
        with zipfile.ZipFile(zip_buffer, mode='w', compression=zipfile.ZIP_DEFLATED) as zip_file:
            for file_path in model_dir.rglob('*'):
                if file_path.is_file():
                    arcname = file_path.relative_to(model_dir)
                    zip_file.write(file_path, arcname=str(arcname))
        
        zip_buffer.seek(0)
        
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


@router.post("/export-model/{job_id}", response_model=ExportModelResponse)
async def export_model(job_id: str, request: ExportModelRequest):
    """Export a fine-tuned model to different formats (Ollama, HuggingFace, GGUF)."""
    job_data = await get_job_metadata(job_id)
    
    if not job_data:
        raise HTTPException(
            status_code=404,
            detail=f"Job with id {job_id} not found"
        )
    
    status, meta, model_path = job_data
    
    if status != "completed":
        raise HTTPException(
            status_code=400,
            detail=f"Job status is '{status}', model export is only available for completed jobs"
        )
    
    if not model_path:
        raise HTTPException(
            status_code=500,
            detail="Model path not found in job metadata"
        )
    
    model_dir = Path(model_path)
    if not model_dir.exists() or not model_dir.is_dir():
        raise HTTPException(
            status_code=404,
            detail=f"Model directory not found: {model_path}"
        )
    
    base_model = meta.get("model_name", "gpt2")
    
    try:
        export_path = None
        
        if request.format == "ollama":
            model_name = request.model_name or f"sienn-{job_id[:8]}"
            export_path = export_service.export_to_ollama(
                job_id=job_id,
                model_name=model_name,
                base_model=base_model,
                temperature=request.temperature,
                top_p=request.top_p,
                top_k=request.top_k,
            )
        elif request.format == "huggingface":
            export_path = export_service.export_to_huggingface(job_id=job_id)
        elif request.format == "gguf":
            export_path = export_service.export_to_gguf(
                job_id=job_id,
                quantization=request.quantization,
            )
        else:
            raise HTTPException(
                status_code=400,
                detail=f"Unsupported export format: {request.format}"
            )
        
        if not export_path:
            raise HTTPException(
                status_code=500,
                detail=f"Failed to export model to {request.format} format"
            )
        
        file_size = export_path.stat().st_size if export_path.exists() else None
        
        object_name = f"{job_id}/{request.format}/{export_path.name}"
        download_url = storage_service.get_object_url(
            bucket_name=storage_service.exports_bucket,
            object_name=object_name,
            expires_hours=24,
        )
        
        return ExportModelResponse(
            job_id=job_id,
            format=request.format,
            status="completed",
            message=f"Model exported successfully to {request.format} format",
            download_url=download_url,
            file_size_bytes=file_size,
            timestamp=datetime.utcnow()
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to export model: {str(e)}"
        )


@router.get("/export-formats")
async def get_export_formats():
    """Get list of supported export formats."""
    return {
        "formats": [
            {
                "name": "ollama",
                "description": "Ollama Modelfile format for local deployment",
                "supported": True,
                "parameters": ["model_name", "temperature", "top_p", "top_k"]
            },
            {
                "name": "huggingface",
                "description": "HuggingFace format (adapter + tokenizer)",
                "supported": True,
                "parameters": []
            },
            {
                "name": "gguf",
                "description": "GGUF quantized format for llama.cpp",
                "supported": False,
                "parameters": ["quantization"],
                "note": "Requires llama.cpp - coming soon"
            }
        ]
    }
