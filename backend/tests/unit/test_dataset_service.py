"""
Tests for DatasetService
"""
import pytest
import tempfile
import pandas as pd
from pathlib import Path
from unittest.mock import Mock, AsyncMock
from app.services.dataset_service import DatasetService


@pytest.fixture
def dataset_service():
    """Create a DatasetService instance for testing"""
    service = DatasetService()
    # Create test upload directory
    service.upload_dir.mkdir(parents=True, exist_ok=True)
    return service


@pytest.fixture
def sample_csv_file():
    """Create a temporary CSV file for testing"""
    with tempfile.NamedTemporaryFile(mode='w', suffix='.csv', delete=False) as f:
        f.write("instruction,input,output\n")
        f.write("What is Python?,,'Python is a programming language'\n")
        f.write("Explain lists,,'Lists are ordered collections'\n")
        f.write("What is a function?,,'A function is a reusable block of code'\n")
        temp_path = f.name
    
    yield temp_path
    
    # Cleanup
    Path(temp_path).unlink(missing_ok=True)


@pytest.fixture
def sample_json_file():
    """Create a temporary JSON file for testing"""
    with tempfile.NamedTemporaryFile(mode='w', suffix='.json', delete=False) as f:
        f.write('''[
            {"instruction": "What is Python?", "input": "", "output": "Python is a programming language"},
            {"instruction": "Explain lists", "input": "", "output": "Lists are ordered collections"}
        ]''')
        temp_path = f.name
    
    yield temp_path
    
    # Cleanup
    Path(temp_path).unlink(missing_ok=True)


class TestDatasetService:
    """Test suite for DatasetService"""
    
    @pytest.mark.asyncio
    async def test_save_upload_csv(self, dataset_service, sample_csv_file):
        """Test saving CSV upload"""
        # Create a mock UploadFile
        mock_file = AsyncMock()
        mock_file.filename = "test.csv"
        mock_file.content_type = "text/csv"
        
        # Read actual file content
        with open(sample_csv_file, 'rb') as f:
            content = f.read()
        
        # Mock read to return content in chunks
        mock_file.read = AsyncMock(side_effect=[content, b''])
        
        metadata, preview = await dataset_service.save_upload(mock_file)
        
        assert metadata["original_filename"] == "test.csv"
        assert metadata["size_bytes"] == len(content)
        assert metadata["status"] == "uploaded"
        assert "id" in metadata
    
    @pytest.mark.asyncio
    async def test_generate_preview_csv(self, dataset_service, sample_csv_file):
        """Test CSV preview generation"""
        preview = await dataset_service._generate_preview(Path(sample_csv_file), "text/csv")
        
        assert preview["format"] == "csv"
        assert preview["num_rows"] == 3
        assert "column_names" in preview
        assert "instruction" in preview["column_names"]
    
    @pytest.mark.asyncio
    async def test_generate_preview_json(self, dataset_service, sample_json_file):
        """Test JSON preview generation"""
        preview = await dataset_service._generate_preview(Path(sample_json_file), "application/json")
        
        assert preview["format"] == "json"
        assert preview["num_rows"] == 2
        assert "column_names" in preview
    
    def test_upload_dir_creation(self, dataset_service):
        """Test that upload directory is created"""
        assert dataset_service.upload_dir.exists()
        assert dataset_service.upload_dir.is_dir()
    
    @pytest.mark.asyncio
    async def test_preview_with_max_samples(self, dataset_service, sample_csv_file):
        """Test preview respects max_samples"""
        preview = await dataset_service._generate_preview(Path(sample_csv_file), "text/csv", max_samples=2)
        
        assert len(preview["samples"]) <= 2
    
    @pytest.mark.asyncio
    async def test_invalid_file_format(self, dataset_service):
        """Test handling of invalid file format"""
        with tempfile.NamedTemporaryFile(suffix='.xyz', delete=False) as f:
            f.write(b"invalid content")
            temp_path = f.name
        
        try:
            preview = await dataset_service._generate_preview(Path(temp_path), "application/xyz")
            assert preview["format"] == "unknown"
        finally:
            Path(temp_path).unlink(missing_ok=True)
    
    @pytest.mark.asyncio
    async def test_empty_file_handling(self, dataset_service):
        """Test handling of empty files"""
        with tempfile.NamedTemporaryFile(suffix='.csv', delete=False) as f:
            temp_path = f.name
        
        try:
            preview = await dataset_service._generate_preview(Path(temp_path), "text/csv")
            assert preview["num_rows"] == 0
        finally:
            Path(temp_path).unlink(missing_ok=True)
