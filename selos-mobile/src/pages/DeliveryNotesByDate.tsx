import { useEffect, useState } from 'react';
import { Header } from '@/components/Header';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
import { FileText, Receipt } from 'lucide-react';

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

// Fonction pour obtenir la date d'aujourd'hui au format YYYY-MM-DD
const getTodayDate = (): string => {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export function DeliveryNotesByDate() {
  const { user } = useAuthStore();
  const [bls, setBls] = useState<DeliveryNote[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<string>(getTodayDate());
  const [creatingSale, setCreatingSale] = useState<number | null>(null);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [selectedBL, setSelectedBL] = useState<DeliveryNote | null>(null);

  useEffect(() => {
    if (user?.salespersonId) {
      loadBLs();
    }
  }, [user?.salespersonId, selectedDate]);

  const loadBLs = async () => {
    if (!user?.salespersonId) return;

    setLoading(true);
    try {
      if (isOnline()) {
        // Récupérer tous les BLs avec pagination (on filtrera par date côté client)
        const allBls: any[] = [];
        let page = 1;
        let total = 0;
        let hasMore = true;

        while (hasMore) {
          const response = await api.get('/delivery-notes', {
            params: {
              salespersonId: user.salespersonId,
              limit: 100,
              page: page,
              sortBy: 'dateLivraison',
              sortOrder: 'desc',
            },
          });
          const bls = response.data.data || [];
          const pagination = response.data.pagination;
          
          if (pagination) {
            total = pagination.total || 0;
            allBls.push(...bls);
            hasMore = allBls.length < total && bls.length > 0;
            page++;
          } else {
            // Si pas de pagination, on prend ce qu'on a
            allBls.push(...bls);
            hasMore = false;
          }
        }
        
        // Convertir la date sélectionnée pour le filtrage
        const selectedDateObj = new Date(selectedDate);
        const startOfDay = new Date(selectedDateObj);
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(selectedDateObj);
        endOfDay.setHours(23, 59, 59, 999);

        // Filtrer par date de livraison
        const filteredBls = allBls.filter((bl: any) => {
          const blDate = new Date(bl.dateLivraison);
          return blDate >= startOfDay && blDate <= endOfDay;
        });
        
        // Normaliser les données (convertir montantTotal en nombre)
        const normalizedBLs = filteredBls.map((bl: any) => ({
          ...bl,
          montantTotal: parseAmount(bl.montantTotal),
          saleId: bl.saleId || null,
          sale: bl.sale || null,
        }));
        setBls(normalizedBLs);
      } else {
        toast.info('Mode hors ligne - Liste non disponible');
        setBls([]);
      }
    } catch (error: any) {
      console.error('Erreur lors du chargement des BL:', error);
      toast.error('Erreur lors du chargement des BL');
      setBls([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSelectedDate(e.target.value);
  };

  const handleTodayClick = () => {
    setSelectedDate(getTodayDate());
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
    <div className="pb-24 min-h-screen bg-background">
      <Header title="Liste des BLs" />
      <div className="container mx-auto px-5 py-6 space-y-5">
        {/* Sélecteur de date */}
        <Card>
          <CardContent className="p-4">
            <div className="space-y-4">
              <div className="flex items-center gap-3">

                <div className="flex-1">
                  <Input
                    type="date"
                    value={selectedDate}
                    onChange={handleDateChange}
                    className="h-12 rounded-xl border-2"
                  />
                </div>
                <Button
                  variant="outline"
                  onClick={handleTodayClick}
                  className="h-12 px-4"
                >
                  Aujourd'hui
                </Button>
              </div>
              
            </div>
          </CardContent>
        </Card>

        {/* Liste des BLs */}
        {loading ? (
          <div className="text-center py-8 text-muted-foreground">
            Chargement...
          </div>
        ) : bls.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Aucun bon de livraison pour cette date</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {bls.map((bl) => (
              <Card key={bl.id} className="cursor-pointer hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <p className="font-semibold text-base mb-1">BL #{bl.numero}</p>
                      <p className="text-sm text-muted-foreground mb-1">
                        {bl.client.nom || 'Sans nom'} {bl.client.nomCommercial && `(${bl.client.nomCommercial})`}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(bl.dateLivraison).toLocaleDateString('fr-FR', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                    </div>
                    <div className="text-right ml-4">
                      <p className="font-bold text-base mb-1.5">
                        {parseAmount(bl.montantTotal).toFixed(2)} TND
                      </p>
                      <span className="text-xs px-2.5 py-1 rounded-lg bg-primary/10 text-primary font-medium">
                        {bl.status}
                      </span>
                    </div>
                  </div>
                  {/* Bouton pour créer une facture - visible pour les BL validés sans facture */}
                  {bl.status?.toLowerCase() === 'valide' && !bl.saleId && (
                    <Button
                      className="w-full mt-3 bg-green-600 hover:bg-green-700 text-white"
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
                    <div className="mt-3 p-2 bg-green-50 border border-green-200 rounded text-center">
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

        {/* Résumé */}
        {!loading && bls.length > 0 && (
          <Card className="bg-primary/5 border-primary/20">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-muted-foreground">
                  Total: {bls.length} BL(s)
                </span>
                <span className="text-lg font-bold">
                  {bls.reduce((sum, bl) => sum + parseAmount(bl.montantTotal), 0).toFixed(2)} TND
                </span>
              </div>
            </CardContent>
          </Card>
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

