# Sienn-AI 🤖

<div align="center">

**A Modern AI Fine-tuning Platform with LoRA/PEFT**

[![CI/CD](https://github.com/doriansenecot/Sienn-AI/actions/workflows/ci.yml/badge.svg)](https://github.com/doriansenecot/Sienn-AI/actions)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Python](https://img.shields.io/badge/python-3.9+-blue.svg)](https://www.python.org/downloads/)
[![Docker](https://img.shields.io/badge/docker-ready-blue.svg)](https://www.docker.com/)

[Features](#features) • [Quick Start](#quick-start) • [Documentation](#documentation) • [Architecture](#architecture) • [Contributing](#contributing)

</div>

---

## 🎯 Overview

Sienn-AI is a complete, production-ready platform for fine-tuning large language models using **LoRA (Low-Rank Adaptation)** technique. Built with modern technologies, it provides an intuitive web interface and powerful API for training, testing, and deploying AI models efficiently.

### Why Sienn-AI?

- 🚀 **Fast & Efficient**: LoRA trains only 3-5% of parameters, saving time and resources
- 💻 **User-Friendly**: Beautiful React UI with real-time progress tracking
- 🔧 **Flexible**: Support for GPT-2, Phi-2, and other popular models
- 📦 **Production-Ready**: Docker-based deployment, async job processing, multiple export formats
- 🎨 **Modern Stack**: FastAPI, React, Celery, Redis, MinIO, SQLite

---

## ✨ Features

### Core Functionality
- ✅ **Dataset Management**: Upload and validate CSV, JSON, JSONL datasets
- ✅ **Fine-tuning**: Train models with configurable LoRA parameters
- ✅ **Async Processing**: Background training with Celery workers
- ✅ **Real-time Monitoring**: Track progress, metrics, and logs
- ✅ **Model Testing**: Interactive inference with custom prompts
- ✅ **Export Formats**: PyTorch, Ollama, GGUF (quantized)

### Technical Features
- 🔄 **Job Queue**: Redis-backed Celery for reliable task processing
- 📊 **Metrics**: System health, training stats, resource monitoring
- 🗄️ **Storage**: MinIO for scalable model storage
- 🐳 **Containerized**: Complete Docker Compose setup
- 🧪 **Tested**: Unit tests with pytest, CI/CD with GitHub Actions
- 📝 **Documented**: Comprehensive API docs and user guide

---

## 🚀 Quick Start

### Prerequisites
- Docker & Docker Compose
- 8GB+ RAM (16GB recommended)
- GPU optional (CUDA-enabled for faster training)

### Installation

```bash
# Clone the repository
git clone https://github.com/doriansenecot/Sienn-AI.git
cd Sienn-AI

# Configure environment
cp .env.example .env

# Start all services
docker-compose up -d

# Access the application
# Frontend: http://localhost:3000
# API: http://localhost:8000
# API Docs: http://localhost:8000/docs
```

### First Training

1. **Upload a Dataset** (CSV, JSON, or JSONL)
   ```bash
   curl -X POST http://localhost:8000/api/upload-dataset \
     -F "file=@your_dataset.csv"
   ```

2. **Start Training**
   ```bash
   curl -X POST http://localhost:8000/api/start-finetuning \
     -H "Content-Type: application/json" \
     -d '{
       "dataset_id": "your_dataset_id",
       "model_name": "gpt2",
       "config": {
         "num_epochs": 3,
         "batch_size": 4
       }
     }'
   ```

3. **Monitor Progress**
   - Visit the Dashboard at http://localhost:3000/dashboard
   - Or check API: `curl http://localhost:8000/api/training-status/{job_id}`

4. **Test Your Model**
   - Use the Inference page or API to test with custom prompts

---

## 📚 Documentation

- **[User Guide](docs/USER_GUIDE.md)**: Complete walkthrough from dataset to deployment
- **[API Documentation](docs/API_DOCUMENTATION.md)**: Full API reference with examples
- **[Architecture](docs/contexte/ARCHITECTURE.md)**: System design and components
- **[Roadmap](docs/contexte/ROADMAP.md)**: Future features and plans

---

## 🏗️ Architecture

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│   Frontend      │────▶│   Backend API    │────▶│  Celery Worker  │
│   (React)       │     │   (FastAPI)      │     │  (Training)     │
└─────────────────┘     └──────────────────┘     └─────────────────┘
                               │                          │
                               ▼                          ▼
                        ┌──────────────┐          ┌──────────────┐
                        │    Redis     │          │    MinIO     │
                        │   (Queue)    │          │  (Storage)   │
                        └──────────────┘          └──────────────┘
                               │
                               ▼
                        ┌──────────────┐
                        │   SQLite     │
                        │  (Metadata)  │
                        └──────────────┘
```

### Tech Stack

**Backend**
- FastAPI (REST API)
- Celery (Async tasks)
- Redis (Message broker)
- SQLite (Database)
- MinIO (Object storage)
- Transformers + PEFT (ML)

**Frontend**
- React 18 + TypeScript
- Vite (Build tool)
- TailwindCSS (Styling)
- React Query (Data fetching)
- Zustand (State management)

**DevOps**
- Docker & Docker Compose
- GitHub Actions (CI/CD)
- Pytest (Testing)
- Ruff + Black (Linting)

---

## 🎓 Supported Models

| Model | Size | Best For | Speed |
|-------|------|----------|-------|
| GPT-2 | 124M | Experiments, text | ⚡⚡⚡ |
| GPT-2 Medium | 355M | General tasks | ⚡⚡ |
| GPT-2 Large | 774M | Quality text | ⚡ |
| Microsoft Phi-2 | 2.7B | Code, reasoning | ⚡ |

More models coming soon: Llama 2, Mistral, CodeLlama...

---

## 💡 Usage Examples

### Python API Client

```python
import requests

# Upload dataset
files = {'file': open('dataset.csv', 'rb')}
resp = requests.post('http://localhost:8000/api/upload-dataset', files=files)
dataset_id = resp.json()['dataset_id']

# Start training
config = {
    'dataset_id': dataset_id,
    'model_name': 'gpt2',
    'config': {
        'num_epochs': 3,
        'batch_size': 4,
        'learning_rate': 2e-5
    }
}
resp = requests.post('http://localhost:8000/api/start-finetuning', json=config)
job_id = resp.json()['job_id']

# Test model
prompt = {'job_id': job_id, 'prompt': 'Write a Python function'}
resp = requests.post('http://localhost:8000/api/test-model', json=prompt)
print(resp.json()['generated_text'])
```

### Web Interface

1. Navigate to http://localhost:3000
2. Upload your dataset via UI
3. Configure training parameters
4. Monitor real-time progress
5. Test with interactive prompts
6. Export in your preferred format

---

## 🛠️ Development

### Setup Local Environment

```bash
# Backend
cd backend
python -m venv .venv
source .venv/bin/activate  # or `.venv\Scripts\activate` on Windows
pip install -r requirements.txt

# Frontend
cd frontend
npm install
npm run dev
```

### Run Tests

```bash
# Backend tests
cd backend
pytest tests/unit/ -v --cov=app

# Linting
./scripts/lint.sh

# Frontend tests
cd frontend
npm run lint
npm run type-check
```

### Code Quality

```bash
# Python
ruff check app/
black app/

# TypeScript
npm run lint:fix
npm run format
```

---

## 🤝 Contributing

Contributions are welcome! Please:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

See [CONTRIBUTING.md](CONTRIBUTING.md) for detailed guidelines.

---

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- [Hugging Face Transformers](https://github.com/huggingface/transformers)
- [PEFT Library](https://github.com/huggingface/peft)
- [FastAPI](https://fastapi.tiangolo.com/)
- [React](https://react.dev/)

---

## 📧 Contact

- **Author**: Dorian Senecot
- **GitHub**: [@doriansenecot](https://github.com/doriansenecot)
- **Issues**: [GitHub Issues](https://github.com/doriansenecot/Sienn-AI/issues)

---

<div align="center">

**Made with ❤️ for the AI community**

⭐ Star us on GitHub if you find this useful!

</div>