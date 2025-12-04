import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { PERMISSION_MODULES, toPermissionString } from '../src/permissions/permissions.registry';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting seed...');

  // Générer toutes les permissions disponibles
  const allPermissions: string[] = [];
  PERMISSION_MODULES.forEach(module => {
    module.capabilities.forEach(cap => {
      allPermissions.push(toPermissionString(module.key, cap));
    });
  });

  // Créer le rôle Admin avec toutes les permissions
  const adminRole = await prisma.role.upsert({
    where: { name: 'Admin' },
    update: {
      permissions: JSON.stringify(allPermissions),
    },
    create: { 
      name: 'Admin', 
      permissions: JSON.stringify(allPermissions),
    },
  });

  // Créer l'utilisateur admin avec le mot de passe 08545547
  const hashedPassword = await bcrypt.hash('08545547', 10);
  await prisma.user.upsert({
    where: { email: 'admin@selos.com' },
    update: {
      password: hashedPassword,
      roleId: adminRole.id,
      isActive: true,
    },
    create: {
      email: 'admin@selos.com',
      password: hashedPassword,
      firstName: 'Admin',
      lastName: 'User',
      roleId: adminRole.id,
      isActive: true,
    },
  });

  console.log('✅ Admin user created: admin@selos.com / 08545547');

  // Minimal domain data
  const gouv = await prisma.gouvernorat.upsert({
    where: { id: 1 },
    update: {},
    create: { id: 1, nom: 'Tunis' },
  });

  const del = await prisma.delegation.upsert({
    where: { id: 1 },
    update: {},
    create: { id: 1, nom: 'Ariana Ville', idGouvernorat: gouv.id },
  });

  await prisma.localite.upsert({
    where: { id: 1 },
    update: {},
    create: { id: 1, nom: 'La Marsa', idDelegation: del.id },
  });

  const canal = await prisma.canal.upsert({
    where: { id: 1 },
    update: {},
    create: { id: 1, nom: 'GMS' },
  });

  await prisma.typeVente.upsert({
    where: { id: 1 },
    update: {},
    create: { id: 1, nom: 'Détail' },
  });

  const secteur = await prisma.secteur.upsert({
    where: { id: 1 },
    update: {},
    create: { id: 1, nom: 'Secteur Nord' },
  });

  // Créer la relation Secteur-Canal
  await prisma.secteurCanal.upsert({
    where: {
      secteurId_canalId: {
        secteurId: secteur.id,
        canalId: canal.id,
      },
    },
    update: {},
    create: {
      secteurId: secteur.id,
      canalId: canal.id,
    },
  });

  console.log('✅ Minimal domain seed completed');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
