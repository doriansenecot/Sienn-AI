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
            
            # Load base model first, then apply LoRA adapters
            logger.info("Loading base model (gpt2)...")
            base_model = AutoModelForCausalLM.from_pretrained(
                "gpt2",
                torch_dtype=torch.float16 if self.device == "cuda" else torch.float32,
                device_map="auto" if self.device == "cuda" else None,
            )
            
            # Load LoRA adapter on top of base model
            logger.info(f"Loading LoRA adapters from {model_path}...")
            model = PeftModel.from_pretrained(base_model, model_path)
            model.eval()
            
            # Cache the model
            self.loaded_models[model_path] = {
                "model": model,
                "tokenizer": tokenizer,
            }
            
            logger.info(f"Model with LoRA adapters loaded successfully")
            return self.loaded_models[model_path]
            
        except Exception as e:
            logger.error(f"Failed to load model from {model_path}: {str(e)}")
            raise
    
    async def test_model(
        self,
        model_path: str,
        prompt: str,
        max_new_tokens: int = 100,
        temperature: float = 0.7,
        top_p: float = 0.95,
        repetition_penalty: float = 1.2,
        do_sample: bool = True
    ) -> tuple[str, float]:
        """
        Test a fine-tuned model with a prompt.
        
        Loads the model and generates text using the fine-tuned LoRA adapter.
        
        Args:
            model_path: Path to the fine-tuned model
            prompt: Input prompt for generation
            max_new_tokens: Maximum number of tokens to generate
            temperature: Sampling temperature
            top_p: Nucleus sampling parameter
            repetition_penalty: Penalty for repeating tokens (1.0 = no penalty)
            do_sample: Whether to use sampling (False = greedy decoding)
            
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
            
            # Format prompt in Alpaca style if not already formatted
            if not prompt.startswith("Below is an instruction"):
                formatted_prompt = f"Below is an instruction. Write a response that completes the request.\n\n### Instruction:\n{prompt}\n\n### Response:\n"
            else:
                formatted_prompt = prompt
            
            # Define stop sequences to prevent repetition of format
            stop_strings = ["### Instruction:", "### Input:", "Below is an instruction"]
            
            # Tokenize input
            inputs = tokenizer(formatted_prompt, return_tensors="pt")
            if self.device == "cuda":
                inputs = {k: v.cuda() for k, v in inputs.items()}
            
            # Get input length to extract only new tokens
            input_length = inputs["input_ids"].shape[1]
            
            # Generate with anti-repetition parameters
            with torch.no_grad():
                outputs = model.generate(
                    **inputs,
                    max_new_tokens=max_new_tokens,
                    temperature=temperature if do_sample else 1.0,
                    do_sample=do_sample,
                    top_p=top_p if do_sample else 1.0,
                    top_k=50 if do_sample else 0,
                    repetition_penalty=repetition_penalty,
                    no_repeat_ngram_size=3,  # Prevent repetition of 3-grams
                    pad_token_id=tokenizer.pad_token_id or tokenizer.eos_token_id,
                    eos_token_id=tokenizer.eos_token_id,
                )
            
            # Decode full output
            full_text = tokenizer.decode(outputs[0], skip_special_tokens=True)
            
            # Extract only the generated part (after prompt)
            generated_only = tokenizer.decode(outputs[0][input_length:], skip_special_tokens=True)
            
            # Stop at first occurrence of stop strings
            for stop_str in stop_strings:
                if stop_str in generated_only:
                    generated_only = generated_only.split(stop_str)[0].strip()
                    break
            
            # Return full text for now (includes prompt)
            generation_time = time.time() - start_time
            
            logger.info(f"Generated {len(outputs[0]) - input_length} new tokens in {generation_time:.2f}s")
            
            return full_text, generation_time
            
        except Exception as e:
            logger.error(f"Generation failed: {str(e)}")
            raise
    
    def model_exists(self, model_path: str) -> bool:
        """Check if model path exists"""
        path = Path(model_path)
        return path.exists() and path.is_dir()


# Global model service instance
model_service = ModelService()
