# Frontend Dockerfile - React application
FROM node:18-alpine

# Définir le répertoire de travail
WORKDIR /app

# Copier les fichiers package.json et package-lock.json
COPY package*.json ./

# Installer les dépendances
RUN npm install

# Copier le reste du code
COPY . .

# Exposer le port de développement
EXPOSE 3000

# Commande par défaut pour le mode développement
CMD ["npm", "start"]

# Pour la production, utiliser:
# RUN npm run build
# CMD ["npm", "run", "serve"]
