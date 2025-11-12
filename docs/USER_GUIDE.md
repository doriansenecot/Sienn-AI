# User Guide

Complete walkthrough for using Sienn-AI from dataset preparation to model deployment.

## Table of Contents

1. [Introduction](#introduction)
2. [Getting Started](#getting-started)
3. [Preparing Your Dataset](#preparing-your-dataset)
4. [Uploading Data](#uploading-data)
5. [Selecting a Model](#selecting-a-model)
6. [Starting Training](#starting-training)
7. [Monitoring Progress](#monitoring-progress)
8. [Testing Your Model](#testing-your-model)
9. [Exporting Models](#exporting-models)
10. [Best Practices](#best-practices)
11. [Troubleshooting](#troubleshooting)
12. [Advanced Topics](#advanced-topics)

---

## Introduction

Welcome to Sienn-AI! This guide will walk you through the complete process of fine-tuning a large language model using LoRA (Low-Rank Adaptation).

### What You'll Learn

- How to prepare datasets for fine-tuning
- How to configure training parameters
- How to monitor and evaluate training
- How to test and deploy your models
- Best practices for optimal results

### Prerequisites

- Sienn-AI installed and running (see [INSTALLATION.md](INSTALLATION.md))
- Basic understanding of machine learning concepts
- A dataset for fine-tuning (or use our examples)

---

## Getting Started

### Access the Application

1. **Start Sienn-AI:**
   ```bash
   docker compose up -d
   ```

2. **Open your browser:**
   - Frontend: http://localhost:3000
   - API Docs: http://localhost:8000/docs

3. **Verify services:**
   ```bash
   docker compose ps
   # All services should be "Up"
   ```

### Interface Overview

The web interface has 5 main pages:

1. **Dashboard** 📊
   - System metrics
   - Active jobs
   - Quick statistics

2. **Datasets** 📁
   - Upload datasets
   - View uploaded files
   - Preview data

3. **Training** 🚀
   - Start fine-tuning
   - Configure parameters
   - Select models

4. **Monitoring** 📈
   - Track training progress
   - View metrics
   - Check job history

5. **Inference** 🤖
   - Test models
   - Generate text
   - Compare outputs

---

## Preparing Your Dataset

### Dataset Format

Sienn-AI supports three formats:

#### 1. CSV Format (Recommended)

```csv
instruction,response
"What is Python?","Python is a high-level programming language..."
"Explain machine learning","Machine learning is a branch of AI..."
"Write a hello world in Python","print('Hello, World!')"
```

**Requirements:**
- Must have headers: `instruction` and `response`
- UTF-8 encoding
- Comma-separated
- Quoted strings (optional but recommended)

#### 2. JSON Format

```json
[
  {
    "instruction": "What is Python?",
    "response": "Python is a high-level programming language..."
  },
  {
    "instruction": "Explain machine learning",
    "response": "Machine learning is a branch of AI..."
  }
]
```

**Requirements:**
- Array of objects
- Each object must have `instruction` and `response` keys
- Valid JSON syntax

#### 3. JSONL Format (JSON Lines)

```jsonl
{"instruction": "What is Python?", "response": "Python is a high-level programming language..."}
{"instruction": "Explain machine learning", "response": "Machine learning is a branch of AI..."}
{"instruction": "Write a hello world in Python", "response": "print('Hello, World!')"}
```

**Requirements:**
- One JSON object per line
- Each object must have `instruction` and `response` keys
- No commas between lines

### Dataset Quality Guidelines

#### Minimum Requirements

- **Size**: At least 50 examples (100+ recommended)
- **Quality**: Clear, accurate responses
- **Consistency**: Similar format across examples
- **Diversity**: Varied examples covering your use case

#### Good Example ✅

```csv
instruction,response
"Translate to French: Hello","Bonjour"
"Translate to French: Thank you","Merci"
"Translate to French: Good morning","Bonjour (le matin)"
```

Clear, consistent, focused.

#### Bad Example ❌

```csv
instruction,response
"hello","hi"
"What's your name?","I don't have a name"
"123","Some random text..."
```

Inconsistent, low quality, unclear purpose.

### Creating Your Dataset

#### Use Case: Chatbot

```csv
instruction,response
"What services do you offer?","We offer web development, mobile apps, and cloud solutions."
"What are your business hours?","We're open Monday to Friday, 9 AM to 6 PM EST."
"How can I contact support?","You can reach our support team at support@example.com or call (555) 123-4567."
```

#### Use Case: Code Assistant

```csv
instruction,response
"Write a Python function to calculate factorial","def factorial(n):
    if n <= 1:
        return 1
    return n * factorial(n - 1)"
"Create a React component for a button","import React from 'react';

export const Button = ({ onClick, children }) => {
  return <button onClick={onClick}>{children}</button>;
};"
```

#### Use Case: Translation

```csv
instruction,response
"Translate to Spanish: The weather is nice today","El clima está agradable hoy"
"Translate to Spanish: I love learning languages","Me encanta aprender idiomas"
"Translate to Spanish: Where is the library?","¿Dónde está la biblioteca?"
```

### Dataset Size Recommendations

| Use Case | Minimum | Recommended | Optimal |
|----------|---------|-------------|---------|
| Simple Q&A | 50 | 200 | 500+ |
| Chatbot | 100 | 500 | 1000+ |
| Code Generation | 100 | 300 | 1000+ |
| Translation | 200 | 1000 | 5000+ |
| General Fine-tuning | 100 | 500 | 2000+ |

---

## Uploading Data

### Via Web Interface

1. **Navigate to Datasets page**
   - Click "Datasets" in the navigation

2. **Click "Upload Dataset"**
   - Or drag & drop your file

3. **Select your file**
   - Supports: `.csv`, `.json`, `.jsonl`
   - Max size: 100MB

4. **Preview your data**
   - System shows first 5 examples
   - Verify format is correct

5. **Confirm upload**
   - Dataset is validated and stored
   - You receive a unique Dataset ID

### Via API

```bash
curl -X POST http://localhost:8000/api/upload-dataset \
  -F "file=@my_dataset.csv"
```

Response:
```json
{
  "dataset_id": "f8e7d3b2-1234-5678-9abc-def012345678",
  "filename": "my_dataset.csv",
  "size_bytes": 51200,
  "status": "uploaded",
  "preview": [ ... ],
  "created_at": "2025-11-12T10:30:00Z"
}
```

### Via Python

```python
import requests

with open("my_dataset.csv", "rb") as f:
    files = {"file": f}
    response = requests.post(
        "http://localhost:8000/api/upload-dataset",
        files=files
    )

dataset_id = response.json()["dataset_id"]
print(f"Dataset uploaded: {dataset_id}")
```

---

## Selecting a Model

### Available Models

Sienn-AI provides pre-configured models optimized for different use cases:

#### Qwen 2.5 0.5B (Ultra Light) ⚡

- **VRAM**: 2GB
- **Quality**: ⭐⭐⭐
- **Speed**: ⭐⭐⭐⭐⭐
- **Use Case**: Testing, rapid iteration, simple tasks
- **Training Time**: ~5-10 minutes for 100 examples

#### Qwen 2.5 1.5B (Light) 🎯

- **VRAM**: 4GB
- **Quality**: ⭐⭐⭐⭐
- **Speed**: ⭐⭐⭐⭐
- **Use Case**: Most common use cases, balanced performance
- **Training Time**: ~10-20 minutes for 100 examples

#### Qwen 2.5 3B (Medium) 💪

- **VRAM**: 8GB
- **Quality**: ⭐⭐⭐⭐⭐
- **Speed**: ⭐⭐⭐
- **Use Case**: High-quality responses, complex tasks
- **Training Time**: ~20-40 minutes for 100 examples

#### Qwen 2.5 7B (Large) 🚀

- **VRAM**: 16GB
- **Quality**: ⭐⭐⭐⭐⭐
- **Speed**: ⭐⭐
- **Use Case**: Best quality, production deployments
- **Training Time**: ~40-80 minutes for 100 examples

### Model Selection Guide

#### Starting Out?
→ Use **Qwen 2.5 0.5B** for quick testing

#### Building a Chatbot?
→ Use **Qwen 2.5 1.5B** for balanced quality

#### Need High Quality?
→ Use **Qwen 2.5 3B** for better responses

#### Production Deployment?
→ Use **Qwen 2.5 7B** for best results

### Checking Model Cache

Models are automatically cached after first use:

```bash
# Check cached models
curl http://localhost:8000/api/models/available
```

Cached models train faster (no download time).

---

## Starting Training

### Via Web Interface

1. **Go to Training page**

2. **Select your dataset**
   - Choose from uploaded datasets

3. **Choose a model**
   - Select based on your needs (see above)

4. **Configure parameters**

   **Learning Rate** (default: 0.0002)
   - Lower (0.0001): Slower, more stable
   - Higher (0.0005): Faster, may be unstable

   **Number of Epochs** (default: 3)
   - More epochs: Better learning, risk of overfitting
   - Fewer epochs: Faster training, may underfit
   - Recommended: 3-5 epochs

   **Batch Size** (default: 4)
   - Larger: Faster training, more VRAM needed
   - Smaller: Slower training, less VRAM needed
   - Adjust based on your GPU

   **Max Sequence Length** (default: 512)
   - Longer: Handles longer texts, more VRAM
   - Shorter: Faster training, less context
   - Typical: 256-1024 tokens

5. **Start Training**
   - Click "Start Fine-tuning"
   - Job is submitted to queue
   - You receive a Job ID

### Via API

```bash
curl -X POST http://localhost:8000/api/start-finetuning \
  -H "Content-Type: application/json" \
  -d '{
    "dataset_id": "f8e7d3b2-...",
    "model_name": "Qwen/Qwen2.5-1.5B-Instruct",
    "learning_rate": 0.0002,
    "num_epochs": 3,
    "batch_size": 4,
    "max_length": 512
  }'
```

### Via Python

```python
import requests

config = {
    "dataset_id": "f8e7d3b2-...",
    "model_name": "Qwen/Qwen2.5-1.5B-Instruct",
    "learning_rate": 0.0002,
    "num_epochs": 3,
    "batch_size": 4,
    "max_length": 512
}

response = requests.post(
    "http://localhost:8000/api/start-finetuning",
    json=config
)

job_id = response.json()["job_id"]
print(f"Training started: {job_id}")
```

### Parameter Tuning Guide

#### For Small Datasets (< 100 examples)
```json
{
  "learning_rate": 0.0003,
  "num_epochs": 5,
  "batch_size": 2
}
```

#### For Medium Datasets (100-500 examples)
```json
{
  "learning_rate": 0.0002,
  "num_epochs": 3,
  "batch_size": 4
}
```

#### For Large Datasets (500+ examples)
```json
{
  "learning_rate": 0.0001,
  "num_epochs": 2,
  "batch_size": 8
}
```

---

## Monitoring Progress

### Via Web Interface

1. **Go to Monitoring page**
   - See all jobs in one place

2. **View job details**
   - Status: Pending, Running, Completed, Failed
   - Progress: 0-100%
   - Current epoch
   - Training loss
   - Time elapsed

3. **Real-time updates**
   - Page auto-refreshes every 10 seconds
   - Notifications for completion/errors

### Via API

```bash
# Check status
curl http://localhost:8000/api/training-status/{job_id}
```

Response:
```json
{
  "job_id": "a1b2c3d4-...",
  "status": "running",
  "progress": 65,
  "message": "Training in progress: Epoch 2/3",
  "created_at": "2025-11-12T10:30:00Z",
  "updated_at": "2025-11-12T10:35:00Z",
  "meta": {
    "model_name": "Qwen/Qwen2.5-1.5B-Instruct",
    "current_epoch": 2,
    "total_epochs": 3,
    "current_loss": 0.523
  }
}
```

### Via Python (Polling)

```python
import time
import requests

def wait_for_completion(job_id):
    while True:
        resp = requests.get(
            f"http://localhost:8000/api/training-status/{job_id}"
        )
        data = resp.json()
        
        status = data['status']
        progress = data['progress']
        
        print(f"{status}: {progress}%")
        
        if status in ['completed', 'failed']:
            return data
        
        time.sleep(10)  # Check every 10 seconds

result = wait_for_completion("a1b2c3d4-...")
print(f"Final status: {result['status']}")
```

### Understanding Training Metrics

**Loss**: Measure of model error
- Starts high (e.g., 2.5)
- Should decrease over time
- Good: < 0.5 by end
- Excellent: < 0.2 by end

**Progress**: Percentage complete
- Based on current epoch and step
- Linear progression expected

**Time Elapsed**: Total training time
- Varies by model size and dataset
- See model selection guide for estimates

---

## Testing Your Model

### Via Web Interface

1. **Go to Inference page**

2. **Select completed job**
   - Only completed jobs available

3. **Enter your prompt**
   - Type your input text

4. **Configure generation**
   - Max tokens (50-2000)
   - Temperature (0.1-2.0)
   - Top-p (0.1-1.0)

5. **Generate response**
   - Click "Generate"
   - View output
   - Copy or regenerate

### Via API

```bash
curl -X POST http://localhost:8000/api/test-model \
  -H "Content-Type: application/json" \
  -d '{
    "job_id": "a1b2c3d4-...",
    "prompt": "What is machine learning?",
    "max_new_tokens": 200,
    "temperature": 0.7
  }'
```

Response:
```json
{
  "job_id": "a1b2c3d4-...",
  "prompt": "What is machine learning?",
  "generated_text": "Machine learning is a branch of artificial intelligence...",
  "generation_time": 2.34,
  "timestamp": "2025-11-12T11:00:00Z"
}
```

### Via Python

```python
import requests

def test_model(job_id, prompt):
    response = requests.post(
        "http://localhost:8000/api/test-model",
        json={
            "job_id": job_id,
            "prompt": prompt,
            "max_new_tokens": 200,
            "temperature": 0.7
        }
    )
    return response.json()["generated_text"]

# Test your model
result = test_model("a1b2c3d4-...", "What is Python?")
print(result)
```

### Generation Parameters Guide

#### Temperature (Creativity)

- **0.1-0.3**: Deterministic, focused
  - Use for: Facts, translations, code
  
- **0.7-0.9**: Balanced, natural
  - Use for: Chatbots, Q&A, general text
  
- **1.0-2.0**: Creative, diverse
  - Use for: Stories, brainstorming, poetry

#### Max New Tokens (Length)

- **50-100**: Short answers
- **200-500**: Medium responses
- **500-1000**: Long-form content
- **1000+**: Essays, articles

#### Top-p (Nucleus Sampling)

- **0.9-0.95**: Standard (recommended)
- **0.95-1.0**: More diverse
- **0.8-0.9**: More focused

---

## Exporting Models

### Export Formats

#### 1. ZIP Archive (Universal)

Download complete model:
```bash
curl -X GET http://localhost:8000/api/download-model/a1b2c3d4-... \
  -o model.zip
```

Contains:
- LoRA adapter weights
- Tokenizer files
- Configuration files

#### 2. Ollama Format (Local Deployment)

Export for Ollama:
```bash
curl -X POST http://localhost:8000/api/export-model/a1b2c3d4-... \
  -H "Content-Type: application/json" \
  -d '{
    "format": "ollama",
    "model_name": "my-chatbot"
  }'
```

Then use with Ollama:
```bash
ollama create my-chatbot -f Modelfile
ollama run my-chatbot
```

#### 3. HuggingFace Format (Sharing)

Export for HuggingFace:
```bash
curl -X POST http://localhost:8000/api/export-model/a1b2c3d4-... \
  -H "Content-Type: application/json" \
  -d '{"format": "huggingface"}'
```

Upload to HuggingFace Hub:
```bash
huggingface-cli upload my-username/my-model ./exported_model
```

#### 4. GGUF Format (llama.cpp) [Coming Soon]

Quantized format for efficient inference.

### Using Exported Models

#### With Ollama

1. Export model:
   ```bash
   # Via web interface or API
   ```

2. Create Ollama model:
   ```bash
   ollama create my-model -f /path/to/Modelfile
   ```

3. Run locally:
   ```bash
   ollama run my-model "What is Python?"
   ```

#### With HuggingFace

1. Load in Python:
   ```python
   from transformers import AutoModelForCausalLM, AutoTokenizer
   from peft import PeftModel
   
   base_model = AutoModelForCausalLM.from_pretrained("Qwen/Qwen2.5-1.5B-Instruct")
   model = PeftModel.from_pretrained(base_model, "./exported_model")
   tokenizer = AutoTokenizer.from_pretrained("./exported_model")
   
   # Generate text
   inputs = tokenizer("What is Python?", return_tensors="pt")
   outputs = model.generate(**inputs, max_new_tokens=200)
   print(tokenizer.decode(outputs[0]))
   ```

#### In Production

Deploy with:
- FastAPI/Flask for REST API
- Ollama for local inference
- vLLM for high-throughput serving
- TGI (Text Generation Inference) for scalability

---

## Best Practices

### Dataset Preparation

1. **Quality over quantity**
   - 100 good examples > 1000 poor examples

2. **Diverse examples**
   - Cover different aspects of your use case

3. **Consistent format**
   - Same structure across all examples

4. **Clear instructions**
   - Be specific in prompts

5. **Accurate responses**
   - Verify all responses are correct

### Training Configuration

1. **Start small**
   - Use smallest model for testing
   - Scale up for production

2. **Monitor loss**
   - Should steadily decrease
   - If increasing, reduce learning rate

3. **Avoid overfitting**
   - Don't train too many epochs
   - Use diverse dataset

4. **Adjust batch size**
   - Based on available VRAM
   - Larger = faster (if VRAM allows)

### Model Testing

1. **Test thoroughly**
   - Try edge cases
   - Test with unseen examples

2. **Compare outputs**
   - Before vs after fine-tuning
   - Different models/parameters

3. **Evaluate quality**
   - Accuracy
   - Relevance
   - Coherence
   - Consistency

### Deployment

1. **Version control**
   - Track model versions
   - Document training parameters

2. **Monitor performance**
   - Response quality
   - Latency
   - Error rates

3. **Iterate**
   - Collect feedback
   - Retrain with new data
   - Improve continuously

---

## Troubleshooting

### Common Issues

#### Training Fails Immediately

**Symptoms**: Job status goes to "failed" right away

**Causes**:
- Invalid dataset format
- Corrupted file
- Insufficient VRAM

**Solutions**:
1. Check dataset format (CSV/JSON/JSONL)
2. Verify file isn't corrupted
3. Use smaller model or reduce batch size
4. Check logs: `docker compose logs worker`

#### Training Loss Not Decreasing

**Symptoms**: Loss stays high or increases

**Causes**:
- Learning rate too high
- Dataset quality issues
- Model/data mismatch

**Solutions**:
1. Reduce learning rate (try 0.0001)
2. Review dataset quality
3. Increase number of epochs
4. Use more diverse training data

#### Model Generates Nonsense

**Symptoms**: Output is gibberish or off-topic

**Causes**:
- Not enough training
- Poor dataset quality
- Wrong generation parameters

**Solutions**:
1. Train for more epochs
2. Improve dataset quality
3. Adjust temperature (try 0.7)
4. Check if model completed training

#### Out of Memory (OOM) Error

**Symptoms**: Training crashes with CUDA OOM

**Solutions**:
1. Reduce batch size (try 2 or 1)
2. Reduce max_length (try 256)
3. Use smaller model
4. Close other GPU applications
5. Check: `nvidia-smi`

#### Slow Training

**Symptoms**: Training takes very long

**Causes**:
- Large model
- Large dataset
- No GPU acceleration

**Solutions**:
1. Use smaller model for testing
2. Reduce dataset size
3. Verify GPU is being used
4. Increase batch size (if VRAM allows)
5. Check: `docker compose logs worker`

### Getting Help

1. **Check logs**:
   ```bash
   docker compose logs api
   docker compose logs worker
   docker compose logs frontend
   ```

2. **System health**:
   ```bash
   curl http://localhost:8000/api/health/services
   ```

3. **GitHub Issues**:
   - [Report a bug](https://github.com/doriansenecot/Sienn-AI/issues/new?template=bug_report.md)
   - [Request a feature](https://github.com/doriansenecot/Sienn-AI/issues/new?template=feature_request.md)

4. **Community**:
   - [Discussions](https://github.com/doriansenecot/Sienn-AI/discussions)
   - [FAQ](FAQ.md)

---

## Advanced Topics

### Custom Model Configuration

Edit `backend/app/services/finetuning_service.py`:

```python
MODEL_CONFIGS = {
    "custom-model": ModelConfig(
        name="your-org/your-model",
        display_name="Custom Model",
        vram_required_gb=8,
        quality_rating=4,
        speed_rating=4,
        batch_size=4,
        max_length=1024,
        learning_rate=0.0002,
        description="Your custom model description"
    )
}
```

### Using Your Own Base Model

1. Add model to HuggingFace cache
2. Update MODEL_CONFIGS
3. Restart services:
   ```bash
   docker compose restart
   ```

### Optimizing for GPU

```python
# Increase batch size (more VRAM)
batch_size = 8

# Enable gradient checkpointing (save VRAM)
gradient_checkpointing = True

# Use mixed precision (faster)
fp16 = True  # For older GPUs
bf16 = True  # For newer GPUs (A100, H100)
```

### Multi-GPU Training

Coming in v0.3.0 - distributed training support.

### Custom LoRA Configuration

Adjust in training parameters:

```python
lora_config = {
    "r": 16,  # LoRA rank (higher = more capacity)
    "lora_alpha": 32,  # LoRA scaling
    "lora_dropout": 0.1,  # Dropout for regularization
    "target_modules": ["q_proj", "v_proj"]  # Which layers to adapt
}
```

### Integration with Your Application

```python
# Example: REST API wrapper
from fastapi import FastAPI
import requests

app = FastAPI()

SIENN_API = "http://localhost:8000"
MODEL_JOB_ID = "your-trained-model-job-id"

@app.post("/chat")
async def chat(message: str):
    response = requests.post(
        f"{SIENN_API}/api/test-model",
        json={
            "job_id": MODEL_JOB_ID,
            "prompt": message,
            "max_new_tokens": 200,
            "temperature": 0.7
        }
    )
    return {"response": response.json()["generated_text"]}
```

---

## Next Steps

### Continue Learning

- [API Documentation](API_DOCUMENTATION.md) - Full API reference
- [FAQ](FAQ.md) - Common questions
- [Contributing](../CONTRIBUTING.md) - Contribute to the project

### Community

- ⭐ Star the repo on [GitHub](https://github.com/doriansenecot/Sienn-AI)
- 💬 Join discussions
- 🐛 Report bugs
- 💡 Suggest features

### Stay Updated

- Watch the repository for releases
- Check [CHANGELOG](../CHANGELOG.md) for updates
- Follow best practices as they evolve

---

**Happy Fine-tuning! 🚀**

For questions or support, visit our [GitHub repository](https://github.com/doriansenecot/Sienn-AI).

---

**Last Updated**: November 2025  
**Version**: 0.2.0
