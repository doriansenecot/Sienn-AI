"""Service for loading and testing fine-tuned models"""
import time
import logging
from pathlib import Path
from typing import Dict, Any, Optional
import torch
from transformers import AutoModelForCausalLM, AutoTokenizer
from peft import PeftModel

logger = logging.getLogger(__name__)


class ModelService:
    """Service for model inference operations"""
    
    def __init__(self):
        self.loaded_models: Dict[str, Any] = {}
        self.device = "cuda" if torch.cuda.is_available() else "cpu"
        logger.info(f"ModelService initialized on device: {self.device}")
    
    def _load_model(self, model_path: str):
        """Load a fine-tuned model and tokenizer"""
        if model_path in self.loaded_models:
            logger.info(f"Using cached model from {model_path}")
            return self.loaded_models[model_path]
        
        logger.info(f"Loading model from {model_path}...")
        
        try:
            # Load tokenizer
            tokenizer = AutoTokenizer.from_pretrained(model_path)
            
            # Load model (LoRA adapter)
            model = AutoModelForCausalLM.from_pretrained(
                model_path,
                torch_dtype=torch.float16 if self.device == "cuda" else torch.float32,
                device_map="auto" if self.device == "cuda" else None,
            )
            
            # Cache the model
            self.loaded_models[model_path] = {
                "model": model,
                "tokenizer": tokenizer,
            }
            
            logger.info(f"Model loaded successfully from {model_path}")
            return self.loaded_models[model_path]
            
        except Exception as e:
            logger.error(f"Failed to load model from {model_path}: {str(e)}")
            raise
    
    async def test_model(
        self,
        model_path: str,
        prompt: str,
        max_new_tokens: int = 100,
        temperature: float = 0.7
    ) -> tuple[str, float]:
        """
        Test a fine-tuned model with a prompt.
        
        Loads the model and generates text using the fine-tuned LoRA adapter.
        
        Args:
            model_path: Path to the fine-tuned model
            prompt: Input prompt for generation
            max_new_tokens: Maximum number of tokens to generate
            temperature: Sampling temperature
            
        Returns:
            Tuple of (generated_text, generation_time)
        """
        start_time = time.time()
        
        try:
            # Load model and tokenizer
            import asyncio
            import functools
            
            model_data = await asyncio.get_event_loop().run_in_executor(
                None,
                functools.partial(self._load_model, model_path)
            )
            
            model = model_data["model"]
            tokenizer = model_data["tokenizer"]
            
            # Tokenize input
            inputs = tokenizer(prompt, return_tensors="pt")
            if self.device == "cuda":
                inputs = {k: v.cuda() for k, v in inputs.items()}
            
            # Generate
            with torch.no_grad():
                outputs = model.generate(
                    **inputs,
                    max_new_tokens=max_new_tokens,
                    temperature=temperature,
                    do_sample=True,
                    top_p=0.95,
                    pad_token_id=tokenizer.pad_token_id or tokenizer.eos_token_id,
                )
            
            # Decode
            generated_text = tokenizer.decode(outputs[0], skip_special_tokens=True)
            
            generation_time = time.time() - start_time
            
            logger.info(f"Generated {len(outputs[0])} tokens in {generation_time:.2f}s")
            
            return generated_text, generation_time
            
        except Exception as e:
            logger.error(f"Generation failed: {str(e)}")
            raise
    
    def model_exists(self, model_path: str) -> bool:
        """Check if model path exists"""
        path = Path(model_path)
        return path.exists() and path.is_dir()


# Global model service instance
model_service = ModelService()
