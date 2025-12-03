# Guide d'installation - Ubuntu 24.04

Ce guide vous permettra de mettre en place le projet Selos sur Ubuntu 24.04 en utilisant Docker.

## Prérequis

- Ubuntu 24.04 LTS
- Accès root ou utilisateur avec sudo
- Connexion Internet

## Étape 1 : Mise à jour du système

```bash
# Mettre à jour la liste des paquets
sudo apt update

# Mettre à jour le système
sudo apt upgrade -y
```

## Étape 2 : Installation de Docker

```bash
# Installer les dépendances nécessaires
sudo apt install -y ca-certificates curl gnupg lsb-release

# Ajouter la clé GPG officielle de Docker
sudo install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
sudo chmod a+r /etc/apt/keyrings/docker.gpg

# Configurer le dépôt Docker
echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
  $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

# Installer Docker Engine
sudo apt update
sudo apt install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

# Vérifier l'installation
docker --version
docker compose version
```

## Étape 3 : Configuration de Docker (optionnel mais recommandé)

```bash
# Ajouter votre utilisateur au groupe docker (évite d'utiliser sudo)
sudo usermod -aG docker $USER

# Redémarrer la session ou exécuter :
newgrp docker

# Démarrer Docker au démarrage
sudo systemctl enable docker
sudo systemctl start docker

# Vérifier que Docker fonctionne
docker run hello-world
```

## Étape 4 : Installation de Git (si pas déjà installé)

```bash
# Installer Git
sudo apt install -y git

# Vérifier l'installation
git --version
```

## Étape 5 : Cloner le projet

```bash
# Se placer dans le répertoire souhaité (par exemple /opt ou ~)
cd ~

# Cloner le dépôt
git clone https://github.com/MOHAMED-BELHAJ-NETSUNSIDE/selos.git

# Entrer dans le répertoire du projet
cd selos
```

## Étape 6 : Configuration des variables d'environnement

```bash
# Copier le fichier d'exemple
cp .env.example .env

# Éditer le fichier .env avec vos valeurs
nano .env
# ou
vim .env
```

**Configuration minimale requise dans `.env` :**

```env
# Database - Changez ces valeurs pour la production
MYSQL_ROOT_PASSWORD=votre_mot_de_passe_root_securise
MYSQL_DATABASE=selos_db
MYSQL_USER=selos_user
MYSQL_PASSWORD=votre_mot_de_passe_securise
MYSQL_PORT=3306

# Backend - Changez le JWT_SECRET pour la production
JWT_SECRET=votre_secret_jwt_tres_securise_changez_moi
JWT_EXPIRES_IN=7d
BACKEND_PORT=3001

# Frontend
NEXTAUTH_SECRET=votre_secret_nextauth_tres_securise_changez_moi
NEXTAUTH_URL=http://localhost:3000
NEXT_PUBLIC_API_URL=http://localhost:3001
FRONTEND_PORT=3000

# Frontend Retails
NEXTAUTH_URL_RETAILS=http://localhost:3002
FRONTEND_RETAILS_PORT=3002

# Business Central (optionnel - à configurer si nécessaire)
BC_TENANT_ID=
BC_CLIENT_ID=
BC_CLIENT_SECRET=
BC_ENVIRONMENT=
BC_COMPANY_ID=
BC_COMPANY_NAME=
TIMBRE=1.00
```

## Étape 7 : Construction et démarrage des services Docker

```bash
# Construire les images Docker (première fois ou après modification)
docker compose build

# Démarrer tous les services en arrière-plan
docker compose up -d

# Voir les logs de tous les services
docker compose logs -f

# Voir les logs d'un service spécifique
docker compose logs -f backend
docker compose logs -f frontend
docker compose logs -f mysql
```

## Étape 8 : Initialisation de la base de données

```bash
# Attendre que MySQL soit prêt (environ 30 secondes)
sleep 30

# Vérifier que les services sont démarrés
docker compose ps

# Exécuter les migrations Prisma
docker compose exec backend npx prisma migrate deploy

# Générer le client Prisma
docker compose exec backend npx prisma generate

# (Optionnel) Insérer les données de seed
docker compose exec backend npx prisma db seed
```

