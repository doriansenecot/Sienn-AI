"""Model cache management and detection"""

import logging
from pathlib import Path
from typing import Optional

logger = logging.getLogger(__name__)


def get_huggingface_cache_dir() -> Path:
    """Get the HuggingFace cache directory path"""
    # HuggingFace cache is typically at ~/.cache/huggingface/hub
    import os

    cache_home = os.environ.get("HF_HOME")
    if cache_home:
        return Path(cache_home) / "hub"

    xdg_cache = os.environ.get("XDG_CACHE_HOME")
    if xdg_cache:
        return Path(xdg_cache) / "huggingface" / "hub"

    # Default location
    home = Path.home()
    return home / ".cache" / "huggingface" / "hub"


def is_model_cached(model_name: str) -> bool:
    """
    Check if a model is already downloaded in HuggingFace cache.

    Args:
        model_name: Model identifier (e.g., "gpt2", "facebook/opt-350m")

    Returns:
        True if model is cached, False otherwise
    """
    try:
        cache_dir = get_huggingface_cache_dir()

        if not cache_dir.exists():
            logger.debug(f"Cache directory does not exist: {cache_dir}")
            return False

        # Convert model name to cache format
        # HuggingFace stores models as: models--{org}--{model}
        # e.g., "facebook/opt-350m" -> "models--facebook--opt-350m"
        # e.g., "gpt2" -> "models--gpt2"

        if "/" in model_name:
            org, model = model_name.split("/", 1)
            cache_name = f"models--{org}--{model}"
        else:
            cache_name = f"models--{model_name}"

        model_cache_path = cache_dir / cache_name

        if not model_cache_path.exists():
            logger.debug(f"Model cache not found: {model_cache_path}")
            return False

        # Check if the cache directory has content (snapshots folder with files)
        snapshots_dir = model_cache_path / "snapshots"
        if not snapshots_dir.exists():
            logger.debug(f"Snapshots directory not found: {snapshots_dir}")
            return False

        # Check if there are any snapshot folders
        snapshot_folders = list(snapshots_dir.iterdir())
        if not snapshot_folders:
            logger.debug(f"No snapshots found in: {snapshots_dir}")
            return False

        # Check if at least one snapshot has model files
        for snapshot in snapshot_folders:
            if snapshot.is_dir():
                # Look for common model files
                model_files = [
                    "pytorch_model.bin",
                    "model.safetensors",
                    "config.json",
                    "pytorch_model.bin.index.json",
                ]

                for file_name in model_files:
                    if (snapshot / file_name).exists():
                        logger.info(f"Model {model_name} is cached at: {model_cache_path}")
                        return True

        logger.debug(f"Model files not found in snapshots: {snapshots_dir}")
        return False

    except Exception as e:
        logger.error(f"Error checking cache for {model_name}: {e}", exc_info=True)
        return False


def get_model_cache_size(model_name: str) -> Optional[int]:
    """
    Get the disk size of a cached model in bytes.

    Args:
        model_name: Model identifier

    Returns:
        Size in bytes, or None if model not cached
    """
    try:
        if not is_model_cached(model_name):
            return None

        cache_dir = get_huggingface_cache_dir()

        if "/" in model_name:
            org, model = model_name.split("/", 1)
            cache_name = f"models--{org}--{model}"
        else:
            cache_name = f"models--{model_name}"

        model_cache_path = cache_dir / cache_name

        # Calculate total size
        total_size = 0
        for file_path in model_cache_path.rglob("*"):
            if file_path.is_file():
                total_size += file_path.stat().st_size

        return total_size

    except Exception as e:
        logger.error(f"Error getting cache size for {model_name}: {e}", exc_info=True)
        return None


def scan_all_cached_models() -> dict[str, dict]:
    """
    Scan the HuggingFace cache directory for all cached models.

    Returns:
        Dictionary mapping model names to their info (size, path)
    """
    try:
        cache_dir = get_huggingface_cache_dir()

        if not cache_dir.exists():
            return {}

        cached_models = {}

        # Iterate through all model directories
        for model_dir in cache_dir.iterdir():
            if not model_dir.is_dir() or not model_dir.name.startswith("models--"):
                continue

            # Extract model name from directory
            parts = model_dir.name.replace("models--", "").split("--")
            model_name = parts[0] if len(parts) == 1 else "/".join(parts)

            # Get size
            total_size = 0
            for file_path in model_dir.rglob("*"):
                if file_path.is_file():
                    total_size += file_path.stat().st_size

            cached_models[model_name] = {
                "path": str(model_dir),
                "size_bytes": total_size,
            }

        logger.info(f"Found {len(cached_models)} cached models")
        return cached_models

    except Exception as e:
        logger.error(f"Error scanning cached models: {e}", exc_info=True)
        return {}
