#!/usr/bin/env python3
"""
Test script for GGUF export functionality.
This script tests the complete flow: train -> export -> verify GGUF.
"""

import asyncio
import sys
import time
from pathlib import Path

# Add backend to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from app.core.config import settings
from app.core.logging_config import setup_logging, get_logger
from app.services.export_service import ExportService
from app.db import get_db

setup_logging()
logger = get_logger(__name__)


async def test_gguf_export():
    """Test GGUF export with a completed training job."""
    logger.info("Starting GGUF export test")

    # Find a completed job
    async with get_db() as conn:
        cursor = await conn.execute(
            """
            SELECT id, dataset_id, meta
            FROM jobs
            WHERE status = 'completed'
            ORDER BY updated_at DESC
            LIMIT 1
        """
        )
        job = await cursor.fetchone()

    if not job:
        logger.error("No completed jobs found. Please train a model first.")
        return False

    job_id = job[0]
    logger.info(f"Testing GGUF export for job: {job_id}")

    # Initialize export service
    export_service = ExportService()

    # Test different quantization levels
    quantization_types = ["f16", "q4_k_m", "q8_0"]

    for quant in quantization_types:
        logger.info(f"\n{'='*60}")
        logger.info(f"Testing quantization: {quant}")
        logger.info(f"{'='*60}\n")

        start_time = time.time()

        try:
            result = export_service.export_to_gguf(job_id=job_id, quantization=quant)

            if result:
                elapsed = time.time() - start_time
                logger.info(f"✅ Export successful: {result}")
                logger.info(f"⏱️  Time taken: {elapsed:.2f}s")

                # Check file size
                if result.exists() and result.is_file():
                    size_mb = result.stat().st_size / (1024 * 1024)
                    logger.info(f"📦 File size: {size_mb:.2f} MB")
                elif result.is_dir():
                    # It's a directory (merged model)
                    total_size = sum(
                        f.stat().st_size for f in result.rglob("*") if f.is_file()
                    )
                    size_mb = total_size / (1024 * 1024)
                    logger.info(f"📦 Total size: {size_mb:.2f} MB")
            else:
                logger.warning(f"⚠️  Export returned None for {quant}")

        except Exception as e:
            logger.error(f"❌ Export failed for {quant}: {e}", exc_info=True)

        logger.info("")  # Empty line for readability

    logger.info("\n" + "=" * 60)
    logger.info("GGUF Export Test Summary")
    logger.info("=" * 60)
    logger.info(f"Job ID: {job_id}")
    logger.info(f"Models directory: {settings.models_dir}")
    logger.info(f"Export directory: {settings.export_dir}")

    # Check if llama.cpp tools are available
    import shutil

    convert_available = bool(
        shutil.which("convert.py") or shutil.which("convert-hf-to-gguf.py")
    )
    quantize_available = bool(shutil.which("quantize") or shutil.which("llama-quantize"))

    logger.info(f"\nllama.cpp Tools Status:")
    logger.info(f"  convert.py: {'✅ Found' if convert_available else '❌ Not found'}")
    logger.info(f"  quantize: {'✅ Found' if quantize_available else '❌ Not found'}")

    if not (convert_available and quantize_available):
        logger.info("\n📝 To enable full GGUF export:")
        logger.info("1. git clone https://github.com/ggerganov/llama.cpp")
        logger.info("2. cd llama.cpp && make")
        logger.info("3. Add llama.cpp to your PATH")

    return True


if __name__ == "__main__":
    asyncio.run(test_gguf_export())
