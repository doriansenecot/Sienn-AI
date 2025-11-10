#!/bin/bash
# Demo workflow script for Sienn-AI
# Tests the complete fine-tuning pipeline

set -e

API_URL="http://localhost:8000"
DATASET_FILE="../test_data/demo_dataset.csv"

echo "🚀 Sienn-AI Demo Workflow"
echo "========================="
echo ""

# Check API health
echo "1️⃣ Checking API health..."
curl -s ${API_URL}/health | python3 -m json.tool
echo ""

# Upload dataset
echo "2️⃣ Uploading dataset..."
UPLOAD_RESPONSE=$(curl -s -X POST ${API_URL}/api/upload-dataset \
  -F "file=@${DATASET_FILE}")
echo $UPLOAD_RESPONSE | python3 -m json.tool
DATASET_ID=$(echo $UPLOAD_RESPONSE | python3 -c "import sys, json; print(json.load(sys.stdin)['dataset_id'])")
echo "✅ Dataset uploaded with ID: ${DATASET_ID}"
echo ""

# Start fine-tuning
echo "3️⃣ Starting fine-tuning..."
TRAIN_RESPONSE=$(curl -s -X POST ${API_URL}/api/start-finetuning \
  -H "Content-Type: application/json" \
  -d "{
    \"dataset_id\": \"${DATASET_ID}\",
    \"model_name\": \"gpt2\",
    \"num_epochs\": 1,
    \"batch_size\": 2,
    \"learning_rate\": 0.0003,
    \"lora_r\": 8,
    \"lora_alpha\": 16
  }")
echo $TRAIN_RESPONSE | python3 -m json.tool
JOB_ID=$(echo $TRAIN_RESPONSE | python3 -c "import sys, json; print(json.load(sys.stdin)['job_id'])")
echo "✅ Training started with Job ID: ${JOB_ID}"
echo ""

# Monitor progress
echo "4️⃣ Monitoring training progress..."
for i in {1..30}; do
  STATUS_RESPONSE=$(curl -s ${API_URL}/api/training-status/${JOB_ID})
  STATUS=$(echo $STATUS_RESPONSE | python3 -c "import sys, json; print(json.load(sys.stdin)['status'])")
  PROGRESS=$(echo $STATUS_RESPONSE | python3 -c "import sys, json; print(json.load(sys.stdin).get('progress', 0))")
  MESSAGE=$(echo $STATUS_RESPONSE | python3 -c "import sys, json; print(json.load(sys.stdin).get('message', ''))")
  
  echo "   Status: ${STATUS} | Progress: ${PROGRESS}% | ${MESSAGE}"
  
  if [ "$STATUS" == "completed" ]; then
    echo "✅ Training completed!"
    break
  elif [ "$STATUS" == "failed" ]; then
    echo "❌ Training failed!"
    echo $STATUS_RESPONSE | python3 -m json.tool
    exit 1
  fi
  
  sleep 10
done
echo ""

# Test inference
echo "5️⃣ Testing model inference..."
INFERENCE_RESPONSE=$(curl -s -X POST ${API_URL}/api/test-model \
  -H "Content-Type: application/json" \
  -d "{
    \"job_id\": \"${JOB_ID}\",
    \"prompt\": \"What is Python?\",
    \"max_length\": 100
  }")
echo $INFERENCE_RESPONSE | python3 -m json.tool
echo ""

# List available exports
echo "6️⃣ Checking export availability..."
curl -s ${API_URL}/api/jobs | python3 -m json.tool | head -50
echo ""

echo "✅ Demo workflow completed successfully!"
echo ""
echo "📋 Summary:"
echo "   - Dataset ID: ${DATASET_ID}"
echo "   - Job ID: ${JOB_ID}"
echo "   - Status: ${STATUS}"
echo ""
echo "🌐 Access the UI at: http://localhost:3000"
