# Sienn-AI User Guide

**Version 0.1.0** | Last Updated: November 4, 2025

Welcome to Sienn-AI! This guide will walk you through the entire process of fine-tuning an AI model using our platform.

---

## Table of Contents

1. [Introduction](#introduction)
2. [Getting Started](#getting-started)
3. [Preparing Your Dataset](#preparing-your-dataset)
4. [Uploading a Dataset](#uploading-a-dataset)
5. [Configuring Training](#configuring-training)
6. [Monitoring Training Progress](#monitoring-training-progress)
7. [Testing Your Model](#testing-your-model)
8. [Exporting Your Model](#exporting-your-model)
9. [Best Practices](#best-practices)
10. [Troubleshooting](#troubleshooting)

---

## Introduction

Sienn-AI is a user-friendly platform for fine-tuning large language models using LoRA (Low-Rank Adaptation) technique. With Sienn-AI, you can:

- Fine-tune models like GPT-2, Phi-2, and other popular LLMs
- Use your own custom datasets
- Monitor training in real-time
- Test models with interactive prompts
- Export models in multiple formats (PyTorch, Ollama, GGUF)

**Why LoRA?**
- ✅ **Efficient**: Only trains 3-5% of model parameters
- ✅ **Fast**: Significantly faster than full fine-tuning
- ✅ **Resource-friendly**: Requires less GPU memory
- ✅ **Flexible**: Easily swap adapters for different tasks

---

## Getting Started

### Prerequisites

- Docker and Docker Compose installed
- At least 8GB RAM (16GB recommended)
- GPU optional but recommended for faster training
- Basic understanding of machine learning concepts

### Installation

1. **Clone the repository:**
```bash
git clone https://github.com/doriansenecot/Sienn-AI.git
cd Sienn-AI
```

2. **Configure environment:**
```bash
cp .env.example .env
# Edit .env with your preferences
```

3. **Start the services:**
```bash
docker-compose up -d
```

4. **Access the application:**
- Frontend: http://localhost:3000
- API: http://localhost:8000
- API Docs: http://localhost:8000/docs

---

## Preparing Your Dataset

Your dataset should contain training examples in one of these formats:

### CSV Format (Recommended)

```csv
instruction,input,output
What is Python?,"","Python is a high-level programming language..."
Explain recursion,"","Recursion is a programming technique where..."
Write a function to sort,"array: [3, 1, 4, 1, 5]","def sort_array(arr): return sorted(arr)"
```

**Required columns:**
- `instruction`: The task or question
- `input`: Additional context (can be empty)
- `output`: The expected response

### JSON Format

```json
[
  {
    "instruction": "What is Python?",
    "input": "",
    "output": "Python is a high-level programming language..."
  },
  {
    "instruction": "Explain recursion",
    "input": "",
    "output": "Recursion is a programming technique..."
  }
]
```

### JSONL Format

```jsonl
{"instruction": "What is Python?", "input": "", "output": "Python is a high-level..."}
{"instruction": "Explain recursion", "input": "", "output": "Recursion is..."}
```

**Dataset Tips:**
- ✅ **Quality over quantity**: 500-5000 high-quality examples work well
- ✅ **Consistency**: Keep formatting consistent across examples
- ✅ **Diversity**: Include varied examples covering your use case
- ✅ **Balance**: Avoid heavily imbalanced datasets
- ❌ **Avoid duplicates**: Remove or minimize duplicate entries

---

## Uploading a Dataset

### Via Web Interface

1. **Navigate to the Upload page**
   - Click "Upload Dataset" in the sidebar
   
2. **Select your file**
   - Click "Choose File" or drag & drop your dataset
   - Supported formats: CSV, JSON, JSONL
   
3. **Name your dataset** (optional)
   - Provide a descriptive name for easy identification
   
4. **Upload and validate**
   - Click "Upload"
   - The system will validate your dataset automatically
   
5. **Review preview**
   - Check the dataset preview to ensure it loaded correctly
   - Verify column names and sample data
   - Review validation metrics

**What happens during validation:**
- Format check (CSV/JSON/JSONL)
- Column detection
- Null value analysis
- Sample size verification
- Quality score calculation

### Via API

```bash
curl -X POST http://localhost:8000/api/upload-dataset \
  -F "file=@my_dataset.csv" \
  -F "name=My Training Dataset"
```

---

## Configuring Training

After uploading your dataset, configure the training parameters:

### 1. Select Base Model

Choose a base model to fine-tune:

| Model | Size | Best For | Training Time |
|-------|------|----------|---------------|
| **GPT-2** | 124M | Quick experiments, text generation | Fast (~20 min) |
| **GPT-2 Medium** | 355M | Better quality, general tasks | Medium (~45 min) |
| **GPT-2 Large** | 774M | High quality, complex tasks | Slow (~2 hours) |
| **Microsoft Phi-2** | 2.7B | Strong performance, code | Slow (~3-4 hours) |

💡 **Tip:** Start with GPT-2 for testing, then upgrade to larger models.

### 2. Training Hyperparameters

#### Basic Parameters

- **Number of Epochs**: How many times to iterate through the dataset
  - Recommended: 3-5 epochs
  - Too few: Underfitting
  - Too many: Overfitting

- **Batch Size**: Number of samples processed together
  - Default: 4 (works for most cases)
  - Larger values: Faster but more memory
  - Smaller values: Slower but less memory

- **Learning Rate**: How fast the model learns
  - Default: 2e-5 (good starting point)
  - Too high: Unstable training
  - Too low: Very slow learning

#### Advanced Parameters

- **Max Sequence Length**: Maximum tokens per sample
  - Default: 512
  - Shorter: Faster, less context
  - Longer: Slower, more context

- **LoRA Rank (r)**: Size of low-rank matrices
  - Default: 32
  - Higher: More expressive but slower
  - Lower: Faster but less flexible

- **LoRA Alpha**: Scaling parameter
  - Default: 64 (usually 2× rank)
  - Affects learning rate scaling

### 3. Example Configuration

**For Text Generation:**
```json
{
  "model_name": "gpt2",
  "num_epochs": 3,
  "batch_size": 4,
  "learning_rate": 2e-5,
  "max_length": 512,
  "lora_r": 32,
  "lora_alpha": 64
}
```

**For Code Generation:**
```json
{
  "model_name": "microsoft/phi-2",
  "num_epochs": 5,
  "batch_size": 2,
  "learning_rate": 1e-5,
  "max_length": 1024,
  "lora_r": 64,
  "lora_alpha": 128
}
```

---

## Monitoring Training Progress

### Real-Time Dashboard

Once training starts, you'll see:

1. **Progress Bar**
   - Overall completion percentage
   - Current epoch / Total epochs
   - Estimated time remaining

2. **Training Metrics**
   - **Training Loss**: How well model fits training data (should decrease)
   - **Validation Loss**: Performance on unseen data (should decrease)
   - **Learning Rate**: Current learning rate (may decrease over time)

3. **System Metrics**
   - GPU utilization
   - Memory usage
   - Training speed (samples/second)

### Understanding the Metrics

**Training Loss**
- Starts high (e.g., 3.5-4.0)
- Should decrease steadily
- Final value: 0.5-2.0 is typical

**Validation Loss**
- Should follow training loss
- If diverges from training loss → overfitting
- If stays flat → learning rate too low

**Good Training Signs:**
- ✅ Losses decreasing smoothly
- ✅ Validation loss following training loss
- ✅ No sudden spikes

**Warning Signs:**
- ⚠️ Loss increasing → learning rate too high
- ⚠️ Validation loss >> training loss → overfitting
- ⚠️ Loss stays flat → learning rate too low or bad data

### Via API

```bash
# Check status
curl http://localhost:8000/api/training-status/job_xyz789

# Continuous monitoring
watch -n 5 'curl -s http://localhost:8000/api/training-status/job_xyz789 | jq'
```

---

## Testing Your Model

Once training is complete, test your model immediately:

### 1. Navigate to Inference Page

Click "Test Model" or "Inference" in the sidebar.

### 2. Select Your Model

Choose the training job ID or model you want to test.

### 3. Enter a Prompt

Type your prompt in the text area. Examples:

**For conversation models:**
```
User: What is recursion in programming?
Assistant:
```

**For code generation:**
```
Write a Python function to calculate the nth Fibonacci number using memoization.
```

**For creative writing:**
```
Write a short story about a robot learning to paint.
```

### 4. Configure Generation Parameters

- **Max Length**: Maximum tokens to generate (50-500)
  - Shorter: Concise responses
  - Longer: Detailed responses

- **Temperature**: Creativity level (0.1-2.0)
  - Low (0.3-0.7): Focused, deterministic
  - Medium (0.7-1.0): Balanced
  - High (1.0-2.0): Creative, random

- **Top P**: Nucleus sampling (0.8-0.95)
  - Controls diversity of word choices

- **Top K**: Limits vocabulary (40-100)
  - Lower: More focused
  - Higher: More diverse

### 5. Generate and Review

Click "Generate" and review the output. Test multiple prompts to evaluate quality.

**Quality Checklist:**
- ✅ Relevant to prompt
- ✅ Coherent and grammatical
- ✅ Follows expected format
- ✅ No hallucinations or errors

### Via API

```bash
curl -X POST http://localhost:8000/api/test-model \
  -H "Content-Type: application/json" \
  -d '{
    "job_id": "job_xyz789",
    "prompt": "Explain machine learning in simple terms",
    "max_length": 200,
    "temperature": 0.7
  }'
```

---

## Exporting Your Model

### Export Formats

Sienn-AI supports multiple export formats:

#### 1. PyTorch (Default)
- **Use case**: Python applications, fine-tuning
- **Format**: SafeTensors (recommended) or .bin
- **Size**: ~50-500 MB (LoRA adapters only)

#### 2. Ollama
- **Use case**: Local deployment with Ollama
- **Format**: Modelfile + adapters
- **Size**: ~50-500 MB
- **Usage**: `ollama run my-model`

#### 3. GGUF (Quantized)
- **Use case**: CPU inference, llama.cpp
- **Format**: Quantized GGUF
- **Size**: ~20-200 MB (depending on quantization)
- **Quantization levels**: q4_0, q4_1, q5_0, q5_1, q8_0

### Export Steps

1. **Navigate to Export page**
   - Or use the "Export" button on the Dashboard

2. **Select format**
   - Choose PyTorch, Ollama, or GGUF

3. **Configure options**
   - For GGUF: Select quantization level
   - q4_0: Smallest, fastest, lower quality
   - q8_0: Larger, slower, better quality

4. **Export and download**
   - Click "Export Model"
   - Wait for processing (1-5 minutes)
   - Download the ZIP file

### Using Exported Models

#### PyTorch
```python
from transformers import AutoModelForCausalLM, AutoTokenizer
from peft import PeftModel

# Load base model
base_model = AutoModelForCausalLM.from_pretrained("gpt2")
tokenizer = AutoTokenizer.from_pretrained("gpt2")

# Load LoRA adapters
model = PeftModel.from_pretrained(base_model, "./my_model")

# Generate
inputs = tokenizer("Hello", return_tensors="pt")
outputs = model.generate(**inputs, max_length=50)
print(tokenizer.decode(outputs[0]))
```

#### Ollama
```bash
# Import to Ollama
ollama create my-model -f ./Modelfile

# Run
ollama run my-model
>>> Hello! How can I help you?
```

#### GGUF
```bash
# Using llama.cpp
./main -m model.gguf -p "Write a poem" -n 100
```

---

## Best Practices

### Dataset Preparation

1. **Clean your data**
   - Remove duplicates
   - Fix formatting issues
   - Handle missing values

2. **Balance your dataset**
   - Include diverse examples
   - Avoid over-representation of certain patterns

3. **Quality over quantity**
   - 500-1000 high-quality examples > 10,000 low-quality ones

### Training Configuration

1. **Start small**
   - Use GPT-2 for initial testing
   - Train on a subset first (100-500 samples)
   - Verify results before scaling up

2. **Monitor closely**
   - Watch for overfitting
   - Stop if validation loss increases
   - Save checkpoints regularly

3. **Experiment systematically**
   - Change one parameter at a time
   - Keep notes of what works
   - Compare results objectively

### Model Testing

1. **Test thoroughly**
   - Use diverse prompts
   - Test edge cases
   - Compare with base model

2. **Evaluate quality**
   - Relevance
   - Coherence
   - Accuracy
   - Format compliance

3. **Iterate**
   - If quality is poor, adjust training params
   - Consider getting more/better data
   - Try different base models

---

## Troubleshooting

### Common Issues

#### "Training Failed" Error

**Possible causes:**
- Dataset format issues
- Out of memory
- Invalid configuration

**Solutions:**
1. Check dataset validation report
2. Reduce batch size
3. Reduce max_length
4. Check error logs in Dashboard

#### Model Generates Nonsense

**Possible causes:**
- Not enough training
- Learning rate too high
- Bad dataset quality

**Solutions:**
1. Train for more epochs
2. Lower learning rate
3. Review and clean dataset
4. Try a larger base model

#### Training Too Slow

**Possible causes:**
- Large dataset
- High max_length
- No GPU available

**Solutions:**
1. Reduce dataset size
2. Lower max_length
3. Increase batch size (if memory allows)
4. Use GPU if available

#### Out of Memory

**Possible causes:**
- Batch size too large
- Max length too high
- Model too large

**Solutions:**
1. Reduce batch_size to 2 or 1
2. Reduce max_length to 256 or 128
3. Use smaller base model
4. Enable gradient checkpointing

### Getting Help

- **GitHub Issues**: https://github.com/doriansenecot/Sienn-AI/issues
- **Documentation**: Check the API docs for technical details
- **Logs**: Review training logs in Dashboard or `data/logs/`

---

## Next Steps

Now that you've completed the guide:

1. ✅ Prepare your own dataset
2. ✅ Start your first training job
3. ✅ Test and evaluate your model
4. ✅ Export for production use

**Advanced Topics** (coming soon):
- Multi-GPU training
- Custom model architectures
- Hyperparameter tuning strategies
- Production deployment guide

---

**Happy Training! 🚀**

For questions or feedback, open an issue on GitHub or contact the maintainers.

---

*Last updated: November 4, 2025*
*Sienn-AI v0.1.0*
