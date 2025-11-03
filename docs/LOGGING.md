# Logging System Documentation

## 📋 Overview

Sienn-AI utilise un système de logging structuré avec rotation automatique des fichiers, formatage JSON, et contexte enrichi.

## 🏗️ Architecture

### Composants

1. **ContextualJsonFormatter** - Formatter JSON personnalisé
2. **LogContext** - Context manager pour ajouter du contexte
3. **log_function_call** - Decorator pour logger les appels de fonctions
4. **log_performance** - Context manager pour mesurer les performances

### Fichiers de Logs

```
data/logs/
├── sienn-ai.log           # Tous les logs (rotation 10MB, 10 backups)
├── errors.log             # Erreurs uniquement (rotation 5MB, 5 backups)
└── daily/                 # Logs quotidiens (rotation minuit, 30 jours)
    ├── sienn-ai-20251103.log
    ├── sienn-ai-20251104.log
    └── ...
```

## 🔧 Configuration

### Variables d'environnement (.env)

```bash
# Niveau de log (DEBUG, INFO, WARNING, ERROR, CRITICAL)
LOG_LEVEL=INFO

# Activer les logs JSON structurés
ENABLE_JSON_LOGS=true

# Activer la rotation des fichiers
ENABLE_LOG_ROTATION=true

# Répertoire des logs
LOG_DIR=data/logs
```

### Fichiers de configuration

- `backend/app/core/config.py` - Configuration Pydantic
- `backend/app/core/logging_config.py` - Setup du logging

## 📝 Utilisation

### 1. Logger basique

```python
from app.core.logging_config import get_logger

logger = get_logger(__name__)

logger.debug("Message de debug")
logger.info("Information")
logger.warning("Avertissement")
logger.error("Erreur")
logger.critical("Erreur critique")
```

### 2. Logs avec contexte additionnel

```python
logger.info(
    "Dataset uploaded",
    extra={
        "dataset_id": "abc-123",
        "size_bytes": 1024,
        "user_id": "user-456"
    }
)
```

### 3. Context Manager pour contexte persistant

```python
from app.core.logging_config import LogContext

with LogContext(logger, job_id="job-123", user_id="user-456") as log:
    log.info("Starting job")  # Inclut automatiquement job_id et user_id
    log.info("Processing data")
    log.info("Job completed")
```

### 4. Decorator pour logger les appels de fonctions

```python
from app.core.logging_config import log_function_call

@log_function_call(logger)
def process_dataset(dataset_id: str, config: dict):
    # Logs automatiquement l'entrée et la sortie
    return result
```

### 5. Mesure de performance

```python
from app.core.logging_config import log_performance

with log_performance(logger, "model_loading"):
    model = load_model(model_path)
    # Log automatique de la durée
```

## 📊 Format des Logs

### Console (développement)

```
2025-11-03 12:00:00 - app.routes.datasets - INFO - Dataset uploaded
```

### JSON (production)

```json
{
  "timestamp": "2025-11-03T12:00:00.000000",
  "level": "INFO",
  "name": "app.routes.datasets",
  "message": "Dataset uploaded",
  "component": "api",
  "module": "datasets",
  "function": "upload_dataset",
  "line": 18,
  "dataset_id": "abc-123",
  "size_bytes": 1024
}
```

## 🎯 Champs Automatiques

Chaque log contient automatiquement:

- `timestamp` - ISO 8601 timestamp
- `level` - Niveau (DEBUG, INFO, etc.)
- `name` - Nom du logger (module path)
- `message` - Message du log
- `component` - Composant (api, service, worker, app)
- `module` - Nom du module Python
- `function` - Nom de la fonction
- `line` - Numéro de ligne

## 🔍 Niveaux de Log par Composant

### Application

- **DEBUG**: Détails techniques, variables, état interne
- **INFO**: Opérations normales, événements importants
- **WARNING**: Situations anormales mais non critiques
- **ERROR**: Erreurs qui nécessitent attention
- **CRITICAL**: Erreurs fatales, système non fonctionnel

### Third-Party Libraries

Les bibliothèques externes ont des niveaux réduits:

```python
uvicorn.access → WARNING
uvicorn.error → INFO
celery → INFO
transformers → WARNING
torch → WARNING
datasets → WARNING
```

## 🛠️ Exemples d'Utilisation Avancés

### 1. Logging dans un Endpoint API

```python
from app.core.logging_config import get_logger, log_performance

logger = get_logger(__name__)

@router.post("/train")
async def start_training(request: TrainRequest):
    logger.info(
        "Training request received",
        extra={
            "dataset_id": request.dataset_id,
            "model": request.model_name,
            "epochs": request.epochs
        }
    )
    
    try:
        with log_performance(logger, "job_submission"):
            job_id = await submit_job(request)
        
        logger.info("Training job submitted", extra={"job_id": job_id})
        return {"job_id": job_id}
        
    except Exception as e:
        logger.error(
            "Failed to submit training job",
            extra={"dataset_id": request.dataset_id, "error": str(e)},
            exc_info=True
        )
        raise
```

