# 🚀 Guide de Configuration - Selos Backoffice

## Installation Rapide

### Windows
```bash
# Double-cliquer sur start.bat
# OU exécuter dans PowerShell :
.\start.bat
```

### Linux/Mac
```bash
# Rendre le script exécutable et lancer
chmod +x start.sh
./start.sh
```

## Configuration Manuelle

### 1. Variables d'environnement

#### Backend (backend/.env)
```env
DATABASE_URL="mysql://selos_db_user:selos_db@ab110337-001.eu.clouddb.ovh.net:35286/selos_db"
JWT_SECRET="Mohamed08545547@"
JWT_EXPIRES_IN="7d"
```

#### Frontend (frontend/.env.local)
```env
NEXTAUTH_SECRET="your-nextauth-secret"
NEXTAUTH_URL="http://localhost:3000"
NEXT_PUBLIC_API_URL="http://localhost:3001"
```

### 2. Base de données
```bash
# Générer le client Prisma
cd backend
npx prisma generate

# Appliquer les migrations
npx prisma db push

# Insérer les données de test
npx prisma db seed
```

### 3. Démarrage
```bash
# Développement (frontend + backend)
npm run dev

# Ou séparément
npm run dev:backend   # Port 3001
npm run dev:frontend  # Port 3000
```

## 🔑 Comptes de Test

| Rôle | Email | Mot de passe |
|------|-------|--------------|
| **Admin** | admin@selos.com | admin123 |
| **Manager** | manager@selos.com | manager123 |
| **Vendeur** | vendeur@selos.com | vendeur123 |

## 📚 URLs

- **Frontend:** http://localhost:3000
- **Backend API:** http://localhost:3001
- **Documentation API:** http://localhost:3001/api

## ✅ Vérification

1. Ouvrir http://localhost:3000
2. Se connecter avec admin@selos.com / admin123
3. Vérifier que le dashboard s'affiche
4. Tester la navigation entre les modules

## 🆘 Dépannage

### Erreur de base de données
- Vérifier que MySQL est accessible
- Vérifier les variables d'environnement
- Exécuter `npx prisma db push`

### Erreur de compilation
- Vérifier que Node.js 18+ est installé
- Exécuter `npm run install:all`
- Vérifier les variables d'environnement

### Port déjà utilisé
- Changer les ports dans les fichiers .env
- Arrêter les processus utilisant les ports 3000/3001




