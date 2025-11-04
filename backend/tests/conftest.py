"""
Pytest configuration and fixtures
"""
import pytest
import sys
from pathlib import Path

# Add backend to path
backend_path = Path(__file__).parent.parent
sys.path.insert(0, str(backend_path))


@pytest.fixture(scope="session")
def test_data_dir(tmp_path_factory):
    """Create a temporary directory for test data"""
    return tmp_path_factory.mktemp("test_data")


@pytest.fixture
def mock_job_id():
    """Provide a mock job ID for testing"""
    return "test-job-12345"


@pytest.fixture
def mock_model_path(tmp_path):
    """Provide a mock model path"""
    model_dir = tmp_path / "models" / "test_model"
    model_dir.mkdir(parents=True)
    return str(model_dir)
