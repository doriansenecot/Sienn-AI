```markdown
# Roadmap priorisée (version équilibrée)

Objectif délai : date finale cible 2025-11-28 (avec marge)

Phase 0 — Préparation (1-2 jours)
- Créer arborescence repo (templates fournis)
- README, .env.example, .gitignore

Phase 1 — MVP Backend (3-5 jours)
- Endpoints essentiels : upload, start-finetuning, training-status, test-model, download
- init_db.py, schema SQLite
- Intégration de base Ollama (client)

Phase 2 — Fine-tuning & Workers (5-7 jours)
- Script de fine-tuning LoRA (services/finetuning.py)
- Worker Celery simple + Redis
- Sauvegarde checkpoints sur MinIO (ou dossier data/)

Phase 3 — Frontend Minimal (4-6 jours)
- Pages Upload, Config, Dashboard (statut textuel/polling), TestModel
- Axios service + forms

Phase 4 — DevOps local (2-4 jours)
- docker-compose.yml et Dockerfiles placeholders
- scripts/install_fedora.sh ; start_local.sh

Phase 5 — Docs & Présentation (2-3 jours)
- API_DOCUMENTATION.md (avec cURL)
- INSTALLATION_FEDORA.md
- USER_GUIDE.md
- Préparation de la démo + répétitions

Marge & polish (5-7 jours)
- Fix bugs, améliorer UX, tests end-to-end, compression/export GGUF, optimiser mémoire

Total estimé : ~22-30 jours ouvrés (adapté à travail 3j/sem)
```