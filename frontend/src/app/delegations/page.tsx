'use client';

import { useMemo, useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerFooter } from '@/components/ui/drawer';
import { Label } from '@/components/ui/label';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Search, Plus, MoreHorizontal, Edit, Trash2, Loader2, Save, XCircle, ChevronLeft, ChevronRight, ChevronsUpDown, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useDelegations, useCreateDelegation, useUpdateDelegation, useDeleteDelegation, type Delegation } from '@/hooks/use-delegations';
import { useGouvernorats } from '@/hooks/use-gouvernorats';

// Composant Combobox pour les gouvernorats
function GouvernoratCombobox({
  gouvernorats,
  selectedId,
  onSelect,
  placeholder = "Sélectionner un gouvernorat",
}: {
  gouvernorats: Array<{ id: number; nom: string }>;
  selectedId?: string;
  onSelect: (id: string) => void;
  placeholder?: string;
}) {
  const [open, setOpen] = useState(false);

  const selectedGouvernorat = gouvernorats.find((g) => String(g.id) === selectedId);
  const displayValue = selectedGouvernorat ? selectedGouvernorat.nom : placeholder;

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
          <CommandInput placeholder="Rechercher un gouvernorat..." />
          <CommandList>
            <CommandEmpty>Aucun gouvernorat trouvé.</CommandEmpty>
            <CommandGroup>
              {gouvernorats.map((g) => {
                const isSelected = selectedId === String(g.id);
                return (
                  <CommandItem
                    key={g.id}
                    value={g.nom}
                    onSelect={() => {
                      onSelect(String(g.id));
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
                    {g.nom}
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

export default function DelegationsPage() {
  const { data: delegations = [], isLoading, error } = useDelegations();
  const { data: gouvernorats = [] } = useGouvernorats();
  const createMutation = useCreateDelegation();
  const updateMutation = useUpdateDelegation();
  const deleteMutation = useDeleteDelegation();

  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const limit = 10;

  const [isOpen, setIsOpen] = useState(false);
  const [editing, setEditing] = useState<Delegation | null>(null);
  const [nom, setNom] = useState('');
  const [idGouvernorat, setIdGouvernorat] = useState<string | undefined>(undefined);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const arr = q ? delegations.filter((x) => x.nom.toLowerCase().includes(q) || String(x.id).includes(q)) : delegations;
    const start = (page - 1) * limit;
    return { items: arr.slice(start, start + limit), total: arr.length, pages: Math.max(1, Math.ceil(arr.length / limit)) };
  }, [delegations, search, page]);

  const openCreate = () => { 
    setEditing(null); 
    setNom(''); 
    setIdGouvernorat(undefined); 
    setIsOpen(true); 
  };
  
  const openEdit = (x: Delegation) => { 
    setEditing(x); 
    // Mettre à jour les valeurs immédiatement
    setNom(x.nom || '');
    // S'assurer que la valeur est toujours une chaîne
    const gouvernoratId = x.id_gouvernorat != null ? String(x.id_gouvernorat) : '';
    setIdGouvernorat(gouvernoratId);
    setIsOpen(true); 
  };

  // Mettre à jour les valeurs quand on passe en mode édition ou création
  useEffect(() => {
    if (isOpen && editing) {
      // Mode édition : s'assurer que les valeurs sont à jour
      const expectedNom = editing.nom || '';
      const expectedGouvernoratId = editing.id_gouvernorat != null ? String(editing.id_gouvernorat) : '';
      
      if (nom !== expectedNom) {
        setNom(expectedNom);
      }
      if (idGouvernorat !== expectedGouvernoratId) {
        setIdGouvernorat(expectedGouvernoratId);
      }
    } else if (isOpen && !editing) {
      // Mode création : réinitialiser
      setNom('');
      setIdGouvernorat(undefined);
    }
  }, [isOpen, editing?.id, editing?.nom, editing?.id_gouvernorat]);

  // Réinitialiser les valeurs quand le drawer se ferme
  useEffect(() => {
    if (!isOpen) {
      setEditing(null);
      setNom('');
      setIdGouvernorat(undefined);
    }
  }, [isOpen]);

  const handleSave = async () => {
    if (!nom.trim()) {
      alert('Le nom est requis');
      return;
    }
    if (!idGouvernorat) {
      alert('Le gouvernorat est requis');
      return;
    }
    try {
      const gouvernoratId = Number(idGouvernorat);
      if (editing) {
        const updateData = { nom: nom.trim(), id_gouvernorat: gouvernoratId };
        await updateMutation.mutateAsync({ id: editing.id, data: updateData });
      } else {
        await createMutation.mutateAsync({ nom: nom.trim(), id_gouvernorat: gouvernoratId });
      }
      setIsOpen(false);
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
    }
  };

  const handleDelete = async (x: Delegation) => {
    if (!confirm('Supprimer cette délégation ?')) return;
    await deleteMutation.mutateAsync(x.id);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-900">Délégations</h1>
          <p className="text-gray-600 dark:text-gray-900">Gérez les délégations</p>
        </div>
        <Button onClick={openCreate}><Plus className="mr-2 h-4 w-4"/>Ajouter</Button>
      </div>

      <Card>
        <div className="flex items-center space-x-4 p-6 pb-2">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input placeholder="Rechercher..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} className="pl-10" />
            </div>
          </div>
        </div>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8"><Loader2 className="h-8 w-8 animate-spin"/><span className="ml-2">Chargement...</span></div>
          ) : error ? (
            <div className="text-center py-8 text-red-600">Erreur lors du chargement</div>
          ) : filtered.total === 0 ? (
            <div className="text-center py-8 text-gray-500">Aucun élément</div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Nom</TableHead>
                    <TableHead>Gouvernorat</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.items.map((x) => (
                    <TableRow key={x.id}>
                      <TableCell className="font-medium">{x.id}</TableCell>
                      <TableCell>{x.nom}</TableCell>
                      <TableCell>
                        {x.gouvernorat?.nom || gouvernorats.find(g => g.id === x.id_gouvernorat)?.nom || '—'}
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0"><MoreHorizontal className="h-4 w-4" /></Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => openEdit(x)}><Edit className="mr-2 h-4 w-4"/>Modifier</DropdownMenuItem>
                            <DropdownMenuItem className="text-red-600" onClick={() => handleDelete(x)}><Trash2 className="mr-2 h-4 w-4"/>Supprimer</DropdownMenuItem>
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
                    <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}>Précédent</Button>
                    <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.min(filtered.pages, p + 1))} disabled={page === filtered.pages}>Suivant</Button>
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
          // Réinitialiser les valeurs quand le drawer se ferme
          setEditing(null);
          setNom('');
          setIdGouvernorat(undefined);
        }
      }}>
        <DrawerContent side="right" className="h-full w-full sm:max-w-md flex flex-col">
          <DrawerHeader>
            <DrawerTitle>{editing ? 'Modifier' : 'Ajouter'} une délégation</DrawerTitle>
          </DrawerHeader>
          <div className="flex-1 overflow-y-auto px-6 py-4">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="nom">Nom *</Label>
                <Input 
                  id="nom" 
                  value={nom} 
                  onChange={(e) => setNom(e.target.value)} 
                  placeholder="Ex: Ariana Ville" 
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="idGouvernorat">Gouvernorat *</Label>
                <GouvernoratCombobox
                  gouvernorats={gouvernorats}
                  selectedId={idGouvernorat}
                  onSelect={(id) => setIdGouvernorat(id)}
                  placeholder="Sélectionner un gouvernorat"
                />
                {!idGouvernorat && (
                  <p className="text-sm text-muted-foreground">Veuillez sélectionner un gouvernorat</p>
                )}
              </div>
            </div>
          </div>
          <DrawerFooter className="border-t pt-4">
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setIsOpen(false)}>
                <XCircle className="mr-2 h-4 w-4" />
                Annuler
              </Button>
              <Button 
                onClick={handleSave} 
                disabled={!nom.trim() || !idGouvernorat || createMutation.isPending || updateMutation.isPending}
              >
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
            </div>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    </div>
  );
}

