
'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerFooter } from '@/components/ui/drawer';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Search, Plus, MoreHorizontal, Edit, Trash2, Loader2, Link2, Eye, Save, XCircle, ChevronLeft, ChevronRight, Calendar, Check, ChevronsUpDown, X, CalendarDays } from 'lucide-react';
import { useSecteurs, useCreateSecteur, useUpdateSecteur, useDeleteSecteur, type Secteur } from '@/hooks/use-secteurs';
import { useClients } from '@/hooks/use-clients';
import { useZones } from '@/hooks/use-zones';
import { useTypeVentes } from '@/hooks/use-type-ventes';
import { useCanaux } from '@/hooks/use-canaux';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useSecteurZones, useAddSecteurZone, useRemoveSecteurZone, useSecteurTypeVentes, useAddSecteurTypeVente, useRemoveSecteurTypeVente } from '@/hooks/use-secteur-links';
import { Checkbox } from '@/components/ui/checkbox';
import { useCircuitCommercial, useUpdateCircuitCommercial } from '@/hooks/use-circuit-commercial';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { cn } from '@/lib/utils';

export default function SecteursPage() {
  const { data: secteurs = [], isLoading, error } = useSecteurs();
  const createMutation = useCreateSecteur();
  const updateMutation = useUpdateSecteur();
  const deleteMutation = useDeleteSecteur();

  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const limit = 10;

  const [isOpen, setIsOpen] = useState(false);
  const [editing, setEditing] = useState<Secteur | null>(null);
  const [nom, setNom] = useState('');
  const [selectedCanalIds, setSelectedCanalIds] = useState<number[]>([]);

  const { data: canaux = [] } = useCanaux();

  const [viewZonesOpen, setViewZonesOpen] = useState(false);
  const [viewTypeVentesOpen, setViewTypeVentesOpen] = useState(false);
  const [circuitCommercialOpen, setCircuitCommercialOpen] = useState(false);
  const [calendrierVisiteOpen, setCalendrierVisiteOpen] = useState(false);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [viewingSecteur, setViewingSecteur] = useState<Secteur | null>(null);

  const { data: zones = [] } = useZones();
  const { data: typeVentes = [] } = useTypeVentes();
  const { data: secteurZones = [] } = useSecteurZones(editing?.id ?? null);
  const { data: secteurTypeVentes = [] } = useSecteurTypeVentes(editing?.id ?? null);
  const { data: viewingZones = [], isLoading: loadingViewingZones } = useSecteurZones(viewingSecteur?.id ?? null);
  const { data: viewingTypeVentes = [], isLoading: loadingViewingTypeVentes } = useSecteurTypeVentes(viewingSecteur?.id ?? null);
  const addZone = useAddSecteurZone(editing?.id || 0);
  const removeZone = useRemoveSecteurZone(editing?.id || 0);
  const addTV = useAddSecteurTypeVente(editing?.id || 0);
  const removeTV = useRemoveSecteurTypeVente(editing?.id || 0);

  const [zoneSelections, setZoneSelections] = useState<number[]>([]);
  const [typeVenteSelections, setTypeVenteSelections] = useState<number[]>([]);
  const [zoneSearch, setZoneSearch] = useState('');
  const [typeVenteSearch, setTypeVenteSearch] = useState('');

  const lastInitializedSecteurId = useRef<number | null>(null);
  
  // Réinitialiser les sélections quand on change de secteur
  useEffect(() => {
    if (editing?.id !== lastInitializedSecteurId.current) {
      lastInitializedSecteurId.current = editing?.id ?? null;
      if (editing) {
        setZoneSelections([]);
        setTypeVenteSelections([]);
      }
    }
  }, [editing]);
  
  // Initialiser les sélections quand les données sont disponibles
  useEffect(() => {
    if (isOpen && editing && editing.id === lastInitializedSecteurId.current) {
      const currentZoneIds = (secteurZones || []).map(z => z.id);
      const currentTVIds = (secteurTypeVentes || []).map(t => t.id);
      
      // Mettre à jour les sélections si elles sont différentes
      // On met toujours à jour pour s'assurer que les sélections sont synchronisées avec les données
      setZoneSelections(prev => {
        const prevSorted = [...prev].sort();
        const currentSorted = [...currentZoneIds].sort();
        if (JSON.stringify(prevSorted) !== JSON.stringify(currentSorted)) {
          return currentZoneIds;
        }
        return prev;
      });
      
      setTypeVenteSelections(prev => {
        const prevSorted = [...prev].sort();
        const currentSorted = [...currentTVIds].sort();
        if (JSON.stringify(prevSorted) !== JSON.stringify(currentSorted)) {
          return currentTVIds;
        }
        return prev;
      });
    }
  }, [isOpen, editing, secteurZones, secteurTypeVentes]);

  const openCreate = () => {
    setEditing(null);
    setNom('');
    setSelectedCanalIds([]);
    setZoneSelections([]);
    setTypeVenteSelections([]);
    setZoneSearch('');
    setTypeVenteSearch('');
    setIsOpen(true);
  };
  
  const openEdit = (s: Secteur) => {
    setEditing(s);
    setNom(s.nom);
    setSelectedCanalIds(s.secteurCanals?.map((sc) => sc.canal.id) || []);
    setZoneSelections([]);
    setTypeVenteSelections([]);
    setZoneSearch('');
    setTypeVenteSearch('');
    setIsOpen(true);
  };
  const openViewZones = (s: Secteur) => { setViewingSecteur(s); setViewZonesOpen(true); };
  const openViewTypeVentes = (s: Secteur) => { setViewingSecteur(s); setViewTypeVentesOpen(true); };
  const openCircuitCommercial = (s: Secteur) => { setViewingSecteur(s); setCircuitCommercialOpen(true); };
  const openCalendrierVisite = (s: Secteur) => { setViewingSecteur(s); setCalendrierVisiteOpen(true); };
  const openDetails = (s: Secteur) => { setViewingSecteur(s); setIsDetailsOpen(true); };

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const items = q ? secteurs.filter((s) => s.nom.toLowerCase().includes(q) || String(s.id).includes(q)) : secteurs;
    const start = (page - 1) * limit;
    return { items: items.slice(start, start + limit), total: items.length, pages: Math.max(1, Math.ceil(items.length / limit)) };
  }, [secteurs, search, page]);

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
      
      const data: any = {
        nom,
        canalIds: selectedCanalIds,
      };
      
      if (editing) {
        // Vérifier si les canaux ont changé
        const currentCanalIds = editing.secteurCanals?.map((sc) => sc.canal.id) || [];
        const canalsChanged = currentCanalIds.length !== selectedCanalIds.length ||
          !currentCanalIds.every(id => selectedCanalIds.includes(id));
        if (canalsChanged) {
          data.canalIds = selectedCanalIds;
        }
        await updateMutation.mutateAsync({ id: editing.id, data });
      } else {
        await createMutation.mutateAsync(data);
      }
      setIsOpen(false);
      setEditing(null);
      setNom('');
      setSelectedCanalIds([]);
      setZoneSelections([]);
      setTypeVenteSelections([]);
      setZoneSearch('');
      setTypeVenteSearch('');
    } catch (error) {
      // Les toasts d'erreur sont déjà gérés dans les hooks
      console.error('Error saving secteur:', error);
    }
  };

  const handleDelete = async (s: Secteur) => {
    if (!confirm('Supprimer ce secteur ?')) return;
    await deleteMutation.mutateAsync(s.id);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-900">Secteurs</h1>
          <p className="text-gray-600 dark:text-gray-900">Gérez les secteurs</p>
        </div>
        <Button onClick={openCreate}><Plus className="mr-2 h-4 w-4"/>Ajouter</Button>
      </div>

      <Card>
        <div className="flex items-center space-x-4 p-6 pb-2">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input placeholder="Rechercher un secteur..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} className="pl-10" />
            </div>
          </div>
        </div>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8"><Loader2 className="h-8 w-8 animate-spin"/><span className="ml-2">Chargement...</span></div>
          ) : error ? (
            <div className="text-center py-8 text-red-600">Erreur lors du chargement</div>
          ) : filtered.total === 0 ? (
            <div className="text-center py-8 text-gray-500">Aucun secteur trouvé</div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Nom</TableHead>
                    <TableHead>Canaux</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.items.map((s) => (
                    <TableRow key={s.id}>
                      <TableCell className="font-medium">{s.id}</TableCell>
                      <TableCell>{s.nom}</TableCell>
                      <TableCell>
                        {s.secteurCanals && s.secteurCanals.length > 0
                          ? s.secteurCanals.map((sc) => sc.canal.nom).join(', ')
                          : '—'}
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0"><MoreHorizontal className="h-4 w-4" /></Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => openDetails(s)}><Eye className="mr-2 h-4 w-4"/>Consulter</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => openEdit(s)}><Edit className="mr-2 h-4 w-4"/>Modifier</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => openCircuitCommercial(s)}><Calendar className="mr-2 h-4 w-4"/>Circuit Commercial</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => openCalendrierVisite(s)}><CalendarDays className="mr-2 h-4 w-4"/>Calendrier de visite</DropdownMenuItem>
                            <DropdownMenuItem className="text-red-600" onClick={() => handleDelete(s)}><Trash2 className="mr-2 h-4 w-4"/>Supprimer</DropdownMenuItem>
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

      <Drawer open={isOpen} onOpenChange={(open) => {
        setIsOpen(open);
        if (!open) {
          setEditing(null);
          setNom('');
          setSelectedCanalIds([]);
          setZoneSelections([]);
          setTypeVenteSelections([]);
          setZoneSearch('');
          setTypeVenteSearch('');
        }
      }}>
        <DrawerContent side="right" className="h-full w-full sm:max-w-2xl flex flex-col">
          <DrawerHeader>
            <DrawerTitle>{editing ? 'Modifier' : 'Ajouter'} un secteur</DrawerTitle>
          </DrawerHeader>
          <div className="flex-1 overflow-y-auto px-6 py-4">
            {editing ? (
              <Tabs defaultValue="informations" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="informations">Informations</TabsTrigger>
                  <TabsTrigger value="liaisons">
                    Liaisons {zoneSelections.length > 0 || typeVenteSelections.length > 0 
                      ? `(${zoneSelections.length + typeVenteSelections.length})` 
                      : ''}
                  </TabsTrigger>
                </TabsList>
                
                <TabsContent value="informations" className="mt-4">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="nom">Nom <span className="text-red-500">*</span></Label>
                      <Input id="nom" value={nom} onChange={(e) => setNom(e.target.value)} placeholder="Ex: Secteur Nord" />
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
                  </div>
                </TabsContent>

                <TabsContent value="liaisons" className="mt-4">
                  <Tabs defaultValue="zones" className="w-full">
                    <TabsList className="grid w-full grid-cols-2">
                      <TabsTrigger value="zones">
                        Zones {zoneSelections.length > 0 && `(${zoneSelections.length})`}
                      </TabsTrigger>
                      <TabsTrigger value="types-vente">
                        Types de vente {typeVenteSelections.length > 0 && `(${typeVenteSelections.length})`}
                      </TabsTrigger>
                    </TabsList>
                    <TabsContent value="zones" className="mt-4">
                      <div className="space-y-4">
                        <div>
                          <h3 className="font-medium mb-2">Zones</h3>
                          <p className="text-sm text-muted-foreground mb-4">
                            Sélectionnez les zones associées à ce secteur
                          </p>
                          <div className="relative mb-4">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4" />
                            <Input
                              placeholder="Rechercher une zone..."
                              value={zoneSearch}
                              onChange={(e) => setZoneSearch(e.target.value)}
                              className="pl-10"
                            />
                          </div>
                          <div className="space-y-2 max-h-[400px] overflow-y-auto">
                            <div className="grid grid-cols-2 gap-3">
                              {zones
                                .filter(zone => 
                                  zone.nom.toLowerCase().includes(zoneSearch.toLowerCase())
                                )
                                .map((zone) => {
                                  const isChecked = zoneSelections.includes(zone.id);
                                  return (
                                    <label
                                      key={zone.id}
                                      className="flex items-center space-x-2 p-2 border rounded-md hover:bg-accent cursor-pointer"
                                    >
                                      <Checkbox
                                        checked={isChecked}
                                        onCheckedChange={(checked) => {
                                          setZoneSelections(prev => {
                                            const set = new Set(prev);
                                            if (checked) set.add(zone.id); else set.delete(zone.id);
                                            return Array.from(set);
                                          });
                                        }}
                                      />
                                      <span className="text-sm">{zone.nom}</span>
                                    </label>
                                  );
                                })}
                            </div>
                            {zones.filter(zone => 
                              zone.nom.toLowerCase().includes(zoneSearch.toLowerCase())
                            ).length === 0 && (
                              <div className="text-center py-8 text-gray-500 text-sm">
                                {zoneSearch ? 'Aucune zone trouvée' : 'Aucune zone disponible'}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </TabsContent>
                    <TabsContent value="types-vente" className="mt-4">
                      <div className="space-y-4">
                        <div>
                          <h3 className="font-medium mb-2">Types de vente</h3>
                          <p className="text-sm text-muted-foreground mb-4">
                            Sélectionnez les types de vente associés à ce secteur
                          </p>
                          <div className="relative mb-4">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4" />
                            <Input
                              placeholder="Rechercher un type de vente..."
                              value={typeVenteSearch}
                              onChange={(e) => setTypeVenteSearch(e.target.value)}
                              className="pl-10"
                            />
                          </div>
                          <div className="space-y-2 max-h-[400px] overflow-y-auto">
                            <div className="grid grid-cols-2 gap-3">
                              {typeVentes
                                .filter(tv => 
                                  tv.nom.toLowerCase().includes(typeVenteSearch.toLowerCase())
                                )
                                .map((tv) => {
                                  const isChecked = typeVenteSelections.includes(tv.id);
                                  return (
                                    <label
                                      key={tv.id}
                                      className="flex items-center space-x-2 p-2 border rounded-md hover:bg-accent cursor-pointer"
                                    >
                                      <Checkbox
                                        checked={isChecked}
                                        onCheckedChange={(checked) => {
                                          setTypeVenteSelections(prev => {
                                            const set = new Set(prev);
                                            if (checked) set.add(tv.id); else set.delete(tv.id);
                                            return Array.from(set);
                                          });
                                        }}
                                      />
                                      <span className="text-sm">{tv.nom}</span>
                                    </label>
                                  );
                                })}
                            </div>
                            {typeVentes.filter(tv => 
                              tv.nom.toLowerCase().includes(typeVenteSearch.toLowerCase())
                            ).length === 0 && (
                              <div className="text-center py-8 text-gray-500 text-sm">
                                {typeVenteSearch ? 'Aucun type de vente trouvé' : 'Aucun type de vente disponible'}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </TabsContent>
                  </Tabs>
                </TabsContent>
              </Tabs>
            ) : (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="nom">Nom <span className="text-red-500">*</span></Label>
                  <Input id="nom" value={nom} onChange={(e) => setNom(e.target.value)} placeholder="Ex: Secteur Nord" />
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
              </div>
            )}
          </div>
          <DrawerFooter className="border-t pt-4">
            <Button variant="outline" onClick={() => setIsOpen(false)}>
              <XCircle className="mr-2 h-4 w-4" />
              Annuler
            </Button>
            {editing ? (
              <>
                <Button
                  onClick={async () => {
                    // Sauvegarder les informations du secteur
                    if (!nom.trim()) {
                      alert('Le nom est requis');
                      return;
                    }
                    if (selectedCanalIds.length === 0) {
                      alert('Au moins un canal est requis');
                      return;
                    }
                    
                    await updateMutation.mutateAsync({ 
                      id: editing.id, 
                      data: { nom, canalIds: selectedCanalIds } 
                    });

                    // Sauvegarder les liaisons
                    const existingZoneIds = new Set((secteurZones || []).map(z => z.id));
                    const desiredZoneIds = new Set(zoneSelections);
                    const zoneAdds = Array.from(desiredZoneIds).filter(id => !existingZoneIds.has(id));
                    const zoneRemoves = Array.from(existingZoneIds).filter(id => !desiredZoneIds.has(id));

                    const existingTVIds = new Set((secteurTypeVentes || []).map(t => t.id));
                    const desiredTVIds = new Set(typeVenteSelections);
                    const tvAdds = Array.from(desiredTVIds).filter(id => !existingTVIds.has(id));
                    const tvRemoves = Array.from(existingTVIds).filter(id => !desiredTVIds.has(id));

                    try {
                      await Promise.all([
                        ...zoneAdds.map(id => addZone.mutateAsync(id)),
                        ...zoneRemoves.map(id => removeZone.mutateAsync(id)),
                        ...tvAdds.map(id => addTV.mutateAsync(id)),
                        ...tvRemoves.map(id => removeTV.mutateAsync(id)),
                      ]);
                      // Toast de succès pour les liaisons
                      if (zoneAdds.length > 0 || zoneRemoves.length > 0 || tvAdds.length > 0 || tvRemoves.length > 0) {
                        toast.success('Liaisons mises à jour avec succès');
                      }
                      setIsOpen(false);
                    } catch (error) {
                      // Les toasts d'erreur sont déjà gérés dans les hooks
                      console.error('Error updating liaisons:', error);
                    }
                  }}
                  disabled={createMutation.isPending || updateMutation.isPending}
                >
                  {createMutation.isPending || updateMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Enregistrement...
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      Enregistrer
                    </>
                  )}
                </Button>
              </>
            ) : (
              <Button onClick={handleSave} disabled={createMutation.isPending || updateMutation.isPending}>
                {createMutation.isPending || updateMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Enregistrement...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Enregistrer
                  </>
                )}
              </Button>
            )}
          </DrawerFooter>
        </DrawerContent>
      </Drawer>

      <Drawer open={viewZonesOpen} onOpenChange={setViewZonesOpen}>
        <DrawerContent side="right" className="h-full w-full sm:max-w-md flex flex-col">
          <DrawerHeader>
            <DrawerTitle>Zones liées au secteur {viewingSecteur?.nom}</DrawerTitle>
          </DrawerHeader>
          <div className="flex-1 overflow-y-auto px-6">
            <div className="space-y-2 pb-4">
              {loadingViewingZones ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin"/>
                  <span className="ml-2">Chargement...</span>
                </div>
              ) : viewingZones.length === 0 ? (
                <div className="text-center py-8 text-gray-500">Aucune zone liée</div>
              ) : (
                <div className="space-y-2">
                  {viewingZones.map((z) => (
                    <div key={z.id} className="flex items-center border-b pb-3 pt-2 last:border-b-0">
                      <span className="font-medium">{z.nom}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
          <DrawerFooter className="border-t pt-4">
            <Button variant="outline" onClick={() => setViewZonesOpen(false)}>
              <XCircle className="mr-2 h-4 w-4" />
              Fermer
            </Button>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>

      <Drawer open={viewTypeVentesOpen} onOpenChange={setViewTypeVentesOpen}>
        <DrawerContent side="right" className="h-full w-full sm:max-w-md flex flex-col">
          <DrawerHeader>
            <DrawerTitle>Types de vente liés au secteur {viewingSecteur?.nom}</DrawerTitle>
          </DrawerHeader>
          <div className="flex-1 overflow-y-auto px-6">
            <div className="space-y-2 pb-4">
              {loadingViewingTypeVentes ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin"/>
                  <span className="ml-2">Chargement...</span>
                </div>
              ) : viewingTypeVentes.length === 0 ? (
                <div className="text-center py-8 text-gray-500">Aucun type de vente lié</div>
              ) : (
                <div className="space-y-2">
                  {viewingTypeVentes.map((tv) => (
                    <div key={tv.id} className="flex items-center border-b pb-3 pt-2 last:border-b-0">
                      <span className="font-medium">{tv.nom}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
          <DrawerFooter className="border-t pt-4">
            <Button variant="outline" onClick={() => setViewTypeVentesOpen(false)}>
              <XCircle className="mr-2 h-4 w-4" />
              Fermer
            </Button>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>

      <CircuitCommercialDrawer 
        secteur={viewingSecteur}
        isOpen={circuitCommercialOpen}
        onClose={() => {
          setCircuitCommercialOpen(false);
          setViewingSecteur(null);
        }}
      />

      <CalendrierVisiteDrawer 
        secteur={viewingSecteur}
        isOpen={calendrierVisiteOpen}
        onClose={() => {
          setCalendrierVisiteOpen(false);
          setViewingSecteur(null);
        }}
      />

      {/* Modal de consultation des détails */}
      <SecteurDetailsModal
        secteur={viewingSecteur}
        isOpen={isDetailsOpen}
        onClose={() => {
          setIsDetailsOpen(false);
          setViewingSecteur(null);
        }}
      />
    </div>
  );
}

// Component for Secteur Details Modal
function SecteurDetailsModal({ 
  secteur, 
  isOpen, 
  onClose 
}: { 
  secteur: Secteur | null; 
  isOpen: boolean; 
  onClose: () => void;
}) {
  const [clientsPage, setClientsPage] = useState(1);
  const clientsLimit = 10;
  
  const { data: secteurZones = [], isLoading: loadingZones } = useSecteurZones(secteur?.id ?? null);
  const { data: secteurTypeVentes = [], isLoading: loadingTypeVentes } = useSecteurTypeVentes(secteur?.id ?? null);
  const { data: clientsData, isLoading: loadingClients } = useClients(
    secteur?.id ? { secteurId: secteur.id, limit: 1 } : {}
  );
  const { data: clientsListData, isLoading: loadingClientsList } = useClients(
    secteur?.id ? { secteurId: secteur.id, page: clientsPage, limit: clientsLimit } : {}
  );

  return (
    <Drawer open={isOpen} onOpenChange={onClose}>
      <DrawerContent 
        side="right" 
        className="h-full flex flex-col"
        style={{ width: '60vw', maxWidth: '60vw' }}
      >
        <DrawerHeader>
          <DrawerTitle>Détails du secteur</DrawerTitle>
        </DrawerHeader>
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {secteur ? (
            <Tabs defaultValue="informations" className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="informations">Informations</TabsTrigger>
                <TabsTrigger value="zones">Zones</TabsTrigger>
                <TabsTrigger value="types-vente">Types de vente</TabsTrigger>
                <TabsTrigger value="clients">
                  Clients {clientsData?.pagination?.total ? `(${clientsData.pagination.total})` : ''}
                </TabsTrigger>
              </TabsList>

              {/* Onglet 1 : Informations générales */}
              <TabsContent value="informations" className="mt-4 space-y-6">
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Informations générales</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">ID</p>
                      <p className="text-base font-medium">{secteur.id}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Nom</p>
                      <p className="text-base font-medium">{secteur.nom}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Nombre de zones affectées</p>
                      <p className="text-base font-medium">
                        {loadingZones ? (
                          <Loader2 className="h-4 w-4 animate-spin inline" />
                        ) : (
                          secteurZones.length
                        )}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Nombre de types de vente</p>
                      <p className="text-base font-medium">
                        {loadingTypeVentes ? (
                          <Loader2 className="h-4 w-4 animate-spin inline" />
                        ) : (
                          secteurTypeVentes.length
                        )}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Nombre de clients</p>
                      <p className="text-base font-medium">
                        {loadingClients ? (
                          <Loader2 className="h-4 w-4 animate-spin inline" />
                        ) : (
                          clientsData?.pagination?.total ?? 0
                        )}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Canaux associés */}
                <div className="space-y-4 pt-4 border-t">
                  <h3 className="text-lg font-semibold">Canaux associés</h3>
                  {secteur.secteurCanals && secteur.secteurCanals.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {secteur.secteurCanals.map((sc) => (
                        <div
                          key={sc.canal.id}
                          className="px-3 py-1.5 bg-blue-100 text-blue-800 rounded-md text-sm font-medium"
                        >
                          {sc.canal.nom}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">Aucun canal associé</p>
                  )}
                </div>
              </TabsContent>

              {/* Onglet 2 : Zones */}
              <TabsContent value="zones" className="mt-4 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">Zones associées</h3>
                  {secteurZones.length > 0 && (
                    <span className="text-sm text-muted-foreground">
                      {secteurZones.length} zone{secteurZones.length > 1 ? 's' : ''}
                    </span>
                  )}
                </div>
                {loadingZones ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin" />
                    <span className="ml-2">Chargement des zones...</span>
                  </div>
                ) : secteurZones.length > 0 ? (
                  <div className="border rounded-lg overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-[80px]">ID</TableHead>
                          <TableHead>Nom</TableHead>
                          <TableHead>Canaux</TableHead>
                          <TableHead>Types de vente</TableHead>
                          <TableHead>Fréquence</TableHead>
                          <TableHead>Nombre de clients</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {secteurZones.map((zone) => (
                          <TableRow key={zone.id}>
                            <TableCell className="font-medium">{zone.id}</TableCell>
                            <TableCell className="font-medium">{zone.nom}</TableCell>
                            <TableCell>
                              {zone.zoneCanals && zone.zoneCanals.length > 0 ? (
                                <div className="flex flex-wrap gap-1">
                                  {zone.zoneCanals.map((zc) => (
                                    <span
                                      key={zc.canal.id}
                                      className="px-2 py-0.5 bg-blue-100 text-blue-800 rounded text-xs font-medium"
                                    >
                                      {zc.canal.nom}
                                    </span>
                                  ))}
                                </div>
                              ) : (
                                <span className="text-sm text-muted-foreground">—</span>
                              )}
                            </TableCell>
                            <TableCell>
                              {zone.zoneTypeVentes && zone.zoneTypeVentes.length > 0 ? (
                                <span className="text-sm">
                                  {zone.zoneTypeVentes.map((ztv) => ztv.typeVente.nom).join(', ')}
                                </span>
                              ) : (
                                <span className="text-sm text-muted-foreground">—</span>
                              )}
                            </TableCell>
                            <TableCell>
                              {zone.frequenceVisite ? (
                                <span className="text-sm font-medium">{zone.frequenceVisite}</span>
                              ) : (
                                <span className="text-sm text-muted-foreground">—</span>
                              )}
                            </TableCell>
                            <TableCell>
                              <span className="font-medium">{zone.clientCount ?? 0}</span>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    Aucune zone associée à ce secteur
                  </div>
                )}
              </TabsContent>

              {/* Onglet 3 : Types de vente */}
              <TabsContent value="types-vente" className="mt-4 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">Types de vente associés</h3>
                  {secteurTypeVentes.length > 0 && (
                    <span className="text-sm text-muted-foreground">
                      {secteurTypeVentes.length} type{secteurTypeVentes.length > 1 ? 's' : ''} de vente
                    </span>
                  )}
                </div>
                {loadingTypeVentes ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin" />
                    <span className="ml-2">Chargement des types de vente...</span>
                  </div>
                ) : secteurTypeVentes.length > 0 ? (
                  <div className="border rounded-lg overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-[80px]">ID</TableHead>
                          <TableHead>Nom</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {secteurTypeVentes.map((tv) => (
                          <TableRow key={tv.id}>
                            <TableCell className="font-medium">{tv.id}</TableCell>
                            <TableCell className="font-medium">{tv.nom}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    Aucun type de vente associé à ce secteur
                  </div>
                )}
              </TabsContent>

              {/* Onglet 4 : Clients */}
              <TabsContent value="clients" className="mt-4 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">Clients rattachés</h3>
                  {clientsListData?.pagination?.total !== undefined && (
                    <span className="text-sm text-muted-foreground">
                      {clientsListData.pagination.total} client{clientsListData.pagination.total > 1 ? 's' : ''}
                    </span>
                  )}
                </div>
                {loadingClientsList ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin" />
                    <span className="ml-2">Chargement des clients...</span>
                  </div>
                ) : !clientsListData?.data || clientsListData.data.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    Aucun client rattaché à ce secteur
                  </div>
                ) : (
                  <>
                    <div className="border rounded-lg overflow-hidden">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="w-[100px]">Code</TableHead>
                            <TableHead>Nom</TableHead>
                            <TableHead>Nom commercial</TableHead>
                            <TableHead>Localité</TableHead>
                            <TableHead>Canal</TableHead>
                            <TableHead>Type de vente</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {clientsListData.data.map((client: any) => (
                            <TableRow key={client.id}>
                              <TableCell className="font-medium">{client.code}</TableCell>
                              <TableCell>{client.nom}</TableCell>
                              <TableCell>{client.nomCommercial || '—'}</TableCell>
                              <TableCell>{client.localite?.nom || '—'}</TableCell>
                              <TableCell>{client.canal?.nom || '—'}</TableCell>
                              <TableCell>{client.typeVente?.nom || '—'}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                    {clientsListData.pagination && clientsListData.pagination.pages > 1 && (
                      <div className="flex items-center justify-between mt-4">
                        <div className="text-sm text-gray-500">
                          Page {clientsPage} sur {clientsListData.pagination.pages} ({clientsListData.pagination.total} résultat(s))
                        </div>
                        <div className="flex space-x-2">
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => setClientsPage((p) => Math.max(1, p - 1))} 
                            disabled={clientsPage === 1}
                          >
                            <ChevronLeft className="mr-2 h-4 w-4" />
                            Précédent
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => setClientsPage((p) => Math.min(clientsListData.pagination.pages, p + 1))} 
                            disabled={clientsPage === clientsListData.pagination.pages}
                          >
                            Suivant
                            <ChevronRight className="ml-2 h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </TabsContent>
            </Tabs>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              Aucune information à afficher
            </div>
          )}
        </div>
        <DrawerFooter className="border-t pt-4">
          <Button variant="outline" onClick={onClose}>
            <XCircle className="mr-2 h-4 w-4" />
            Fermer
          </Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}

// Component for Circuit Commercial Drawer
function CircuitCommercialDrawer({ 
  secteur, 
  isOpen, 
  onClose 
}: { 
  secteur: Secteur | null; 
  isOpen: boolean; 
  onClose: () => void;
}) {
  const { data: circuitCommercial, isLoading } = useCircuitCommercial(secteur?.id ?? null);
  const { data: zones = [] } = useZones();
  const updateMutation = useUpdateCircuitCommercial();

  const [planning, setPlanning] = useState<Record<number, Array<{
    zoneId: number;
    frequence: 'semaine' | 'quinzaine' | 'mois';
    groupes?: string;
    isExisting?: boolean; // Indique si la zone est déjà enregistrée
  }>>>({});
  const [selectedZones, setSelectedZones] = useState<Record<number, string>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});

  const jours = [
    { id: 1, nom: 'Lundi' },
    { id: 2, nom: 'Mardi' },
    { id: 3, nom: 'Mercredi' },
    { id: 4, nom: 'Jeudi' },
    { id: 5, nom: 'Vendredi' },
    { id: 6, nom: 'Samedi' },
    { id: 7, nom: 'Dimanche' },
  ];

  // Filtrer les zones qui ont au moins un canal en commun avec le secteur
  const zonesFiltrees = zones.filter(z => {
    if (!secteur?.secteurCanals || secteur.secteurCanals.length === 0) return false;
    const secteurCanalIds = secteur.secteurCanals.map(sc => sc.canal.id);
    const zoneCanalIds = z.zoneCanals?.map(zc => zc.canal.id) || [];
    return zoneCanalIds.some(zcId => secteurCanalIds.includes(zcId));
  });

  // Initialiser le planning depuis les données
  useEffect(() => {
    if (circuitCommercial && circuitCommercial.circuitCommercialZones) {
      const newPlanning: Record<number, Array<{
        zoneId: number;
        frequence: 'semaine' | 'quinzaine' | 'mois';
        groupes?: string;
        isExisting?: boolean;
      }>> = {};
      
      circuitCommercial.circuitCommercialZones.forEach((cz) => {
        if (!newPlanning[cz.jour]) {
          newPlanning[cz.jour] = [];
        }
        newPlanning[cz.jour].push({
          zoneId: cz.zoneId,
          frequence: cz.frequence,
          groupes: cz.groupes || undefined,
          isExisting: true, // Zone déjà enregistrée
        });
      });
      
      setPlanning(newPlanning);
    } else {
      setPlanning({});
    }
    // Réinitialiser les sélections
    setSelectedZones({});
  }, [circuitCommercial]);

  const addZoneToDay = (jour: number, zoneId: number) => {
    const zone = zonesFiltrees.find(z => z.id === zoneId);
    // Déterminer la fréquence automatiquement à partir de frequenceVisite de la zone
    let frequence: 'semaine' | 'quinzaine' | 'mois' = 'semaine';
    if (zone?.frequenceVisite) {
      if (zone.frequenceVisite.includes('semaine') || zone.frequenceVisite === 'Par semaine') {
        frequence = 'semaine';
      } else if (zone.frequenceVisite.includes('quinzaine') || zone.frequenceVisite === 'Par quinzaine') {
        frequence = 'quinzaine';
      } else if (zone.frequenceVisite.includes('mois') || zone.frequenceVisite === 'Par mois') {
        frequence = 'mois';
      }
    }
    
    setPlanning(prev => {
      const dayZones = prev[jour] || [];
      // Empêcher l'ajout si la zone est déjà présente dans ce jour
      if (dayZones.some(z => z.zoneId === zoneId)) {
        return prev; // Zone déjà présente dans ce jour
      }
      return {
        ...prev,
        [jour]: [...dayZones, { zoneId, frequence, isExisting: false }],
      };
    });
    // Réinitialiser le select
    setSelectedZones(prev => ({ ...prev, [jour]: '' }));
  };

  const updateZoneFrequence = (jour: number, index: number, frequence: 'semaine' | 'quinzaine' | 'mois', groupes?: string) => {
    setPlanning(prev => {
      const dayZones = prev[jour] || [];
      const updated = [...dayZones];
      updated[index] = { ...updated[index], frequence, groupes };
      return {
        ...prev,
        [jour]: updated,
      };
    });
  };

  const removeZoneFromDay = (jour: number, index: number) => {
    setPlanning(prev => {
      const dayZones = prev[jour] || [];
      return {
        ...prev,
        [jour]: dayZones.filter((_, i) => i !== index),
      };
    });
  };


  const handleSave = async () => {
    if (!secteur) return;

    // Valider les zones avant l'envoi
    const newErrors: Record<string, string> = {};
    
    Object.entries(planning).forEach(([jourStr, dayZones]) => {
      dayZones.forEach((zone, index) => {
        const errorKey = `${jourStr}-${index}`;
        if (zone.frequence === 'quinzaine' && !zone.groupes) {
          newErrors[errorKey] = 'Les groupes sont requis pour la fréquence quinzaine';
        } else if (zone.frequence === 'mois' && !zone.groupes) {
          newErrors[errorKey] = 'Le groupe est requis pour la fréquence mois';
        }
      });
    });

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      toast.error('Veuillez corriger les erreurs avant de sauvegarder');
      return;
    }

    setErrors({});

    const zonesToSave: Array<{
      zoneId: number;
      jour: number;
      frequence: 'semaine' | 'quinzaine' | 'mois';
      groupes?: string;
    }> = [];

    Object.entries(planning).forEach(([jourStr, dayZones]) => {
      dayZones.forEach(zone => {
        zonesToSave.push({
          zoneId: zone.zoneId,
          jour: Number(jourStr),
          frequence: zone.frequence,
          groupes: zone.groupes,
        });
      });
    });

    await updateMutation.mutateAsync({
      secteurId: secteur.id,
      data: { zones: zonesToSave },
    });
  };

  return (
    <Drawer open={isOpen} onOpenChange={(open) => {
      if (!open) {
        setErrors({}); // Réinitialiser les erreurs à la fermeture
      }
      onClose();
    }}>
      <DrawerContent 
        side="right" 
        className="h-full flex flex-col"
        style={{ width: '98vw', maxWidth: '98vw' }}
      >
        <DrawerHeader>
          <DrawerTitle>Circuit Commercial - {secteur?.nom}</DrawerTitle>
        </DrawerHeader>
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin"/>
              <span className="ml-2">Chargement...</span>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="grid grid-cols-7 gap-4">
                {jours.map((jour) => {
                  const dayZones = planning[jour.id] || [];
                  return (
                    <div key={jour.id} className="border rounded-lg p-4 space-y-3">
                      <h3 className="font-semibold text-center">{jour.nom}</h3>
                      
                      {/* Liste des zones du jour */}
                      <div className="space-y-2">
                        {dayZones.map((zoneData, index) => {
                          const zone = zonesFiltrees.find(z => z.id === zoneData.zoneId);
                          const isExisting = zoneData.isExisting ?? false;
                          const frequenceLabel = 
                            zoneData.frequence === 'semaine' ? 'Par semaine' :
                            zoneData.frequence === 'quinzaine' ? 'Par quinzaine' :
                            'Par mois';
                          
                          return (
                            <div key={index} className="border rounded p-2 space-y-2 bg-blue-50">
                              <div className="flex items-center justify-between">
                                <span className="text-sm font-medium">{zone?.nom || 'Zone inconnue'}</span>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => removeZoneFromDay(jour.id, index)}
                                  className="h-6 w-6 p-0"
                                >
                                  <XCircle className="h-4 w-4" />
                                </Button>
                              </div>
                              
                              {/* Affichage de la fréquence (toujours en lecture seule) */}
                              <div className="space-y-1">
                                <div className="text-xs text-gray-600">Fréquence de visite:</div>
                                <div className="text-sm font-medium">{frequenceLabel}</div>
                                
                                    {/* Sélecteur de groupes pour quinzaine (seulement si pas enregistrée) */}
                                {!isExisting && zoneData.frequence === 'quinzaine' && (
                                  <div className="space-y-1 mt-2">
                                    <Label className="text-xs">Groupes de semaines</Label>
                                    <Select
                                      value={zoneData.groupes || ''}
                                      onValueChange={(value) => {
                                        updateZoneFrequence(jour.id, index, 'quinzaine', value);
                                        // Supprimer l'erreur quand l'utilisateur sélectionne
                                        const errorKey = `${jour.id}-${index}`;
                                        setErrors(prev => {
                                          const newErrors = { ...prev };
                                          delete newErrors[errorKey];
                                          return newErrors;
                                        });
                                      }}
                                    >
                                      <SelectTrigger className={cn(
                                        "h-8 text-xs",
                                        errors[`${jour.id}-${index}`] && "border-red-500 border-2"
                                      )}>
                                        <SelectValue placeholder="Choisir les groupes" />
                                      </SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="1,3">Groupes 1,3</SelectItem>
                                        <SelectItem value="2,4">Groupes 2,4</SelectItem>
                                      </SelectContent>
                                    </Select>
                                    {errors[`${jour.id}-${index}`] && (
                                      <p className="text-xs text-red-600">{errors[`${jour.id}-${index}`]}</p>
                                    )}
                                  </div>
                                )}

                                {/* Sélecteur de groupes pour mois (seulement si pas enregistrée) */}
                                {!isExisting && zoneData.frequence === 'mois' && (
                                  <div className="space-y-1 mt-2">
                                    <Label className="text-xs">Groupe de semaines</Label>
                                    <Select
                                      value={zoneData.groupes || ''}
                                      onValueChange={(value) => {
                                        updateZoneFrequence(jour.id, index, 'mois', value);
                                        // Supprimer l'erreur quand l'utilisateur sélectionne
                                        const errorKey = `${jour.id}-${index}`;
                                        setErrors(prev => {
                                          const newErrors = { ...prev };
                                          delete newErrors[errorKey];
                                          return newErrors;
                                        });
                                      }}
                                    >
                                      <SelectTrigger className={cn(
                                        "h-8 text-xs",
                                        errors[`${jour.id}-${index}`] && "border-red-500 border-2"
                                      )}>
                                        <SelectValue placeholder="Choisir le groupe" />
                                      </SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="1">Groupe 1</SelectItem>
                                        <SelectItem value="2">Groupe 2</SelectItem>
                                        <SelectItem value="3">Groupe 3</SelectItem>
                                        <SelectItem value="4">Groupe 4</SelectItem>
                                      </SelectContent>
                                    </Select>
                                    {errors[`${jour.id}-${index}`] && (
                                      <p className="text-xs text-red-600">{errors[`${jour.id}-${index}`]}</p>
                                    )}
                                  </div>
                                )}

                                {/* Affichage des groupes enregistrés */}
                                {isExisting && zoneData.frequence === 'quinzaine' && zoneData.groupes && (
                                  <div className="text-xs text-gray-500">Groupes: {zoneData.groupes}</div>
                                )}
                                {isExisting && zoneData.frequence === 'mois' && zoneData.groupes && (
                                  <div className="text-xs text-gray-500">Groupe: {zoneData.groupes}</div>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      {/* Combobox pour ajouter une zone */}
                      {zonesFiltrees.length > 0 && (
                        <div className="flex justify-center">
                          <ZoneCombobox
                            zones={zonesFiltrees}
                            selectedZoneIds={Object.values(planning).flat().map(z => z.zoneId)}
                            onSelect={(zoneId) => {
                              addZoneToDay(jour.id, zoneId);
                            }}
                            placeholder="Ajouter une zone"
                          />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
        <DrawerFooter className="border-t pt-4">
          <Button variant="outline" onClick={onClose}>
            <XCircle className="mr-2 h-4 w-4" />
            Annuler
          </Button>
          <Button 
            onClick={handleSave} 
            disabled={updateMutation.isPending}
          >
            {updateMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Enregistrement...
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
  );
}

type Option = { id: number; label: string };

// Composant Combobox pour les zones
function ZoneCombobox({
  zones,
  selectedZoneIds = [],
  onSelect,
  placeholder = "Sélectionner une zone",
}: {
  zones: Array<{ id: number; nom: string }>;
  selectedZoneIds?: number[];
  onSelect: (zoneId: number) => void;
  placeholder?: string;
}) {
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState('');

  const handleSelect = (zoneId: number) => {
    onSelect(zoneId);
    setValue(''); // Réinitialiser après sélection
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between"
        >
          {value
            ? zones.find((zone) => String(zone.id) === value)?.nom
            : placeholder}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0" align="start">
        <Command>
          <CommandInput placeholder="Rechercher une zone..." />
          <CommandList>
            <CommandEmpty>Aucune zone trouvée.</CommandEmpty>
            <CommandGroup>
              {zones.map((zone) => {
                const isPresent = selectedZoneIds.includes(zone.id);
                return (
                  <CommandItem
                    key={zone.id}
                    value={zone.nom}
                    onSelect={() => handleSelect(zone.id)}
                    className="cursor-pointer"
                    disabled={false}
                    aria-disabled={false}
                  >
                    {isPresent ? (
                      <X className="mr-2 h-4 w-4 text-red-600" />
                    ) : (
                      <Check className="mr-2 h-4 w-4 text-green-600" />
                    )}
                    {zone.nom}
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

function MultiLinkPicker({
  options,
  selectedIds,
  onToggle,
  placeholder,
  buttonLabel,
}: {
  options: Option[];
  selectedIds: number[];
  onToggle: (id: number, checked: boolean) => void;
  placeholder: string;
  buttonLabel: string;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const selectedSet = new Set(selectedIds);
  const filtered = query.trim()
    ? options.filter(o => o.label.toLowerCase().includes(query.trim().toLowerCase()))
    : options;

  return (
    <>
      <Button variant="outline" className="w-full justify-between" onClick={() => setOpen(true)}>
        <span className="truncate">{buttonLabel}</span>
        <MoreHorizontal className="h-4 w-4 opacity-60" />
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Sélection</DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            <Input placeholder={placeholder} value={query} onChange={(e) => setQuery(e.target.value)} />
            <div className="max-h-64 overflow-auto space-y-1 border rounded p-1">
              {filtered.length === 0 ? (
                <div className="text-sm text-gray-500 px-1">Aucun résultat</div>
              ) : (
                filtered.map((opt) => {
                  const isChecked = selectedSet.has(opt.id);
                  return (
                    <label key={opt.id} className="flex items-center space-x-2 px-1 py-1 hover:bg-muted rounded">
                      <Checkbox checked={isChecked} onCheckedChange={(c) => onToggle(opt.id, !!c)} />
                      <span className="truncate">{opt.label}</span>
                    </label>
                  );
                })
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              <XCircle className="mr-2 h-4 w-4" />
              Fermer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

// Component for Calendrier de Visite Drawer
function CalendrierVisiteDrawer({ 
  secteur, 
  isOpen, 
  onClose 
}: { 
  secteur: Secteur | null; 
  isOpen: boolean; 
  onClose: () => void;
}) {
  const { data: circuitCommercial, isLoading } = useCircuitCommercial(secteur?.id ?? null);
  const { data: zones = [] } = useZones();

  const jours = [
    { id: 1, nom: 'Lundi' },
    { id: 2, nom: 'Mardi' },
    { id: 3, nom: 'Mercredi' },
    { id: 4, nom: 'Jeudi' },
    { id: 5, nom: 'Vendredi' },
    { id: 6, nom: 'Samedi' },
    { id: 7, nom: 'Dimanche' },
  ];

  // Générer les numéros de semaine (1 à 52)
  const semaines = Array.from({ length: 52 }, (_, i) => i + 1);

  // Fonction pour calculer la semaine du mois pour une semaine donnée de l'année
  const getSemaineDuMois = (semaineAnnee: number): number => {
    // Approche simplifiée : chaque mois a environ 4.33 semaines
    // On divise l'année en 12 mois, chaque mois ayant ~4 semaines
    // Semaine 1-4 = mois 1 (semaine 1-4 du mois)
    // Semaine 5-8 = mois 2 (semaine 1-4 du mois)
    // etc.
    const semaineDansMois = ((semaineAnnee - 1) % 4) + 1;
    return semaineDansMois;
  };

  // Fonction pour calculer si une zone doit être affichée pour une semaine et un jour donnés
  const shouldDisplayZone = (
    zoneData: { jour: number; frequence: 'semaine' | 'quinzaine' | 'mois'; groupes?: string | null },
    semaine: number,
    jour: number
  ): boolean => {
    // Vérifier que le jour correspond
    if (zoneData.jour !== jour) {
      return false;
    }

    switch (zoneData.frequence) {
      case 'semaine':
        // Par semaine : afficher toutes les semaines
        return true;

      case 'quinzaine':
        // Par quinzaine : vérifier les groupes
        if (!zoneData.groupes) return false;
        const groupes = zoneData.groupes.split(',').map(g => parseInt(g.trim()));
        
        if (groupes.includes(1) && groupes.includes(3)) {
          // Groupes 1,3 : semaines impaires (1, 3, 5, 7, 9, 11, 13, 15, 17, 19, 21, 23, 25, 27, 29, 31, 33, 35, 37, 39, 41, 43, 45, 47, 49, 51)
          return semaine % 2 === 1;
        } else if (groupes.includes(2) && groupes.includes(4)) {
          // Groupes 2,4 : semaines paires (2, 4, 6, 8, 10, 12, 14, 16, 18, 20, 22, 24, 26, 28, 30, 32, 34, 36, 38, 40, 42, 44, 46, 48, 50, 52)
          return semaine % 2 === 0;
        }
        return false;

      case 'mois':
        // Par mois : calculer la semaine du mois
        if (!zoneData.groupes) return false;
        const groupeMois = parseInt(zoneData.groupes.trim());
        
        // Calculer la semaine du mois pour cette semaine de l'année
        const semaineDansMois = getSemaineDuMois(semaine);
        
        return semaineDansMois === groupeMois;

      default:
        return false;
    }
  };

  // Obtenir les zones pour une cellule donnée (semaine, jour)
  const getZonesForCell = (semaine: number, jour: number) => {
    if (!circuitCommercial?.circuitCommercialZones) return [];
    
    return circuitCommercial.circuitCommercialZones
      .filter(cz => shouldDisplayZone(cz, semaine, jour))
      .map(cz => {
        const zone = zones.find(z => z.id === cz.zoneId);
        return {
          ...cz,
          zoneNom: zone?.nom || 'Zone inconnue',
        };
      });
  };

  return (
    <Drawer open={isOpen} onOpenChange={onClose}>
      <DrawerContent 
        side="right" 
        className="h-full flex flex-col"
        style={{ width: '98vw', maxWidth: '98vw' }}
      >
        <DrawerHeader>
          <DrawerTitle>Calendrier de Visite - {secteur?.nom}</DrawerTitle>
        </DrawerHeader>
        <div className="flex-1 overflow-auto px-6 py-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin"/>
              <span className="ml-2">Chargement...</span>
            </div>
          ) : !circuitCommercial?.circuitCommercialZones || circuitCommercial.circuitCommercialZones.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              Aucun circuit commercial configuré. Veuillez configurer le circuit commercial d'abord.
            </div>
          ) : (
            <div className="space-y-4">
              <div className="text-sm text-gray-600 mb-4">
                <p>Légende : Les zones sont affichées dans les cellules correspondant à leur jour et fréquence de visite.</p>
              </div>
              
              {/* Tableau du calendrier */}
              <div className="border rounded-lg overflow-hidden bg-white dark:bg-gray-950">
                <div className="overflow-x-auto max-h-[calc(100vh-300px)]">
                  <table className="w-full border-collapse">
                    <thead className="sticky top-0 z-20">
                      <tr className="bg-gray-100 dark:bg-gray-800">
                        <th className="border p-2 text-left font-semibold sticky left-0 bg-gray-100 dark:bg-gray-800 z-30 min-w-[120px] shadow-lg">
                          Jour / Semaine
                        </th>
                        {semaines.map((semaine) => (
                          <th 
                            key={semaine} 
                            className="border p-2 text-center font-semibold min-w-[80px] bg-gray-100 dark:bg-gray-800"
                          >
                            S{semaine}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {jours.map((jour) => (
                        <tr key={jour.id} className="hover:bg-gray-50 dark:hover:bg-gray-900">
                          <td className="border p-2 font-medium sticky left-0 bg-white dark:bg-gray-950 z-20 shadow-lg">
                            {jour.nom}
                          </td>
                          {semaines.map((semaine) => {
                            const zonesForCell = getZonesForCell(semaine, jour.id);
                            return (
                              <td 
                                key={`${jour.id}-${semaine}`} 
                                className="border p-1 text-xs align-top min-h-[60px] w-[80px]"
                              >
                                {zonesForCell.length > 0 ? (
                                  <div className="space-y-1">
                                    {zonesForCell.map((cz) => (
                                      <div
                                        key={cz.id}
                                        className="bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded px-1 py-0.5 font-medium text-[10px] truncate cursor-help"
                                        title={`${cz.zoneNom} - ${cz.frequence}${cz.groupes ? ` (${cz.groupes})` : ''}`}
                                      >
                                        {cz.zoneNom}
                                      </div>
                                    ))}
                                  </div>
                                ) : (
                                  <div className="text-gray-300 dark:text-gray-700 text-center text-[10px]">—</div>
                                )}
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Légende des fréquences */}
              <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
                <h3 className="font-semibold mb-2">Légende des fréquences :</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-sm">
                  <div>
                    <span className="font-medium">Par semaine :</span> Zone visitée chaque semaine
                  </div>
                  <div>
                    <span className="font-medium">Par quinzaine (1,3) :</span> Zone visitée les semaines impaires
                  </div>
                  <div>
                    <span className="font-medium">Par quinzaine (2,4) :</span> Zone visitée les semaines paires
                  </div>
                  <div>
                    <span className="font-medium">Par mois (1-4) :</span> Zone visitée la semaine correspondante du mois
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
        <DrawerFooter className="border-t pt-4">
          <Button variant="outline" onClick={onClose}>
            <XCircle className="mr-2 h-4 w-4" />
            Fermer
          </Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
