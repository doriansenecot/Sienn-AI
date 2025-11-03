# 🧪 Guide de Test du Modèle Fine-tuné

Ce guide explique comment tester que ton modèle a été correctement fine-tuné.

## 📋 Table des matières

1. [Pré-requis](#pré-requis)
2. [Vérification du Training](#vérification-du-training)
3. [Test d'Inférence Local](#test-dinférence-local)
4. [Test via l'API](#test-via-lapi)
5. [Métriques de Qualité](#métriques-de-qualité)
6. [Troubleshooting](#troubleshooting)

---

## 🔧 Pré-requis

### Services Docker en cours d'exécution
```bash
cd /home/dorian/Documents/Epitech/HUB/Free-Project/Sienn-AI
docker compose up -d

# Vérifier l'état des services
docker ps --filter "name=sienn-"
```

Tous les services doivent être **Up** et **healthy** :
- ✅ `sienn-api` (port 8000)
- ✅ `sienn-worker`
- ✅ `sienn-redis` (port 6379)
- ✅ `sienn-minio` (ports 9000-9001)
- ✅ `sienn-frontend` (port 3000)

---

## ✅ Étape 1: Vérification du Training

### 1.1 Via le Frontend
1. Ouvre **http://localhost:3000**
2. Va dans la section **"Modèles"** ou **"Training Jobs"**
3. Vérifie que ton job a le statut **"Completed"** ✅

### 1.2 Via l'API
```bash
# Lister tous les jobs de training
curl http://localhost:8000/api/jobs

# Vérifier un job spécifique
curl http://localhost:8000/api/training-status/<JOB_ID>
```

**Réponse attendue:**
```json
{
  "job_id": "xxx-xxx-xxx",
  "status": "completed",
  "progress": 100,
  "model_id": "yyy-yyy-yyy",
  "metrics": {
    "final_loss": 0.234,
    "training_time": "5m 23s"
  }
}
```

### 1.3 Vérifier les fichiers du modèle
```bash
# Liste les modèles créés
ls -la data/models/

# Vérifie le contenu d'un modèle spécifique
ls -la data/models/<MODEL_ID>/
```

**Fichiers attendus:**
- ✅ `adapter_config.json` - Configuration LoRA
- ✅ `adapter_model.safetensors` - Poids du modèle
- ✅ `README.md` - Documentation
- ✅ `training_args.bin` - Arguments d'entraînement

---

## 🧪 Étape 2: Test d'Inférence Local

### Option A: Script Python Direct

```bash
# Depuis le dossier racine Sienn-AI
python tests/test_inference.py data/models/<MODEL_ID>
```

**Ce que fait ce script:**
- ✅ Charge le modèle GPT-2 de base
- ✅ Applique les adaptateurs LoRA
- ✅ Génère des réponses pour plusieurs prompts
- ✅ Compare avec le modèle de base

**Exemple de sortie:**
```
================================================================================
🧪 TEST D'INFÉRENCE - Modèle: data/models/5bb4b302-612a-4463-885f-23e538ea9f2c
================================================================================

📦 Chargement du tokenizer...
🤖 Chargement du modèle de base GPT-2...
🔧 Chargement des adaptateurs LoRA...
💻 Utilisation du device: cuda

────────────────────────────────────────────────────────────────────────────────
🎯 Test #1
────────────────────────────────────────────────────────────────────────────────
📝 Prompt: Qu'est-ce que l'intelligence artificielle?

✅ Réponse générée:
┌──────────────────────────────────────────────────────────────────────────────┐
│ L'intelligence artificielle est la capacité des machines à simuler...       │
└──────────────────────────────────────────────────────────────────────────────┘
```

### Option B: Via Python REPL

```python
from transformers import AutoTokenizer, AutoModelForCausalLM
from peft import PeftModel

# Charger
tokenizer = AutoTokenizer.from_pretrained("gpt2")
base_model = AutoModelForCausalLM.from_pretrained("gpt2")
model = PeftModel.from_pretrained(base_model, "data/models/<MODEL_ID>")

# Tester
prompt = "Qu'est-ce que l'IA?"
inputs = tokenizer(prompt, return_tensors="pt")
outputs = model.generate(**inputs, max_length=100)
print(tokenizer.decode(outputs[0]))
```

---

## 🌐 Étape 3: Test via l'API

### 3.1 Lister les modèles disponibles
```bash
python tests/test_api_inference.py
```

Ou avec curl:
```bash
curl http://localhost:8000/api/models | jq
```

### 3.2 Tester l'inférence via l'API
```bash
python tests/test_api_inference.py <MODEL_ID>
```

**Exemple:**
```bash
python tests/test_api_inference.py 5bb4b302-612a-4463-885f-23e538ea9f2c
```

### 3.3 Test manuel avec curl
```bash
curl -X POST http://localhost:8000/api/inference \
  -H "Content-Type: application/json" \
  -d '{
    "model_id": "<MODEL_ID>",
    "prompt": "Explique-moi le machine learning",
    "max_length": 150,
    "temperature": 0.7
  }' | jq
```

**Réponse attendue:**
```json
{
  "generated_text": "Le machine learning est une branche...",
  "model_id": "xxx-xxx-xxx",
  "metadata": {
    "generation_time": "1.23s",
    "tokens_generated": 45
  }
}
```

### 3.4 Test via le Frontend
1. Ouvre **http://localhost:3000**
2. Va dans **"Inference"** ou **"Test Model"**
3. Sélectionne ton modèle fine-tuné
4. Entre un prompt de test
5. Clique sur **"Generate"**

---

## 📊 Étape 4: Métriques de Qualité

### 4.1 Vérifier la perte (Loss)

La perte devrait **diminuer** pendant le training :

```bash
# Via l'API
curl http://localhost:8000/api/training-metrics/<JOB_ID> | jq '.metrics.loss'
```

**Valeurs attendues:**
- Loss initiale: ~3.0-5.0 (GPT-2)
- Loss finale: **< 1.0** (bon) ou **< 0.5** (excellent)

### 4.2 Cohérence des Réponses

Compare les réponses du modèle fine-tuné avec le modèle de base:

```bash
python tests/test_inference.py <MODEL_ID>
# Appuie sur Enter pour voir la comparaison
```

**Attentes:**
- ✅ Le modèle fine-tuné devrait donner des réponses **plus pertinentes**
- ✅ Les réponses devraient être **dans le style** de ton dataset
- ✅ Moins de "hallucinations" ou de réponses hors sujet

### 4.3 Temps de Génération

```bash
# Mesure le temps de réponse
time curl -X POST http://localhost:8000/api/inference \
  -H "Content-Type: application/json" \
  -d '{"model_id": "<MODEL_ID>", "prompt": "Test"}'
```

**Temps acceptable:**
- CPU: 1-5 secondes pour 50 tokens
- GPU: 0.1-0.5 secondes pour 50 tokens

---

## 🎯 Critères de Succès

Ton modèle est bien fine-tuné si :

### ✅ Critères Techniques
- [ ] Le training se termine avec `status: completed`
- [ ] La loss finale est < 1.0
- [ ] Les fichiers du modèle existent (`adapter_model.safetensors`, etc.)
- [ ] Le modèle charge sans erreur
- [ ] L'inférence génère du texte sans crash

### ✅ Critères Qualitatifs
- [ ] Les réponses sont **cohérentes** avec le prompt
- [ ] Le style correspond à ton **dataset de training**
- [ ] Les réponses sont **meilleures** que le modèle de base
- [ ] Pas de répétitions excessives ou de texte incohérent
- [ ] Le modèle "comprend" les instructions de ton dataset

---

## 🔍 Tests Comparatifs

### Comparaison Modèle de Base vs Fine-tuné

Utilise ces prompts basés sur ton `test_chat.csv`:

```python
test_prompts = [
    "Qu'est-ce que l'intelligence artificielle?",
    "Comment fonctionne le machine learning?",
    "Explique-moi les réseaux de neurones",
    "Quelle est la différence entre IA et ML?",
    "Comment débuter en data science?",
]
```

Pour chaque prompt, compare:

| Critère | Modèle Base | Modèle Fine-tuné | Note |
|---------|-------------|------------------|------|
| Pertinence | ⭐⭐ | ⭐⭐⭐⭐ | Amélioration |
| Cohérence | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ | Excellent |
| Style | Générique | Spécialisé | Conforme |
| Longueur | Variable | Contrôlée | Bien |

---

## 🐛 Troubleshooting

### ❌ Erreur: "Model not found"
```bash
# Vérifie que le modèle existe
ls data/models/<MODEL_ID>

# Vérifie dans la BDD
docker exec -it sienn-api python -c "
from app.db import get_db
from app.models import Model
db = next(get_db())
models = db.query(Model).all()
print([m.id for m in models])
"
```

### ❌ Erreur: "Out of memory"
- Réduis `max_length` dans les requêtes d'inférence
- Utilise `batch_size=1`
- Active `use_cache=False`

### ❌ Réponses incohérentes
- Le modèle n'a peut-être pas assez entraîné (epochs trop faibles)
- Le dataset est trop petit (< 100 examples)
- Ajuste `temperature` (essaie 0.5 pour moins de variabilité)

### ❌ Training bloqué en "Running"
```bash
# Check les logs du worker
docker logs sienn-worker --tail 50

# Redémarre le worker
docker restart sienn-worker
```

---

## 📝 Checklist Complète

Avant de valider ton modèle:

```
Phase 1: Training
[ ] Dataset uploadé avec succès
[ ] Training démarré sans erreur
[ ] Training terminé avec status "completed"
[ ] Loss finale < 1.0
[ ] Fichiers du modèle présents

Phase 2: Tests Techniques
[ ] Script test_inference.py passe sans erreur
[ ] Script test_api_inference.py passe sans erreur
[ ] L'API retourne des réponses valides
[ ] Le frontend affiche le modèle

Phase 3: Tests Qualitatifs
[ ] Réponses cohérentes avec les prompts
[ ] Style conforme au dataset
[ ] Amélioration vs modèle de base
[ ] Temps de génération acceptable

Phase 4: Documentation
[ ] Screenshots des résultats sauvegardés
[ ] Métriques documentées
[ ] Prompts de test définis
```

---

## 🚀 Prochaines Étapes

Une fois ton modèle validé:

1. **Export** pour Ollama : `POST /api/export/<MODEL_ID>`
2. **Partage** : Générer un README avec les performances
3. **Production** : Déployer l'API d'inférence
4. **Amélioration** : Fine-tune avec plus de données

---

## 📚 Ressources

- [Documentation HuggingFace Transformers](https://huggingface.co/docs/transformers)
- [Guide LoRA/PEFT](https://huggingface.co/docs/peft)
- [FastAPI Documentation](https://fastapi.tiangolo.com/)

