#!/bin/bash
# Script pour monitorer la progression de l'entraînement

echo "╔══════════════════════════════════════════════════════════════════════╗"
echo "║              MONITORING ENTRAÎNEMENT - SIENN-AI                      ║"
echo "╚══════════════════════════════════════════════════════════════════════╝"
echo ""

MODEL_DIR="/home/dorian/Documents/Epitech/HUB/Free-Project/Sienn-AI/backend/model_full_training"

while true; do
    clear
    echo "╔══════════════════════════════════════════════════════════════════════╗"
    echo "║              MONITORING ENTRAÎNEMENT - SIENN-AI                      ║"
    echo "╚══════════════════════════════════════════════════════════════════════╝"
    echo ""
    echo "⏰ Heure: $(date '+%H:%M:%S')"
    echo ""
    
    # Chercher le dernier modèle en cours
    LATEST_MODEL=$(ls -td "$MODEL_DIR"/model_full_* 2>/dev/null | head -1)
    
    if [ -n "$LATEST_MODEL" ]; then
        echo "📂 Modèle en cours: $(basename "$LATEST_MODEL")"
        echo ""
        
        # Afficher les checkpoints
        if [ -d "$LATEST_MODEL" ]; then
            CHECKPOINTS=$(ls -d "$LATEST_MODEL"/checkpoint-* 2>/dev/null | wc -l)
            echo "✅ Checkpoints créés: $CHECKPOINTS"
            
            # Taille du modèle
            if [ -f "$LATEST_MODEL/adapter_model.safetensors" ]; then
                SIZE=$(du -h "$LATEST_MODEL/adapter_model.safetensors" | cut -f1)
                echo "💾 Taille adaptateur: $SIZE"
            fi
            
            # Métadonnées si disponibles
            if [ -f "$LATEST_MODEL/training_metadata.json" ]; then
                echo ""
                echo "📊 Métadonnées d'entraînement:"
                cat "$LATEST_MODEL/training_metadata.json" | grep -E "(train_loss|eval_loss|total_steps)" | head -5
            fi
        fi
    else
        echo "⏳ En attente du démarrage de l'entraînement..."
    fi
    
    echo ""
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "Rafraîchissement toutes les 10 secondes... (Ctrl+C pour quitter)"
    
    sleep 10
done
