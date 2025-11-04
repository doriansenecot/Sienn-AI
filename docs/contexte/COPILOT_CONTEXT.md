```markdown
# Contexte global pour GitHub Copilot / Développeur

Projet : Sienn-AI
Auteur / Owner GitHub : doriansenecot

But du projet
- Plateforme locale no-code pour fine-tuning de LLMs.
- Exécutable sur poste personnel (Fedora 43 recommandé, GPU NVIDIA compatible CUDA 11.8).
- Fine-tuning efficace via PEFT (LoRA), export modèles (Ollama, GGUF), frontend React minimal pour upload/config/test.

Stack technique ciblée
- Backend : FastAPI, Uvicorn, PyTorch, Transformers, PEFT (LoRA)
- Frontend : React, TailwindCSS, Axios
- Queue / Workers : Redis + Celery (option) ou simple task runner
- DB métadonnées : SQLite pour dev local (Postgres recommandé pour scale)
- Stockage artefacts : MinIO (S3 compatible) local -> AWS S3 en prod
- Model management : Ollama (local) ; BentoML/Triton pour serving scalable

Objectifs immédiats (MVP équilibré)
- Upload CSV/JSON, lancer fine-tuning LoRA, sauvegarder checkpoints, tester génération, export Ollama/GGUF, UI minimal et responsive.
- Monitoring basique via polling (pas WebSocket obligation).
- Documentation API avec exemples cURL incluse.

Contraintes
- Vous travaillez 3 jours/semaine, temps limité durant présentation → prévoir marge.
- Démo locale sur Fedora 43 (scripts d'installation fournis).
- Repo initial nommé `Sienn-AI`.

Livrables attendus (priorité)
1. Structure du repo + fichiers placeholders
2. Backend minimal (FastAPI routes pour upload, start-finetune, status, test, download)
3. Script d'init DB (init_db.py)
4. Frontend minimal (Upload, Config, TestModel)
5. Docker Compose pour environnement local (FastAPI, Postgres/SQLite, Redis, MinIO, worker)
6. Docs: README, INSTALLATION_FEDORA.md, API_DOCUMENTATION.md, USER_GUIDE.md

Règles de développement à communiquer à Copilot
- Garder code simple, lisible et commenté.
- Favoriser tests manuels / unitaires simples.
- Mettre en place configuration via variables d'environnement (`.env.example`).
- Pour les scripts heavy (fine-tuning), utiliser PEFT/LoRA, fp16, gradient accumulation.
- Prévoir points d'extension (switch SQLite → PostgreSQL, add Celery).

Références rapides (exemples cURL)
- POST /api/upload-dataset : upload multipart/form-data (file=@data.csv)
- POST /api/start-finetuning : JSON {dataset, model, learning_rate, epochs, batch_size}
- GET /api/training-status/{job_id}
- POST /api/test-model : JSON {prompt, model_id, temperature}
- GET /api/download-model/{job_id}?format=ollama|gguf

Mots-clés utiles pour suggestions de Copilot
- FastAPI, pydantic, uvicorn, sqlalchemy, alembic, PEFT, LoRA, transformers, torch, ollama, minio, celery, redis, docker-compose, podman, Fedora 43, CUDA 11.8

Attentes de qualité
- Endpoints documentés (exemples cURL).
- Gestion d'erreurs claire et retours JSON standardisés.
- Scripts d'installation reproduisibles.
- Tests basiques : upload, lancement job, statut, test modèle, téléchargement.

Usage: Placer ce fichier à la racine du repo pour que Copilot le lise et s'en inspire pour compléter/suggérer fichiers et implementations.
```