const { PrismaClient } = require('@prisma/client');
require('dotenv').config();

const prisma = new PrismaClient();

async function main() {
  console.log('🔄 Début de la réinitialisation des délégations...\n');

  try {
    // Option 1: Supprimer toutes les délégations (ATTENTION: supprime aussi les localités liées)
    // const deleted = await prisma.delegation.deleteMany({});
    // console.log(`✅ ${deleted.count} délégation(s) supprimée(s)`);

    // Option 2: Réinitialiser les gouvernorats de toutes les délégations à null (si la colonne le permet)
    // Mais idGouvernorat est requis dans le schéma, donc on ne peut pas le mettre à null

    // Option 3: Mettre toutes les délégations au gouvernorat avec l'ID 1 (Tunis)
    const gouvernoratTunis = await prisma.gouvernorat.findFirst({
      where: { nom: 'Tunis' }
    });

    if (!gouvernoratTunis) {
      console.log('❌ Le gouvernorat de Tunis n\'existe pas');
      return;
    }

    console.log(`📝 Mise à jour de toutes les délégations vers le gouvernorat: ${gouvernoratTunis.nom} (ID: ${gouvernoratTunis.id})`);

    // Compter les délégations
    const count = await prisma.delegation.count();
    console.log(`📊 Nombre de délégations à mettre à jour: ${count}`);

    // Mettre à jour toutes les délégations
    const updated = await prisma.delegation.updateMany({
      data: {
        idGouvernorat: gouvernoratTunis.id
      }
    });

    console.log(`✅ ${updated.count} délégation(s) mise(s) à jour\n`);

    // Afficher toutes les délégations avec leur gouvernorat
    const delegations = await prisma.delegation.findMany({
      include: {
        gouvernorat: true
      },
      orderBy: {
        id: 'asc'
      }
    });

    console.log('📋 Liste des délégations après mise à jour:');
    delegations.forEach(d => {
      console.log(`   - ${d.nom} (ID: ${d.id}) → Gouvernorat: ${d.gouvernorat?.nom || 'Aucun'} (ID: ${d.idGouvernorat})`);
    });

    console.log(`\n✅ Réinitialisation terminée! Total: ${delegations.length} délégation(s).\n`);

  } catch (error) {
    console.error('❌ Erreur lors de la réinitialisation:', error);
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

