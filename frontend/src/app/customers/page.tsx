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
  CheckCircle2,
  Ban,
} from 'lucide-react';
import { useBCCustomers, useBCCustomer, useSyncBCCustomers, useUpdateBCCustomerLocalFields, type BCCustomer } from '@/hooks/use-bc-customers';
import { useCanaux } from '@/hooks/use-canaux';
import { useTypeVentes } from '@/hooks/use-type-ventes';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useSearchParams } from 'next/navigation';
import { toast } from 'sonner';

export default function CustomersPage() {
  const searchParams = useSearchParams();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [selectedCustomerId, setSelectedCustomerId] = useState<number | null>(null);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  // États pour les filtres par colonne
  const [filters, setFilters] = useState({
    number: '',
    displayName: '',
    email: '',
    phoneNumber: '',
    addressCity: '',
    blocked: '',
  });

  // Récupérer les clients avec filtrage
  const { data: customersData, isLoading, error } = useBCCustomers({
    search: search || undefined,
  });
  const syncMutation = useSyncBCCustomers();
  const { data: customerDetails, isLoading: isLoadingDetails } = useBCCustomer(selectedCustomerId);
  const { data: canaux } = useCanaux();
  const { data: typeVentes } = useTypeVentes();
  const updateLocalFieldsMutation = useUpdateBCCustomerLocalFields();

  const customers = customersData?.data || [];
  const total = customersData?.count || 0;

  // Filtrage côté client avec les filtres avancés
  const filteredCustomers = useMemo(() => {
    let filtered = customers;

    // Appliquer les filtres par colonne
    if (filters.number) {
      filtered = filtered.filter((c) => 
        c.number?.toLowerCase().includes(filters.number.toLowerCase())
      );
    }
    if (filters.displayName) {
      filtered = filtered.filter((c) => 
        c.displayName?.toLowerCase().includes(filters.displayName.toLowerCase())
      );
    }
    if (filters.email) {
      filtered = filtered.filter((c) => 
        c.email?.toLowerCase().includes(filters.email.toLowerCase())
      );
    }
    if (filters.phoneNumber) {
      filtered = filtered.filter((c) => 
        c.phoneNumber?.toLowerCase().includes(filters.phoneNumber.toLowerCase())
      );
    }
    if (filters.addressCity) {
      filtered = filtered.filter((c) => 
        c.addressCity?.toLowerCase().includes(filters.addressCity.toLowerCase())
      );
    }
    if (filters.blocked !== '') {
      const isBlocked = filters.blocked === 'true';
      filtered = filtered.filter((c) => c.blocked === isBlocked);
    }

    // Pagination
    const start = (page - 1) * 10;
    return {
      items: filtered.slice(start, start + 10),
      total: filtered.length,
      pages: Math.max(1, Math.ceil(filtered.length / 10)),
    };
  }, [customers, filters, page]);

  const handleSync = async () => {
    try {
      await syncMutation.mutateAsync();
    } catch (error) {
      console.error('Sync error:', error);
    }
  };

  const handleView = (customer: BCCustomer) => {
    setSelectedCustomerId(customer.id);
    setIsViewOpen(true);
  };

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPage(1); // Réinitialiser à la page 1 quand on change un filtre
  };

  const clearFilters = () => {
    setFilters({
      number: '',
      displayName: '',
      email: '',
      phoneNumber: '',
      addressCity: '',
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
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-900">Clients Business Central</h1>
          <p className="text-gray-600 dark:text-gray-900">Gérez les clients synchronisés depuis Business Central</p>
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
                  <label className="text-sm font-medium mb-1 block">Email</label>
                  <Input
                    placeholder="Filtrer par email..."
                    value={filters.email}
                    onChange={(e) => handleFilterChange('email', e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">Téléphone</label>
                  <Input
                    placeholder="Filtrer par téléphone..."
                    value={filters.phoneNumber}
                    onChange={(e) => handleFilterChange('phoneNumber', e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">Ville</label>
                  <Input
                    placeholder="Filtrer par ville..."
                    value={filters.addressCity}
                    onChange={(e) => handleFilterChange('addressCity', e.target.value)}
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
              Erreur lors du chargement des clients: {error instanceof Error ? error.message : 'Erreur inconnue'}
            </div>
          ) : !filteredCustomers.items || filteredCustomers.items.length === 0 ? (
            <div className="py-8 text-center text-gray-500">
              Aucun client trouvé
              {(search || hasActiveFilters) && ' avec les filtres appliqués'}
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Code</TableHead>
                    <TableHead>Nom</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Téléphone</TableHead>
                    <TableHead>Ville</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead>Dernière Modif</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCustomers.items.map((customer) => (
                    <TableRow key={customer.id}>
                      <TableCell className="font-medium">
                        <Badge variant="secondary">{customer.number || '—'}</Badge>
                      </TableCell>
                      <TableCell>{customer.displayName || '—'}</TableCell>
                      <TableCell>
                        {customer.email ? (
                          <a 
                            href={`mailto:${customer.email}`} 
                            className="text-blue-600 hover:text-blue-800 flex items-center space-x-1"
                          >
                            <Mail className="h-4 w-4" />
                            <span>{customer.email}</span>
                          </a>
                        ) : (
                          '—'
                        )}
                      </TableCell>
                      <TableCell>
                        {customer.phoneNumber ? (
                          <a 
                            href={`tel:${customer.phoneNumber}`} 
                            className="text-blue-600 hover:text-blue-800 flex items-center space-x-1"
                          >
                            <Phone className="h-4 w-4" />
                            <span>{customer.phoneNumber}</span>
                          </a>
                        ) : (
                          '—'
                        )}
                      </TableCell>
                      <TableCell>
                        {customer.addressCity ? (
                          <Badge variant="outline" className="flex items-center space-x-1 w-fit">
                            <MapPin className="h-3 w-3" />
                            <span>{customer.addressCity}</span>
                          </Badge>
                        ) : (
                          '—'
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          {customer.blocked ? (
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
                        {customer.lastModified ? (
                          <span className="text-sm text-gray-600 flex items-center space-x-1">
                            <Calendar className="h-3 w-3" />
                            <span>{new Date(customer.lastModified).toLocaleDateString('fr-FR')}</span>
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
                            <DropdownMenuItem onClick={() => handleView(customer)}>
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
              {filteredCustomers.pages > 1 && (
                <div className="flex items-center justify-between mt-4">
                  <div className="text-sm text-gray-500">
                    Page {page} sur {filteredCustomers.pages} ({filteredCustomers.total} résultat(s))
                  </div>
                  <div className="flex space-x-2">
                    <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}>
                      <ChevronLeft className="mr-2 h-4 w-4" />
                      Précédent
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.min(filteredCustomers.pages, p + 1))} disabled={page === filteredCustomers.pages}>
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
            <DrawerTitle>Détails du client Business Central</DrawerTitle>
          </DrawerHeader>
          <div className="flex-1 overflow-y-auto px-6 py-4">
            {isLoadingDetails ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin" />
                <span className="ml-2">Chargement...</span>
              </div>
            ) : customerDetails ? (
              <Tabs defaultValue="informations" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="informations">Informations</TabsTrigger>
                  <TabsTrigger value="adresse">Adresse</TabsTrigger>
                  <TabsTrigger value="local">Informations locales</TabsTrigger>
                </TabsList>

                <TabsContent value="informations" className="mt-4 space-y-6">
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Informations générales</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Code BC</p>
                        <p className="text-base">{customerDetails.bcId}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Numéro</p>
                        <p className="text-base">{customerDetails.number || '—'}</p>
                      </div>
                      <div className="col-span-2">
                        <p className="text-sm font-medium text-muted-foreground">Nom</p>
                        <p className="text-base font-semibold">{customerDetails.displayName || '—'}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Type</p>
                        <p className="text-base">{customerDetails.type || '—'}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Statut</p>
                        <div className="flex items-center space-x-2">
                          {customerDetails.blocked ? (
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
                    </div>
                  </div>

                  <div className="space-y-4 pt-4 border-t">
                    <h3 className="text-lg font-semibold">Contact</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Email</p>
                        {customerDetails.email ? (
                          <a href={`mailto:${customerDetails.email}`} className="text-blue-600 hover:text-blue-800 flex items-center space-x-1">
                            <Mail className="h-4 w-4" />
                            <span>{customerDetails.email}</span>
                          </a>
                        ) : (
                          <p className="text-base">—</p>
                        )}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Téléphone</p>
                        {customerDetails.phoneNumber ? (
                          <a href={`tel:${customerDetails.phoneNumber}`} className="text-blue-600 hover:text-blue-800 flex items-center space-x-1">
                            <Phone className="h-4 w-4" />
                            <span>{customerDetails.phoneNumber}</span>
                          </a>
                        ) : (
                          <p className="text-base">—</p>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4 pt-4 border-t">
                    <h3 className="text-lg font-semibold">Informations financières</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Code devise</p>
                        <p className="text-base">{customerDetails.currencyCode || '—'}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">N° TVA</p>
                        <p className="text-base">{customerDetails.taxRegistrationNumber || '—'}</p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4 pt-4 border-t">
                    <h3 className="text-lg font-semibold">Informations système</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Date de création</p>
                        <p className="text-sm">{new Date(customerDetails.createdAt).toLocaleDateString('fr-FR')}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Dernière modification</p>
                        <p className="text-sm">{customerDetails.lastModified ? new Date(customerDetails.lastModified).toLocaleDateString('fr-FR') : '—'}</p>
                      </div>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="adresse" className="mt-4 space-y-6">
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Adresse</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="col-span-2">
                        <p className="text-sm font-medium text-muted-foreground">Rue</p>
                        <p className="text-base">{customerDetails.addressStreet || '—'}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Ville</p>
                        <p className="text-base">{customerDetails.addressCity || '—'}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">État/Région</p>
                        <p className="text-base">{customerDetails.addressState || '—'}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Pays</p>
                        <p className="text-base">{customerDetails.addressCountry || '—'}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Code postal</p>
                        <p className="text-base">{customerDetails.addressPostalCode || '—'}</p>
                      </div>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="local" className="mt-4 space-y-6">
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Champs personnalisés Selos</h3>
                    <p className="text-sm text-muted-foreground">
                      Ces champs sont spécifiques à Selos et ne seront pas modifiés lors de la synchronisation avec Business Central.
                    </p>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium text-muted-foreground mb-2 block">Canal local</label>
                        <Select
                          value={customerDetails.localCanalId?.toString() || ''}
                          onValueChange={(value) => {
                            if (selectedCustomerId) {
                              updateLocalFieldsMutation.mutate({
                                id: selectedCustomerId,
                                data: {
                                  localCanalId: value ? parseInt(value) : null,
                                },
                              });
                            }
                          }}
                          disabled={updateLocalFieldsMutation.isPending}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Sélectionner un canal" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="">Aucun</SelectItem>
                            {canaux?.map((canal) => (
                              <SelectItem key={canal.id} value={canal.id.toString()}>
                                {canal.nom}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {customerDetails.localCanal && (
                          <p className="text-xs text-muted-foreground mt-1">
                            Actuel: {customerDetails.localCanal.nom}
                          </p>
                        )}
                      </div>
                      <div>
                        <label className="text-sm font-medium text-muted-foreground mb-2 block">Type de vente local</label>
                        <Select
                          value={customerDetails.localTypeVenteId?.toString() || ''}
                          onValueChange={(value) => {
                            if (selectedCustomerId) {
                              updateLocalFieldsMutation.mutate({
                                id: selectedCustomerId,
                                data: {
                                  localTypeVenteId: value ? parseInt(value) : null,
                                },
                              });
                            }
                          }}
                          disabled={updateLocalFieldsMutation.isPending}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Sélectionner un type de vente" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="">Aucun</SelectItem>
                            {typeVentes?.map((typeVente) => (
                              <SelectItem key={typeVente.id} value={typeVente.id.toString()}>
                                {typeVente.nom}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {customerDetails.localTypeVente && (
                          <p className="text-xs text-muted-foreground mt-1">
                            Actuel: {customerDetails.localTypeVente.nom}
                          </p>
                        )}
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
