# 📋 Workflow Complet - Système Selos

Ce document décrit tous les workflows et processus du système Selos Backoffice.

---

## 🔄 1. Workflow de Synchronisation Business Central

### 1.1 Synchronisation des Clients (BC → MySQL)

**Objectif :** Synchroniser les clients depuis Business Central vers la base de données MySQL locale.

**Étapes :**

1. **Authentification**
   - Vérifier que l'utilisateur est authentifié (session NextAuth)
   - Vérifier la présence du token d'accès Business Central

2. **Obtention du Token Business Central**
   - Appeler `getAccessToken()` pour obtenir un token OAuth2 valide
   - Le token est utilisé pour toutes les requêtes suivantes vers l'API BC

3. **Résolution de l'ID de l'entreprise**
   - Appeler `resolveCompanyId(token)` pour obtenir l'ID de l'entreprise BC
   - Cet ID est nécessaire pour toutes les requêtes API

4. **Récupération des clients depuis BC**
   - Utiliser `iterateCustomers(token, companyId)` pour récupérer tous les clients
   - La fonction gère automatiquement la pagination BC
   - Collecter tous les clients dans un tableau

5. **Synchronisation par lots vers le backend**
   - Diviser les clients en lots de 100 (BATCH_SIZE)
   - Pour chaque lot :
     - Envoyer une requête POST à `/api/bc-customers/sync`
     - Le backend effectue un `upsert` pour chaque client
     - Préserver les champs locaux (`localCanalId`, `localTypeVenteId`) lors de la mise à jour

6. **Traitement des résultats**
   - Compter le nombre total de clients synchronisés
   - Collecter les logs de chaque lot
   - Retourner un résumé avec le nombre total et les logs

**Endpoints utilisés :**
- Frontend : `POST /api/sync/customers`
- Backend : `POST /api/bc-customers/sync`

**Préservation des données locales :**
- Les champs `localCanalId` et `localTypeVenteId` sont préservés lors de la synchronisation
- Ces champs ne sont jamais écrasés par les données BC

---

### 1.2 Synchronisation des Items (BC → MySQL)

**Objectif :** Synchroniser les articles/produits depuis Business Central vers la base de données MySQL locale.

**Étapes :**

1. **Authentification** (identique à 1.1)

2. **Obtention du Token Business Central** (identique à 1.1)

3. **Résolution de l'ID de l'entreprise** (identique à 1.1)

4. **Récupération des items depuis BC**
   - Utiliser `iterateItems(token, companyId)` pour récupérer tous les items
   - La fonction gère automatiquement la pagination BC
   - Collecter tous les items dans un tableau

5. **Synchronisation par lots vers le backend**
   - Diviser les items en lots de 100 (BATCH_SIZE)
   - Pour chaque lot :
     - Envoyer une requête POST à `/api/bc-items/sync`
     - Le backend effectue un `upsert` pour chaque item
     - Normaliser les valeurs `blocked` (true/false/null)

6. **Traitement des résultats**
   - Compter le nombre total d'items synchronisés
   - Collecter les logs de chaque lot
   - Retourner un résumé avec le nombre total et les logs

**Endpoints utilisés :**
- Frontend : `POST /api/sync/items`
- Backend : `POST /api/bc-items/sync`

---

## 👥 2. Workflow de Gestion des Clients

### 2.1 Consultation des Clients

**Étapes :**

1. **Chargement initial**
   - Appeler `GET /api/bc-customers` avec les paramètres de pagination
   - Afficher les clients dans une DataTable Shadcn/UI

2. **Recherche et filtrage**
   - Recherche globale via le champ de recherche
   - Filtres avancés par colonne :
     - Code (number)
     - Nom (displayName)
     - Email
     - Téléphone (phoneNumber)
     - Ville (addressCity)
     - Statut (blocked: true/false)
   - Les filtres sont appliqués côté client après récupération

3. **Pagination**
   - Pagination côté client (10 éléments par page)
   - Navigation avec boutons Précédent/Suivant

