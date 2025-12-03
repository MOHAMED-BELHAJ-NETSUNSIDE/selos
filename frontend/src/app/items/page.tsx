'use client';

import { useState, useMemo, useEffect, Suspense } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerFooter } from '@/components/ui/drawer';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { 
  Search, 
  Eye, 
  RefreshCw, 
  Loader2, 
  ChevronLeft, 
  ChevronRight,
  Calendar,
  XCircle,
  Filter,
  X,
  CheckCircle2,
  Ban,
  Package,
  ShoppingCart,
} from 'lucide-react';
import { useBCItems, useBCItem, useSyncBCItems, type BCItem } from '@/hooks/use-bc-items';
import { useBCItemPrices } from '@/hooks/use-bc-item-prices';
import { useSearchParams } from 'next/navigation';
import { toast } from 'sonner';

// Composant pour afficher les prix de vente
function ItemPricesTab({ itemId, itemNumber }: { itemId: string; itemNumber?: string | null }) {
  const { data: prices, isLoading, error } = useBCItemPrices(itemId);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin" />
        <span className="ml-2">Chargement des prix...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8 text-red-500">
        Erreur lors du chargement des prix: {error instanceof Error ? error.message : 'Erreur inconnue'}
      </div>
    );
  }

  if (!prices || prices.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        Aucun prix de vente disponible pour cet article
      </div>
    );
  }

  // Fonction pour déterminer le statut du prix
  const getPriceStatus = (price: typeof prices[0]) => {
    const now = new Date();
    const startDate = price.startingDate ? new Date(price.startingDate) : null;
    const endDate = price.endingDate ? new Date(price.endingDate) : null;

    if (startDate && now < startDate) {
      return { label: 'À venir', color: 'bg-blue-100 text-blue-800' };
    }
    if (endDate && now > endDate) {
      return { label: 'Expiré', color: 'bg-gray-100 text-gray-800' };
    }
    if (endDate && now <= endDate) {
      return { label: 'Actif', color: 'bg-green-100 text-green-800' };
    }
    return { label: 'Actif', color: 'bg-green-100 text-green-800' };
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

  // Fonction pour formater le client/code
  const formatClientCode = (price: typeof prices[0]) => {
    if (!price.salesCode) return '-';
    if (price.salesType === 'Customer') {
      return `Client: ${price.salesCode}`;
    }
    if (price.salesType === 'Customer Price Group') {
      return `Customer Price Group: ${price.salesCode}`;
    }
    if (price.salesType === 'All Customers') {
      return 'Tous les clients';
    }
    return price.salesCode;
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Liste des prix de vente</h3>
        <Badge variant="outline">{prices.length} prix</Badge>
      </div>

      <div className="relative w-full overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date début</TableHead>
              <TableHead>Date expiration</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Client/Code</TableHead>
              <TableHead>Unité</TableHead>
              <TableHead className="text-right">Prix unitaire</TableHead>
              <TableHead className="text-right">Qté min</TableHead>
              <TableHead>Statut</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {prices.map((price) => {
              const status = getPriceStatus(price);
              return (
                <TableRow key={price.id}>
                  <TableCell className="text-sm text-muted-foreground">
                    {formatDate(price.startingDate)}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {formatDate(price.endingDate)}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-xs">
                      {formatSalesType(price.salesType)}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm">
                    {formatClientCode(price)}
                  </TableCell>
                  <TableCell className="text-sm">
                    <span className="font-medium">{price.unitOfMeasureCode || '-'}</span>
                  </TableCell>
                  <TableCell className="text-right">
                    <div>
                      <span className="font-semibold text-green-600">
                        {Number(price.unitPrice).toLocaleString('fr-FR', {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}&nbsp;{price.currencyCode || 'TND'}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <span className="font-medium">
                      {price.minimumQuantity != null ? Number(price.minimumQuantity).toFixed(0) : '-'}
                    </span>
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
    </div>
  );
}

function ItemsPageContent() {
  const searchParams = useSearchParams();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [selectedItemId, setSelectedItemId] = useState<number | null>(null);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  // États pour les filtres par colonne
  const [filters, setFilters] = useState({
    number: '',
    displayName: '',
    type: '',
    itemCategoryCode: '',
    blocked: '',
  });

  // Récupérer les items avec filtrage
  const { data: itemsData, isLoading, error } = useBCItems({
    search: search || undefined,
  });
  const syncMutation = useSyncBCItems();
  const { data: itemDetails, isLoading: isLoadingDetails } = useBCItem(selectedItemId);

  const items = itemsData?.data || [];
  const total = itemsData?.count || 0;

  // Filtrage côté client avec les filtres avancés
  const filteredItems = useMemo(() => {
    let filtered = items;

    // Appliquer les filtres par colonne
    if (filters.number) {
      filtered = filtered.filter((i) => 
        i.number?.toLowerCase().includes(filters.number.toLowerCase())
      );
    }
    if (filters.displayName) {
      filtered = filtered.filter((i) => 
        i.displayName?.toLowerCase().includes(filters.displayName.toLowerCase())
      );
    }
    if (filters.type) {
      filtered = filtered.filter((i) => 
        i.type?.toLowerCase().includes(filters.type.toLowerCase())
      );
    }
    if (filters.itemCategoryCode) {
      filtered = filtered.filter((i) => 
        i.itemCategoryCode?.toLowerCase().includes(filters.itemCategoryCode.toLowerCase())
      );
    }
    if (filters.blocked !== '') {
      const isBlocked = filters.blocked === 'true';
      filtered = filtered.filter((i) => i.blocked === isBlocked);
    }

    // Pagination
    const start = (page - 1) * 10;
    return {
      items: filtered.slice(start, start + 10),
      total: filtered.length,
      pages: Math.max(1, Math.ceil(filtered.length / 10)),
    };
  }, [items, filters, page]);

  const handleSync = async () => {
    try {
      await syncMutation.mutateAsync();
    } catch (error) {
      console.error('Sync error:', error);
    }
  };

  const handleView = (item: BCItem) => {
    setSelectedItemId(item.id);
    setIsViewOpen(true);
  };

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPage(1);
  };

  const clearFilters = () => {
    setFilters({
      number: '',
      displayName: '',
      type: '',
      itemCategoryCode: '',
      blocked: '',
    });
    setPage(1);
  };

  const hasActiveFilters = Object.values(filters).some(v => v !== '');

  // Auto-sync si le paramètre sync=true est présent
  useEffect(() => {
    const shouldSync = searchParams.get('sync') === 'true';
    if (shouldSync && !syncMutation.isPending) {
      handleSync();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-900">Articles Business Central</h1>
          <p className="text-gray-600 dark:text-gray-900">Gérez les articles synchronisés depuis Business Central</p>
        </div>
        <div className="flex space-x-2">
          <Button onClick={handleSync} disabled={syncMutation.isPending} variant="outline">
            <RefreshCw className={`h-4 w-4 mr-2 ${syncMutation.isPending ? 'animate-spin' : ''}`} />
            {syncMutation.isPending ? 'Synchronisation...' : 'Synchroniser BC'}
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center space-x-4">
            <div className="flex-1">
              <div className="relative">
                <Input 
                  placeholder="Rechercher..." 
                  value={search} 
                  onChange={(e) => { setSearch(e.target.value); setPage(1); }} 
                />
              </div>
            </div>
            <Button
              variant={showFilters ? "default" : "outline"}
              onClick={() => setShowFilters(!showFilters)}
            >
              <Filter className="mr-2 h-4 w-4" />
              Filtres
              {hasActiveFilters && (
                <span className="ml-2 bg-red-500 text-white rounded-full px-2 py-0.5 text-xs">
                  {Object.values(filters).filter(v => v !== '').length}
                </span>
              )}
            </Button>
          </div>
          {showFilters && (
            <div className="mt-4 p-4 bg-muted rounded-lg space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold">Filtres par colonne</h3>
                {hasActiveFilters && (
                  <Button variant="ghost" size="sm" onClick={clearFilters}>
                    <X className="mr-2 h-4 w-4" />
                    Réinitialiser
                  </Button>
                )}
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                <div>
                  <label className="text-sm font-medium mb-1 block">Code</label>
                  <Input
                    placeholder="Filtrer par code..."
                    value={filters.number}
                    onChange={(e) => handleFilterChange('number', e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">Nom</label>
                  <Input
                    placeholder="Filtrer par nom..."
                    value={filters.displayName}
                    onChange={(e) => handleFilterChange('displayName', e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">Type</label>
                  <Input
                    placeholder="Filtrer par type..."
                    value={filters.type}
                    onChange={(e) => handleFilterChange('type', e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">Catégorie</label>
                  <Input
                    placeholder="Filtrer par catégorie..."
                    value={filters.itemCategoryCode}
                    onChange={(e) => handleFilterChange('itemCategoryCode', e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">Statut</label>
                  <select
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    value={filters.blocked}
                    onChange={(e) => handleFilterChange('blocked', e.target.value)}
                  >
                    <option value="">Tous</option>
                    <option value="false">Actif</option>
                    <option value="true">Bloqué</option>
                  </select>
                </div>
              </div>
            </div>
          )}
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="py-8 text-center">Chargement...</div>
          ) : error ? (
            <div className="py-8 text-center text-red-500">
              Erreur lors du chargement des articles: {error instanceof Error ? error.message : 'Erreur inconnue'}
            </div>
          ) : !filteredItems.items || filteredItems.items.length === 0 ? (
            <div className="py-8 text-center text-gray-500">
              Aucun article trouvé
              {(search || hasActiveFilters) && ' avec les filtres appliqués'}
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Code</TableHead>
                    <TableHead>Nom</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Catégorie</TableHead>
                    <TableHead>Unité</TableHead>
                    <TableHead>Prix unitaire</TableHead>
                    <TableHead>Stock</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead>Dernière Modif</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredItems.items.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">
                        <Badge variant="secondary">{item.number || '—'}</Badge>
                      </TableCell>
                      <TableCell>{item.displayName || '—'}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{item.type || '—'}</Badge>
                      </TableCell>
                      <TableCell>{item.itemCategoryCode || '—'}</TableCell>
                      <TableCell>{item.baseUnitOfMeasure || '—'}</TableCell>
                      <TableCell>
                        {item.unitPrice ? (
                          <span className="flex items-center space-x-1">
                            <span>{Number(item.unitPrice).toFixed(2)} TND</span>
                          </span>
                        ) : (
                          '—'
                        )}
                      </TableCell>
                      <TableCell>
                        {item.inventory !== null && item.inventory !== undefined ? (
                          <span className="flex items-center space-x-1">
                            <Package className="h-3 w-3" />
                            <span>{Number(item.inventory).toFixed(2)}</span>
                          </span>
                        ) : (
                          '—'
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          {item.blocked ? (
                            <>
                              <Ban className="h-4 w-4 text-red-600" />
                              <span className="text-sm text-red-600">Bloqué</span>
                            </>
                          ) : (
                            <>
                              <CheckCircle2 className="h-4 w-4 text-green-600" />
                              <span className="text-sm text-green-600">Actif</span>
                            </>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {item.lastModified ? (
                          <span className="text-sm text-gray-600 flex items-center space-x-1">
                            <Calendar className="h-3 w-3" />
                            <span>{new Date(item.lastModified).toLocaleDateString('fr-FR')}</span>
                          </span>
                        ) : (
                          '—'
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">⋮</Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleView(item)}>
                              <Eye className="mr-2 h-4 w-4" />
                              Consulter
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {filteredItems.pages > 1 && (
                <div className="flex items-center justify-between mt-4">
                  <div className="text-sm text-gray-500">
                    Page {page} sur {filteredItems.pages} ({filteredItems.total} résultat(s))
                  </div>
                  <div className="flex space-x-2">
                    <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}>
                      <ChevronLeft className="mr-2 h-4 w-4" />
                      Précédent
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.min(filteredItems.pages, p + 1))} disabled={page === filteredItems.pages}>
                      Suivant
                      <ChevronRight className="ml-2 h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      <Drawer open={isViewOpen} onOpenChange={setIsViewOpen}>
        <DrawerContent
          side="right"
          className="h-full flex flex-col"
          style={{ width: '60vw', maxWidth: '60vw' }}
        >
          <DrawerHeader>
            <DrawerTitle>Détails de l'article Business Central</DrawerTitle>
          </DrawerHeader>
          <div className="flex-1 overflow-y-auto px-6 py-4">
            {isLoadingDetails ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin" />
                <span className="ml-2">Chargement...</span>
              </div>
            ) : itemDetails ? (
              <Tabs defaultValue="informations" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="informations">Informations</TabsTrigger>
                  <TabsTrigger value="prix">Prix & Stock</TabsTrigger>
                  <TabsTrigger value="prix-vente">Prix de vente</TabsTrigger>
                </TabsList>

                <TabsContent value="informations" className="mt-4 space-y-6">
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Informations générales</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Code BC</p>
                        <p className="text-base">{itemDetails.bcId}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Numéro</p>
                        <p className="text-base">{itemDetails.number || '—'}</p>
                      </div>
                      <div className="col-span-2">
                        <p className="text-sm font-medium text-muted-foreground">Nom</p>
                        <p className="text-base font-semibold">{itemDetails.displayName || '—'}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Type</p>
                        <p className="text-base">{itemDetails.type || '—'}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Statut</p>
                        <div className="flex items-center space-x-2">
                          {itemDetails.blocked ? (
                            <>
                              <Ban className="h-4 w-4 text-red-600" />
                              <span className="text-sm text-red-600">Bloqué</span>
                            </>
                          ) : (
                            <>
                              <CheckCircle2 className="h-4 w-4 text-green-600" />
                              <span className="text-sm text-green-600">Actif</span>
                            </>
                          )}
                        </div>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Catégorie</p>
                        <p className="text-base">{itemDetails.itemCategoryCode || '—'}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Unité de mesure</p>
                        <p className="text-base">{itemDetails.baseUnitOfMeasure || '—'}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">GTIN</p>
                        <p className="text-base">{itemDetails.gtin || '—'}</p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4 pt-4 border-t">
                    <h3 className="text-lg font-semibold">Informations système</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Date de création</p>
                        <p className="text-sm">{new Date(itemDetails.createdAt).toLocaleDateString('fr-FR')}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Dernière modification</p>
                        <p className="text-sm">{itemDetails.lastModified ? new Date(itemDetails.lastModified).toLocaleDateString('fr-FR') : '—'}</p>
                      </div>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="prix" className="mt-4 space-y-6">
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Prix & Coûts</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Prix unitaire</p>
                        {itemDetails.unitPrice ? (
                          <p className="text-base font-semibold">
                            {Number(itemDetails.unitPrice).toFixed(2)} TND
                          </p>
                        ) : (
                          <p className="text-base">—</p>
                        )}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Coût unitaire</p>
                        {itemDetails.unitCost ? (
                          <p className="text-base font-semibold">
                            {Number(itemDetails.unitCost).toFixed(2)} TND
                          </p>
                        ) : (
                          <p className="text-base">—</p>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4 pt-4 border-t">
                    <h3 className="text-lg font-semibold">Stock</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Inventaire</p>
                        {itemDetails.inventory !== null && itemDetails.inventory !== undefined ? (
                          <p className="text-base font-semibold flex items-center space-x-1">
                            <Package className="h-4 w-4" />
                            <span>{Number(itemDetails.inventory).toFixed(2)}</span>
                          </p>
                        ) : (
                          <p className="text-base">—</p>
                        )}
                      </div>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="prix-vente" className="mt-4 space-y-6">
                  <ItemPricesTab itemId={itemDetails.bcId} itemNumber={itemDetails.number} />
                </TabsContent>
              </Tabs>
            ) : (
              <div className="text-center py-8 text-gray-500">Aucune information disponible</div>
            )}
          </div>
          <DrawerFooter className="border-t pt-4">
            <Button variant="outline" onClick={() => setIsViewOpen(false)}>
              <XCircle className="mr-2 h-4 w-4" />
              Fermer
            </Button>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    </div>
  );
}

export default function ItemsPage() {
  return (
    <Suspense fallback={<div>Chargement des paramètres de recherche...</div>}>
      <ItemsPageContent />
    </Suspense>
  );
}

