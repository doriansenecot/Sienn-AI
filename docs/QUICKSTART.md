# Quick Start Guide

Get started with Sienn-AI in 5 minutes!

## 🚀 5-Minute Setup

### 1. Clone & Start

```bash
git clone https://github.com/doriansenecot/Sienn-AI.git
cd Sienn-AI
cp .env.example .env
docker compose up -d
```

### 2. Access the Platform

- **Frontend**: http://localhost:3000
- **API Docs**: http://localhost:8000/docs
- **MinIO Console**: http://localhost:9001

### 3. Upload Your First Dataset

Visit http://localhost:3000/upload or use the API:

```bash
curl -X POST http://localhost:8000/api/upload-dataset \
  -F "file=@your_data.csv"
```

**Dataset format (CSV example):**
```csv
instruction,input,output
"Write a greeting","","Hello! How can I help you today?"
"Translate to French","Hello","Bonjour"
```

### 4. Start Training

Go to http://localhost:3000/training or:

```bash
curl -X POST http://localhost:8000/api/start-finetuning \
  -H "Content-Type: application/json" \
  -d '{
    "dataset_id": "YOUR_DATASET_ID",
    "model_name": "gpt2",
    "num_epochs": 3,
    "batch_size": 4
  }'
```

### 5. Monitor Progress

Check http://localhost:3000/dashboard to see:
- Training progress (0-100%)
- Current status
- System metrics

### 6. Test Your Model

Once training is complete:

```bash
curl -X POST http://localhost:8000/api/test-model \
  -H "Content-Type: application/json" \
  -d '{
    "job_id": "YOUR_JOB_ID",
    "prompt": "Write a Python function",
    "max_new_tokens": 100
  }'
```

---

## 🎯 Common Use Cases

### Fine-tune for Chatbot

**Dataset (JSONL):**
```jsonl
{"instruction": "greeting", "input": "", "output": "Hello! I'm your AI assistant."}
{"instruction": "help", "input": "", "output": "I can help you with coding, writing, and more!"}
```

**Config:**
```json
{
  "model_name": "gpt2",
  "num_epochs": 5,
  "batch_size": 4,
  "learning_rate": 0.0002
}
```

### Fine-tune for Code Generation

**Dataset (CSV):**
```csv
instruction,input,output
"Write Python function","Calculate fibonacci","def fib(n): ..."
"Debug code","Fix syntax error","The issue is..."
```

**Config:**
```json
{
  "model_name": "gpt2-medium",
  "num_epochs": 3,
  "batch_size": 2,
  "max_length": 1024
}
```

### Fine-tune for Translation

**Dataset (JSON):**
```json
[
  {"instruction": "translate en-fr", "input": "Hello", "output": "Bonjour"},
  {"instruction": "translate en-fr", "input": "Thank you", "output": "Merci"}
]
```

---

## 🛠️ Useful Commands

```bash
# View all services
docker compose ps

# View logs
docker compose logs -f api
docker compose logs -f worker

# Restart service
docker compose restart api

# Stop all
docker compose down

# Health check
curl http://localhost:8000/health

# List jobs
curl http://localhost:8000/api/jobs

# Get metrics
curl http://localhost:8000/api/metrics
```

---

## 📖 Next Steps

- **[Installation Guide](INSTALLATION.md)** - Detailed setup
- **[User Guide](USER_GUIDE.md)** - Complete walkthrough
- **[API Documentation](API_DOCUMENTATION.md)** - Full API reference
- **[Troubleshooting](INSTALLATION.md#troubleshooting)** - Common issues

---

## 💡 Tips

1. **Start small**: Use `gpt2` with 3 epochs for testing
2. **Monitor resources**: Check `docker stats` for memory/CPU usage
3. **Save your work**: Export models in multiple formats
4. **Test iteratively**: Fine-tune → test → adjust → repeat

---

**Questions?** Open an [issue](https://github.com/doriansenecot/Sienn-AI/issues) or check the [docs](.)!
