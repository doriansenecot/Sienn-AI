#!/bin/bash
# Automated demo script for Sienn-AI presentation

set -e

echo "🎬 Sienn-AI Demo Workflow"
echo "========================="
echo ""

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

API_URL="http://localhost:8000/api"

# Check if services are running
echo -e "${BLUE}Checking if services are running...${NC}"
if ! curl -s "${API_URL%/api}/health" > /dev/null; then
    echo "❌ API not accessible. Please start services with: docker-compose up -d"
    exit 1
fi
echo -e "${GREEN}✅ Services are running${NC}"
echo ""

# Step 1: Upload dataset
echo -e "${YELLOW}Step 1: Uploading demo dataset${NC}"
DATASET_FILE="test_data/demo_dataset.csv"

if [ ! -f "$DATASET_FILE" ]; then
    echo "Creating demo dataset..."
    cat > "$DATASET_FILE" << 'EOF'
text
"The capital of France is Paris."
"Python is a programming language."
"Machine learning is a subset of artificial intelligence."
"The Earth orbits around the Sun."
"Water boils at 100 degrees Celsius at sea level."
EOF
fi

UPLOAD_RESPONSE=$(curl -s -X POST \
    -F "file=@${DATASET_FILE}" \
    "${API_URL}/upload-dataset")

DATASET_ID=$(echo $UPLOAD_RESPONSE | python3 -c "import sys, json; print(json.load(sys.stdin)['dataset_id'])")
echo -e "${GREEN}✅ Dataset uploaded: ${DATASET_ID}${NC}"
echo ""

# Step 2: Start fine-tuning
echo -e "${YELLOW}Step 2: Starting fine-tuning job${NC}"
FINETUNE_RESPONSE=$(curl -s -X POST \
    -H "Content-Type: application/json" \
    -d "{
        \"dataset_id\": \"${DATASET_ID}\",
        \"model_name\": \"gpt2\",
        \"num_epochs\": 2,
        \"batch_size\": 2,
        \"learning_rate\": 5e-5
    }" \
    "${API_URL}/start-finetuning")

JOB_ID=$(echo $FINETUNE_RESPONSE | python3 -c "import sys, json; print(json.load(sys.stdin)['job_id'])")
echo -e "${GREEN}✅ Fine-tuning started: ${JOB_ID}${NC}"
echo ""

# Step 3: Monitor training
echo -e "${YELLOW}Step 3: Monitoring training progress${NC}"
echo "Press Ctrl+C to skip monitoring and continue..."
echo ""

while true; do
    STATUS_RESPONSE=$(curl -s "${API_URL}/training-status/${JOB_ID}")
    STATUS=$(echo $STATUS_RESPONSE | python3 -c "import sys, json; print(json.load(sys.stdin)['status'])")
    PROGRESS=$(echo $STATUS_RESPONSE | python3 -c "import sys, json; print(json.load(sys.stdin)['progress'])")
    MESSAGE=$(echo $STATUS_RESPONSE | python3 -c "import sys, json; print(json.load(sys.stdin).get('message', ''))")
    
    echo -ne "\rStatus: ${STATUS} | Progress: ${PROGRESS}% | ${MESSAGE}                    "
    
    if [ "$STATUS" = "completed" ]; then
        echo ""
        echo -e "${GREEN}✅ Training completed!${NC}"
        break
    elif [ "$STATUS" = "failed" ]; then
        echo ""
        echo "❌ Training failed"
        exit 1
    fi
    
    sleep 2
done
echo ""

# Step 4: Test the model
echo -e "${YELLOW}Step 4: Testing the fine-tuned model${NC}"
TEST_RESPONSE=$(curl -s -X POST \
    -H "Content-Type: application/json" \
    -d "{
        \"job_id\": \"${JOB_ID}\",
        \"prompt\": \"The capital of France is\",
        \"max_new_tokens\": 50,
        \"temperature\": 0.7
    }" \
    "${API_URL}/test-model")

GENERATED_TEXT=$(echo $TEST_RESPONSE | python3 -c "import sys, json; print(json.load(sys.stdin)['generated_text'])")
echo "Prompt: 'The capital of France is'"
echo "Generated: ${GENERATED_TEXT}"
echo -e "${GREEN}✅ Model inference successful${NC}"
echo ""

# Step 5: Export model
echo -e "${YELLOW}Step 5: Exporting model (Ollama format)${NC}"
EXPORT_URL="${API_URL}/download-model/${JOB_ID}?format=ollama"
echo "Download URL: ${EXPORT_URL}"
echo -e "${GREEN}✅ Model ready for download${NC}"
echo ""

# Step 6: Show metrics
echo -e "${YELLOW}Step 6: System metrics${NC}"
METRICS=$(curl -s "${API_URL}/metrics")
echo $METRICS | python3 -m json.tool
echo ""

# Summary
echo "======================================"
echo -e "${GREEN}🎉 Demo Completed Successfully!${NC}"
echo "======================================"
echo ""
echo "Summary:"
echo "  Dataset ID: ${DATASET_ID}"
echo "  Job ID: ${JOB_ID}"
echo "  Model Status: Completed"
echo ""
echo "Next steps:"
echo "  1. Access Web UI: http://localhost:3000"
echo "  2. View API docs: http://localhost:8000/docs"
echo "  3. Download model: ${EXPORT_URL}"
echo ""
echo "To test with another prompt:"
echo "  curl -X POST '${API_URL}/test-model' \\"
echo "    -H 'Content-Type: application/json' \\"
echo "    -d '{\"job_id\": \"${JOB_ID}\", \"prompt\": \"Your prompt here\"}'"
echo ""