4. **Consultation des détails**
   - Clic sur "Consulter" dans le menu d'actions (⋮)
   - Ouverture d'un Drawer (panneau latéral) avec 3 onglets :
     - **Informations** : Données générales, contact, financières, système
     - **Adresse** : Détails complets de l'adresse
     - **Informations locales** : Champs personnalisés Selos (canal, type de vente)

**Permissions requises :** `bc-customers:read`

---

### 2.2 Modification des Champs Locaux

**Étapes :**

1. **Accès aux champs locaux**
   - Ouvrir le Drawer de consultation d'un client
   - Aller dans l'onglet "Informations locales"

2. **Modification du canal local**
   - Sélectionner un canal dans le Select
   - La modification est envoyée immédiatement via `PATCH /api/bc-customers/:id/local-fields`
   - Le backend met à jour uniquement le champ `localCanalId`

3. **Modification du type de vente local**
   - Sélectionner un type de vente dans le Select
   - La modification est envoyée immédiatement via `PATCH /api/bc-customers/:id/local-fields`
   - Le backend met à jour uniquement le champ `localTypeVenteId`

4. **Feedback utilisateur**
   - Affichage d'un toast de succès/erreur
   - Mise à jour automatique de l'affichage

**Permissions requises :** `bc-customers:write`

**Important :** Ces champs ne sont jamais écrasés lors de la synchronisation BC.

---

## 🛒 3. Workflow de Circuit Commercial

### 3.1 Configuration d'un Circuit Commercial par Secteur

**Objectif :** Configurer les zones, fréquences et groupes de visite pour un secteur donné.

**Étapes :**

1. **Sélection du secteur**
   - Accéder à la page de gestion des circuits commerciaux
   - Sélectionner un secteur depuis la liste

2. **Récupération du circuit existant**
   - Appel à `GET /api/circuit-commercial/secteur/:secteurId`
   - Si le circuit n'existe pas, il est créé automatiquement
   - Retourne le circuit avec ses zones associées

3. **Validation des contraintes**
   - Toutes les zones doivent avoir le même canal que le secteur
   - Si une zone a un canal différent, une erreur est retournée

4. **Configuration des zones**
   - Pour chaque zone à ajouter :
     - Sélectionner la zone
     - Définir le jour de visite (ex: "lundi", "mardi")
     - Définir la fréquence :
       - **"semaine"** : Visite chaque semaine
       - **"quinzaine"** : Visite toutes les 2 semaines
         - Groupes requis : "1,3" ou "2,4"
       - **"mois"** : Visite mensuelle
         - Groupe requis : "1", "2", "3" ou "4"

5. **Envoi de la configuration**
   - Appel à `PATCH /api/circuit-commercial/secteur/:secteurId`
   - Le backend :
     - Valide toutes les zones (canal, fréquences, groupes)
     - Supprime toutes les zones existantes
     - Crée les nouvelles zones configurées

6. **Affichage du résultat**
   - Retour du circuit mis à jour avec toutes les zones
   - Affichage dans l'interface avec les détails de chaque zone

**Règles de validation :**

- **Fréquence "quinzaine"** :
  - Groupes doivent être exactement "1,3" ou "2,4"
  - Format : chaîne séparée par virgule

- **Fréquence "mois"** :
  - Groupe doit être exactement "1", "2", "3" ou "4"
  - Format : chaîne simple

- **Canal des zones** :
  - Toutes les zones doivent avoir le même canal que le secteur parent
  - Sinon, erreur : `La zone "X" a un canal différent du secteur`

**Permissions requises :** `circuit-commercial:write`

---

## 🔐 4. Workflow d'Authentification

### 4.1 Connexion Utilisateur

**Étapes :**

1. **Saisie des identifiants**
   - Email et mot de passe dans le formulaire de connexion

2. **Vérification côté backend**
   - Appel à `POST /api/auth/login`
   - Vérification de l'email et du mot de passe (hash bcrypt)
   - Vérification que l'utilisateur est actif (`isActive = true`)

3. **Génération du token JWT**
   - Création d'un token JWT avec :
     - ID utilisateur
     - Email
     - Rôle et permissions
   - Expiration configurable (défaut : 7 jours)

