#!/usr/bin/env python3
"""
Cache optimization script for HuggingFace models.
Helps manage disk space by cleaning unused cached models.
"""

import shutil
from pathlib import Path


def get_cache_dir() -> Path:
    """Get HuggingFace cache directory."""
    cache_dir = Path.home() / ".cache" / "huggingface"
    return cache_dir


def get_cache_size(path: Path) -> int:
    """Calculate total size of directory."""
    total_size = 0
    for file in path.rglob("*"):
        if file.is_file():
            total_size += file.stat().st_size
    return total_size


def format_size(size_bytes: int) -> str:
    """Format bytes to human-readable string."""
    for unit in ["B", "KB", "MB", "GB", "TB"]:
        if size_bytes < 1024.0:
            return f"{size_bytes:.2f} {unit}"
        size_bytes /= 1024.0
    return f"{size_bytes:.2f} PB"


def list_cached_models():
    """List all cached models with sizes."""
    cache_dir = get_cache_dir()
    
    if not cache_dir.exists():
        print("No cache directory found.")
        return
    
    print(f"Cache directory: {cache_dir}")
    print("=" * 80)
    
    # List models
    models_dir = cache_dir / "hub"
    if not models_dir.exists():
        print("No models cached.")
        return
    
    models = []
    for model_dir in models_dir.iterdir():
        if model_dir.is_dir() and model_dir.name.startswith("models--"):
            model_name = model_dir.name.replace("models--", "").replace("--", "/")
            size = get_cache_size(model_dir)
            models.append((model_name, size, model_dir))
    
    # Sort by size (largest first)
    models.sort(key=lambda x: x[1], reverse=True)
    
    total_size = sum(m[1] for m in models)
    
    print(f"\nCached Models ({len(models)} total, {format_size(total_size)}):")
    print("-" * 80)
    
    for model_name, size, _ in models:
        print(f"  {model_name:<50} {format_size(size):>15}")
    
    print("=" * 80)
    print(f"Total cache size: {format_size(total_size)}")
    
    return models


def clean_cache(dry_run: bool = True):
    """
    Clean HuggingFace cache.
    
    Args:
        dry_run: If True, only show what would be deleted without actually deleting
    """
    models = list_cached_models()
    
    if not models:
        return
    
    print("\n" + "=" * 80)
    print("Cache Cleaning Options")
    print("=" * 80)
    print("\n1. Clean all cached models")
    print("2. Clean specific models")
    print("3. Keep only N largest models")
    print("4. Cancel")
    
    choice = input("\nEnter choice (1-4): ").strip()
    
    if choice == "1":
        if dry_run:
            print("\n[DRY RUN] Would delete all cached models")
            total = sum(m[1] for m in models)
            print(f"[DRY RUN] Would free: {format_size(total)}")
        else:
            confirm = input(f"\nDelete ALL {len(models)} cached models? (yes/no): ")
            if confirm.lower() == "yes":
                for _, _, model_dir in models:
                    print(f"Deleting {model_dir.name}...")
                    shutil.rmtree(model_dir)
                print(f"✅ Deleted {len(models)} models")
    
    elif choice == "2":
        print("\nEnter model numbers to delete (comma-separated):")
        for i, (name, size, _) in enumerate(models, 1):
            print(f"  {i}. {name} ({format_size(size)})")
        
        selections = input("\nModels to delete: ").strip()
        indices = [int(x.strip()) - 1 for x in selections.split(",")]
        
        to_delete = [models[i] for i in indices if 0 <= i < len(models)]
        
        if dry_run:
            print("\n[DRY RUN] Would delete:")
            for name, size, _ in to_delete:
                print(f"  {name} ({format_size(size)})")
            total = sum(m[1] for m in to_delete)
            print(f"[DRY RUN] Would free: {format_size(total)}")
        else:
            confirm = input(f"\nDelete {len(to_delete)} models? (yes/no): ")
            if confirm.lower() == "yes":
                for name, _, model_dir in to_delete:
                    print(f"Deleting {name}...")
                    shutil.rmtree(model_dir)
                print(f"✅ Deleted {len(to_delete)} models")
    
    elif choice == "3":
        keep_n = int(input("\nHow many largest models to keep? "))
        to_delete = models[keep_n:]
        
        if dry_run:
            print(f"\n[DRY RUN] Would keep {keep_n} largest models")
            print("[DRY RUN] Would delete:")
            for name, size, _ in to_delete:
                print(f"  {name} ({format_size(size)})")
            total = sum(m[1] for m in to_delete)
            print(f"[DRY RUN] Would free: {format_size(total)}")
        else:
            confirm = input(f"\nDelete {len(to_delete)} models? (yes/no): ")
            if confirm.lower() == "yes":
                for name, _, model_dir in to_delete:
                    print(f"Deleting {name}...")
                    shutil.rmtree(model_dir)
                print(f"✅ Deleted {len(to_delete)} models")


if __name__ == "__main__":
    import sys
    
    print("🧹 HuggingFace Cache Optimizer")
    print("=" * 80)
    
    dry_run = "--dry-run" in sys.argv or "-n" in sys.argv
    
    if dry_run:
        print("⚠️  DRY RUN MODE - No files will be deleted")
        print("=" * 80)
    
    try:
        clean_cache(dry_run=dry_run)
    except KeyboardInterrupt:
        print("\n\nCancelled by user")
    except Exception as e:
        print(f"\n❌ Error: {e}")
        sys.exit(1)