## Étape 9 : Vérification de l'installation

```bash
# Vérifier que tous les services sont en cours d'exécution
docker compose ps

# Tester les endpoints
curl http://localhost:3001/api
curl http://localhost:3000
curl http://localhost:3002
```

## Accès aux services

Une fois tout démarré, vous pouvez accéder à :

- **Frontend Backoffice** : http://localhost:3000
- **Frontend Retails** : http://localhost:3002
- **Backend API** : http://localhost:3001
- **Swagger Documentation** : http://localhost:3001/api
- **MySQL** : localhost:3306

## Commandes utiles

### Gestion des services

```bash
# Arrêter tous les services
docker compose down

# Arrêter et supprimer les volumes (⚠️ supprime les données)
docker compose down -v

# Redémarrer un service spécifique
docker compose restart backend

# Reconstruire un service spécifique
docker compose build --no-cache backend
docker compose up -d backend
```

### Logs et débogage

```bash
# Voir les logs en temps réel
docker compose logs -f

# Voir les logs d'un service
docker compose logs -f backend

# Voir les 100 dernières lignes
docker compose logs --tail=100 backend

# Accéder au shell du backend
docker compose exec backend sh

# Accéder à MySQL
docker compose exec mysql mysql -u selos_user -p selos_db
```

### Base de données

```bash
# Exécuter Prisma Studio (interface graphique)
docker compose exec backend npx prisma studio

# Créer une migration
docker compose exec backend npx prisma migrate dev --name nom_de_la_migration

# Réinitialiser la base de données (⚠️ supprime toutes les données)
docker compose exec backend npx prisma migrate reset
```

### Maintenance

```bash
# Voir l'utilisation des ressources
docker stats

# Nettoyer les images non utilisées
docker system prune -a

# Sauvegarder la base de données
docker compose exec mysql mysqldump -u selos_user -p selos_db > backup_$(date +%Y%m%d_%H%M%S).sql

# Restaurer la base de données
docker compose exec -T mysql mysql -u selos_user -p selos_db < backup.sql
```

## Configuration pour la production

### 1. Utiliser un reverse proxy (Nginx)

```bash
# Installer Nginx
sudo apt install -y nginx

# Créer la configuration
sudo nano /etc/nginx/sites-available/selos
```

**Configuration Nginx `/etc/nginx/sites-available/selos` :**

```nginx
server {
    listen 80;
    server_name votre-domaine.com;

    # Frontend Backoffice
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Frontend Retails
    location /retails {
        proxy_pass http://localhost:3002;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Backend API
    location /api {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

```bash
# Activer le site
sudo ln -s /etc/nginx/sites-available/selos /etc/nginx/sites-enabled/

# Tester la configuration
sudo nginx -t

# Redémarrer Nginx
sudo systemctl restart nginx
```

### 2. Installer Certbot pour HTTPS (Let's Encrypt)

```bash
# Installer Certbot
sudo apt install -y certbot python3-certbot-nginx

# Obtenir un certificat SSL
sudo certbot --nginx -d votre-domaine.com

# Le renouvellement automatique est configuré par défaut
```

### 3. Configuration du firewall

```bash
# Installer UFW (si pas déjà installé)
sudo apt install -y ufw

# Autoriser SSH (important avant d'activer le firewall)
sudo ufw allow 22/tcp

# Autoriser HTTP et HTTPS
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Activer le firewall
sudo ufw enable

# Vérifier le statut
sudo ufw status
```

### 4. Optimisations Docker pour la production

Créer un fichier `/etc/docker/daemon.json` :

```bash
sudo nano /etc/docker/daemon.json
```

```json
{
  "log-driver": "json-file",
  "log-opts": {
    "max-size": "10m",
    "max-file": "3"
  }
}
```

```bash
# Redémarrer Docker
sudo systemctl restart docker
```

## Dépannage

### Problème : Port déjà utilisé

```bash
# Vérifier quel processus utilise le port
sudo lsof -i :3000
sudo lsof -i :3001
sudo lsof -i :3306

