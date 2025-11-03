"""
Script pour tester l'API d'inférence du modèle fine-tuné
"""
import requests
import json
import time
import sys

API_BASE_URL = "http://localhost:8000"

def print_section(title: str):
    """Affiche un titre de section"""
    print(f"\n{'='*80}")
    print(f"  {title}")
    print(f"{'='*80}\n")

def test_model_via_api(model_id: str, prompts: list[str]):
    """
    Teste le modèle via l'API d'inférence
    
    Args:
        model_id: ID du modèle fine-tuné
        prompts: Liste de prompts à tester
    """
    print_section(f"🧪 TEST D'INFÉRENCE VIA API - Modèle: {model_id}")
    
    # Vérifier que l'API est accessible
    try:
        response = requests.get(f"{API_BASE_URL}/health")
        if response.status_code != 200:
            print("❌ L'API n'est pas accessible!")
            return False
        print("✅ API accessible\n")
    except Exception as e:
        print(f"❌ Erreur de connexion à l'API: {e}")
        return False
    
    # Tester chaque prompt
    for i, prompt in enumerate(prompts, 1):
        print(f"\n{'─'*80}")
        print(f"🎯 Test #{i}")
        print(f"{'─'*80}")
        print(f"📝 Prompt: {prompt}")
        print(f"\n🤔 Envoi de la requête...\n")
        
        try:
            # Envoyer la requête d'inférence
            payload = {
                "model_id": model_id,
                "prompt": prompt,
                "max_length": 100,
                "temperature": 0.7,
                "top_p": 0.9
            }
            
            response = requests.post(
                f"{API_BASE_URL}/api/inference",
                json=payload,
                headers={"Content-Type": "application/json"}
            )
            
            if response.status_code == 200:
                result = response.json()
                generated_text = result.get("generated_text", "")
                
                print(f"✅ Réponse générée:")
                print(f"┌{'─'*78}┐")
                for line in generated_text.split('\n'):
                    if line.strip():
                        print(f"│ {line[:76]:<76} │")
                print(f"└{'─'*78}┘")
                
                # Afficher les métadonnées
                if "metadata" in result:
                    meta = result["metadata"]
                    print(f"\n📊 Métadonnées:")
                    print(f"   ⏱️  Temps de génération: {meta.get('generation_time', 'N/A')}")
                    print(f"   🔢 Tokens générés: {meta.get('tokens_generated', 'N/A')}")
                
            else:
                print(f"❌ Erreur API (code {response.status_code}):")
                print(json.dumps(response.json(), indent=2))
                
        except Exception as e:
            print(f"❌ Erreur lors de la requête: {str(e)}")
            import traceback
            traceback.print_exc()
    
    print_section("✅ Tests d'inférence terminés")
    return True


def check_model_status(model_id: str):
    """Vérifie le statut du modèle"""
    print_section(f"🔍 VÉRIFICATION DU MODÈLE: {model_id}")
    
    try:
        # Vérifier si le modèle existe
        response = requests.get(f"{API_BASE_URL}/api/models/{model_id}")
        
        if response.status_code == 200:
            model_info = response.json()
            print("✅ Modèle trouvé!")
            print(f"\n📋 Informations du modèle:")
            print(f"   🆔 ID: {model_info.get('id', 'N/A')}")
            print(f"   📛 Nom: {model_info.get('name', 'N/A')}")
            print(f"   📊 Statut: {model_info.get('status', 'N/A')}")
            print(f"   📅 Créé le: {model_info.get('created_at', 'N/A')}")
            print(f"   🎯 Base: {model_info.get('base_model', 'N/A')}")
            
            if model_info.get('status') != 'completed':
                print(f"\n⚠️  Attention: Le modèle n'est pas dans l'état 'completed'")
                print(f"   Status actuel: {model_info.get('status', 'N/A')}")
                return False
            
            return True
        elif response.status_code == 404:
            print(f"❌ Modèle non trouvé avec l'ID: {model_id}")
            return False
        else:
            print(f"❌ Erreur lors de la récupération du modèle (code {response.status_code})")
            return False
            
    except Exception as e:
        print(f"❌ Erreur: {str(e)}")
        return False


def list_available_models():
    """Liste tous les modèles disponibles"""
    print_section("📚 LISTE DES MODÈLES DISPONIBLES")
    
    try:
        response = requests.get(f"{API_BASE_URL}/api/models")
        
        if response.status_code == 200:
            models = response.json()
            
            if not models:
                print("ℹ️  Aucun modèle disponible")
                return []
            
            print(f"Trouvé {len(models)} modèle(s):\n")
            
            for i, model in enumerate(models, 1):
                status_emoji = {
                    'completed': '✅',
                    'training': '🔄',
                    'failed': '❌',
                    'pending': '⏳'
                }.get(model.get('status', ''), '❓')
                
                print(f"{i}. {status_emoji} {model.get('name', 'Sans nom')}")
                print(f"   🆔 ID: {model.get('id', 'N/A')}")
                print(f"   📊 Statut: {model.get('status', 'N/A')}")
                print(f"   📅 {model.get('created_at', 'N/A')}")
                print()
            
            return models
        else:
            print(f"❌ Erreur lors de la récupération des modèles (code {response.status_code})")
            return []
            
    except Exception as e:
        print(f"❌ Erreur: {str(e)}")
        return []


if __name__ == "__main__":
    # Prompts de test
    test_prompts = [
        "Qu'est-ce que l'intelligence artificielle?",
        "Comment fonctionne le machine learning?",
        "Explique-moi les réseaux de neurones",
    ]
    
    # Vérifier les arguments
    if len(sys.argv) < 2:
        print("⚠️  Aucun ID de modèle fourni")
        print("\n💡 Utilisation:")
        print(f"   python {sys.argv[0]} <model_id>")
        print("\nExemple:")
        print(f"   python {sys.argv[0]} 5bb4b302-612a-4463-885f-23e538ea9f2c")
        print()
        
        # Lister les modèles disponibles
        models = list_available_models()
        
        if models:
            completed_models = [m for m in models if m.get('status') == 'completed']
            if completed_models:
                print("\n💡 Vous pouvez utiliser l'un de ces modèles complétés:")
                for model in completed_models:
                    print(f"   python {sys.argv[0]} {model.get('id')}")
        
        sys.exit(1)
    
    model_id = sys.argv[1]
    
    # Vérifier le statut du modèle
    if not check_model_status(model_id):
        print("\n❌ Impossible de continuer: modèle non disponible ou incomplet")
        sys.exit(1)
    
    # Tester l'inférence
    success = test_model_via_api(model_id, test_prompts)
    
    sys.exit(0 if success else 1)
