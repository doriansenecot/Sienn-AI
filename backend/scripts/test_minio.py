#!/usr/bin/env python3
"""
Script de test pour le service de stockage MinIO.
"""
import sys
from pathlib import Path

# Ajouter le répertoire parent au path
sys.path.insert(0, str(Path(__file__).parent.parent))

from app.services.storage_service import storage_service


def test_minio_connectivity():
    """Test de base de la connectivité MinIO."""
    print("🧪 Test de connectivité MinIO...")
    
    # Test 1: Upload d'un fichier de test
    print("\n1. Test d'upload...")
    test_data = b"Hello from Sienn-AI! This is a test file."
    success = storage_service.upload_file(
        bucket_name=storage_service.models_bucket,
        object_name="test/hello.txt",
        data=test_data,
        content_type="text/plain"
    )
    
    if success:
        print("   ✅ Upload réussi")
    else:
        print("   ❌ Échec de l'upload")
        return False
    
    # Test 2: Vérification de l'existence
    print("\n2. Test de vérification d'existence...")
    exists = storage_service.object_exists(
        bucket_name=storage_service.models_bucket,
        object_name="test/hello.txt"
    )
    
    if exists:
        print("   ✅ Objet trouvé")
    else:
        print("   ❌ Objet non trouvé")
        return False
    
    # Test 3: Download
    print("\n3. Test de download...")
    downloaded_data = storage_service.download_file(
        bucket_name=storage_service.models_bucket,
        object_name="test/hello.txt"
    )
    
    if downloaded_data == test_data:
        print("   ✅ Download réussi et données identiques")
    else:
        print("   ❌ Download échoué ou données différentes")
        return False
    
    # Test 4: Liste des objets
    print("\n4. Test de listage...")
    objects = storage_service.list_objects(
        bucket_name=storage_service.models_bucket,
        prefix="test/"
    )
    
    if "test/hello.txt" in objects:
        print(f"   ✅ Listage réussi ({len(objects)} objets trouvés)")
    else:
        print("   ❌ Échec du listage")
        return False
    
    # Test 5: Génération d'URL pré-signée
    print("\n5. Test de génération d'URL pré-signée...")
    url = storage_service.get_object_url(
        bucket_name=storage_service.models_bucket,
        object_name="test/hello.txt",
        expires_hours=1
    )
    
    if url:
        print(f"   ✅ URL générée: {url[:50]}...")
    else:
        print("   ❌ Échec de génération d'URL")
        return False
    
    # Test 6: Suppression
    print("\n6. Test de suppression...")
    deleted = storage_service.delete_file(
        bucket_name=storage_service.models_bucket,
        object_name="test/hello.txt"
    )
    
    if deleted:
        print("   ✅ Suppression réussie")
    else:
        print("   ❌ Échec de suppression")
        return False
    
    # Vérification finale
    still_exists = storage_service.object_exists(
        bucket_name=storage_service.models_bucket,
        object_name="test/hello.txt"
    )
    
    if not still_exists:
        print("   ✅ Objet bien supprimé")
    else:
        print("   ❌ Objet toujours présent après suppression")
        return False
    
    print("\n" + "="*50)
    print("✅ Tous les tests MinIO ont réussi!")
    print("="*50)
    return True


if __name__ == "__main__":
    try:
        success = test_minio_connectivity()
        sys.exit(0 if success else 1)
    except Exception as e:
        print(f"\n❌ Erreur lors des tests: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
