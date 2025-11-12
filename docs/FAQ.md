# Frequently Asked Questions (FAQ)

## Table of Contents

- [General Questions](#general-questions)
- [Installation & Setup](#installation--setup)
- [Training & Models](#training--models)
- [Technical Questions](#technical-questions)
- [Troubleshooting](#troubleshooting)

---

## General Questions

### What is Sienn-AI?

Sienn-AI is a complete platform for fine-tuning large language models using LoRA (Low-Rank Adaptation) technique. It provides both a web interface and REST API for training, testing, and deploying AI models efficiently.

### What is LoRA?

LoRA (Low-Rank Adaptation) is a parameter-efficient fine-tuning method that trains only 3-5% of model parameters, drastically reducing computational requirements while maintaining quality. Instead of updating all model weights, LoRA adds small trainable rank decomposition matrices.

### Is Sienn-AI free to use?

Yes! Sienn-AI is open-source under the MIT License. You can use it freely for personal or commercial projects.

### Do I need a GPU?

No, but it's recommended. Training will work on CPU but will be significantly slower. For production use, we recommend:
- **Minimum**: 8GB RAM, CPU training
- **Recommended**: 16GB RAM + NVIDIA GPU (8GB+ VRAM)
- **Optimal**: 32GB RAM + NVIDIA GPU (16GB+ VRAM)

### What models are supported?

Currently supported:
- **GPT-2** (124M, 355M, 774M, 1.5B parameters)
- **Microsoft Phi-2** (2.7B parameters)

Coming soon: Llama 2, Mistral, CodeLlama, Falcon

### Can I use my own model?

Yes! You can add custom models by:
1. Creating a model config in `backend/app/services/finetuning_service.py`
2. Specifying HuggingFace model ID
3. Configuring LoRA parameters

---

## Installation & Setup

### How long does installation take?

- **Docker (recommended)**: 5-10 minutes
- **Manual setup**: 15-30 minutes
- **First model download**: 5-20 minutes (depending on model size)

### What are the minimum system requirements?

- **OS**: Linux, macOS, or Windows with WSL2
- **RAM**: 8GB minimum (16GB recommended)
- **Storage**: 20GB free space
- **Docker**: Version 20.10+
- **Internet**: For downloading models

### Can I run this on Windows?

Yes, using:
1. **WSL2 + Docker Desktop** (recommended)
2. **Docker Desktop with Hyper-V**
3. **Native Python** (advanced users)

See [Installation Guide](INSTALLATION.md) for details.

### How do I update Sienn-AI?

```bash
git pull origin main
docker compose down
docker compose up --build -d
```

### Where is data stored?

- **Database**: `data/data.db` (SQLite)
- **Models**: `data/models/`
- **Datasets**: `data/uploads/`
- **Exports**: `data/exports/`
- **Logs**: `data/logs/`

---

## Training & Models

### How long does training take?

Depends on:
- **Model size**: GPT-2 (faster) vs Phi-2 (slower)
- **Dataset size**: 100 samples (minutes) vs 10,000 (hours)
- **Hardware**: GPU (faster) vs CPU (slower)
- **Epochs**: 3 epochs (standard) vs 10 (longer)

**Typical times (GPT-2, 1000 samples, 3 epochs):**
- CPU: 30-60 minutes
- GPU (RTX 3060): 5-10 minutes
- GPU (A100): 2-3 minutes

### What dataset format should I use?

Supported formats:
- **CSV**: instruction, input, output columns
- **JSON**: Array of {"instruction", "input", "output"} objects
- **JSONL**: One JSON object per line

**Example CSV:**
```csv
instruction,input,output
"Translate to French","Hello","Bonjour"
"Write code","Sort array","def sort(arr): return sorted(arr)"
```

### How many training examples do I need?

- **Minimum**: 50-100 examples
- **Recommended**: 500-1000 examples
- **Optimal**: 5000+ examples

Quality > Quantity. 100 high-quality examples > 1000 poor ones.

### What are good hyperparameters?

**For beginners:**
```json
{
  "model_name": "gpt2",
  "num_epochs": 3,
  "batch_size": 4,
  "learning_rate": 0.0002
}
```

**For better quality (slower):**
```json
{
  "model_name": "gpt2-medium",
  "num_epochs": 5,
  "batch_size": 2,
  "learning_rate": 0.0001
}
```

### Can I pause/resume training?

Not yet. This feature is on the roadmap. For now, training must complete or be cancelled.

### How do I improve model quality?

1. **More/better data**: Quality training examples
2. **More epochs**: Try 5-10 instead of 3
3. **Larger model**: gpt2-medium or gpt2-large
4. **Lower learning rate**: 0.0001 instead of 0.0002
5. **Longer sequences**: max_length 1024 or 2048

### How do I export my model?

Three formats available:
1. **PyTorch** (.pt): For Python/PyTorch usage
2. **Ollama** (Modelfile): For Ollama integration
3. **GGUF** (quantized): For llama.cpp, lighter weight

```bash
# Via API
curl -X POST http://localhost:8000/api/export-model/JOB_ID \
  -H "Content-Type: application/json" \
  -d '{"format": "gguf", "quantization": "q4_k_m"}'
```

---

## Technical Questions

### What is the architecture?

```
Frontend (React) → API (FastAPI) → Worker (Celery)
                         ↓              ↓
                      Redis         MinIO
                         ↓
                      SQLite
```

- **Frontend**: Modern React UI
- **API**: FastAPI for REST endpoints
- **Worker**: Celery for async training
- **Redis**: Message queue
- **MinIO**: Model storage
- **SQLite**: Metadata

### Can I scale horizontally?

Yes! You can run multiple workers:

```bash
# Start 4 workers
docker compose up --scale worker=4
```

### Is there an API?

Yes! Full REST API with:
- Swagger docs at http://localhost:8000/docs
- ReDoc at http://localhost:8000/redoc
- 12 main endpoints for all operations

### Can I integrate with my app?

Absolutely! Use the REST API from any language:

**Python:**
```python
import requests
response = requests.post('http://localhost:8000/api/test-model', 
    json={'job_id': 'abc', 'prompt': 'Hello'})
```

**JavaScript:**
```javascript
fetch('http://localhost:8000/api/test-model', {
  method: 'POST',
  headers: {'Content-Type': 'application/json'},
  body: JSON.stringify({job_id: 'abc', prompt: 'Hello'})
})
```

### Does it support webhooks?

Not yet. Planned for v0.3.0. You can poll the `/api/training-status/{job_id}` endpoint.

### Can I use my own storage?

Yes, MinIO is S3-compatible. You can configure to use:
- AWS S3
- Google Cloud Storage
- Azure Blob Storage
- Any S3-compatible service

---

## Troubleshooting

### Training gets stuck at 0%

**Causes:**
1. Worker not running
2. Redis connection failed
3. Dataset file corrupted

**Solutions:**
```bash
# Check worker
docker compose logs worker

# Restart worker
docker compose restart worker

# Check Redis
docker compose ps redis
```

### Out of memory error

**Solutions:**
1. Reduce batch_size to 1 or 2
2. Use smaller model (gpt2 instead of gpt2-medium)
3. Reduce max_length
4. Close other applications
5. Add swap space (Linux)

### Model generation is nonsense

**Possible reasons:**
1. Not enough training data
2. Too few epochs
3. Learning rate too high
4. Poor quality training data

**Solutions:**
- Train for more epochs (5-10)
- Use more training examples (500+)
- Lower learning rate (0.0001)
- Improve training data quality

### Docker container keeps crashing

**Check logs:**
```bash
docker compose logs api
docker compose logs worker
```

**Common issues:**
- Port conflict (8000, 3000 already in use)
- Insufficient memory
- Corrupted image (rebuild with `--no-cache`)

### Frontend shows "Network Error"

**Check:**
1. Backend is running: `curl http://localhost:8000/health`
2. CORS configured correctly
3. Firewall not blocking
4. Browser console for errors

### Can't connect to Redis

**Solutions:**
```bash
# Test Redis
docker compose exec redis redis-cli ping

# Should return: PONG

# Restart Redis
docker compose restart redis
```

### GPU not detected

**Check:**
```bash
# NVIDIA driver
nvidia-smi

# PyTorch CUDA
python -c "import torch; print(torch.cuda.is_available())"
```

**Fix:**
Install CUDA-enabled PyTorch:
```bash
pip install torch --index-url https://download.pytorch.org/whl/cu118
```

---

## Still Have Questions?

- **📖 Documentation**: [docs/](.)
- **💬 Issues**: [GitHub Issues](https://github.com/doriansenecot/Sienn-AI/issues)
- **📧 Contact**: Via GitHub profile

---

**Don't see your question? [Open an issue](https://github.com/doriansenecot/Sienn-AI/issues/new)!**
