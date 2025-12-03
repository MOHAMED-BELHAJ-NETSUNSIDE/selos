'use client';

import { useState, Suspense } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
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
  Store,
} from 'lucide-react';
import { useStockByLocation, type StockByLocationItem } from '@/hooks/use-stock';
import { useBCLocations } from '@/hooks/use-bc-locations';
import { useBCItems } from '@/hooks/use-bc-items';
import { useSession } from 'next-auth/react';
import { cn } from '@/lib/utils';
import { useEffect } from 'react';

// Composant Combobox pour les magasins
function LocationCombobox({
  locations,
  selectedId,
  onSelect,
  placeholder = "Tous les magasins",
  showAllOption = true,
}: {
  locations: Array<{ id: number; bcId: string; code: string | null; displayName: string | null }>;
  selectedId?: string;
  onSelect: (id: string | null) => void;
  placeholder?: string;
  showAllOption?: boolean;
}) {
  const [open, setOpen] = useState(false);

  const selectedLocation = locations.find((loc) => loc.bcId === selectedId);
  const displayValue = selectedLocation
    ? `${selectedLocation.code || ''} - ${selectedLocation.displayName || ''}`.trim()
    : placeholder;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between"
          disabled={locations.length === 1 && !showAllOption}
        >
          {displayValue}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0" align="start">
        <Command>
          <CommandInput placeholder="Rechercher un magasin..." />
          <CommandList>
            <CommandEmpty>Aucun magasin trouvé.</CommandEmpty>
            <CommandGroup>
              {showAllOption && (
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
                  Tous les magasins
                </CommandItem>
              )}
              {locations.map((loc) => {
                const isSelected = selectedId === loc.bcId;
                const label = `${loc.code || ''} - ${loc.displayName || ''}`.trim();
                return (
                  <CommandItem
                    key={loc.bcId}
                    value={`${loc.code} ${loc.displayName}`}
                    onSelect={() => {
                      onSelect(loc.bcId);
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

// Composant Combobox pour les articles BC
function BCItemCombobox({
  items,
  selectedId,
  onSelect,
  placeholder = "Tous les articles",
}: {
  items: Array<{ id: number; bcId: string; number: string | null; displayName: string | null }>;
  selectedId?: string;
  onSelect: (id: string | null) => void;
  placeholder?: string;
}) {
  const [open, setOpen] = useState(false);

  const selectedItem = items.find((item) => item.bcId === selectedId);
  const displayValue = selectedItem
    ? `${selectedItem.number || ''} - ${selectedItem.displayName || ''}`.trim()
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
          <CommandInput placeholder="Rechercher un article..." />
          <CommandList>
            <CommandEmpty>Aucun article trouvé.</CommandEmpty>
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
                Tous les articles
              </CommandItem>
              {items.map((item) => {
                const isSelected = selectedId === item.bcId;
                const label = `${item.number || ''} - ${item.displayName || ''}`.trim();
                return (
                  <CommandItem
                    key={item.bcId}
                    value={`${item.number} ${item.displayName}`}
                    onSelect={() => {
                      onSelect(item.bcId);
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

function StockByLocationPageContent() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const limit = 20;

  // États pour les filtres
  const [filters, setFilters] = useState({
    locationId: '',
    itemId: '',
  });

  // Récupérer le bcLocationId de l'utilisateur connecté
  const { data: session } = useSession();
  const userBcLocationId = (session?.user as any)?.bcLocationId || null;

  // Récupérer les données de stock par magasin
  const { data: stockData, isLoading, error, refetch } = useStockByLocation(
    {
      search: search || undefined,
      locationId: filters.locationId || undefined,
      bcItemId: filters.itemId || undefined,
      page,
      limit,
    }
  );

  // Récupérer la liste des magasins pour le filtre
  const { data: locationsData } = useBCLocations();
  const allLocations = locationsData?.data || [];
  
  // Filtrer les magasins : si l'utilisateur a un magasin, afficher uniquement ce magasin
  const locations = userBcLocationId
    ? allLocations.filter(loc => loc.bcId === userBcLocationId)
    : allLocations;
  
  // Récupérer la liste des articles BC pour le filtre (le backend retourne déjà tous les articles)
  const { data: itemsData, isLoading: isLoadingItems } = useBCItems();
  const items = itemsData?.data || [];

  // Pré-sélectionner le magasin de l'utilisateur s'il en a un
  useEffect(() => {
    if (userBcLocationId && !filters.locationId) {
      setFilters(prev => ({ ...prev, locationId: userBcLocationId }));
    }
  }, [userBcLocationId]);

  const stockItems = stockData?.data || [];
  const total = stockData?.total || 0;
  const totalPages = Math.ceil(total / limit);

  const handleFilterChange = (key: string, value: string | null) => {
    setFilters(prev => ({ ...prev, [key]: value || '' }));
    setPage(1);
  };

  const clearFilters = () => {
    // Ne pas réinitialiser l'article car il est obligatoire
    setFilters({
      locationId: '',
      itemId: filters.itemId, // Conserver l'article sélectionné
    });
    setSearch('');
    setPage(1);
  };

  const hasActiveFilters = filters.locationId !== '' || search !== '';

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
            Stock par article et magasin
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Consultez le stock des produits par magasin depuis Business Central
          </p>
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
            <CardTitle className="flex items-center gap-2">
              <Store className="h-5 w-5" />
              Stock par magasin
            </CardTitle>
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
                  Article <span className="text-red-500">*</span>
                </label>
                {isLoadingItems ? (
                  <div className="flex items-center gap-2 p-2 border rounded-lg">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span className="text-sm text-muted-foreground">Chargement des articles...</span>
                  </div>
                ) : (
                  <>
                    <BCItemCombobox
                      items={items.map(item => ({
                        ...item,
                        number: item.number ?? null,
                        displayName: item.displayName ?? null,
                      }))}
                      selectedId={filters.itemId}
                      onSelect={(id) => handleFilterChange('itemId', id || '')}
                      placeholder="Sélectionner un article (obligatoire)"
                    />
                    {items.length > 0 && (
                      <p className="text-xs text-muted-foreground mt-1">
                        {items.length} article{items.length > 1 ? 's' : ''} disponible{items.length > 1 ? 's' : ''}
                      </p>
                    )}
                  </>
                )}
                {!filters.itemId && !isLoadingItems && (
                  <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">
                    Veuillez sélectionner un article pour afficher le stock
                  </p>
                )}
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Magasin</label>
                <LocationCombobox
                  locations={locations.map(loc => ({
                    ...loc,
                    code: loc.code ?? null,
                    displayName: loc.displayName ?? null,
                  }))}
                  selectedId={filters.locationId}
                  onSelect={(id) => handleFilterChange('locationId', id || '')}
                  placeholder="Tous les magasins"
                  showAllOption={!userBcLocationId}
                />
                {userBcLocationId && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Votre magasin est automatiquement sélectionné
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Message si aucun article sélectionné */}
          {!filters.itemId ? (
            <div className="text-center py-12">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-amber-100 dark:bg-amber-900/20 mb-4">
                <Package className="h-8 w-8 text-amber-600 dark:text-amber-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                Sélectionnez un article
              </h3>
              <p className="text-gray-600 dark:text-gray-400 max-w-md mx-auto">
                Veuillez sélectionner un article dans le filtre ci-dessus pour afficher le stock par magasin.
                <br />
                <span className="text-sm text-gray-500 dark:text-gray-500">
                  Cette restriction permet d'éviter de surcharger l'API Business Central.
                </span>
              </p>
            </div>
          ) : (
            <>
              {/* Barre de recherche */}
              <div className="mb-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="Rechercher par magasin, code..."
                    value={search}
                    onChange={(e) => {
                      setSearch(e.target.value);
                      setPage(1);
                    }}
                    className="pl-10"
                  />
                </div>
              </div>

              {/* Table */}
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
                  Aucun stock trouvé pour cet article
                </div>
              ) : (
                <>
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Article (BC)</TableHead>
                          <TableHead>Code Article</TableHead>
                          <TableHead>Magasin</TableHead>
                          <TableHead className="text-right">Stock</TableHead>
                          <TableHead>Unité</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {stockItems.map((item: StockByLocationItem) => {
                          return (
                            <TableRow key={`${item.id}-${item.location?.bcId || 'no-location'}`}>
                              <TableCell className="font-medium">
                                {item.bcItem.displayName || '-'}
                              </TableCell>
                              <TableCell>
                                {item.bcItem.number || '-'}
                              </TableCell>
                              <TableCell className="font-medium">
                                <div className="flex items-center gap-2">
                                  <Store className="h-4 w-4 text-gray-400" />
                                  <div>
                                    <div>{item.location?.displayName || '-'}</div>
                                    {item.location?.code && (
                                      <div className="text-xs text-gray-500">{item.location.code}</div>
                                    )}
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell className="text-right font-semibold">
                                {item.stockByLocation !== null && item.stockByLocation !== undefined
                                  ? item.stockByLocation.toLocaleString('fr-FR', {
                                      minimumFractionDigits: 2,
                                      maximumFractionDigits: 2,
                                    })
                                  : (
                                    <span className="text-gray-400 italic">N/A</span>
                                  )}
                              </TableCell>
                              <TableCell>
                                {item.bcItem.baseUnitOfMeasure || '-'}
                              </TableCell>
                            </TableRow>
                          );
                        })}
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
    </div>
  );
}

export default function StockByLocationPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    }>
      <StockByLocationPageContent />
    </Suspense>
  );
}

