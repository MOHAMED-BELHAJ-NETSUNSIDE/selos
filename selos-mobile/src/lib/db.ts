import Dexie, { type Table } from 'dexie';

// Types pour IndexedDB
export interface PendingDeliveryNote {
  id?: number;
  localId: string; // ID local unique
  salespersonId: number;
  clientId: number;
  remarque?: string;
  lines: Array<{
    productId: number;
    qte: number;
    prixUnitaire: number;
  }>;
  synced: boolean;
  createdAt: Date;
  syncedAt?: Date;
}

export interface CachedStock {
  id?: number;
  productId: number;
  productName: string;
  quantity: number;
  category?: string;
  lastUpdated: Date;
}

export interface CachedClient {
  id?: number;
  clientId: number;
  code: string;
  nom: string;
  nomCommercial?: string;
  numeroTelephone?: string;
  adresse?: string;
  lastUpdated: Date;
}

export interface CachedDashboard {
  id?: number;
  salespersonId: number;
  data: any;
  lastUpdated: Date;
}

export interface CachedPrice {
  id?: number;
  productId: number;
  clientId: number;
  quantity: number; // Quantité de référence (généralement 1)
  prixUnitaire: number;
  lastUpdated: Date;
}

// Base de données IndexedDB
class SelosMobileDB extends Dexie {
  pendingDeliveryNotes!: Table<PendingDeliveryNote, number>;
  cachedStock!: Table<CachedStock, number>;
  cachedClients!: Table<CachedClient, number>;
  cachedDashboard!: Table<CachedDashboard, number>;
  cachedPrices!: Table<CachedPrice, number>;

  constructor() {
    super('SelosMobileDB');
    this.version(1).stores({
      pendingDeliveryNotes: '++id, localId, synced, createdAt',
      cachedStock: '++id, productId, lastUpdated',
      cachedClients: '++id, clientId, lastUpdated',
      cachedDashboard: '++id, salespersonId, lastUpdated',
    });
    // Ajouter la table cachedPrices dans une nouvelle version
    this.version(2).stores({
      pendingDeliveryNotes: '++id, localId, synced, createdAt',
      cachedStock: '++id, productId, lastUpdated',
      cachedClients: '++id, clientId, lastUpdated',
      cachedDashboard: '++id, salespersonId, lastUpdated',
      cachedPrices: '++id, productId, clientId, quantity, lastUpdated',
    });
  }
}

// Créer une instance de la base de données
let dbInstance: SelosMobileDB | null = null;

// Fonction pour obtenir ou créer l'instance de la base de données
export function getDB(): SelosMobileDB {
  if (!dbInstance) {
    dbInstance = new SelosMobileDB();
  }
  return dbInstance;
}

// Fonction utilitaire pour exécuter des opérations sur la base de données avec gestion d'erreur
export async function safeDBOperation<T>(
  operation: () => Promise<T>,
  fallback?: T
): Promise<T | undefined> {
  try {
    const db = getDB();
    // S'assurer que la base est ouverte
    if (!db.isOpen()) {
      await db.open();
    }
    return await operation();
  } catch (error: any) {
    console.warn('Erreur lors de l\'opération sur la base de données:', error);
    // Si la base est fermée, essayer de la rouvrir et réessayer
    if (error.name === 'DatabaseClosedError' || error.name === 'OpenFailedError') {
      try {
        const db = getDB();
        // Essayer de rouvrir la base sans la supprimer
        if (!db.isOpen()) {
          await db.open();
        }
        // Réessayer l'opération
        return await operation();
      } catch (retryError) {
        console.error('Impossible de rouvrir la base de données:', retryError);
        return fallback;
      }
    }
    return fallback;
  }
}

export const db = getDB();

// Initialiser la base de données au chargement
if (typeof window !== 'undefined') {
  db.open().catch((err) => {
    console.error('Erreur lors de l\'initialisation de la base de données:', err);
  });
}

