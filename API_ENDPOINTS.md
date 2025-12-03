# Documentation API - Selos Backoffice

## Base URL
```
http://localhost:3001
```

## Authentification
Tous les endpoints (sauf `/auth/login`) nécessitent un token JWT dans le header `Authorization: Bearer <token>`.

---

## 🔐 Authentification

### POST /auth/login
**Description:** Connexion utilisateur

**Headers:**
```
Content-Type: application/json
```

**Body:**
```json
{
  "email": "admin@selos.com",
  "password": "admin123"
}
```

**Réponse (200):**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "clx1234567890",
    "email": "admin@selos.com",
    "firstName": "Admin",
    "lastName": "User",
    "role": {
      "id": "clx0987654321",
      "name": "Admin",
      "permissions": [
        "users:read",
        "users:write",
        "users:delete",
        "clients:read",
        "clients:write",
        "clients:delete",
        "roles:read",
        "roles:write",
        "roles:delete",
        "logs:read"
      ]
    }
  }
}
```

**Codes d'erreur:**
- `401` - Identifiants invalides

---

## 👥 Clients

### GET /clients
**Description:** Récupérer la liste des clients avec pagination et recherche

**Headers:**
```
Authorization: Bearer <token>
```

**Query Parameters:**
- `page` (number, optional): Numéro de page (défaut: 1)
- `limit` (number, optional): Nombre d'éléments par page (défaut: 10)
- `search` (string, optional): Terme de recherche
- `sortBy` (string, optional): Champ de tri (défaut: createdAt)
- `sortOrder` (string, optional): Ordre de tri (asc/desc, défaut: desc)

**Réponse (200):**
```json
{
  "data": [
    {
      "id": "clx1234567890",
      "firstName": "Jean",
      "lastName": "Dupont",
      "email": "jean.dupont@example.com",
      "phone": "+33123456789",
      "address": "123 Rue de la Paix, Paris",
      "createdAt": "2024-01-01T10:30:00.000Z",
      "updatedAt": "2024-01-01T10:30:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 1,
    "pages": 1
  }
}
```

**Permissions requises:** `clients:read`

### GET /clients/:id
**Description:** Récupérer un client par son ID

**Headers:**
```
Authorization: Bearer <token>
```

**Réponse (200):**
```json
{
  "id": "clx1234567890",
  "firstName": "Jean",
  "lastName": "Dupont",
  "email": "jean.dupont@example.com",
  "phone": "+33123456789",
  "address": "123 Rue de la Paix, Paris",
  "createdAt": "2024-01-01T10:30:00.000Z",
  "updatedAt": "2024-01-01T10:30:00.000Z"
}
```

**Codes d'erreur:**
- `404` - Client non trouvé

**Permissions requises:** `clients:read`

### POST /clients
**Description:** Créer un nouveau client

**Headers:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Body:**
```json
{
  "firstName": "Jean",
  "lastName": "Dupont",
  "email": "jean.dupont@example.com",
  "phone": "+33123456789",
  "address": "123 Rue de la Paix, Paris"
}
```

**Réponse (201):**
```json
{
  "id": "clx1234567890",
  "firstName": "Jean",
  "lastName": "Dupont",
  "email": "jean.dupont@example.com",
  "phone": "+33123456789",
  "address": "123 Rue de la Paix, Paris",
  "createdAt": "2024-01-01T10:30:00.000Z",
  "updatedAt": "2024-01-01T10:30:00.000Z"
}
```

**Permissions requises:** `clients:write`

### PATCH /clients/:id
**Description:** Modifier un client

**Headers:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Body:**
```json
{
  "firstName": "Jean-Pierre",
  "phone": "+33987654321"
}
```

**Réponse (200):**
```json
{
  "id": "clx1234567890",
  "firstName": "Jean-Pierre",
  "lastName": "Dupont",
  "email": "jean.dupont@example.com",
  "phone": "+33987654321",
  "address": "123 Rue de la Paix, Paris",
  "createdAt": "2024-01-01T10:30:00.000Z",
  "updatedAt": "2024-01-01T11:00:00.000Z"
}
```

**Permissions requises:** `clients:write`

### DELETE /clients/:id
**Description:** Supprimer un client

**Headers:**
```
Authorization: Bearer <token>
```

**Réponse (200):**
```json
{
  "message": "Client deleted successfully"
}
```

**Permissions requises:** `clients:delete`

---

## 👤 Utilisateurs

### GET /users
**Description:** Récupérer la liste des utilisateurs avec pagination et recherche

**Headers:**
```
Authorization: Bearer <token>
```

**Query Parameters:**
- `page` (number, optional): Numéro de page (défaut: 1)
- `limit` (number, optional): Nombre d'éléments par page (défaut: 10)
- `search` (string, optional): Terme de recherche
- `sortBy` (string, optional): Champ de tri (défaut: createdAt)
- `sortOrder` (string, optional): Ordre de tri (asc/desc, défaut: desc)

**Réponse (200):**
```json
{
  "data": [
    {
      "id": "clx1234567890",
      "email": "admin@selos.com",
      "firstName": "Admin",
      "lastName": "User",
      "isActive": true,
      "role": {
        "id": "clx0987654321",
        "name": "Admin",
        "permissions": ["users:read", "users:write", "users:delete", ...]
      },
      "createdAt": "2024-01-01T10:30:00.000Z",
      "updatedAt": "2024-01-01T10:30:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 1,
    "pages": 1
  }
}
```

**Permissions requises:** `users:read`

### GET /users/:id
**Description:** Récupérer un utilisateur par son ID

**Headers:**
```
Authorization: Bearer <token>
```

**Réponse (200):**
```json
{
  "id": "clx1234567890",
  "email": "admin@selos.com",
  "firstName": "Admin",
  "lastName": "User",
  "isActive": true,
  "role": {
    "id": "clx0987654321",
    "name": "Admin",
    "permissions": ["users:read", "users:write", "users:delete", ...]
  },
  "createdAt": "2024-01-01T10:30:00.000Z",
  "updatedAt": "2024-01-01T10:30:00.000Z"
}
```

**Permissions requises:** `users:read`

### POST /users
**Description:** Créer un nouvel utilisateur

**Headers:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Body:**
```json
{
  "email": "nouveau@selos.com",
  "password": "motdepasse123",
  "firstName": "Nouveau",
  "lastName": "Utilisateur",
  "roleId": "clx0987654321",
  "isActive": true
}
```

**Réponse (201):**
```json
{
  "id": "clx1234567890",
  "email": "nouveau@selos.com",
  "firstName": "Nouveau",
  "lastName": "Utilisateur",
  "isActive": true,
  "role": {
    "id": "clx0987654321",
    "name": "Admin",
    "permissions": ["users:read", "users:write", "users:delete", ...]
  },
  "createdAt": "2024-01-01T10:30:00.000Z",
  "updatedAt": "2024-01-01T10:30:00.000Z"
}
```

**Permissions requises:** `users:write`

### PATCH /users/:id
**Description:** Modifier un utilisateur

**Headers:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Body:**
```json
{
  "firstName": "Jean-Pierre",
  "isActive": false
}
```

**Réponse (200):**
```json
{
  "id": "clx1234567890",
  "email": "admin@selos.com",
  "firstName": "Jean-Pierre",
  "lastName": "User",
  "isActive": false,
  "role": {
    "id": "clx0987654321",
    "name": "Admin",
    "permissions": ["users:read", "users:write", "users:delete", ...]
  },
  "createdAt": "2024-01-01T10:30:00.000Z",
  "updatedAt": "2024-01-01T11:00:00.000Z"
}
```

**Permissions requises:** `users:write`

### PATCH /users/:id/toggle-active
**Description:** Activer/Désactiver un utilisateur

**Headers:**
```
Authorization: Bearer <token>
```

**Réponse (200):**
```json
{
  "id": "clx1234567890",
  "email": "admin@selos.com",
  "firstName": "Admin",
  "lastName": "User",
  "isActive": false,
  "role": {
    "id": "clx0987654321",
    "name": "Admin",
    "permissions": ["users:read", "users:write", "users:delete", ...]
  },
  "createdAt": "2024-01-01T10:30:00.000Z",
  "updatedAt": "2024-01-01T11:00:00.000Z"
}
```

**Permissions requises:** `users:write`

### DELETE /users/:id
**Description:** Supprimer un utilisateur

**Headers:**
```
Authorization: Bearer <token>
```

**Réponse (200):**
```json
{
  "message": "User deleted successfully"
}
```

**Permissions requises:** `users:delete`

---

## 🛡️ Rôles

### GET /roles
**Description:** Récupérer la liste des rôles

**Headers:**
```
Authorization: Bearer <token>
```

**Réponse (200):**
```json
[
  {
    "id": "clx0987654321",
    "name": "Admin",
    "permissions": [
      "users:read",
      "users:write",
      "users:delete",
      "clients:read",
      "clients:write",
      "clients:delete",
      "roles:read",
      "roles:write",
      "roles:delete",
      "logs:read"
    ],
    "createdAt": "2024-01-01T10:30:00.000Z",
    "updatedAt": "2024-01-01T10:30:00.000Z"
  }
]
```

**Permissions requises:** `roles:read`

### GET /roles/:id
**Description:** Récupérer un rôle par son ID

**Headers:**
```
Authorization: Bearer <token>
```

**Réponse (200):**
```json
{
  "id": "clx0987654321",
  "name": "Admin",
  "permissions": [
    "users:read",
    "users:write",
    "users:delete",
    "clients:read",
    "clients:write",
    "clients:delete",
    "roles:read",
    "roles:write",
    "roles:delete",
    "logs:read"
  ],
  "createdAt": "2024-01-01T10:30:00.000Z",
  "updatedAt": "2024-01-01T10:30:00.000Z"
}
```

**Permissions requises:** `roles:read`

### POST /roles
**Description:** Créer un nouveau rôle

**Headers:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Body:**
```json
{
  "name": "Superviseur",
  "permissions": [
    "clients:read",
    "clients:write",
    "users:read"
  ]
}
```

**Réponse (201):**
```json
{
  "id": "clx1234567890",
  "name": "Superviseur",
  "permissions": [
    "clients:read",
    "clients:write",
    "users:read"
  ],
  "createdAt": "2024-01-01T10:30:00.000Z",
  "updatedAt": "2024-01-01T10:30:00.000Z"
}
```

**Permissions requises:** `roles:write`

### PATCH /roles/:id
**Description:** Modifier un rôle

**Headers:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Body:**
```json
{
  "name": "Superviseur Senior",
  "permissions": [
    "clients:read",
    "clients:write",
    "clients:delete",
    "users:read"
  ]
}
```

**Réponse (200):**
```json
{
  "id": "clx1234567890",
  "name": "Superviseur Senior",
  "permissions": [
    "clients:read",
    "clients:write",
    "clients:delete",
    "users:read"
  ],
  "createdAt": "2024-01-01T10:30:00.000Z",
  "updatedAt": "2024-01-01T11:00:00.000Z"
}
```

**Permissions requises:** `roles:write`

### DELETE /roles/:id
**Description:** Supprimer un rôle

**Headers:**
```
Authorization: Bearer <token>
```

**Réponse (200):**
```json
{
  "message": "Role deleted successfully"
}
```

**Codes d'erreur:**
- `409` - Le rôle est assigné à des utilisateurs

**Permissions requises:** `roles:delete`

---

## 📋 Logs

### GET /logs
**Description:** Récupérer la liste des logs avec pagination et filtres

**Headers:**
```
Authorization: Bearer <token>
```

**Query Parameters:**
- `page` (number, optional): Numéro de page (défaut: 1)
- `limit` (number, optional): Nombre d'éléments par page (défaut: 10)
- `userId` (string, optional): Filtrer par utilisateur
- `module` (string, optional): Filtrer par module (clients, users, roles)
- `action` (string, optional): Filtrer par action (create, update, delete)

**Réponse (200):**
```json
{
  "data": [
    {
      "id": "clx1234567890",
      "userId": "clx0987654321",
      "module": "clients",
      "action": "create",
      "recordId": "clx1122334455",
      "description": "Client Jean Dupont créé",
      "oldData": null,
      "newData": {
        "id": "clx1122334455",
        "firstName": "Jean",
        "lastName": "Dupont",
        "email": "jean.dupont@example.com"
      },
      "createdAt": "2024-01-01T10:30:00.000Z",
      "user": {
        "id": "clx0987654321",
        "firstName": "Admin",
        "lastName": "User",
        "email": "admin@selos.com"
      }
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 1,
    "pages": 1
  }
}
```

**Permissions requises:** `logs:read`

---

## 🔒 Permissions

### Liste des permissions disponibles

- **users:read** - Consulter les utilisateurs
- **users:write** - Créer/modifier les utilisateurs
- **users:delete** - Supprimer les utilisateurs
- **clients:read** - Consulter les clients
- **clients:write** - Créer/modifier les clients
- **clients:delete** - Supprimer les clients
- **roles:read** - Consulter les rôles
- **roles:write** - Créer/modifier les rôles
- **roles:delete** - Supprimer les rôles
- **logs:read** - Consulter les logs

### Rôles prédéfinis

#### Admin
- Toutes les permissions

#### Manager
- `clients:read`, `clients:write`, `clients:delete`
- `users:read`

#### Vendeur
- `clients:read`

---

## 📊 Codes de statut HTTP

- **200** - Succès
- **201** - Créé avec succès
- **400** - Requête invalide
- **401** - Non autorisé
- **403** - Accès interdit
- **404** - Ressource non trouvée
- **409** - Conflit (ex: email déjà utilisé)
- **500** - Erreur serveur

---

## 🔧 Configuration

### Variables d'environnement

**Backend (.env):**
```env
DATABASE_URL="mysql://selos_db_user:selos_db@ab110337-001.eu.clouddb.ovh.net:35286/selos_db"
JWT_SECRET="Mohamed08545547@"
JWT_EXPIRES_IN="7d"
```

**Frontend (.env.local):**
```env
NEXTAUTH_SECRET="your-nextauth-secret"
NEXTAUTH_URL="http://localhost:3000"
NEXT_PUBLIC_API_URL="http://localhost:3001"
```

### Comptes de test

- **Admin:** admin@selos.com / admin123
- **Manager:** manager@selos.com / manager123
- **Vendeur:** vendeur@selos.com / vendeur123

---

## 📚 Documentation Swagger

La documentation interactive est disponible à l'adresse :
```
http://localhost:3001/api
```




