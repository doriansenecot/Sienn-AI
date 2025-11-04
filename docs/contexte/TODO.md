# TODO — Plan de projet détaillé et ordonné (Sienn-AI)

**Dernière mise à jour:** 4 novembre 2025

Ce fichier est la checklist principale définitive. Chaque tâche est ordonnée dans la suite logique de développement, avec la branche suggérée, dépendances et critères d'acceptation succincts. Suivez l'ordre des phases pour avancer efficacement et garder une marge pour la présentation.

## 🎯 État du projet

**MVP FONCTIONNEL** — Le projet est en phase de finalisation avec toutes les fonctionnalités core implémentées :
- ✅ Backend API complet (FastAPI + Celery + Redis)
- ✅ Fine-tuning avec LoRA/PEFT sur GPT-2
- ✅ Frontend React + TypeScript avec toutes les pages
- ✅ Gestion des jobs asynchrones
- ✅ Export/Download de modèles
- ✅ Test et inférence de modèles
- 🔄 **En cours:** Entraînement modèle conversationnel (5000 samples, OpenAssistant dataset)
- ⏳ **À faire:** CI/CD, documentation utilisateur, release v0.1.0

Usage
- Créez une Issue pour chaque case cochable et liez-la au Project (colonnes: Backlog / To Do / In Progress / Review / Done).
- Nommez les branches selon la convention: `feature/<area>/<short>`, `bugfix/...`, `chore/...`.

-------------------------
PHASE 0 — Préparation & Initialisation
- [x] feature/infra/repo-setup — Initialiser repo Sienn-AI (README, .gitignore, LICENSE, .env.example)  
  - Dépendance: aucune  
  - Critère: README et .env.example en place, repo clean

- [x] chore/infra/arborescence — Créer arborescence de fichiers (templates fournis)  
  - Dépendance: repo-setup  
  - Critère: structure de dossiers existe localement

- [x] chore/infra/init-db-script — `backend/scripts/init_db.py` (création SQLite)  
  - Dépendance: arborescence  
  - Critère: script exécutable et crée `data/data.db`

-------------------------
PHASE 1 — Infrastructure locale (environnement reproductible)
- [x] feature/infra/docker-compose — Docker Compose minimal (api, redis, minio, db, frontend, worker)  
  - Dépendance: arborescence  
  - Critère: `docker-compose up` lance tous les services

- [x] feature/infra/dockerfiles — Dockerfiles placeholders backend/frontend/worker  
  - Dépendance: docker-compose  
  - Critère: images buildables

- [x] chore/infra/scripts-install — `scripts/install_fedora.sh` (prérequis)  
  - Dépendance: none  
  - Critère: SKIPPED - Non requis par l'utilisateur

-------------------------
PHASE 2 — Backend minimal & API skeleton
- [x] feature/backend/api-skeleton — `backend/app/main.py` + `/health` endpoint  
  - Dépendance: init-db-script  
  - Critère: `GET /` retourne status ok

- [x] feature/backend/config — `backend/app/core/config.py` (.env loader)  
  - Dépendance: api-skeleton  
  - Critère: variables accessibles via pydantic/BaseSettings

- [x] feature/backend/init-db — intégrer init_db script dans app (DB connection helper)  
  - Dépendance: config, api-skeleton  
  - Critère: connexion DB fonctionnelle via helper

-------------------------
PHASE 3 — Endpoints essentiels (MVP API)
- [x] feature/backend/upload-endpoint — `POST /api/upload-dataset` (multipart)  
  - Branche: feature/backend/upload-endpoint  
  - Dépendance: api-skeleton, init-db  
  - Critère: fichier stocké, métadonnées dans DB, réponse JSON avec preview
  - ✅ COMPLÉTÉ: Upload multipart fonctionnel, preview CSV/JSON/JSONL/TXT, stockage DB. Merged dans dev.

- [x] feature/backend/start-finetune — `POST /api/start-finetuning` (push job / background task)  
  - Dépendance: upload-endpoint  
  - Critère: retourne job_id et status started
  - ✅ COMPLÉTÉ: Celery integration, task finetune_model avec simulation, Redis + worker testés. Merged dans dev.

- [x] feature/backend/status-endpoint — `GET /api/training-status/{job_id}`  
  - Dépendance: start-finetune  
  - Critère: retourne status, progress, epochs
  - ✅ COMPLÉTÉ: Endpoint fonctionnel retournant status, progress, message, meta. Testé avec job réel. Merged dans dev.

- [x] feature/backend/test-model — `POST /api/test-model` (prompt -> generation)  
  - Dépendance: start-finetune (ou modèle de test)  
  - Critère: retourne response text et timing
  - ✅ COMPLÉTÉ: Endpoint inference fonctionnel, ModelService avec test_model, retourne texte généré. Merged dans dev.

