```markdown
# API - Exemples & Contrats (résumé pour Copilot)

Base URL: http://localhost:8000/api

1) POST /upload-dataset
- Description: upload file multipart (CSV/JSON)
- Response: { success: true, filename, rows, columns, preview, dataset_id }

cURL
```bash
curl -X POST http://localhost:8000/api/upload-dataset \
  -F "file=@./examples/sample_dataset.csv"
```

2) POST /start-finetuning
- Description: démarre fine-tuning via LoRA/PEFT
- Body JSON:
  {
    "dataset": "sample_dataset.csv",
    "model": "llama2:7b",
    "learning_rate": 0.0001,
    "epochs": 3,
    "batch_size": 4,
    "lora_rank": 8
  }
- Response: { job_id, status: "started", estimated_time_minutes }

cURL
```bash
curl -X POST http://localhost:8000/api/start-finetuning \
  -H "Content-Type: application/json" \
  -d '{"dataset":"sample_dataset.csv","model":"llama2:7b","learning_rate":0.0001,"epochs":3}'
```

3) GET /training-status/{job_id}
- Response: { job_id, status, progress, current_epoch, total_epochs, loss_history, gpu_memory_used }

4) POST /test-model
- Body JSON: { "prompt": "Bonjour", "model_id": "<job_id>", "temperature": 0.7 }
- Response: { prompt, response, generation_time_seconds, model_used }

5) GET /download-model/{job_id}?format=ollama|gguf
- Response: binary stream (archive)

Erreur standard JSON:
```json
{ "error": "Message", "status": 400 }
```
```