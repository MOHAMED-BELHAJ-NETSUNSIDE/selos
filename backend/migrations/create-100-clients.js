const { PrismaClient } = require('@prisma/client');
require('dotenv').config();

const prisma = new PrismaClient();

// Liste de noms de clients variés
const nomsClients = [
  'Carrefour', 'Monoprix', 'Magasin Général', 'Super U', 'Géant', 'Auchan',
  'Leclerc', 'Casino', 'Intermarché', 'Système U', 'E.Leclerc', 'Cora',
  'Hyper U', 'Super U', 'U Express', 'Simply Market', 'Atac', 'Match',
  'Leader Price', 'Lidl', 'Aldi', 'Netto', 'Colruyt', 'Delhaize',
  'Epicerie Centrale', 'Bazar Central', 'Grand Magasin', 'Supermarché Moderne',
  'Commerce Général', 'Boutique Premium', 'Magasin Express', 'Shop Express',
  'Market Place', 'Shopping Center', 'Mall Central', 'Retail Store',
  'Commerce Local', 'Boutique Traditionnelle', 'Épicerie Fine', 'Supermarché',
  'Hypermarket', 'Discount Store', 'Convenience Store', 'Department Store',
  'Grocery Store', 'Food Market', 'Retail Outlet', 'Shopping Mall',
  'Commercial Center', 'Retail Center', 'Shopping Plaza', 'Market Square',
  'Trading Post', 'Merchant Store', 'Retail Shop', 'Commercial Store',
  'Business Center', 'Trade Center', 'Market Hub', 'Shopping Hub',
  'Retail Hub', 'Commercial Hub', 'Trade Hub', 'Business Hub',
  'Market Center', 'Shopping Center', 'Retail Plaza', 'Commercial Plaza',
  'Trade Plaza', 'Business Plaza', 'Market Plaza', 'Shopping Plaza',
  'Retail Square', 'Commercial Square', 'Trade Square', 'Business Square',
  'Market Square', 'Shopping Square', 'Retail Point', 'Commercial Point',
  'Trade Point', 'Business Point', 'Market Point', 'Shopping Point',
  'Retail Spot', 'Commercial Spot', 'Trade Spot', 'Business Spot',
  'Market Spot', 'Shopping Spot', 'Retail Zone', 'Commercial Zone',
  'Trade Zone', 'Business Zone', 'Market Zone', 'Shopping Zone',
  'Retail Area', 'Commercial Area', 'Trade Area', 'Business Area',
  'Market Area', 'Shopping Area', 'Retail Space', 'Commercial Space',
  'Trade Space', 'Business Space', 'Market Space', 'Shopping Space'
];

// Liste de noms commerciaux
const nomsCommerciaux = [
  'Tunis Centre', 'La Marsa', 'Carthage', 'Le Bardo', 'Bab Bhar', 'Bab Souika',
  'El Menzah', 'El Omrane', 'La Goulette', 'Montfleury', 'Belvédère',
  'Sidi Bou Said', 'Ariana', 'Lac', 'Lafayette', 'Centre Ville', 'Nord',
  'Sud', 'Est', 'Ouest', 'Principal', 'Express', 'Premium', 'Plus',
  'Max', 'Pro', 'Elite', 'Gold', 'Silver', 'Bronze', 'Standard', 'Classic'
];

// Liste d'adresses
const adresses = [
  'Avenue Habib Bourguiba', 'Rue de la République', 'Avenue de France',
  'Rue de la Kasbah', 'Avenue Mohammed V', 'Rue de la Médina',
  'Avenue de Carthage', 'Rue de la Marsa', 'Avenue de la Liberté',
  'Rue du Bardo', 'Avenue de l\'Indépendance', 'Rue de la Victoire',
  'Avenue de la République', 'Rue de la Paix', 'Avenue de l\'Europe',
  'Rue de la Poste', 'Avenue de la Gare', 'Rue de la Mosquée',
  'Avenue de la Plage', 'Rue de la Corniche', 'Avenue de la Mer',
  'Rue de la Marina', 'Avenue de la Porte', 'Rue de la Place',
  'Avenue de la Tour', 'Rue de la Fontaine', 'Avenue de la Colline',
  'Rue de la Vallée', 'Avenue de la Montagne', 'Rue de la Forêt'
];

// Fonction pour générer un code unique
async function generateUniqueCode(startNumber = 1) {
  const clientsWithPrefix = await prisma.client.findMany({
    where: {
      code: {
        startsWith: 'CLT',
      },
    },
    select: {
      code: true,
    },
    orderBy: {
      code: 'desc',
    },
    take: 1,
  });

  let nextNumber = startNumber;

  if (clientsWithPrefix.length > 0 && clientsWithPrefix[0]) {
    const match = clientsWithPrefix[0].code.match(/^CLT(\d+)$/);
    if (match) {
      const lastNumber = parseInt(match[1], 10);
      nextNumber = lastNumber + 1;
    }
  }

  return `CLT${String(nextNumber).padStart(4, '0')}`;
}

