#!/usr/bin/env python3
"""
Script pour créer des données de démo avec les modèles pré-entraînés.
Simule des jobs d'entraînement terminés pour la présentation.
"""
import asyncio
import json
import sys
from datetime import datetime, timedelta
from pathlib import Path
from uuid import uuid4
import shutil

# Ajouter le répertoire parent au PYTHONPATH
sys.path.insert(0, str(Path(__file__).parent.parent))

import aiosqlite
from app.core.config import settings


async def create_demo_dataset(conn, dataset_info):
    """Crée un dataset de démo dans la base de données"""
    dataset_id = str(uuid4())
    created_at = datetime.now() - timedelta(hours=dataset_info.get("hours_ago", 2))
    
    await conn.execute(
        """
        INSERT INTO datasets (
            id, filename, original_filename, file_path, 
            size_bytes, content_type, status, num_rows, num_columns,
            column_names, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """,
        (
            dataset_id,
            dataset_info["filename"],
            dataset_info["original_filename"],
            dataset_info["file_path"],
            dataset_info["size_bytes"],
            "text/csv",
            "uploaded",
            dataset_info.get("num_rows", 100),
            dataset_info.get("num_columns", 2),
            json.dumps(dataset_info.get("column_names", ["instruction", "response"])),
            created_at.isoformat(),
            created_at.isoformat(),
        ),
    )
    
    print(f"✅ Dataset créé: {dataset_info['original_filename']} (ID: {dataset_id})")
    return dataset_id


async def create_demo_job(conn, job_info, dataset_id):
    """Crée un job de fine-tuning de démo"""
    job_id = str(uuid4())
    created_at = datetime.now() - timedelta(hours=job_info.get("hours_ago", 1))
    updated_at = datetime.now() - timedelta(minutes=job_info.get("minutes_ago", 30))
    
    meta = {
        "model_name": job_info["model_name"],
        "base_model": job_info["base_model"],
        "num_epochs": job_info.get("num_epochs", 3),
        "learning_rate": job_info.get("learning_rate", 2e-4),
        "batch_size": job_info.get("batch_size", 4),
        "lora_r": job_info.get("lora_r", 16),
        "lora_alpha": job_info.get("lora_alpha", 32),
        "final_loss": job_info.get("final_loss", 0.45),
        "training_time": job_info.get("training_time", "15m 32s"),
        "model_path": job_info["model_path"],
    }
    
    await conn.execute(
        """
        INSERT INTO jobs (
            id, dataset_id, status, progress, message,
            created_at, updated_at, meta
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        """,
        (
            job_id,
            dataset_id,
            job_info.get("status", "completed"),
            job_info.get("progress", 100.0),
            job_info.get("message", "Training completed successfully"),
            created_at.isoformat(),
            updated_at.isoformat(),
            json.dumps(meta),
        ),
    )
    
    print(f"✅ Job créé: {job_info['model_name']} - {job_info['status']} (ID: {job_id})")
    return job_id


async def copy_pretrained_model_as_demo(model_cache_path, demo_model_id):
    """Copie un modèle pré-entraîné comme modèle de démo"""
    # Créer le répertoire de destination
    demo_path = Path(settings.models_dir) / demo_model_id
    demo_path.mkdir(parents=True, exist_ok=True)
    
    # Si le modèle existe dans le cache, créer un lien symbolique ou copier les fichiers essentiels
    cache_path = Path(model_cache_path)
    
    if cache_path.exists():
        print(f"📁 Copie du modèle vers {demo_path}")
        # Copier les fichiers essentiels (pas les checkpoints pour économiser l'espace)
        for pattern in ["*.json", "*.safetensors", "*.model", "tokenizer*", "vocab*", "merges.txt", "*.txt"]:
            for file in cache_path.glob(pattern):
                if file.is_file():
                    shutil.copy2(file, demo_path / file.name)
        
        # Créer un fichier README
        readme_content = f"""# Fine-tuned Model

This model was fine-tuned using Sienn-AI platform.

## Model Details
- Base Model: See adapter_config.json
- Training Framework: Hugging Face PEFT (LoRA)
- Created: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}
"""
        (demo_path / "README.md").write_text(readme_content)
        
        # Créer un fichier de metadata
        metadata = {
            "created_at": datetime.now().isoformat(),
            "platform": "Sienn-AI",
            "method": "LoRA Fine-tuning",
        }
        (demo_path / "training_metadata.json").write_text(json.dumps(metadata, indent=2))
        
        print(f"✅ Modèle copié vers {demo_path}")
    else:
        print(f"⚠️  Cache du modèle non trouvé: {cache_path}")
    
    return str(demo_path)


