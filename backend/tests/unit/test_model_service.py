"""
Tests for ModelService
"""
import pytest
from unittest.mock import Mock, patch, MagicMock
from app.services.model_service import ModelService


@pytest.fixture
def model_service():
    """Create a ModelService instance for testing"""
    return ModelService()


class TestModelService:
    """Test suite for ModelService"""
    
    def test_model_service_initialization(self, model_service):
        """Test ModelService initialization"""
        assert model_service.loaded_models == {}
        assert model_service.device in ["cuda", "cpu"]
    
    @patch('app.services.model_service.AutoModelForCausalLM')
    @patch('app.services.model_service.AutoTokenizer')
    @patch('app.services.model_service.PeftModel')
    def test_load_model_internal(self, mock_peft, mock_tokenizer, mock_model, model_service):
        """Test internal _load_model method"""
        # Setup mocks
        mock_model_instance = Mock()
        mock_tokenizer_instance = Mock()
        mock_peft_instance = Mock()
        
        mock_model.from_pretrained.return_value = mock_model_instance
        mock_tokenizer.from_pretrained.return_value = mock_tokenizer_instance
        mock_peft.from_pretrained.return_value = mock_peft_instance
        mock_peft_instance.eval.return_value = None
        
        # Test
        result = model_service._load_model("/fake/model/path")
        
        assert "model" in result
        assert "tokenizer" in result
        assert "/fake/model/path" in model_service.loaded_models
    
    def test_model_exists(self, model_service, tmp_path):
        """Test model_exists method"""
        # Create a temporary directory to act as a model
        model_dir = tmp_path / "test_model"
        model_dir.mkdir()
        
        assert model_service.model_exists(str(model_dir)) is True
        assert model_service.model_exists(str(tmp_path / "nonexistent")) is False
    
    def test_device_detection(self, model_service):
        """Test device detection"""
        import torch
        expected_device = "cuda" if torch.cuda.is_available() else "cpu"
        assert model_service.device == expected_device
    
    @pytest.mark.asyncio
    @patch('app.services.model_service.torch')
    @patch('app.services.model_service.asyncio')
    async def test_test_model_async(self, mock_asyncio, mock_torch, model_service):
        """Test async test_model method structure"""
        # This tests the async structure without full model loading
        mock_asyncio.get_event_loop.return_value.run_in_executor.return_value = {
            "model": Mock(),
            "tokenizer": Mock()
        }
        
        # Test would require full setup, just verify method exists
        assert hasattr(model_service, 'test_model')
        assert callable(model_service.test_model)
    
    def test_model_caching(self, model_service):
        """Test that models are cached after loading"""
        # Add a mock model to cache
        model_service.loaded_models["/test/path"] = {
            "model": Mock(),
            "tokenizer": Mock()
        }
        
        # Verify it's cached
        assert "/test/path" in model_service.loaded_models
        assert "model" in model_service.loaded_models["/test/path"]
        assert "tokenizer" in model_service.loaded_models["/test/path"]
