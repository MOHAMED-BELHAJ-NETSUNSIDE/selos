'use client';

import { useState, useMemo, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerFooter } from '@/components/ui/drawer';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { 
  Search, 
  MoreHorizontal, 
  Eye, 
  RefreshCw, 
  Loader2, 
  ChevronLeft, 
  ChevronRight,
  Mail,
  Phone,
  MapPin,
  Calendar,
  XCircle,
  Filter,
  X,
  Store,
} from 'lucide-react';
import { useBCLocations, useBCLocation, useSyncBCLocations, type BCLocation } from '@/hooks/use-bc-locations';
import { useSearchParams } from 'next/navigation';

export default function LocationsPage() {
  const searchParams = useSearchParams();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [selectedLocationId, setSelectedLocationId] = useState<number | null>(null);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  // États pour les filtres par colonne
  const [filters, setFilters] = useState({
    code: '',
    displayName: '',
    city: '',
    country: '',
  });

  // Récupérer les magasins avec filtrage
  const { data: locationsData, isLoading, error } = useBCLocations({
    search: search || undefined,
  });
  const syncMutation = useSyncBCLocations();
  const { data: locationDetails, isLoading: isLoadingDetails } = useBCLocation(selectedLocationId);

  const locations = locationsData?.data || [];
  const total = locationsData?.count || 0;

  // Filtrage côté client avec les filtres avancés
  const filteredLocations = useMemo(() => {
    let filtered = locations;

    // Appliquer les filtres par colonne
    if (filters.code) {
      filtered = filtered.filter((l) => 
        l.code?.toLowerCase().includes(filters.code.toLowerCase())
      );
    }
    if (filters.displayName) {
      filtered = filtered.filter((l) => 
        l.displayName?.toLowerCase().includes(filters.displayName.toLowerCase())
      );
    }
    if (filters.city) {
      filtered = filtered.filter((l) => 
        l.city?.toLowerCase().includes(filters.city.toLowerCase())
      );
    }
    if (filters.country) {
      filtered = filtered.filter((l) => 
        l.country?.toLowerCase().includes(filters.country.toLowerCase())
      );
    }

    // Pagination
    const start = (page - 1) * 10;
    return {
      items: filtered.slice(start, start + 10),
      total: filtered.length,
      pages: Math.max(1, Math.ceil(filtered.length / 10)),
    };
  }, [locations, filters, page]);

  const handleSync = async () => {
    try {
      await syncMutation.mutateAsync();
    } catch (error) {
      console.error('Sync error:', error);
    }
  };

  const handleView = (location: BCLocation) => {
    setSelectedLocationId(location.id);
    setIsViewOpen(true);
  };

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPage(1);
  };

  const clearFilters = () => {
    setFilters({
      code: '',
      displayName: '',
      city: '',
      country: '',
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
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-900">Magasins Business Central</h1>
          <p className="text-gray-600 dark:text-gray-900">Gérez les magasins synchronisés depuis Business Central</p>
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
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <label className="text-sm font-medium mb-1 block">Code</label>
                  <Input
                    placeholder="Filtrer par code..."
                    value={filters.code}
                    onChange={(e) => handleFilterChange('code', e.target.value)}
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
                  <label className="text-sm font-medium mb-1 block">Ville</label>
                  <Input
                    placeholder="Filtrer par ville..."
                    value={filters.city}
                    onChange={(e) => handleFilterChange('city', e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">Pays</label>
                  <Input
                    placeholder="Filtrer par pays..."
                    value={filters.country}
                    onChange={(e) => handleFilterChange('country', e.target.value)}
                  />
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
              Erreur lors du chargement des magasins: {error instanceof Error ? error.message : 'Erreur inconnue'}
            </div>
          ) : !filteredLocations.items || filteredLocations.items.length === 0 ? (
            <div className="py-8 text-center text-gray-500">
              Aucun magasin trouvé
              {(search || hasActiveFilters) && ' avec les filtres appliqués'}
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Code</TableHead>
                    <TableHead>Nom</TableHead>
                    <TableHead>Ville</TableHead>
                    <TableHead>Pays</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>Dernière Modif</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredLocations.items.map((location) => (
                    <TableRow key={location.id}>
                      <TableCell className="font-medium">
                        <Badge variant="secondary">{location.code || '—'}</Badge>
                      </TableCell>
                      <TableCell>{location.displayName || '—'}</TableCell>
                      <TableCell>
                        {location.city ? (
                          <Badge variant="outline" className="flex items-center space-x-1 w-fit">
                            <MapPin className="h-3 w-3" />
                            <span>{location.city}</span>
                          </Badge>
                        ) : (
                          '—'
                        )}
                      </TableCell>
                      <TableCell>{location.country || '—'}</TableCell>
                      <TableCell>
                        <div className="flex flex-col space-y-1">
                          {location.email && (
                            <a 
                              href={`mailto:${location.email}`} 
                              className="text-blue-600 hover:text-blue-800 flex items-center space-x-1 text-sm"
                            >
                              <Mail className="h-3 w-3" />
                              <span>{location.email}</span>
                            </a>
                          )}
                          {location.phoneNumber && (
                            <a 
                              href={`tel:${location.phoneNumber}`} 
                              className="text-blue-600 hover:text-blue-800 flex items-center space-x-1 text-sm"
                            >
                              <Phone className="h-3 w-3" />
                              <span>{location.phoneNumber}</span>
                            </a>
                          )}
                          {!location.email && !location.phoneNumber && '—'}
                        </div>
                      </TableCell>
                      <TableCell>
                        {location.lastModified ? (
                          <span className="text-sm text-gray-600 flex items-center space-x-1">
                            <Calendar className="h-3 w-3" />
                            <span>{new Date(location.lastModified).toLocaleDateString('fr-FR')}</span>
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
                            <DropdownMenuItem onClick={() => handleView(location)}>
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
              {filteredLocations.pages > 1 && (
                <div className="flex items-center justify-between mt-4">
                  <div className="text-sm text-gray-500">
                    Page {page} sur {filteredLocations.pages} ({filteredLocations.total} résultat(s))
                  </div>
                  <div className="flex space-x-2">
                    <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}>
                      <ChevronLeft className="mr-2 h-4 w-4" />
                      Précédent
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.min(filteredLocations.pages, p + 1))} disabled={page === filteredLocations.pages}>
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
        <DrawerContent side="right" className="h-full w-full sm:max-w-2xl flex flex-col">
          <DrawerHeader>
            <DrawerTitle>Détails du magasin Business Central</DrawerTitle>
          </DrawerHeader>
          <div className="flex-1 overflow-y-auto px-6 py-4">
            {isLoadingDetails ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin" />
                <span className="ml-2">Chargement...</span>
              </div>
            ) : locationDetails ? (
              <Tabs defaultValue="informations" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="informations">Informations</TabsTrigger>
                  <TabsTrigger value="adresse">Adresse</TabsTrigger>
                </TabsList>

                <TabsContent value="informations" className="mt-4 space-y-6">
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Informations générales</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Code BC</p>
                        <p className="text-base">{locationDetails.bcId}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Code</p>
                        <p className="text-base">{locationDetails.code || '—'}</p>
                      </div>
                      <div className="col-span-2">
                        <p className="text-sm font-medium text-muted-foreground">Nom</p>
                        <p className="text-base font-semibold">{locationDetails.displayName || '—'}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Contact</p>
                        <p className="text-base">{locationDetails.contact || '—'}</p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4 pt-4 border-t">
                    <h3 className="text-lg font-semibold">Contact</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Email</p>
                        {locationDetails.email ? (
                          <a href={`mailto:${locationDetails.email}`} className="text-blue-600 hover:text-blue-800 flex items-center space-x-1">
                            <Mail className="h-4 w-4" />
                            <span>{locationDetails.email}</span>
                          </a>
                        ) : (
                          <p className="text-base">—</p>
                        )}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Téléphone</p>
                        {locationDetails.phoneNumber ? (
                          <a href={`tel:${locationDetails.phoneNumber}`} className="text-blue-600 hover:text-blue-800 flex items-center space-x-1">
                            <Phone className="h-4 w-4" />
                            <span>{locationDetails.phoneNumber}</span>
                          </a>
                        ) : (
                          <p className="text-base">—</p>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4 pt-4 border-t">
                    <h3 className="text-lg font-semibold">Options d'entrepôt</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Utiliser comme transit</p>
                        <p className="text-base">{locationDetails.useAsInTransit ? 'Oui' : 'Non'}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Expédition requise</p>
                        <p className="text-base">{locationDetails.requireShipment ? 'Oui' : 'Non'}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Réception requise</p>
                        <p className="text-base">{locationDetails.requireReceive ? 'Oui' : 'Non'}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Mise en stock requise</p>
                        <p className="text-base">{locationDetails.requirePutAway ? 'Oui' : 'Non'}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Prélèvement requis</p>
                        <p className="text-base">{locationDetails.requirePick ? 'Oui' : 'Non'}</p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4 pt-4 border-t">
                    <h3 className="text-lg font-semibold">Informations système</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Date de création</p>
                        <p className="text-sm">{new Date(locationDetails.createdAt).toLocaleDateString('fr-FR')}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Dernière modification</p>
                        <p className="text-sm">{locationDetails.lastModified ? new Date(locationDetails.lastModified).toLocaleDateString('fr-FR') : '—'}</p>
                      </div>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="adresse" className="mt-4 space-y-6">
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Adresse</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="col-span-2">
                        <p className="text-sm font-medium text-muted-foreground">Adresse</p>
                        <p className="text-base">{locationDetails.address || '—'}</p>
                      </div>
                      <div className="col-span-2">
                        <p className="text-sm font-medium text-muted-foreground">Adresse (ligne 2)</p>
                        <p className="text-base">{locationDetails.address2 || '—'}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Ville</p>
                        <p className="text-base">{locationDetails.city || '—'}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">État/Région</p>
                        <p className="text-base">{locationDetails.state || '—'}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Pays</p>
                        <p className="text-base">{locationDetails.country || '—'}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Code postal</p>
                        <p className="text-base">{locationDetails.postalCode || '—'}</p>
                      </div>
                    </div>
                  </div>
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

