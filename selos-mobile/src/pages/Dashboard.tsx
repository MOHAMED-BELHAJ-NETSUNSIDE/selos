import { useEffect, useState } from 'react';
import { Header } from '@/components/Header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/store/authStore';
import { api, isOnline } from '@/lib/api';
import { db, safeDBOperation } from '@/lib/db';
import { toast } from 'sonner';
import { FileText, Package, AlertCircle, Tag, Receipt } from 'lucide-react';
import { Link } from 'react-router-dom';


export function Dashboard() {
  const { user } = useAuthStore();
  const [stockAlerts, setStockAlerts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    setLoading(true);
    try {
      if (isOnline() && user?.salespersonId) {
        // Charger depuis l'API
        const stockResponse = await api.get('/stock/consultation', {
          params: {
            salespersonId: user.salespersonId,
            limit: 100,
          },
        }).catch(() => ({ data: { data: [] } }));

        const stock = stockResponse.data.data || [];

        // Normaliser le stock (totalStock au lieu de quantity)
        const normalizedStock = stock.map((item: any) => ({
          ...item,
          quantity: Number(item.totalStock) || 0,
        }));

        const stockAlertsList = normalizedStock.filter((item: any) => (item.quantity || 0) < 10);
        setStockAlerts(stockAlertsList);

        // Mettre en cache (avec gestion d'erreur pour Dexie)
        if (user.salespersonId) {
          await safeDBOperation(async () => {
            await db.cachedDashboard.put({
              salespersonId: user.salespersonId!,
              data: { 
                stockAlerts: stockAlertsList
              },
              lastUpdated: new Date(),
            });
          });
        }
      } else {
        // Charger depuis le cache
        if (user?.salespersonId) {
          const cached = await safeDBOperation(async () => {
            return await db.cachedDashboard
              .where('salespersonId')
              .equals(user.salespersonId!)
              .first();
          });
          
          if (cached) {
            setStockAlerts(cached.data.stockAlerts || []);
          }
        }
        if (!isOnline()) {
          toast.info('Mode hors ligne - Données en cache');
        }
      }
    } catch (error: any) {
      console.error('Erreur lors du chargement du dashboard:', error);
      toast.error('Erreur lors du chargement du dashboard');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="pb-24 min-h-screen bg-background">
      <Header title="Tableau de bord" />
      <div className="container mx-auto px-5 py-6 space-y-5">
        {loading ? (
          <div className="text-center py-8 text-muted-foreground">
            Chargement...
          </div>
        ) : (
          <>
            {/* Alertes stock */}
            {stockAlerts.length > 0 && (
              <Card className="border-orange-200/50 bg-gradient-to-br from-orange-50 to-orange-100/50">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2.5 text-orange-900 text-lg">
                    <AlertCircle className="h-5 w-5 text-orange-600" />
                    Alertes Stock
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <p className="text-sm text-orange-800 mb-4">
                    {stockAlerts.length} produit(s) avec stock faible (&lt; 10)
                  </p>
                  <Button asChild variant="outline" className="border-orange-300 text-orange-700 hover:bg-orange-100" size="sm">
                    <Link to="/stock">Voir le stock</Link>
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Actions rapides */}
            <div className="grid grid-cols-2 gap-4 pt-2">
              <Button asChild className="h-24 flex-col gap-3 rounded-2xl shadow-minimal-lg bg-blue-600 hover:bg-blue-700 text-white">
                <Link to="/delivery-notes/new">
                  <FileText className="h-7 w-7" />
                  <span className="font-semibold">Nouveau BL</span>
                </Link>
              </Button>
              <Button asChild variant="outline" className="h-24 flex-col gap-3 rounded-2xl border-2">
                <Link to="/stock">
                  <Package className="h-7 w-7" />
                  <span className="font-semibold">Stock</span>
                </Link>
              </Button>
              <Button asChild variant="outline" className="h-24 flex-col gap-3 rounded-2xl border-2">
                <Link to="/delivery-notes/by-date">
                  <FileText className="h-7 w-7" />
                  <span className="font-semibold">Liste BLs</span>
                </Link>
              </Button>
              <Button asChild variant="outline" className="h-24 flex-col gap-3 rounded-2xl border-2">
                <Link to="/sales/by-date">
                  <Receipt className="h-7 w-7" />
                  <span className="font-semibold">Liste factures</span>
                </Link>
              </Button>
              <Button asChild variant="outline" className="h-24 flex-col gap-3 rounded-2xl border-2">
                <Link to="/product-prices">
                  <Tag className="h-7 w-7" />
                  <span className="font-semibold">Conditions de prix</span>
                </Link>
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