// Fonction pour obtenir un élément aléatoire d'un tableau
function getRandomElement(array) {
  return array[Math.floor(Math.random() * array.length)];
}

// Fonction pour obtenir un élément aléatoire ou null (pour simuler des valeurs optionnelles)
function getRandomOrNull(array) {
  if (array.length === 0) return null;
  // 80% de chance d'avoir une valeur, 20% de null
  return Math.random() < 0.8 ? getRandomElement(array) : null;
}

// Fonction pour générer un numéro de téléphone tunisien
function generatePhoneNumber() {
  const prefixes = ['71', '72', '73', '74', '75', '76', '77', '78', '79'];
  const prefix = getRandomElement(prefixes);
  const number = Math.floor(100000 + Math.random() * 900000);
  return `+216 ${prefix} ${number}`;
}

// Fonction pour générer un registre de commerce
function generateRegistreCommerce() {
  const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const letter = getRandomElement(letters.split(''));
  const number = Math.floor(100000 + Math.random() * 900000);
  return `RC${letter}${number}`;
}

// Fonction pour générer des coordonnées GPS en Tunisie
function generateCoordinates() {
  // Coordonnées approximatives de la Tunisie
  const minLat = 30.0;
  const maxLat = 37.5;
  const minLng = 7.5;
  const maxLng = 11.6;
  
  return {
    latitude: (Math.random() * (maxLat - minLat) + minLat).toFixed(6),
    longitude: (Math.random() * (maxLng - minLng) + minLng).toFixed(6)
  };
}

