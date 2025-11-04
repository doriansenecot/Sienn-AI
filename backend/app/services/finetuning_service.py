"""Real fine-tuning service using Transformers and PEFT (LoRA)"""

import json
import logging
from pathlib import Path
from typing import Any, Optional

import torch
from datasets import load_dataset
from peft import LoraConfig, TaskType, get_peft_model
from transformers import (
    AutoModelForCausalLM,
    AutoTokenizer,
    DataCollatorForLanguageModeling,
    Trainer,
    TrainingArguments,
)

logger = logging.getLogger(__name__)


class FinetuningService:
    """Service for fine-tuning language models with LoRA"""

    def __init__(self):
        # Auto-detect best device (CUDA if available, else CPU)
        self.device = "cuda" if torch.cuda.is_available() else "cpu"
        logger.info(f"FinetuningService initialized on device: {self.device}")

    def prepare_dataset(self, dataset_path: str, tokenizer, max_length: int = 512, validation_split: float = 0.1):
        """
        Load and prepare dataset for training with train/validation split.

        Supports CSV, JSON, JSONL formats with 'text' column.
        Returns tuple (train_dataset, eval_dataset)
        """
        # Detect file format
        path = Path(dataset_path)
        extension = path.suffix.lower()

        # Load dataset based on format
        if extension == ".csv":
            dataset = load_dataset("csv", data_files=str(path), split="train")
        elif extension == ".json" or extension == ".jsonl":
            dataset = load_dataset("json", data_files=str(path), split="train")
        elif extension == ".txt":
            # For txt files, read as plain text and split into lines
            with open(path, encoding="utf-8") as f:
                lines = [line.strip() for line in f if line.strip()]
            dataset = {"text": lines}
            from datasets import Dataset

            dataset = Dataset.from_dict(dataset)
        else:
            raise ValueError(f"Unsupported file format: {extension}")

        # Ensure 'text' column exists or create it from multiple columns
        if "text" not in dataset.column_names:
            # Check for instruction-based format (instruction, input, output)
            if all(col in dataset.column_names for col in ["instruction", "output"]):

                def format_instruction(examples):
                    texts = []
                    for i in range(len(examples["instruction"])):
                        inst = examples["instruction"][i]
                        inp = examples.get("input", [""] * len(examples["instruction"]))[i]
                        out = examples["output"][i]

                        # Format optimisé: Simple et direct comme Alpaca
                        if inp and inp.strip():
                            text = f"Below is an instruction with additional context. Write a response that completes the request.\n\n### Instruction:\n{inst}\n\n### Input:\n{inp}\n\n### Response:\n{out}{tokenizer.eos_token}"
                        else:
                            text = f"Below is an instruction. Write a response that completes the request.\n\n### Instruction:\n{inst}\n\n### Response:\n{out}{tokenizer.eos_token}"
                        texts.append(text)
                    return {"text": texts}

                dataset = dataset.map(format_instruction, batched=True, remove_columns=dataset.column_names)
            else:
                # Try to find a suitable column
                possible_columns = ["content", "prompt", "input", "question"]
                text_col = None
                for col in possible_columns:
                    if col in dataset.column_names:
                        text_col = col
                        break

                if text_col:
                    dataset = dataset.rename_column(text_col, "text")
                else:
                    raise ValueError(f"Could not find text column. Available columns: {dataset.column_names}")

        # Split dataset into train and validation
        if validation_split > 0 and len(dataset) > 10:
            split_dataset = dataset.train_test_split(test_size=validation_split, seed=42)
            train_dataset = split_dataset["train"]
            eval_dataset = split_dataset["test"]
            logger.info(f"Dataset split: {len(train_dataset)} train, {len(eval_dataset)} validation")
        else:
            train_dataset = dataset
            eval_dataset = None
            logger.info(f"Using full dataset for training: {len(train_dataset)} samples")

        # Tokenize datasets
        def tokenize_function(examples):
            # Make sure text is a list of strings
            texts = examples["text"]
            if not isinstance(texts, list):
                texts = [texts]

            return tokenizer(
                texts,
                truncation=True,
                max_length=max_length,
                padding="max_length",
            )

        train_tokenized = train_dataset.map(
            tokenize_function,
            batched=True,
            remove_columns=train_dataset.column_names,
        )

        eval_tokenized = None
        if eval_dataset is not None:
            eval_tokenized = eval_dataset.map(
                tokenize_function,
                batched=True,
                remove_columns=eval_dataset.column_names,
            )

        return train_tokenized, eval_tokenized

    def create_lora_config(self, model_name: str) -> LoraConfig:
        """Create LoRA configuration with optimized parameters for different model architectures"""
        # Different models use different layer names for attention projections
        # GPT-2: c_attn (combined Q,K,V), c_proj (output projection), mlp layers
        # Llama/TinyLlama/Mistral: q_proj, k_proj, v_proj, o_proj, gate_proj, up_proj, down_proj
        # Phi-2: Wqkv, out_proj, fc1, fc2

        model_lower = model_name.lower()

        if "gpt2" in model_lower:
            # GPT-2 architecture
            target_modules = ["c_attn", "c_proj", "c_fc"]
            lora_rank = 32
        elif "llama" in model_lower or "tinyllama" in model_lower:
            # Llama architecture (includes TinyLlama)
            target_modules = ["q_proj", "k_proj", "v_proj", "o_proj", "gate_proj", "up_proj", "down_proj"]
            lora_rank = 16  # Llama models are larger, use smaller rank
        elif "phi" in model_lower:
            # Phi-2 architecture
            target_modules = ["Wqkv", "out_proj", "fc1", "fc2"]
            lora_rank = 32
        elif "mistral" in model_lower:
            # Mistral architecture (similar to Llama)
            target_modules = ["q_proj", "k_proj", "v_proj", "o_proj", "gate_proj", "up_proj", "down_proj"]
            lora_rank = 16
        else:
            # Default: common transformer layers
            target_modules = ["q_proj", "v_proj", "o_proj"]
            lora_rank = 16

        return LoraConfig(
            task_type=TaskType.CAUSAL_LM,
            inference_mode=False,
            r=lora_rank,  # Adaptive rank based on model
            lora_alpha=lora_rank * 2,  # Alpha = 2x rank for stability
            lora_dropout=0.1,  # Increased dropout from 0.05 to 0.1 to prevent overfitting
            target_modules=target_modules,
            bias="none",  # Don't adapt biases
            modules_to_save=None,  # Don't save additional modules
            use_rslora=False,  # Can be enabled for better scaling
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
    ) -> dict[str, Any]:
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

            # Load model without quantization to avoid bitsandbytes/triton issues
            # For production with large models, consider using bitsandbytes in a properly configured environment
            logger.info(f"Loading model without quantization for compatibility...")
            
            model = AutoModelForCausalLM.from_pretrained(
                model_name,
                torch_dtype=torch.float16 if self.device == "cuda" else torch.float32,
            )
            
            # Move to device explicitly (safer than device_map="auto")
            if self.device == "cuda":
                model = model.to(self.device)

            if progress_callback:
                progress_callback(10, "Model loaded, preparing LoRA...")

            # Apply LoRA
            logger.info("Applying LoRA configuration...")
            lora_config = self.create_lora_config(model_name)
            model = get_peft_model(model, lora_config)
            model.print_trainable_parameters()

            if progress_callback:
                progress_callback(20, "LoRA applied, loading dataset...")

            # Prepare dataset with train/validation split
            logger.info(f"Loading dataset from {dataset_path}...")
            train_dataset, eval_dataset = self.prepare_dataset(
                dataset_path, tokenizer, max_length, validation_split=0.1
            )

            train_size = len(train_dataset)
            eval_size = len(eval_dataset) if eval_dataset else 0
            if progress_callback:
                progress_callback(30, f"Dataset loaded ({train_size} train, {eval_size} val), starting training...")

            # Training arguments
            output_path = Path(output_dir)
            output_path.mkdir(parents=True, exist_ok=True)

            # Calculate optimal steps for evaluation and saving
            steps_per_epoch = max(1, train_size // (batch_size * 2))  # account for gradient accumulation
            eval_steps = max(5, steps_per_epoch // 2)  # Evaluate twice per epoch

            training_args = TrainingArguments(
                output_dir=str(output_path),
                num_train_epochs=num_epochs,
                per_device_train_batch_size=batch_size,
                per_device_eval_batch_size=batch_size,
                gradient_accumulation_steps=2,  # Effective batch size = batch_size * 2
                learning_rate=learning_rate,
                weight_decay=0.01,  # L2 regularization
                lr_scheduler_type="cosine",  # Cosine learning rate schedule with decay
                warmup_ratio=0.15,  # 15% warmup for more stable training (increased from 10%)
                warmup_steps=max(100, int(steps_per_epoch * num_epochs * 0.15)),  # Explicit warmup steps
                logging_steps=max(1, steps_per_epoch // 4),  # Log 4 times per epoch
                logging_first_step=True,  # Log the first step to see initial loss
                eval_strategy="steps" if eval_dataset else "no",
                eval_steps=eval_steps if eval_dataset else None,
                save_strategy="steps",
                save_steps=eval_steps,
                save_total_limit=3,  # Keep 3 best checkpoints (increased from 2)
                load_best_model_at_end=bool(eval_dataset),
                metric_for_best_model="loss" if eval_dataset else None,
                greater_is_better=False,  # Lower loss is better
                # Early stopping to prevent overfitting
                early_stopping_patience=3 if eval_dataset else None,  # Stop if no improvement after 3 evals
                early_stopping_threshold=0.001,  # Minimum improvement required
                fp16=self.device == "cuda",
                optim="adamw_torch",  # AdamW optimizer
                max_grad_norm=1.0,  # Gradient clipping
                dataloader_num_workers=0,  # Single worker for stability
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
                eval_dataset=eval_dataset,
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

            # Get evaluation metrics if available
            eval_loss = None
            if eval_dataset:
                eval_results = trainer.evaluate()
                eval_loss = eval_results.get("eval_loss")
                logger.info(f"Final evaluation loss: {eval_loss}")

            # Save training metadata
            # Convert LoRA config to dict and handle non-JSON-serializable types (sets)
            lora_config_dict = lora_config.to_dict()
            for key, value in lora_config_dict.items():
                if isinstance(value, set):
                    lora_config_dict[key] = list(value)
            
            metadata = {
                "model_name": model_name,
                "dataset_path": dataset_path,
                "learning_rate": learning_rate,
                "num_epochs": num_epochs,
                "batch_size": batch_size,
                "effective_batch_size": batch_size * 2,  # with gradient accumulation
                "max_length": max_length,
                "train_samples": train_size,
                "eval_samples": eval_size,
                "final_train_loss": train_result.training_loss,
                "final_eval_loss": eval_loss,
                "total_steps": train_result.global_step,
                "lora_config": lora_config_dict,
                "device": self.device,
                "training_duration_seconds": train_result.metrics.get("train_runtime", 0),
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
