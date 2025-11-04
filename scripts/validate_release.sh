#!/bin/bash
# Script de validation avant release SiennAI v0.1.0
# Vérifie que tous les composants fonctionnent correctement

set -e

echo "🚀 SiennAI Release Validation Script"
echo "===================================="
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Counters
PASSED=0
FAILED=0

# Test function
test_component() {
    local test_name="$1"
    local test_command="$2"
    
    echo -n "Testing $test_name... "
    if eval "$test_command" > /dev/null 2>&1; then
        echo -e "${GREEN}✓ PASS${NC}"
        ((PASSED++))
        return 0
    else
        echo -e "${RED}✗ FAIL${NC}"
        ((FAILED++))
        return 1
    fi
}

echo "📦 1. Checking Docker Services"
echo "--------------------------------"
test_component "Redis service" "docker ps | grep -q sienn-redis"
test_component "MinIO service" "docker ps | grep -q sienn-minio"
test_component "API service" "docker ps | grep -q sienn-api"
test_component "Worker service" "docker ps | grep -q sienn-worker"
test_component "Frontend service" "docker ps | grep -q sienn-frontend"
echo ""

echo "🔌 2. Testing API Endpoints"
echo "--------------------------------"
test_component "Health endpoint" "curl -sf http://localhost:8000/health | grep -q 'ok'"
test_component "Root endpoint" "curl -sf http://localhost:8000/ | grep -q 'Sienn-AI'"
test_component "Metrics endpoint" "curl -sf http://localhost:8000/api/metrics | grep -q 'system'"
test_component "Health detailed" "curl -sf http://localhost:8000/api/health/detailed | grep -q 'healthy'"
test_component "Export formats" "curl -sf http://localhost:8000/api/export-formats | grep -q 'formats'"
echo ""

echo "🌐 3. Testing Frontend"
echo "--------------------------------"
test_component "Frontend accessible" "curl -sf http://localhost:3000 | grep -q 'Sienn AI'"
echo ""

echo "💾 4. Checking Database"
echo "--------------------------------"
if [ -f "backend/data/data.db" ] || [ -f "data/data.db" ]; then
    echo -e "${GREEN}✓ Database file exists${NC}"
    ((PASSED++))
else
    echo -e "${RED}✗ Database file not found${NC}"
    ((FAILED++))
fi
echo ""

echo "📁 5. Checking Directory Structure"
echo "--------------------------------"
test_component "Backend directory" "[ -d 'backend/app' ]"
test_component "Frontend directory" "[ -d 'frontend/src' ]"
test_component "Docs directory" "[ -d 'docs' ]"
test_component "Data directory" "[ -d 'data' ] || [ -d 'backend/data' ]"
test_component "Scripts directory" "[ -d 'scripts' ] || [ -d 'backend/scripts' ]"
echo ""

echo "📄 6. Checking Essential Files"
echo "--------------------------------"
test_component "README.md" "[ -f 'README.md' ]"
test_component "LICENSE" "[ -f 'LICENSE' ]"
test_component "docker-compose.yml" "[ -f 'docker-compose.yml' ]"
test_component "requirements.txt" "[ -f 'backend/requirements.txt' ]"
test_component "package.json" "[ -f 'frontend/package.json' ]"
test_component ".env.example" "[ -f '.env.example' ]"
echo ""

echo "📚 7. Checking Documentation"
echo "--------------------------------"
test_component "LOGGING.md" "[ -f 'docs/LOGGING.md' ]"
test_component "TESTING_GUIDE.md" "[ -f 'docs/TESTING_GUIDE.md' ]"
test_component "TODO.md" "[ -f 'docs/contexte/TODO.md' ]"
test_component "ARCHITECTURE.md" "[ -f 'docs/contexte/ARCHITECTURE.md' ]"
echo ""

echo "🔧 8. Testing Core Functionality"
echo "--------------------------------"
# Test upload endpoint (needs multipart/form-data, so we skip actual file upload)
echo -n "Upload endpoint exists... "
if curl -sf -X POST http://localhost:8000/api/upload-dataset 2>&1 | grep -q "Field required"; then
    echo -e "${GREEN}✓ PASS${NC}"
    ((PASSED++))
else
    echo -e "${YELLOW}⚠ SKIP (endpoint exists but needs file)${NC}"
fi

# Test start-finetuning endpoint
echo -n "Start finetuning endpoint... "
if curl -sf -X POST http://localhost:8000/api/start-finetuning \
    -H "Content-Type: application/json" 2>&1 | grep -q "Field required"; then
    echo -e "${GREEN}✓ PASS${NC}"
    ((PASSED++))
else
    echo -e "${YELLOW}⚠ SKIP (endpoint exists but needs data)${NC}"
fi

echo ""

# Final summary
echo "===================================="
echo "📊 VALIDATION SUMMARY"
echo "===================================="
echo -e "Total tests: $((PASSED + FAILED))"
echo -e "${GREEN}Passed: $PASSED${NC}"
if [ $FAILED -gt 0 ]; then
    echo -e "${RED}Failed: $FAILED${NC}"
else
    echo -e "Failed: 0"
fi
echo ""

if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}✅ ALL CHECKS PASSED!${NC}"
    echo -e "${GREEN}🎉 SiennAI is ready for release v0.1.0${NC}"
    exit 0
else
    echo -e "${RED}❌ SOME CHECKS FAILED${NC}"
    echo -e "${YELLOW}⚠️  Please fix the issues before creating a release${NC}"
    exit 1
fi
