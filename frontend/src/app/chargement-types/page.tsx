'use client';

import { useMemo, useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerFooter } from '@/components/ui/drawer';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { 
  Search, 
  Plus, 
  MoreHorizontal, 
  Edit, 
  Trash2, 
  Loader2, 
  Save, 
  XCircle, 
  ChevronLeft, 
  ChevronRight,
  Eye,
  Copy,
  Truck,
  Package,
  X,
  Check,
  ChevronsUpDown
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { 
  useChargementTypes, 
  useCreateChargementType, 
  useUpdateChargementType, 
  useDeleteChargementType,
  useDuplicateChargementType,
  useAvailableProducts,
  type ChargementType,
  type AvailableProduct
} from '@/hooks/use-chargement-types';
import { useSalespersons } from '@/hooks/use-salespersons';
import { toast } from 'sonner';

// Composant Combobox pour les produits
function ProductCombobox({
  products,
  selectedId,
  onSelect,
  placeholder = "Sélectionner un produit",
}: {
  products: Array<{ id: number; bcId: string; number: string | null; displayName: string | null }>;
  selectedId?: string;
  onSelect: (id: string | null) => void;
  placeholder?: string;
}) {
  const [open, setOpen] = useState(false);

  const selectedProduct = products.find((product) => product.bcId === selectedId);
  const displayValue = selectedProduct
    ? `${selectedProduct.number || ''} - ${selectedProduct.displayName || ''}`.trim()
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
          <CommandInput placeholder="Rechercher un produit..." />
          <CommandList>
            <CommandEmpty>Aucun produit trouvé.</CommandEmpty>
            <CommandGroup>
              {products.map((product) => {
                const isSelected = selectedId === product.bcId;
                const label = `${product.number || ''} - ${product.displayName || ''}`.trim();
                return (
                  <CommandItem
                    key={product.bcId}
                    value={`${product.number} ${product.displayName}`}
                    onSelect={() => {
                      onSelect(product.bcId);
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

export default function ChargementTypesPage() {
  const { data: chargementTypes = [], isLoading, error } = useChargementTypes();
  const { data: salespersonsData } = useSalespersons({ limit: 1000 });
  const createMutation = useCreateChargementType();
  const updateMutation = useUpdateChargementType();
  const deleteMutation = useDeleteChargementType();
  const duplicateMutation = useDuplicateChargementType();

  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const limit = 10;

  const [isOpen, setIsOpen] = useState(false);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [isDuplicateOpen, setIsDuplicateOpen] = useState(false);
  const [editing, setEditing] = useState<ChargementType | null>(null);
  const [viewing, setViewing] = useState<ChargementType | null>(null);
  const [duplicating, setDuplicating] = useState<ChargementType | null>(null);
  
  const [salespersonId, setSalespersonId] = useState<number | ''>('');
  const [products, setProducts] = useState<Array<{ productId: string; qte: number }>>([]);
  const [targetSalespersonId, setTargetSalespersonId] = useState<number | ''>('');

  const salespersons = salespersonsData?.data || [];
  const { data: availableProducts = [], isLoading: isLoadingProducts, error: productsError } = useAvailableProducts();

  // Debug: afficher les produits disponibles
  useEffect(() => {
    if (availableProducts.length > 0) {
      console.log('Produits disponibles:', availableProducts);
    }
    if (productsError) {
      console.error('Erreur produits:', productsError);
    }
  }, [availableProducts, productsError]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const items = q 
      ? chargementTypes.filter((ct) => 
          String(ct.id).includes(q) ||
          ct.salesperson?.firstName.toLowerCase().includes(q) ||
          ct.salesperson?.lastName.toLowerCase().includes(q) ||
          ct.salesperson?.depotName.toLowerCase().includes(q)
        ) 
      : chargementTypes;
    const start = (page - 1) * limit;
    return { 
      items: items.slice(start, start + limit), 
      total: items.length, 
      pages: Math.max(1, Math.ceil(items.length / limit)) 
    };
  }, [chargementTypes, search, page]);

  const openCreate = () => {
    setEditing(null);
    setSalespersonId('');
    setProducts([{ productId: '', qte: 1 }]);
    setIsOpen(true);
  };

  const openEdit = (ct: ChargementType) => {
    setEditing(ct);
    setSalespersonId(ct.salespersonId);
    setProducts(
      ct.products.length > 0
        ? ct.products.map((p) => ({ productId: p.productId, qte: Number(p.qte) }))
        : [{ productId: '', qte: 1 }]
    );
    setIsOpen(true);
  };

  const openView = (ct: ChargementType) => {
    setViewing(ct);
    setIsViewOpen(true);
  };

  const openDuplicate = (ct: ChargementType) => {
    setDuplicating(ct);
    setTargetSalespersonId('');
    setIsDuplicateOpen(true);
  };

  const handleSave = async () => {
    if (!salespersonId || products.length === 0) {
      toast.error('Veuillez remplir tous les champs requis');
      return;
    }

    // Vérifier que tous les produits sont sélectionnés et ont une quantité valide
    const validProducts = products.filter(p => p.productId && p.productId.trim() !== '' && p.qte > 0);
    if (validProducts.length === 0) {
      toast.error('Veuillez ajouter au moins un produit avec une quantité valide');
      return;
    }

    // Vérifier les doublons de produits
    const productIds = validProducts.map(p => p.productId);
    if (new Set(productIds).size !== productIds.length) {
      toast.error('Un produit ne peut être sélectionné qu\'une seule fois');
      return;
    }

    const data = {
      salespersonId: Number(salespersonId),
      products: validProducts,
    };

    try {
      if (editing) {
        await updateMutation.mutateAsync({ id: editing.id, data });
      } else {
        await createMutation.mutateAsync(data);
      }
      setIsOpen(false);
      setEditing(null);
      setSalespersonId('');
      setProducts([{ productId: '', qte: 1 }]);
    } catch (error: any) {
      // L'erreur est déjà gérée par le hook avec toast
    }
  };

  const handleDelete = async (ct: ChargementType) => {
    if (!confirm(`Supprimer le chargement type #${ct.id} ?`)) return;
    await deleteMutation.mutateAsync(ct.id);
  };

  const handleDuplicate = async () => {
    if (!duplicating || !targetSalespersonId) {
      toast.error('Veuillez sélectionner un vendeur de destination');
      return;
    }

    try {
      await duplicateMutation.mutateAsync({
        id: duplicating.id,
        salespersonId: Number(targetSalespersonId),
      });
      setIsDuplicateOpen(false);
      setDuplicating(null);
      setTargetSalespersonId('');
    } catch (error: any) {
      // L'erreur est déjà gérée par le hook avec toast
    }
  };

  const addProduct = () => {
    setProducts([...products, { productId: '', qte: 1 }]);
  };

  const removeProduct = (index: number) => {
    setProducts(products.filter((_, i) => i !== index));
  };

  const updateProduct = (index: number, field: 'productId' | 'qte', value: number | string) => {
    const updated = [...products];
    updated[index] = { ...updated[index], [field]: value };
    setProducts(updated);
  };

  // Filtrer les salespersons disponibles (ceux qui n'ont pas déjà un chargement type, sauf en édition)
  const availableSalespersons = useMemo(() => {
    const usedIds = new Set(
      chargementTypes
        .filter(ct => !editing || ct.id !== editing.id)
        .map(ct => ct.salespersonId)
    );
    return salespersons.filter(sp => !usedIds.has(sp.id));
  }, [salespersons, chargementTypes, editing]);

  // Pour la duplication, exclure le salesperson actuel
  const availableSalespersonsForDuplicate = useMemo(() => {
    if (!duplicating) return salespersons;
    const usedIds = new Set(
      chargementTypes.map(ct => ct.salespersonId)
    );
    return salespersons.filter(sp => 
      sp.id !== duplicating.salespersonId && !usedIds.has(sp.id)
    );
  }, [salespersons, chargementTypes, duplicating]);

  const totalQuantite = useMemo(() => {
    return viewing?.products.reduce((sum, p) => sum + Number(p.qte), 0) || 0;
  }, [viewing]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-900">Chargements Type</h1>
          <p className="text-gray-600 dark:text-gray-900">Gérez les modèles de chargement prédéfinis</p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="mr-2 h-4 w-4" />
          Ajouter
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Chargements</CardTitle>
            <Truck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{chargementTypes.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Produits Disponibles</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{availableProducts.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Vendeurs</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{salespersons.length}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <div className="flex items-center space-x-4 p-6 pb-2">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input 
                placeholder="Rechercher un chargement type..." 
                value={search} 
                onChange={(e) => { setSearch(e.target.value); setPage(1); }} 
                className="pl-10" 
              />
            </div>
          </div>
        </div>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin" />
              <span className="ml-2">Chargement...</span>
            </div>
          ) : error ? (
            <div className="text-center py-8 text-red-600">Erreur lors du chargement</div>
          ) : filtered.total === 0 ? (
            <div className="text-center py-8 text-gray-500">Aucun chargement type trouvé</div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Vendeur</TableHead>
                    <TableHead>Produits</TableHead>
                    <TableHead>Quantité Totale</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.items.map((ct) => (
                    <TableRow key={ct.id}>
                      <TableCell className="font-medium">#{ct.id}</TableCell>
                      <TableCell>
                        <div className="font-medium">
                          {ct.salesperson?.firstName} {ct.salesperson?.lastName}
                        </div>
                      </TableCell>
                      <TableCell>
                        {ct.products.length} produit(s)
                      </TableCell>
                      <TableCell>
                        {ct.products.reduce((sum, p) => sum + Number(p.qte), 0)}
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            {ct.products.length > 0 && (
                              <DropdownMenuItem onClick={() => openView(ct)}>
                                <Eye className="mr-2 h-4 w-4" />
                                Voir produits
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem onClick={() => openEdit(ct)}>
                              <Edit className="mr-2 h-4 w-4" />
                              Modifier
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => openDuplicate(ct)}>
                              <Copy className="mr-2 h-4 w-4" />
                              Dupliquer
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              className="text-red-600" 
                              onClick={() => handleDelete(ct)}
                            >
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

              {filtered.pages > 1 && (
                <div className="flex items-center justify-between mt-4">
                  <div className="text-sm text-gray-500">
                    Page {page} sur {filtered.pages}
                  </div>
                  <div className="flex space-x-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => setPage((p) => Math.max(1, p - 1))} 
                      disabled={page === 1}
                    >
                      <ChevronLeft className="mr-2 h-4 w-4" />
                      Précédent
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => setPage((p) => Math.min(filtered.pages, p + 1))} 
                      disabled={page === filtered.pages}
                    >
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

      {/* Drawer Create/Edit */}
      <Drawer open={isOpen} onOpenChange={(open) => {
        setIsOpen(open);
        if (!open) {
          setEditing(null);
          setSalespersonId('');
          setProducts([{ productId: '', qte: 1 }]);
        }
      }}>
        <DrawerContent 
          side="right" 
          className="h-full flex flex-col"
          style={{ width: '50vw', maxWidth: '50vw' }}
        >
          <DrawerHeader>
            <DrawerTitle>
              {editing ? 'Modifier' : 'Ajouter'} un chargement type
            </DrawerTitle>
          </DrawerHeader>
          <div className="flex-1 overflow-y-auto px-6 py-4">
            <div className="space-y-4">
              <div>
                <Label htmlFor="salesperson">Vendeur <span className="text-red-500">*</span></Label>
                <Select
                  value={salespersonId.toString()}
                  onValueChange={(value) => setSalespersonId(Number(value))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner un vendeur" />
                  </SelectTrigger>
                  <SelectContent>
                    {(editing ? salespersons : availableSalespersons).map((sp) => (
                      <SelectItem key={sp.id} value={sp.id.toString()}>
                        {sp.firstName} {sp.lastName} - {sp.depotName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label>Produits <span className="text-red-500">*</span></Label>
                  <Button type="button" variant="outline" size="sm" onClick={addProduct}>
                    <Plus className="mr-2 h-4 w-4" />
                    Ajouter un produit
                  </Button>
                </div>
                <div className="space-y-2">
                  {products.map((product, index) => (
                    <div key={index} className="flex gap-2 items-end">
                      <div className="flex-1">
                        <Label>Produit</Label>
                        {isLoadingProducts ? (
                          <div className="flex items-center gap-2 p-2">
                            <Loader2 className="h-4 w-4 animate-spin" />
                            <span className="text-sm text-gray-500">Chargement des produits...</span>
                          </div>
                        ) : productsError ? (
                          <div className="text-sm text-red-600 p-2">
                            Erreur lors du chargement des produits
                          </div>
                        ) : availableProducts.length === 0 ? (
                          <div className="text-sm text-gray-500 p-2">
                            Aucun produit disponible
                          </div>
                        ) : (
                          <ProductCombobox
                            products={availableProducts.map(p => ({
                              id: p.id,
                              bcId: p.bcId,
                              number: p.number,
                              displayName: p.displayName
                            }))}
                            selectedId={product.productId || undefined}
                            onSelect={(id) => updateProduct(index, 'productId', id || '')}
                            placeholder="Sélectionner un produit"
                          />
                        )}
                      </div>
                      <div className="w-24">
                        <Label>Quantité</Label>
                        <Input
                          type="number"
                          min="1"
                          value={product.qte}
                          onChange={(e) => updateProduct(index, 'qte', Number(e.target.value))}
                        />
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => removeProduct(index)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
          <DrawerFooter className="border-t pt-4">
            <Button variant="outline" onClick={() => setIsOpen(false)}>
              <XCircle className="mr-2 h-4 w-4" />
              Annuler
            </Button>
            <Button 
              onClick={handleSave} 
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
          </DrawerFooter>
        </DrawerContent>
      </Drawer>

      {/* Drawer View Products */}
      <Drawer open={isViewOpen} onOpenChange={setIsViewOpen}>
        <DrawerContent 
          side="right" 
          className="h-full flex flex-col"
          style={{ width: '50vw', maxWidth: '50vw' }}
        >
          <DrawerHeader>
            <DrawerTitle>
              Produits du chargement #{viewing?.id}
            </DrawerTitle>
          </DrawerHeader>
          <div className="flex-1 overflow-y-auto px-6">
            {viewing && (
              <div className="space-y-4">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h4 className="font-medium text-blue-900 mb-2">Résumé</h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <strong>Vendeur:</strong> {viewing.salesperson?.firstName} {viewing.salesperson?.lastName}
                    </div>
                    <div>
                      <strong>Dépôt:</strong> {viewing.salesperson?.depotName}
                    </div>
                    <div>
                      <strong>Nombre de produits:</strong> {viewing.products.length}
                    </div>
                    <div>
                      <strong>Quantité totale:</strong> {totalQuantite}
                    </div>
                  </div>
                </div>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Produit</TableHead>
                      <TableHead className="text-right">Quantité</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {viewing.products.map((p, idx) => (
                      <TableRow key={idx}>
                        <TableCell>
                          {p.bcItem?.number ? `${p.bcItem.number} - ` : ''}
                          {p.bcItem?.displayName || 'Produit inconnu'}
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          {Number(p.qte)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
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

      {/* Drawer Duplicate */}
      <Drawer open={isDuplicateOpen} onOpenChange={(open) => {
        setIsDuplicateOpen(open);
        if (!open) {
          setDuplicating(null);
          setTargetSalespersonId('');
        }
      }}>
        <DrawerContent 
          side="right" 
          className="h-full flex flex-col"
          style={{ width: '50vw', maxWidth: '50vw' }}
        >
          <DrawerHeader>
            <DrawerTitle>Dupliquer le chargement type</DrawerTitle>
          </DrawerHeader>
          <div className="flex-1 overflow-y-auto px-6 py-4">
            <div className="space-y-4">
              <div>
                <Label htmlFor="target-salesperson">Vendeur de destination <span className="text-red-500">*</span></Label>
                <Select
                  value={targetSalespersonId.toString()}
                  onValueChange={(value) => setTargetSalespersonId(Number(value))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner un vendeur" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableSalespersonsForDuplicate.map((sp) => (
                      <SelectItem key={sp.id} value={sp.id.toString()}>
                        {sp.firstName} {sp.lastName} - {sp.depotName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DrawerFooter className="border-t pt-4">
            <Button variant="outline" onClick={() => setIsDuplicateOpen(false)}>
              <XCircle className="mr-2 h-4 w-4" />
              Annuler
            </Button>
            <Button 
              onClick={handleDuplicate} 
              disabled={duplicateMutation.isPending}
            >
              {duplicateMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Duplication...
                </>
              ) : (
                <>
                  <Copy className="mr-2 h-4 w-4" />
                  Dupliquer
                </>
              )}
            </Button>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    </div>
  );
}

