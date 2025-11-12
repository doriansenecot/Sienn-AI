"""
File validation utilities for security and integrity checks.
"""

import hashlib
from pathlib import Path
from typing import Optional

import magic

from app.core.logging_config import get_logger

logger = get_logger(__name__)

# Allowed file extensions and MIME types
ALLOWED_EXTENSIONS = {".csv", ".json", ".jsonl", ".txt"}
ALLOWED_MIME_TYPES = {
    "text/csv",
    "application/json",
    "text/plain",
    "application/x-jsonlines",
}

# Maximum file sizes (in bytes)
MAX_FILE_SIZE = 500 * 1024 * 1024  # 500 MB
MAX_FILE_SIZE_WARNING = 100 * 1024 * 1024  # 100 MB (warn above this)


def validate_file_extension(filename: str) -> bool:
    """
    Validate file extension.

    Args:
        filename: Name of the file

    Returns:
        True if extension is allowed, False otherwise
    """
    ext = Path(filename).suffix.lower()
    return ext in ALLOWED_EXTENSIONS


def validate_file_size(file_size: int) -> tuple[bool, Optional[str]]:
    """
    Validate file size.

    Args:
        file_size: Size of file in bytes

    Returns:
        Tuple of (is_valid, message)
    """
    if file_size > MAX_FILE_SIZE:
        return False, f"File too large. Maximum size: {MAX_FILE_SIZE / (1024**2):.0f} MB"

    if file_size > MAX_FILE_SIZE_WARNING:
        logger.warning(
            f"Large file upload: {file_size / (1024**2):.2f} MB",
            extra={"file_size_bytes": file_size},
        )

    if file_size == 0:
        return False, "File is empty"

    return True, None


def validate_mime_type(file_path: Path) -> tuple[bool, Optional[str], Optional[str]]:
    """
    Validate MIME type using python-magic.

    Args:
        file_path: Path to the file

    Returns:
        Tuple of (is_valid, mime_type, error_message)
    """
    try:
        mime = magic.Magic(mime=True)
        mime_type = mime.from_file(str(file_path))

        # Some variations to handle
        mime_normalized = mime_type.lower()

        # Check if MIME type is allowed
        is_allowed = any(allowed in mime_normalized for allowed in ["text/", "application/json", "application/csv"])

        if not is_allowed:
            return False, mime_type, f"Invalid file type: {mime_type}"

        return True, mime_type, None

    except Exception as e:
        logger.error(f"MIME type validation error: {e}")
        return False, None, f"Could not determine file type: {str(e)}"


def compute_file_hash(file_path: Path, algorithm: str = "sha256") -> str:
    """
    Compute hash of file for integrity checking.

    Args:
        file_path: Path to the file
        algorithm: Hash algorithm (sha256, md5, etc.)

    Returns:
        Hex digest of the file hash
    """
    hash_func = hashlib.new(algorithm)

    with open(file_path, "rb") as f:
        for chunk in iter(lambda: f.read(8192), b""):
            hash_func.update(chunk)

    return hash_func.hexdigest()


def sanitize_filename(filename: str, max_length: int = 255) -> str:
    """
    Sanitize filename to prevent path traversal and other attacks.

    Args:
        filename: Original filename
        max_length: Maximum length for filename

    Returns:
        Sanitized filename
    """
    # Remove path separators
    filename = Path(filename).name

    # Remove or replace dangerous characters
    dangerous_chars = ["<", ">", ":", '"', "/", "\\", "|", "?", "*", "\x00"]
    for char in dangerous_chars:
        filename = filename.replace(char, "_")

    # Remove leading/trailing dots and spaces
    filename = filename.strip(". ")

    # Truncate if too long
    if len(filename) > max_length:
        name_part = Path(filename).stem[: max_length - 10]
        ext = Path(filename).suffix
        filename = name_part + ext

    return filename


def validate_dataset_file(file_path: Path, filename: str) -> tuple[bool, Optional[str]]:
    """
    Comprehensive validation of dataset file.

    Args:
        file_path: Path to the uploaded file
        filename: Original filename

    Returns:
        Tuple of (is_valid, error_message)
    """
    # Check extension
    if not validate_file_extension(filename):
        return False, f"Invalid file extension. Allowed: {', '.join(ALLOWED_EXTENSIONS)}"

    # Check file size
    file_size = file_path.stat().st_size
    is_valid_size, size_error = validate_file_size(file_size)
    if not is_valid_size:
        return False, size_error

    # Check MIME type
    is_valid_mime, mime_type, mime_error = validate_mime_type(file_path)
    if not is_valid_mime:
        return False, mime_error

    logger.info(
        "File validation passed",
        extra={
            "filename": filename,
            "size_bytes": file_size,
            "mime_type": mime_type,
        },
    )

    return True, None
