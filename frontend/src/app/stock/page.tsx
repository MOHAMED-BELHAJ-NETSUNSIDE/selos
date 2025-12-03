'use client';

import { useState, useMemo, Suspense } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Pill, PillDelta } from '@/components/ui/pill';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { 
  Search, 
  RefreshCw, 
  Loader2, 
  ChevronLeft, 
  ChevronRight,
  Package,
  X,
  Check,
  ChevronsUpDown,
  Eye,
  History,
  User,
  Warehouse,
  TrendingUp,
  ArrowUp,
  ArrowDown,
} from 'lucide-react';
import { useStockConsultation, useStockTransactions, type StockConsultationItem } from '@/hooks/use-stock';
import { useSalespersons } from '@/hooks/use-salespersons';
import { useAvailableProducts } from '@/hooks/use-purchase-orders';
import { cn } from '@/lib/utils';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerFooter } from '@/components/ui/drawer';

// Composant Combobox pour les vendeurs
function SalespersonCombobox({
  salespersons,
  selectedId,
  onSelect,
  placeholder = "Sélectionner un vendeur",
}: {
  salespersons: Array<{ id: number; code: string | null; firstName: string; lastName: string }>;
  selectedId?: string;
  onSelect: (id: string) => void;
  placeholder?: string;
}) {
  const [open, setOpen] = useState(false);

  const selectedSalesperson = salespersons.find((sp) => String(sp.id) === selectedId);
  const displayValue = selectedSalesperson
    ? `${selectedSalesperson.code || ''} - ${selectedSalesperson.firstName} ${selectedSalesperson.lastName}`.trim()
    : placeholder;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between"
        >
          {displayValue}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0" align="start">
        <Command>
          <CommandInput placeholder="Rechercher un vendeur..." />
          <CommandList>
            <CommandEmpty>Aucun vendeur trouvé.</CommandEmpty>
            <CommandGroup>
              {salespersons.map((sp) => {
                const isSelected = selectedId === String(sp.id);
                const label = `${sp.code || ''} - ${sp.firstName} ${sp.lastName}`.trim();
                return (
                  <CommandItem
                    key={sp.id}
                    value={`${sp.code} ${sp.firstName} ${sp.lastName}`}
                    onSelect={() => {
                      onSelect(String(sp.id));
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
                    {label}
                  </CommandItem>
                );
              })}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

// Composant Combobox pour les produits
function ProductCombobox({
  products,
  selectedId,
  onSelect,
  placeholder = "Tous les produits",
}: {
  products: Array<{ id: number; designation: string; bcItem: { displayName: string | null; number: string | null } | null }>;
  selectedId?: string;
  onSelect: (id: string | null) => void;
  placeholder?: string;
}) {
  const [open, setOpen] = useState(false);

  const selectedProduct = products.find((p) => String(p.id) === selectedId);
  const displayValue = selectedProduct
    ? `${selectedProduct.bcItem?.displayName || selectedProduct.designation}${selectedProduct.bcItem?.number ? ` (${selectedProduct.bcItem.number})` : ''}`
    : placeholder;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between"
        >
          {displayValue}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0" align="start">
        <Command>
          <CommandInput placeholder="Rechercher un produit..." />
          <CommandList>
            <CommandEmpty>Aucun produit trouvé.</CommandEmpty>
            <CommandGroup>
              <CommandItem
                value="all"
                onSelect={() => {
                  onSelect(null);
                  setOpen(false);
                }}
                className="cursor-pointer"
              >
                <Check
                  className={cn(
                    "mr-2 h-4 w-4",
                    !selectedId ? "opacity-100" : "opacity-0"
                  )}
                />
                Tous les produits
              </CommandItem>
              {products.map((product) => {
                const isSelected = selectedId === String(product.id);
                const label = `${product.bcItem?.displayName || product.designation}${product.bcItem?.number ? ` (${product.bcItem.number})` : ''}`;
                return (
                  <CommandItem
                    key={product.id}
                    value={`${product.bcItem?.displayName || product.designation} ${product.bcItem?.number || ''}`}
                    onSelect={() => {
                      onSelect(String(product.id));
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
                    {label}
                  </CommandItem>
                );
              })}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

function StockPageContent() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const limit = 10;

  // États pour les filtres
  const [filters, setFilters] = useState({
    salespersonId: '',
    productId: '',
  });

  // États pour le drawer des transactions
  const [selectedItem, setSelectedItem] = useState<StockConsultationItem | null>(null);
  const [isTransactionsOpen, setIsTransactionsOpen] = useState(false);
  const [transactionsPage, setTransactionsPage] = useState(1);

  // Récupérer les données de stock - uniquement si un vendeur est sélectionné
  const { data: stockData, isLoading, error, refetch } = useStockConsultation(
    {
      search: search || undefined,
      salespersonId: filters.salespersonId ? Number(filters.salespersonId) : undefined,
      productId: filters.productId ? Number(filters.productId) : undefined,
      page,
      limit,
    },
    {
      enabled: !!filters.salespersonId, // Ne pas faire de requête si aucun vendeur n'est sélectionné
    }
  );

  // Récupérer la liste des vendeurs pour le filtre
  const { data: salespersonsData } = useSalespersons();
  
  // Récupérer la liste des produits pour le filtre
  const { data: productsData } = useAvailableProducts();

  const stockItems = stockData?.data || [];
  const total = stockData?.total || 0;
  const totalPages = Math.ceil(total / limit);

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPage(1);
  };

  const clearFilters = () => {
    setFilters({
      salespersonId: filters.salespersonId, // Ne pas réinitialiser le vendeur car il est obligatoire
      productId: '',
    });
    setSearch('');
    setPage(1);
  };

  const hasActiveFilters = filters.productId !== '' || search !== '';

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const openTransactions = (item: StockConsultationItem) => {
    setSelectedItem(item);
    setIsTransactionsOpen(true);
    setTransactionsPage(1);
  };

  const closeTransactions = () => {
    setIsTransactionsOpen(false);
    setSelectedItem(null);
    setTransactionsPage(1);
  };

  // Récupérer les transactions pour l'item sélectionné
  const { data: transactionsData, isLoading: isLoadingTransactions } = useStockTransactions(
    {
      productId: selectedItem?.product.id || 0,
      salespersonId: selectedItem?.salesperson.id || 0,
      page: transactionsPage,
      limit: 20,
    },
    {
      enabled: !!selectedItem && isTransactionsOpen,
    }
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Consultation du Stock</h1>
          <p className="text-gray-600 dark:text-gray-400">Consultez le stock actuel par item et dépôt</p>
        </div>
        <div className="flex space-x-2">
          <Button onClick={() => refetch()} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Actualiser
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Stock disponible</CardTitle>
            <div className="flex items-center space-x-2">
              {hasActiveFilters && (
                <Button variant="ghost" size="sm" onClick={clearFilters}>
                  <X className="h-4 w-4 mr-2" />
                  Réinitialiser les filtres
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Filtres */}
          <div className="mb-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium mb-2 block">
                  Vendeur <span className="text-red-500">*</span>
                </label>
                <SalespersonCombobox
                  salespersons={salespersonsData?.data || []}
                  selectedId={filters.salespersonId}
                  onSelect={(id) => handleFilterChange('salespersonId', id)}
                  placeholder="Sélectionner un vendeur"
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Produit</label>
                <ProductCombobox
                  products={productsData || []}
                  selectedId={filters.productId}
                  onSelect={(id) => handleFilterChange('productId', id || '')}
                  placeholder="Tous les produits"
                />
              </div>
            </div>
          </div>

          {/* Barre de recherche */}
          {filters.salespersonId && (
            <div className="mb-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Rechercher par item, code..."
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setPage(1);
                  }}
                  className="pl-10"
                />
              </div>
            </div>
          )}

          {/* Message si aucun vendeur n'est sélectionné */}
          {!filters.salespersonId && (
            <div className="text-center py-12">
              <Package className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <p className="text-gray-600 dark:text-gray-400 text-lg font-medium">
                Veuillez sélectionner un vendeur pour consulter son stock
              </p>
            </div>
          )}

          {/* Table */}
          {filters.salespersonId && (
            <>
              {isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
                </div>
              ) : error ? (
                <div className="text-center py-12 text-red-600">
                  Erreur lors du chargement des données
                </div>
              ) : stockItems.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  Aucun stock trouvé pour ce vendeur
                </div>
              ) : (
                <>
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Item (BC)</TableHead>
                          <TableHead>Code Item</TableHead>
                          <TableHead>Vendeur</TableHead>
                          <TableHead>Code Vendeur</TableHead>
                          <TableHead>Dépôt</TableHead>
                          <TableHead className="text-right">Quantité</TableHead>
                          <TableHead>Unité</TableHead>
                          <TableHead>Dernière mise à jour</TableHead>
                          <TableHead>Statut</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {stockItems.map((item: StockConsultationItem) => (
                          <TableRow key={item.id}>
                            <TableCell className="font-medium">
                              {item.product.bcItem?.displayName || item.product.designation}
                            </TableCell>
                            <TableCell>
                              {item.product.bcItem?.number || item.product.ref || '-'}
                            </TableCell>
                            <TableCell>
                              {item.salesperson.firstName} {item.salesperson.lastName}
                            </TableCell>
                            <TableCell>
                              {item.salesperson.code || '-'}
                            </TableCell>
                            <TableCell>
                              {item.salesperson.depotName}
                            </TableCell>
                            <TableCell className="text-right font-semibold">
                              {item.totalStock.toLocaleString('fr-FR', {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                              })}
                            </TableCell>
                            <TableCell>
                              {item.product.bcItem?.baseUnitOfMeasure || '-'}
                            </TableCell>
                            <TableCell className="text-sm text-gray-500">
                              {formatDate(item.lastUpdated)}
                            </TableCell>
                            <TableCell>
                              <Badge variant={item.salesperson.statut === 'actif' ? 'default' : 'secondary'}>
                                {item.salesperson.statut}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => openTransactions(item)}
                              >
                                <History className="h-4 w-4 mr-2" />
                                Transactions
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>

                  {/* Pagination */}
                  {totalPages > 1 && (
                    <div className="flex items-center justify-between mt-4">
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        Affichage de {(page - 1) * limit + 1} à {Math.min(page * limit, total)} sur {total} résultats
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setPage(p => Math.max(1, p - 1))}
                          disabled={page === 1}
                        >
                          <ChevronLeft className="h-4 w-4" />
                          Précédent
                        </Button>
                        <div className="text-sm">
                          Page {page} sur {totalPages}
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                          disabled={page === totalPages}
                        >
                          Suivant
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Drawer des transactions */}
      <Drawer open={isTransactionsOpen} onOpenChange={setIsTransactionsOpen}>
        <DrawerContent 
          side="right" 
          className="h-full flex flex-col"
          style={{ width: '60vw', maxWidth: '60vw' }}
        >
          <DrawerHeader className="border-b pb-4">
            <DrawerTitle className="text-2xl font-bold flex items-center gap-2 mb-4">
              <History className="h-6 w-6" />
              Historique des transactions
            </DrawerTitle>
            {selectedItem && (
              <div className="flex items-start justify-between gap-4 mt-4">
                <div className="space-y-3 flex-1">
                  <div className="flex items-center gap-2">
                    <Package className="h-4 w-4 text-gray-500" />
                    <span className="text-sm text-gray-500">Produit:</span>
                    <span className="text-sm font-semibold">
                      {selectedItem.product.bcItem?.displayName || selectedItem.product.designation}
                      {selectedItem.product.bcItem?.number && (
                        <span className="text-gray-500 ml-2">({selectedItem.product.bcItem.number})</span>
                      )}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-gray-500" />
                    <span className="text-sm text-gray-500">Vendeur:</span>
                    <span className="text-sm font-semibold">
                      {selectedItem.salesperson.firstName} {selectedItem.salesperson.lastName}
                      {selectedItem.salesperson.code && (
                        <span className="text-gray-500 ml-2">({selectedItem.salesperson.code})</span>
                      )}
                    </span>
                    {selectedItem.salesperson.depotName && (
                      <>
                        <span className="text-gray-300">|</span>
                        <Warehouse className="h-4 w-4 text-gray-500" />
                        <span className="text-sm text-gray-500">{selectedItem.salesperson.depotName}</span>
                      </>
                    )}
                  </div>
                </div>
                <Badge variant="outline" className="px-3 py-2">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-3.5 w-3.5 text-gray-500" />
                    <span className="text-xs text-gray-500">Stock actuel:</span>
                    <span className="text-sm font-bold">
                      {selectedItem.totalStock.toLocaleString('fr-FR', { 
                        minimumFractionDigits: 2, 
                        maximumFractionDigits: 2 
                      })}
                      {selectedItem.product.bcItem?.baseUnitOfMeasure && (
                        <span className="text-gray-500 ml-1 font-normal">
                          {selectedItem.product.bcItem.baseUnitOfMeasure}
                        </span>
                      )}
                    </span>
                  </div>
                </Badge>
              </div>
            )}
          </DrawerHeader>
          <div className="flex-1 overflow-y-auto p-6">
            {isLoadingTransactions ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
              </div>
            ) : transactionsData?.data.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                Aucune transaction trouvée
              </div>
            ) : (
              <>
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead className="text-right">Quantité</TableHead>
                        <TableHead>Référence</TableHead>
                        <TableHead>Bon de commande</TableHead>
                        <TableHead>Bon de livraison</TableHead>
                        <TableHead>Facture de retour</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {transactionsData?.data.map((transaction) => (
                        <TableRow key={transaction.id}>
                          <TableCell className="text-sm">
                            {formatDate(transaction.createdAt)}
                          </TableCell>
                          <TableCell>
                            <Pill>
                              <PillDelta delta={transaction.type === 'entree' ? 1 : -1} />
                              {transaction.type === 'entree' ? 'Entrée' : 'Sortie'}
                            </Pill>
                          </TableCell>
                          <TableCell className="text-right font-medium">
                            {transaction.qte.toLocaleString('fr-FR', {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })}
                          </TableCell>
                          <TableCell>
                            {transaction.reference || '-'}
                          </TableCell>
                          <TableCell>
                            {transaction.purchaseOrder ? (
                              <span className="text-blue-600 font-medium">
                                {transaction.purchaseOrder.numero}
                              </span>
                            ) : (
                              '-'
                            )}
                          </TableCell>
                          <TableCell>
                            {transaction.deliveryNote ? (
                              <span className="text-green-600 font-medium">
                                {transaction.deliveryNote.numero}
                              </span>
                            ) : (
                              '-'
                            )}
                          </TableCell>
                          <TableCell>
                            {transaction.returnInvoice ? (
                              <div className="flex flex-col">
                                <span className="text-purple-600 font-medium">
                                  {transaction.returnInvoice.numero}
                                </span>
                                {transaction.returnInvoice.bcNumber && (
                                  <span className="text-xs text-gray-500">
                                    BC: {transaction.returnInvoice.bcNumber}
                                  </span>
                                )}
                              </div>
                            ) : (
                              '-'
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                {/* Pagination des transactions */}
                {transactionsData && transactionsData.total > 0 && (
                  <div className="flex items-center justify-between mt-4">
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      Affichage de {(transactionsPage - 1) * transactionsData.limit + 1} à {Math.min(transactionsPage * transactionsData.limit, transactionsData.total)} sur {transactionsData.total} résultats
                    </div>
                    {Math.ceil(transactionsData.total / transactionsData.limit) > 1 && (
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setTransactionsPage(p => Math.max(1, p - 1))}
                          disabled={transactionsPage === 1 || isLoadingTransactions}
                        >
                          <ChevronLeft className="h-4 w-4" />
                          Précédent
                        </Button>
                        <div className="text-sm">
                          Page {transactionsPage} sur {Math.ceil(transactionsData.total / transactionsData.limit)}
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setTransactionsPage(p => Math.min(Math.ceil(transactionsData.total / transactionsData.limit), p + 1))}
                          disabled={transactionsPage >= Math.ceil(transactionsData.total / transactionsData.limit) || isLoadingTransactions}
                        >
                          Suivant
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
          <DrawerFooter className="border-t">
            <Button variant="outline" onClick={closeTransactions}>
              Fermer
            </Button>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    </div>
  );
}

export default function StockPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    }>
      <StockPageContent />
    </Suspense>
  );
}

