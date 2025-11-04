"""
Tests for DatasetService
"""
import pytest
import tempfile
import pandas as pd
from pathlib import Path
from app.services.dataset_service import DatasetService


@pytest.fixture
def dataset_service():
    """Create a DatasetService instance for testing"""
    return DatasetService()


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
    
    def test_validate_dataset_csv(self, dataset_service, sample_csv_file):
        """Test CSV dataset validation"""
        result = dataset_service.validate_dataset(sample_csv_file)
        
        assert result["valid"] is True
        assert result["format"] == "csv"
        assert result["total_samples"] == 3
        assert "instruction" in result["columns"]
    
    def test_validate_dataset_json(self, dataset_service, sample_json_file):
        """Test JSON dataset validation"""
        result = dataset_service.validate_dataset(sample_json_file)
        
        assert result["valid"] is True
        assert result["format"] == "json"
        assert result["total_samples"] == 2
    
    def test_validate_dataset_invalid_format(self, dataset_service):
        """Test validation with invalid file format"""
        with tempfile.NamedTemporaryFile(suffix='.txt', delete=False) as f:
            f.write(b"not a valid format")
            temp_path = f.name
        
        try:
            result = dataset_service.validate_dataset(temp_path)
            assert result["valid"] is False
        finally:
            Path(temp_path).unlink(missing_ok=True)
    
    def test_validate_dataset_nonexistent_file(self, dataset_service):
        """Test validation with nonexistent file"""
        result = dataset_service.validate_dataset("/nonexistent/file.csv")
        assert result["valid"] is False
    
    def test_preview_dataset_csv(self, dataset_service, sample_csv_file):
        """Test CSV dataset preview"""
        preview = dataset_service.preview_dataset(sample_csv_file, num_samples=2)
        
        assert len(preview) == 2
        assert "instruction" in preview[0]
        assert preview[0]["instruction"] == "What is Python?"
    
    def test_preview_dataset_json(self, dataset_service, sample_json_file):
        """Test JSON dataset preview"""
        preview = dataset_service.preview_dataset(sample_json_file, num_samples=1)
        
        assert len(preview) == 1
        assert "instruction" in preview[0]
    
    def test_analyze_dataset_quality(self, dataset_service, sample_csv_file):
        """Test dataset quality analysis"""
        analysis = dataset_service.analyze_quality(sample_csv_file)
        
        assert "null_counts" in analysis
        assert "avg_lengths" in analysis
        assert "quality_score" in analysis
        assert 0 <= analysis["quality_score"] <= 100
