"""API routes for model management"""

from fastapi import APIRouter

from app.core.logging_config import get_logger
from app.services.finetuning_service import MODEL_CONFIGS
from app.services.model_cache_service import get_model_cache_size, is_model_cached

logger = get_logger(__name__)
router = APIRouter(prefix="/api/models", tags=["models"])


@router.get("/available")
async def get_available_models():
    """
    Get list of available pre-configured models with their specifications.
    Includes cache status (whether model is already downloaded).

    Returns:
        List of models with their configurations (VRAM requirements, quality, speed, cache status, etc.)
    """
    models = []
    for _model_id, config in MODEL_CONFIGS.items():
        # Check if model is cached
        is_cached = is_model_cached(config.name)
        cache_size = get_model_cache_size(config.name) if is_cached else None

        models.append(
            {
                "id": config.name,
                "name": config.display_name,
                "vram_required_gb": config.vram_required_gb,
                "quality_rating": config.quality_rating,
                "speed_rating": config.speed_rating,
                "batch_size": config.batch_size,
                "max_length": config.max_length,
                "learning_rate": config.learning_rate,
                "description": config.description,
                "is_cached": is_cached,
                "cache_size_bytes": cache_size,
            }
        )

    # Sort by VRAM requirement (smallest first)
    models.sort(key=lambda x: x["vram_required_gb"])

    logger.info(f"Returning {len(models)} models, {sum(1 for m in models if m['is_cached'])} cached")
    return {"models": models}
