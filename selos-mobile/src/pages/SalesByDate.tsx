import { useEffect, useState } from 'react';
import { Header } from '@/components/Header';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuthStore } from '@/store/authStore';
import { api, isOnline } from '@/lib/api';
import { toast } from 'sonner';
import { FileText, Receipt } from 'lucide-react';

interface Sale {
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
  dateVente: string;
  deliveryNoteId?: number | null;
  deliveryNote?: {
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

export function SalesByDate() {
  const { user } = useAuthStore();
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<string>(getTodayDate());

  useEffect(() => {
    if (user?.salespersonId) {
      loadSales();
    }
  }, [user?.salespersonId, selectedDate]);

  const loadSales = async () => {
    if (!user?.salespersonId) return;

    setLoading(true);
    try {
      if (isOnline()) {
        // Récupérer toutes les factures avec pagination (on filtrera par date côté client)
        const allSales: any[] = [];
        let page = 1;
        let total = 0;
        let hasMore = true;

        while (hasMore) {
          const response = await api.get('/sales', {
            params: {
              salespersonId: user.salespersonId,
              limit: 100,
              page: page,
              sortBy: 'dateVente',
              sortOrder: 'desc',
            },
          });
          const salesData = response.data.data || [];
          const pagination = response.data.pagination;
          
          if (pagination) {
            total = pagination.total || 0;
            allSales.push(...salesData);
            hasMore = allSales.length < total && salesData.length > 0;
            page++;
          } else {
            // Si pas de pagination, on prend ce qu'on a
            allSales.push(...salesData);
            hasMore = false;
          }
        }
        
        // Convertir la date sélectionnée pour le filtrage
        const selectedDateObj = new Date(selectedDate);
        const startOfDay = new Date(selectedDateObj);
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(selectedDateObj);
        endOfDay.setHours(23, 59, 59, 999);

        // Filtrer par date de vente
        const filteredSales = allSales.filter((sale: any) => {
          const saleDate = new Date(sale.dateVente);
          return saleDate >= startOfDay && saleDate <= endOfDay;
        });
        
        // Normaliser les données (convertir montantTotal en nombre)
        const normalizedSales = filteredSales.map((sale: any) => ({
          ...sale,
          montantTotal: parseAmount(sale.montantTotal),
          deliveryNoteId: sale.deliveryNoteId || null,
          deliveryNote: sale.deliveryNote || null,
        }));
        setSales(normalizedSales);
      } else {
        toast.info('Mode hors ligne - Liste non disponible');
        setSales([]);
      }
    } catch (error: any) {
      console.error('Erreur lors du chargement des factures:', error);
      toast.error('Erreur lors du chargement des factures');
      setSales([]);
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

  return (
    <div className="pb-24 min-h-screen bg-background">
      <Header title="Liste des factures" />
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

        {/* Liste des factures */}
        {loading ? (
          <div className="text-center py-8 text-muted-foreground">
            Chargement...
          </div>
        ) : sales.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              <Receipt className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Aucune facture pour cette date</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {sales.map((sale) => (
              <Card key={sale.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <p className="font-semibold text-base mb-1">Facture #{sale.numero}</p>
                      <p className="text-sm text-muted-foreground mb-1">
                        {sale.client.nom || 'Sans nom'} {sale.client.nomCommercial && `(${sale.client.nomCommercial})`}
                      </p>
                      {sale.deliveryNote && (
                        <p className="text-xs text-blue-600 mb-1">
                          BL: {sale.deliveryNote.numero}
                        </p>
                      )}
                      <p className="text-xs text-muted-foreground">
                        {new Date(sale.dateVente).toLocaleDateString('fr-FR', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                    </div>
                    <div className="text-right ml-4">
                      <p className="font-bold text-base mb-1.5">
                        {parseAmount(sale.montantTotal).toFixed(2)} TND
                      </p>
                      <span
                        className={`text-xs px-2.5 py-1 rounded-lg font-medium ${
                          sale.status?.toLowerCase() === 'valide'
                            ? 'bg-green-100 text-green-700'
                            : sale.status?.toLowerCase() === 'cree'
                            ? 'bg-yellow-100 text-yellow-700'
                            : sale.status?.toLowerCase() === 'annule'
                            ? 'bg-red-100 text-red-700'
                            : 'bg-primary/10 text-primary'
                        }`}
                      >
                        {sale.status?.toUpperCase() || sale.status}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Résumé */}
        {!loading && sales.length > 0 && (
          <Card className="bg-primary/5 border-primary/20">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-muted-foreground">
                  Total: {sales.length} facture(s)
                </span>
                <span className="text-lg font-bold">
                  {sales.reduce((sum, sale) => sum + parseAmount(sale.montantTotal), 0).toFixed(2)} TND
                </span>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