4. **Stockage de la session**
   - Stockage côté frontend via NextAuth
   - Token stocké dans la session utilisateur

5. **Redirection**
   - Redirection vers le dashboard ou la page demandée

**Permissions :** Aucune (endpoint public)

---

### 4.2 Vérification des Permissions

**Étapes :**

1. **Requête API**
   - Chaque requête API inclut le token JWT dans le header `Authorization: Bearer <token>`

2. **Validation du token**
   - Le guard JWT valide le token
   - Extraction des informations utilisateur

3. **Vérification du statut utilisateur**
   - Vérification que l'utilisateur est toujours actif
   - Si désactivé, le token est rejeté (même s'il n'est pas expiré)

4. **Vérification des permissions**
   - Le guard de permissions vérifie que l'utilisateur a la permission requise
   - Format : `{module}:{action}` (ex: `clients:read`, `users:write`)

5. **Exécution de la requête**
   - Si toutes les vérifications passent, la requête est exécutée
   - Sinon, retour d'une erreur 401 (non autorisé) ou 403 (interdit)

---

### 4.3 Expiration des Sessions lors de la Désactivation

**Étapes :**

1. **Désactivation d'un utilisateur**
   - Un admin désactive un utilisateur via `PATCH /api/users/:id` avec `isActive: false`

2. **Invalidation immédiate**
   - Le système invalide tous les tokens JWT de cet utilisateur
   - Mise en blacklist des tokens existants

3. **Rejet des requêtes suivantes**
   - Toute requête avec un token de cet utilisateur est rejetée
   - Retour d'une erreur 401 (non autorisé)

4. **Déconnexion forcée**
   - L'utilisateur est automatiquement déconnecté de toutes ses sessions
   - Redirection vers la page de connexion

---

## 📝 5. Workflow de Journalisation (Logs)

### 5.1 Création Automatique de Logs

**Objectif :** Enregistrer toutes les actions CRUD de manière asynchrone.

**Étapes :**

1. **Déclenchement d'une action**
   - Un utilisateur effectue une action CRUD (create, update, delete)

2. **Émission d'un événement**
   - Le service émet un événement via EventEmitter de NestJS
   - L'événement contient :
     - `userId` : ID de l'utilisateur
     - `module` : Module concerné (ex: "clients", "users")
     - `action` : Action effectuée ("create", "update", "delete")
     - `recordId` : ID de l'enregistrement
     - `oldData` : Anciennes données (pour update/delete)
     - `newData` : Nouvelles données (pour create/update)
     - `description` : Description textuelle

3. **Traitement asynchrone**
   - Le listener de logs traite l'événement de manière asynchrone
   - La réponse API n'est pas bloquée par l'écriture du log

4. **Enregistrement en base**
   - Création d'un enregistrement dans la table `logs`
   - Stockage de toutes les informations de l'événement

**Avantages :**
- Performance : Les logs n'impactent pas le temps de réponse API
- Fiabilité : Tous les logs sont enregistrés même en cas d'erreur
- Traçabilité : Historique complet de toutes les actions

---

### 5.2 Consultation des Logs

**Étapes :**

1. **Accès à la page des logs**
   - Navigation vers la page `/logs`
   - Vérification de la permission `logs:read`

2. **Filtrage**
   - Filtres disponibles :
     - Par utilisateur (`userId`)
     - Par module (`module`)
     - Par action (`action`)
     - Par date (date de création)

3. **Pagination**
   - Affichage paginé des logs (10 par page par défaut)
   - Tri par date (plus récent en premier)

4. **Affichage des détails**
   - Pour chaque log :
     - Utilisateur qui a effectué l'action
     - Module et action
     - Description
     - Anciennes et nouvelles données (format JSON)
     - Date et heure

**Permissions requises :** `logs:read`

---

## 🎯 6. Workflow de Gestion des Utilisateurs

### 6.1 Création d'un Utilisateur

**Étapes :**

1. **Accès au formulaire**
   - Clic sur "Ajouter" dans la page des utilisateurs
   - Ouverture d'une modale avec le formulaire

