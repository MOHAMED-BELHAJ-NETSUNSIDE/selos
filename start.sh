#!/bin/bash

echo "========================================"
echo "   Selos Backoffice - Démarrage"
echo "========================================"
echo

echo "[1/3] Installation des dépendances..."
npm run install:all
if [ $? -ne 0 ]; then
    echo "Erreur lors de l'installation des dépendances"
    exit 1
fi

echo
echo "[2/3] Configuration de la base de données..."
cd backend
npx prisma generate
if [ $? -ne 0 ]; then
    echo "Erreur lors de la génération du client Prisma"
    exit 1
fi

echo
echo "[3/3] Démarrage de l'application..."
cd ..
npm run dev




