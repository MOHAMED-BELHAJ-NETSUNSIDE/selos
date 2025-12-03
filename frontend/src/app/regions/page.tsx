'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerFooter } from '@/components/ui/drawer';
import { Label } from '@/components/ui/label';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Search, Plus, MoreHorizontal, Edit, Trash2, Loader2, Link2, Eye, Save, XCircle, ChevronLeft, ChevronRight } from 'lucide-react';
import { useRegions, useCreateRegion, useUpdateRegion, useDeleteRegion, type Region } from '@/hooks/use-regions';
import { useSousRegions } from '@/hooks/use-sous-regions';
import { useRegionSousRegions, useAddRegionSousRegion, useRemoveRegionSousRegion } from '@/hooks/use-region-links';
import { Checkbox } from '@/components/ui/checkbox';

export default function RegionsPage() {
  const { data: regions = [], isLoading, error } = useRegions();
  const createMutation = useCreateRegion();
  const updateMutation = useUpdateRegion();
  const deleteMutation = useDeleteRegion();

  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const limit = 10;

  const [isOpen, setIsOpen] = useState(false);
  const [editing, setEditing] = useState<Region | null>(null);
  const [nom, setNom] = useState('');

  const [linksOpen, setLinksOpen] = useState(false);
  const [selectedRegion, setSelectedRegion] = useState<Region | null>(null);
  const [viewLinksOpen, setViewLinksOpen] = useState(false);
  const [viewingRegion, setViewingRegion] = useState<Region | null>(null);

  const { data: sousRegions = [] } = useSousRegions();
  const { data: regionSousRegions = [] } = useRegionSousRegions(selectedRegion?.id ?? null);
  const { data: viewingSousRegions = [], isLoading: loadingViewingSousRegions } = useRegionSousRegions(viewingRegion?.id ?? null);
  const addSR = useAddRegionSousRegion(selectedRegion?.id || 0);
  const removeSR = useRemoveRegionSousRegion(selectedRegion?.id || 0);

  const [sousRegionSelections, setSousRegionSelections] = useState<number[]>([]);
  const initDoneRef = useRef(false);

  useEffect(() => {
    if (linksOpen && !initDoneRef.current && regionSousRegions) {
      const currentSRIds = (regionSousRegions || []).map(sr => sr.id);
      setSousRegionSelections(currentSRIds);
      initDoneRef.current = true;
    }
  }, [linksOpen, regionSousRegions]);

  const openLinks = (r: Region) => { setSelectedRegion(r); setLinksOpen(true); };
  const openViewLinks = (r: Region) => { setViewingRegion(r); setViewLinksOpen(true); };

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const items = q ? regions.filter((r) => r.nom.toLowerCase().includes(q) || String(r.id).includes(q)) : regions;
    const start = (page - 1) * limit;
    return { items: items.slice(start, start + limit), total: items.length, pages: Math.max(1, Math.ceil(items.length / limit)) };
  }, [regions, search, page]);

  const openCreate = () => { setEditing(null); setNom(''); setIsOpen(true); };
  const openEdit = (r: Region) => { setEditing(r); setNom(r.nom); setIsOpen(true); };

  const handleSave = async () => {
    if (editing) await updateMutation.mutateAsync({ id: editing.id, data: { nom } });
    else await createMutation.mutateAsync({ nom });
    setIsOpen(false); setEditing(null); setNom('');
  };

  const handleDelete = async (r: Region) => {
    if (!confirm('Supprimer cette région ?')) return;
    await deleteMutation.mutateAsync(r.id);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-900">Régions</h1>
          <p className="text-gray-600 dark:text-gray-900">Gérez les régions</p>
        </div>
        <Button onClick={openCreate}><Plus className="mr-2 h-4 w-4"/>Ajouter</Button>
      </div>

      <Card>
        <div className="flex items-center space-x-4 p-6 pb-2">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input placeholder="Rechercher une région..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} className="pl-10" />
            </div>
          </div>
        </div>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8"><Loader2 className="h-8 w-8 animate-spin"/><span className="ml-2">Chargement...</span></div>
          ) : error ? (
            <div className="text-center py-8 text-red-600">Erreur lors du chargement</div>
          ) : filtered.total === 0 ? (
            <div className="text-center py-8 text-gray-500">Aucune région trouvée</div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Nom</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.items.map((r) => (
                    <TableRow key={r.id}>
                      <TableCell className="font-medium">{r.id}</TableCell>
                      <TableCell>{r.nom}</TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0"><MoreHorizontal className="h-4 w-4" /></Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => openEdit(r)}><Edit className="mr-2 h-4 w-4"/>Modifier</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => openViewLinks(r)}><Eye className="mr-2 h-4 w-4"/>Afficher les sous-régions</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => openLinks(r)}><Link2 className="mr-2 h-4 w-4"/>Gérer les liaisons</DropdownMenuItem>
                            <DropdownMenuItem className="text-red-600" onClick={() => handleDelete(r)}><Trash2 className="mr-2 h-4 w-4"/>Supprimer</DropdownMenuItem>
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

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{editing ? 'Modifier' : 'Ajouter'} une région</DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="nom">Nom</Label>
            <Input id="nom" value={nom} onChange={(e) => setNom(e.target.value)} placeholder="Ex: Région Nord" />
          </div>
          <DialogFooter>
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
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={linksOpen} onOpenChange={(open) => { setLinksOpen(open); if (!open) initDoneRef.current = false; }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Liaisons de la région {selectedRegion?.nom}</DialogTitle>
          </DialogHeader>
          <div>
            <h3 className="font-medium mb-2">Sous-régions</h3>
            <MultiLinkPicker
              placeholder="Rechercher une sous-région..."
              buttonLabel={sousRegionSelections.length > 0 ? `${sousRegionSelections.length} sélectionnée(s)` : 'Sélectionner des sous-régions'}
              options={sousRegions.map(sr => ({ id: sr.id, label: sr.nom }))}
              selectedIds={sousRegionSelections}
              onToggle={(id, checked) => {
                setSousRegionSelections(prev => {
                  const set = new Set(prev);
                  if (checked) set.add(id); else set.delete(id);
                  return Array.from(set);
                });
              }}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setLinksOpen(false)}>
              <XCircle className="mr-2 h-4 w-4" />
              Fermer
            </Button>
            <Button
              onClick={async () => {
                const existingSRIds = new Set((regionSousRegions || []).map(sr => sr.id));
                const desiredSRIds = new Set(sousRegionSelections);
                const srAdds = Array.from(desiredSRIds).filter(id => !existingSRIds.has(id));
                const srRemoves = Array.from(existingSRIds).filter(id => !desiredSRIds.has(id));

                await Promise.all([
                  ...srAdds.map(id => addSR.mutateAsync(id)),
                  ...srRemoves.map(id => removeSR.mutateAsync(id)),
                ]);
                setLinksOpen(false);
              }}
            >
              <Save className="mr-2 h-4 w-4" />
              Enregistrer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Drawer open={viewLinksOpen} onOpenChange={setViewLinksOpen}>
        <DrawerContent side="right" className="h-full w-full sm:max-w-md flex flex-col">
          <DrawerHeader>
            <DrawerTitle>Sous-régions liées à {viewingRegion?.nom}</DrawerTitle>
          </DrawerHeader>
          <div className="flex-1 overflow-y-auto px-6">
            <div className="space-y-2 pb-4">
              {loadingViewingSousRegions ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin"/>
                  <span className="ml-2">Chargement...</span>
                </div>
              ) : viewingSousRegions.length === 0 ? (
                <div className="text-center py-8 text-gray-500">Aucune sous-région liée</div>
              ) : (
                <div className="space-y-2">
                  {viewingSousRegions.map((sr) => (
                    <div key={sr.id} className="flex items-center border-b pb-3 pt-2 last:border-b-0">
                      <span className="font-medium">{sr.nom}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
          <DrawerFooter className="border-t pt-4">
            <Button variant="outline" onClick={() => setViewLinksOpen(false)}>
              <XCircle className="mr-2 h-4 w-4" />
              Fermer
            </Button>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    </div>
  );
}

type Option = { id: number; label: string };

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