2. **Saisie des informations**
   - Email (unique, validé)
   - Mot de passe (hashé avec bcrypt)
   - Prénom et nom
   - Rôle (sélection depuis la liste des rôles)
   - Statut actif (par défaut : true)

3. **Validation**
   - Validation côté client (React Hook Form + Zod)
   - Validation côté serveur (class-validator)

4. **Création**
   - Appel à `POST /api/users`
   - Le backend :
     - Vérifie l'unicité de l'email
     - Hash le mot de passe
     - Crée l'utilisateur avec le rôle assigné
     - Génère un log automatique

5. **Feedback**
   - Toast de succès
   - Fermeture de la modale
   - Rafraîchissement de la liste

**Permissions requises :** `users:write`

---

### 6.2 Modification d'un Utilisateur

**Étapes :**

1. **Accès au formulaire**
   - Clic sur "Modifier" dans le menu d'actions (⋮)
   - Ouverture d'une modale pré-remplie

2. **Modification des champs**
   - Modification des champs souhaités
   - Le mot de passe est optionnel (non modifié si vide)

3. **Validation et envoi**
   - Validation côté client et serveur
   - Appel à `PATCH /api/users/:id`
   - Le backend :
     - Met à jour les champs modifiés
     - Génère un log avec oldData et newData

4. **Feedback**
   - Toast de succès
   - Fermeture de la modale
   - Rafraîchissement de la liste

**Permissions requises :** `users:write`

---

### 6.3 Désactivation d'un Utilisateur

**Étapes :**

1. **Action de désactivation**
   - Clic sur "Désactiver" ou toggle du statut actif
   - Appel à `PATCH /api/users/:id/toggle-active`

2. **Traitement backend**
   - Mise à jour de `isActive` à `false`
   - Invalidation de tous les tokens JWT de l'utilisateur
   - Génération d'un log

3. **Déconnexion forcée**
   - Toutes les sessions de l'utilisateur sont invalidées
   - L'utilisateur est déconnecté immédiatement

4. **Feedback**
   - Toast de succès
   - Mise à jour de l'affichage

**Permissions requises :** `users:write`

---

## 🗑️ 7. Workflow de Suppression

### 7.1 Suppression d'une Entité

**Étapes :**

1. **Confirmation**
   - Clic sur "Supprimer" dans le menu d'actions (⋮)
   - Affichage d'une boîte de dialogue de confirmation
   - Le texte "Supprimer" est en rouge pour signaler une action destructive

2. **Vérification des dépendances**
   - Le backend vérifie s'il existe des dépendances
   - Exemple : Un rôle ne peut pas être supprimé s'il est assigné à des utilisateurs

3. **Suppression**
   - Si aucune dépendance, appel à `DELETE /api/{module}/:id`
   - Le backend :
     - Supprime l'enregistrement
     - Génère un log avec oldData et newData = null

4. **Feedback**
   - Toast de succès
   - Rafraîchissement automatique de la liste

**Permissions requises :** `{module}:delete`

**Codes d'erreur possibles :**
- `409` : Conflit (dépendances existantes)
- `404` : Entité non trouvée

---

## 📊 8. Workflow de Data Table (Interface Standard)

### 8.1 Affichage des Données

**Composants standardisés :**

1. **Barre de recherche**
   - Recherche globale sur tous les champs
   - Filtrage côté serveur ou client selon le module

2. **Bouton "Ajouter"**
   - En haut à droite de la table
   - Ouvre une modale de création

3. **Table avec colonnes**
   - Colonnes configurables selon le module
   - Tri par colonne (si supporté)

4. **Menu d'actions (⋮)**
   - Dans chaque ligne
   - Options :
     - **Consulter** (icône Eye)
     - **Modifier** (icône Edit)
     - **Supprimer** (icône Trash, texte rouge)

5. **Pagination**
   - En bas de la table
   - Boutons Précédent/Suivant
   - Affichage du nombre total de résultats

---

### 8.2 Workflow d'Ajout/Modification dans Modale

