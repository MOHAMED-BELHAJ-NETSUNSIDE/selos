# Selos Backoffice

Un backoffice retail moderne développé avec NestJS (backend) et Next.js (frontend), incluant un système d'authentification complet, de gestion des rôles et permissions, et des opérations CRUD pour les entités métier.

## 🚀 Fonctionnalités

### Backend (NestJS)
- ✅ **Authentification JWT** avec Passport
- ✅ **Système de rôles et permissions** modulaire
- ✅ **CRUD complet** pour Clients, Utilisateurs, Rôles
- ✅ **Système de logs** avec EventEmitter (journalisation asynchrone)
- ✅ **Validation des données** avec class-validator
- ✅ **Documentation API** avec Swagger/OpenAPI
- ✅ **Base de données MySQL** avec Prisma ORM
- ✅ **Expiration automatique des sessions** lors de la désactivation d'un utilisateur

### Frontend (Next.js)
- ✅ **Interface moderne** avec Shadcn/UI et Tailwind CSS
- ✅ **Authentification** avec Auth.js (NextAuth)
- ✅ **Data Tables** complètes avec recherche, pagination et tri
- ✅ **Formulaires modaux** avec validation React Hook Form + Zod
- ✅ **Gestion des notifications** avec Sonner
- ✅ **Sidebar responsive** avec navigation
- ✅ **Système de permissions** intégré

## 🏗️ Architecture

```
selos/
├── backend/                 # API NestJS
│   ├── src/
│   │   ├── auth/           # Authentification JWT
│   │   ├── clients/        # Module Clients
│   │   ├── users/          # Module Utilisateurs
│   │   ├── roles/          # Module Rôles
│   │   ├── logs/           # Module Logs
│   │   └── prisma/         # Service Prisma
│   └── prisma/
│       └── schema.prisma   # Schéma de base de données
├── frontend/               # Interface Next.js
│   ├── src/
│   │   ├── app/           # Pages App Router
│   │   ├── components/    # Composants UI
│   │   ├── hooks/         # Hooks React Query
│   │   └── lib/           # Utilitaires
└── API_ENDPOINTS.md       # Documentation API
```

## 🛠️ Installation

### Prérequis
- Node.js 18+
- MySQL 8.0+
- npm ou yarn

### 1. Cloner le projet
```bash
git clone <repository-url>
cd selos
```

### 2. Installer les dépendances
```bash
npm run install:all
```

### 3. Configuration de la base de données
```bash
# Copier les fichiers d'environnement
cp backend/env.example backend/.env
cp frontend/env.local.example frontend/.env.local

# Configurer les variables dans backend/.env
DATABASE_URL="mysql://selos_db_user:selos_db@ab110337-001.eu.clouddb.ovh.net:35286/selos_db"
JWT_SECRET="Mohamed08545547@"
JWT_EXPIRES_IN="7d"

# Configurer les variables dans frontend/.env.local
NEXTAUTH_SECRET="your-nextauth-secret"
NEXTAUTH_URL="http://localhost:3000"
NEXT_PUBLIC_API_URL="http://localhost:3001"
```

### 4. Initialiser la base de données
```bash
# Générer le client Prisma
npm run db:generate

# Appliquer les migrations
npm run db:push

# Insérer les données de test
npm run db:seed
```

### 5. Lancer l'application
```bash
# Développement (frontend + backend)
npm run dev

# Ou séparément
npm run dev:backend   # Backend uniquement (port 3001)
npm run dev:frontend  # Frontend uniquement (port 3000)
```

## 🔑 Comptes de test

| Rôle | Email | Mot de passe | Permissions |
|------|-------|--------------|-------------|
| **Admin** | admin@selos.com | admin123 | Toutes les permissions |
| **Manager** | manager@selos.com | manager123 | Clients + lecture utilisateurs |
| **Vendeur** | vendeur@selos.com | vendeur123 | Lecture clients uniquement |

## 📚 Documentation

### API Documentation
- **Swagger UI:** http://localhost:3001/api
- **Documentation complète:** [API_ENDPOINTS.md](./API_ENDPOINTS.md)

### URLs de développement
- **Frontend:** http://localhost:3000
- **Backend API:** http://localhost:3001
- **Documentation API:** http://localhost:3001/api

## 🎯 Fonctionnalités détaillées

### 🔐 Authentification et sécurité
- Authentification JWT avec expiration configurable
- Système de rôles et permissions granulaire
- Expiration automatique des sessions lors de la désactivation d'un utilisateur
- Validation stricte des données côté client et serveur
- Protection CSRF et sanitisation des entrées

### 📊 Interface utilisateur
- **Sidebar responsive** avec navigation intuitive
- **Data Tables Shadcn/UI** avec :
  - Recherche en temps réel
  - Pagination côté serveur
  - Tri par colonnes
  - Actions contextuelles (voir, modifier, supprimer)
- **Formulaires modaux** avec validation en temps réel
- **Notifications toast** pour le feedback utilisateur
- **Design responsive** adapté mobile et desktop

