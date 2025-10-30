"""Model testing and inference routes."""
from datetime import datetime
from fastapi import APIRouter, HTTPException

from app.models import TestModelRequest, TestModelResponse
from app.services.model_service import model_service
from app.utils.db_helpers import get_job_metadata

router = APIRouter(prefix="/api", tags=["inference"])


@router.post("/test-model", response_model=TestModelResponse)
async def test_model(request: TestModelRequest):
    """Test a fine-tuned model with a prompt."""
    job_data = await get_job_metadata(request.job_id)
    
    if not job_data:
        raise HTTPException(
            status_code=404,
            detail=f"Job with id {request.job_id} not found"
        )
    
    status, meta, model_path = job_data
    
    if status != "completed":
        raise HTTPException(
            status_code=400,
            detail=f"Job status is '{status}', model testing is only available for completed jobs"
        )
    
    if not model_path:
        raise HTTPException(
            status_code=500,
            detail="Model path not found in job metadata"
        )
    
    if not model_service.model_exists(model_path):
        raise HTTPException(
            status_code=404,
            detail=f"Model not found at path: {model_path}"
        )
    
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
