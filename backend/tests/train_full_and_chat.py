"""
Full dataset training with interactive chat testing
Train GPT-2 on complete code_alpaca_20k dataset and test interactively
"""
import json
import logging
import sys
import time
from datetime import datetime
from pathlib import Path
import torch
from transformers import AutoModelForCausalLM, AutoTokenizer
from peft import PeftModel

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from app.services.finetuning_service import FinetuningService

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


def train_on_full_dataset(
    dataset_path: str,
    output_dir: Path,
    model_name: str = "gpt2",
    num_samples: int = None,  # None = use all
    num_epochs: int = 3
):
    """Train on full or partial dataset"""
    
    print(f"""
╔══════════════════════════════════════════════════════════════════════╗
║           ENTRAÎNEMENT SUR DATASET COMPLET - SIENN-AI                ║
╚══════════════════════════════════════════════════════════════════════╝

Configuration:
  • Dataset: {Path(dataset_path).name}
  • Modèle: {model_name}
  • Échantillons: {"Tous" if num_samples is None else num_samples}
  • Époques: {num_epochs}
  • Méthode: LoRA (Low-Rank Adaptation)
  
⏰ Début de l'entraînement: {datetime.now().strftime('%H:%M:%S')}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
""")
    
    # Prepare dataset if num_samples is specified
    train_file = dataset_path
    if num_samples is not None and num_samples < 20000:
        import pandas as pd
        logger.info(f"Extracting {num_samples} samples from dataset...")
        df = pd.read_csv(dataset_path)
        df = df.dropna(subset=['output'])
        df_sample = df.sample(n=min(num_samples, len(df)), random_state=42)
        train_file = str(output_dir / f"train_{num_samples}.csv")
        df_sample.to_csv(train_file, index=False)
        logger.info(f"Training file created: {train_file}")
    
    model_output = output_dir / f"model_full_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
    
    service = FinetuningService()
    
    start_time = time.time()
    last_update = [start_time]
    
    def progress_callback(progress: float, message: str):
        current_time = time.time()
        elapsed = current_time - start_time
        
        # Update every 5 seconds or on important events
        if current_time - last_update[0] >= 5 or progress >= 90:
            elapsed_min = elapsed / 60
            logger.info(f"[{elapsed_min:.1f}min] {progress:.0f}% - {message}")
            last_update[0] = current_time
    
    try:
        logger.info("🚀 Démarrage du fine-tuning...")
        print("\n⏳ Entraînement en cours... (cela peut prendre du temps)\n")
        
        metadata = service.finetune(
            model_name=model_name,
            dataset_path=train_file,
            output_dir=str(model_output),
            learning_rate=2e-5,  # Optimal learning rate
            num_epochs=num_epochs,
            batch_size=4,
            max_length=512,  # Full context
            progress_callback=progress_callback
        )
        
        training_time = time.time() - start_time
        
        print(f"""
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

✅ ENTRAÎNEMENT TERMINÉ !

  ⏱️  Durée: {training_time/60:.1f} minutes
  📉 Loss finale (train): {metadata.get('final_train_loss', 'N/A')}
  📉 Loss finale (validation): {metadata.get('final_eval_loss', 'N/A')}
  📊 Steps totaux: {metadata.get('total_steps', 'N/A')}
  💾 Modèle sauvegardé: {model_output.name}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
""")
        
        return str(model_output), metadata, training_time
        
    except Exception as e:
        logger.error(f"❌ Entraînement échoué: {str(e)}", exc_info=True)
        raise


def interactive_chat(model_path: str, base_model_name: str = "gpt2"):
    """Interactive chat with the fine-tuned model"""
    
    print(f"""
╔══════════════════════════════════════════════════════════════════════╗
║              MODE CHAT INTERACTIF - SIENN-AI                         ║
╚══════════════════════════════════════════════════════════════════════╝

Chargement du modèle fine-tuné...
""")
    
    try:
        # Load model
        tokenizer = AutoTokenizer.from_pretrained(model_path)
        
        device = "cuda" if torch.cuda.is_available() else "cpu"
        logger.info(f"Chargement sur: {device}")
        
        base_model = AutoModelForCausalLM.from_pretrained(
            base_model_name,
            torch_dtype=torch.float16 if device == "cuda" else torch.float32,
            device_map="auto" if device == "cuda" else None,
        )
        
        model = PeftModel.from_pretrained(base_model, model_path)
        model.eval()
        
        print(f"""
✅ Modèle chargé avec succès !

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

💬 INSTRUCTIONS:
  • Posez vos questions de programmation en français ou anglais
  • Tapez 'quit' ou 'exit' pour quitter
  • Tapez 'clear' pour effacer l'écran
  • Tapez 'help' pour des exemples de questions

🤖 Le modèle est prêt à générer du code Python !

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
""")
        
        conversation_count = 0
        
        while True:
            try:
                # Get user input
                print(f"\n{'='*70}")
                user_input = input("\n💭 Vous: ").strip()
                
                if not user_input:
                    continue
                
                # Handle commands
                if user_input.lower() in ['quit', 'exit', 'q']:
                    print("\n👋 Au revoir !\n")
                    break
                
                if user_input.lower() == 'clear':
                    import os
                    os.system('clear' if os.name != 'nt' else 'cls')
                    continue
                
                if user_input.lower() == 'help':
                    print("""
📚 EXEMPLES DE QUESTIONS:

  • "Write a function to calculate the factorial of a number"
  • "Create a Python class to represent a person"
  • "How do I sort a list in Python?"
  • "Write a function to check if a string is a palindrome"
  • "Create a REST API endpoint with Flask"
  • "How to read a CSV file in Python?"
  • "Write a decorator to measure function execution time"
  
Posez n'importe quelle question sur la programmation Python !
""")
                    continue
                
                # Format prompt (instruction-based like training)
                prompt = f"Below is an instruction. Write a response that completes the request.\n\n### Instruction:\n{user_input}\n\n### Response:\n"
                
                # Generate response
                print("\n🤖 Assistant: ", end="", flush=True)
                start_time = time.time()
                
                inputs = tokenizer(prompt, return_tensors="pt", truncation=True, max_length=512)
                
                if device == "cuda":
                    inputs = {k: v.to(device) for k, v in inputs.items()}
                
                with torch.no_grad():
                    outputs = model.generate(
                        **inputs,
                        max_new_tokens=200,
                        temperature=0.7,
                        top_p=0.95,
                        do_sample=True,
                        repetition_penalty=1.2,
                        pad_token_id=tokenizer.eos_token_id,
                        num_beams=1,
                    )
                
                gen_time = time.time() - start_time
                
                # Decode output
                full_output = tokenizer.decode(outputs[0], skip_special_tokens=True)
                generated = full_output[len(prompt):].strip()
                
                # Print response
                print(generated)
                print(f"\n⏱️  Généré en {gen_time:.2f}s")
                
                conversation_count += 1
                
            except KeyboardInterrupt:
                print("\n\n👋 Interruption détectée. Au revoir !\n")
                break
            except Exception as e:
                print(f"\n❌ Erreur: {str(e)}")
                logger.error(f"Chat error: {str(e)}", exc_info=True)
        
        print(f"\n📊 Session terminée: {conversation_count} questions posées\n")
        
    except Exception as e:
        logger.error(f"Failed to load model: {str(e)}", exc_info=True)
        raise


