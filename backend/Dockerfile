# Backend API Dockerfile - FastAPI application
FROM python:3.11-slim

# Définir le répertoire de travail
WORKDIR /app

# Installer les dépendances système nécessaires
RUN apt-get update && apt-get install -y \
    gcc \
    g++ \
    git \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Copier les fichiers de dépendances
# Use a small core requirements file for the API runtime during development
# Heavy ML packages remain in `requirements.txt` but are intentionally not
# installed by default to avoid long native builds during dev iteration.
COPY requirements-core.txt requirements-core.txt

# Installer les dépendances Python légères pour l'API
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements-core.txt

# Copier le code de l'application
COPY . .

# Créer le répertoire data s'il n'existe pas
RUN mkdir -p /app/data

# Exposer le port de l'API
EXPOSE 8000

# Healthcheck
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD curl -f http://localhost:8000/health || exit 1

# Commande par défaut (peut être override dans docker-compose)
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