### 📝 Système de logs
- Journalisation automatique de toutes les actions CRUD
- Logs asynchrones via EventEmitter (ne bloque pas les réponses API)
- Filtrage par utilisateur, module et action
- Pagination et tri des logs
- Conservation des données avant/après modification

### 🗄️ Gestion des données
- **Clients** : CRUD complet avec validation
- **Utilisateurs** : Gestion avec activation/désactivation
- **Rôles** : Création et modification des permissions
- **Logs** : Consultation de l'historique des actions

## 🚀 Scripts disponibles

```bash
# Développement
npm run dev              # Frontend + Backend
npm run dev:frontend     # Frontend uniquement
npm run dev:backend      # Backend uniquement

# Production
npm run build            # Build complet
npm run start            # Démarrage production

# Base de données
npm run db:generate      # Générer le client Prisma
npm run db:push          # Appliquer les migrations
npm run db:seed          # Insérer les données de test
npm run db:studio        # Interface Prisma Studio
```

## 🔧 Configuration avancée

### Variables d'environnement

#### Backend (.env)
```env
DATABASE_URL="mysql://user:password@host:port/database"
JWT_SECRET="your-jwt-secret"
JWT_EXPIRES_IN="7d"
```

#### Frontend (.env.local)
```env
NEXTAUTH_SECRET="your-nextauth-secret"
NEXTAUTH_URL="http://localhost:3000"
NEXT_PUBLIC_API_URL="http://localhost:3001"
```

### Permissions système

Le système utilise des permissions granulaires :
- `users:read`, `users:write`, `users:delete`
- `clients:read`, `clients:write`, `clients:delete`
- `roles:read`, `roles:write`, `roles:delete`
- `logs:read`

## 🧪 Tests

```bash
# Tests backend
cd backend
npm run test

# Tests e2e
npm run test:e2e
```

## 📦 Déploiement

### Backend
```bash
cd backend
npm run build
npm run start:prod
```

### Frontend
```bash
cd frontend
npm run build
npm run start
```

### Docker (optionnel)
```bash
# Créer les images Docker
docker build -t selos-backend ./backend
docker build -t selos-frontend ./frontend

# Lancer avec docker-compose
docker-compose up
```

## 🤝 Contribution

1. Fork le projet
2. Créer une branche feature (`git checkout -b feature/AmazingFeature`)
3. Commit les changements (`git commit -m 'Add some AmazingFeature'`)
4. Push vers la branche (`git push origin feature/AmazingFeature`)
5. Ouvrir une Pull Request

## 📄 Licence

Ce projet est sous licence MIT. Voir le fichier [LICENSE](LICENSE) pour plus de détails.

## 🆘 Support

Pour toute question ou problème :
- Consulter la [documentation API](./API_ENDPOINTS.md)
- Ouvrir une issue sur GitHub
- Contacter l'équipe de développement

---

**Développé avec ❤️ par l'équipe Selos**

## Modules disponibles

- Utilisateurs (users)
- Rôles (roles)
- Logs (logs)
- Clients (client) — code, nom, canal, localité, secteur
- Types utilisateur (type-users)
- Secteurs (secteur)
- Zones (zone)
- Types de vente (type-vente)
- Gouvernorats (gouvernorat)
- Délégations (delegation)
- Localités (localite)
- Canaux (canal)

## Permissions par module (catalogue)

Chaque module expose les permissions suivantes, si applicable:
- read: `${module}:read`
- write: `${module}:write`
- delete: `${module}:delete`

Exemples:
- `users:read`, `roles:write`, `secteur:delete`, `type-vente:read`

Le menu latéral n’affiche un module que si l’utilisateur connecté possède la permission `${module}:read`.

## Données & Seed

Un seed minimal ajoute des entrées de base pour:
- Gouvernorat (Tunis), Délégation (Ariana Ville), Localité (La Marsa)
- Canal (GMS), Type de vente (Détail)
- Secteur (Secteur Nord)

Lancer:
```bash
cd backend
npx prisma db seed
```

## Modèle Client (nouvelle structure)

Table `client` (MySQL):
- id (int, PK auto)
- code (string unique)
- nom (string)
- canalId (FK canal, nullable)
- localiteId (FK localite, nullable)
- secteurId (FK secteur, nullable)

L’API renvoie les relations: `canal`, `localite.delegation.gouvernorat`, `secteur`.

## Liaisons Secteur

Endpoints REST:
- Zones: `GET /secteurs/:id/zones`, `POST /secteurs/:id/zones/:zoneId`, `DELETE /secteurs/:id/zones/:zoneId`
- Types de vente: `GET /secteurs/:id/type-ventes`, `POST /secteurs/:id/type-ventes/:typeVenteId`, `DELETE /secteurs/:id/type-ventes/:typeVenteId`

UI: Dans la page Secteurs, menu “Gérer les liaisons” ouvre une modale pour ajouter/retirer zones et types de vente.