### 2. Logging dans un Service

```python
from app.core.logging_config import get_logger, LogContext

logger = get_logger(__name__)

class FinetuningService:
    def finetune(self, job_id: str, dataset_path: str):
        with LogContext(logger, job_id=job_id) as log:
            log.info("Starting fine-tuning")
            
            log.info("Loading model", extra={"model": "gpt2"})
            model = self.load_model("gpt2")
            
            log.info("Preparing dataset", extra={"path": dataset_path})
            dataset = self.prepare_dataset(dataset_path)
            
            log.info("Training started", extra={"samples": len(dataset)})
            # ... training code ...
            
            log.info("Training completed", extra={"final_loss": 0.234})
```

### 3. Logging dans une Tâche Celery

```python
from celery import shared_task
from app.core.logging_config import get_logger, LogContext

logger = get_logger(__name__)

@shared_task
def finetune_model(job_id: str, dataset_id: str):
    with LogContext(logger, job_id=job_id, task="finetune") as log:
        log.info("Task started", extra={"dataset_id": dataset_id})
        
        try:
            result = perform_finetuning(job_id, dataset_id)
            log.info("Task completed", extra={"result": result})
            return result
        except Exception as e:
            log.error("Task failed", extra={"error": str(e)}, exc_info=True)
            raise
```

## 📈 Monitoring et Analyse

### Recherche dans les Logs

```bash
# Tous les logs INFO du jour
cat data/logs/daily/sienn-ai-$(date +%Y%m%d).log | grep INFO

# Erreurs des dernières 24h
cat data/logs/errors.log

# Logs d'un job spécifique (avec jq)
cat data/logs/sienn-ai.log | jq 'select(.job_id == "abc-123")'

# Performance des opérations
cat data/logs/sienn-ai.log | jq 'select(.operation != null) | {operation, duration_seconds}'
```

### Rotation Automatique

Les logs sont automatiquement rotés:
- **Par taille**: sienn-ai.log (10MB), errors.log (5MB)
- **Par temps**: daily/ (minuit chaque jour)
- **Rétention**: 10 backups (taille), 30 jours (daily)

## 🚨 Debugging

### Mode Debug

```bash
# Dans .env
LOG_LEVEL=DEBUG

# Ou via variable d'environnement
LOG_LEVEL=DEBUG docker compose up
```

### Désactiver JSON (lisibilité)

```bash
# Dans .env
ENABLE_JSON_LOGS=false
```

### Logs en temps réel

```bash
# Suivre tous les logs
tail -f data/logs/sienn-ai.log

# Suivre les erreurs
tail -f data/logs/errors.log

# Avec formatage JSON
tail -f data/logs/sienn-ai.log | jq '.'
```

## 🎓 Best Practices

### DO ✅

1. **Utiliser des niveaux appropriés**
   - DEBUG pour détails techniques
   - INFO pour événements normaux
   - ERROR pour vrais problèmes

2. **Ajouter du contexte**
   ```python
   logger.info("Job completed", extra={"job_id": job_id, "duration": 123})
   ```

3. **Utiliser LogContext pour contexte persistant**
   ```python
   with LogContext(logger, request_id=req_id):
       # Tous les logs incluent request_id
   ```

4. **Logger les exceptions avec traceback**
   ```python
   logger.error("Failed", exc_info=True)
   ```

### DON'T ❌

1. **Ne pas logger de données sensibles**
   ```python
   # ❌ BAD
   logger.info("User login", extra={"password": user.password})
   
   # ✅ GOOD
   logger.info("User login", extra={"user_id": user.id})
   ```

2. **Ne pas logger dans des boucles serrées**
   ```python
   # ❌ BAD
   for item in large_list:
       logger.debug(f"Processing {item}")
   
   # ✅ GOOD
   logger.info(f"Processing {len(large_list)} items")
   ```

3. **Ne pas utiliser f-strings pour messages coûteux**
   ```python
   # ❌ BAD (calculé même si DEBUG désactivé)
   logger.debug(f"Data: {expensive_computation()}")
   
   # ✅ GOOD (lazy evaluation)
   if logger.isEnabledFor(logging.DEBUG):
       logger.debug(f"Data: {expensive_computation()}")
   ```

## 🔗 Intégrations Futures

- **Prometheus**: Métriques via `/metrics`
- **Grafana**: Dashboards de logs
- **Sentry**: Capture d'erreurs
- **ELK Stack**: Elasticsearch + Logstash + Kibana

## 📚 Références

- [Python Logging Cookbook](https://docs.python.org/3/howto/logging-cookbook.html)
- [Structured Logging Best Practices](https://www.datadoghq.com/blog/python-logging-best-practices/)
- [Celery Logging](https://docs.celeryq.dev/en/stable/userguide/tasks.html#logging)
