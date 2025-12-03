'use client';

import { useMemo, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerFooter } from '@/components/ui/drawer';
import { Label } from '@/components/ui/label';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Search, Plus, MoreHorizontal, Edit, Trash2, Loader2, Save, XCircle, ChevronLeft, ChevronRight, Eye } from 'lucide-react';
import { useZones, useCreateZone, useUpdateZone, useDeleteZone, type Zone } from '@/hooks/use-zones';
import { useCanaux } from '@/hooks/use-canaux';
import { useTypeVentes } from '@/hooks/use-type-ventes';
import { useLocalites } from '@/hooks/use-localites';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function ZonesPage() {
  const { data: zones = [], isLoading, error } = useZones();
  const createMutation = useCreateZone();
  const updateMutation = useUpdateZone();
  const deleteMutation = useDeleteZone();

  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const limit = 10;

  const [isOpen, setIsOpen] = useState(false);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [viewingZone, setViewingZone] = useState<Zone | null>(null);
  const [editing, setEditing] = useState<Zone | null>(null);
  const [nom, setNom] = useState('');
  const [selectedCanalIds, setSelectedCanalIds] = useState<number[]>([]);
  const [selectedTypeVentes, setSelectedTypeVentes] = useState<number[]>([]);
  const [selectedLocaliteIds, setSelectedLocaliteIds] = useState<number[]>([]);
  const [frequenceVisite, setFrequenceVisite] = useState<string>('');
  const [localiteSearch, setLocaliteSearch] = useState<string>('');
  const [activeTab, setActiveTab] = useState<string>('informations');

  const { data: canaux = [] } = useCanaux();
  const { data: typeVentes = [] } = useTypeVentes();
  const { data: localites = [], isLoading: isLoadingLocalites } = useLocalites({ 
    enabled: activeTab === 'localites'
  });

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const items = q ? zones.filter((z) => z.nom.toLowerCase().includes(q) || String(z.id).includes(q)) : zones;
    const start = (page - 1) * limit;
    return { items: items.slice(start, start + limit), total: items.length, pages: Math.max(1, Math.ceil(items.length / limit)) };
  }, [zones, search, page]);

  const filteredLocalites = useMemo(() => {
    const searchTerm = localiteSearch.trim().toLowerCase();
    if (!searchTerm) return localites;
    return localites.filter((l) => {
      const nomMatch = l.nom.toLowerCase().includes(searchTerm);
      const delegationMatch = l.delegation?.nom.toLowerCase().includes(searchTerm);
      const gouvernoratMatch = l.delegation?.gouvernorat?.nom.toLowerCase().includes(searchTerm);
      return nomMatch || delegationMatch || gouvernoratMatch;
    });
  }, [localites, localiteSearch]);

  const openCreate = () => {
    setEditing(null);
    setNom('');
    setSelectedCanalIds([]);
    setSelectedTypeVentes([]);
    setSelectedLocaliteIds([]);
    setFrequenceVisite('');
    setLocaliteSearch('');
    setActiveTab('informations');
    setIsOpen(true);
  };
  
  const openEdit = (z: Zone) => {
    setEditing(z);
    setNom(z.nom);
    setSelectedCanalIds(z.zoneCanals?.map((zc) => zc.canal.id) || []);
    setSelectedTypeVentes(z.zoneTypeVentes?.map((ztv) => ztv.typeVente.id) || []);
    setSelectedLocaliteIds(z.zoneLocalites?.map((zl) => zl.localite.id) || []);
    setFrequenceVisite(z.frequenceVisite || '');
    setActiveTab('informations');
    setIsOpen(true);
  };

  const openDetails = (z: Zone) => {
    setViewingZone(z);
    setIsDetailsOpen(true);
  };

  const handleSave = async () => {
    try {
      // Validation
      if (!nom.trim()) {
        alert('Le nom est requis');
        return;
      }
      if (selectedCanalIds.length === 0) {
        alert('Au moins un canal est requis');
        return;
      }
      if (selectedTypeVentes.length === 0) {
        alert('Au moins un type de vente est requis');
        return;
      }
      if (!frequenceVisite || frequenceVisite === 'none') {
        alert('La fréquence de visite est requise');
        return;
      }
      
      const data: any = {
        nom,
        canalIds: selectedCanalIds,
        frequenceVisite,
      };
      
      // Pour la création, toujours inclure typeVenteIds
      // Pour la modification, inclure seulement si on modifie
      if (!editing) {
        data.typeVenteIds = selectedTypeVentes;
        if (selectedLocaliteIds.length > 0) {
          data.localiteIds = selectedLocaliteIds;
        }
      } else {
        // Vérifier si les types de vente ont changé
        const currentTypeVenteIds = editing.zoneTypeVentes?.map((ztv) => ztv.typeVente.id) || [];
        const hasChanged = currentTypeVenteIds.length !== selectedTypeVentes.length ||
          !currentTypeVenteIds.every(id => selectedTypeVentes.includes(id));
        if (hasChanged) {
          data.typeVenteIds = selectedTypeVentes;
        }
        
        // Vérifier si les canaux ont changé
        const currentCanalIds = editing.zoneCanals?.map((zc) => zc.canal.id) || [];
        const canalsChanged = currentCanalIds.length !== selectedCanalIds.length ||
          !currentCanalIds.every(id => selectedCanalIds.includes(id));
        if (canalsChanged) {
          data.canalIds = selectedCanalIds;
        }
        
        // Vérifier si les localités ont changé
        const currentLocaliteIds = editing.zoneLocalites?.map((zl) => zl.localite.id) || [];
        const localitesChanged = currentLocaliteIds.length !== selectedLocaliteIds.length ||
          !currentLocaliteIds.every(id => selectedLocaliteIds.includes(id));
        if (localitesChanged) {
          data.localiteIds = selectedLocaliteIds;
        }
      }
      
      // frequenceVisite est déjà inclus dans data ci-dessus
      
      if (editing) {
        await updateMutation.mutateAsync({ id: editing.id, data });
      } else {
        await createMutation.mutateAsync(data);
      }
      setIsOpen(false);
      setEditing(null);
      setNom('');
      setSelectedCanalIds([]);
      setSelectedTypeVentes([]);
      setSelectedLocaliteIds([]);
      setFrequenceVisite('');
      setLocaliteSearch('');
    } catch (error) {
      // Les toasts d'erreur sont déjà gérés dans les hooks
      console.error('Error saving zone:', error);
    }
  };

  const handleDelete = async (z: Zone) => {
    if (!confirm('Supprimer cette zone ?')) return;
    await deleteMutation.mutateAsync(z.id);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-900">Zones</h1>
          <p className="text-gray-600 dark:text-gray-900">Gérez les zones</p>
        </div>
        <Button onClick={openCreate}><Plus className="mr-2 h-4 w-4"/>Ajouter</Button>
      </div>

      <Card>
        <div className="flex items-center space-x-4 p-6 pb-2">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input placeholder="Rechercher une zone..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} className="pl-10" />
            </div>
          </div>
        </div>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8"><Loader2 className="h-8 w-8 animate-spin"/><span className="ml-2">Chargement...</span></div>
          ) : error ? (
            <div className="text-center py-8 text-red-600">Erreur lors du chargement</div>
          ) : filtered.total === 0 ? (
            <div className="text-center py-8 text-gray-500">Aucune zone trouvée</div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Nom</TableHead>
                    <TableHead>Canaux</TableHead>
                    <TableHead>Types de vente</TableHead>
                    <TableHead>Fréquence de visite</TableHead>
                    <TableHead>Nombre de clients</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.items.map((z) => (
                    <TableRow key={z.id}>
                      <TableCell className="font-medium">{z.id}</TableCell>
                      <TableCell>{z.nom}</TableCell>
                      <TableCell>
                        {z.zoneCanals && z.zoneCanals.length > 0
                          ? z.zoneCanals.map((zc) => zc.canal.nom).join(', ')
                          : '—'}
                      </TableCell>
                      <TableCell>
                        {z.zoneTypeVentes && z.zoneTypeVentes.length > 0
                          ? z.zoneTypeVentes.map((ztv) => ztv.typeVente.nom).join(', ')
                          : '—'}
                      </TableCell>
                      <TableCell>{z.frequenceVisite || '—'}</TableCell>
                      <TableCell>
                        <span className="font-medium">{z.clientCount ?? 0}</span>
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0"><MoreHorizontal className="h-4 w-4" /></Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => openDetails(z)}><Eye className="mr-2 h-4 w-4"/>Consulter</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => openEdit(z)}><Edit className="mr-2 h-4 w-4"/>Modifier</DropdownMenuItem>
                            <DropdownMenuItem className="text-red-600" onClick={() => handleDelete(z)}><Trash2 className="mr-2 h-4 w-4"/>Supprimer</DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {filtered.pages > 1 && (
                <div className="flex items-center justify-between mt-4">
                  <div className="text-sm text-gray-500">Page {page} sur {filtered.pages}</div>
                  <div className="flex space-x-2">
                    <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}>
                      <ChevronLeft className="mr-2 h-4 w-4" />
                      Précédent
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.min(filtered.pages, p + 1))} disabled={page === filtered.pages}>
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

      <Drawer open={isOpen} onOpenChange={setIsOpen}>
        <DrawerContent side="right" className="h-full w-full sm:max-w-2xl flex flex-col">
          <DrawerHeader>
            <DrawerTitle>{editing ? 'Modifier' : 'Ajouter'} une zone</DrawerTitle>
          </DrawerHeader>
          <div className="flex-1 overflow-y-auto px-6 py-4">
            {editing ? (
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="informations">Informations</TabsTrigger>
                  <TabsTrigger value="localites">
                    Localités {selectedLocaliteIds.length > 0 ? `(${selectedLocaliteIds.length})` : ''}
                  </TabsTrigger>
                </TabsList>
                
                <TabsContent value="informations" className="mt-4 space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="nom">Nom</Label>
                    <Input id="nom" value={nom} onChange={(e) => setNom(e.target.value)} placeholder="Ex: Zone Est" />
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Canaux <span className="text-red-500">*</span></Label>
                    <div className="border rounded-md p-3 max-h-48 overflow-y-auto space-y-2">
                      {canaux.map((c) => {
                        const isChecked = selectedCanalIds.includes(c.id);
                        return (
                          <label key={c.id} className="flex items-center space-x-2 cursor-pointer">
                            <Checkbox
                              checked={isChecked}
                              onCheckedChange={(checked) => {
                                if (checked) {
                                  setSelectedCanalIds([...selectedCanalIds, c.id]);
                                } else {
                                  setSelectedCanalIds(selectedCanalIds.filter((id) => id !== c.id));
                                }
                              }}
                            />
                            <span className="text-sm">{c.nom}</span>
                          </label>
                        );
                      })}
                      {canaux.length === 0 && (
                        <p className="text-sm text-muted-foreground">Aucun canal disponible</p>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="frequenceVisite">Fréquence de visite <span className="text-red-500">*</span></Label>
                    <Select value={frequenceVisite || ''} onValueChange={setFrequenceVisite}>
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionner une fréquence" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Par semaine">Par semaine</SelectItem>
                        <SelectItem value="Par quinzaine">Par quinzaine</SelectItem>
                        <SelectItem value="Par mois">Par mois</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Types de vente <span className="text-red-500">*</span></Label>
                    <div className="border rounded-md p-3 max-h-48 overflow-y-auto space-y-2">
                      {typeVentes.map((tv) => {
                        const isChecked = selectedTypeVentes.includes(tv.id);
                        return (
                          <label key={tv.id} className="flex items-center space-x-2 cursor-pointer">
                            <Checkbox
                              checked={isChecked}
                              onCheckedChange={(checked) => {
                                if (checked) {
                                  setSelectedTypeVentes([...selectedTypeVentes, tv.id]);
                                } else {
                                  setSelectedTypeVentes(selectedTypeVentes.filter((id) => id !== tv.id));
                                }
                              }}
                            />
                            <span className="text-sm">{tv.nom}</span>
                          </label>
                        );
                      })}
                      {typeVentes.length === 0 && (
                        <p className="text-sm text-muted-foreground">Aucun type de vente disponible</p>
                      )}
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="localites" className="mt-4 space-y-4">
                  <div className="space-y-2">
                    <Label>Localités</Label>
                    <div className="relative mb-3">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4" />
                      <Input 
                        placeholder="Rechercher une localité..." 
                        value={localiteSearch} 
                        onChange={(e) => setLocaliteSearch(e.target.value)} 
                        className="pl-10"
                        disabled={isLoadingLocalites}
                      />
                    </div>
                    <div className="border rounded-md p-3 max-h-96 overflow-y-auto space-y-2">
                      {isLoadingLocalites ? (
                        <div className="flex items-center justify-center py-8">
                          <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
                          <span className="ml-2 text-sm text-muted-foreground">Chargement des localités...</span>
                        </div>
                      ) : filteredLocalites.length > 0 ? (
                        filteredLocalites.map((l) => {
                          const isChecked = selectedLocaliteIds.includes(l.id);
                          return (
                            <label key={l.id} className="flex items-center space-x-2 cursor-pointer">
                              <Checkbox
                                checked={isChecked}
                                onCheckedChange={(checked) => {
                                  if (checked) {
                                    setSelectedLocaliteIds([...selectedLocaliteIds, l.id]);
                                  } else {
                                    setSelectedLocaliteIds(selectedLocaliteIds.filter((id) => id !== l.id));
                                  }
                                }}
                              />
                              <span className="text-sm">
                                {l.nom}
                                {l.delegation && (
                                  <span className="text-muted-foreground ml-2">
                                    ({l.delegation.nom}
                                    {l.delegation.gouvernorat && ` - ${l.delegation.gouvernorat.nom}`})
                                  </span>
                                )}
                              </span>
                            </label>
                          );
                        })
                      ) : localites.length === 0 ? (
                        <p className="text-sm text-muted-foreground">Aucune localité disponible</p>
                      ) : (
                        <p className="text-sm text-muted-foreground">Aucune localité trouvée</p>
                      )}
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            ) : (
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="informations">Informations</TabsTrigger>
                  <TabsTrigger value="localites">
                    Localités {selectedLocaliteIds.length > 0 ? `(${selectedLocaliteIds.length})` : ''}
                  </TabsTrigger>
                </TabsList>
                
                <TabsContent value="informations" className="mt-4 space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="nom">Nom</Label>
                    <Input id="nom" value={nom} onChange={(e) => setNom(e.target.value)} placeholder="Ex: Zone Est" />
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Canaux <span className="text-red-500">*</span></Label>
                    <div className="border rounded-md p-3 max-h-48 overflow-y-auto space-y-2">
                      {canaux.map((c) => {
                        const isChecked = selectedCanalIds.includes(c.id);
                        return (
                          <label key={c.id} className="flex items-center space-x-2 cursor-pointer">
                            <Checkbox
                              checked={isChecked}
                              onCheckedChange={(checked) => {
                                if (checked) {
                                  setSelectedCanalIds([...selectedCanalIds, c.id]);
                                } else {
                                  setSelectedCanalIds(selectedCanalIds.filter((id) => id !== c.id));
                                }
                              }}
                            />
                            <span className="text-sm">{c.nom}</span>
                          </label>
                        );
                      })}
                      {canaux.length === 0 && (
                        <p className="text-sm text-muted-foreground">Aucun canal disponible</p>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="frequenceVisite">Fréquence de visite <span className="text-red-500">*</span></Label>
                    <Select value={frequenceVisite || ''} onValueChange={setFrequenceVisite}>
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionner une fréquence" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Par semaine">Par semaine</SelectItem>
                        <SelectItem value="Par quinzaine">Par quinzaine</SelectItem>
                        <SelectItem value="Par mois">Par mois</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Types de vente <span className="text-red-500">*</span></Label>
                    <div className="border rounded-md p-3 max-h-48 overflow-y-auto space-y-2">
                      {typeVentes.map((tv) => {
                        const isChecked = selectedTypeVentes.includes(tv.id);
                        return (
                          <label key={tv.id} className="flex items-center space-x-2 cursor-pointer">
                            <Checkbox
                              checked={isChecked}
                              onCheckedChange={(checked) => {
                                if (checked) {
                                  setSelectedTypeVentes([...selectedTypeVentes, tv.id]);
                                } else {
                                  setSelectedTypeVentes(selectedTypeVentes.filter((id) => id !== tv.id));
                                }
                              }}
                            />
                            <span className="text-sm">{tv.nom}</span>
                          </label>
                        );
                      })}
                      {typeVentes.length === 0 && (
                        <p className="text-sm text-muted-foreground">Aucun type de vente disponible</p>
                      )}
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="localites" className="mt-4 space-y-4">
                  <div className="space-y-2">
                    <Label>Localités</Label>
                    <div className="relative mb-3">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4" />
                      <Input 
                        placeholder="Rechercher une localité..." 
                        value={localiteSearch} 
                        onChange={(e) => setLocaliteSearch(e.target.value)} 
                        className="pl-10"
                        disabled={isLoadingLocalites}
                      />
                    </div>
                    <div className="border rounded-md p-3 max-h-96 overflow-y-auto space-y-2">
                      {isLoadingLocalites ? (
                        <div className="flex items-center justify-center py-8">
                          <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
                          <span className="ml-2 text-sm text-muted-foreground">Chargement des localités...</span>
                        </div>
                      ) : filteredLocalites.length > 0 ? (
                        filteredLocalites.map((l) => {
                          const isChecked = selectedLocaliteIds.includes(l.id);
                          return (
                            <label key={l.id} className="flex items-center space-x-2 cursor-pointer">
                              <Checkbox
                                checked={isChecked}
                                onCheckedChange={(checked) => {
                                  if (checked) {
                                    setSelectedLocaliteIds([...selectedLocaliteIds, l.id]);
                                  } else {
                                    setSelectedLocaliteIds(selectedLocaliteIds.filter((id) => id !== l.id));
                                  }
                                }}
                              />
                              <span className="text-sm">
                                {l.nom}
                                {l.delegation && (
                                  <span className="text-muted-foreground ml-2">
                                    ({l.delegation.nom}
                                    {l.delegation.gouvernorat && ` - ${l.delegation.gouvernorat.nom}`})
                                  </span>
                                )}
                              </span>
                            </label>
                          );
                        })
                      ) : localites.length === 0 ? (
                        <p className="text-sm text-muted-foreground">Aucune localité disponible</p>
                      ) : (
                        <p className="text-sm text-muted-foreground">Aucune localité trouvée</p>
                      )}
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            )}
          </div>
          <DrawerFooter className="border-t pt-4">
            <Button variant="outline" onClick={() => setIsOpen(false)}>
              <XCircle className="mr-2 h-4 w-4" />
              Annuler
            </Button>
            <Button onClick={handleSave} disabled={createMutation.isPending || updateMutation.isPending}>
              {createMutation.isPending || updateMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Enregistrement...
                </>
              ) : editing ? (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Modifier
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Enregistrer
                </>
              )}
            </Button>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>

      {/* Modal de consultation des détails */}
      <Drawer open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
        <DrawerContent side="right" className="h-full w-full sm:max-w-2xl flex flex-col">
          <DrawerHeader>
            <DrawerTitle>Détails de la zone</DrawerTitle>
          </DrawerHeader>
          <div className="flex-1 overflow-y-auto px-6 py-4">
            {viewingZone ? (
              <div className="space-y-6">
                {/* Informations générales */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Informations générales</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">ID</p>
                      <p className="text-base font-medium">{viewingZone.id}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Nom</p>
                      <p className="text-base font-medium">{viewingZone.nom}</p>
                    </div>
                    <div className="col-span-2">
                      <p className="text-sm font-medium text-muted-foreground">Fréquence de visite</p>
                      <p className="text-base">{viewingZone.frequenceVisite || '—'}</p>
                    </div>
                  </div>
                </div>

                {/* Canaux */}
                <div className="space-y-4 pt-4 border-t">
                  <h3 className="text-lg font-semibold">Canaux associés</h3>
                  {viewingZone.zoneCanals && viewingZone.zoneCanals.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {viewingZone.zoneCanals.map((zc) => (
                        <div
                          key={zc.canal.id}
                          className="px-3 py-1.5 bg-blue-100 text-blue-800 rounded-md text-sm font-medium"
                        >
                          {zc.canal.nom}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">Aucun canal associé</p>
                  )}
                </div>

                {/* Types de vente */}
                <div className="space-y-4 pt-4 border-t">
                  <h3 className="text-lg font-semibold">Types de vente</h3>
                  {viewingZone.zoneTypeVentes && viewingZone.zoneTypeVentes.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {viewingZone.zoneTypeVentes.map((ztv) => (
                        <div
                          key={ztv.typeVente.id}
                          className="px-3 py-1.5 bg-green-100 text-green-800 rounded-md text-sm font-medium"
                        >
                          {ztv.typeVente.nom}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">Aucun type de vente associé</p>
                  )}
                </div>

                {/* Localités */}
                <div className="space-y-4 pt-4 border-t">
                  <h3 className="text-lg font-semibold">Localités</h3>
                  {viewingZone.zoneLocalites && viewingZone.zoneLocalites.length > 0 ? (
                    <div className="space-y-2">
                      {viewingZone.zoneLocalites.map((zl) => (
                        <div
                          key={zl.localite.id}
                          className="px-3 py-2 bg-purple-100 text-purple-800 rounded-md text-sm"
                        >
                          <div className="font-medium">{zl.localite.nom}</div>
                          {zl.localite.delegation && (
                            <div className="text-xs text-purple-600 mt-1">
                              {zl.localite.delegation.nom}
                              {zl.localite.delegation.gouvernorat && ` - ${zl.localite.delegation.gouvernorat.nom}`}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">Aucune localité associée</p>
                  )}
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                Aucune information à afficher
              </div>
            )}
          </div>
          <DrawerFooter className="border-t pt-4">
            <Button variant="outline" onClick={() => setIsDetailsOpen(false)}>
              <XCircle className="mr-2 h-4 w-4" />
              Fermer
            </Button>
            {viewingZone && (
              <Button onClick={() => {
                setIsDetailsOpen(false);
                openEdit(viewingZone);
              }}>
                <Edit className="mr-2 h-4 w-4" />
                Modifier
              </Button>
            )}
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    </div>
  );
}

