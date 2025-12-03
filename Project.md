# Prompt complet pour générer le projet Selos

## Contexte du projet

**Selos** est un backoffice retail moderne développé avec une architecture fullstack utilisant NestJS (backend) et Next.js (frontend). Le projet implémente un système de gestion complet avec authentification, gestion des rôles et permissions, et CRUD pour les entités métier.

## Architecture technique

### Backend (NestJS)
- **Framework**: NestJS avec TypeScript
- **Base de données**: MySQL avec Prisma ORM
- **Authentification**: JWT avec Passport
- **Validation**: Class-validator et class-transformer
- **Documentation**: Swagger/OpenAPI intégré
- **Documentation API**: Chaque endpoint doit être documenté dans un fichier `API_ENDPOINTS.md`

### Frontend (Next.js)
- **Framework**: Next.js 15 avec App Router
- **UI**: Shadcn/UI avec Tailwind CSS
- **Authentification**: Auth.js (NextAuth)
- **État**: React hooks personnalisés
- **Types**: TypeScript strict

## Fonctionnalités principales

### 1. Système d'authentification
- Authentification JWT côté backend
- Intégration Auth.js côté frontend
- Gestion des sessions sécurisées
- Middleware de protection des routes

### 2. Gestion des rôles et permissions
- Système modulaire de permissions
- Rôles prédéfinis (Admin, Manager, Vendeur)
- Guards de protection basés sur les permissions
- Interface de gestion des rôles
- **Expiration automatique des sessions** lors de la désactivation d'un utilisateur

### 3. CRUD Clients
- Création, lecture, mise à jour, suppression des clients
- Pagination cursor pour les performances
- Validation des données côté client et serveur
- Interface utilisateur moderne avec tables et formulaires

### 4. Interface utilisateur
- Dashboard responsive
- Navigation avec sidebar
- Composants UI réutilisables (Shadcn/UI)
- Formulaires avec validation en temps réel
- Tables avec pagination et tri

## 🎨 INTERFACE FRONTEND
- **Interface backoffice moderne avec sidebar à gauche et Data Table Shadcn/UI complète**
- Une **barre latérale (sidebar)** à gauche avec un menu de navigation :
  - Dashboard, Clients, Utilisateurs, Rôles
- Une **barre supérieure (topbar)** avec profil utilisateur (déconnexion, paramètres)
- Design moderne et réactif (Shadcn/UI + Tailwind)
- **Utiliser UNIQUEMENT les composants Shadcn/UI** pour tous les éléments d'interface
- Utiliser **React Query** pour récupérer les données depuis NestJS
- Gestion globale des notifications (toasts) et des chargements

## 📊 TABLEAUX DE DONNÉES (Data Table Shadcn/UI)
- Tous les modules doivent afficher les données avec le **composant "Data Table" de Shadcn/UI**
- Basé sur l'exemple officiel : https://ui.shadcn.com/docs/components/data-table
- La DataTable doit inclure :
  - ✅ Recherche (filtrage côté serveur)
  - ✅ Pagination **côté serveur**
  - ✅ Tri par colonne (asc/desc) **côté serveur**
  - ✅ Bouton "Ajouter" en haut à droite
  - ✅ Menu d'actions à 3 points (icône `MoreHorizontal`) dans chaque ligne
  - ✅ Ce menu doit s'ouvrir avec les options suivantes :
    - **Afficher / Consulter**
    - **Modifier**
    - **Supprimer** → le texte de cette option doit être **rouge** pour signaler une action destructive
  - ✅ Après suppression, la table se recharge automatiquement
  - ✅ Après ajout ou modification, la table se met à jour via React Query

## 🪟 FORMULAIRES DANS DES MODALES
- L'ajout et la modification se font dans des **modales Shadcn/UI**
- Clic sur "Ajouter" ou "Modifier" → ouverture d'une modale avec :
  - **React Hook Form + Zod** pour validation
  - Champs dynamiques selon le module (ex: name, address, phone, email pour clients)
  - Envoi des données via **React Query mutation**
  - Fermeture automatique de la modale après succès + rechargement de la DataTable

## ⚠️ ALERTES APRÈS ACTIONS (Success / Error)
- Après **ajout**, **modification** ou **suppression**, une alerte doit toujours apparaître **en haut à droite de l'écran**
- Utiliser le **composant "Alert" de Shadcn/UI**
- L'alerte doit afficher :
  - ✅ Message clair : "Client ajouté avec succès", "Modification enregistrée", "Client supprimé"
  - ✅ Type :
    - Vert (success)
    - Rouge (erreur)
    - Jaune (avertissement)
  - ✅ Durée d'affichage : 3 à 5 secondes, puis disparaît automatiquement
- Ces alertes doivent être intégrées dans un **provider global** pour être appelées depuis n'importe quel composant.

## 📚 DOCUMENTATION API
- **Fichier obligatoire** : `API_ENDPOINTS.md` à la racine du projet
- **Chaque endpoint** doit être documenté avec :
  - URL complète (ex: `POST /api/auth/login`)
  - Méthode HTTP (GET, POST, PUT, DELETE)
  - Description de la fonctionnalité
  - Paramètres requis (query, body, params)
  - Headers requis (Authorization, Content-Type)
  - Exemples de requêtes et réponses (JSON)
  - Codes de statut HTTP possibles
  - Permissions requises
- **Format standardisé** pour faciliter la maintenance
- **Exemples concrets** pour chaque endpoint