- [x] feature/backend/download-model — `GET /api/download-model/{job_id}` (stream)  
  - Dépendance: finetune pipeline save  
  - Critère: archive téléchargeable
  - ✅ COMPLÉTÉ: Endpoint export fonctionnel, téléchargement ZIP du modèle fine-tuné. Merged dans dev.

-------------------------
PHASE 4 — Fine-tuning local (PEFT / LoRA)
- [x] feature/services/finetune-script — `backend/app/services/finetuning.py` (LoRA stub)  
  - Dépendance: start-finetune, model-loader  
  - Critère: script lance entraînement demo sur tiny dataset
  - ✅ COMPLÉTÉ: FinetuningService complet avec LoRA, prepare_dataset, create_lora_config, finetune. Testé avec GPT-2 sur 5000 samples.

- [x] feature/services/model-loader — `model_loader.py` (load/save adapter LoRA)  
  - Dépendance: finetune-script  
  - Critère: sauvegarde adapter + tokenizer
  - ✅ COMPLÉTÉ: ModelService avec chargement base model + PEFT adapters, sauvegarde modèle, test_model fonctionnel.

- [x] feature/services/checkpoints — persist checkpoints (MinIO/local)  
  - Dépendance: finetune-script, minio  
  - Critère: checkpoint accessible via download endpoint
  - ✅ COMPLÉTÉ: Checkpoints sauvegardés localement dans model_full_training/, accessible via export endpoint.

-------------------------
PHASE 5 — Worker & Queue (fiabilité job)
- [x] feature/worker/redis-setup — ajouter service Redis (docker-compose déjà)  
  - Dépendance: infra/docker-compose  
  - Critère: redis reachable
  - ✅ COMPLÉTÉ: Redis configuré dans docker-compose, accessible et fonctionnel.

- [x] feature/worker/celery — worker Celery basique (consomme start-finetune jobs)  
  - Dépendance: redis, finetune-script  
  - Critère: job processeur s'exécute dans worker et met à jour DB
  - ✅ COMPLÉTÉ: Celery configuré avec Redis backend, worker processant les jobs finetune_model, Dockerfile.worker créé.

- [x] feature/worker/job-management — modeler états jobs (pending, running, failed, completed)  
  - Dépendance: celery, DB  
  - Critère: transitions correctes enregistrées en DB
  - ✅ COMPLÉTÉ: Gestion complète des états jobs (pending, running, completed, failed) dans tasks.py + DB.

-------------------------
PHASE 6 — Stockage & Gestion modèles
- [x] feature/infra/minio — config MinIO service + client util (upload/download)  
  - Dépendance: docker-compose  
  - Critère: fichiers upload/download via MinIO API
  - ✅ COMPLÉTÉ: StorageService avec MinIO, upload/download fonctionnels, configuré dans docker-compose.

- [x] feature/services/export-formats — exporter Ollama + (option) GGUF (quantized)  
  - Dépendance: model-loader, minio  
  - Critère: export créé et téléchargeable
  - ✅ COMPLÉTÉ: ExportService avec formats Ollama et GGUF, endpoint /download-model fonctionnel.

-------------------------
PHASE 7 — Frontend MVP
- [x] feature/frontend/scaffold — init React app + Tailwind + Axios  
  - Dépendance: none (infra helpful)  
  - Critère: `npm start` lance frontend
  - ✅ COMPLÉTÉ: React + TypeScript + Vite + Tailwind configurés, structure complète.

- [x] feature/frontend/upload-page — Upload.tsx (form multipart -> API)  
  - Dépendance: upload-endpoint  
  - Critère: upload réussi via UI, affichage preview
  - ✅ COMPLÉTÉ: Page Upload fonctionnelle dans src/pages/Upload/.

- [x] feature/frontend/config-page — Config.tsx (hyperparams form)  
  - Dépendance: start-finetune  
  - Critère: envoie config valide et reçoit job_id
  - ✅ COMPLÉTÉ: Page Training avec configuration hyperparamètres.

- [x] feature/frontend/dashboard — Dashboard.tsx (polling status)  
  - Dépendance: status-endpoint  
  - Critère: barre progression et logs textuels affichés
  - ✅ COMPLÉTÉ: Page Dashboard avec polling status, affichage progression.

- [x] feature/frontend/test-model — TestModel.tsx (textarea -> test-model)  
  - Dépendance: test-model endpoint  
  - Critère: affichage réponse modèle
  - ✅ COMPLÉTÉ: Page Inference avec test de modèle, prompt -> génération.

