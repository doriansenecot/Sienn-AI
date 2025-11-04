#!/usr/bin/env python3
"""
Test script to compare base GPT-2 vs fine-tuned model quality
"""
import sys
import torch
from transformers import AutoModelForCausalLM, AutoTokenizer
from peft import PeftModel

def load_base_model():
    """Load base GPT-2 model"""
    print("Loading base GPT-2 model...")
    tokenizer = AutoTokenizer.from_pretrained("gpt2")
    model = AutoModelForCausalLM.from_pretrained("gpt2")
    
    if tokenizer.pad_token is None:
        tokenizer.pad_token = tokenizer.eos_token
    
    return model, tokenizer

def load_finetuned_model(model_path):
    """Load fine-tuned model with LoRA adapter"""
    print(f"Loading fine-tuned model from {model_path}...")
    tokenizer = AutoTokenizer.from_pretrained(model_path)
    base_model = AutoModelForCausalLM.from_pretrained("gpt2")
    model = PeftModel.from_pretrained(base_model, model_path)
    model.eval()
    
    if tokenizer.pad_token is None:
        tokenizer.pad_token = tokenizer.eos_token
    
    return model, tokenizer

def generate_response(model, tokenizer, prompt, max_length=100):
    """Generate text from prompt"""
    inputs = tokenizer(prompt, return_tensors="pt", padding=True)
    
    with torch.no_grad():
        outputs = model.generate(
            **inputs,
            max_length=max_length,
            num_return_sequences=1,
            temperature=0.7,
            top_p=0.9,
            do_sample=True,
            pad_token_id=tokenizer.pad_token_id,
            repetition_penalty=1.2,
            no_repeat_ngram_size=3,
        )
    
    response = tokenizer.decode(outputs[0], skip_special_tokens=True)
    return response

def test_prompts():
    """Test model with various prompts from training data"""
    prompts = [
        "What is Python?",
        "Explain machine learning",
        "What is fine-tuning?",
        "What is LoRA?",
        "How does training work?",
    ]
    
    model_path = "data/models/65b973ee-4886-485e-a85a-12bf3029738e"
    
    # Load both models
    base_model, base_tokenizer = load_base_model()
    finetuned_model, finetuned_tokenizer = load_finetuned_model(model_path)
    
    print("\n" + "="*80)
    print("COMPARING BASE GPT-2 vs FINE-TUNED MODEL")
    print("="*80 + "\n")
    
    for i, prompt in enumerate(prompts, 1):
        print(f"\n{'─'*80}")
        print(f"PROMPT {i}: {prompt}")
        print(f"{'─'*80}")
        
        # Base model response
        print("\n🔵 BASE GPT-2:")
        base_response = generate_response(base_model, base_tokenizer, prompt, max_length=80)
        print(base_response)
        
        # Fine-tuned model response
        print("\n🟢 FINE-TUNED MODEL:")
        finetuned_response = generate_response(finetuned_model, finetuned_tokenizer, prompt, max_length=80)
        print(finetuned_response)
        print()

if __name__ == "__main__":
    try:
        test_prompts()
        print("\n✅ Quality test completed!")
    except Exception as e:
        print(f"\n❌ Error: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