**Étapes communes :**

1. **Ouverture de la modale**
   - Clic sur "Ajouter" ou "Modifier"
   - Ouverture d'une modale Shadcn/UI

2. **Formulaire**
   - React Hook Form pour la gestion du formulaire
   - Validation Zod pour la validation
   - Champs dynamiques selon le module

3. **Soumission**
   - Validation côté client
   - Envoi via React Query mutation
   - Validation côté serveur (class-validator)

4. **Traitement**
   - Le backend traite la requête
   - Génération d'un log automatique

5. **Feedback et fermeture**
   - Toast de succès/erreur
   - Fermeture automatique de la modale
   - Rafraîchissement de la DataTable via React Query

---

## 🔔 9. Workflow de Notifications

### 9.1 Affichage des Toasts

**Système de notifications global :**

1. **Provider Sonner**
   - Provider global dans l'application
   - Accessible depuis n'importe quel composant

2. **Types de notifications**
   - **Succès** (vert) : Action réussie
   - **Erreur** (rouge) : Erreur lors de l'action
   - **Avertissement** (jaune) : Avertissement

3. **Déclenchement**
   - Après chaque action CRUD
   - Messages clairs et explicites
   - Exemples :
     - "Client ajouté avec succès"
     - "Modification enregistrée"
     - "Client supprimé"
     - "Erreur lors de la suppression"

4. **Durée d'affichage**
   - 3 à 5 secondes
   - Disparition automatique
   - Possibilité de fermeture manuelle

5. **Position**
   - En haut à droite de l'écran
   - Non bloquant pour l'utilisateur

---

## 🔄 10. Workflow de Rafraîchissement des Données

### 10.1 Mise à Jour Automatique

**Utilisation de React Query :**

1. **Cache automatique**
   - React Query gère le cache des données
   - Invalidation automatique après mutations

2. **Rafraîchissement après action**
   - Après création : `queryClient.invalidateQueries(['{module}'])`
   - Après modification : `queryClient.invalidateQueries(['{module}'])`
   - Après suppression : `queryClient.invalidateQueries(['{module}'])`

3. **Mise à jour optimiste**
   - Mise à jour immédiate de l'UI
   - Synchronisation en arrière-plan

4. **Gestion des erreurs**
   - Rollback automatique en cas d'erreur
   - Affichage d'un toast d'erreur

---

## 📋 Résumé des Workflows par Module

| Module | Création | Modification | Suppression | Consultation | Permissions |
|--------|----------|--------------|-------------|--------------|-------------|
| **Utilisateurs** | Modale + Formulaire | Modale + Formulaire | Confirmation | DataTable | `users:*` |
| **Clients** | Modale + Formulaire | Modale + Formulaire | Confirmation | DataTable | `clients:*` |
| **Rôles** | Modale + Formulaire | Modale + Formulaire | Confirmation | DataTable | `roles:*` |
| **BC Customers** | Sync BC | Champs locaux uniquement | N/A | DataTable + Drawer | `bc-customers:*` |
| **BC Items** | Sync BC | N/A | N/A | DataTable | `bc-items:*` |
| **Circuit Commercial** | Auto-création | Formulaire | N/A | Page dédiée | `circuit-commercial:*` |
| **Logs** | Auto (EventEmitter) | N/A | N/A | DataTable | `logs:read` |

---

## 🎯 Points Clés à Retenir

1. **Synchronisation BC** : Toujours préserver les champs locaux (`localCanalId`, `localTypeVenteId`)

2. **Permissions** : Toutes les actions nécessitent les permissions appropriées

3. **Logs** : Toutes les actions CRUD génèrent automatiquement des logs

4. **Validation** : Double validation (client + serveur) pour tous les formulaires

5. **Feedback** : Toast systématique après chaque action

6. **Sessions** : Invalidation immédiate lors de la désactivation d'un utilisateur

7. **DataTable** : Interface standardisée pour tous les modules

8. **Modales** : Utilisation systématique de modales Shadcn/UI pour les formulaires

---

**Dernière mise à jour :** 2024

