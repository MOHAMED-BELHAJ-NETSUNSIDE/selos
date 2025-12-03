import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from '@/components/Header';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ProductSelectModal } from '@/components/ProductSelectModal';
import { SalespersonSelectModal } from '@/components/SalespersonSelectModal';
import { QuantityStepper } from '@/components/QuantityStepper';
import { api, isOnline } from '@/lib/api';
import { toast } from 'sonner';
import { Plus, Trash2, Package, User } from 'lucide-react';

interface SelectedProduct {
  id: number;
  name: string;
  quantity: number;
  prixUnitaire: number;
  availableStock?: number;
  loadingPrice?: boolean;
}

interface SelectedSalesperson {
  id: number;
  code: string | null;
  firstName: string;
  lastName: string;
  depotName: string;
}

export function CreateReturnInvoice() {
  const navigate = useNavigate();
  const [salesperson, setSalesperson] = useState<SelectedSalesperson | null>(null);
  const [products, setProducts] = useState<SelectedProduct[]>([]);
  const [salespersonModalOpen, setSalespersonModalOpen] = useState(false);
  const [productModalOpen, setProductModalOpen] = useState(false);

  const handleSalespersonSelect = (selectedSalesperson: SelectedSalesperson) => {
    setSalesperson(selectedSalesperson);
    // Si des produits sont déjà ajoutés, on peut les garder
  };

  const handleProductSelect = async (product: { id: number; name: string; quantity: number; category?: string }) => {
    if (!salesperson) {
      toast.error('Veuillez d\'abord sélectionner un vendeur');
      return;
    }

    // Check if product already exists
    const existingIndex = products.findIndex((p) => p.id === product.id);
    
    if (existingIndex >= 0) {
      // If exists, increase quantity
      const updatedProducts = [...products];
      updatedProducts[existingIndex].quantity += 1;
      setProducts(updatedProducts);
    } else {
      // Add new product
      const newProduct: SelectedProduct = {
        id: product.id,
        name: product.name,
        quantity: 1,
        prixUnitaire: 0,
        availableStock: product.quantity,
        loadingPrice: false,
      };

      setProducts((prevProducts) => [...prevProducts, newProduct]);
    }
  };

  const handleQuantityChange = (index: number, newQuantity: number) => {
    setProducts((prevProducts) => {
      const updated = [...prevProducts];
      updated[index] = {
        ...updated[index],
        quantity: newQuantity,
      };
      return updated;
    });
  };

  const handlePriceChange = (index: number, newPrice: number) => {
    setProducts((prevProducts) => {
      const updated = [...prevProducts];
      updated[index] = {
        ...updated[index],
        prixUnitaire: newPrice,
      };
      return updated;
    });
  };

  const handleRemoveProduct = (index: number) => {
    setProducts(products.filter((_, i) => i !== index));
  };

  const handleCreate = async () => {
    if (!salesperson) {
      toast.error('Veuillez sélectionner un vendeur');
      return;
    }

    if (products.length === 0) {
      toast.error('Veuillez ajouter au moins un produit');
      return;
    }

    // Validate that all products have quantities > 0
    const invalidProducts = products.filter((p) => p.quantity <= 0);
    if (invalidProducts.length > 0) {
      toast.error('Tous les produits doivent avoir une quantité supérieure à 0');
      return;
    }

    if (!isOnline()) {
      toast.error('Mode hors ligne - Impossible de créer une facture de retour');
      return;
    }

    try {
      await api.post('/return-invoices', {
        salespersonId: salesperson.id,
        lines: products.map((p) => ({
          productId: p.id,
          qte: p.quantity,
          prixUnitaire: p.prixUnitaire > 0 ? p.prixUnitaire : undefined,
        })),
      });

      toast.success('Facture de retour créée avec succès');
      navigate('/return-invoices');
    } catch (error: any) {
      console.error('Erreur lors de la création:', error);
      toast.error(error.response?.data?.message || 'Erreur lors de la création de la facture de retour');
    }
  };

  const totalAmount = products.reduce(
    (sum, p) => sum + p.quantity * p.prixUnitaire,
    0
  );

  return (
    <div className="pb-24 min-h-screen bg-background">
      <Header title="Nouvelle facture de retour" showSync={false} />
      <div className="container mx-auto px-5 py-6 space-y-5">
        {/* Salesperson Selection */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-sm text-muted-foreground mb-2">Vendeur</p>
                {salesperson ? (
                  <div>
                    <p className="font-semibold">{salesperson.firstName} {salesperson.lastName}</p>
                    <p className="text-xs text-muted-foreground">{salesperson.depotName}</p>
                    {salesperson.code && (
                      <p className="text-xs text-muted-foreground">Code: {salesperson.code}</p>
                    )}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">Aucun vendeur sélectionné</p>
                )}
              </div>
              <Button
                variant="outline"
                onClick={() => setSalespersonModalOpen(true)}
                className="ml-4"
              >
                <User className="h-4 w-4 mr-2" />
                {salesperson ? 'Changer' : 'Sélectionner'}
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
              disabled={!salesperson}
            >
              <Plus className="h-4 w-4 mr-2" />
              Ajouter
            </Button>
          </div>

          {products.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <Package className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground">Aucun produit ajouté</p>
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
                          <Input
                            type="number"
                            step="0.01"
                            min="0"
                            value={product.prixUnitaire || ''}
                            onChange={(e) => handlePriceChange(index, parseFloat(e.target.value) || 0)}
                            className="h-10"
                            placeholder="0.00"
                          />
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

        {/* Create Button */}
        <Button
          className="w-full"
          size="lg"
          onClick={handleCreate}
          disabled={!salesperson || products.length === 0 || !isOnline()}
        >
          Créer la facture de retour
        </Button>
      </div>

      {/* Modals */}
      <SalespersonSelectModal
        open={salespersonModalOpen}
        onOpenChange={setSalespersonModalOpen}
        onSelect={handleSalespersonSelect}
      />
      <ProductSelectModal
        open={productModalOpen}
        onOpenChange={setProductModalOpen}
        onSelect={handleProductSelect}
        salespersonId={salesperson?.id}
      />
    </div>
  );
}

