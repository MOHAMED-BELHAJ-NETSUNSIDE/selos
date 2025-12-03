import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Header } from '@/components/Header';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useAuthStore } from '@/store/authStore';
import { api, isOnline } from '@/lib/api';
import { toast } from 'sonner';
import { Plus, FileText, Receipt } from 'lucide-react';

interface DeliveryNote {
  id: number;
  numero: string;
  client: {
    id: number;
    code: string;
    nom: string;
    nomCommercial?: string;
  };
  status: string;
  montantTotal: number | string;
  dateLivraison: string;
  saleId?: number | null;
  sale?: {
    id: number;
    numero: string;
  } | null;
}

// Helper pour convertir montantTotal en nombre
const parseAmount = (amount: number | string | any): number => {
  if (typeof amount === 'number') return amount;
  if (typeof amount === 'string') return parseFloat(amount) || 0;
  // Si c'est un objet Decimal de Prisma
  if (amount && typeof amount === 'object' && 'toNumber' in amount) {
    return amount.toNumber();
  }
  return 0;
};

export function DeliveryNotesList() {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [bls, setBls] = useState<DeliveryNote[]>([]);
  const [loading, setLoading] = useState(true);
  const [creatingSale, setCreatingSale] = useState<number | null>(null);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [selectedBL, setSelectedBL] = useState<DeliveryNote | null>(null);

  useEffect(() => {
    if (user?.salespersonId) {
      loadBLs();
    }
  }, [user?.salespersonId]);

  const loadBLs = async () => {
    if (!user?.salespersonId) return;

    setLoading(true);
    try {
      if (isOnline()) {
        const response = await api.get('/delivery-notes', {
          params: {
            salespersonId: user.salespersonId,
            limit: 5,
            sortBy: 'dateLivraison',
            sortOrder: 'desc',
          },
        });
        const bls = response.data.data || [];
        // Normaliser les données (convertir montantTotal en nombre) et limiter à 5
        const normalizedBLs = bls
          .slice(0, 5)
          .map((bl: any) => ({
            ...bl,
            montantTotal: parseAmount(bl.montantTotal),
            saleId: bl.saleId || null,
          }));
        setBls(normalizedBLs);
      } else {
        toast.info('Mode hors ligne - Liste non disponible');
      }
    } catch (error: any) {
      console.error('Erreur lors du chargement des BL:', error);
      toast.error('Erreur lors du chargement des BL');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSaleClick = (bl: DeliveryNote) => {
    if (!isOnline()) {
      toast.error('Mode hors ligne - Impossible de créer une facture');
      return;
    }
    setSelectedBL(bl);
    setConfirmDialogOpen(true);
  };

  const handleConfirmCreateSale = async () => {
    if (!selectedBL) return;

    setConfirmDialogOpen(false);
    setCreatingSale(selectedBL.id);
    try {
      const response = await api.post(`/sales/from-delivery-note/${selectedBL.id}`);
      toast.success(`Facture ${response.data.numero} créée avec succès`);
      // Recharger la liste pour mettre à jour les données
      await loadBLs();
    } catch (error: any) {
      console.error('Erreur lors de la création de la facture:', error);
      toast.error(
        error.response?.data?.message || 'Erreur lors de la création de la facture'
      );
    } finally {
      setCreatingSale(null);
      setSelectedBL(null);
    }
  };

  return (
    <div className="pb-20">
      <Header title="Bons de livraison" />
      <div className="container mx-auto px-4 py-6 space-y-4">
        <Button asChild className="w-full bg-blue-600 hover:bg-blue-700 text-white" size="lg">
          <Link to="/delivery-notes/new">
            <Plus className="h-4 w-4 mr-2" />
            Nouveau bon de livraison
          </Link>
        </Button>

        {loading ? (
          <div className="text-center py-8 text-muted-foreground">
            Chargement...
          </div>
        ) : bls.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Aucun bon de livraison</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {bls.map((bl) => (
              <Card key={bl.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <p className="font-semibold">BL #{bl.numero}</p>
                      <p className="text-sm text-muted-foreground">
                        {bl.client.nom || 'Sans nom'} {bl.client.nomCommercial && `(${bl.client.nomCommercial})`}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(bl.dateLivraison).toLocaleDateString('fr-FR')}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">
                        {parseAmount(bl.montantTotal).toFixed(2)} TND
                      </p>
                    </div>
                  </div>
                  {/* Bouton pour créer une facture - visible pour les BL validés sans facture */}
                  {bl.status?.toLowerCase() === 'valide' && !bl.saleId && (
                    <Button
                      className="w-full mt-2 bg-green-600 hover:bg-green-700 text-white"
                      size="sm"
                      onClick={() => handleCreateSaleClick(bl)}
                      disabled={creatingSale === bl.id || !isOnline()}
                    >
                      {creatingSale === bl.id ? (
                        'Création...'
                      ) : (
                        <>
                          <Receipt className="h-4 w-4 mr-2" />
                          Créer facture
                        </>
                      )}
                    </Button>
                  )}
                  {/* Message si facture déjà créée */}
                  {bl.saleId && (
                    <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded text-center">
                      <p className="text-xs text-green-700 font-medium">
                        ✓ Facture créée
                        {bl.sale?.numero && (
                          <span className="ml-2 font-semibold">
                            ({bl.sale.numero})
                          </span>
                        )}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Dialog de confirmation */}
      <Dialog open={confirmDialogOpen} onOpenChange={setConfirmDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmer la création de la facture</DialogTitle>
            <DialogDescription>
              Êtes-vous sûr de vouloir créer une facture à partir du bon de livraison{' '}
              <strong>{selectedBL?.numero}</strong> ?
              <br />
              <br />
              Client: {selectedBL?.client.nom}
              <br />
              Montant: {selectedBL ? parseAmount(selectedBL.montantTotal).toFixed(2) : '0.00'} TND
              <br />
              <br />
              <span className="text-sm text-muted-foreground">
                Note: Le stock a déjà été décrémenté lors de la validation du bon de livraison.
              </span>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setConfirmDialogOpen(false);
                setSelectedBL(null);
              }}
            >
              Annuler
            </Button>
            <Button
              className="bg-green-600 hover:bg-green-700 text-white"
              onClick={handleConfirmCreateSale}
            >
              Confirmer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

