import { useEffect, useState } from 'react';
import { Header } from '@/components/Header';
import { ProductCard } from '@/components/ProductCard';
import { Input } from '@/components/ui/input';
import { useAuthStore } from '@/store/authStore';
import { api, isOnline } from '@/lib/api';
import { db } from '@/lib/db';
import { toast } from 'sonner';

interface StockItem {
  productId: number;
  productName: string;
  quantity: number;
  category?: string;
}

export function Stock() {
  const { user } = useAuthStore();
  const [stock, setStock] = useState<StockItem[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.salespersonId) {
      loadStock();
    }
  }, [user?.salespersonId]);

  const loadStock = async () => {
    if (!user?.salespersonId) return;

    setLoading(true);
    try {
      if (isOnline()) {
        // Charger depuis l'API
        const response = await api.get('/stock/consultation', {
          params: {
            salespersonId: user.salespersonId,
            limit: 1000,
          },
        });
        const stockItems = response.data.data || [];

        const productsList = stockItems.map((item: any) => ({
          productId: item.product?.id || item.productId,
          productName: item.product?.designation || item.product?.bcItem?.displayName || item.product?.bcItem?.description || 'Produit inconnu',
          quantity: item.totalStock || 0,
          category: item.product?.category,
        }));

        setStock(productsList);

        // Mettre en cache (éviter les doublons)
        for (const product of productsList) {
          // Vérifier si le produit existe déjà dans le cache
          const existing = await db.cachedStock
            .where('productId')
            .equals(product.productId)
            .first();
          
          if (existing) {
            // Mettre à jour l'enregistrement existant
            await db.cachedStock.update(existing.id!, {
              productName: product.productName,
              quantity: product.quantity,
              category: product.category,
              lastUpdated: new Date(),
            });
          } else {
            // Créer un nouvel enregistrement
            await db.cachedStock.add({
              productId: product.productId,
              productName: product.productName,
              quantity: product.quantity,
              category: product.category,
              lastUpdated: new Date(),
            });
          }
        }
      } else {
        // Charger depuis le cache (dédupliquer par productId)
        const cachedStock = await db.cachedStock.toArray();
        // Créer un Map pour éliminer les doublons par productId
        const uniqueProductsMap = new Map<number, any>();
        for (const item of cachedStock) {
          if (item && item.productId && !uniqueProductsMap.has(item.productId)) {
            uniqueProductsMap.set(item.productId, item);
          }
        }
        setStock(
          Array.from(uniqueProductsMap.values()).map((item) => ({
            productId: item.productId,
            productName: item.productName,
            quantity: item.quantity,
            category: item.category,
          }))
        );
        toast.info('Mode hors ligne - Données en cache');
      }
    } catch (error: any) {
      console.error('Erreur lors du chargement du stock:', error);
      // Essayer de charger depuis le cache en cas d'erreur (dédupliquer)
      const cachedStock = await db.cachedStock.toArray();
      // Créer un Map pour éliminer les doublons par productId
      const uniqueProductsMap = new Map<number, any>();
      for (const item of cachedStock) {
        if (item && item.productId && !uniqueProductsMap.has(item.productId)) {
          uniqueProductsMap.set(item.productId, item);
        }
      }
      setStock(
        Array.from(uniqueProductsMap.values()).map((item) => ({
          productId: item.productId,
          productName: item.productName,
          quantity: item.quantity,
          category: item.category,
        }))
      );
      if (!isOnline()) {
        toast.info('Mode hors ligne - Données en cache');
      } else {
        toast.error('Erreur lors du chargement du stock');
      }
    } finally {
      setLoading(false);
    }
  };

  const filteredStock = stock.filter(
    (item) =>
      item.productName.toLowerCase().includes(search.toLowerCase()) ||
      item.category?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="pb-24 min-h-screen bg-background">
      <Header title="Stock" />
      <div className="container mx-auto px-5 py-6 space-y-5">
        <Input
          placeholder="Rechercher un produit..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="h-12 rounded-xl border-2"
        />
        {loading ? (
          <div className="text-center py-8 text-muted-foreground">
            Chargement...
          </div>
        ) : filteredStock.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            Aucun produit trouvé
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {filteredStock.map((item) => (
              <ProductCard
                key={item.productId}
                productId={item.productId}
                productName={item.productName}
                quantity={item.quantity}
                category={item.category}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

