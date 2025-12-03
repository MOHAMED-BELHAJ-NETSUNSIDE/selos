import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting seed...');

  // Existing roles/users seeding retained
  const adminRole = await prisma.role.upsert({
    where: { name: 'Admin' },
    update: {},
    create: { name: 'Admin', permissions: JSON.stringify(['users:read']) },
  });

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

  await prisma.secteur.upsert({
    where: { id: 1 },
    update: {},
    create: { id: 1, nom: 'Secteur Nord', canalId: canal.id },
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
