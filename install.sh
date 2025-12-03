#!/bin/bash
set -e

echo "🚀 Installation de Selos sur Ubuntu 24.04"
echo ""

# Vérifier si on est root
if [ "$EUID" -eq 0 ]; then 
   echo "❌ Ne pas exécuter ce script en tant que root"
   exit 1
fi

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
    echo "⚠️  Vous devez vous déconnecter et reconnecter pour que les changements de groupe prennent effet"
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
CURRENT_DIR=$(pwd)
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
    echo ""
    echo "Appuyez sur Entrée après avoir configuré le fichier .env..."
    read
else
    echo "✅ Fichier .env existe déjà"
fi

# Vérifier que Docker fonctionne
echo "🔍 Vérification de Docker..."
if ! docker info &> /dev/null; then
    echo "❌ Docker n'est pas accessible. Essayez de vous déconnecter et reconnecter."
    exit 1
fi

# Construction et démarrage
echo "🔨 Construction des images Docker..."
docker compose build

echo "🚀 Démarrage des services..."
docker compose up -d

echo "⏳ Attente du démarrage de MySQL (30 secondes)..."
sleep 30

echo "🗄️  Initialisation de la base de données..."
docker compose exec backend npx prisma migrate deploy || echo "⚠️  Les migrations peuvent avoir déjà été appliquées"
docker compose exec backend npx prisma generate

echo ""
echo "✅ Installation terminée !"
echo ""
echo "📋 Services disponibles (IP publique: 54.37.230.48) :"
echo "   - Frontend Backoffice: http://54.37.230.48:3000"
echo "   - Frontend Retails: http://54.37.230.48:3002"
echo "   - Selos Mobile: http://54.37.230.48:3003"
echo "   - Backend API: http://54.37.230.48:3001"
echo "   - Swagger: http://54.37.230.48:3001/api"
echo ""
echo "📊 Voir les logs: docker compose logs -f"
echo "🛑 Arrêter les services: docker compose down"
echo "🔄 Redémarrer: docker compose restart"

