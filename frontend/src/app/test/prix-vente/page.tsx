'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { 
  Search, 
  Calculator,
  Loader2,
  Package,
  User,
  DollarSign,
  Calendar,
  Check,
  ChevronsUpDown,
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { toast } from 'sonner';
import { useBCItems } from '@/hooks/use-bc-items';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { cn } from '@/lib/utils';

interface BCItemPrice {
  id: number;
  itemId: string;
  itemNumber?: string | null;
  unitPrice: number;
  minimumQuantity?: number | null;
  salesType?: string | null;
  salesCode?: string | null;
  salesCodeName?: string | null;
  startingDate?: string | null;
  endingDate?: string | null;
  unitOfMeasureCode?: string | null;
  currencyCode?: string | null;
  variantCode?: string | null;
  bcItem?: {
    id: number;
    number?: string | null;
    displayName?: string | null;
  } | null;
}

interface PriceCalculationResult {
  itemNumber: string | null;
  itemName?: string;
  quantity: number;
  customerCode?: string;
  customerPriceGroup?: string;
  applicablePrice?: BCItemPrice;
  calculatedPrice: number;
  totalAmount: number;
  currency: string;
}

// Composant Combobox pour les articles BC
function ItemCombobox({
  items,
  selectedItemNumber,
  onSelect,
  placeholder = "Sélectionner un article",
  isLoading = false,
  searchQuery = '',
  onSearchChange,
}: {
  items: Array<{ id: number; number?: string | null; displayName?: string | null }>;
  selectedItemNumber?: string | null;
  onSelect: (itemNumber: string | null) => void;
  placeholder?: string;
  isLoading?: boolean;
  searchQuery?: string;
  onSearchChange?: (query: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [internalSearch, setInternalSearch] = useState('');

  const selectedItem = items.find((item) => item.number === selectedItemNumber);
  const displayValue = selectedItem
    ? `${selectedItem.number}${selectedItem.displayName ? ` - ${selectedItem.displayName}` : ''}`
    : placeholder;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between"
          disabled={isLoading}
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Chargement...
            </>
          ) : (
            <>
              {displayValue}
              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[400px] p-0" align="start">
        <Command shouldFilter={false}>
          <CommandInput 
            placeholder="Rechercher un article (min 2 caractères)..." 
            value={internalSearch}
            onValueChange={(value) => {
              setInternalSearch(value);
              // Déclencher la recherche dans useBCItems quand l'utilisateur tape dans le Combobox
              if (value.length >= 2 && onSearchChange) {
                onSearchChange(value);
              } else if (value.length === 0 && onSearchChange) {
                onSearchChange('');
              }
            }}
          />
          <CommandList>
            {items.length === 0 ? (
              <CommandEmpty>
                {isLoading ? 'Recherche en cours...' : 'Aucun article trouvé. Tapez au moins 2 caractères.'}
              </CommandEmpty>
            ) : (
              <CommandGroup>
                {items.map((item) => {
                  if (!item.number) return null;
                  const isSelected = selectedItemNumber === item.number;
                  const label = `${item.number}${item.displayName ? ` - ${item.displayName}` : ''}`;
                  return (
                    <CommandItem
                      key={item.id}
                      value={label}
                      onSelect={() => {
                        onSelect(item.number || null);
                        setOpen(false);
                      }}
                      className="cursor-pointer"
                    >
                      <Check
                        className={cn(
                          "mr-2 h-4 w-4",
                          isSelected ? "opacity-100" : "opacity-0"
                        )}
                      />
                      <div className="flex items-center gap-2">
                        <Package className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="font-medium text-sm">{item.number}</p>
                          {item.displayName && (
                            <p className="text-xs text-muted-foreground">{item.displayName}</p>
                          )}
                        </div>
                      </div>
                    </CommandItem>
                  );
                })}
              </CommandGroup>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

export default function PrixVentePage() {
  const [itemNumber, setItemNumber] = useState<string | null>(null);
  const [quantity, setQuantity] = useState<number>(1);
  const [customerCode, setCustomerCode] = useState('');
  const [customerPriceGroup, setCustomerPriceGroup] = useState('');
  const [calculationResult, setCalculationResult] = useState<PriceCalculationResult | null>(null);
  const [itemSearchQuery, setItemSearchQuery] = useState('');

  // Recherche des articles depuis bc_items (se déclenche quand itemSearchQuery a au moins 2 caractères)
  const { data: itemsData, isLoading: isLoadingItems } = useBCItems({
    search: itemSearchQuery.length >= 2 ? itemSearchQuery : undefined,
    limit: 100,
  });

  const items = itemsData?.data || [];

  // Recherche des prix par numéro d'article
  const { data: prices, isLoading: isLoadingPrices, refetch: refetchPrices } = useQuery<BCItemPrice[]>({
    queryKey: ['item-prices', itemNumber],
    queryFn: async () => {
      if (!itemNumber) return [];
      const response = await api.get(`/bc-item-prices/item-number/${itemNumber}`);
      return response.data;
    },
    enabled: !!itemNumber,
  });

  // Mettre à jour itemSearchQuery quand un article est sélectionné pour permettre la recherche
  const handleItemSelect = (selectedNumber: string | null) => {
    setItemNumber(selectedNumber);
    if (selectedNumber) {
      setItemSearchQuery(selectedNumber);
      refetchPrices();
    } else {
      setItemSearchQuery('');
    }
  };

  // Fonction pour calculer le prix
  const calculatePrice = () => {
    if (!itemNumber || !prices || prices.length === 0) {
      toast.error('Veuillez sélectionner un article et s\'assurer qu\'il a des prix');
      return;
    }

    if (quantity <= 0) {
      toast.error('La quantité doit être supérieure à 0');
      return;
    }

    const now = new Date();
    
    // Filtrer les prix applicables selon les critères
    const applicablePrices = prices.filter(price => {
      // Vérifier les dates de validité
      if (price.startingDate) {
        const startDate = new Date(price.startingDate);
        if (now < startDate) return false;
      }
      if (price.endingDate) {
        const endDate = new Date(price.endingDate);
        if (now > endDate) return false;
      }

      // Vérifier la quantité minimum
      if (price.minimumQuantity && quantity < Number(price.minimumQuantity)) {
        return false;
      }

      return true;
    });

    if (applicablePrices.length === 0) {
      toast.error('Aucun prix applicable trouvé pour cet article avec ces critères');
      return;
    }

    // Priorité de sélection du prix :
    // 1. Prix spécifique au client (si customerCode fourni)
    // 2. Prix du groupe de prix client (si customerPriceGroup fourni)
    // 3. Prix pour tous les clients
    let selectedPrice: BCItemPrice | null = null;

    if (customerCode) {
      selectedPrice = applicablePrices.find(
        p => p.salesType === 'Customer' && p.salesCode === customerCode
      ) || null;
    }

    if (!selectedPrice && customerPriceGroup) {
      selectedPrice = applicablePrices.find(
        p => p.salesType === 'Customer Price Group' && p.salesCode === customerPriceGroup
      ) || null;
    }

    if (!selectedPrice) {
      selectedPrice = applicablePrices.find(
        p => p.salesType === 'All Customers'
      ) || null;
    }

    // Si toujours pas de prix, prendre le premier prix applicable
    if (!selectedPrice) {
      selectedPrice = applicablePrices[0];
    }

    const unitPrice = Number(selectedPrice.unitPrice);
    const totalAmount = unitPrice * quantity;
    const currency = selectedPrice.currencyCode || 'TND';

    const result: PriceCalculationResult = {
      itemNumber: itemNumber || null,
      itemName: selectedPrice.bcItem?.displayName || undefined,
      quantity,
      customerCode: customerCode || undefined,
      customerPriceGroup: customerPriceGroup || undefined,
      applicablePrice: selectedPrice,
      calculatedPrice: unitPrice,
      totalAmount,
      currency,
    };

    setCalculationResult(result);
    toast.success('Prix calculé avec succès');
  };

  // Fonction pour formater le type de vente
  const formatSalesType = (type: string | null | undefined) => {
    if (!type) return 'Tous';
    const types: Record<string, string> = {
      'All Customers': 'Tous les clients',
      'Customer': 'Client',
      'Customer Price Group': 'Groupe de prix',
      'Campaign': 'Campagne',
    };
    return types[type] || type;
  };

  // Fonction pour déterminer le statut du prix
  const getPriceStatus = (price: BCItemPrice) => {
    const now = new Date();
    const startDate = price.startingDate ? new Date(price.startingDate) : null;
    const endDate = price.endingDate ? new Date(price.endingDate) : null;

    if (startDate && now < startDate) {
      return { label: 'À venir', color: 'bg-blue-100 text-blue-800' };
    }
    if (endDate && now > endDate) {
      return { label: 'Expiré', color: 'bg-gray-100 text-gray-800' };
    }
    return { label: 'Actif', color: 'bg-green-100 text-green-800' };
  };

  // Fonction pour formater la date
  const formatDate = (date: string | null | undefined) => {
    if (!date) return 'Sans date';
    try {
      const d = new Date(date);
      if (isNaN(d.getTime())) return 'Sans date';
      return d.toLocaleDateString('fr-FR');
    } catch {
      return 'Sans date';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Consultation et calcul des prix de vente</h1>
          <p className="text-muted-foreground mt-2">
            Recherchez un article et calculez son prix de vente selon les conditions applicables
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Formulaire de recherche et calcul */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calculator className="h-5 w-5" />
              Calcul du prix
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="item-combobox">Sélectionner un article</Label>
              <ItemCombobox
                items={items}
                selectedItemNumber={itemNumber || undefined}
                onSelect={handleItemSelect}
                placeholder="Sélectionner un article"
                isLoading={isLoadingItems && itemSearchQuery.length >= 2}
                searchQuery={itemSearchQuery}
                onSearchChange={setItemSearchQuery}
              />
              {itemNumber && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground p-2 bg-muted rounded-md">
                  <Package className="h-4 w-4" />
                  <span>Article sélectionné: <strong>{itemNumber}</strong></span>
                </div>
              )}
            </div>

            {isLoadingPrices && (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="h-5 w-5 animate-spin mr-2" />
                <span>Chargement des prix...</span>
              </div>
            )}

            {prices && prices.length > 0 && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="quantity">Quantité</Label>
                  <Input
                    id="quantity"
                    type="number"
                    min="1"
                    value={quantity}
                    onChange={(e) => setQuantity(Number(e.target.value))}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="customer-code">Code client (optionnel)</Label>
                  <Input
                    id="customer-code"
                    placeholder="Ex: CLT-00001"
                    value={customerCode}
                    onChange={(e) => setCustomerCode(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="price-group">Groupe de prix client (optionnel)</Label>
                  <Input
                    id="price-group"
                    placeholder="Ex: GPLOC-2025"
                    value={customerPriceGroup}
                    onChange={(e) => setCustomerPriceGroup(e.target.value)}
                  />
                </div>

                <Button
                  onClick={calculatePrice}
                  className="w-full"
                  size="lg"
                >
                  <Calculator className="h-4 w-4 mr-2" />
                  Calculer le prix
                </Button>
              </>
            )}

            {prices && prices.length === 0 && itemNumber && !isLoadingPrices && (
              <div className="text-center py-4 text-muted-foreground">
                Aucun prix trouvé pour cet article
              </div>
            )}
          </CardContent>
        </Card>

        {/* Résultat du calcul */}
        {calculationResult && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Résultat du calcul
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Article:</span>
                  <span className="font-semibold">{calculationResult.itemNumber}</span>
                </div>
                {calculationResult.itemName && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Nom:</span>
                    <span>{calculationResult.itemName}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Quantité:</span>
                  <span className="font-semibold">{calculationResult.quantity}</span>
                </div>
                {calculationResult.customerCode && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Client:</span>
                    <span>{calculationResult.customerCode}</span>
                  </div>
                )}
                {calculationResult.customerPriceGroup && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Groupe de prix:</span>
                    <span>{calculationResult.customerPriceGroup}</span>
                  </div>
                )}
                <div className="border-t pt-2 mt-2">
                  <div className="flex justify-between text-lg">
                    <span className="font-semibold">Prix unitaire:</span>
                    <span className="font-bold text-green-600">
                      {calculationResult.calculatedPrice.toLocaleString('fr-FR', {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })} {calculationResult.currency}
                    </span>
                  </div>
                  <div className="flex justify-between text-xl mt-2">
                    <span className="font-bold">Montant total:</span>
                    <span className="font-bold text-green-600">
                      {calculationResult.totalAmount.toLocaleString('fr-FR', {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })} {calculationResult.currency}
                    </span>
                  </div>
                </div>
                {calculationResult.applicablePrice && (
                  <div className="pt-2 border-t">
                    <p className="text-sm text-muted-foreground mb-2">Prix appliqué:</p>
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span>Type:</span>
                        <Badge variant="outline">
                          {formatSalesType(calculationResult.applicablePrice.salesType)}
                        </Badge>
                      </div>
                      {calculationResult.applicablePrice.minimumQuantity && (
                        <div className="flex justify-between">
                          <span>Qté min:</span>
                          <span>{Number(calculationResult.applicablePrice.minimumQuantity).toFixed(0)}</span>
                        </div>
                      )}
                      {calculationResult.applicablePrice.unitOfMeasureCode && (
                        <div className="flex justify-between">
                          <span>Unité:</span>
                          <span>{calculationResult.applicablePrice.unitOfMeasureCode}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Liste des prix disponibles */}
      {prices && prices.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Prix disponibles pour l'article {itemNumber}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="relative w-full overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Type</TableHead>
                    <TableHead>Client/Code</TableHead>
                    <TableHead>Unité</TableHead>
                    <TableHead className="text-right">Prix unitaire</TableHead>
                    <TableHead className="text-right">Qté min</TableHead>
                    <TableHead>Date début</TableHead>
                    <TableHead>Date expiration</TableHead>
                    <TableHead>Statut</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {prices.map((price) => {
                    const status = getPriceStatus(price);
                    const formatClientCode = () => {
                      if (!price.salesCode) return '-';
                      if (price.salesType === 'Customer') {
                        return `Client: ${price.salesCode}`;
                      }
                      if (price.salesType === 'Customer Price Group') {
                        return `Groupe: ${price.salesCode}`;
                      }
                      if (price.salesType === 'All Customers') {
                        return 'Tous les clients';
                      }
                      return price.salesCode;
                    };

                    return (
                      <TableRow key={price.id}>
                        <TableCell>
                          <Badge variant="outline" className="text-xs">
                            {formatSalesType(price.salesType)}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm">{formatClientCode()}</TableCell>
                        <TableCell className="text-sm">
                          <span className="font-medium">{price.unitOfMeasureCode || '-'}</span>
                        </TableCell>
                        <TableCell className="text-right">
                          <span className="font-semibold text-green-600">
                            {Number(price.unitPrice).toLocaleString('fr-FR', {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })} {price.currencyCode || 'TND'}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          <span className="font-medium">
                            {price.minimumQuantity != null ? Number(price.minimumQuantity).toFixed(0) : '-'}
                          </span>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {formatDate(price.startingDate)}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {formatDate(price.endingDate)}
                        </TableCell>
                        <TableCell>
                          <Badge className={status.color}>{status.label}</Badge>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

