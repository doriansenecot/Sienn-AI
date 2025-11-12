#!/usr/bin/env python3
"""
Script pour tester directement le modèle TinyLlama via API REST personnalisée
Pour la démo - contourne le système LoRA
"""
import sys
import time
from datetime import datetime
from pathlib import Path

import torch
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from transformers import AutoModelForCausalLM, AutoTokenizer

sys.path.insert(0, str(Path(__file__).parent.parent))

router = APIRouter(prefix="/api/demo", tags=["demo"])

# Cache global pour le modèle
_cached_model = None
_cached_tokenizer = None
_model_name = "TinyLlama/TinyLlama-1.1B-Chat-v1.0"


class DemoTestRequest(BaseModel):
    """Request pour tester le modèle de démo"""

    prompt: str = Field(..., min_length=1, max_length=2000)
    max_new_tokens: int = Field(default=100, ge=10, le=500)
    temperature: float = Field(default=0.7, ge=0.1, le=2.0)


class DemoTestResponse(BaseModel):
    """Response du test de démo"""

    prompt: str
    generated_text: str
    model_name: str
    generation_time: float
    timestamp: datetime


def load_model():
    """Charge le modèle TinyLlama en cache"""
    global _cached_model, _cached_tokenizer

    if _cached_model is None:
        print(f"📥 Loading {_model_name}...")
        _cached_tokenizer = AutoTokenizer.from_pretrained(_model_name)
        _cached_model = AutoModelForCausalLM.from_pretrained(
            _model_name,
            torch_dtype=torch.float16 if torch.cuda.is_available() else torch.float32,
            device_map="auto" if torch.cuda.is_available() else None,
        )
        _cached_model.eval()
        print("✅ Model loaded successfully!")

    return _cached_model, _cached_tokenizer


@router.post("/test-tinyllama", response_model=DemoTestResponse)
async def test_tinyllama(request: DemoTestRequest):
    """Test le modèle TinyLlama directement (pour démo)"""
    try:
        model, tokenizer = load_model()

        # Formater le prompt pour TinyLlama-Chat
        formatted_prompt = f"<|user|>\n{request.prompt}</s>\n<|assistant|>\n"

        # Tokenize
        inputs = tokenizer(formatted_prompt, return_tensors="pt")
        if torch.cuda.is_available():
            inputs = inputs.to("cuda")

        # Generate
        start_time = time.time()
        with torch.no_grad():
            outputs = model.generate(
                **inputs,
                max_new_tokens=request.max_new_tokens,
                temperature=request.temperature,
                do_sample=True,
                top_p=0.9,
                pad_token_id=tokenizer.eos_token_id,
            )
        generation_time = time.time() - start_time

        # Decode
        full_text = tokenizer.decode(outputs[0], skip_special_tokens=False)

        # Extract only assistant response
        if "<|assistant|>" in full_text:
            generated = full_text.split("<|assistant|>")[-1].replace("</s>", "").strip()
        else:
            generated = full_text

        return DemoTestResponse(
            prompt=request.prompt,
            generated_text=generated,
            model_name=_model_name,
            generation_time=generation_time,
            timestamp=datetime.utcnow(),
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Generation failed: {str(e)}")


# Pour tester en ligne de commande
if __name__ == "__main__":
    import asyncio

    async def test():
        request = DemoTestRequest(prompt="What is artificial intelligence?", max_new_tokens=150, temperature=0.7)
        result = await test_tinyllama(request)
        print(f"\n{'='*60}")
        print(f"Prompt: {result.prompt}")
        print(f"{'='*60}")
        print(f"Response: {result.generated_text}")
        print(f"{'='*60}")
        print(f"Time: {result.generation_time:.2f}s")

    asyncio.run(test())
