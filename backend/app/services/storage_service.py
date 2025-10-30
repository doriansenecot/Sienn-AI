"""MinIO storage service for managing model and dataset uploads."""
import io
import logging
from datetime import timedelta
from pathlib import Path
from typing import Optional

from minio import Minio
from minio.error import S3Error

from app.core.config import settings

logger = logging.getLogger(__name__)


class StorageService:
    """S3-compatible storage service using MinIO."""

    BUCKETS = ("models", "datasets", "exports")

    def __init__(self):
        """Initialize MinIO client and ensure buckets exist."""
        self.client = Minio(
            settings.minio_endpoint,
            access_key=settings.minio_access_key,
            secret_key=settings.minio_secret_key,
            secure=settings.minio_secure,
        )
        self.models_bucket, self.datasets_bucket, self.exports_bucket = self.BUCKETS
        self._ensure_buckets()

    def _ensure_buckets(self) -> None:
        """Create required buckets if they don't exist."""
        for bucket_name in self.BUCKETS:
            try:
                if not self.client.bucket_exists(bucket_name):
                    self.client.make_bucket(bucket_name)
                    logger.info(f"Created bucket: {bucket_name}")
            except S3Error as e:
                logger.error(f"Failed to create bucket '{bucket_name}': {e}")
                raise

    def upload_file(
        self,
        bucket_name: str,
        object_name: str,
        file_path: Optional[Path] = None,
        data: Optional[bytes] = None,
        length: Optional[int] = None,
        content_type: str = "application/octet-stream",
    ) -> bool:
        """
        Upload a file to MinIO.
        
        Args:
            bucket_name: Target bucket
            object_name: Object name in bucket
            file_path: Local file path (if uploading from file)
            data: Binary data (if uploading from memory)
            length: Data length (required if data provided)
            content_type: MIME type
            
        Returns:
            True if successful, False otherwise
        """
        try:
            if file_path:
                self.client.fput_object(
                    bucket_name, object_name, str(file_path), content_type=content_type
                )
                logger.info(f"Uploaded file: {bucket_name}/{object_name}")
            elif data is not None:
                length = length or len(data)
                self.client.put_object(
                    bucket_name, object_name, io.BytesIO(data), length, content_type=content_type
                )
                logger.info(f"Uploaded data: {bucket_name}/{object_name} ({length} bytes)")
            else:
                raise ValueError("Must provide either file_path or data")
            
            return True
        except (S3Error, ValueError) as e:
            logger.error(f"Upload failed for '{bucket_name}/{object_name}': {e}")
            return False

    def download_file(
        self,
        bucket_name: str,
        object_name: str,
        file_path: Optional[Path] = None,
    ) -> Optional[bytes]:
        """
        Download a file from MinIO.
        
        Args:
            bucket_name: Source bucket
            object_name: Object name in bucket
            file_path: Local path to save file (optional)
            
        Returns:
            File data if file_path not provided, None otherwise
        """
        try:
            if file_path:
                self.client.fget_object(bucket_name, object_name, str(file_path))
                logger.info(f"Downloaded file: {bucket_name}/{object_name}")
                return None
            
            response = self.client.get_object(bucket_name, object_name)
            data = response.read()
            response.close()
            response.release_conn()
            logger.info(f"Downloaded data: {bucket_name}/{object_name} ({len(data)} bytes)")
            return data
        except S3Error as e:
            logger.error(f"Download failed for '{bucket_name}/{object_name}': {e}")
            return None

    def get_object_stream(self, bucket_name: str, object_name: str):
        """Get a stream for downloading an object."""
        try:
            return self.client.get_object(bucket_name, object_name)
        except S3Error as e:
            logger.error(f"Stream failed for '{bucket_name}/{object_name}': {e}")
            return None

    def delete_file(self, bucket_name: str, object_name: str) -> bool:
        """Delete a file from MinIO."""
        try:
            self.client.remove_object(bucket_name, object_name)
            logger.info(f"Deleted file: {bucket_name}/{object_name}")
            return True
        except S3Error as e:
            logger.error(f"Delete failed for '{bucket_name}/{object_name}': {e}")
            return False

    def list_objects(self, bucket_name: str, prefix: str = "") -> list[str]:
        """List objects in a bucket with optional prefix filter."""
        try:
            objects = self.client.list_objects(bucket_name, prefix=prefix, recursive=True)
            return [obj.object_name for obj in objects]
        except S3Error as e:
            logger.error(f"List failed for bucket '{bucket_name}': {e}")
            return []

    def object_exists(self, bucket_name: str, object_name: str) -> bool:
        """Check if an object exists in a bucket."""
        try:
            self.client.stat_object(bucket_name, object_name)
            return True
        except S3Error:
            return False

    def get_object_url(
        self,
        bucket_name: str,
        object_name: str,
        expires_hours: int = 24,
    ) -> Optional[str]:
        """Generate a presigned URL for downloading an object."""
        try:
            url = self.client.presigned_get_object(
                bucket_name,
                object_name,
                expires=timedelta(hours=expires_hours),
            )
            logger.info(f"Generated presigned URL for '{bucket_name}/{object_name}'")
            return url
        except S3Error as e:
            logger.error(f"URL generation failed for '{bucket_name}/{object_name}': {e}")
            return None


storage_service = StorageService()
