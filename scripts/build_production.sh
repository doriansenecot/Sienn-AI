#!/bin/bash
# Production build script for Sienn-AI

set -e  # Exit on error

echo "🚀 Starting Sienn-AI Production Build"
echo "======================================"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if running from project root
if [ ! -f "docker-compose.yml" ]; then
    echo -e "${RED}Error: Must run from project root${NC}"
    exit 1
fi

# Step 1: Backend linting
echo ""
echo -e "${YELLOW}📋 Step 1/3: Backend Linting${NC}"
cd backend
python -m ruff check app/ || { echo -e "${RED}Linting failed${NC}"; exit 1; }
python -m black --check app/ || { echo -e "${RED}Code formatting failed${NC}"; exit 1; }
echo -e "${GREEN}✅ Backend linting passed${NC}"
cd ..

# Step 2: Frontend build
echo ""
echo -e "${YELLOW}🏗️  Step 2/3: Frontend Build${NC}"
cd frontend
npm run build || { echo -e "${RED}Frontend build failed${NC}"; exit 1; }
echo -e "${GREEN}✅ Frontend built successfully${NC}"
cd ..

# Step 3: Docker images build
echo ""
echo -e "${YELLOW}🐳 Step 3/3: Docker Images Build${NC}"

echo "Building backend image..."
docker build -t sienn-ai-backend:latest -f backend/Dockerfile backend/ || { echo -e "${RED}Backend image build failed${NC}"; exit 1; }

echo "Building worker image..."
docker build -t sienn-ai-worker:latest -f backend/Dockerfile.worker backend/ || { echo -e "${RED}Worker image build failed${NC}"; exit 1; }

echo "Building frontend image..."
docker build -t sienn-ai-frontend:latest -f frontend/Dockerfile frontend/ || { echo -e "${RED}Frontend image build failed${NC}"; exit 1; }

echo -e "${GREEN}✅ Docker images built successfully${NC}"

# Summary
echo ""
echo "======================================"
echo -e "${GREEN}🎉 Production Build Completed!${NC}"
echo "======================================"
echo ""
echo "Built artifacts:"
echo "  - Frontend: frontend/dist/"
echo "  - Docker images:"
echo "    • sienn-ai-backend:latest"
echo "    • sienn-ai-worker:latest"
echo "    • sienn-ai-frontend:latest"
echo ""
echo "To deploy:"
echo "  docker-compose up -d"
echo ""