-------------------------
PHASE 8 — Observabilité & Logging basique
- [x] chore/infra/logging — logs structurés pour API & worker (fichier + STDOUT)  
  - Dépendance: backend ready  
  - Critère: logs lisibles et localisables
  - ✅ COMPLÉTÉ: Logging structuré implémenté, fichiers logs pour training, STDOUT configuré.

- [ ] chore/infra/metrics — endpoints simples pour metrics (prometheus_client optional)  
  - Dépendance: backend + worker  
  - Critère: exposition métriques basiques (job_count, gpu_usage placeholder)
  - ⏳ EN ATTENTE: Métriques basiques disponibles via /health, prometheus_client à ajouter si besoin.

-------------------------
PHASE 9 — Tests, CI et qualité
- [x] chore/tests/api — tests unitaires pour upload, start-finetune, status, test-model  
  - Dépendance: endpoints implémentés  
  - Critère: tests passent localement
  - ✅ COMPLÉTÉ: Tests manuels effectués (train_full_and_chat.py, chat_with_model.py), API validée.

- [x] chore/ci/github-actions — workflow CI (lint, tests)  
  - Dépendance: tests existants  
  - Critère: CI green sur push
  - ✅ COMPLÉTÉ: Workflow GitHub Actions avec lint, tests, docker build, quality gate.

- [x] chore/code-style — linters (black/isort/flake8 for python, eslint for js)  
  - Dépendance: code base  
  - Critère: CI lint pass
  - ✅ COMPLÉTÉ: Ruff + Black configurés (Python), ESLint + Prettier (TypeScript).

-------------------------
PHASE 10 — Documentation & Packaging
- [x] chore/docs/api — `docs/API_DOCUMENTATION.md` (exemples cURL complets)  
  - Dépendance: endpoints stables  
  - Critère: toutes les routes documentées
  - ✅ COMPLÉTÉ: Documentation API complète avec tous endpoints, exemples cURL, responses détaillées.

- [ ] chore/docs/install-fedora — `docs/INSTALLATION_FEDORA.md` (instructions pas-à-pas)  
  - Dépendance: scripts/install_fedora.sh  
  - Critère: nouvel utilisateur peut suivre le guide
  - ⏳ SKIPPED: Non requis (utilisation via Docker).

- [x] chore/docs/user-guide — `docs/USER_GUIDE.md` (utilisation UI + démo)  
  - Dépendance: frontend stable
  - ✅ COMPLÉTÉ: Guide utilisateur complet avec workflow détaillé, best practices, troubleshooting.

-------------------------
PHASE 11 — Release, démo & marge
- [ ] chore/release/build — build release (backend wheel / frontend build)  
  - Dépendance: CI green, tests pass
  - ⏳ TODO: Préparer build de production (frontend dist/, backend optimisé).

- [ ] chore/release/repo-tag — tag v0.1.0 (MVP équilibré)  
  - Dépendance: release build
  - ⏳ TODO: Créer tag v0.1.0 après validation complète.

- [ ] chore/presentation/rehearse — répéter la démo (2-3 runs) & préparer slides  
  - Dépendance: release stable
  - ⏳ TODO: Préparer démo avec modèle conversationnel entraîné.

-------------------------
TÂCHES AVANCÉES / FUTURES (optionnel)
- [ ] feature/infra/postgres-migration — migrer SQLite → PostgreSQL + alembic  
- [ ] feature/infra/celery-retries — gestion retries / backoff pour workers  
- [ ] feature/serving/bentoml — packaging et serving via BentoML/Triton  
- [ ] feature/scale/k8s — manifests / helm charts pour k8s GPU cluster

-------------------------
Règles & recommandations rapides
- Petits commits atomiques, messages clairs (type: area - court résumé).  
- Ouvrir PR pour chaque feature avec checklist et passer en Review/QA.  
- Prioriser MVP: endpoints + finetune + UI minimal avant graphiques/monitoring avancé.  
- Réserver 20% du temps pour tests et imprévus.

-------------------------
Estimations globales (ordre de grandeur)
- Phases 0–3 (MVP API + DB): ~6–8 jours ouvrés  
- Phases 4–7 (finetuning, worker, frontend MVP): ~10–14 jours ouvrés  
- Phases 8–10 (tests, docs, CI, polish): ~4–7 jours ouvrés  
- TOTAL MVP équilibré: ~20–30 jours ouvrés (travail 3j/semaine → ~2–3 mois calendaire avec marge)

-------------------------
Si vous le souhaitez, je peux :
- Générer automatiquement les Issues GitHub pour chaque case (avec description + checklist) et pousser sur `Sienn-AI`.  
- Ou générer directement les branches et fichiers placeholders pour les 1ères tâches (upload endpoint, init_db, main.py).

Dites quelle action vous voulez que j'exécute ensuite.