# Installation Guide

Complete installation guide for Sienn-AI on different platforms.

## Table of Contents

- [System Requirements](#system-requirements)
- [Quick Installation (Docker)](#quick-installation-docker)
- [Manual Installation](#manual-installation)
- [Development Setup](#development-setup)
- [Production Deployment](#production-deployment)
- [Troubleshooting](#troubleshooting)

---

## System Requirements

### Minimum Requirements
- **OS**: Linux (Ubuntu 20.04+), macOS (12+), Windows 10/11 with WSL2
- **RAM**: 8GB (16GB recommended)
- **Storage**: 20GB free space
- **CPU**: 4 cores (8 recommended)
- **GPU**: Optional (NVIDIA with CUDA 11.8+ for faster training)

### Software Requirements
- Docker 20.10+ and Docker Compose 2.0+
- Python 3.9+ (for manual installation)
- Node.js 18+ (for frontend development)
- Git

---

## Quick Installation (Docker)

### 1. Clone the Repository

```bash
git clone https://github.com/doriansenecot/Sienn-AI.git
cd Sienn-AI
```

### 2. Configure Environment

```bash
# Copy environment template
cp .env.example .env

# Edit .env file (optional)
nano .env
```

**Key variables:**
```env
# Database
DATABASE_PATH=data/data.db

# Redis
REDIS_URL=redis://redis:6379/0

# MinIO
MINIO_ENDPOINT=minio:9000
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=minioadmin

# Logging
LOG_LEVEL=INFO
```

### 3. Start Services

```bash
# Start all services
docker compose up -d

# Check status
docker compose ps

# View logs
docker compose logs -f
```

### 4. Verify Installation

```bash
# Health check
curl http://localhost:8000/health

# API docs
open http://localhost:8000/docs

# Frontend
open http://localhost:3000
```

**Expected response:**
```json
{"status": "ok", "env": "development"}
```

### 5. Stop Services

```bash
# Stop all services
docker compose down

# Stop and remove volumes (⚠️ deletes data)
docker compose down -v
```

---

## Manual Installation

### Backend Setup

#### 1. Install Python Dependencies

```bash
cd backend

# Create virtual environment
python3 -m venv .venv

# Activate (Linux/macOS)
source .venv/bin/activate

# Activate (Windows)
.venv\Scripts\activate

# Install packages
pip install -r requirements.txt
```

#### 2. Install External Tools

**For GGUF export (optional):**
```bash
# Clone llama.cpp
git clone https://github.com/ggerganov/llama.cpp.git /opt/llama.cpp
cd /opt/llama.cpp
make

# Add to PATH
export PATH="/opt/llama.cpp:$PATH"
```

#### 3. Initialize Database

```bash
python scripts/init_db.py
```

#### 4. Start Services

**Terminal 1 - Redis:**
```bash
redis-server
```

**Terminal 2 - MinIO:**
```bash
minio server /tmp/minio-data --console-address ":9001"
```

**Terminal 3 - Backend API:**
```bash
cd backend
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

**Terminal 4 - Celery Worker:**
```bash
cd backend
celery -A app.celery_app worker --loglevel=info
```

**Terminal 5 - Celery Beat (optional):**
```bash
cd backend
celery -A app.celery_app beat --loglevel=info
```

### Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

---

## Development Setup

### With Hot Reload

**Backend:**
```bash
cd backend
uvicorn app.main:app --reload --port 8000
```

**Frontend:**
```bash
cd frontend
npm run dev
```

### With Docker (Development Mode)

```bash
# Start with live reload
docker compose -f docker-compose.yml up
```

### Running Tests

**Backend:**
```bash
cd backend
pytest tests/unit/ -v --cov=app
```

**Frontend:**
```bash
cd frontend
npm run test
npm run lint
npm run type-check
```

### Code Quality

**Backend:**
```bash
cd backend

# Format
black app/
ruff check app/ --fix

# Lint
ruff check app/

# Type check
mypy app/
```

**Frontend:**
```bash
cd frontend

# Format
npm run format

# Lint
npm run lint:fix

# Type check
npm run type-check
```

---

## Production Deployment

### Using Docker (Recommended)

#### 1. Configure for Production

```bash
# Create production .env
cp .env.example .env.production

# Edit production settings
nano .env.production
```

**Production settings:**
```env
ENVIRONMENT=production
LOG_LEVEL=INFO
ENABLE_JSON_LOGS=true
RATE_LIMIT_ENABLED=true
RATE_LIMIT_REQUESTS=100
RATE_LIMIT_WINDOW=60
```

#### 2. Build Production Images

```bash
# Build all images
make build

# Or manually
docker compose -f docker-compose.yml build
```

#### 3. Deploy

```bash
# Start in production mode
docker compose up -d

# Check health
make health

# View metrics
make metrics
```

#### 4. Configure Reverse Proxy (Nginx)

```nginx
# /etc/nginx/sites-available/sienn-ai
upstream backend {
    server localhost:8000;
}

upstream frontend {
    server localhost:3000;
}

server {
    listen 80;
    server_name sienn-ai.yourdomain.com;

    # Frontend
    location / {
        proxy_pass http://frontend;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    # API
    location /api {
        proxy_pass http://backend;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_read_timeout 300s;
    }

    # WebSocket support (if needed)
    location /ws {
        proxy_pass http://backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}
```

#### 5. Enable SSL (Let's Encrypt)

```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d sienn-ai.yourdomain.com
```

### Manual Production Deployment

#### 1. Backend

```bash
cd backend

# Install dependencies
pip install -r requirements.txt

# Run with gunicorn
gunicorn app.main:app \
    --workers 4 \
    --worker-class uvicorn.workers.UvicornWorker \
    --bind 0.0.0.0:8000 \
    --timeout 300 \
    --access-logfile logs/access.log \
    --error-logfile logs/error.log
```

#### 2. Frontend

```bash
cd frontend

# Build
npm run build

# Serve with nginx or node
npm install -g serve
serve -s dist -l 3000
```

#### 3. Process Manager (PM2)

```bash
# Install PM2
npm install -g pm2

# Start backend
pm2 start gunicorn \
    --name sienn-backend \
    -- app.main:app \
    --workers 4 \
    --worker-class uvicorn.workers.UvicornWorker \
    --bind 0.0.0.0:8000

# Start frontend
pm2 start serve \
    --name sienn-frontend \
    -- -s frontend/dist -l 3000

# Start Celery worker
pm2 start celery \
    --name sienn-worker \
    -- -A app.celery_app worker --loglevel=info

# Save configuration
pm2 save
pm2 startup
```

---

## Troubleshooting

### Common Issues

#### 1. Port Already in Use

```bash
# Find process using port
lsof -i :8000  # or :3000

# Kill process
kill -9 <PID>

# Or use different port
uvicorn app.main:app --port 8001
```

#### 2. Docker Permission Denied

```bash
# Add user to docker group
sudo usermod -aG docker $USER

# Re-login or
newgrp docker
```

#### 3. CUDA/GPU Not Detected

```bash
# Check NVIDIA driver
nvidia-smi

# Check PyTorch CUDA
python -c "import torch; print(torch.cuda.is_available())"

# Install CUDA-enabled PyTorch
pip install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cu118
```

#### 4. Out of Memory During Training

**Reduce batch size:**
```python
{
  "batch_size": 1,  # or 2
  "gradient_accumulation_steps": 8
}
```

**Use CPU instead:**
```bash
export CUDA_VISIBLE_DEVICES=""
```

#### 5. Redis Connection Failed

```bash
# Check Redis is running
redis-cli ping  # Should return PONG

# Check connection
telnet localhost 6379

# Restart Redis
docker compose restart redis
```

#### 6. MinIO Access Denied

```bash
# Check MinIO credentials in .env
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=minioadmin

# Access MinIO console
open http://localhost:9001
```

#### 7. Frontend Build Fails

```bash
# Clear cache
rm -rf node_modules package-lock.json
npm install

# Check Node version
node --version  # Should be 18+

# Update Node
nvm install 18
nvm use 18
```

### Getting Help

- **Logs**: Check `docker compose logs <service>`
- **Health**: Run `make health`
- **Issues**: [GitHub Issues](https://github.com/doriansenecot/Sienn-AI/issues)
- **Docs**: See [User Guide](USER_GUIDE.md)

---

## Next Steps

After installation:

1. **[User Guide](USER_GUIDE.md)** - Learn how to use Sienn-AI
2. **[API Documentation](API_DOCUMENTATION.md)** - Explore the API
3. **[Contributing](../CONTRIBUTING.md)** - Contribute to the project

---

**Happy Training! 🚀**
