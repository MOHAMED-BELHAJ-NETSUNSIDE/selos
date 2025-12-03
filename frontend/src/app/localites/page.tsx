'use client';

import { useMemo, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Search, Plus, MoreHorizontal, Edit, Trash2, Loader2, Save, XCircle, ChevronLeft, ChevronRight, ChevronsUpDown, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useLocalites, useCreateLocalite, useUpdateLocalite, useDeleteLocalite, type Localite } from '@/hooks/use-localites';
import { useDelegations } from '@/hooks/use-delegations';
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

// Composant Combobox pour les délégations
function DelegationCombobox({
  delegations,
  selectedId,
  onSelect,
  placeholder = "Sélectionner une délégation",
}: {
  delegations: Array<{ id: number; nom: string }>;
  selectedId?: string;
  onSelect: (id: string) => void;
  placeholder?: string;
}) {
  const [open, setOpen] = useState(false);

  const selectedDelegation = delegations.find((d) => String(d.id) === selectedId);
  const displayValue = selectedDelegation ? selectedDelegation.nom : placeholder;

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
          <CommandInput placeholder="Rechercher une délégation..." />
          <CommandList>
            <CommandEmpty>Aucune délégation trouvée.</CommandEmpty>
            <CommandGroup>
              {delegations.map((d) => {
                const isSelected = selectedId === String(d.id);
                return (
                  <CommandItem
                    key={d.id}
                    value={d.nom}
                    onSelect={() => {
                      onSelect(String(d.id));
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
                    {d.nom}
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

export default function LocalitesPage() {
  const { data: localites = [], isLoading, error } = useLocalites();
  const { data: delegations = [] } = useDelegations();
  const { data: gouvernorats = [] } = useGouvernorats();
  const createMutation = useCreateLocalite();
  const updateMutation = useUpdateLocalite();
  const deleteMutation = useDeleteLocalite();

  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const limit = 10;

  const [filterGov, setFilterGov] = useState<string | undefined>(undefined);
  const [filterDel, setFilterDel] = useState<string | undefined>(undefined);

  const [isOpen, setIsOpen] = useState(false);
  const [editing, setEditing] = useState<Localite | null>(null);
  const [nom, setNom] = useState('');
  const [idGouvernorat, setIdGouvernorat] = useState<string | undefined>(undefined);
  const [idDelegation, setIdDelegation] = useState<string | undefined>(undefined);

  const filtered = useMemo(() => {
    let arr: any[] = localites.slice();
    const q = search.trim().toLowerCase();
    if (q) arr = arr.filter((x) => x.nom.toLowerCase().includes(q) || String(x.id).includes(q));
    if (filterGov) {
      arr = arr.filter((x) => {
        const del = x.delegation;
        const govId = del?.gouvernorat?.id ?? del?.idGouvernorat ?? del?.id_gouvernorat;
        return String(govId) === filterGov;
      });
    }
    if (filterDel) {
      arr = arr.filter((x) => String(x.delegation?.id ?? x.idDelegation) === filterDel);
    }
    const start = (page - 1) * limit;
    return { items: arr.slice(start, start + limit), total: arr.length, pages: Math.max(1, Math.ceil(arr.length / limit)) };
  }, [localites, search, filterGov, filterDel, page]);

  const openCreate = () => { 
    setEditing(null); 
    setNom(''); 
    setIdGouvernorat(undefined);
    setIdDelegation(undefined); 
    setIsOpen(true); 
  };
  const openEdit = (x: Localite) => { 
    setEditing(x); 
    setNom(x.nom);
    const del = x.delegation || delegations.find((d) => d.id === (x.idDelegation ?? x.delegation?.id));
    const govId = del?.gouvernorat?.id ?? del?.idGouvernorat ?? del?.id_gouvernorat;
    setIdGouvernorat(govId ? String(govId) : undefined);
    setIdDelegation(String((x as any).idDelegation ?? x.delegation?.id ?? '')); 
    setIsOpen(true); 
  };

  const handleSave = async () => {
    if (!idDelegation) return;
    if (editing) await updateMutation.mutateAsync({ id: editing.id, data: { nom, idDelegation: Number(idDelegation) } });
    else await createMutation.mutateAsync({ nom, idDelegation: Number(idDelegation) });
    setIsOpen(false); 
    setEditing(null); 
    setNom(''); 
    setIdGouvernorat(undefined);
    setIdDelegation(undefined);
  };

  const handleDelete = async (x: Localite) => {
    if (!confirm('Supprimer cette localité ?')) return;
    await deleteMutation.mutateAsync(x.id);
  };

  const getNames = (x: any) => {
    const del = x.delegation || delegations.find((d) => d.id === (x.idDelegation ?? x.delegation?.id));
    // Utiliser directement la relation gouvernorat si disponible, sinon chercher par id
    const gov = del?.gouvernorat || (del ? gouvernorats.find((g) => g.id === (del.idGouvernorat ?? del.id_gouvernorat)) : undefined);
    return { delegation: del?.nom || '—', gouvernorat: gov?.nom || '—' };
  };

  const delegationOptions = useMemo(() => {
    if (!filterGov) return delegations;
    return delegations.filter((d) => String(d.id_gouvernorat) === filterGov);
  }, [delegations, filterGov]);

  const delegationOptionsForm = useMemo(() => {
    if (!idGouvernorat) return delegations;
    return delegations.filter((d) => String(d.id_gouvernorat) === idGouvernorat);
  }, [delegations, idGouvernorat]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-900">Localités</h1>
          <p className="text-gray-600 dark:text-gray-900">Gérez les localités</p>
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
          <div className="w-56">
            <Label className="text-xs text-gray-500">Gouvernorat</Label>
            <GouvernoratCombobox
              gouvernorats={gouvernorats}
              selectedId={filterGov}
              onSelect={(v) => { setFilterGov(v); setFilterDel(undefined); setPage(1); }}
              placeholder="Tous"
            />
          </div>
          <div className="w-56">
            <Label className="text-xs text-gray-500">Délégation</Label>
            <DelegationCombobox
              delegations={delegationOptions}
              selectedId={filterDel}
              onSelect={(v) => { setFilterDel(v); setPage(1); }}
              placeholder="Toutes"
            />
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
                    <TableHead>Délégation</TableHead>
                    <TableHead>Gouvernorat</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.items.map((x: any) => {
                    const names = getNames(x);
                    // Utiliser directement la relation si disponible
                    const gouvernoratName = x.delegation?.gouvernorat?.nom || names.gouvernorat;
                    return (
                      <TableRow key={x.id}>
                        <TableCell className="font-medium">{x.id}</TableCell>
                        <TableCell>{x.nom}</TableCell>
                        <TableCell>{names.delegation}</TableCell>
                        <TableCell>{gouvernoratName}</TableCell>
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
                    );
                  })}
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

      <Dialog open={isOpen} onOpenChange={(open) => {
        setIsOpen(open);
        if (!open) {
          // Réinitialiser les valeurs quand le dialog se ferme
          setEditing(null);
          setNom('');
          setIdGouvernorat(undefined);
          setIdDelegation(undefined);
        }
      }}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{editing ? 'Modifier' : 'Ajouter'} une localité</DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="nom">Nom</Label>
            <Input id="nom" value={nom} onChange={(e) => setNom(e.target.value)} placeholder="Ex: La Marsa" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="idGouvernorat">Gouvernorat</Label>
            <GouvernoratCombobox
              gouvernorats={gouvernorats}
              selectedId={idGouvernorat}
              onSelect={(v) => { 
                setIdGouvernorat(v);
                setIdDelegation(undefined); // Réinitialiser la délégation quand on change de gouvernorat
              }}
              placeholder="Sélectionner un gouvernorat"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="idDelegation">Délégation</Label>
            <DelegationCombobox
              delegations={delegationOptionsForm}
              selectedId={idDelegation}
              onSelect={(v) => setIdDelegation(v)}
              placeholder="Sélectionner une délégation"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsOpen(false)}>
              <XCircle className="mr-2 h-4 w-4" />
              Annuler
            </Button>
            <Button onClick={handleSave} disabled={!idDelegation || createMutation.isPending || updateMutation.isPending}>
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
    </div>
  );
}
