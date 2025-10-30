import os
import uuid
import json
from pathlib import Path
from datetime import datetime
from typing import Optional
import aiofiles
from fastapi import UploadFile

from ..core.config import settings


class DatasetService:
    """Service for managing dataset uploads and storage"""
    
    def __init__(self):
        self.upload_dir = Path("./data/uploads")
        self.upload_dir.mkdir(parents=True, exist_ok=True)
    
    async def save_upload(self, file: UploadFile) -> dict:
        """Save uploaded file and return metadata"""
        # Generate unique ID and filename
        dataset_id = str(uuid.uuid4())
        file_extension = Path(file.filename).suffix
        safe_filename = f"{dataset_id}{file_extension}"
        file_path = self.upload_dir / safe_filename
        
        # Save file
        size_bytes = 0
        async with aiofiles.open(file_path, 'wb') as f:
            while chunk := await file.read(1024 * 1024):  # Read 1MB at a time
                size_bytes += len(chunk)
                await f.write(chunk)
        
        # Generate preview
        preview = await self._generate_preview(file_path, file.content_type)
        
        metadata = {
            "id": dataset_id,
            "filename": safe_filename,
            "original_filename": file.filename,
            "file_path": str(file_path),
            "size_bytes": size_bytes,
            "content_type": file.content_type or "application/octet-stream",
            "status": "uploaded",
            "num_rows": preview.get("num_rows"),
            "num_columns": preview.get("num_columns"),
            "column_names": json.dumps(preview.get("column_names")) if preview.get("column_names") else None,
            "created_at": datetime.utcnow().isoformat(),
            "updated_at": datetime.utcnow().isoformat()
        }
        
        return metadata, preview
    
    async def _generate_preview(self, file_path: Path, content_type: Optional[str]) -> dict:
        """Generate a preview of the dataset"""
        preview = {}
        
        # Handle different file types
        if content_type and "json" in content_type:
            preview = await self._preview_json(file_path)
        elif content_type and "csv" in content_type:
            preview = await self._preview_csv(file_path)
        elif str(file_path).endswith('.jsonl'):
            preview = await self._preview_jsonl(file_path)
        else:
            # Generic text preview
            preview = await self._preview_text(file_path)
        
        return preview
    
    async def _preview_json(self, file_path: Path) -> dict:
        """Preview JSON file"""
        try:
            async with aiofiles.open(file_path, 'r', encoding='utf-8') as f:
                content = await f.read(10000)  # Read first 10KB
                data = json.loads(content)
                
                if isinstance(data, list):
                    return {
                        "type": "json_array",
                        "num_rows": len(data),
                        "sample": data[:3] if len(data) > 0 else []
                    }
                elif isinstance(data, dict):
                    return {
                        "type": "json_object",
                        "keys": list(data.keys())[:10],
                        "sample": {k: data[k] for k in list(data.keys())[:3]}
                    }
        except Exception as e:
            return {"error": f"Failed to preview JSON: {str(e)}"}
        
        return {}
    
    async def _preview_jsonl(self, file_path: Path) -> dict:
        """Preview JSONL file"""
        try:
            lines = []
            async with aiofiles.open(file_path, 'r', encoding='utf-8') as f:
                for i in range(5):  # Read first 5 lines
                    line = await f.readline()
                    if not line:
                        break
                    lines.append(json.loads(line.strip()))
            
            return {
                "type": "jsonl",
                "num_rows": len(lines),
                "sample": lines[:3]
            }
        except Exception as e:
            return {"error": f"Failed to preview JSONL: {str(e)}"}
        
        return {}
    
    async def _preview_csv(self, file_path: Path) -> dict:
        """Preview CSV file"""
        try:
            lines = []
            async with aiofiles.open(file_path, 'r', encoding='utf-8') as f:
                for i in range(6):  # Header + 5 rows
                    line = await f.readline()
                    if not line:
                        break
                    lines.append(line.strip())
            
            if lines:
                header = lines[0].split(',')
                rows = [line.split(',') for line in lines[1:]]
                return {
                    "type": "csv",
                    "num_columns": len(header),
                    "column_names": header,
                    "sample_rows": rows[:3]
                }
        except Exception as e:
            return {"error": f"Failed to preview CSV: {str(e)}"}
        
        return {}
    
    async def _preview_text(self, file_path: Path) -> dict:
        """Preview text file"""
        try:
            async with aiofiles.open(file_path, 'r', encoding='utf-8') as f:
                content = await f.read(500)  # First 500 chars
                return {
                    "type": "text",
                    "preview": content
                }
        except Exception as e:
            return {"error": f"Failed to preview text: {str(e)}"}
        
        return {}


# Singleton instance
dataset_service = DatasetService()
