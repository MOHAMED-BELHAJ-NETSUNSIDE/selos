import { db, type PendingDeliveryNote, safeDBOperation } from './db';
import { api, isOnline } from './api';
import { toast } from 'sonner';

export interface SyncResult {
  success: number;
  failed: number;
  errors: string[];
}

/**
 * Synchronise tous les BL en attente avec le backend
 */
export async function syncPendingBLs(): Promise<SyncResult> {
  const result: SyncResult = {
    success: 0,
    failed: 0,
    errors: [],
  };

  if (!isOnline()) {
    toast.error('Pas de connexion internet');
    return result;
  }

  try {
    // Récupérer tous les BL non synchronisés
    const pendingBLs = await safeDBOperation(async () => {
      return await db.pendingDeliveryNotes
        .filter((bl) => !bl.synced)
        .toArray();
    }, []) || [];

    if (pendingBLs.length === 0) {
      toast.info('Aucun bon de livraison à synchroniser');
      return result;
    }

    toast.info(`Synchronisation de ${pendingBLs.length} bon(s) de livraison...`);

    // Synchroniser chaque BL
    for (const bl of pendingBLs) {
      try {
        // Préparer les données pour l'API
        const deliveryNoteData = {
          salespersonId: bl.salespersonId,
          clientId: bl.clientId,
          remarque: bl.remarque,
          lines: bl.lines,
        };

        // Envoyer au backend
        const response = await api.post('/delivery-notes', deliveryNoteData);

        if (response.status === 201 || response.status === 200) {
          const deliveryNoteId = response.data.id;
          
          // Valider automatiquement le bon de livraison (passe au statut "valide" et décrémente le stock)
          try {
            await api.post(`/delivery-notes/${deliveryNoteId}/validate`, {});
          } catch (validateError: any) {
            // Si la validation échoue, on continue quand même car le BL est créé
            console.warn(`Erreur lors de la validation du BL ${bl.localId}:`, validateError);
            result.errors.push(`BL ${bl.localId}: Créé mais validation échouée - ${validateError.response?.data?.message || validateError.message}`);
          }
          
          // Marquer comme synchronisé
          await safeDBOperation(async () => {
            await db.pendingDeliveryNotes.update(bl.id!, {
              synced: true,
              syncedAt: new Date(),
            });
          });

          result.success++;
        } else {
          result.failed++;
          result.errors.push(`BL ${bl.localId}: ${response.statusText}`);
        }
      } catch (error: any) {
        result.failed++;
        const errorMessage = error.response?.data?.message || error.message || 'Erreur inconnue';
        result.errors.push(`BL ${bl.localId}: ${errorMessage}`);
        console.error(`Erreur lors de la synchronisation du BL ${bl.localId}:`, error);
      }
    }

    // Supprimer les BL synchronisés après un délai (optionnel)
    // await db.pendingDeliveryNotes.where('synced').equals(true).delete();

    if (result.success > 0) {
      toast.success(`${result.success} bon(s) de livraison synchronisé(s) avec succès`);
    }

    if (result.failed > 0) {
      toast.error(`${result.failed} bon(s) de livraison n'ont pas pu être synchronisé(s)`);
    }

    return result;
  } catch (error: any) {
    console.error('Erreur lors de la synchronisation:', error);
    toast.error('Erreur lors de la synchronisation');
    return result;
  }
}

/**
 * Sauvegarde un BL localement pour synchronisation ultérieure
 */
export async function savePendingBL(bl: Omit<PendingDeliveryNote, 'id' | 'localId' | 'synced' | 'createdAt'>): Promise<string> {
  const localId = `local-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  
  await safeDBOperation(async () => {
    await db.pendingDeliveryNotes.add({
      ...bl,
      localId,
      synced: false,
      createdAt: new Date(),
    });
  });

  return localId;
}

/**
 * Récupère le nombre de BL en attente de synchronisation
 */
export async function getPendingBLCount(): Promise<number> {
  const count = await safeDBOperation(async () => {
    return await db.pendingDeliveryNotes.filter((bl) => !bl.synced).count();
  }, 0);
  return count || 0;
}

