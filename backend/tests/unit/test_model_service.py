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
    
    @patch('app.services.model_service.AutoModelForCausalLM')
    @patch('app.services.model_service.AutoTokenizer')
    @patch('app.services.model_service.PeftModel')
    def test_load_model_success(self, mock_peft, mock_tokenizer, mock_model, model_service):
        """Test successful model loading"""
        # Setup mocks
        mock_model.from_pretrained.return_value = Mock()
        mock_tokenizer.from_pretrained.return_value = Mock()
        mock_peft.from_pretrained.return_value = Mock()
        
        # Test
        result = model_service.load_model("/fake/model/path")
        
        assert result is True
        assert model_service.model is not None
        assert model_service.tokenizer is not None
    
    @patch('app.services.model_service.AutoModelForCausalLM')
    def test_load_model_failure(self, mock_model, model_service):
        """Test model loading failure"""
        # Setup mock to raise exception
        mock_model.from_pretrained.side_effect = Exception("Model not found")
        
        # Test
        result = model_service.load_model("/nonexistent/model")
        
        assert result is False
        assert model_service.model is None
    
    @patch('app.services.model_service.AutoModelForCausalLM')
    @patch('app.services.model_service.AutoTokenizer')
    @patch('app.services.model_service.PeftModel')
    def test_generate_text(self, mock_peft, mock_tokenizer, mock_model, model_service):
        """Test text generation"""
        # Setup mocks
        mock_tokenizer_instance = Mock()
        mock_tokenizer_instance.encode.return_value = [1, 2, 3]
        mock_tokenizer_instance.decode.return_value = "Generated text response"
        mock_tokenizer.from_pretrained.return_value = mock_tokenizer_instance
        
        mock_model_instance = Mock()
        mock_model_instance.generate.return_value = [[1, 2, 3, 4, 5]]
        mock_model.from_pretrained.return_value = mock_model_instance
        mock_peft.from_pretrained.return_value = mock_model_instance
        
        # Load model first
        model_service.load_model("/fake/model")
        
        # Test generation
        result = model_service.generate("Test prompt", max_length=50)
        
        assert result is not None
        assert isinstance(result, str)
    
    def test_generate_without_model(self, model_service):
        """Test generation without loading model first"""
        with pytest.raises(Exception):
            model_service.generate("Test prompt")
    
    @patch('app.services.model_service.AutoModelForCausalLM')
    @patch('app.services.model_service.AutoTokenizer')
    @patch('app.services.model_service.PeftModel')
    def test_test_model(self, mock_peft, mock_tokenizer, mock_model, model_service):
        """Test model testing endpoint"""
        # Setup mocks
        mock_tokenizer_instance = Mock()
        mock_tokenizer_instance.encode.return_value = [1, 2, 3]
        mock_tokenizer_instance.decode.return_value = "Test response"
        mock_tokenizer.from_pretrained.return_value = mock_tokenizer_instance
        
        mock_model_instance = Mock()
        mock_model_instance.generate.return_value = [[1, 2, 3, 4]]
        mock_model.from_pretrained.return_value = mock_model_instance
        mock_peft.from_pretrained.return_value = mock_model_instance
        
        # Load model
        model_service.load_model("/fake/model")
        
        # Test
        result = model_service.test_model(
            model_path="/fake/model",
            prompt="Test prompt",
            max_length=100,
            temperature=0.7
        )
        
        assert "generated_text" in result
        assert "inference_time" in result
        assert isinstance(result["inference_time"], (int, float))
