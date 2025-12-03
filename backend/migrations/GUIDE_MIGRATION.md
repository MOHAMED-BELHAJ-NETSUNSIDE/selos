# 🔧 Guide de Migration Zone-Canal

## ⚠️ Erreur actuelle
```
The table `zone_canal` does not exist in the current database.
```

## ✅ Solution en 3 étapes

### Étape 1 : Exécuter la migration SQL (Étapes 1 et 2)

**Option A - Via MySQL CLI** :
```bash
mysql -h ab110337-001.eu.clouddb.ovh.net -P 35286 -u selos_db_user -pselos_db selos_db < backend/migrations/migrate_zone_canal_to_nm.sql
```

**Option B - Via client MySQL (phpMyAdmin, MySQL Workbench, DBeaver, etc.)** :
1. Ouvrir le fichier `backend/migrations/migrate_zone_canal_to_nm.sql`
2. Exécuter les **Étapes 1 et 2 uniquement** (jusqu'à la ligne 26)
3. Vérifier que les données sont migrées :
   ```sql
   SELECT COUNT(*) FROM zone WHERE canal_id IS NOT NULL;
   SELECT COUNT(*) FROM zone_canal;
   -- Les deux nombres doivent être identiques
   ```

### Étape 2 : Supprimer la colonne canal_id (Étape 3)

**IMPORTANT** : Exécutez manuellement l'étape 3 du fichier SQL ou utilisez `migrate_zone_canal_step3.sql` :

1. Trouver le nom de la contrainte :
   ```sql
   SELECT CONSTRAINT_NAME 
   FROM information_schema.KEY_COLUMN_USAGE 
   WHERE TABLE_SCHEMA = DATABASE() 
     AND TABLE_NAME = 'zone' 
     AND COLUMN_NAME = 'canal_id' 
     AND REFERENCED_TABLE_NAME IS NOT NULL;
   ```

2. Supprimer la contrainte (remplacer `NOM_CONSTRAINT` par le nom trouvé) :
   ```sql
   ALTER TABLE `zone` DROP FOREIGN KEY `NOM_CONSTRAINT`;
   ```

3. Supprimer la colonne :
   ```sql
   ALTER TABLE `zone` DROP COLUMN `canal_id`;
   ```

### Étape 2 : Arrêter le serveur backend
- Appuyez sur `Ctrl+C` dans le terminal où le backend tourne
- Ou fermez le terminal

### Étape 3 : Régénérer Prisma et redémarrer
```bash
cd backend
npx prisma generate
cd ..
npm run dev
```

## 🔍 Vérification

Pour vérifier que la migration a réussi, exécutez dans MySQL :
```sql
-- Vérifier que la table existe
SHOW TABLES LIKE 'zone_canal';

-- Vérifier les données
SELECT COUNT(*) FROM zone_canal;

-- Vérifier qu'une zone a bien ses canaux
SELECT z.id, z.nom, GROUP_CONCAT(c.nom) as canaux
FROM zone z
LEFT JOIN zone_canal zc ON z.id = zc.zone_id
LEFT JOIN canal c ON zc.canal_id = c.id
GROUP BY z.id, z.nom
LIMIT 5;
```

## 📝 Notes

- La migration crée la table `zone_canal`
- Migre toutes les données existantes de `zone.canal_id` vers `zone_canal`
- Supprime la colonne `canal_id` de la table `zone`
- **Aucune donnée n'est perdue** : toutes les relations existantes sont préservées

