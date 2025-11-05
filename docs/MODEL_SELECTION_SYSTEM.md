# Système de Sélection de Modèles - Documentation

## Vue d'ensemble

Le système de sélection de modèles permet aux utilisateurs de choisir le modèle optimal pour leur hardware et leurs besoins en qualité/vitesse. Chaque modèle a des configurations pré-optimisées qui sont automatiquement appliquées.

## Modèles Disponibles

### 1. DistilGPT-2 (82M paramètres)
- **VRAM requis**: 1.5 GB
- **Qualité**: ⭐⭐ (2/5)
- **Vitesse**: ⭐⭐⭐⭐⭐ (5/5)
- **Batch size**: 16
- **Learning rate**: 5e-4
- **Use case**: Tests rapides, hardware très limité, expérimentations

### 2. GPT-2 Base (124M paramètres)
- **VRAM requis**: 2.0 GB
- **Qualité**: ⭐⭐ (2/5)
- **Vitesse**: ⭐⭐⭐⭐⭐ (5/5)
- **Batch size**: 8
- **Learning rate**: 3e-4
- **Use case**: Modèle par défaut, bon compromis, hardware moyen

### 3. GPT-2 Medium (355M paramètres)
- **VRAM requis**: 3.5 GB
- **Qualité**: ⭐⭐⭐ (3/5)
- **Vitesse**: ⭐⭐⭐⭐ (4/5)
- **Batch size**: 4
- **Learning rate**: 2e-4
- **Use case**: Meilleure qualité sans trop sacrifier la vitesse

### 4. GPT-2 Large (774M paramètres)
- **VRAM requis**: 5.0 GB
- **Qualité**: ⭐⭐⭐⭐ (4/5)
- **Vitesse**: ⭐⭐⭐ (3/5)
- **Batch size**: 2
- **Learning rate**: 1e-4
- **Use case**: Haute qualité, nécessite 6GB+ VRAM

## Architecture du Système

### Backend

#### 1. Configuration des Modèles (`finetuning_service.py`)

```python
@dataclass
class ModelConfig:
    name: str
    display_name: str
    batch_size: int
    max_length: int
    lora_rank: int
    lora_alpha: int
    gradient_accumulation_steps: int
    learning_rate: float
    target_modules: list[str]
    vram_required_gb: float
    quality_rating: int
    speed_rating: int
    description: str
```

Chaque modèle a une configuration pré-définie dans `MODEL_CONFIGS` qui spécifie:
- Hyperparamètres optimisés (LR, batch size, etc.)
- Configuration LoRA (rank, alpha, target modules)
- Méta-informations (VRAM requis, ratings, description)

#### 2. Auto-Configuration

La méthode `finetune()` accepte maintenant des paramètres optionnels:
- Si `batch_size=None`, utilise la valeur du modèle
- Si `learning_rate=None`, utilise la valeur du modèle
- Si `max_length=None`, utilise la valeur du modèle

Cela permet:
- Configuration manuelle pour utilisateurs avancés
- Auto-configuration pour utilisateurs débutants
- Override sélectif de certains paramètres

#### 3. Route API (`/api/models/available`)

```python
GET /api/models/available
Response: {
  "models": [
    {
      "id": "gpt2",
      "name": "GPT-2 (124M)",
      "vram_required_gb": 2.0,
      "quality_rating": 2,
      "speed_rating": 5,
      "batch_size": 8,
      "max_length": 512,
      "learning_rate": 0.0003,
      "description": "..."
    },
    ...
  ]
}
```

### Frontend

#### 1. Composant ModelSelector

Situé dans `/frontend/src/components/ModelSelector/index.tsx`

Fonctionnalités:
- Charge la liste des modèles depuis l'API
- Affiche un dropdown avec les modèles disponibles
- Montre les détails du modèle sélectionné:
  - Ratings qualité/vitesse (étoiles)
  - VRAM requis
  - Configuration par défaut
  - Description

#### 2. Page TrainingConfig

Situé dans `/frontend/src/pages/TrainingConfig/index.tsx`

Workflow:
1. Utilisateur upload un dataset → redirigé vers `/training`
2. Sélectionne un modèle via `ModelSelector`
3. Configure le nombre d'epochs (autres params auto)
4. Lance le training → redirigé vers Dashboard

#### 3. Modifications API Types

Dans `/frontend/src/types/api.ts`:
```typescript
export interface StartFinetuningRequest {
  dataset_id: string;
  model_name: string;
  learning_rate?: number;  // Optional - uses model default
  num_epochs?: number;
  batch_size?: number;     // Optional - uses model default
  max_length?: number;     // Optional - uses model default
}
```