async function main() {
  console.log('🚀 Début de la création de 100 clients...\n');

  try {
    // Récupérer toutes les données existantes
    console.log('📋 Récupération des données existantes...\n');
    
    const typeClients = await prisma.typeClient.findMany();
    const typeVentes = await prisma.typeVente.findMany();
    const canaux = await prisma.canal.findMany();
    const localites = await prisma.localite.findMany();

    console.log(`   - ${typeClients.length} type(s) client trouvé(s)`);
    console.log(`   - ${typeVentes.length} type(s) de vente trouvé(s)`);
    console.log(`   - ${canaux.length} canal/canaux trouvé(s)`);
    console.log(`   - ${localites.length} localité(s) trouvée(s)\n`);

    if (typeClients.length === 0) {
      console.log('⚠️  Aucun type client trouvé. Création de types clients par défaut...');
      await prisma.typeClient.createMany({
        data: [
          { nom: 'Gros' },
          { nom: 'Détaillant' },
          { nom: 'Grossiste' },
          { nom: 'Distributeur' }
        ],
        skipDuplicates: true
      });
      const updatedTypeClients = await prisma.typeClient.findMany();
      typeClients.push(...updatedTypeClients);
      console.log(`✅ ${updatedTypeClients.length} type(s) client créé(s)\n`);
    }

    if (typeVentes.length === 0) {
      console.log('⚠️  Aucun type de vente trouvé. Création de types de vente par défaut...');
      await prisma.typeVente.createMany({
        data: [
          { nom: 'Détail' },
          { nom: 'Gros' },
          { nom: 'Semi-gros' },
          { nom: 'Mixte' }
        ],
        skipDuplicates: true
      });
      const updatedTypeVentes = await prisma.typeVente.findMany();
      typeVentes.push(...updatedTypeVentes);
      console.log(`✅ ${updatedTypeVentes.length} type(s) de vente créé(s)\n`);
    }

    if (canaux.length === 0) {
      console.log('⚠️  Aucun canal trouvé. Création de canaux par défaut...');
      await prisma.canal.createMany({
        data: [
          { nom: 'GMS' },
          { nom: 'Traditionnel' },
          { nom: 'Grossiste' },
          { nom: 'E-commerce' }
        ],
        skipDuplicates: true
      });
      const updatedCanaux = await prisma.canal.findMany();
      canaux.push(...updatedCanaux);
      console.log(`✅ ${updatedCanaux.length} canal/canaux créé(s)\n`);
    }

    if (localites.length === 0) {
      console.log('⚠️  Aucune localité trouvée. Veuillez d\'abord exécuter la migration des localités.\n');
      return;
    }

    // Créer 100 clients
    console.log('📝 Création de 100 clients...\n');
    
    const clientsCreated = [];
    const clientsSkipped = [];
    const startCodeNumber = 1;

    for (let i = 0; i < 100; i++) {
      try {
        const code = await generateUniqueCode(startCodeNumber + i);
        
        // Vérifier si le code existe déjà
        const existing = await prisma.client.findUnique({
          where: { code }
        });

        if (existing) {
          console.log(`⏭️  Client déjà existant: ${code}`);
          clientsSkipped.push(code);
          continue;
        }

        // Sélectionner aléatoirement les valeurs avec distribution équilibrée
        const typeClient = getRandomOrNull(typeClients);
        const typeVente = getRandomOrNull(typeVentes);
        const canal = getRandomOrNull(canaux);
        const localite = getRandomOrNull(localites);

        // Générer un nom unique
        const nomBase = getRandomElement(nomsClients);
        const nomCommercial = Math.random() < 0.7 ? `${nomBase} ${getRandomElement(nomsCommerciaux)}` : nomBase;
        const nom = `${nomCommercial} ${i + 1}`;

        // Générer des données optionnelles
        const numeroTelephone = Math.random() < 0.8 ? generatePhoneNumber() : null;
        const adresse = Math.random() < 0.7 ? `${Math.floor(Math.random() * 200) + 1} ${getRandomElement(adresses)}` : null;
        const registreCommerce = Math.random() < 0.6 ? generateRegistreCommerce() : null;
        
        const coords = Math.random() < 0.5 ? generateCoordinates() : null;

        const clientData = {
          code,
          nom,
          nomCommercial: Math.random() < 0.6 ? nomCommercial : null,
          numeroTelephone,
          adresse,
          registreCommerce,
          typeClientId: typeClient ? typeClient.id : null,
          typeVenteId: typeVente ? typeVente.id : null,
          canalId: canal ? canal.id : null,
          localiteId: localite ? localite.id : null,
          longitude: coords ? parseFloat(coords.longitude) : null,
          latitude: coords ? parseFloat(coords.latitude) : null,
        };

        const client = await prisma.client.create({
          data: clientData,
          include: {
            typeClient: true,
            typeVente: true,
            canal: true,
            localite: true
          }
        });

        clientsCreated.push(client);
        
        if ((i + 1) % 10 === 0) {
          console.log(`   ✅ ${i + 1}/100 clients créés...`);
        }
      } catch (error) {
        console.error(`   ❌ Erreur lors de la création du client ${i + 1}:`, error.message);
      }
    }

    console.log('\n📊 Résumé:');
    console.log(`   - ${clientsCreated.length} client(s) créé(s) avec succès`);
    if (clientsSkipped.length > 0) {
      console.log(`   - ${clientsSkipped.length} client(s) déjà existant(s)`);
    }

    // Afficher quelques statistiques
    console.log('\n📈 Statistiques de distribution:');
    
    const stats = {
      avecTypeClient: clientsCreated.filter(c => c.typeClientId).length,
      avecTypeVente: clientsCreated.filter(c => c.typeVenteId).length,
      avecCanal: clientsCreated.filter(c => c.canalId).length,
      avecLocalite: clientsCreated.filter(c => c.localiteId).length,
    };

    console.log(`   - Clients avec type client: ${stats.avecTypeClient}/${clientsCreated.length}`);
    console.log(`   - Clients avec type de vente: ${stats.avecTypeVente}/${clientsCreated.length}`);
    console.log(`   - Clients avec canal: ${stats.avecCanal}/${clientsCreated.length}`);
    console.log(`   - Clients avec localité: ${stats.avecLocalite}/${clientsCreated.length}`);

    // Afficher la distribution par type client
    if (typeClients.length > 0) {
      console.log('\n📋 Distribution par type client:');
      for (const typeClient of typeClients) {
        const count = clientsCreated.filter(c => c.typeClientId === typeClient.id).length;
        console.log(`   - ${typeClient.nom}: ${count} client(s)`);
      }
    }

    // Afficher la distribution par type de vente
    if (typeVentes.length > 0) {
      console.log('\n📋 Distribution par type de vente:');
      for (const typeVente of typeVentes) {
        const count = clientsCreated.filter(c => c.typeVenteId === typeVente.id).length;
        console.log(`   - ${typeVente.nom}: ${count} client(s)`);
      }
    }

    // Afficher la distribution par canal
    if (canaux.length > 0) {
      console.log('\n📋 Distribution par canal:');
      for (const canal of canaux) {
        const count = clientsCreated.filter(c => c.canalId === canal.id).length;
        console.log(`   - ${canal.nom}: ${count} client(s)`);
      }
    }

    // Afficher la distribution par localité (top 10)
    if (localites.length > 0) {
      console.log('\n📋 Distribution par localité (top 10):');
      const localiteCounts = {};
      clientsCreated.forEach(c => {
        if (c.localiteId) {
          localiteCounts[c.localiteId] = (localiteCounts[c.localiteId] || 0) + 1;
        }
      });
      
      const sortedLocalites = Object.entries(localiteCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10);
      
      for (const [localiteId, count] of sortedLocalites) {
        const localite = localites.find(l => l.id === parseInt(localiteId));
        if (localite) {
          console.log(`   - ${localite.nom}: ${count} client(s)`);
        }
      }
    }

    console.log(`\n✅ Migration terminée avec succès! ${clientsCreated.length} client(s) créé(s).\n`);

  } catch (error) {
    console.error('❌ Erreur lors de la migration:', error);
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

