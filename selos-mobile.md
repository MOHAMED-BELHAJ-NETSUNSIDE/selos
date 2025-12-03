Créer un nouveau projet frontend nommé **Selos Mobile**.

Important :
Créer un frontend complet avec React + Vite + TailwindCSS + shadcn/ui + Zustand, incluant un mode offline + synchronisation automatique.

## Stack technique
- React
- Vite
- TailwindCSS
- shadcn/ui
- Zustand (avec middleware persist)
- IndexedDB (idb ou Dexie) pour le stockage offline
- Axios pour les appels API
- React Router
- Structure PWA prête (optionnel)

## Objectif
Développer une application mobile-first pour les vendeurs terrain afin de :
1. Créer des BL (bons de livraison) en ligne ou hors ligne
2. Synchroniser automatiquement les BL en attente dès que la connexion revient
3. Consulter leur stock
4. Voir le tableau de bord et les activités récentes
5. Se connecter avec authentification vendeur
6. Utiliser les endpoints existants du backend Swagger


## Fonctionnalités requises

### 1. Authentification (en ligne ou cache)
- Page de login avec email/mot de passe ou code vendeur
- Si offline, autoriser la connexion si les identifiants ont été sauvegardés localement
- Stocker les informations vendeur dans Zustand avec persist

### 2. Création de BL (offline-first)
Workflow :
- Sélection du client (modal)
- Sélection des produits du stock vendeur (modal)
- Saisie des quantités
- Si online :
  - POST direct vers `/bl`
- Si offline :
  - Stocker le BL dans IndexedDB comme “pending” `{ synced: false }`
- Afficher : “BL créé (mode offline) – sera synchronisé plus tard”

### 3. Moteur de synchronisation
Créer `syncService.js` :
- Fonction `syncPendingBLs()` :
  - Vérifier la connectivité
  - Lire les BL en attente depuis IndexedDB
  - Envoyer chaque BL au backend
  - En cas de succès → marquer comme synchronisé + supprimer la copie locale
  - Mettre à jour Zustand (`lastSync`)
- Déclenchement :
  - Lors du retour en ligne
  - Bouton manuel “Synchroniser maintenant”
- Notifications toast via shadcn/ui :  
  - “Synchronisation terminée”

### 5. Tableau de bord
- Afficher les 5 derniers BL + alertes stock
- Si offline → charger le dashboard en cache
- Si online → fetch `/dashboard/vendor/:id` et mettre à jour cache

### 4. Page Stock (en ligne + cache)
- Si online → fetch `/stock/vendor/:id` et mettre à jour IndexedDB
- Si offline → charger depuis le cache
- Cartes mobile avec :
  - Nom produit
  - Qté disponible
  - Catégorie
  - Indicateurs couleur (vert/orange/rouge)### 6. Composants UI (shadcn/ui + Tailwind)
- Barre de navigation bottom (BL / Dashboard / Stock / Profile)
- Header
- ProductCard
- ClientSelectModal
- ProductSelectModal
- QuantityStepper
- SyncIndicator
- Toast notifications