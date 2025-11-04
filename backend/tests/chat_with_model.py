"""
Script simple pour tester le modèle entraîné sans re-training
"""
import sys
from pathlib import Path

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from tests.train_full_and_chat import interactive_chat

def main():
    """Find latest model and chat with it"""
    
    model_dir = Path("./model_full_training")
    
    # Find latest model
    models = sorted(model_dir.glob("model_full_*"), key=lambda x: x.stat().st_mtime, reverse=True)
    
    if not models:
        print("❌ Aucun modèle trouvé dans model_full_training/")
        print("Lancez d'abord: python tests/train_full_and_chat.py --samples 5000 --epochs 3")
        return 1
    
    model_path = str(models[0])
    
    print(f"""
╔══════════════════════════════════════════════════════════════════════╗
║              TEST DU MODÈLE ENTRAÎNÉ - SIENN-AI                      ║
╚══════════════════════════════════════════════════════════════════════╝

Utilisation du modèle: {models[0].name}

""")
    
    interactive_chat(model_path, "gpt2")
    
    return 0


if __name__ == "__main__":
    exit(main())