## Flow Utilisateur

```
1. Upload Dataset
   └─> /upload
       └─> Upload CSV/JSON file
           └─> "Configure Training" button

2. Configure Training
   └─> /training
       ├─> Select Model (gpt2, gpt2-medium, etc.)
       ├─> Set Epochs (default: 5)
       └─> "Start Training" button

3. Monitor Training
   └─> /dashboard
       └─> View training progress
           └─> Test model when complete
```

## Ajout d'un Nouveau Modèle

Pour ajouter un nouveau modèle (ex: Llama, Mistral):

### 1. Backend - Ajouter la Configuration

Dans `backend/app/services/finetuning_service.py`:

```python
MODEL_CONFIGS = {
    # ... existing models ...
    "meta-llama/Llama-2-7b-hf": ModelConfig(
        name="meta-llama/Llama-2-7b-hf",
        display_name="Llama 2 7B",
        batch_size=1,
        max_length=512,
        lora_rank=16,
        lora_alpha=32,
        gradient_accumulation_steps=16,
        learning_rate=1e-4,
        target_modules=["q_proj", "k_proj", "v_proj", "o_proj", 
                       "gate_proj", "up_proj", "down_proj"],
        vram_required_gb=14.0,
        quality_rating=5,
        speed_rating=2,
        description="Excellent quality, requires 16GB+ VRAM"
    ),
}
```

### 2. Tester la Configuration

```bash
# Redémarrer l'API
docker compose restart api

# Vérifier que le modèle apparaît
curl http://localhost:8000/api/models/available | jq '.models[] | select(.id=="meta-llama/Llama-2-7b-hf")'

# Lancer un training de test
curl -X POST http://localhost:8000/api/start-finetuning \
  -H "Content-Type: application/json" \
  -d '{
    "dataset_id": "YOUR_DATASET_ID",
    "model_name": "meta-llama/Llama-2-7b-hf",
    "num_epochs": 1
  }'
```

## Avantages du Système

1. **Simplicité pour l'utilisateur**
   - Pas besoin de connaître les hyperparamètres
   - Choix guidé par hardware (VRAM requis)
   - Ratings qualité/vitesse clairs

2. **Flexibilité**
   - Override possible pour utilisateurs avancés
   - Ajout facile de nouveaux modèles
   - Configuration centralisée

3. **Optimisation automatique**
   - Batch size adapté à la VRAM
   - Gradient accumulation compensatoire
   - LoRA config spécifique au modèle

4. **Maintenabilité**
   - Configuration unique par modèle
   - Pas de duplication de code
   - Validation automatique des paramètres

## Recommandations Hardware

| VRAM  | Modèle Recommandé        | Use Case                    |
|-------|--------------------------|----------------------------|
| 2GB   | DistilGPT-2, GPT-2      | Tests, prototypes          |
| 4GB   | GPT-2, GPT-2 Medium     | Production légère          |
| 6GB   | GPT-2 Medium/Large      | Production standard        |
| 8GB+  | GPT-2 Large, custom     | Haute qualité              |
| 12GB+ | Llama-2 7B, Mistral 7B  | Meilleure qualité possible |

## Limitations et Problèmes Connus

1. **Phi-2 (2.7B) sur 6GB VRAM**
   - Ne fonctionne pas malgré les optimisations
   - Le modèle seul prend ~5.4GB
   - Pas assez de mémoire pour les activations

2. **Datasets très longs**
   - max_length=512 peut être trop pour certains modèles
   - Considérer une réduction automatique si nécessaire

3. **Validation VRAM**
   - Warning affiché mais pas de blocage
   - L'utilisateur peut tenter quand même

## Tests Effectués

✅ API `/api/models/available` retourne 4 modèles
✅ Frontend charge et affiche les modèles
✅ Ratings (étoiles) s'affichent correctement
✅ Configuration auto appliquée au training
✅ Navigation Upload → Training → Dashboard
✅ GPT-2 base fonctionne avec config auto

## Prochaines Étapes Suggérées

1. Ajouter GPT-2 XL (1.5B) pour 8-10GB VRAM
2. Intégrer Mistral 7B avec quantization 4-bit
3. Permettre l'édition manuelle des hyperparamètres (mode avancé)
4. Ajouter un estimateur de temps de training
5. Créer des presets par type de tâche (chat, completion, etc.)
