# API Documentation - Sienn-AI

**Base URL:** `http://localhost:8000/api`

**Version:** 0.1.0

## Table of Contents

1. [Overview](#overview)
2. [Authentication](#authentication)
3. [Endpoints](#endpoints)
   - [Health & Metrics](#health--metrics)
   - [Dataset Management](#dataset-management)
   - [Fine-tuning](#fine-tuning)
   - [Model Inference](#model-inference)
   - [Model Export](#model-export)
4. [Error Handling](#error-handling)
5. [Examples](#examples)

---

## Overview

Sienn-AI is a fine-tuning platform that allows you to train AI models using LoRA/PEFT techniques. The API provides endpoints for dataset management, model training, inference, and export.

**Key Features:**
- Upload and validate datasets (CSV, JSON, JSONL)
- Fine-tune models asynchronously with Celery workers
- Track training progress in real-time
- Test models with custom prompts
- Export models in multiple formats (PyTorch, Ollama, GGUF)

---

## Authentication

Currently, the API does not require authentication. Future versions will implement API key authentication.

---

## Endpoints

### Health & Metrics

#### GET `/health`
Check API health status.

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2025-11-04T10:30:00Z"
}
```

**cURL Example:**
```bash
curl http://localhost:8000/health
```

---

#### GET `/api/health/detailed`
Get detailed system health metrics.

**Response:**
```json
{
  "status": "healthy",
  "services": {
    "database": "connected",
    "redis": "connected",
    "storage": "available"
  },
  "system": {
    "cpu_percent": 45.2,
    "memory_percent": 62.1,
    "disk_usage": 58.3
  }
}
```

**cURL Example:**
```bash
curl http://localhost:8000/api/health/detailed
```

---

#### GET `/api/metrics`
Get system metrics and statistics.

**Response:**
```json
{
  "total_jobs": 42,
  "active_jobs": 2,
  "completed_jobs": 38,
  "failed_jobs": 2,
  "total_datasets": 15,
  "total_models": 38
}
```

---

### Dataset Management

#### POST `/api/upload-dataset`
Upload and validate a training dataset.

**Request:**
- Method: `POST`
- Content-Type: `multipart/form-data`
- Body:
  - `file`: Dataset file (CSV, JSON, or JSONL)
  - `name`: Dataset name (optional)

**Supported Formats:**
- **CSV:** Must have columns like `instruction`, `input`, `output`
- **JSON/JSONL:** Array of objects with fields like `instruction`, `input`, `output`

**Response:**
```json
{
  "dataset_id": "ds_abc123",
  "filename": "training_data.csv",
  "format": "csv",
  "total_samples": 5000,
  "size_bytes": 1048576,
  "preview": [
    {
      "instruction": "What is Python?",
      "input": "",
      "output": "Python is a high-level programming language..."
    }
  ],
  "validation": {
    "valid": true,
    "columns": ["instruction", "input", "output"],
    "null_counts": {"instruction": 0, "input": 120, "output": 0}
  },
  "uploaded_at": "2025-11-04T10:35:00Z"
}
```

**cURL Example:**
```bash
curl -X POST http://localhost:8000/api/upload-dataset \
  -F "file=@training_data.csv" \
  -F "name=My Training Dataset"
```

---

### Fine-tuning

#### POST `/api/start-finetuning`
Start a fine-tuning job with custom configuration.

**Request:**
```json
{
  "dataset_id": "ds_abc123",
  "model_name": "gpt2",
  "config": {
    "num_epochs": 3,
    "batch_size": 4,
    "learning_rate": 2e-5,
    "max_length": 512,
    "lora_r": 32,
    "lora_alpha": 64,
    "target_modules": ["c_attn", "c_proj"]
  }
}
```

**Parameters:**
- `dataset_id`: ID of the uploaded dataset
- `model_name`: Base model to fine-tune (e.g., "gpt2", "microsoft/phi-2")
- `config`: Training configuration
  - `num_epochs`: Number of training epochs (default: 3)
  - `batch_size`: Training batch size (default: 4)
  - `learning_rate`: Learning rate (default: 2e-5)
  - `max_length`: Maximum sequence length (default: 512)
  - `lora_r`: LoRA rank (default: 32)
  - `lora_alpha`: LoRA alpha parameter (default: 64)

**Response:**
```json
{
  "job_id": "job_xyz789",
  "status": "pending",
  "message": "Fine-tuning job queued successfully",
  "estimated_time": "25 minutes",
  "created_at": "2025-11-04T10:40:00Z"
}
```

**cURL Example:**
```bash
curl -X POST http://localhost:8000/api/start-finetuning \
  -H "Content-Type: application/json" \
  -d '{
    "dataset_id": "ds_abc123",
    "model_name": "gpt2",
    "config": {
      "num_epochs": 3,
      "batch_size": 4,
      "learning_rate": 0.00002
    }
  }'
```

---

#### GET `/api/training-status/{job_id}`
Get the current status and progress of a training job.

**Response:**
```json
{
  "job_id": "job_xyz789",
  "status": "running",
  "progress": 65.5,
  "current_epoch": 2,
  "total_epochs": 3,
  "metrics": {
    "train_loss": 1.234,
    "eval_loss": 1.456,
    "learning_rate": 0.00002
  },
  "message": "Training epoch 2/3",
  "started_at": "2025-11-04T10:40:05Z",
  "updated_at": "2025-11-04T10:55:30Z",
  "estimated_completion": "2025-11-04T11:05:00Z"
}
```

**Status Values:**
- `pending`: Job queued, waiting to start
- `running`: Training in progress
- `completed`: Training finished successfully
- `failed`: Training encountered an error

**cURL Example:**
```bash
curl http://localhost:8000/api/training-status/job_xyz789
```

---

#### GET `/api/jobs`
List all training jobs.

**Query Parameters:**
- `status`: Filter by status (pending, running, completed, failed)
- `limit`: Maximum number of jobs to return (default: 50)
- `offset`: Number of jobs to skip (default: 0)

**Response:**
```json
{
  "jobs": [
    {
      "job_id": "job_xyz789",
      "status": "running",
      "model_name": "gpt2",
      "dataset_id": "ds_abc123",
      "progress": 65.5,
      "created_at": "2025-11-04T10:40:00Z"
    },
    {
      "job_id": "job_abc456",
      "status": "completed",
      "model_name": "microsoft/phi-2",
      "dataset_id": "ds_def456",
      "progress": 100.0,
      "created_at": "2025-11-03T14:20:00Z"
    }
  ],
  "total": 42,
  "limit": 50,
  "offset": 0
}
```

**cURL Example:**
```bash
curl "http://localhost:8000/api/jobs?status=completed&limit=10"
```

---

### Model Inference

#### POST `/api/test-model`
Test a fine-tuned model with a custom prompt.

**Request:**
```json
{
  "job_id": "job_xyz789",
  "prompt": "Write a Python function to calculate factorial",
  "max_length": 200,
  "temperature": 0.7,
  "top_p": 0.9,
  "top_k": 50
}
```

**Parameters:**
- `job_id`: ID of the completed training job
- `prompt`: Input text prompt
- `max_length`: Maximum tokens to generate (default: 200)
- `temperature`: Sampling temperature (default: 0.7)
- `top_p`: Nucleus sampling parameter (default: 0.9)
- `top_k`: Top-k sampling parameter (default: 50)

**Response:**
```json
{
  "generated_text": "def factorial(n):\n    if n == 0 or n == 1:\n        return 1\n    return n * factorial(n - 1)",
  "prompt": "Write a Python function to calculate factorial",
  "model_id": "job_xyz789",
  "inference_time": 1.23,
  "tokens_generated": 45
}
```

**cURL Example:**
```bash
curl -X POST http://localhost:8000/api/test-model \
  -H "Content-Type: application/json" \
  -d '{
    "job_id": "job_xyz789",
    "prompt": "Explain what is recursion in programming",
    "max_length": 150,
    "temperature": 0.7
  }'
```

---

### Model Export

#### POST `/api/export-model/{job_id}`
Export a fine-tuned model in a specific format.

**Path Parameters:**
- `job_id`: ID of the completed training job

**Request:**
```json
{
  "format": "ollama",
  "quantization": "q4_0"
}
```

**Parameters:**
- `format`: Export format
  - `pytorch`: Original PyTorch format (safetensors)
  - `ollama`: Ollama Modelfile format
  - `gguf`: GGUF quantized format
- `quantization`: Quantization level (for GGUF)
  - `q4_0`, `q4_1`, `q5_0`, `q5_1`, `q8_0`

**Response:**
```json
{
  "export_id": "exp_qwe123",
  "format": "ollama",
  "status": "processing",
  "download_url": "/api/download-model/job_xyz789?format=ollama",
  "estimated_time": "5 minutes"
}
```

**cURL Example:**
```bash
curl -X POST http://localhost:8000/api/export-model/job_xyz789 \
  -H "Content-Type: application/json" \
  -d '{
    "format": "ollama"
  }'
```

---

#### GET `/api/download-model/{job_id}`
Download the exported model as a ZIP archive.

**Query Parameters:**
- `format`: Export format (default: pytorch)

**Response:**
Binary ZIP file containing the model files.

**cURL Example:**
```bash
curl -O -J http://localhost:8000/api/download-model/job_xyz789?format=ollama
```

---

#### GET `/api/export-formats`
Get list of supported export formats.

**Response:**
```json
{
  "formats": [
    {
      "name": "pytorch",
      "description": "PyTorch native format with safetensors",
      "supports_quantization": false
    },
    {
      "name": "ollama",
      "description": "Ollama Modelfile format",
      "supports_quantization": false
    },
    {
      "name": "gguf",
      "description": "GGUF quantized format for llama.cpp",
      "supports_quantization": true,
      "quantization_levels": ["q4_0", "q4_1", "q5_0", "q5_1", "q8_0"]
    }
  ]
}
```

---

## Error Handling

All endpoints return standard HTTP status codes:

- **200 OK**: Request successful
- **201 Created**: Resource created successfully
- **400 Bad Request**: Invalid request parameters
- **404 Not Found**: Resource not found
- **500 Internal Server Error**: Server error

**Error Response Format:**
```json
{
  "detail": "Error message describing what went wrong",
  "error_code": "DATASET_INVALID",
  "timestamp": "2025-11-04T11:00:00Z"
}
```

**Common Error Codes:**
- `DATASET_INVALID`: Dataset validation failed
- `JOB_NOT_FOUND`: Training job not found
- `MODEL_NOT_FOUND`: Model not found
- `TRAINING_FAILED`: Training encountered an error
- `EXPORT_FAILED`: Export process failed

---

## Examples

### Complete Workflow Example

```bash
# 1. Upload a dataset
DATASET_RESPONSE=$(curl -X POST http://localhost:8000/api/upload-dataset \
  -F "file=@training_data.csv" \
  -F "name=My Dataset")

DATASET_ID=$(echo $DATASET_RESPONSE | jq -r '.dataset_id')

# 2. Start fine-tuning
JOB_RESPONSE=$(curl -X POST http://localhost:8000/api/start-finetuning \
  -H "Content-Type: application/json" \
  -d "{
    \"dataset_id\": \"$DATASET_ID\",
    \"model_name\": \"gpt2\",
    \"config\": {
      \"num_epochs\": 3,
      \"batch_size\": 4
    }
  }")

JOB_ID=$(echo $JOB_RESPONSE | jq -r '.job_id')

# 3. Monitor training progress
while true; do
  STATUS=$(curl -s http://localhost:8000/api/training-status/$JOB_ID | jq -r '.status')
  PROGRESS=$(curl -s http://localhost:8000/api/training-status/$JOB_ID | jq -r '.progress')
  echo "Status: $STATUS, Progress: $PROGRESS%"
  
  if [ "$STATUS" = "completed" ]; then
    break
  fi
  
  sleep 30
done

# 4. Test the model
curl -X POST http://localhost:8000/api/test-model \
  -H "Content-Type: application/json" \
  -d "{
    \"job_id\": \"$JOB_ID\",
    \"prompt\": \"Write a Python function\",
    \"max_length\": 200
  }"

# 5. Export to Ollama format
curl -X POST http://localhost:8000/api/export-model/$JOB_ID \
  -H "Content-Type: application/json" \
  -d '{
    "format": "ollama"
  }'

# 6. Download the model
curl -O -J http://localhost:8000/api/download-model/$JOB_ID?format=ollama
```

---

## Rate Limits

Currently, no rate limits are enforced. Future versions will implement:
- 100 requests/minute for standard endpoints
- 10 requests/minute for training endpoints
- 50 requests/minute for inference endpoints

---

## Support

For issues and questions:
- GitHub Issues: https://github.com/doriansenecot/Sienn-AI/issues
- Documentation: https://github.com/doriansenecot/Sienn-AI/docs

---

**Last Updated:** November 4, 2025
**API Version:** 0.1.0
