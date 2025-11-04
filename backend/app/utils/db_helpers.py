"""Helper functions for database operations."""

import json
import logging
from typing import Optional

from app.db import get_db

logger = logging.getLogger(__name__)


async def get_job_metadata(job_id: str) -> Optional[tuple[str, dict, str]]:
    """
    Retrieve job status and metadata.

    Args:
        job_id: Job identifier

    Returns:
        Tuple of (status, metadata_dict, model_path) or None if not found
    """
    try:
        async with get_db() as db:
            cursor = await db.execute("SELECT status, meta FROM jobs WHERE id = ?", (job_id,))
            row = await cursor.fetchone()

            if not row:
                return None

            status = row[0]
            meta = json.loads(row[1]) if row[1] else {}
            model_path = meta.get("model_path", "")

            return status, meta, model_path
    except Exception as e:
        logger.error(f"Failed to retrieve job metadata: {e}")
        return None


async def dataset_exists(dataset_id: str) -> bool:
    """
    Check if a dataset exists in the database.

    Args:
        dataset_id: Dataset identifier

    Returns:
        True if dataset exists, False otherwise
    """
    try:
        async with get_db() as conn:
            cursor = await conn.execute("SELECT id FROM datasets WHERE id = ?", (dataset_id,))
            return await cursor.fetchone() is not None
    except Exception as e:
        logger.error(f"Failed to check dataset existence: {e}")
        return False


async def create_dataset_record(metadata: dict) -> bool:
    """
    Insert dataset metadata into database.

    Args:
        metadata: Dataset metadata dictionary

    Returns:
        True if successful, False otherwise
    """
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
                    metadata["updated_at"],
                ),
            )
            await conn.commit()
            return True
    except Exception as e:
        logger.error(f"Failed to create dataset record: {e}")
        return False


async def create_job_record(job_id: str, dataset_id: str, created_at: str) -> bool:
    """
    Create a new fine-tuning job record.

    Args:
        job_id: Job identifier
        dataset_id: Associated dataset identifier
        created_at: ISO format creation timestamp

    Returns:
        True if successful, False otherwise
    """
    try:
        async with get_db() as conn:
            await conn.execute(
                """
                INSERT INTO jobs (
                    id, dataset_id, status, progress, message, created_at, updated_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?)
                """,
                (job_id, dataset_id, "pending", 0.0, "Job submitted, waiting to start...", created_at, created_at),
            )
            await conn.commit()
            return True
    except Exception as e:
        logger.error(f"Failed to create job record: {e}")
        return False


async def update_job_status(job_id: str, status: str, message: str) -> bool:
    """
    Update job status and message.

    Args:
        job_id: Job identifier
        status: New status
        message: Status message

    Returns:
        True if successful, False otherwise
    """
    try:
        async with get_db() as conn:
            await conn.execute("UPDATE jobs SET status = ?, message = ? WHERE id = ?", (status, message, job_id))
            await conn.commit()
            return True
    except Exception as e:
        logger.error(f"Failed to update job status: {e}")
        return False