## 🔐 GESTION DES SESSIONS ET SÉCURITÉ
- **Expiration automatique des sessions** : Lorsqu'un utilisateur est désactivé, toutes ses sessions JWT expirent automatiquement
- **Validation en temps réel** : Chaque requête vérifie le statut actif de l'utilisateur
- **Déconnexion forcée** : Les utilisateurs désactivés sont automatiquement déconnectés de toutes leurs sessions
- **Blacklist des tokens** : Système de blacklist pour invalider immédiatement les tokens des utilisateurs désactivés

## 📝 Module Logs (Historique des actions)
- Table `logs` :
  - id
  - user_id (FK vers users)
  - module (ex: "clients", "roles", "users")
  - action (ex: "create", "update", "delete")
  - record_id (id de l'élément concerné)
  - description (texte libre : ex. "Client #12 modifié par Admin")
  - old_data (JSON) ← ancienne valeur de l'enregistrement (pour "update")
  - new_data (JSON) ← nouvelle valeur (pour "create" et "update")
  - created_at (timestamp)
- Le backend doit **journaliser toutes les actions CRUD de tous les modules** de manière **asynchrone**
- Utiliser **EventEmitter de NestJS** pour créer les logs **sans bloquer la réponse API**
- Exemple :
  - `update` : log { old_data: {...}, new_data: {...}, action: "update" }
  - `delete` : log { old_data: {...}, new_data: null, action: "delete" }
- Endpoint `/logs` visible uniquement par les rôles autorisés
- Liste paginée, triable par date, filtrable par utilisateur, module ou action

## Structure des données

### Modèles Prisma
```prisma
model User {
  id          String   @id @default(cuid())
  email       String   @unique
  password    String
  firstName   String
  lastName    String
  role        Role     @relation(fields: [roleId], references: [id])
  roleId      String
  logs        Log[]    // Relation vers les logs
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}

model Role {
  id          String   @id @default(cuid())
  name        String   @unique
  permissions String[] // Array de permissions
  users       User[]
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}

model Client {
  id          String   @id @default(cuid())
  firstName   String
  lastName    String
  email       String?  @unique
  phone       String?
  address     String?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}

model Log {
  id          String   @id @default(cuid())
  userId      String
  user        User     @relation(fields: [userId], references: [id])
  module      String   // "clients", "roles", "users"
  action      String   // "create", "update", "delete"
  recordId    String?  // ID de l'élément concerné
  description String?  // Description libre
  oldData     Json?    // Ancienne valeur (pour update)
  newData     Json?    // Nouvelle valeur (pour create/update)
  createdAt   DateTime @default(now())
}
```

## Permissions système

### Rôles prédéfinis
- **Admin**: Accès complet à toutes les fonctionnalités
- **Manager**: Gestion des clients et consultation des utilisateurs
- **Vendeur**: Consultation des clients uniquement

### Permissions disponibles
- `users:read`, `users:write`, `users:delete`
- `clients:read`, `clients:write`, `clients:delete`
- `roles:read`, `roles:write`, `roles:delete`
- `logs:read` (consultation des logs d'audit)

## Configuration et déploiement

### Variables d'environnement
```env
# Backend (.env)
DATABASE_URL="mysql://selos_db_user:selos_db@ab110337-001.eu.clouddb.ovh.net:35286/selos_db"
JWT_SECRET="Mohamed08545547@"
JWT_EXPIRES_IN="7d"

# Frontend (.env.local)
NEXTAUTH_SECRET="your-nextauth-secret"
NEXTAUTH_URL="http://localhost:3000"
NEXT_PUBLIC_API_URL="http://localhost:3001"
```

### Scripts de développement
- `npm run dev` - Lance frontend et backend
- `npm run dev:backend` - Backend uniquement
- `npm run dev:frontend` - Frontend uniquement
- `npm run build` - Build de production
- `npm run db:seed` - Données de test

## Comptes de test

- **Admin**: admin@selos.com / admin123
- **Manager**: manager@selos.com / manager123
- **Vendeur**: vendeur@selos.com / vendeur123

## URLs de développement

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:3001
- **Documentation API**: http://localhost:3001/api

## Commandes de génération

Pour reproduire ce projet, utiliser les commandes suivantes :

```bash
# 1. Créer le workspace
mkdir selos && cd selos
npm init -y

# 2. Configurer le workspace
npm install -D concurrently wait-on

# 3. Backend NestJS
npx @nestjs/cli new backend --package-manager npm
cd backend
npm install @nestjs/prisma prisma @prisma/client
npm install @nestjs/jwt @nestjs/passport passport passport-jwt
npm install class-validator class-transformer
npm install @nestjs/swagger swagger-ui-express

# 4. Frontend Next.js
cd ..
npx create-next-app@latest frontend --typescript --tailwind --eslint --app --src-dir --import-alias "@/*"
cd frontend
npm install @auth/core next-auth
npm install @radix-ui/react-avatar @radix-ui/react-dialog @radix-ui/react-dropdown-menu
npm install @radix-ui/react-label @radix-ui/react-select @radix-ui/react-separator
npm install @radix-ui/react-slot @radix-ui/react-toast
npm install class-variance-authority clsx tailwind-merge
npm install lucide-react
```

## Points d'attention

1. **Sécurité**: Validation stricte des données, protection CSRF, sanitisation des entrées
2. **Performance**: Pagination cursor, lazy loading, optimisation des requêtes
3. **UX**: Feedback utilisateur, états de chargement, gestion d'erreurs
4. **Maintenabilité**: Code modulaire, types TypeScript, documentation API
5. **Tests**: Structure prête pour l'ajout de tests unitaires et d'intégration

## Extensions possibles

- Système de notifications en temps réel
- Export/import de données (CSV, Excel)
- Audit trail des modifications
- API GraphQL en complément de REST
- Tests automatisés (Jest, Cypress)
- CI/CD avec GitHub Actions
- Déploiement Docker
- Monitoring et logging avancés
