# Selos Mobile

Application mobile-first pour les vendeurs terrain permettant de créer des bons de livraison (BL) en ligne ou hors ligne avec synchronisation automatique.

## 🚀 Stack technique

- **React** + **Vite** - Framework et build tool
- **TypeScript** - Typage statique
- **TailwindCSS** - Styles utilitaires
- **shadcn/ui** - Composants UI
- **Zustand** - Gestion d'état avec persist
- **Dexie** (IndexedDB) - Stockage offline
- **Axios** - Appels API
- **React Router** - Navigation
- **PWA** - Application Progressive Web App

## 📋 Fonctionnalités

### ✅ Authentification
- Connexion avec email/mot de passe ou code vendeur
- Support offline avec identifiants en cache
- Stockage sécurisé des tokens

### ✅ Création de BL (offline-first)
- Sélection de client (modal avec recherche)
- Sélection de produits du stock vendeur (modal)
- Saisie des quantités avec stepper
- Création en ligne (POST direct) ou hors ligne (stockage IndexedDB)
- Notification de synchronisation automatique

### ✅ Synchronisation automatique
- Détection de la connectivité
- Synchronisation automatique au retour en ligne
- Bouton manuel de synchronisation
- Indicateur de BL en attente
- Notifications toast

### ✅ Tableau de bord
- 5 derniers BL
- Alertes stock (produits < 10)
- Actions rapides
- Cache offline

### ✅ Page Stock
- Liste des produits avec quantités
- Indicateurs couleur (vert/orange/rouge)
- Recherche
- Cache offline

### ✅ Navigation
- Barre de navigation bottom (Dashboard / Stock / BL / Profil)
- Header avec indicateur de synchronisation
- Design mobile-first

## 🛠️ Installation

```bash
# Installer les dépendances
npm install

# Créer le fichier .env
cp .env.example .env

# Configurer l'URL de l'API backend dans .env
VITE_API_URL=http://localhost:3001
```

## 🚀 Développement

```bash
# Lancer le serveur de développement
npm run dev

# L'application sera accessible sur http://localhost:3003
```

## 📦 Build

```bash
# Build pour production
npm run build

# Prévisualiser le build
npm run preview
```

## 🔧 Configuration

### Variables d'environnement

- `VITE_API_URL` - URL du backend API (défaut: http://localhost:3001)

### Backend requis

L'application nécessite un backend Selos avec les endpoints suivants :

- `POST /auth/login` - Authentification
- `GET /clients` - Liste des clients
- `GET /stock/salesperson/:id` - Stock du vendeur
- `GET /delivery-notes` - Liste des BL
- `POST /delivery-notes` - Création de BL

## 📱 PWA

L'application est configurée comme PWA et peut être installée sur mobile :

1. Ouvrir l'application dans le navigateur
2. Ajouter à l'écran d'accueil
3. L'application fonctionnera en mode standalone

## 🔄 Synchronisation offline

Les BL créés hors ligne sont stockés dans IndexedDB et synchronisés automatiquement :

1. Au retour en ligne (détection automatique)
2. Via le bouton "Synchroniser maintenant" dans le header
3. Les données sont mises en cache pour consultation offline

## 📂 Structure du projet

```
selos-mobile/
├── src/
│   ├── components/       # Composants réutilisables
│   │   ├── ui/          # Composants shadcn/ui
│   │   ├── BottomNav.tsx
│   │   ├── Header.tsx
│   │   ├── SyncIndicator.tsx
│   │   └── ...
│   ├── pages/           # Pages de l'application
│   │   ├── Login.tsx
│   │   ├── Dashboard.tsx
│   │   ├── Stock.tsx
│   │   └── ...
│   ├── store/           # Stores Zustand
│   │   ├── authStore.ts
│   │   └── appStore.ts
│   ├── lib/             # Utilitaires et services
│   │   ├── api.ts       # Configuration Axios
│   │   ├── db.ts        # IndexedDB (Dexie)
│   │   ├── syncService.ts
│   │   └── utils.ts
│   ├── App.tsx          # Composant principal
│   └── main.tsx         # Point d'entrée
├── public/              # Assets statiques
└── package.json
```

## 🎨 Design

- Design mobile-first responsive
- Composants shadcn/ui pour l'UI
- Thème clair/sombre (prêt)
- Indicateurs visuels pour l'état offline/online

## 📝 Notes

- L'application fonctionne entièrement offline après la première connexion
- Les données sont mises en cache automatiquement
- La synchronisation est automatique et transparente
- Compatible avec les navigateurs modernes supportant IndexedDB

## 🔐 Sécurité

- Tokens JWT stockés dans localStorage (avec Zustand persist)
- Intercepteurs Axios pour l'authentification automatique
- Gestion des erreurs 401 (déconnexion automatique)

## 📄 Licence

Propriétaire - Selos
