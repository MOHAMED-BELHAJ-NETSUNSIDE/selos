const { PrismaClient } = require('@prisma/client');
require('dotenv').config();

const prisma = new PrismaClient();

async function main() {
  console.log('🗑️  Début de la suppression des délégations...\n');

  try {
    // Afficher d'abord les délégations existantes
    const delegations = await prisma.delegation.findMany({
      include: {
        gouvernorat: true,
        localites: true
      },
      orderBy: {
        id: 'asc'
      }
    });

    console.log(`📊 Nombre de délégations trouvées: ${delegations.length}`);
    
    if (delegations.length > 0) {
      console.log('\n📋 Délégations qui seront supprimées:');
      delegations.forEach(d => {
        const localitesCount = d.localites?.length || 0;
        console.log(`   - ${d.nom} (ID: ${d.id}) - Gouvernorat: ${d.gouvernorat?.nom || 'Aucun'} - ${localitesCount} localité(s)`);
      });

      // Vérifier s'il y a des localités liées
      const totalLocalites = delegations.reduce((sum, d) => sum + (d.localites?.length || 0), 0);
      
      if (totalLocalites > 0) {
        console.log(`\n⚠️  ATTENTION: ${totalLocalites} localité(s) seront également supprimée(s) (cascade)`);
        console.log('   Les localités liées seront supprimées automatiquement.\n');
      }

      // Supprimer toutes les délégations (les localités seront supprimées en cascade)
      const deleted = await prisma.delegation.deleteMany({});
      console.log(`✅ ${deleted.count} délégation(s) supprimée(s)`);
      
      if (totalLocalites > 0) {
        console.log(`✅ ${totalLocalites} localité(s) supprimée(s) automatiquement (cascade)\n`);
      }
    } else {
      console.log('ℹ️  Aucune délégation à supprimer\n');
    }

    // Afficher l'état final
    const remainingDelegations = await prisma.delegation.count();
    const remainingLocalites = await prisma.localite.count();
    
    console.log('📊 État final:');
    console.log(`   - Délégations: ${remainingDelegations}`);
    console.log(`   - Localités: ${remainingLocalites}\n`);

    console.log('✅ Suppression terminée!\n');

  } catch (error) {
    console.error('❌ Erreur lors de la suppression:', error);
    throw error;
  }
}

main()
  .catch((e) => {
    console.error('❌ Erreur fatale:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

