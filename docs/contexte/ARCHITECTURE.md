```markdown
# Architecture cible (scalable) — Sienn-AI

But : permettre démo locale aujourd'hui et montée en charge progressive.

Composants principaux
- Ingress / LB : Traefik ou NGINX (reverse proxy)
- API stateless : FastAPI (Uvicorn/Gunicorn)
- Auth : OAuth2 / JWT (optionnel pour MVP)
- Queue : Redis
- Workers : Celery ou RQ (exécution fine-tuning en container)
- DB métadonnées : SQLite (dev) → PostgreSQL (prod)
- Object Storage : MinIO (local) → S3 (prod)
- Model Serving : Ollama (local) ; BentoML/Triton pour production
- Observabilité : Prometheus + Grafana, Loki (logs)
- CI/CD : GitHub Actions -> build & push images

Flux simplifié
1. Frontend upload → API reçoit et stocke dataset dans MinIO (ou disque) + enregistrer métadonnées en DB.
2. API push job to Redis queue.
3. Worker prend job, télécharge dataset, exécute fine-tuning LoRA, sauvegarde checkpoints sur MinIO, met à jour DB.
4. API expose status/download/test endpoints ; serving pods lisent modèles depuis MinIO.

Scalabilité progressive
- Local (Docker Compose) : API, Redis, Postgres/SQLite, MinIO, 1 worker.
- Prod simple : small k8s cluster + node GPU (1-2 nœuds).
- Prod scale : multi-node, distributed training (deepspeed/accelerate), storage distribué (MinIO/CEPH), managed DB.

Bonnes pratiques
- Stateless API
- Toutes les données persistantes hors conteneur (volumes/MinIO/Postgres)
- Migrations via Alembic
- Secrets management (K8s Secret / Vault)
- Metrics exposition via prometheus_client dans workers et API

Ressources pour dev local
- docker-compose.yml (FastAPI, redis, postgres, minio, worker, frontend)
- scripts/install_fedora.sh (prérequis)
- scripts/start_local.sh (wrapper docker-compose up)
```