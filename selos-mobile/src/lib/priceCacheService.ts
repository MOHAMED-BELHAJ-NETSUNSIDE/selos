import { api, isOnline } from './api';
import { db, safeDBOperation } from './db';
import { toast } from 'sonner';

/**
 * Fonction utilitaire pour attendre un délai
 */
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Télécharge et met en cache tous les prix pour tous les produits et tous les clients
 * @param salespersonId ID du vendeur
 * @param onProgress Callback pour suivre la progression (optionnel)
 */
export async function downloadAllPrices(
  salespersonId: number,
  onProgress?: (current: number, total: number) => void
): Promise<void> {
  if (!isOnline()) {
    throw new Error('Impossible de télécharger les prix en mode hors ligne');
  }

  try {
    console.log('Début du téléchargement des prix...');
    
    // Récupérer tous les produits du stock (avec pagination)
    const products: { id: number }[] = [];
    let stockPage = 1;
    let totalStock = 0;
    
    do {
      const stockResponse = await api.get('/stock/consultation', {
        params: {
          salespersonId,
          limit: 100,
          page: stockPage,
        },
      });
      const stockItems = stockResponse.data.data || [];
      const pageProducts = stockItems
        .map((item: any) => ({
          id: item.product?.id || item.productId,
        }))
        .filter((p: any) => p.id);
      
      products.push(...pageProducts);
      totalStock = stockResponse.data.total || 0;
      stockPage++;
    } while (products.length < totalStock);

    console.log(`Produits trouvés: ${products.length}`);

    // Récupérer tous les clients (avec pagination)
    const clients: { id: number }[] = [];
    let clientsPage = 1;
    let totalClients = 0;
    
    do {
      const clientsResponse = await api.get('/clients', {
        params: { limit: 100, page: clientsPage },
      });
      const pageClients = (clientsResponse.data.data || []).filter(
        (client: any) => client && client.id
      );
      
      clients.push(...pageClients);
      totalClients = clientsResponse.data.pagination?.total || clientsResponse.data.total || 0;
      clientsPage++;
    } while (clients.length < totalClients);

    console.log(`Clients trouvés: ${clients.length}`);

    if (products.length === 0 || clients.length === 0) {
      console.warn('Aucun produit ou client trouvé');
      toast.warning('Aucun produit ou client trouvé pour télécharger les prix');
      return;
    }

    const total = products.length * clients.length;
    let current = 0;
    let errors = 0;

    console.log(`Début du téléchargement de ${total} prix...`);

    // Télécharger les prix pour chaque combinaison produit/client avec délai
    for (const product of products) {
      for (const client of clients) {
        try {
          // Récupérer le prix avec quantité = 1
          const priceResponse = await api.post('/delivery-notes/calculate-price', {
            productId: product.id,
            clientId: client.id,
            quantity: 1,
          });

          const prixUnitaire = priceResponse.data.prixUnitaire || 0;

          if (prixUnitaire > 0) {
            // Mettre en cache
            await safeDBOperation(async () => {
              await db.cachedPrices.put({
                productId: product.id,
                clientId: client.id,
                quantity: 1,
                prixUnitaire,
                lastUpdated: new Date(),
              });
            });
          }

          current++;
          if (onProgress) {
            onProgress(current, total);
          }

          // Ajouter un petit délai pour éviter la surcharge du serveur (50ms entre chaque requête)
          if (current < total) {
            await delay(50);
          }
        } catch (error: any) {
          errors++;
          console.warn(
            `Erreur lors de la récupération du prix pour produit ${product.id} et client ${client.id}:`,
            error.response?.status || error.message
          );
          // Continuer avec les autres prix même en cas d'erreur
          
          // Si trop d'erreurs consécutives, arrêter
          if (errors > 100) {
            console.error('Trop d\'erreurs, arrêt du téléchargement');
            throw new Error('Trop d\'erreurs lors du téléchargement des prix');
          }
        }
      }
    }

    console.log(`Téléchargement terminé: ${current}/${total} prix téléchargés, ${errors} erreurs`);
    toast.success(`Prix téléchargés: ${current}/${total} combinaisons${errors > 0 ? ` (${errors} erreurs)` : ''}`);
  } catch (error: any) {
    console.error('Erreur lors du téléchargement des prix:', error);
    const errorMessage = error.response?.data?.message || error.message || 'Erreur inconnue';
    toast.error(`Erreur lors du téléchargement des prix: ${errorMessage}`);
    throw error;
  }
}

/**
 * Récupère le prix depuis le cache en mode hors ligne
 * @param productId ID du produit
 * @param clientId ID du client
 * @param quantity Quantité (optionnel, par défaut 1)
 * @returns Prix unitaire ou null si non trouvé
 */
export async function getCachedPrice(
  productId: number,
  clientId: number,
  quantity: number = 1
): Promise<number | null> {
  try {
    const cachedPrice = await safeDBOperation(async () => {
      // Récupérer tous les prix pour ce produit
      const allPrices = await db.cachedPrices
        .where('productId')
        .equals(productId)
        .toArray();

      // Filtrer pour trouver le prix avec le bon client et la bonne quantité
      let price = allPrices.find(
        (p) => p.clientId === clientId && p.quantity === quantity
      );

      // Si pas trouvé, utiliser la quantité 1 comme référence
      if (!price) {
        price = allPrices.find(
          (p) => p.clientId === clientId && p.quantity === 1
        );
      }

      if (!price) {
        console.log(`Prix non trouvé en cache pour productId=${productId}, clientId=${clientId}, quantity=${quantity}`);
        // Vérifier combien de prix sont en cache
        const totalCached = await db.cachedPrices.count();
        console.log(`Total de prix en cache: ${totalCached}`);
        // Vérifier combien de prix pour ce produit
        console.log(`Prix en cache pour ce produit: ${allPrices.length}`);
      }

      return price;
    });

    return cachedPrice?.prixUnitaire || null;
  } catch (error) {
    console.error('Erreur lors de la récupération du prix en cache:', error);
    return null;
  }
}

/**
 * Vérifie si les prix sont en cache
 */
export async function hasCachedPrices(): Promise<boolean> {
  try {
    const count = await safeDBOperation(async () => {
      return await db.cachedPrices.count();
    });
    return (count || 0) > 0;
  } catch (error) {
    return false;
  }
}

