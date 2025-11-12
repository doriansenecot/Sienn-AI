"""
API endpoint pour récupérer les métriques détaillées d'un job pour affichage graphique
"""

import json

from fastapi import APIRouter, HTTPException

from app.db import get_db

router = APIRouter(prefix="/api/jobs", tags=["jobs"])


@router.get("/{job_id}/metrics")
async def get_job_metrics(job_id: str):
    """Récupère toutes les métriques détaillées d'un job pour affichage"""
    async with get_db() as conn:
        cursor = await conn.execute("SELECT status, meta, created_at, updated_at FROM jobs WHERE id = ?", (job_id,))
        row = await cursor.fetchone()

        if not row:
            raise HTTPException(status_code=404, detail="Job not found")

        status, meta_str, created_at, updated_at = row
        meta = json.loads(meta_str) if meta_str else {}

        # Extraire les métriques enrichies
        return {
            "job_id": job_id,
            "status": status,
            "model_name": meta.get("model_name", "Unknown"),
            "base_model": meta.get("base_model", "N/A"),
            "created_at": created_at,
            "updated_at": updated_at,
            "training_logs": meta.get("training_logs", []),
            "evaluation_metrics": meta.get("evaluation_metrics", {}),
            "dataset_info": meta.get("dataset_info", {}),
            "resource_usage": meta.get("resource_usage", {}),
            "hyperparameters": meta.get("hyperparameters", {}),
            "framework_version": meta.get("framework_version", {}),
            "num_epochs": meta.get("num_epochs", 0),
            "learning_rate": meta.get("learning_rate", 0),
            "batch_size": meta.get("batch_size", 0),
            "final_loss": meta.get("final_loss", 0),
            "training_time": meta.get("training_time", "N/A"),
            "model_path": meta.get("model_path", ""),
        }
