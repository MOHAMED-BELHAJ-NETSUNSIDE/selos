import { useEffect, useState } from 'react';
import { Header } from '@/components/Header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useAuthStore } from '@/store/authStore';
import { api, isOnline } from '@/lib/api';
import { db, safeDBOperation } from '@/lib/db';
import { toast } from 'sonner';
import { Tag, Search } from 'lucide-react';

interface Product {
  id: number;
  designation: string;
  ref?: string;
  bcItem?: {
    id: number;
    number?: string;
    displayName?: string;
  };
}

interface PriceCondition {
  id: number;
  unitPrice: number;
  minimumQuantity?: number;
  salesType?: string;
  salesCode?: string;
  salesCodeName?: string;
  startingDate?: string;
  endingDate?: string;
  currencyCode?: string;
}

export function ProductPrices() {
  const { user } = useAuthStore();
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [priceConditions, setPriceConditions] = useState<PriceCondition[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [loadingPrices, setLoadingPrices] = useState(false);

  useEffect(() => {
    if (user?.salespersonId) {
      loadProducts();
    }
  }, [user?.salespersonId]);

  const loadProducts = async () => {
    if (!user?.salespersonId) return;

    setLoading(true);
    try {
      if (isOnline()) {
        // Charger depuis l'API avec pagination
        const productsList: Product[] = [];
        let page = 1;
        let total = 0;

        do {
          const response = await api.get('/stock/consultation', {
            params: {
              salespersonId: user.salespersonId,
              limit: 100,
              page: page,
            },
          });
          const stockItems = response.data.data || [];
          total = response.data.total || 0;

          const pageProducts = stockItems
            .map((item: any) => ({
              id: item.product?.id || item.productId,
              designation: item.product?.designation || 'Produit inconnu',
              ref: item.product?.ref,
              bcItem: item.product?.bcItem,
            }))
            .filter((p: any) => p.id && p.bcItem); // Filtrer les produits sans BCItem

          productsList.push(...pageProducts);
          page++;
        } while (productsList.length < total);

        setProducts(productsList);

        // Mettre en cache (optionnel, ne pas bloquer si erreur, éviter les doublons)
        for (const product of productsList) {
          await safeDBOperation(async () => {
            // Vérifier si le produit existe déjà dans le cache
            const existing = await db.cachedStock
              .where('productId')
              .equals(product.id)
              .first();
            
            if (existing) {
              // Mettre à jour l'enregistrement existant
              await db.cachedStock.update(existing.id!, {
                productName: product.designation,
                quantity: 0,
                category: undefined,
                lastUpdated: new Date(),
              });
            } else {
              // Créer un nouvel enregistrement
              await db.cachedStock.add({
                productId: product.id,
                productName: product.designation,
                quantity: 0,
                category: undefined,
                lastUpdated: new Date(),
              });
            }
          });
        }
      } else {
        // Charger depuis le cache (dédupliquer par productId)
        const cachedStock = await safeDBOperation(async () => {
          return await db.cachedStock.toArray();
        }) || [];
        
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
            designation: item.productName,
            ref: undefined,
            bcItem: undefined,
          }))
        );
        toast.info('Mode hors ligne - Données en cache');
      }
    } catch (error: any) {
      console.error('Erreur lors du chargement des produits:', error);
      toast.error('Erreur lors du chargement des produits');
    } finally {
      setLoading(false);
    }
  };

  const loadPriceConditions = async (product: Product) => {
    if (!product.bcItem) {
      toast.warning('Ce produit n\'a pas de BCItem associé');
      return;
    }

    setLoadingPrices(true);
    setSelectedProduct(product);

    try {
      if (isOnline()) {
        // Essayer de récupérer par itemNumber d'abord
        let pricesResponse;
        let lastError: any = null;
        
        if (product.bcItem.number) {
          try {
            pricesResponse = await api.get(`/bc-item-prices/item-number/${product.bcItem.number}`);
          } catch (error: any) {
            lastError = error;
            // Si échec, essayer par bcItemId
            if (product.bcItem.id) {
              try {
                pricesResponse = await api.get(`/bc-item-prices/bc-item/${product.bcItem.id}`);
                lastError = null;
              } catch (error2: any) {
                lastError = error2;
              }
            }
          }
        } else if (product.bcItem.id) {
          try {
            pricesResponse = await api.get(`/bc-item-prices/bc-item/${product.bcItem.id}`);
          } catch (error: any) {
            lastError = error;
          }
        }

        if (lastError) {
          if (lastError.response?.status === 403) {
            toast.error(
              'Permission refusée. Veuillez vous déconnecter et vous reconnecter pour obtenir les permissions nécessaires.',
              { duration: 5000 }
            );
            console.error('Erreur 403 - Détails:', {
              url: lastError.config?.url,
              status: lastError.response?.status,
              message: lastError.response?.data?.message,
            });
          } else {
            toast.error(`Erreur: ${lastError.response?.data?.message || lastError.message || 'Erreur inconnue'}`);
          }
          setPriceConditions([]);
          return;
        }

        if (pricesResponse?.data) {
          const prices = Array.isArray(pricesResponse.data) 
            ? pricesResponse.data 
            : pricesResponse.data.data || [];

          // Filtrer les prix valides (prix > 0 et non expirés) et les mapper
          const now = new Date();
          const validPrices = prices
            .map((price: any) => {
              const minQty = price.minimumQuantity != null ? Number(price.minimumQuantity) : undefined;
              return {
                id: price.id,
                unitPrice: Number(price.unitPrice) || 0,
                minimumQuantity: minQty != null && minQty > 0 ? minQty : undefined,
                salesType: price.salesType,
                salesCode: price.salesCode,
                salesCodeName: price.salesCodeName,
                startingDate: price.startingDate,
                endingDate: price.endingDate,
                currencyCode: price.currencyCode ? String(price.currencyCode) : undefined,
              };
            })
            .filter((price: PriceCondition) => {
              // Filtrer les prix à 0
              if (price.unitPrice <= 0) return false;
              
              // Filtrer les prix expirés (endingDate dans le passé)
              if (price.endingDate) {
                const endingDate = new Date(price.endingDate);
                if (endingDate < now) return false;
              }
              
              // Filtrer les prix qui n'ont pas encore commencé (startingDate dans le futur)
              if (price.startingDate) {
                const startingDate = new Date(price.startingDate);
                if (startingDate > now) return false;
              }
              
              return true;
            });

          setPriceConditions(validPrices);

          if (validPrices.length === 0) {
            toast.info('Aucune condition de prix valide trouvée pour ce produit');
          }
        } else {
          setPriceConditions([]);
          toast.info('Aucune condition de prix trouvée pour ce produit');
        }
      } else {
        toast.error('Mode hors ligne - Impossible de charger les conditions de prix');
      }
    } catch (error: any) {
      console.error('Erreur lors du chargement des conditions de prix:', error);
      if (error.response?.status === 403) {
        toast.error('Permission refusée. Veuillez vous reconnecter.');
      } else {
        toast.error('Erreur lors du chargement des conditions de prix');
      }
      setPriceConditions([]);
    } finally {
      setLoadingPrices(false);
    }
  };

  const filteredProducts = products.filter(
    (product) =>
      product.designation.toLowerCase().includes(search.toLowerCase()) ||
      product.ref?.toLowerCase().includes(search.toLowerCase()) ||
      product.bcItem?.number?.toLowerCase().includes(search.toLowerCase())
  );

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('fr-FR');
  };

  const getSalesTypeLabel = (type?: string) => {
    switch (type) {
      case 'Customer':
        return 'Client spécifique';
      case 'Customer Price Group':
        return 'Groupe de prix';
      case 'Campaign':
        return 'Campagne';
      case 'All Customers':
        return 'Tous les clients';
      default:
        return type || 'N/A';
    }
  };

  return (
    <div className="pb-24 min-h-screen bg-background">
      <Header title="Conditions de prix" />
      <div className="container mx-auto px-5 py-6 space-y-5">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher un produit..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-12 rounded-xl border-2 pl-10"
          />
        </div>

        {loading ? (
          <div className="text-center py-8 text-muted-foreground">
            Chargement...
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            Aucun produit trouvé
          </div>
        ) : (
          <div className="space-y-3">
            {filteredProducts.map((product) => (
              <Card
                key={product.id}
                className={`cursor-pointer transition-all ${
                  selectedProduct?.id === product.id
                    ? 'border-primary shadow-md'
                    : 'hover:shadow-sm'
                }`}
                onClick={() => loadPriceConditions(product)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="font-semibold text-sm">{product.designation}</p>
                      {product.ref && (
                        <p className="text-xs text-muted-foreground mt-1">
                          Réf: {product.ref}
                        </p>
                      )}
                      {product.bcItem?.number && (
                        <p className="text-xs text-muted-foreground">
                          BC: {product.bcItem.number}
                        </p>
                      )}
                    </div>
                    <Tag className="h-5 w-5 text-muted-foreground" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Conditions de prix pour le produit sélectionné */}
        {selectedProduct && (
          <Card className="mt-6 border-primary/20">
            <CardHeader>
              <CardTitle className="text-lg">
                {selectedProduct.designation}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loadingPrices ? (
                <div className="text-center py-8 text-muted-foreground">
                  Chargement des conditions de prix...
                </div>
              ) : priceConditions.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">
                  Aucune condition de prix trouvée
                </p>
              ) : (
                <div className="space-y-4">
                  {priceConditions.map((price) => (
                    <div
                      key={price.id}
                      className="p-4 border border-border/40 rounded-xl bg-muted/30"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <p className="font-bold text-lg">
                            {price.unitPrice.toFixed(4)} {price.currencyCode && price.currencyCode !== '0' ? price.currencyCode : 'TND'}
                          </p>
                          {price.minimumQuantity != null && price.minimumQuantity > 0 && (
                            <p className="text-xs text-muted-foreground mt-1">
                              Quantité minimum: {price.minimumQuantity.toFixed(2)}
                            </p>
                          )}
                        </div>
                        <span className="text-xs px-2.5 py-1 rounded-lg bg-primary/10 text-primary font-medium">
                          {getSalesTypeLabel(price.salesType)}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                        {price.salesCode && (
                          <div>
                            <span className="font-medium">Code:</span> {price.salesCode}
                          </div>
                        )}
                        {price.salesCodeName && (
                          <div>
                            <span className="font-medium">Nom:</span> {price.salesCodeName}
                          </div>
                        )}
                        <div>
                          <span className="font-medium">Début:</span> {formatDate(price.startingDate)}
                        </div>
                        <div>
                          <span className="font-medium">Fin:</span> {formatDate(price.endingDate)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

