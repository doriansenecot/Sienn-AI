#!/usr/bin/env python3
"""
🧪 Script de Test Complet - Modèle Fine-tuné
Teste ton modèle étape par étape avec des explications claires
"""
import requests
import json
import sys
import time
from pathlib import Path

API_URL = "http://localhost:8000"

def print_header(text):
    """Affiche un en-tête stylisé"""
    print(f"\n{'='*80}")
    print(f"  {text}")
    print(f"{'='*80}\n")

def print_step(step_num, text):
    """Affiche une étape"""
    print(f"\n{'─'*80}")
    print(f"📍 Étape {step_num}: {text}")
    print(f"{'─'*80}")

def check_api_status():
    """Vérifie que l'API est accessible"""
    print_step(1, "Vérification de l'API")
    
    try:
        response = requests.get(f"{API_URL}/health", timeout=5)
        if response.status_code == 200:
            print("✅ API accessible et opérationnelle")
            return True
        else:
            print(f"❌ API répond avec le code {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Impossible de joindre l'API: {e}")
        print("\n💡 Assure-toi que Docker Compose est lancé:")
        print("   cd Sienn-AI && docker compose up -d")
        return False

def upload_test_dataset():
    """Upload le dataset de test"""
    print_step(2, "Upload du dataset de test")
    
    test_file = Path("test_data/test_chat.csv")
    
    if not test_file.exists():
        print(f"❌ Fichier de test introuvable: {test_file}")
        return None
    
    print(f"📂 Upload de {test_file}...")
    
    try:
        with open(test_file, 'rb') as f:
            files = {'file': ('test_chat.csv', f, 'text/csv')}
            response = requests.post(
                f"{API_URL}/api/upload-dataset",
                files=files,
                timeout=30
            )
        
        if response.status_code == 200:
            data = response.json()
            dataset_id = data.get('dataset_id')
            print(f"✅ Dataset uploadé avec succès!")
            print(f"   🆔 Dataset ID: {dataset_id}")
            return dataset_id
        else:
            print(f"❌ Erreur upload: {response.status_code}")
            print(response.text)
            return None
    except Exception as e:
        print(f"❌ Erreur: {e}")
        return None

def start_training(dataset_id):
    """Démarre le training"""
    print_step(3, "Démarrage du training")
    
    payload = {
        "dataset_id": dataset_id,
        "model_name": "gpt2",
        "learning_rate": 0.0002,
        "num_epochs": 3,
        "batch_size": 2,
        "max_length": 128
    }
    
    print("⚙️  Configuration:")
    for key, value in payload.items():
        if key != 'dataset_id':
            print(f"   • {key}: {value}")
    
    try:
        response = requests.post(
            f"{API_URL}/api/start-finetuning",
            json=payload,
            timeout=30
        )
        
        if response.status_code == 200:
            data = response.json()
            job_id = data.get('job_id')
            print(f"\n✅ Training démarré!")
            print(f"   🆔 Job ID: {job_id}")
            return job_id
        else:
            print(f"❌ Erreur démarrage: {response.status_code}")
            print(response.text)
            return None
    except Exception as e:
        print(f"❌ Erreur: {e}")
        return None

def monitor_training(job_id):
    """Surveille le training"""
    print_step(4, "Surveillance du training")
    print("⏳ Attente de la fin du training...")
    print("   (Cela peut prendre plusieurs minutes)\n")
    
    last_progress = -1
    dots = 0
    
    while True:
        try:
            response = requests.get(
                f"{API_URL}/api/training-status/{job_id}",
                timeout=10
            )
            
            if response.status_code == 200:
                data = response.json()
                status = data.get('status')
                progress = data.get('progress', 0)
                message = data.get('message', '')
                
                # Afficher progression si changement
                if progress != last_progress:
                    print(f"\r🔄 Status: {status.upper():<12} | Progress: {progress:>3}% | {message}", end='', flush=True)
                    last_progress = progress
                    dots = 0
                else:
                    # Animation de points
                    dots = (dots + 1) % 4
                    print(f"\r🔄 Status: {status.upper():<12} | Progress: {progress:>3}% {'.' * dots}   ", end='', flush=True)
                
                # Check statut final
                if status == "completed":
                    print("\n\n✅ Training terminé avec succès!")
                    
                    # Afficher les métriques si disponibles
                    meta = data.get('meta', {})
                    if meta:
                        print("\n📊 Métriques:")
                        if 'final_loss' in meta:
                            print(f"   • Loss finale: {meta['final_loss']:.4f}")
                        if 'training_time' in meta:
                            print(f"   • Temps d'entraînement: {meta['training_time']}")
                        if 'model_path' in meta:
                            print(f"   • Modèle sauvegardé: {meta['model_path']}")
                    
                    return True
                    
                elif status == "failed":
                    print(f"\n\n❌ Training échoué!")
                    print(f"   Erreur: {message}")
                    return False
                
            else:
                print(f"\n❌ Erreur status: {response.status_code}")
                return False
                
        except Exception as e:
            print(f"\n❌ Erreur monitoring: {e}")
            return False
        
        time.sleep(3)  # Check toutes les 3 secondes

