import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from '@/components/Header';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ClientSelectModal } from '@/components/ClientSelectModal';
import { ProductSelectModal } from '@/components/ProductSelectModal';
import { QuantityStepper } from '@/components/QuantityStepper';
import { useAuthStore } from '@/store/authStore';
import { api, isOnline } from '@/lib/api';
import { getCachedPrice } from '@/lib/priceCacheService';
import { db, safeDBOperation } from '@/lib/db';
import { toast } from 'sonner';
import { Plus, Trash2, User, Package, RefreshCw } from 'lucide-react';

interface SelectedClient {
  id: number;
  code: string;
  nom: string;
  nomCommercial?: string;
}

interface SelectedProduct {
  id: number;
  name: string;
  quantity: number;
  prixUnitaire: number;
  availableStock?: number;
  loadingPrice?: boolean;
}

export function CreateDeliveryNote() {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [client, setClient] = useState<SelectedClient | null>(null);
  const [products, setProducts] = useState<SelectedProduct[]>([]);
  const [clientModalOpen, setClientModalOpen] = useState(false);
  const [productModalOpen, setProductModalOpen] = useState(false);

  // Fonction pour récupérer le prix d'un produit pour un client (avec quantité)
  const getProductPriceForClient = async (
    productId: number,
    clientId: number,
    quantity: number = 1
  ): Promise<number> => {
    // D'abord, essayer le cache (même en ligne, pour performance)
    const cachedPrice = await getCachedPrice(productId, clientId, quantity);
    
    if (isOnline()) {
      try {
        // Récupérer depuis l'API
        const response = await api.post('/delivery-notes/calculate-price', {
          productId,
          clientId,
          quantity,
        });
        const prixUnitaire = response.data.prixUnitaire || 0;
        
        // Mettre à jour le cache avec le nouveau prix
        if (prixUnitaire > 0) {
          await safeDBOperation(async () => {
            await db.cachedPrices.put({
              productId,
              clientId,
              quantity,
              prixUnitaire,
              lastUpdated: new Date(),
            });
          });
        }
        
        return prixUnitaire;
      } catch (error: any) {
        console.error('Erreur lors de la récupération du prix:', error);
        // Si erreur API mais qu'on a un prix en cache, l'utiliser
        if (cachedPrice !== null) {
          console.log('Utilisation du prix en cache suite à une erreur API');
          return cachedPrice;
        }
        toast.error('Erreur lors de la récupération du prix');
        return 0;
      }
    } else {
      // Mode hors ligne : utiliser uniquement le cache
      if (cachedPrice !== null) {
        return cachedPrice;
      } else {
        toast.warning('Prix non disponible en cache pour ce produit/client');
        return 0;
      }
    }
  };

  const handleClientSelect = async (selectedClient: SelectedClient) => {
    setClient(selectedClient);
    // Si des produits sont déjà ajoutés, recalculer leurs prix (en ligne ou hors ligne avec cache)
    if (products.length > 0) {
      setProducts((prevProducts) => {
        return prevProducts.map((p) => ({ ...p, loadingPrice: true }));
      });

      try {
        const pricePromises = products.map((product, index) =>
          getProductPriceForClient(
            product.id,
            selectedClient.id,
            product.quantity
          ).then((prixUnitaire) => ({ index, prixUnitaire }))
        );

        const results = await Promise.all(pricePromises);
        setProducts((prevProducts) => {
          const updated = [...prevProducts];
          results.forEach(({ index, prixUnitaire }) => {
            if (updated[index]) {
              updated[index].prixUnitaire = prixUnitaire;
              updated[index].loadingPrice = false;
            }
          });
          return updated;
        });
      } catch (error) {
        // En cas d'erreur, arrêter le chargement
        setProducts((prevProducts) => {
          return prevProducts.map((p) => ({ ...p, loadingPrice: false }));
        });
      }
    }
  };

  const handleProductSelect = async (product: { id: number; name: string; quantity: number; category?: string }) => {
    if (!client) {
      toast.error('Veuillez d\'abord sélectionner un client');
      return;
    }

    // Check if product already exists
    const existingIndex = products.findIndex((p) => p.id === product.id);
    
    if (existingIndex >= 0) {
      // If exists, increase quantity and recalculate price
      const updatedProducts = [...products];
      updatedProducts[existingIndex].quantity += 1;
      updatedProducts[existingIndex].loadingPrice = true;
      setProducts(updatedProducts);

      if (isOnline()) {
        const prixUnitaire = await getProductPriceForClient(
          product.id,
          client.id,
          updatedProducts[existingIndex].quantity
        );
        updatedProducts[existingIndex].prixUnitaire = prixUnitaire;
      }
      updatedProducts[existingIndex].loadingPrice = false;
      setProducts(updatedProducts);
    } else {
      // Add new product and fetch price from backend
      const newProduct: SelectedProduct = {
        id: product.id,
        name: product.name,
        quantity: 1,
        prixUnitaire: 0,
        availableStock: product.quantity,
        loadingPrice: true,
      };

      setProducts((prevProducts) => [...prevProducts, newProduct]);

      if (isOnline()) {
        try {
          const prixUnitaire = await getProductPriceForClient(
            product.id,
            client.id,
            1
          );
          setProducts((prevProducts) => {
            const updated = [...prevProducts];
            const lastIndex = updated.length - 1;
            if (lastIndex >= 0 && updated[lastIndex].id === product.id) {
              updated[lastIndex] = {
                ...updated[lastIndex],
                prixUnitaire,
                loadingPrice: false,
              };
            }
            return updated;
          });
        } catch (error) {
          setProducts((prevProducts) => {
            const updated = [...prevProducts];
            const lastIndex = updated.length - 1;
            if (lastIndex >= 0 && updated[lastIndex].id === product.id) {
              updated[lastIndex] = {
                ...updated[lastIndex],
                loadingPrice: false,
              };
            }
            return updated;
          });
        }
      } else {
        // Mode hors ligne : utiliser le cache
        try {
          const cachedPrice = await getCachedPrice(product.id, client.id, 1);
          setProducts((prevProducts) => {
            const updated = [...prevProducts];
            const lastIndex = updated.length - 1;
            if (lastIndex >= 0 && updated[lastIndex].id === product.id) {
              updated[lastIndex] = {
                ...updated[lastIndex],
                prixUnitaire: cachedPrice || 0,
                loadingPrice: false,
              };
            }
            return updated;
          });
          if (!cachedPrice) {
            toast.warning('Prix non disponible en cache pour ce produit');
          }
        } catch (error) {
          setProducts((prevProducts) => {
            const updated = [...prevProducts];
            const lastIndex = updated.length - 1;
            if (lastIndex >= 0 && updated[lastIndex].id === product.id) {
              updated[lastIndex] = {
                ...updated[lastIndex],
                prixUnitaire: 0,
                loadingPrice: false,
              };
            }
            return updated;
          });
          toast.warning('Erreur lors de la récupération du prix en cache');
        }
      }
    }
  };

  const handleQuantityChange = async (index: number, newQuantity: number) => {
    // Mettre à jour la quantité et activer le chargement
    setProducts((prevProducts) => {
      const updated = [...prevProducts];
      updated[index] = {
        ...updated[index],
        quantity: newQuantity,
        loadingPrice: true,
      };
      return updated;
    });

    // Recalculer le prix si un client est sélectionné (en ligne ou hors ligne avec cache)
    if (client) {
      try {
        const prixUnitaire = await getProductPriceForClient(
          products[index].id,
          client.id,
          newQuantity
        );
        setProducts((prevProducts) => {
          const updated = [...prevProducts];
          updated[index] = {
            ...updated[index],
            prixUnitaire,
            loadingPrice: false,
          };
          return updated;
        });
      } catch (error) {
        console.error('Erreur lors du recalcul du prix:', error);
        setProducts((prevProducts) => {
          const updated = [...prevProducts];
          updated[index] = {
            ...updated[index],
            loadingPrice: false,
          };
          return updated;
        });
      }
    } else {
      // Si pas de client, juste désactiver le chargement
      setProducts((prevProducts) => {
        const updated = [...prevProducts];
        updated[index] = {
          ...updated[index],
          loadingPrice: false,
        };
        return updated;
      });
    }
  };



  const handleRemoveProduct = (index: number) => {
    setProducts(products.filter((_, i) => i !== index));
  };

  const handleContinue = () => {
    if (!client) {
      toast.error('Veuillez sélectionner un client');
      return;
    }

    if (products.length === 0) {
      toast.error('Veuillez ajouter au moins un produit');
      return;
    }

    // Validate that all products have prices (from backend)
    const productsWithoutPrice = products.filter((p) => p.prixUnitaire <= 0);
    if (productsWithoutPrice.length > 0) {
      if (isOnline()) {
        toast.error('Erreur : certains prix n\'ont pas pu être récupérés');
      } else {
        toast.error('Mode hors ligne - Impossible de créer un BL sans prix');
      }
      return;
    }

    // Navigate to review page with data
    navigate('/delivery-notes/review', {
      state: {
        client,
        products,
      },
    });
  };

  const totalAmount = products.reduce(
    (sum, p) => sum + p.quantity * p.prixUnitaire,
    0
  );

  return (
    <div className="pb-24 min-h-screen bg-background">
      <Header title="Nouveau bon de livraison" showSync={false} />
      <div className="container mx-auto px-5 py-6 space-y-5">
        {/* Client Selection */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-sm text-muted-foreground mb-2">Client</p>
                {client ? (
                  <div>
                    <p className="font-semibold">{client.nom}</p>
                    <p className="text-xs text-muted-foreground">Code: {client.code}</p>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">Aucun client sélectionné</p>
                )}
              </div>
              <Button
                variant="outline"
                onClick={() => setClientModalOpen(true)}
                className="ml-4"
              >
                <User className="h-4 w-4 mr-2" />
                {client ? 'Changer' : 'Sélectionner'}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Products List */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Produits</h3>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setProductModalOpen(true)}
              disabled={!client}
            >
              <Plus className="h-4 w-4 mr-2" />
              Ajouter
            </Button>
          </div>

          {products.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <Package className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground">
                  {!client
                    ? 'Sélectionnez d\'abord un client'
                    : 'Aucun produit ajouté'}
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {products.map((product, index) => (
                <Card key={index}>
                  <CardContent className="p-4">
                    <div className="space-y-3">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <p className="font-semibold text-sm">{product.name}</p>
                          {product.availableStock !== undefined && (
                            <p className="text-xs text-muted-foreground mt-1">
                              Stock disponible: {product.availableStock}
                            </p>
                          )}
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleRemoveProduct(index)}
                          className="h-8 w-8 text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <p className="text-xs text-muted-foreground mb-2">Quantité</p>
                          <QuantityStepper
                            value={product.quantity}
                            onChange={(qty) => handleQuantityChange(index, qty)}
                            min={1}
                            max={product.availableStock}
                          />
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground mb-2">Prix unitaire (TND)</p>
                          <div className="relative">
                            <Input
                              type="number"
                              step="0.01"
                              min="0"
                              value={product.loadingPrice ? '' : (product.prixUnitaire || '')}
                              placeholder={product.loadingPrice ? 'Chargement...' : '0.00'}
                              className="h-10 bg-muted"
                              disabled={true}
                              readOnly={true}
                            />
                            {product.loadingPrice && (
                              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                <RefreshCw className="h-4 w-4 animate-spin text-muted-foreground" />
                              </div>
                            )}
                          </div>
                          {!isOnline() && (
                            <p className="text-xs text-muted-foreground mt-1">
                              Mode hors ligne - Prix non disponible
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="pt-2 border-t">
                        <div className="flex justify-between items-center">
                          <span className="text-xs text-muted-foreground">Sous-total</span>
                          <span className="font-semibold">
                            {(product.quantity * product.prixUnitaire).toFixed(2)} TND
                          </span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Total */}
        {products.length > 0 && (
          <Card className="bg-primary/5 border-primary/20">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <span className="text-lg font-semibold">Total</span>
                <span className="text-xl font-bold">
                  {totalAmount.toFixed(2)} TND
                </span>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Continue Button */}
        <Button
          className="w-full"
          size="lg"
          onClick={handleContinue}
          disabled={!client || products.length === 0}
        >
          Continuer
        </Button>
      </div>

      {/* Modals */}
      <ClientSelectModal
        open={clientModalOpen}
        onOpenChange={setClientModalOpen}
        onSelect={handleClientSelect}
      />
      <ProductSelectModal
        open={productModalOpen}
        onOpenChange={setProductModalOpen}
        onSelect={handleProductSelect}
        salespersonId={user?.salespersonId}
      />
    </div>
  );
}
