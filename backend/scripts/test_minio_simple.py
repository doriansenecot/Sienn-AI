#!/usr/bin/env python3
"""
Script de test simple pour MinIO (pour exécuter dans le container).
"""
import sys

try:
    from minio import Minio
    from minio.error import S3Error
    
    # Configuration MinIO
    endpoint = "minio:9000"
    access_key = "minioadmin"
    secret_key = "minioadmin"
    
    print("🧪 Test de connectivité MinIO...")
    print(f"   Endpoint: {endpoint}")
    
    # Créer le client
    client = Minio(
        endpoint,
        access_key=access_key,
        secret_key=secret_key,
        secure=False,
    )
    
    # Test 1: Créer un bucket
    print("\n1. Création d'un bucket de test...")
    bucket_name = "test-bucket"
    if not client.bucket_exists(bucket_name):
        client.make_bucket(bucket_name)
        print(f"   ✅ Bucket '{bucket_name}' créé")
    else:
        print(f"   ✅ Bucket '{bucket_name}' existe déjà")
    
    # Test 2: Upload
    print("\n2. Upload d'un fichier de test...")
    test_data = b"Hello from Sienn-AI!"
    import io
    client.put_object(
        bucket_name,
        "test.txt",
        io.BytesIO(test_data),
        len(test_data),
    )
    print("   ✅ Fichier uploadé")
    
    # Test 3: Download
    print("\n3. Téléchargement du fichier...")
    response = client.get_object(bucket_name, "test.txt")
    downloaded = response.read()
    response.close()
    response.release_conn()
    
    if downloaded == test_data:
        print("   ✅ Données téléchargées et vérifiées")
    else:
        print("   ❌ Données différentes")
        sys.exit(1)
    
    # Test 4: Suppression
    print("\n4. Suppression du fichier de test...")
    client.remove_object(bucket_name, "test.txt")
    print("   ✅ Fichier supprimé")
    
    print("\n" + "="*50)
    print("✅ Tous les tests MinIO ont réussi!")
    print("="*50)
    
except Exception as e:
    print(f"\n❌ Erreur lors des tests: {e}")
    import traceback
    traceback.print_exc()
    sys.exit(1)
