"""Model export service for various formats (Ollama, HuggingFace, GGUF)."""

import json
import logging
import shutil
import tarfile
import zipfile
from pathlib import Path
from typing import Optional

from app.services.storage_service import storage_service

logger = logging.getLogger(__name__)


class ExportService:
    """Service for exporting fine-tuned models to different formats."""

    MODEL_FILES = [
        "adapter_model.safetensors",
        "adapter_config.json",
        "tokenizer.json",
        "tokenizer_config.json",
        "special_tokens_map.json",
        "vocab.json",
        "merges.txt",
    ]

    def __init__(self, models_dir: Path = Path("data/models")):
        """Initialize export service."""
        self.models_dir = models_dir
        self.export_dir = Path("data/exports")
        self.export_dir.mkdir(parents=True, exist_ok=True)

    def export_to_ollama(
        self,
        job_id: str,
        model_name: str,
        base_model: str = "gpt2",
        temperature: float = 0.7,
        top_p: float = 0.9,
        top_k: int = 40,
    ) -> Optional[Path]:
        """Export model to Ollama format (Modelfile + adapter)."""
        try:
            model_path = self.models_dir / job_id
            if not model_path.exists():
                logger.error(f"Model not found: {model_path}")
                return None

            export_path = self.exports_dir / f"{job_id}_ollama"
            export_path.mkdir(parents=True, exist_ok=True)

            metadata = self._load_metadata(model_path)

            self._create_modelfile(export_path, model_name, base_model, metadata, temperature, top_p, top_k)
            self._copy_model_files(model_path, export_path)
            self._create_readme(export_path, model_name, base_model, metadata)

            archive_path = self._create_tar_archive(export_path, model_name, job_id)

            self._upload_to_storage(archive_path, job_id, "ollama", model_name, "application/gzip")

            logger.info(f"Exported model to Ollama format: {archive_path}")
            return archive_path

        except Exception as e:
            logger.error(f"Ollama export failed: {e}", exc_info=True)
            return None

    def export_to_huggingface(self, job_id: str) -> Optional[Path]:
        """Export model to HuggingFace format (adapter + tokenizer)."""
        try:
            model_path = self.models_dir / job_id
            if not model_path.exists():
                logger.error(f"Model not found: {model_path}")
                return None

            archive_path = self.exports_dir / f"{job_id}_huggingface.zip"
            with zipfile.ZipFile(archive_path, "w", zipfile.ZIP_DEFLATED) as zipf:
                for file in model_path.rglob("*"):
                    if file.is_file():
                        zipf.write(file, file.relative_to(model_path))

            self._upload_to_storage(archive_path, job_id, "huggingface", f"{job_id}.zip", "application/zip")

            logger.info(f"Exported model to HuggingFace format: {archive_path}")
            return archive_path

        except Exception as e:
            logger.error(f"HuggingFace export failed: {e}", exc_info=True)
            return None

    def export_to_gguf(self, job_id: str, quantization: str = "q4_k_m") -> Optional[Path]:
        """
        Export model to GGUF format (quantized).
        Requires converting to full model first, then quantizing with llama.cpp.

        Args:
            job_id: Job ID
            quantization: Quantization type (q4_k_m, q5_k_m, q8_0, f16, f32)

        Returns:
            Path to GGUF file or None if failed
        """
        logger.info(f"Starting GGUF export for job {job_id} with quantization {quantization}")

        try:
            model_path = self.models_dir / job_id
            if not model_path.exists():
                logger.error(f"Model path not found: {model_path}")
                return None

            # Create export directory
            export_dir = self.export_dir / job_id / "gguf"
            export_dir.mkdir(parents=True, exist_ok=True)

            # Load metadata to get base model
            metadata = self._load_metadata(model_path)
            base_model = metadata.get("base_model", "gpt2")

            logger.info(f"Loading model and merging LoRA adapter for {base_model}")

            # Step 1: Load base model and merge with LoRA adapter
            from transformers import AutoModelForCausalLM, AutoTokenizer
            from peft import PeftModel
            import torch

            tokenizer = AutoTokenizer.from_pretrained(base_model)
            base_model_obj = AutoModelForCausalLM.from_pretrained(
                base_model, torch_dtype=torch.float16, device_map="cpu"
            )

            # Load and merge PEFT model
            model = PeftModel.from_pretrained(base_model_obj, str(model_path))
            merged_model = model.merge_and_unload()

            # Save merged model
            merged_path = export_dir / "merged_model"
            merged_path.mkdir(exist_ok=True)
            merged_model.save_pretrained(str(merged_path))
            tokenizer.save_pretrained(str(merged_path))

            logger.info(f"Merged model saved to {merged_path}")

            # Step 2: Convert to GGUF format
            # Note: This requires llama.cpp to be installed
            # For now, we'll create a placeholder and log instructions
            gguf_file = export_dir / f"model-{quantization}.gguf"

            # Check if llama.cpp is available
            import subprocess
            import shutil

            convert_script = shutil.which("convert.py") or shutil.which("convert-hf-to-gguf.py")
            quantize_binary = shutil.which("quantize") or shutil.which("llama-quantize")

            if convert_script and quantize_binary:
                logger.info("llama.cpp tools found, attempting conversion...")

                # Convert to FP16 GGUF first
                fp16_gguf = export_dir / "model-f16.gguf"
                convert_cmd = [
                    "python3",
                    convert_script,
                    str(merged_path),
                    "--outfile",
                    str(fp16_gguf),
                    "--outtype",
                    "f16",
                ]

                logger.info(f"Running: {' '.join(convert_cmd)}")
                result = subprocess.run(
                    convert_cmd,
                    capture_output=True,
                    text=True,
                    timeout=600,
                )

                if result.returncode != 0:
                    logger.error(f"Conversion failed: {result.stderr}")
                    return None

                logger.info("Converted to FP16 GGUF successfully")

                # Quantize if not f16
                if quantization != "f16":
                    logger.info(f"Quantizing to {quantization}...")
                    quantize_cmd = [
                        quantize_binary,
                        str(fp16_gguf),
                        str(gguf_file),
                        quantization.upper(),
                    ]

                    logger.info(f"Running: {' '.join(quantize_cmd)}")
                    result = subprocess.run(
                        quantize_cmd,
                        capture_output=True,
                        text=True,
                        timeout=600,
                    )

                    if result.returncode != 0:
                        logger.error(f"Quantization failed: {result.stderr}")
                        return fp16_gguf  # Return FP16 as fallback

                    logger.info(f"Quantized to {quantization} successfully")
                else:
                    gguf_file = fp16_gguf

                logger.info(f"GGUF export completed: {gguf_file}")
                return gguf_file

            else:
                # llama.cpp not available - create instructions file
                logger.warning("llama.cpp tools not found. Creating manual conversion instructions.")

                instructions_file = export_dir / "CONVERSION_INSTRUCTIONS.txt"
                instructions = f"""GGUF Conversion Instructions
===============================

The merged model has been saved to:
{merged_path}

To convert to GGUF format manually, follow these steps:

1. Install llama.cpp:
   git clone https://github.com/ggerganov/llama.cpp
   cd llama.cpp
   make

2. Convert to GGUF (FP16):
   python3 convert-hf-to-gguf.py {merged_path} \\
     --outfile {export_dir}/model-f16.gguf \\
     --outtype f16

3. Quantize (optional, for smaller size):
   ./quantize {export_dir}/model-f16.gguf \\
     {export_dir}/model-{quantization}.gguf \\
     {quantization.upper()}

Quantization options:
- q4_k_m: 4-bit, medium quality (recommended)
- q5_k_m: 5-bit, high quality
- q8_0: 8-bit, very high quality
- f16: 16-bit floating point (no quantization)
- f32: 32-bit floating point (full precision)

For more information, see:
https://github.com/ggerganov/llama.cpp
"""

                with open(instructions_file, "w") as f:
                    f.write(instructions)

                logger.info(f"Conversion instructions saved to {instructions_file}")
                return merged_path  # Return merged model path

        except Exception as e:
            logger.error(f"GGUF export failed: {e}", exc_info=True)
            return None

    def _load_metadata(self, model_path: Path) -> dict:
        """Load training metadata from model directory."""
        metadata_file = model_path / "training_metadata.json"
        if metadata_file.exists():
            with open(metadata_file) as f:
                return json.load(f)
        return {}

    def _create_modelfile(
        self,
        export_path: Path,
        model_name: str,
        base_model: str,
        metadata: dict,
        temperature: float,
        top_p: float,
        top_k: int,
    ) -> None:
        """Generate and save Modelfile for Ollama."""
        training_time = metadata.get("training_time_seconds", 0)
        epochs = metadata.get("num_epochs", 0)

        modelfile = f"""# Modelfile for {model_name}
# Generated by Sienn-AI

FROM {base_model}

ADAPTER ./adapter_model.safetensors

PARAMETER temperature {temperature}
PARAMETER top_p {top_p}
PARAMETER top_k {top_k}
PARAMETER stop "<|endoftext|>"
PARAMETER stop "</s>"

SYSTEM \"\"\"You are an AI assistant fine-tuned with Sienn-AI. You are helpful, harmless, and honest.\"\"\"

# Training metadata
# Base model: {base_model}
# Training epochs: {epochs}
# Training time: {training_time:.2f}s
"""
        with open(export_path / "Modelfile", "w") as f:
            f.write(modelfile)

    def _copy_model_files(self, source: Path, destination: Path) -> None:
        """Copy model files to export directory."""
        for filename in self.MODEL_FILES:
            src = source / filename
            if src.exists():
                shutil.copy2(src, destination / filename)

        metadata_src = source / "training_metadata.json"
        if metadata_src.exists():
            shutil.copy2(metadata_src, destination / "training_metadata.json")

    def _create_readme(self, export_path: Path, model_name: str, base_model: str, metadata: dict) -> None:
        """Generate and save README for export."""
        training_time = metadata.get("training_time_seconds", 0)
        epochs = metadata.get("num_epochs", 0)
        samples = metadata.get("num_samples", 0)

        readme = f"""# {model_name}

This model was fine-tuned using **Sienn-AI**, a local fine-tuning platform.

## Model Details

- **Base Model**: {base_model}
- **Fine-tuning Method**: LoRA (Low-Rank Adaptation)
- **Training Epochs**: {epochs}
- **Training Samples**: {samples}
- **Training Time**: {training_time:.2f}s

## Usage with Ollama

```bash
# Extract this archive
tar -xzf {model_name}.tar.gz

# Create Ollama model
ollama create {model_name} -f Modelfile

# Use the model
ollama run {model_name} "Your prompt here"
```

## Usage with HuggingFace Transformers

```python
from transformers import AutoModelForCausalLM, AutoTokenizer
from peft import PeftModel

base_model = AutoModelForCausalLM.from_pretrained("{base_model}")
tokenizer = AutoTokenizer.from_pretrained("{base_model}")

model = PeftModel.from_pretrained(base_model, "./")

inputs = tokenizer("Your prompt here", return_tensors="pt")
outputs = model.generate(**inputs, max_new_tokens=100)
print(tokenizer.decode(outputs[0]))
```

## Training Configuration

```json
{json.dumps(metadata, indent=2)}
```

---
Generated by Sienn-AI
"""
        with open(export_path / "README.md", "w") as f:
            f.write(readme)

    def _create_tar_archive(self, export_path: Path, model_name: str, job_id: str) -> Path:
        """Create compressed tar archive."""
        archive_path = self.exports_dir / f"{job_id}_ollama.tar.gz"
        with tarfile.open(archive_path, "w:gz") as tar:
            tar.add(export_path, arcname=model_name)
        return archive_path

    def _upload_to_storage(
        self,
        file_path: Path,
        job_id: str,
        format_name: str,
        filename: str,
        content_type: str,
    ) -> None:
        """Upload exported file to MinIO storage."""
        storage_service.upload_file(
            bucket_name=storage_service.exports_bucket,
            object_name=f"{job_id}/{format_name}/{filename}",
            file_path=file_path,
            content_type=content_type,
        )


export_service = ExportService()
