const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function runMigration() {
  try {
    console.log('🔄 Début de la migration Zone-Canal...\n');

    // Étape 1: Créer la table zone_canal
    console.log('📋 Étape 1: Création de la table zone_canal...');
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS \`zone_canal\` (
        \`zone_id\` INT NOT NULL,
        \`canal_id\` INT NOT NULL,
        PRIMARY KEY (\`zone_id\`, \`canal_id\`),
        INDEX \`fk_zone_canal_zone_idx\` (\`zone_id\`),
        INDEX \`fk_zone_canal_canal_idx\` (\`canal_id\`),
        CONSTRAINT \`fk_zone_canal_zone\`
          FOREIGN KEY (\`zone_id\`) REFERENCES \`zone\` (\`id\`)
          ON DELETE CASCADE
          ON UPDATE CASCADE,
        CONSTRAINT \`fk_zone_canal_canal\`
          FOREIGN KEY (\`canal_id\`) REFERENCES \`canal\` (\`id\`)
          ON DELETE CASCADE
          ON UPDATE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);
    console.log('✅ Table zone_canal créée\n');

    // Étape 2: Vérifier si la colonne canal_id existe
    console.log('📋 Étape 2: Vérification de la colonne canal_id...');
    const columns = await prisma.$queryRawUnsafe(`
      SELECT COLUMN_NAME 
      FROM information_schema.COLUMNS 
      WHERE TABLE_SCHEMA = DATABASE() 
        AND TABLE_NAME = 'zone' 
        AND COLUMN_NAME = 'canal_id';
    `);
    
    if (columns.length > 0) {
      // Étape 3: Migrer les données
      console.log('📋 Étape 3: Migration des données...');
      const result = await prisma.$executeRawUnsafe(`
        INSERT IGNORE INTO \`zone_canal\` (\`zone_id\`, \`canal_id\`)
        SELECT \`id\`, \`canal_id\`
        FROM \`zone\`
        WHERE \`canal_id\` IS NOT NULL;
      `);
      console.log('✅ Données migrées\n');

      // Vérification
      const check = await prisma.$queryRawUnsafe(`
        SELECT 
          (SELECT COUNT(*) FROM zone WHERE canal_id IS NOT NULL) as zones_avec_canal,
          (SELECT COUNT(*) FROM zone_canal) as relations_migrees;
      `);
      console.log('📊 Vérification:');
      console.log(`   Zones avec canal: ${check[0].zones_avec_canal}`);
      console.log(`   Relations migrées: ${check[0].relations_migrees}\n`);

      if (check[0].zones_avec_canal === check[0].relations_migrees) {
        console.log('✅ Migration des données réussie!\n');
        console.log('⚠️  Note: La colonne canal_id sera supprimée lors du prochain "prisma db push"\n');
      } else {
        console.log('⚠️  Attention: Les nombres ne correspondent pas. Vérifiez manuellement.\n');
      }
    } else {
      console.log('ℹ️  La colonne canal_id n\'existe plus. Migration des données ignorée.\n');
    }

    console.log('✅ Migration terminée avec succès!');
    console.log('\n📝 Prochaines étapes:');
    console.log('   1. Exécutez: npx prisma db push --accept-data-loss');
    console.log('   2. Redémarrez le serveur backend\n');

  } catch (error) {
    console.error('❌ Erreur lors de la migration:', error.message);
    if (error.message.includes('already exists')) {
      console.log('\nℹ️  La table zone_canal existe déjà. C\'est normal.');
      console.log('   Vous pouvez continuer avec: npx prisma db push --accept-data-loss\n');
    } else {
      throw error;
    }
  } finally {
    await prisma.$disconnect();
  }
}

runMigration();