async def create_demo_data():
    """Crée toutes les données de démo"""
    print("🚀 Création des données de démo pour Sienn-AI\n")
    print("=" * 60)
    
    db_path = Path(settings.database_path)
    db_path.parent.mkdir(parents=True, exist_ok=True)
    
    conn = await aiosqlite.connect(str(db_path))
    
    try:
        # 1. Créer des datasets de démo
        print("\n📊 Création des datasets de démo...")
        print("-" * 60)
        
        datasets = [
            {
                "filename": f"{uuid4()}.csv",
                "original_filename": "customer_support_qa.csv",
                "file_path": f"/app/data/uploads/{uuid4()}.csv",
                "size_bytes": 45678,
                "num_rows": 150,
                "num_columns": 2,
                "column_names": ["question", "answer"],
                "hours_ago": 5,
            },
            {
                "filename": f"{uuid4()}.csv",
                "original_filename": "code_generation_dataset.csv",
                "file_path": f"/app/data/uploads/{uuid4()}.csv",
                "size_bytes": 123456,
                "num_rows": 500,
                "num_columns": 3,
                "column_names": ["instruction", "input", "output"],
                "hours_ago": 24,
            },
            {
                "filename": f"{uuid4()}.csv",
                "original_filename": "french_conversation.csv",
                "file_path": f"/app/data/uploads/{uuid4()}.csv",
                "size_bytes": 78901,
                "num_rows": 200,
                "num_columns": 2,
                "column_names": ["instruction", "response"],
                "hours_ago": 12,
            },
        ]
        
        dataset_ids = []
        for ds in datasets:
            dataset_id = await create_demo_dataset(conn, ds)
            dataset_ids.append(dataset_id)
        
        # 2. Créer des jobs avec les modèles pré-entraînés
        print("\n🤖 Création des jobs de fine-tuning...")
        print("-" * 60)
        
        # Job 1: TinyLlama (completed)
        demo_job_id_1 = str(uuid4())
        model_path_1 = f"/app/data/models/{demo_job_id_1}"
        
        jobs = [
            {
                "model_name": "TinyLlama-CustomerSupport-v1",
                "base_model": "TinyLlama/TinyLlama-1.1B-Chat-v1.0",
                "status": "completed",
                "progress": 100.0,
                "num_epochs": 3,
                "learning_rate": 2e-4,
                "batch_size": 4,
                "lora_r": 16,
                "lora_alpha": 32,
                "final_loss": 0.423,
                "training_time": "15m 32s",
                "message": "Training completed successfully! Model ready for inference.",
                "hours_ago": 4,
                "minutes_ago": 15,
                "model_path": model_path_1,
                "cache_path": "/root/.cache/huggingface/hub/models--TinyLlama--TinyLlama-1.1B-Chat-v1.0/snapshots/fe8a4ea1ffedaf415f4da2f062534de366a451e6",
            },
            {
                "model_name": "GPT2-CodeGen-v1",
                "base_model": "gpt2-medium",
                "status": "completed",
                "progress": 100.0,
                "num_epochs": 5,
                "learning_rate": 1.5e-4,
                "batch_size": 8,
                "lora_r": 8,
                "lora_alpha": 16,
                "final_loss": 0.567,
                "training_time": "42m 18s",
                "message": "Training completed successfully! Model ready for inference.",
                "hours_ago": 20,
                "minutes_ago": 45,
                "model_path": f"/app/data/models/{uuid4()}",
                "cache_path": None,
            },
            {
                "model_name": "GPT2-French-Chat-v1",
                "base_model": "gpt2",
                "status": "completed",
                "progress": 100.0,
                "num_epochs": 4,
                "learning_rate": 2.5e-4,
                "batch_size": 4,
                "lora_r": 16,
                "lora_alpha": 32,
                "final_loss": 0.389,
                "training_time": "28m 51s",
                "message": "Training completed successfully! Model ready for inference.",
                "hours_ago": 10,
                "minutes_ago": 20,
                "model_path": f"/app/data/models/{uuid4()}",
                "cache_path": None,
            },
        ]
        
        # Associer les jobs aux datasets
        for i, job in enumerate(jobs):
            dataset_id = dataset_ids[i] if i < len(dataset_ids) else dataset_ids[0]
            job_id = await create_demo_job(conn, job, dataset_id)
            
            # Copier le modèle pré-entraîné si disponible
            if job.get("cache_path"):
                await copy_pretrained_model_as_demo(job["cache_path"], job_id)
        
        # 3. Créer un job en cours (running)
        print("\n⏳ Création d'un job en cours...")
        print("-" * 60)
        
        running_job = {
            "model_name": "Phi2-Advanced-v1",
            "base_model": "microsoft/phi-2",
            "status": "running",
            "progress": 65.0,
            "num_epochs": 3,
            "learning_rate": 1e-4,
            "batch_size": 2,
            "lora_r": 16,
            "lora_alpha": 32,
            "final_loss": 0.512,
            "training_time": "ongoing",
            "message": "Training in progress... Epoch 2/3",
            "hours_ago": 0,
            "minutes_ago": 25,
            "model_path": f"/app/data/models/{uuid4()}",
        }
        
        await create_demo_job(conn, running_job, dataset_ids[1])
        
        await conn.commit()
        print("\n" + "=" * 60)
        print("✅ Données de démo créées avec succès!")
        print("\n📋 Résumé:")
        print(f"   - {len(datasets)} datasets")
        print(f"   - {len(jobs) + 1} jobs (3 completed, 1 running)")
        print(f"\n🌐 Accédez à l'interface: http://localhost:3000")
        print("=" * 60)
        
    finally:
        await conn.close()


if __name__ == "__main__":
    asyncio.run(create_demo_data())
