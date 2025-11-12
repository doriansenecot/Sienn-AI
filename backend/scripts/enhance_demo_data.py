#!/usr/bin/env python3
"""
Script pour enrichir les données de démo avec des métriques d'entraînement réalistes.
Ajoute des graphiques de loss, temps, et autres métriques pour rendre la démo convaincante.
"""
import asyncio
import json
import sys
from datetime import datetime, timedelta
from pathlib import Path
from uuid import uuid4
import random

sys.path.insert(0, str(Path(__file__).parent.parent))

import aiosqlite
from app.core.config import settings


def generate_training_logs(num_epochs: int, base_loss: float = 2.0):
    """Génère des logs d'entraînement réalistes"""
    logs = []
    current_loss = base_loss
    
    for epoch in range(1, num_epochs + 1):
        # Loss diminue progressivement avec un peu de bruit
        epoch_loss = current_loss * (0.7 + random.random() * 0.2)
        current_loss = epoch_loss
        
        # Générer plusieurs steps par epoch
        steps_per_epoch = random.randint(15, 25)
        for step in range(1, steps_per_epoch + 1):
            step_loss = epoch_loss + random.uniform(-0.1, 0.1)
            logs.append({
                "epoch": epoch,
                "step": step,
                "loss": round(max(0.1, step_loss), 4),
                "learning_rate": 2e-4 * (0.95 ** (epoch - 1)),
                "timestamp": (datetime.now() - timedelta(hours=num_epochs - epoch, minutes=steps_per_epoch - step)).isoformat()
            })
    
    return logs


def generate_evaluation_metrics():
    """Génère des métriques d'évaluation"""
    return {
        "accuracy": round(random.uniform(0.85, 0.95), 4),
        "perplexity": round(random.uniform(5, 15), 2),
        "bleu_score": round(random.uniform(0.65, 0.85), 4),
        "rouge_l": round(random.uniform(0.70, 0.90), 4),
        "training_samples": random.randint(100, 500),
        "validation_samples": random.randint(20, 100),
    }


async def enhance_job_metadata(conn, job_id: str, job_meta: dict):
    """Enrichit les métadonnées d'un job avec des données réalistes"""
    
    num_epochs = job_meta.get("num_epochs", 3)
    
    # Ajouter des logs d'entraînement
    training_logs = generate_training_logs(num_epochs, base_loss=job_meta.get("final_loss", 0.5) * 3)
    
    # Ajouter des métriques d'évaluation
    eval_metrics = generate_evaluation_metrics()
    
    # Ajouter des détails sur le dataset
    dataset_info = {
        "format": "csv",
        "columns": ["instruction", "response"],
        "examples_used": eval_metrics["training_samples"],
        "avg_prompt_length": random.randint(50, 200),
        "avg_response_length": random.randint(100, 400),
    }
    
    # Ajouter des infos sur les ressources utilisées
    resource_usage = {
        "peak_memory_gb": round(random.uniform(4, 12), 2),
        "avg_gpu_utilization": round(random.uniform(75, 95), 1),
        "total_training_time_seconds": random.randint(900, 3600),
        "avg_samples_per_second": round(random.uniform(2, 8), 2),
    }
    
    # Enrichir les métadonnées existantes
    enhanced_meta = {
        **job_meta,
        "training_logs": training_logs,
        "evaluation_metrics": eval_metrics,
        "dataset_info": dataset_info,
        "resource_usage": resource_usage,
        "framework_version": {
            "transformers": "4.38.0",
            "peft": "0.9.0",
            "torch": "2.2.0",
        },
        "hyperparameters": {
            "lora_r": job_meta.get("lora_r", 16),
            "lora_alpha": job_meta.get("lora_alpha", 32),
            "lora_dropout": 0.05,
            "target_modules": ["q_proj", "k_proj", "v_proj", "o_proj"],
            "optimizer": "adamw",
            "warmup_steps": 10,
            "gradient_accumulation_steps": 4,
        },
    }
    
    # Mettre à jour dans la base de données
    await conn.execute(
        "UPDATE jobs SET meta = ? WHERE id = ?",
        (json.dumps(enhanced_meta), job_id)
    )
    
    return enhanced_meta


async def create_realistic_training_history():
    """Crée un historique d'entraînement réaliste pour tous les jobs completed"""
    
    print("🎨 Enrichissement des données de démo pour une présentation réaliste")
    print("=" * 80)
    
    db_path = Path(settings.database_path)
    conn = await aiosqlite.connect(str(db_path))
    
    try:
        # Récupérer tous les jobs completed
        cursor = await conn.execute(
            "SELECT id, meta FROM jobs WHERE status = 'completed'"
        )
        rows = await cursor.fetchall()
        
        print(f"\n📊 Enrichissement de {len(rows)} jobs completed...")
        print("-" * 80)
        
        for job_id, meta_str in rows:
            if not meta_str:
                continue
            
            meta = json.loads(meta_str)
            model_name = meta.get("model_name", "Unknown")
            
            print(f"\n🔧 Traitement: {model_name}")
            print(f"   Job ID: {job_id}")
            
            # Enrichir les métadonnées
            enhanced = await enhance_job_metadata(conn, job_id, meta)
            
            print(f"   ✅ Ajouté:")
            print(f"      - {len(enhanced['training_logs'])} training logs")
            print(f"      - Métriques d'évaluation (accuracy: {enhanced['evaluation_metrics']['accuracy']})")
            print(f"      - Dataset info ({enhanced['dataset_info']['examples_used']} exemples)")
            print(f"      - Resource usage (peak: {enhanced['resource_usage']['peak_memory_gb']} GB)")
        
        await conn.commit()
        
        print("\n" + "=" * 80)
        print("✅ Enrichissement terminé avec succès!")
        print("\n💡 Ces jobs ont maintenant:")
        print("   - Graphiques de loss détaillés")
        print("   - Métriques d'évaluation")
        print("   - Utilisation des ressources")
        print("   - Logs d'entraînement complets")
        print("\n🎯 Parfait pour votre présentation!")
        print("=" * 80)
        
    finally:
        await conn.close()


if __name__ == "__main__":
    asyncio.run(create_realistic_training_history())
