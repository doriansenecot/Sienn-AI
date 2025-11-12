# API Documentation

Complete reference for the Sienn-AI REST API.

## Table of Contents

- [Overview](#overview)
- [Base URL](#base-url)
- [Authentication](#authentication)
- [Response Format](#response-format)
- [Error Handling](#error-handling)
- [Endpoints](#endpoints)
  - [Health & Metrics](#health--metrics)
  - [Datasets](#datasets)
  - [Training Jobs](#training-jobs)
  - [Inference](#inference)
  - [Model Export](#model-export)
  - [Models](#models)
- [Examples](#examples)
- [Rate Limiting](#rate-limiting)

---

## Overview

The Sienn-AI API is a RESTful API built with FastAPI that provides endpoints for:
- Uploading datasets
- Starting fine-tuning jobs
- Monitoring training progress
- Testing fine-tuned models
- Exporting models to various formats
- System health and metrics

**API Version**: `0.2.0`

---

## Base URL

```
Development: http://localhost:8000
Production:  https://your-domain.com
```

All endpoints are prefixed with `/api` unless otherwise specified.

---

## Authentication

**Current Status**: No authentication required (v0.2.0)

Future versions will support:
- API Keys
- OAuth 2.0
- JWT Tokens

---

## Response Format

All responses are in JSON format.

### Success Response

```json
{
  "data": { ... },
  "status": "success"
}
```

### Error Response

```json
{
  "detail": "Error message describing what went wrong",
  "status_code": 400
}
```

---

## Error Handling

### HTTP Status Codes

| Code | Description |
|------|-------------|
| `200` | Success |
| `201` | Created |
| `400` | Bad Request - Invalid input |
| `404` | Not Found - Resource doesn't exist |
| `422` | Validation Error - Invalid data format |
| `500` | Internal Server Error |

### Common Errors

```json
{
  "detail": "Dataset f8e7d3b2-... not found",
  "status_code": 404
}
```

```json
{
  "detail": "Job status is 'running', model testing is only available for completed jobs",
  "status_code": 400
}
```

---

## Endpoints

### Health & Metrics

#### `GET /health`

Basic health check.

**Response:**
```json
{
  "status": "ok",
  "env": "production"
}
```

---

#### `GET /api/health/detailed`

Detailed health check with component status.

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2025-11-12T10:30:00.000Z",
  "components": {
    "database": {
      "status": "healthy"
    },
    "disk": {
      "status": "healthy",
      "free_percent": 45.2
    },
    "memory": {
      "status": "healthy",
      "used_percent": 62.1
    }
  }
}
```

---

#### `GET /api/health/services`

Check all services (Database, Redis, MinIO, Celery).

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2025-11-12T10:30:00.000Z",
  "services": {
    "database": { "status": "healthy", "response_time_ms": 2.1 },
    "redis": { "status": "healthy", "response_time_ms": 1.5 },
    "minio": { "status": "healthy", "response_time_ms": 8.3 },
    "celery": { "status": "healthy", "active_workers": 1 }
  }
}
```

---

#### `GET /api/metrics`

Application and system metrics.

**Response:**
```json
{
  "timestamp": "2025-11-12T10:30:00.000Z",
  "system": {
    "cpu_percent": 45.2,
    "memory_percent": 62.1,
    "memory_available_mb": 3072.0,
    "memory_total_mb": 8192.0,
    "disk_percent": 54.8,
    "disk_free_gb": 128.5,
    "disk_total_gb": 512.0
  },
  "application": {
    "jobs": {
      "total": 42,
      "by_status": {
        "pending": 2,
        "running": 1,
        "completed": 37,
        "failed": 2
      },
      "completed_last_24h": 5,
      "failed_last_24h": 0,
      "success_rate_24h": 100.0,
      "avg_training_time_minutes": 12.5
    },
    "datasets": {
      "total": 15,
      "total_size_mb": 256.7,
      "total_size_gb": 0.25
    }
  }
}
```

---

#### `GET /api/metrics/prometheus`

Metrics in Prometheus format for scraping.

**Response:** Plain text Prometheus format
```
# HELP sienn_jobs_total Total number of jobs created
# TYPE sienn_jobs_total counter
sienn_jobs_total{status="completed"} 37.0
sienn_jobs_total{status="failed"} 2.0
...
```

---

### Datasets

#### `POST /api/upload-dataset`

Upload a dataset file for fine-tuning.

**Request:**
- Content-Type: `multipart/form-data`
- Body: File upload

**Supported Formats:**
- CSV (`.csv`)
- JSON (`.json`)
- JSONL (`.jsonl`)

**Dataset Structure:**

For conversational data (CSV/JSON/JSONL):
```csv
instruction,response
"What is Python?","Python is a high-level programming language..."
"Explain LoRA","LoRA (Low-Rank Adaptation) is a technique..."
```

```json
[
  {
    "instruction": "What is Python?",
    "response": "Python is a high-level programming language..."
  },
  {
    "instruction": "Explain LoRA",
    "response": "LoRA (Low-Rank Adaptation) is a technique..."
  }
]
```

**Response:**
```json
{
  "dataset_id": "f8e7d3b2-1234-5678-9abc-def012345678",
  "filename": "conversations.csv",
  "size_bytes": 102400,
  "status": "uploaded",
  "preview": [
    {
      "instruction": "What is Python?",
      "response": "Python is a high-level programming language..."
    }
  ],
  "created_at": "2025-11-12T10:30:00.000Z"
}
```

**cURL Example:**
```bash
curl -X POST http://localhost:8000/api/upload-dataset \
  -F "file=@dataset.csv"
```

---

#### `GET /api/datasets`

List all uploaded datasets.

**Response:**
```json
{
  "datasets": [
    {
      "id": "f8e7d3b2-1234-5678-9abc-def012345678",
      "filename": "conversations.csv",
      "size_bytes": 102400,
      "status": "uploaded",
      "created_at": "2025-11-12T10:30:00.000Z"
    }
  ]
}
```

---

### Training Jobs

#### `POST /api/start-finetuning`

Start a fine-tuning job.

**Request Body:**
```json
{
  "dataset_id": "f8e7d3b2-1234-5678-9abc-def012345678",
  "model_name": "Qwen/Qwen2.5-0.5B-Instruct",
  "learning_rate": 0.0002,
  "num_epochs": 3,
  "batch_size": 4,
  "max_length": 512
}
```

**Parameters:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `dataset_id` | string | **required** | Dataset UUID |
| `model_name` | string | `"Qwen/Qwen2.5-0.5B-Instruct"` | Base model to fine-tune |
| `learning_rate` | float | `0.0002` | Learning rate (1e-5 to 1e-3) |
| `num_epochs` | integer | `3` | Number of training epochs (1-10) |
| `batch_size` | integer | `4` | Training batch size (1-32) |
| `max_length` | integer | `512` | Maximum sequence length (128-2048) |

**Response:**
```json
{
  "job_id": "a1b2c3d4-5678-90ef-ghij-klmnopqrstuv",
  "status": "pending",
  "dataset_id": "f8e7d3b2-1234-5678-9abc-def012345678",
  "message": "Fine-tuning job submitted successfully",
  "created_at": "2025-11-12T10:30:00.000Z"
}
```

**cURL Example:**
```bash
curl -X POST http://localhost:8000/api/start-finetuning \
  -H "Content-Type: application/json" \
  -d '{
    "dataset_id": "f8e7d3b2-...",
    "model_name": "Qwen/Qwen2.5-0.5B-Instruct",
    "num_epochs": 3
  }'
```

---

#### `GET /api/training-status/{job_id}`

Get training job status and progress.

**Response:**
```json
{
  "job_id": "a1b2c3d4-5678-90ef-ghij-klmnopqrstuv",
  "dataset_id": "f8e7d3b2-1234-5678-9abc-def012345678",
  "status": "running",
  "progress": 45,
  "message": "Training in progress: Epoch 2/3",
  "created_at": "2025-11-12T10:30:00.000Z",
  "updated_at": "2025-11-12T10:35:00.000Z",
  "meta": {
    "model_name": "Qwen/Qwen2.5-0.5B-Instruct",
    "current_epoch": 2,
    "total_epochs": 3,
    "current_loss": 0.523,
    "model_path": "/app/data/models/a1b2c3d4-..."
  }
}
```

**Status Values:**
- `pending` - Job queued, waiting to start
- `running` - Training in progress
- `completed` - Training finished successfully
- `failed` - Training failed with error

---

#### `GET /api/jobs`

List all training jobs (most recent first).

**Response:**
```json
{
  "jobs": [
    {
      "job_id": "a1b2c3d4-...",
      "dataset_id": "f8e7d3b2-...",
      "status": "completed",
      "progress": 100,
      "message": "Training completed successfully",
      "created_at": "2025-11-12T10:30:00.000Z",
      "updated_at": "2025-11-12T10:45:00.000Z"
    }
  ],
  "count": 42
}
```

---

### Inference

#### `POST /api/test-model`

Test a fine-tuned model with a prompt.

**Request Body:**
```json
{
  "job_id": "a1b2c3d4-5678-90ef-ghij-klmnopqrstuv",
  "prompt": "What is machine learning?",
  "max_new_tokens": 200,
  "temperature": 0.7,
  "top_p": 0.95,
  "repetition_penalty": 1.2,
  "do_sample": true
}
```

**Parameters:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `job_id` | string | **required** | Job UUID with completed training |
| `prompt` | string | **required** | Input prompt for generation |
| `max_new_tokens` | integer | `200` | Maximum tokens to generate (10-2000) |
| `temperature` | float | `0.7` | Sampling temperature (0.1-2.0) |
| `top_p` | float | `0.95` | Nucleus sampling threshold |
| `repetition_penalty` | float | `1.2` | Penalty for repeated tokens |
| `do_sample` | boolean | `true` | Use sampling vs greedy decoding |

**Response:**
```json
{
  "job_id": "a1b2c3d4-5678-90ef-ghij-klmnopqrstuv",
  "prompt": "What is machine learning?",
  "generated_text": "Machine learning is a branch of artificial intelligence that enables computers to learn from data and improve their performance...",
  "model_path": "/app/data/models/a1b2c3d4-.../final_model",
  "generation_time": 2.34,
  "timestamp": "2025-11-12T10:50:00.000Z"
}
```

**cURL Example:**
```bash
curl -X POST http://localhost:8000/api/test-model \
  -H "Content-Type: application/json" \
  -d '{
    "job_id": "a1b2c3d4-...",
    "prompt": "What is machine learning?",
    "max_new_tokens": 200
  }'
```

---

### Model Export

#### `GET /api/download-model/{job_id}`

Download fine-tuned model as ZIP archive.

**Response:**
- Content-Type: `application/zip`
- File: `model_{job_id}.zip`

Contains:
- `adapter_model.safetensors` - LoRA adapter weights
- `adapter_config.json` - Adapter configuration
- `tokenizer.json` - Tokenizer
- `tokenizer_config.json` - Tokenizer configuration
- `special_tokens_map.json` - Special tokens

**cURL Example:**
```bash
curl -X GET http://localhost:8000/api/download-model/a1b2c3d4-... \
  -o model.zip
```

---

#### `POST /api/export-model/{job_id}`

Export model to specific format (Ollama, HuggingFace, GGUF).

**Request Body:**
```json
{
  "format": "ollama",
  "model_name": "my-custom-model",
  "temperature": 0.8,
  "top_p": 0.9,
  "top_k": 40,
  "quantization": "Q4_K_M"
}
```

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `format` | string | **yes** | Export format: `ollama`, `huggingface`, `gguf` |
| `model_name` | string | for ollama | Model name in Ollama |
| `temperature` | float | for ollama | Default temperature |
| `top_p` | float | for ollama | Default top_p |
| `top_k` | integer | for ollama | Default top_k |
| `quantization` | string | for gguf | Quantization level (Q4_K_M, Q5_K_M, etc.) |

**Response:**
```json
{
  "job_id": "a1b2c3d4-5678-90ef-ghij-klmnopqrstuv",
  "format": "ollama",
  "status": "completed",
  "message": "Model exported successfully to ollama format",
  "download_url": "http://minio:9000/exports/a1b2c3d4-.../ollama/Modelfile?...",
  "file_size_bytes": 524288000,
  "timestamp": "2025-11-12T11:00:00.000Z"
}
```

**cURL Example:**
```bash
curl -X POST http://localhost:8000/api/export-model/a1b2c3d4-... \
  -H "Content-Type: application/json" \
  -d '{
    "format": "ollama",
    "model_name": "my-chatbot"
  }'
```

---

#### `GET /api/export-formats`

Get list of supported export formats.

**Response:**
```json
{
  "formats": [
    {
      "name": "ollama",
      "description": "Ollama Modelfile format for local deployment",
      "supported": true,
      "parameters": ["model_name", "temperature", "top_p", "top_k"]
    },
    {
      "name": "huggingface",
      "description": "HuggingFace format (adapter + tokenizer)",
      "supported": true,
      "parameters": []
    },
    {
      "name": "gguf",
      "description": "GGUF quantized format for llama.cpp",
      "supported": false,
      "parameters": ["quantization"],
      "note": "Requires llama.cpp - coming soon"
    }
  ]
}
```

---

### Models

#### `GET /api/models/available`

Get list of available pre-configured models.

**Response:**
```json
{
  "models": [
    {
      "id": "Qwen/Qwen2.5-0.5B-Instruct",
      "name": "Qwen 2.5 0.5B (Ultra Light)",
      "vram_required_gb": 2,
      "quality_rating": 3,
      "speed_rating": 5,
      "batch_size": 8,
      "max_length": 1024,
      "learning_rate": 0.0003,
      "description": "Smallest model, great for testing and rapid iteration. Good for simple tasks.",
      "is_cached": true,
      "cache_size_bytes": 524288000
    },
    {
      "id": "Qwen/Qwen2.5-1.5B-Instruct",
      "name": "Qwen 2.5 1.5B (Light)",
      "vram_required_gb": 4,
      "quality_rating": 4,
      "speed_rating": 4,
      "batch_size": 4,
      "max_length": 1024,
      "learning_rate": 0.0002,
      "description": "Balanced model for most use cases. Good quality with reasonable speed.",
      "is_cached": false,
      "cache_size_bytes": null
    }
  ]
}
```

---

## Examples

### Complete Workflow

#### 1. Upload Dataset

```python
import requests

# Upload dataset
files = {"file": open("dataset.csv", "rb")}
resp = requests.post("http://localhost:8000/api/upload-dataset", files=files)
dataset_id = resp.json()["dataset_id"]
print(f"Dataset uploaded: {dataset_id}")
```

#### 2. Start Training

```python
# Start fine-tuning
config = {
    "dataset_id": dataset_id,
    "model_name": "Qwen/Qwen2.5-0.5B-Instruct",
    "num_epochs": 3,
    "batch_size": 4,
    "learning_rate": 0.0002
}
resp = requests.post("http://localhost:8000/api/start-finetuning", json=config)
job_id = resp.json()["job_id"]
print(f"Training started: {job_id}")
```

#### 3. Monitor Progress

```python
import time

# Poll for status
while True:
    resp = requests.get(f"http://localhost:8000/api/training-status/{job_id}")
    status_data = resp.json()
    
    print(f"Status: {status_data['status']} - {status_data['progress']}%")
    
    if status_data['status'] in ['completed', 'failed']:
        break
    
    time.sleep(10)
```

#### 4. Test Model

```python
# Test the model
prompt = {"job_id": job_id, "prompt": "What is Python?"}
resp = requests.post("http://localhost:8000/api/test-model", json=prompt)
print(resp.json()["generated_text"])
```

#### 5. Export Model

```python
# Export to Ollama
export_config = {"format": "ollama", "model_name": "my-chatbot"}
resp = requests.post(f"http://localhost:8000/api/export-model/{job_id}", json=export_config)
download_url = resp.json()["download_url"]
print(f"Download: {download_url}")
```

---

### JavaScript/TypeScript Example

```typescript
// Upload dataset
const formData = new FormData();
formData.append('file', fileInput.files[0]);

const uploadResp = await fetch('http://localhost:8000/api/upload-dataset', {
  method: 'POST',
  body: formData
});
const { dataset_id } = await uploadResp.json();

// Start training
const trainingResp = await fetch('http://localhost:8000/api/start-finetuning', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    dataset_id,
    model_name: 'Qwen/Qwen2.5-0.5B-Instruct',
    num_epochs: 3
  })
});
const { job_id } = await trainingResp.json();

// Monitor status
const statusResp = await fetch(`http://localhost:8000/api/training-status/${job_id}`);
const status = await statusResp.json();
console.log(`Progress: ${status.progress}%`);
```

---

## Rate Limiting

**Current Status**: No rate limiting (v0.2.0)

Future versions will implement:
- 100 requests per minute per IP
- 1000 requests per hour per IP
- Custom limits for authenticated users

---

## Interactive API Documentation

### Swagger UI

Visit `http://localhost:8000/docs` for interactive API documentation with:
- All endpoints listed
- Request/response schemas
- Try-it-out functionality
- Authentication support

### ReDoc

Visit `http://localhost:8000/redoc` for alternative documentation with:
- Clean, readable layout
- Detailed descriptions
- Code examples
- Search functionality

---

## WebSocket Support

**Status**: Coming in v0.3.0

Real-time updates for:
- Training progress
- System metrics
- Job completion notifications

---

## Support

- **Issues**: [GitHub Issues](https://github.com/doriansenecot/Sienn-AI/issues)
- **Discussions**: [GitHub Discussions](https://github.com/doriansenecot/Sienn-AI/discussions)
- **Email**: Via GitHub profile

---

## Changelog

### v0.2.0 (Current)
- Added model selection endpoint
- Improved metrics
- Better error handling

### v0.1.0
- Initial API release
- Basic CRUD operations
- Health checks

---

**Last Updated**: November 2025  
**API Version**: 0.2.0
