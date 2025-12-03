'use client';

import { useState, useMemo } from 'react';
import { useClients, useDeleteClient, useClient, useClientStatistics } from '@/hooks/use-clients';
import { useDeliveryNotes, type DeliveryNote } from '@/hooks/use-delivery-notes';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerFooter } from '@/components/ui/drawer';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { ClientForm } from '@/components/forms/client-form';
import { Eye, Loader2, Filter, X, Plus, Edit, Trash2, Save, XCircle, Package, TrendingUp, DollarSign, Award, ChevronLeft, ChevronRight } from 'lucide-react';
import { ClientMap } from '@/components/client/client-map';
import { useCanaux } from '@/hooks/use-canaux';
import { useLocalites } from '@/hooks/use-localites';
import { useTypeClients } from '@/hooks/use-type-clients';
import { useTypeVentes } from '@/hooks/use-type-ventes';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function ClientsPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [selectedClient, setSelectedClient] = useState<any>(null);
  const [selectedClientId, setSelectedClientId] = useState<number | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  // États pour les filtres par colonne
  const [filters, setFilters] = useState({
    code: '',
    nom: '',
    nomCommercial: '',
    numeroTelephone: '',
    adresse: '',
    registreCommerce: '',
    typeClientId: '',
    typeVenteId: '',
    canalId: '',
    localiteId: '',
  });

  // Récupérer les clients avec filtrage côté serveur
  const { data: clientsData, isLoading, error } = useClients({
    page,
    limit: 10,
    ...(search ? { search } : {
      // Envoyer les filtres seulement si pas de recherche globale
      ...(filters.code && { code: filters.code }),
      ...(filters.nom && { nom: filters.nom }),
      ...(filters.nomCommercial && { nomCommercial: filters.nomCommercial }),
      ...(filters.numeroTelephone && { numeroTelephone: filters.numeroTelephone }),
      ...(filters.adresse && { adresse: filters.adresse }),
      ...(filters.registreCommerce && { registreCommerce: filters.registreCommerce }),
      ...(filters.typeClientId && { typeClientId: Number(filters.typeClientId) }),
      ...(filters.typeVenteId && { typeVenteId: Number(filters.typeVenteId) }),
      ...(filters.canalId && { canalId: Number(filters.canalId) }),
      ...(filters.localiteId && { localiteId: Number(filters.localiteId) }),
    }),
  });
  const deleteClientMutation = useDeleteClient();
  const { data: clientDetails, isLoading: isLoadingDetails } = useClient(selectedClientId);
  const { data: clientStatistics, isLoading: isLoadingStatistics } = useClientStatistics(selectedClientId);
  const { data: deliveryNotesData, isLoading: isLoadingDeliveryNotes } = useDeliveryNotes(
    selectedClientId ? {
      clientId: selectedClientId,
      page: 1,
      limit: 10,
    } : undefined
  );
  
  // Charger les données pour les filtres
  const { data: canaux = [] } = useCanaux();
  const { data: localites = [] } = useLocalites();
  const { data: typeClients = [] } = useTypeClients();
  const { data: typeVentes = [] } = useTypeVentes();

  // Debug: log des données reçues
  if (clientsData) {
    console.log('Clients data:', clientsData);
    console.log('Clients array:', clientsData.data);
    console.log('Clients count:', clientsData.data?.length);
  }
  if (error) {
    console.error('Clients error:', error);
  }

  // Les données sont déjà filtrées côté serveur, pas besoin de filtrage côté client
  const filteredClients = useMemo(() => {
    if (!clientsData?.data) {
      return { items: [], total: 0, pages: 1 };
    }

    return {
      items: clientsData.data,
      total: clientsData.pagination?.total || clientsData.data.length,
      pages: clientsData.pagination?.pages || 1,
    };
  }, [clientsData]);

  const handleDelete = (client: any) => { 
    if (confirm(`Êtes-vous sûr de vouloir supprimer le client ${client.code} (${client.nom}) ?`)) {
      deleteClientMutation.mutate(client.id);
    }
  };
  const handleEdit = (client: any) => { setSelectedClient(client); setIsEditOpen(true); };
  const handleView = (client: any) => { 
    setSelectedClientId(client.id);
    setIsViewOpen(true);
  };

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPage(1); // Réinitialiser à la page 1 quand on change un filtre
  };

  const clearFilters = () => {
    setFilters({
      code: '',
      nom: '',
      nomCommercial: '',
      numeroTelephone: '',
      adresse: '',
      registreCommerce: '',
      typeClientId: '',
      typeVenteId: '',
      canalId: '',
      localiteId: '',
    });
    setPage(1);
  };

  const hasActiveFilters = Object.values(filters).some(v => v !== '');

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-900">Clients</h1>
          <p className="text-gray-600 dark:text-gray-900">Gérez les clients</p>
        </div>
        <Button onClick={() => setIsCreateOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Ajouter
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center space-x-4">
            <div className="flex-1">
              <div className="relative">
                <Input placeholder="Rechercher..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} />
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
                    value={filters.code}
                    onChange={(e) => handleFilterChange('code', e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">Nom</label>
                  <Input
                    placeholder="Filtrer par nom..."
                    value={filters.nom}
                    onChange={(e) => handleFilterChange('nom', e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">Nom commercial</label>
                  <Input
                    placeholder="Filtrer par nom commercial..."
                    value={filters.nomCommercial}
                    onChange={(e) => handleFilterChange('nomCommercial', e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">Téléphone</label>
                  <Input
                    placeholder="Filtrer par téléphone..."
                    value={filters.numeroTelephone}
                    onChange={(e) => handleFilterChange('numeroTelephone', e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">Adresse</label>
                  <Input
                    placeholder="Filtrer par adresse..."
                    value={filters.adresse}
                    onChange={(e) => handleFilterChange('adresse', e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">Registre commerce</label>
                  <Input
                    placeholder="Filtrer par RC..."
                    value={filters.registreCommerce}
                    onChange={(e) => handleFilterChange('registreCommerce', e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">Type client</label>
                  <Select value={filters.typeClientId || undefined} onValueChange={(v) => handleFilterChange('typeClientId', v === 'all' ? '' : v)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Tous" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tous</SelectItem>
                      {typeClients.map((tc) => (
                        <SelectItem key={tc.id} value={String(tc.id)}>{tc.nom}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">Type de vente</label>
                  <Select value={filters.typeVenteId || undefined} onValueChange={(v) => handleFilterChange('typeVenteId', v === 'all' ? '' : v)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Tous" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tous</SelectItem>
                      {typeVentes.map((tv) => (
                        <SelectItem key={tv.id} value={String(tv.id)}>{tv.nom}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">Canal</label>
                  <Select value={filters.canalId || undefined} onValueChange={(v) => handleFilterChange('canalId', v === 'all' ? '' : v)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Tous" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tous</SelectItem>
                      {canaux.map((c) => (
                        <SelectItem key={c.id} value={String(c.id)}>{c.nom}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">Localité</label>
                  <Select value={filters.localiteId || undefined} onValueChange={(v) => handleFilterChange('localiteId', v === 'all' ? '' : v)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Tous" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tous</SelectItem>
                      {localites.map((l) => (
                        <SelectItem key={l.id} value={String(l.id)}>{l.nom}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
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
          ) : !filteredClients.items || filteredClients.items.length === 0 ? (
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
                    <TableHead>Nom commercial</TableHead>
                    <TableHead>Téléphone</TableHead>
                    <TableHead>Adresse</TableHead>
                    <TableHead>Registre de commerce</TableHead>
                    <TableHead>Type client</TableHead>
                    <TableHead>Type de vente</TableHead>
                    <TableHead>Canal</TableHead>
                    <TableHead>Localité</TableHead>
                    <TableHead>Secteur</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredClients.items.map((c: any) => (
                    <TableRow key={c.id}>
                      <TableCell className="font-medium">{c.code}</TableCell>
                      <TableCell>{c.nom}</TableCell>
                      <TableCell>{c.nomCommercial || '—'}</TableCell>
                      <TableCell>{c.numeroTelephone || '—'}</TableCell>
                      <TableCell>{c.adresse || '—'}</TableCell>
                      <TableCell>{c.registreCommerce || '—'}</TableCell>
                      <TableCell>{c.typeClient?.nom || '—'}</TableCell>
                      <TableCell>{c.typeVente?.nom || '—'}</TableCell>
                      <TableCell>{c.canal?.nom || '—'}</TableCell>
                      <TableCell>{c.localite?.nom || '—'}</TableCell>
                      <TableCell>{c.secteur?.nom || '—'}</TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">⋮</Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleView(c)}>
                              <Eye className="mr-2 h-4 w-4" />
                              Consulter
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleEdit(c)}>
                              <Edit className="mr-2 h-4 w-4" />
                              Modifier
                            </DropdownMenuItem>
                            <DropdownMenuItem className="text-red-600" onClick={() => handleDelete(c)}>
                              <Trash2 className="mr-2 h-4 w-4" />
                              Supprimer
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {filteredClients.pages > 1 && (
                <div className="flex items-center justify-between mt-4">
                  <div className="text-sm text-gray-500">
                    Page {page} sur {filteredClients.pages} ({filteredClients.total} résultat(s))
                  </div>
                  <div className="flex space-x-2">
                    <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}>
                      <ChevronLeft className="mr-2 h-4 w-4" />
                      Précédent
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.min(filteredClients.pages, p + 1))} disabled={page === filteredClients.pages}>
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

      <Drawer open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DrawerContent
          side="right"
          className="h-full flex flex-col"
          style={{ width: '50vw', maxWidth: '50vw' }}
        >
          <DrawerHeader>
            <DrawerTitle>Créer un client</DrawerTitle>
          </DrawerHeader>
          <div className="flex-1 overflow-y-auto px-6">
            <ClientForm onSuccess={() => setIsCreateOpen(false)} />
          </div>
        </DrawerContent>
      </Drawer>

      <Drawer open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DrawerContent
          side="right"
          className="h-full flex flex-col"
          style={{ width: '50vw', maxWidth: '50vw' }}
        >
          <DrawerHeader>
            <DrawerTitle>Modifier le client</DrawerTitle>
          </DrawerHeader>
          <div className="flex-1 overflow-y-auto px-6">
            <ClientForm client={selectedClient} onSuccess={() => setIsEditOpen(false)} />
          </div>
        </DrawerContent>
      </Drawer>

      <Drawer open={isViewOpen} onOpenChange={setIsViewOpen}>
        <DrawerContent
          side="right"
          className="h-full flex flex-col"
          style={{ width: '50vw', maxWidth: '50vw' }}
        >
          <DrawerHeader>
            <DrawerTitle>Détails du client</DrawerTitle>
          </DrawerHeader>
          <div className="flex-1 overflow-y-auto px-6 py-4">
            {isLoadingDetails ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin" />
                <span className="ml-2">Chargement...</span>
              </div>
            ) : clientDetails ? (
              <Tabs defaultValue="identite" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="identite">Identité & Informations</TabsTrigger>
                  <TabsTrigger value="localisation">Localisation & Organisation</TabsTrigger>
                  <TabsTrigger value="livraisons">Bons de livraison</TabsTrigger>
                </TabsList>

                {/* Onglet 1 : Identité & Informations */}
                <TabsContent value="identite" className="mt-4 space-y-6">
                  {/* Informations générales */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Informations générales</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Code</p>
                        <p className="text-base">{clientDetails.code}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Nom</p>
                        <p className="text-base">{clientDetails.nom}</p>
                      </div>
                      {clientDetails.nomCommercial && (
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">Nom commercial</p>
                          <p className="text-base">{clientDetails.nomCommercial}</p>
                        </div>
                      )}
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Numéro de téléphone</p>
                        <p className="text-base">{clientDetails.numeroTelephone || '—'}</p>
                      </div>
                      {clientDetails.registreCommerce && (
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">Registre de commerce</p>
                          <p className="text-base">{clientDetails.registreCommerce}</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Informations commerciales */}
                  <div className="space-y-4 pt-4 border-t">
                    <h3 className="text-lg font-semibold">Informations commerciales</h3>
                    <div className="grid grid-cols-2 gap-4">
                      {clientDetails.typeClient && (
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">Type client</p>
                          <p className="text-base">{clientDetails.typeClient.nom}</p>
                        </div>
                      )}
                      {clientDetails.typeVente && (
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">Type de vente</p>
                          <p className="text-base">{clientDetails.typeVente.nom}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </TabsContent>

                {/* Onglet 2 : Localisation & Organisation */}
                <TabsContent value="localisation" className="mt-4 space-y-6">
                  {/* Localisation */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Localisation</h3>
                    <div className="space-y-3">
                      {clientDetails.adresse && (
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">Adresse</p>
                          <p className="text-base">{clientDetails.adresse}</p>
                        </div>
                      )}
                      <div className="grid grid-cols-3 gap-4">
                        {clientDetails.localite && (
                          <div>
                            <p className="text-sm font-medium text-muted-foreground">Localité</p>
                            <p className="text-base">{clientDetails.localite.nom}</p>
                            {clientDetails.localite.delegation && (
                              <p className="text-xs text-muted-foreground mt-1">
                                {clientDetails.localite.delegation.nom}
                                {clientDetails.localite.delegation.gouvernorat && (
                                  <> - {clientDetails.localite.delegation.gouvernorat.nom}</>
                                )}
                              </p>
                            )}
                          </div>
                        )}
                        {clientDetails.longitude && (
                          <div>
                            <p className="text-sm font-medium text-muted-foreground">Longitude</p>
                            <p className="text-base">{clientDetails.longitude}</p>
                          </div>
                        )}
                        {clientDetails.latitude && (
                          <div>
                            <p className="text-sm font-medium text-muted-foreground">Latitude</p>
                            <p className="text-base">{clientDetails.latitude}</p>
                          </div>
                        )}
                      </div>
                      {/* Carte Leaflet */}
                      {clientDetails.latitude && clientDetails.longitude && (
                        <div className="mt-4">
                          <p className="text-sm font-medium text-muted-foreground mb-2">Position sur la carte</p>
                          <ClientMap
                            latitude={clientDetails.latitude}
                            longitude={clientDetails.longitude}
                            clientName={clientDetails.nom}
                            clientCode={clientDetails.code}
                          />
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Organisation */}
                  <div className="space-y-4 pt-4 border-t">
                    <h3 className="text-lg font-semibold">Organisation</h3>
                    <div className="grid grid-cols-2 gap-4">
                      {clientDetails.canal && (
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">Canal</p>
                          <p className="text-base">{clientDetails.canal.nom}</p>
                        </div>
                      )}
                      {clientDetails.secteur && (
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">Secteur</p>
                          <p className="text-base">{clientDetails.secteur.nom}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </TabsContent>

                {/* Onglet 3 : Bons de livraison & Statistiques */}
                <TabsContent value="livraisons" className="mt-4 space-y-6">
                  {/* Statistiques */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Card>
                      <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-green-100 dark:bg-green-900/20 rounded-lg">
                            <DollarSign className="h-5 w-5 text-green-600 dark:text-green-400" />
                          </div>
                          <div>
                            <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                              Chiffre d'affaires
                            </p>
                            <p className="text-xl font-bold">
                              {isLoadingStatistics ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                `${(clientStatistics?.chiffreAffaires || 0).toFixed(2)} TND`
                              )}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
                            <Package className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                          </div>
                          <div>
                            <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                              Bons de livraison
                            </p>
                            <p className="text-xl font-bold">
                              {isLoadingStatistics ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                clientStatistics?.nombreBonsLivraison || 0
                              )}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-purple-100 dark:bg-purple-900/20 rounded-lg">
                            <TrendingUp className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                          </div>
                          <div>
                            <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                              Produits différents
                            </p>
                            <p className="text-xl font-bold">
                              {isLoadingStatistics ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                clientStatistics?.nombreProduits || 0
                              )}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Meilleur produit */}
                  {clientStatistics?.meilleurProduit && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2">
                          <Award className="h-5 w-5 text-yellow-500" />
                          Meilleur produit
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          <div>
                            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Produit</p>
                            <p className="text-base font-semibold">
                              {clientStatistics.meilleurProduit.product.bcItem?.displayName || 
                               clientStatistics.meilleurProduit.product.designation}
                              {clientStatistics.meilleurProduit.product.bcItem?.number && (
                                <span className="text-gray-500 ml-2">
                                  ({clientStatistics.meilleurProduit.product.bcItem.number})
                                </span>
                              )}
                            </p>
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Montant total</p>
                              <p className="text-base font-semibold">
                                {clientStatistics.meilleurProduit.totalAmount.toFixed(2)} TND
                              </p>
                            </div>
                            <div>
                              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Quantité totale</p>
                              <p className="text-base font-semibold">
                                {clientStatistics.meilleurProduit.totalQuantity.toFixed(2)}
                              </p>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Liste des bons de livraison */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Bons de livraison</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {isLoadingDeliveryNotes ? (
                        <div className="flex items-center justify-center py-8">
                          <Loader2 className="h-6 w-6 animate-spin" />
                          <span className="ml-2">Chargement...</span>
                        </div>
                      ) : deliveryNotesData?.data.length === 0 ? (
                        <div className="text-center py-8 text-gray-500">
                          Aucun bon de livraison trouvé
                        </div>
                      ) : (
                        <div className="rounded-md border">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Numéro</TableHead>
                                <TableHead>Date livraison</TableHead>
                                <TableHead>Date validation</TableHead>
                                <TableHead>Statut</TableHead>
                                <TableHead className="text-right">Montant total</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {deliveryNotesData?.data.map((note: DeliveryNote) => (
                                <TableRow key={note.id}>
                                  <TableCell className="font-medium">{note.numero}</TableCell>
                                  <TableCell>
                                    {new Date(note.dateLivraison).toLocaleDateString('fr-FR')}
                                  </TableCell>
                                  <TableCell>
                                    {note.dateValidation 
                                      ? new Date(note.dateValidation).toLocaleDateString('fr-FR')
                                      : '-'}
                                  </TableCell>
                                  <TableCell>
                                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                                      note.status === 'valide' ? 'bg-green-100 text-green-800' :
                                      note.status === 'annule' ? 'bg-red-100 text-red-800' :
                                      'bg-gray-100 text-gray-800'
                                    }`}>
                                      {note.status === 'valide' ? 'Validé' :
                                       note.status === 'annule' ? 'Annulé' : 'Créé'}
                                    </span>
                                  </TableCell>
                                  <TableCell className="text-right font-medium">
                                    {Number(note.montantTotal).toFixed(2)} TND
                                  </TableCell>
                                  <TableCell className="text-right">
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => {
                                        // Ouvrir le drawer de consultation du bon de livraison
                                        window.open(`/delivery-notes?view=${note.id}`, '_blank');
                                      }}
                                    >
                                      <Eye className="h-4 w-4" />
                                    </Button>
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>
                      )}
                    </CardContent>
                  </Card>
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


