"""Real fine-tuning service using Transformers and PEFT (LoRA)"""
import json
import logging
from pathlib import Path
from typing import Optional, Dict, Any
import torch
from transformers import (
    AutoModelForCausalLM,
    AutoTokenizer,
    TrainingArguments,
    Trainer,
    DataCollatorForLanguageModeling,
)
from datasets import load_dataset
from peft import LoraConfig, get_peft_model, TaskType, PeftModel

logger = logging.getLogger(__name__)


class FinetuningService:
    """Service for fine-tuning language models with LoRA"""
    
    def __init__(self):
        # Force CPU when running in Celery worker (CUDA doesn't work with multiprocessing fork)
        self.device = "cpu"
        logger.info(f"FinetuningService initialized on device: {self.device}")
    
    def prepare_dataset(self, dataset_path: str, tokenizer, max_length: int = 512):
        """
        Load and prepare dataset for training.
        
        Supports CSV, JSON, JSONL formats with 'text' column.
        """
        # Detect file format
        path = Path(dataset_path)
        extension = path.suffix.lower()
        
        # Load dataset based on format
        if extension == '.csv':
            dataset = load_dataset('csv', data_files=str(path), split='train')
        elif extension == '.json':
            dataset = load_dataset('json', data_files=str(path), split='train')
        elif extension == '.jsonl':
            dataset = load_dataset('json', data_files=str(path), split='train')
        elif extension == '.txt':
            # For txt files, read as plain text and split into lines
            with open(path, 'r', encoding='utf-8') as f:
                lines = [line.strip() for line in f if line.strip()]
            dataset = {'text': lines}
            from datasets import Dataset
            dataset = Dataset.from_dict(dataset)
        else:
            raise ValueError(f"Unsupported file format: {extension}")
        
        # Ensure 'text' column exists
        if 'text' not in dataset.column_names:
            # Try to find a suitable column
            possible_columns = ['content', 'prompt', 'input', 'question']
            text_col = None
            for col in possible_columns:
                if col in dataset.column_names:
                    text_col = col
                    break
            
            if text_col:
                dataset = dataset.rename_column(text_col, 'text')
            else:
                raise ValueError(f"Could not find text column. Available columns: {dataset.column_names}")
        
        # Tokenize dataset
        def tokenize_function(examples):
            return tokenizer(
                examples['text'],
                truncation=True,
                max_length=max_length,
                padding='max_length',
            )
        
        tokenized_dataset = dataset.map(
            tokenize_function,
            batched=True,
            remove_columns=dataset.column_names,
        )
        
        return tokenized_dataset
    
    def create_lora_config(self, model_name: str) -> LoraConfig:
        """Create LoRA configuration"""
        # Different models use different layer names for attention projections
        # GPT-2: c_attn (combined Q,K,V), c_proj (output projection)
        # Llama/Mistral: q_proj, k_proj, v_proj, o_proj
        if "gpt2" in model_name.lower():
            target_modules = ["c_attn", "c_proj"]
        else:
            target_modules = ["q_proj", "v_proj"]
        
        return LoraConfig(
            task_type=TaskType.CAUSAL_LM,
            inference_mode=False,
            r=8,  # LoRA rank
            lora_alpha=32,  # LoRA scaling factor
            lora_dropout=0.1,
            target_modules=target_modules,
        )
    
    def finetune(
        self,
        model_name: str,
        dataset_path: str,
        output_dir: str,
        learning_rate: float = 2e-5,
        num_epochs: int = 3,
        batch_size: int = 4,
        max_length: int = 512,
        progress_callback: Optional[callable] = None,
    ) -> Dict[str, Any]:
        """
        Fine-tune a model using LoRA.
        
        Args:
            model_name: Base model to fine-tune (e.g., 'gpt2')
            dataset_path: Path to training dataset
            output_dir: Directory to save fine-tuned model
            learning_rate: Learning rate
            num_epochs: Number of training epochs
            batch_size: Training batch size
            max_length: Maximum sequence length
            progress_callback: Optional callback for progress updates
            
        Returns:
            Dictionary with training metrics
        """
        try:
            # Load tokenizer and model
            logger.info(f"Loading model {model_name}...")
            tokenizer = AutoTokenizer.from_pretrained(model_name)
            
            # Set padding token if not set
            if tokenizer.pad_token is None:
                tokenizer.pad_token = tokenizer.eos_token
            
            model = AutoModelForCausalLM.from_pretrained(
                model_name,
                torch_dtype=torch.float16 if self.device == "cuda" else torch.float32,
                device_map="auto" if self.device == "cuda" else None,
            )
            
            if progress_callback:
                progress_callback(10, "Model loaded, preparing LoRA...")
            
            # Apply LoRA
            logger.info("Applying LoRA configuration...")
            lora_config = self.create_lora_config(model_name)
            model = get_peft_model(model, lora_config)
            model.print_trainable_parameters()
            
            if progress_callback:
                progress_callback(20, "LoRA applied, loading dataset...")
            
            # Prepare dataset
            logger.info(f"Loading dataset from {dataset_path}...")
            train_dataset = self.prepare_dataset(dataset_path, tokenizer, max_length)
            
            if progress_callback:
                progress_callback(30, f"Dataset loaded ({len(train_dataset)} samples), starting training...")
            
            # Training arguments
            output_path = Path(output_dir)
            output_path.mkdir(parents=True, exist_ok=True)
            
            training_args = TrainingArguments(
                output_dir=str(output_path),
                num_train_epochs=num_epochs,
                per_device_train_batch_size=batch_size,
                learning_rate=learning_rate,
                logging_steps=10,
                save_strategy="epoch",
                fp16=self.device == "cuda",
                report_to="none",  # Disable wandb, tensorboard
            )
            
            # Data collator
            data_collator = DataCollatorForLanguageModeling(
                tokenizer=tokenizer,
                mlm=False,  # Causal LM, not masked LM
            )
            
            # Trainer
            trainer = Trainer(
                model=model,
                args=training_args,
                train_dataset=train_dataset,
                data_collator=data_collator,
            )
            
            # Train
            logger.info("Starting training...")
            train_result = trainer.train()
            
            if progress_callback:
                progress_callback(90, "Training complete, saving model...")
            
            # Save model and tokenizer
            logger.info(f"Saving model to {output_dir}...")
            model.save_pretrained(output_dir)
            tokenizer.save_pretrained(output_dir)
            
            # Save training metadata
            metadata = {
                "model_name": model_name,
                "dataset_path": dataset_path,
                "learning_rate": learning_rate,
                "num_epochs": num_epochs,
                "batch_size": batch_size,
                "max_length": max_length,
                "final_loss": train_result.training_loss,
                "total_steps": train_result.global_step,
            }
            
            with open(output_path / "training_metadata.json", "w") as f:
                json.dump(metadata, f, indent=2)
            
            if progress_callback:
                progress_callback(100, "Fine-tuning completed successfully!")
            
            logger.info("Fine-tuning completed successfully")
            return metadata
            
        except Exception as e:
            logger.error(f"Fine-tuning failed: {str(e)}")
            raise


# Global service instance
finetuning_service = FinetuningService()
