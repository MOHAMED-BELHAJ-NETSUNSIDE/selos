import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { ProductCard } from './ProductCard';
import { api, isOnline } from '@/lib/api';
import { db } from '@/lib/db';
import { toast } from 'sonner';

interface Product {
  id: number;
  name: string;
  quantity: number;
  category?: string;
}

interface ProductSelectModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (product: Product) => void;
  salespersonId?: number;
}

export function ProductSelectModal({ 
  open, 
  onOpenChange, 
  onSelect,
  salespersonId 
}: ProductSelectModalProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open && salespersonId) {
      loadStock();
    }
  }, [open, salespersonId]);

  const loadStock = async () => {
    if (!salespersonId) return;
    
    setLoading(true);
    try {
      if (isOnline()) {
        // Charger depuis l'API
        const response = await api.get('/stock/consultation', {
          params: {
            salespersonId: salespersonId,
            limit: 1000,
          },
        });
        const stockItems = response.data.data || [];
        
        const productsList = stockItems.map((item: any) => ({
          id: item.product?.id || item.productId,
          name: item.product?.designation || item.product?.bcItem?.displayName || item.product?.bcItem?.description || 'Produit inconnu',
          quantity: item.totalStock || 0,
          category: item.product?.category,
        }));
        
        setProducts(productsList);

        // Mettre en cache (éviter les doublons)
        for (const product of productsList) {
          // Vérifier si le produit existe déjà dans le cache
          const existing = await db.cachedStock
            .where('productId')
            .equals(product.id)
            .first();
          
          if (existing) {
            // Mettre à jour l'enregistrement existant
            await db.cachedStock.update(existing.id!, {
              productName: product.name,
              quantity: product.quantity,
              category: product.category,
              lastUpdated: new Date(),
            });
          } else {
            // Créer un nouvel enregistrement
            await db.cachedStock.add({
              productId: product.id,
              productName: product.name,
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
        setProducts(
          Array.from(uniqueProductsMap.values()).map((item) => ({
            id: item.productId,
            name: item.productName,
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
      setProducts(
        Array.from(uniqueProductsMap.values()).map((item) => ({
          id: item.productId,
          name: item.productName,
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

  const filteredProducts = products.filter(
    (product) =>
      product.name.toLowerCase().includes(search.toLowerCase()) ||
      product.category?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="h-screen max-h-screen w-full max-w-full translate-x-0 translate-y-0 top-0 left-0 rounded-none flex flex-col p-0">
        <div className="p-6 pb-4 border-b">
          <DialogHeader>
            <DialogTitle>Sélectionner un produit</DialogTitle>
            <DialogDescription>
              Recherchez et sélectionnez un produit du stock
            </DialogDescription>
          </DialogHeader>
          <div className="mt-4">
            <Input
              placeholder="Rechercher un produit..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-6 pt-4">
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">
              Chargement...
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Aucun produit trouvé
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3">
              {filteredProducts.map((product) => (
                <ProductCard
                  key={product.id}
                  productId={product.id}
                  productName={product.name}
                  quantity={product.quantity}
                  category={product.category}
                  onSelect={() => {
                    onSelect(product);
                    onOpenChange(false);
                  }}
                />
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

