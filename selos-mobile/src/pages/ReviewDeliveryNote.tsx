import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Header } from '@/components/Header';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useAuthStore } from '@/store/authStore';
import { api, isOnline } from '@/lib/api';
import { savePendingBL } from '@/lib/syncService';
import { toast } from 'sonner';

interface SelectedProduct {
  id: number;
  name: string;
  quantity: number;
  prixUnitaire: number;
}

interface SelectedClient {
  id: number;
  code: string;
  nom: string;
  nomCommercial?: string;
}

export function ReviewDeliveryNote() {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(false);

  // Récupérer les données depuis l'état de navigation
  const { client, products } = (location.state as {
    client: SelectedClient;
    products: SelectedProduct[];
  }) || { client: null, products: [] };

  if (!client || products.length === 0) {
    // Si pas de données, rediriger vers la création
    navigate('/delivery-notes/new');
    return null;
  }

  const totalAmount = products.reduce(
    (sum, p) => sum + p.quantity * p.prixUnitaire,
    0
  );

  const handleConfirm = async () => {
    if (!user?.salespersonId) {
      toast.error('Vendeur non identifié');
      return;
    }

    setLoading(true);

    try {
      const deliveryNoteData = {
        salespersonId: user.salespersonId,
        clientId: client.id,
        lines: products.map((p) => ({
          productId: p.id,
          qte: p.quantity,
          prixUnitaire: p.prixUnitaire,
        })),
      };

      if (isOnline()) {
        // En ligne : créer puis valider immédiatement
        const createResponse = await api.post('/delivery-notes', deliveryNoteData);
        const deliveryNoteId = createResponse.data.id;
        
        // Valider immédiatement le bon de livraison (passe au statut "valide" et décrémente le stock)
        await api.post(`/delivery-notes/${deliveryNoteId}/validate`, {});
        
        toast.success('Bon de livraison créé et validé avec succès');
        navigate('/delivery-notes');
      } else {
        // Hors ligne : sauvegarder localement
        await savePendingBL({
          ...deliveryNoteData,
          lines: deliveryNoteData.lines,
        });
        toast.success('BL créé (mode offline) – sera synchronisé plus tard');
        navigate('/delivery-notes');
      }
    } catch (error: any) {
      console.error('Erreur lors de la création du BL:', error);
      toast.error(
        error.response?.data?.message || 'Erreur lors de la création du BL'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="pb-20">
      <Header title="Récapitulatif" showSync={false} />
      <div className="container mx-auto px-4 py-6 space-y-6">
        {/* Informations client */}
        <Card>
          <CardContent className="p-4">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Client</p>
              <p className="font-semibold">{client.nom}</p>
              <p className="text-xs text-muted-foreground">Code: {client.code}</p>
            </div>
          </CardContent>
        </Card>

        {/* Liste des produits */}
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground mb-4">Produits</p>
            <div className="space-y-4">
              {products.map((product, index) => {
                const productTotal = product.quantity * product.prixUnitaire;
                return (
                  <div
                    key={index}
                    className="flex items-center justify-between pb-4 border-b last:border-0 last:pb-0"
                  >
                    <div className="flex-1">
                      <p className="font-medium text-sm">{product.name}</p>
                      <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                        <span>Qté: {product.quantity}</span>
                        <span>Prix unitaire: {product.prixUnitaire.toFixed(2)} TND</span>
                      </div>
                    </div>
                    <div className="text-right ml-4">
                      <p className="font-semibold">
                        {productTotal.toFixed(2)} TND
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Total */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-lg font-semibold">Total</span>
              <span className="text-xl font-bold">
                {totalAmount.toFixed(2)} TND
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Boutons */}
        <div className="space-y-3">
          <Button
            type="button"
            variant="outline"
            className="w-full"
            onClick={() => navigate(-1)}
            disabled={loading}
          >
            Retour
          </Button>
          <Button
            type="button"
            className="w-full"
            size="lg"
            onClick={handleConfirm}
            disabled={loading}
          >
            {loading ? 'Création...' : 'Confirmer la création'}
          </Button>
        </div>

        {!isOnline() && (
          <p className="text-xs text-center text-muted-foreground">
            Mode hors ligne - Le BL sera synchronisé automatiquement quand la connexion reviendra
          </p>
        )}
      </div>
    </div>
  );
}

