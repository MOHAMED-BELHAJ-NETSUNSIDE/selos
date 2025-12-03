# Migration Zone-Canal : Relation 1:N → N:M

## Problème
La table `zone_canal` n'existe pas encore dans la base de données. Il faut exécuter la migration SQL pour créer cette table et migrer les données existantes.

## Solution

### Option 1 : Via MySQL CLI (Recommandé)

1. **Se connecter à MySQL** :
```bash
mysql -h ab110337-001.eu.clouddb.ovh.net -P 35286 -u selos_db_user -p selos_db
# Entrer le mot de passe: selos_db
```

2. **Exécuter la migration** :
```sql
-- Copier-coller le contenu du fichier migrate_zone_canal_to_nm.sql
-- Ou exécuter directement :
source backend/migrations/migrate_zone_canal_to_nm.sql
```

### Option 2 : Via un client MySQL (phpMyAdmin, MySQL Workbench, etc.)

1. Ouvrir votre client MySQL
2. Se connecter à la base de données `selos_db`
3. Ouvrir le fichier `backend/migrations/migrate_zone_canal_to_nm.sql`
4. Exécuter toutes les commandes SQL

### Option 3 : Via Prisma Studio (si disponible)

1. Ouvrir Prisma Studio :
```bash
cd backend
npx prisma studio
```

2. Exécuter manuellement les requêtes SQL depuis l'interface

## Après la migration

Une fois la migration SQL exécutée, régénérer le client Prisma :

```bash
cd backend
npx prisma generate
```

Puis redémarrer le serveur backend.

## Vérification

Pour vérifier que la migration a réussi :

```sql
-- Vérifier que la table existe
SHOW TABLES LIKE 'zone_canal';

-- Vérifier les données migrées
SELECT * FROM zone_canal;

-- Vérifier que la colonne canal_id a été supprimée
DESCRIBE zone;
```

## En cas d'erreur

Si vous rencontrez une erreur lors de la migration :

1. **Erreur de clé étrangère** : Vérifiez que toutes les zones ont un `canal_id` valide avant la migration
2. **Table déjà existe** : La table `zone_canal` existe peut-être déjà. Vérifiez avec `SHOW TABLES`
3. **Colonne déjà supprimée** : Si `canal_id` n'existe plus, ignorez l'étape 3 de la migration