# Tuer le processus ou changer le port dans .env
```

### Problème : Docker ne démarre pas

```bash
# Vérifier le statut de Docker
sudo systemctl status docker

# Redémarrer Docker
sudo systemctl restart docker

# Voir les logs Docker
sudo journalctl -u docker
```

### Problème : Les migrations échouent

```bash
# Vérifier la connexion à MySQL
docker compose exec backend sh -c "npx prisma db pull"

# Vérifier les logs MySQL
docker compose logs mysql

# Réinitialiser la base de données (⚠️ supprime les données)
docker compose down -v
docker compose up -d mysql
# Attendre que MySQL soit prêt
sleep 30
docker compose exec backend npx prisma migrate deploy
```

### Problème : Les frontends ne peuvent pas accéder au backend

```bash
# Vérifier que le backend est démarré
docker compose ps backend

# Vérifier les logs du backend
docker compose logs backend

# Vérifier la variable NEXT_PUBLIC_API_URL dans .env
cat .env | grep NEXT_PUBLIC_API_URL

# Tester la connexion depuis le frontend
docker compose exec frontend sh -c "curl http://backend:3001/api"
```

## Script d'installation automatique

Vous pouvez créer un script `install.sh` pour automatiser l'installation :

```bash
#!/bin/bash
set -e

echo "🚀 Installation de Selos sur Ubuntu 24.04"

# Mise à jour du système
echo "📦 Mise à jour du système..."
sudo apt update && sudo apt upgrade -y

# Installation de Docker
echo "🐳 Installation de Docker..."
if ! command -v docker &> /dev/null; then
    sudo apt install -y ca-certificates curl gnupg lsb-release
    sudo install -m 0755 -d /etc/apt/keyrings
    curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
    sudo chmod a+r /etc/apt/keyrings/docker.gpg
    echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
    sudo apt update
    sudo apt install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
    sudo usermod -aG docker $USER
    sudo systemctl enable docker
    sudo systemctl start docker
    echo "✅ Docker installé"
else
    echo "✅ Docker déjà installé"
fi

# Installation de Git
echo "📥 Installation de Git..."
if ! command -v git &> /dev/null; then
    sudo apt install -y git
    echo "✅ Git installé"
else
    echo "✅ Git déjà installé"
fi

# Cloner le projet
echo "📂 Clonage du projet..."
if [ ! -d "selos" ]; then
    git clone https://github.com/MOHAMED-BELHAJ-NETSUNSIDE/selos.git
    cd selos
    echo "✅ Projet cloné"
else
    echo "✅ Projet déjà présent"
    cd selos
    git pull
fi

# Configuration de l'environnement
echo "⚙️ Configuration de l'environnement..."
if [ ! -f ".env" ]; then
    cp .env.example .env
    echo "⚠️  Fichier .env créé. Veuillez le configurer avec vos valeurs."
    echo "📝 Éditez le fichier .env : nano .env"
else
    echo "✅ Fichier .env existe déjà"
fi

# Construction et démarrage
echo "🔨 Construction des images Docker..."
docker compose build

echo "🚀 Démarrage des services..."
docker compose up -d

echo "⏳ Attente du démarrage de MySQL (30 secondes)..."
sleep 30

echo "🗄️  Initialisation de la base de données..."
docker compose exec backend npx prisma migrate deploy
docker compose exec backend npx prisma generate

echo "✅ Installation terminée !"
echo ""
echo "📋 Services disponibles :"
echo "   - Frontend Backoffice: http://localhost:3000"
echo "   - Frontend Retails: http://localhost:3002"
echo "   - Backend API: http://localhost:3001"
echo "   - Swagger: http://localhost:3001/api"
echo ""
echo "📝 N'oubliez pas de configurer le fichier .env avec vos valeurs !"
echo "📊 Voir les logs: docker compose logs -f"
```

Pour utiliser le script :

```bash
# Rendre le script exécutable
chmod +x install.sh

# Exécuter le script
./install.sh
```

## Support

Pour toute question ou problème :
- Consultez le fichier [DOCKER.md](./DOCKER.md)
- Consultez les logs : `docker compose logs -f`
- Ouvrez une issue sur GitHub

---

**Bon déploiement ! 🚀**