def main():
    """Main execution"""
    import argparse
    
    parser = argparse.ArgumentParser(description="Train GPT-2 and chat with it")
    parser.add_argument(
        "--samples",
        type=int,
        default=None,
        help="Number of samples to use (default: all ~20k)"
    )
    parser.add_argument(
        "--epochs",
        type=int,
        default=3,
        help="Number of training epochs (default: 3)"
    )
    parser.add_argument(
        "--skip-training",
        action="store_true",
        help="Skip training and use existing model"
    )
    parser.add_argument(
        "--model-path",
        type=str,
        help="Path to existing model (required if --skip-training)"
    )
    parser.add_argument(
        "--dataset",
        type=str,
        default="/home/dorian/Documents/Epitech/HUB/Free-Project/Sienn-AI/test_data/conversations_quality.csv",
        help="Path to dataset (default: conversations_quality.csv)"
    )
    
    args = parser.parse_args()
    
    dataset_path = args.dataset
    output_dir = Path("./model_full_training")
    output_dir.mkdir(exist_ok=True)
    
    if not Path(dataset_path).exists():
        logger.error(f"❌ Dataset introuvable: {dataset_path}")
        return 1
    
    try:
        model_path = None
        
        # Training phase
        if not args.skip_training:
            print(f"""
╔══════════════════════════════════════════════════════════════════════╗
║                    SIENN-AI TRAINING COMPLET                         ║
╚══════════════════════════════════════════════════════════════════════╝

Dataset: {Path(dataset_path).name}
Échantillons: {args.samples if args.samples else "~5,000 (tous)"}
Époques: {args.epochs}

⚠️  Attention: L'entraînement peut prendre du temps !
   Estimations:
   • 1,000 samples: ~5-10 minutes
   • 5,000 samples: ~25-40 minutes  
   • Avec 5 époques: ~40-60 minutes

Appuyez sur Ctrl+C pour annuler maintenant...
""")
            
            # Countdown
            try:
                for i in range(5, 0, -1):
                    print(f"Démarrage dans {i}...", end="\r", flush=True)
                    time.sleep(1)
                print(" " * 50, end="\r")
            except KeyboardInterrupt:
                print("\n\n❌ Annulé par l'utilisateur.\n")
                return 0
            
            model_path, metadata, training_time = train_on_full_dataset(
                dataset_path=dataset_path,
                output_dir=output_dir,
                model_name="gpt2",
                num_samples=args.samples,
                num_epochs=args.epochs
            )
            
            # Save training report
            report = {
                "model_path": model_path,
                "training_time_minutes": training_time / 60,
                "metadata": metadata,
                "timestamp": datetime.now().isoformat()
            }
            
            report_file = output_dir / "training_report.json"
            with open(report_file, 'w') as f:
                json.dump(report, f, indent=2)
            
            print(f"📄 Rapport sauvegardé: {report_file}\n")
            
        else:
            if not args.model_path:
                logger.error("❌ --model-path requis avec --skip-training")
                return 1
            model_path = args.model_path
            if not Path(model_path).exists():
                logger.error(f"❌ Modèle introuvable: {model_path}")
                return 1
        
        # Chat phase
        print("\n" + "="*70)
        input("\n✅ Prêt pour le chat ! Appuyez sur Entrée pour commencer...")
        
        interactive_chat(model_path, "gpt2")
        
        return 0
        
    except KeyboardInterrupt:
        print("\n\n❌ Interruption par l'utilisateur.\n")
        return 1
    except Exception as e:
        logger.error(f"\n❌ Erreur: {str(e)}", exc_info=True)
        return 1


if __name__ == "__main__":
    exit(main())
