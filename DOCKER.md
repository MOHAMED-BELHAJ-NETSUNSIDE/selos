# Guide Docker - Selos

## Prérequis

- Docker 20.10+
- Docker Compose 2.0+

## Démarrage rapide

1. **Cloner le projet**
   ```bash
   git clone https://github.com/MOHAMED-BELHAJ-NETSUNSIDE/selos.git
   cd selos
   ```

2. **Configurer les variables d'environnement**
   ```bash
   cp .env.example .env
   # Éditer .env avec vos valeurs
   ```

3. **Lancer les services**
   ```bash
   docker-compose up -d
   ```

4. **Initialiser la base de données (première fois)**
   ```bash
   docker-compose exec backend npx prisma migrate deploy
   docker-compose exec backend npx prisma db seed
   ```

## Services disponibles

Une fois déployé, les services sont accessibles via l'IP publique **54.37.230.48** :

- **Frontend Backoffice**: http://54.37.230.48:3000
- **Frontend Retails**: http://54.37.230.48:3002
- **Selos Mobile**: http://54.37.230.48:3003
- **Backend API**: http://54.37.230.48:3001
- **Swagger Documentation**: http://54.37.230.48:3001/api
- **MySQL**: localhost:3306 (interne au serveur)

## Commandes utiles

```bash
# Voir les logs
docker-compose logs -f

# Voir les logs d'un service spécifique
docker-compose logs -f backend

# Arrêter les services
docker-compose down

# Arrêter et supprimer les volumes (attention: supprime les données)
docker-compose down -v

# Reconstruire les images
docker-compose build --no-cache

# Reconstruire un service spécifique
docker-compose build --no-cache backend

# Redémarrer un service
docker-compose restart backend

# Accéder au shell du backend
docker-compose exec backend sh

# Exécuter une commande Prisma
docker-compose exec backend npx prisma studio

# Voir les volumes
docker volume ls

# Voir les containers en cours d'exécution
docker-compose ps
```

## Structure des services

### MySQL
- Port: 3306 (configurable via `MYSQL_PORT`)
- Volume persistant: `mysql_data`
- Initialisation automatique via `selos.sql` si présent

### Backend
- Port: 3001 (configurable via `BACKEND_PORT`)
- Exécute automatiquement les migrations Prisma au démarrage
- Génère le client Prisma automatiquement

### Frontend
- Port: 3000 (configurable via `FRONTEND_PORT`)
- Build optimisé avec `standalone` output

### Frontend Retails
- Port: 3002 (configurable via `FRONTEND_RETAILS_PORT`)
- Build optimisé avec `standalone` output

### Selos Mobile
- Port: 3003 (configurable via `MOBILE_PORT`)
- Application web PWA servie via Nginx
- Accessible depuis les appareils mobiles via l'IP publique

## Production

Pour la production, modifiez les variables d'environnement dans `.env` :

- **Changez tous les secrets** (JWT_SECRET, NEXTAUTH_SECRET, MYSQL_ROOT_PASSWORD)
- **Configurez les URLs correctes** (NEXTAUTH_URL, NEXT_PUBLIC_API_URL)
- **Utilisez un reverse proxy** (nginx) pour HTTPS
- **Configurez les volumes** pour la persistance des données
- **Utilisez des secrets Docker** pour les informations sensibles

### Exemple de configuration nginx

```nginx
server {
    listen 80;
    server_name votre-domaine.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    location /api {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
    }
}
```

## Troubleshooting

### Le backend ne peut pas se connecter à MySQL
1. Vérifiez que le service MySQL est démarré : `docker-compose ps`
2. Vérifiez les logs MySQL : `docker-compose logs mysql`
3. Vérifiez que `DATABASE_URL` dans `.env` correspond aux credentials MySQL

### Les migrations échouent
1. Vérifiez que la base de données est accessible
2. Vérifiez les credentials dans `.env`
3. Vérifiez les logs : `docker-compose logs backend`

### Les frontends ne peuvent pas accéder au backend
1. Vérifiez que `NEXT_PUBLIC_API_URL` pointe vers le bon endpoint
2. Vérifiez que le backend est démarré : `docker-compose ps`
3. Vérifiez les logs du frontend : `docker-compose logs frontend`

### Erreur "standalone" dans Next.js
Assurez-vous que `output: 'standalone'` est présent dans `next.config.ts`

### Port déjà utilisé
Changez le port dans `.env` ou arrêtez le service qui utilise le port

## Développement avec Docker

Pour le développement, vous pouvez monter les volumes pour le hot-reload :

```yaml
# Dans docker-compose.yml, ajoutez pour le backend:
volumes:
  - ./backend/src:/app/src
  - ./backend/prisma:/app/prisma
```

Puis utilisez `npm run start:dev` au lieu de `start:prod`.

## Backup de la base de données

```bash
# Exporter la base de données
docker-compose exec mysql mysqldump -u selos_user -pselos_password selos_db > backup.sql

# Importer la base de données
docker-compose exec -T mysql mysql -u selos_user -pselos_password selos_db < backup.sql
```

