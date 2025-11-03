"""
Script de test pour vérifier le modèle fine-tuné
"""
import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'backend'))

from transformers import AutoTokenizer, AutoModelForCausalLM
from peft import PeftModel
import torch

def test_model_inference(model_path: str, prompts: list[str]):
    """
    Teste l'inférence avec le modèle fine-tuné
    
    Args:
        model_path: Chemin vers le modèle fine-tuné (dossier avec adapter)
        prompts: Liste de prompts à tester
    """
    print(f"\n{'='*80}")
    print(f"🧪 TEST D'INFÉRENCE - Modèle: {model_path}")
    print(f"{'='*80}\n")
    
    try:
        # Charger le tokenizer
        print("📦 Chargement du tokenizer...")
        tokenizer = AutoTokenizer.from_pretrained("gpt2")
        tokenizer.pad_token = tokenizer.eos_token
        
        # Charger le modèle de base
        print("🤖 Chargement du modèle de base GPT-2...")
        base_model = AutoModelForCausalLM.from_pretrained("gpt2")
        
        # Charger les adaptateurs LoRA
        print(f"🔧 Chargement des adaptateurs LoRA depuis {model_path}...")
        model = PeftModel.from_pretrained(base_model, model_path)
        model.eval()
        
        # Device
        device = "cuda" if torch.cuda.is_available() else "cpu"
        model = model.to(device)
        print(f"💻 Utilisation du device: {device}\n")
        
        # Tester chaque prompt
        for i, prompt in enumerate(prompts, 1):
            print(f"\n{'─'*80}")
            print(f"🎯 Test #{i}")
            print(f"{'─'*80}")
            print(f"📝 Prompt: {prompt}")
            print(f"\n🤔 Génération en cours...\n")
            
            # Tokenizer le prompt
            inputs = tokenizer(prompt, return_tensors="pt", padding=True)
            inputs = {k: v.to(device) for k, v in inputs.items()}
            
            # Générer la réponse
            with torch.no_grad():
                outputs = model.generate(
                    **inputs,
                    max_new_tokens=100,
                    num_return_sequences=1,
                    temperature=0.7,
                    top_p=0.9,
                    do_sample=True,
                    pad_token_id=tokenizer.eos_token_id
                )
            
            # Décoder la réponse
            generated_text = tokenizer.decode(outputs[0], skip_special_tokens=True)
            response = generated_text[len(prompt):].strip()
            
            print(f"✅ Réponse générée:")
            print(f"┌{'─'*78}┐")
            print(f"│ {response[:76]:<76} │")
            if len(response) > 76:
                for j in range(76, len(response), 76):
                    print(f"│ {response[j:j+76]:<76} │")
            print(f"└{'─'*78}┘")
        
        print(f"\n{'='*80}")
        print("✅ Test d'inférence terminé avec succès!")
        print(f"{'='*80}\n")
        
        return True
        
    except Exception as e:
        print(f"\n❌ ERREUR lors du test: {str(e)}")
        import traceback
        traceback.print_exc()
        return False


def compare_with_base_model(prompt: str, finetuned_model_path: str):
    """
    Compare les réponses du modèle de base et du modèle fine-tuné
    """
    print(f"\n{'='*80}")
    print(f"🔍 COMPARAISON: Modèle de base vs Modèle fine-tuné")
    print(f"{'='*80}\n")
    print(f"📝 Prompt: {prompt}\n")
    
    device = "cuda" if torch.cuda.is_available() else "cpu"
    tokenizer = AutoTokenizer.from_pretrained("gpt2")
    tokenizer.pad_token = tokenizer.eos_token
    
    # Test modèle de base
    print("🤖 Réponse du modèle de base GPT-2:")
    print("─" * 80)
    base_model = AutoModelForCausalLM.from_pretrained("gpt2").to(device)
    base_model.eval()
    
    inputs = tokenizer(prompt, return_tensors="pt", padding=True)
    inputs = {k: v.to(device) for k, v in inputs.items()}
    
    with torch.no_grad():
        outputs = base_model.generate(
            **inputs,
            max_new_tokens=100,
            num_return_sequences=1,
            temperature=0.7,
            top_p=0.9,
            do_sample=True,
            pad_token_id=tokenizer.eos_token_id
        )
    
    base_response = tokenizer.decode(outputs[0], skip_special_tokens=True)[len(prompt):].strip()
    print(base_response)
    print()
    
    # Test modèle fine-tuné
    print("🎯 Réponse du modèle fine-tuné:")
    print("─" * 80)
    finetuned_model = PeftModel.from_pretrained(base_model, finetuned_model_path)
    finetuned_model.eval()
    
    with torch.no_grad():
        outputs = finetuned_model.generate(
            **inputs,
            max_new_tokens=100,
            num_return_sequences=1,
            temperature=0.7,
            top_p=0.9,
            do_sample=True,
            pad_token_id=tokenizer.eos_token_id
        )
    
    finetuned_response = tokenizer.decode(outputs[0], skip_special_tokens=True)[len(prompt):].strip()
    print(finetuned_response)
    print()
    
    print(f"{'='*80}\n")


if __name__ == "__main__":
    # Exemples de prompts basés sur ton dataset test_chat.csv
    test_prompts = [
        "Qu'est-ce que l'intelligence artificielle?",
        "Comment fonctionne le machine learning?",
        "Explique-moi les réseaux de neurones",
        "Quelle est la différence entre IA et ML?",
        "Comment débuter en data science?",
    ]
    
    # Chemin vers ton modèle fine-tuné
    # Remplace par l'ID de ton modèle après le training
    model_path = "data/models/YOUR_MODEL_ID_HERE"
    
    if len(sys.argv) > 1:
        model_path = sys.argv[1]
    
    if not os.path.exists(model_path):
        print(f"❌ Erreur: Le modèle n'existe pas à {model_path}")
        print("\n💡 Utilisation:")
        print(f"   python {sys.argv[0]} <chemin_vers_modele>")
        print("\nExemple:")
        print(f"   python {sys.argv[0]} data/models/5bb4b302-612a-4463-885f-23e538ea9f2c")
        sys.exit(1)
    
    # Test d'inférence basique
    print("🚀 Démarrage des tests...\n")
    success = test_model_inference(model_path, test_prompts)
    
    # Comparaison avec le modèle de base
    if success:
        print("\n" + "="*80)
        input("Appuyez sur Entrée pour comparer avec le modèle de base...")
        compare_with_base_model(test_prompts[0], model_path)
    
    sys.exit(0 if success else 1)