def test_inference(job_id):
    """Teste l'inférence du modèle"""
    print_step(5, "Test d'inférence")
    
    test_prompts = [
        "Qu'est-ce que l'intelligence artificielle?",
        "Comment fonctionne le machine learning?",
        "Explique-moi les réseaux de neurones",
    ]
    
    print(f"🎯 Test avec {len(test_prompts)} prompts:\n")
    
    for i, prompt in enumerate(test_prompts, 1):
        print(f"\n{'─'*80}")
        print(f"Test #{i}")
        print(f"{'─'*80}")
        print(f"📝 Prompt: {prompt}\n")
        
        payload = {
            "job_id": job_id,
            "prompt": prompt,
            "max_new_tokens": 100,
            "temperature": 0.7
        }
        
        try:
            print("⏳ Génération en cours...")
            response = requests.post(
                f"{API_URL}/api/test-model",
                json=payload,
                timeout=60
            )
            
            if response.status_code == 200:
                data = response.json()
                generated_text = data.get('generated_text', '')
                generation_time = data.get('generation_time', 0)
                
                print(f"\n✅ Réponse générée en {generation_time:.2f}s:")
                print(f"┌{'─'*78}┐")
                
                # Afficher le texte ligne par ligne
                for line in generated_text.split('\n'):
                    if line.strip():
                        # Couper les lignes trop longues
                        while len(line) > 76:
                            print(f"│ {line[:76]} │")
                            line = line[76:]
                        print(f"│ {line:<76} │")
                
                print(f"└{'─'*78}┘")
            else:
                print(f"❌ Erreur inférence: {response.status_code}")
                print(response.text)
        
        except Exception as e:
            print(f"❌ Erreur: {e}")
        
        # Pause entre les tests
        if i < len(test_prompts):
            time.sleep(1)
    
    return True

def main():
    """Fonction principale"""
    print_header("🚀 TEST COMPLET DU MODÈLE FINE-TUNÉ")
    
    print("""
Ce script va:
1. Vérifier que l'API est accessible
2. Uploader un dataset de test
3. Démarrer le training
4. Surveiller la progression
5. Tester l'inférence avec le modèle entraîné

Prêt? Appuie sur Entrée pour commencer...
    """)
    
    input()
    
    # Étape 1: Check API
    if not check_api_status():
        sys.exit(1)
    
    # Étape 2: Upload dataset
    dataset_id = upload_test_dataset()
    if not dataset_id:
        print("\n❌ Impossible de continuer sans dataset")
        sys.exit(1)
    
    # Étape 3: Start training
    job_id = start_training(dataset_id)
    if not job_id:
        print("\n❌ Impossible de démarrer le training")
        sys.exit(1)
    
    # Étape 4: Monitor training
    if not monitor_training(job_id):
        print("\n❌ Le training a échoué")
        sys.exit(1)
    
    # Étape 5: Test inference
    print("\n" + "="*80)
    print("Appuie sur Entrée pour tester l'inférence...")
    input()
    
    test_inference(job_id)
    
    # Fin
    print_header("🎉 TEST TERMINÉ AVEC SUCCÈS!")
    
    print(f"""
✅ Ton modèle a été fine-tuné et testé avec succès!

📋 Résumé:
   • Job ID: {job_id}
   • Dataset ID: {dataset_id}
   • Status: ✅ Completed

🎯 Prochaines étapes:
   1. Teste avec tes propres prompts via http://localhost:8000/docs
   2. Export le modèle pour Ollama
   3. Déploie en production

💡 Pour tester manuellement:
   curl -X POST http://localhost:8000/api/test-model \\
     -H "Content-Type: application/json" \\
     -d '{{"job_id": "{job_id}", "prompt": "Ton prompt ici"}}'
    """)

if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("\n\n⚠️  Test interrompu par l'utilisateur")
        sys.exit(1)
    except Exception as e:
        print(f"\n\n❌ Erreur inattendue: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
