'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Pill, PillIndicator } from '@/components/ui/pill';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerFooter } from '@/components/ui/drawer';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { 
  Search, 
  MoreHorizontal, 
  Eye, 
  Trash2, 
  Loader2, 
  ChevronLeft, 
  ChevronRight,
  CheckCircle,
  FileText,
  Package,
  RefreshCw,
  Plus,
  X,
  Calendar,
  User,
  Hash,
  Building2,
  ShoppingCart,
  Info,
  Check,
  ChevronsUpDown,
} from 'lucide-react';
import { 
  useDeliveryNotes,
  useDeliveryNote,
  useCreateDeliveryNote,
  useUpdateDeliveryNote,
  useValidateDeliveryNote,
  useDeleteDeliveryNote,
  type DeliveryNote,
} from '@/hooks/use-delivery-notes';
import { useSalespersons } from '@/hooks/use-salespersons';
import { useClients } from '@/hooks/use-clients';
import { useAvailableProducts } from '@/hooks/use-purchase-orders';
import api from '@/lib/api';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

// Composant Combobox pour les vendeurs
function SalespersonCombobox({
  salespersons,
  selectedId,
  onSelect,
  placeholder = "Sélectionner un vendeur",
  disabled = false,
}: {
  salespersons: Array<{ id: number; code: string | null; firstName: string; lastName: string; depotName: string | null }>;
  selectedId?: string;
  onSelect: (id: string) => void;
  placeholder?: string;
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);

  const selectedSalesperson = salespersons.find((sp) => String(sp.id) === selectedId);
  const displayValue = selectedSalesperson
    ? `${selectedSalesperson.firstName} ${selectedSalesperson.lastName} - ${selectedSalesperson.depotName || ''}`.trim()
    : placeholder;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between"
          disabled={disabled}
        >
          {displayValue}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0" align="start">
        <Command>
          <CommandInput placeholder="Rechercher un vendeur..." />
          <CommandList>
            <CommandEmpty>Aucun vendeur trouvé.</CommandEmpty>
            <CommandGroup>
              {salespersons.map((sp) => {
                const isSelected = selectedId === String(sp.id);
                const label = `${sp.firstName} ${sp.lastName} - ${sp.depotName || ''}`.trim();
                return (
                  <CommandItem
                    key={sp.id}
                    value={`${sp.code || ''} ${sp.firstName} ${sp.lastName} ${sp.depotName || ''}`}
                    onSelect={() => {
                      onSelect(String(sp.id));
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

// Composant Combobox pour les clients
function ClientCombobox({
  clients,
  selectedId,
  onSelect,
  placeholder = "Sélectionner un client",
  disabled = false,
}: {
  clients: Array<{ id: number; code: string; nom: string; nomCommercial: string | null }>;
  selectedId?: string;
  onSelect: (id: string) => void;
  placeholder?: string;
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);

  const selectedClient = clients.find((c) => String(c.id) === selectedId);
  const displayValue = selectedClient
    ? `${selectedClient.nomCommercial || selectedClient.nom} (${selectedClient.code})`
    : placeholder;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between"
          disabled={disabled}
        >
          {displayValue}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0" align="start">
        <Command>
          <CommandInput placeholder="Rechercher un client..." />
          <CommandList>
            <CommandEmpty>Aucun client trouvé.</CommandEmpty>
            <CommandGroup>
              {clients.map((c) => {
                const isSelected = selectedId === String(c.id);
                const label = `${c.nomCommercial || c.nom} (${c.code})`;
                return (
                  <CommandItem
                    key={c.id}
                    value={`${c.code} ${c.nom} ${c.nomCommercial || ''}`}
                    onSelect={() => {
                      onSelect(String(c.id));
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

// Composant Combobox pour les produits
function ProductCombobox({
  products,
  selectedId,
  onSelect,
  placeholder = "Sélectionner un produit",
  disabled = false,
  excludeIds = [],
}: {
  products: Array<{ id: number; designation: string; bcItem: { displayName: string | null; number: string | null } | null }>;
  selectedId?: string;
  onSelect: (id: string | null) => void;
  placeholder?: string;
  disabled?: boolean;
  excludeIds?: number[];
}) {
  const [open, setOpen] = useState(false);

  const filteredProducts = products.filter(p => !excludeIds.includes(p.id));
  const selectedProduct = filteredProducts.find((p) => String(p.id) === selectedId);
  const displayValue = selectedProduct
    ? `${selectedProduct.bcItem?.number ? `${selectedProduct.bcItem.number} - ` : ''}${selectedProduct.bcItem?.displayName || selectedProduct.designation}`
    : placeholder;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between"
          disabled={disabled}
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
              {filteredProducts.map((product) => {
                const isSelected = selectedId === String(product.id);
                const label = `${product.bcItem?.number ? `${product.bcItem.number} - ` : ''}${product.bcItem?.displayName || product.designation}`;
                return (
                  <CommandItem
                    key={product.id}
                    value={`${product.bcItem?.number || ''} ${product.bcItem?.displayName || product.designation}`}
                    onSelect={() => {
                      onSelect(String(product.id));
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

// Composant Combobox pour les filtres (avec option "Tous")
function SalespersonFilterCombobox({
  salespersons,
  selectedId,
  onSelect,
  placeholder = "Tous les vendeurs",
}: {
  salespersons: Array<{ id: number; code: string | null; firstName: string; lastName: string }>;
  selectedId?: string;
  onSelect: (id: string | null) => void;
  placeholder?: string;
}) {
  const [open, setOpen] = useState(false);

  const selectedSalesperson = selectedId ? salespersons.find((sp) => String(sp.id) === selectedId) : null;
  const displayValue = selectedSalesperson
    ? `${selectedSalesperson.firstName} ${selectedSalesperson.lastName} (${selectedSalesperson.code || ''})`
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
      <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
        <Command>
          <CommandInput placeholder="Rechercher un vendeur..." />
          <CommandList>
            <CommandEmpty>Aucun vendeur trouvé.</CommandEmpty>
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
                Tous les vendeurs
              </CommandItem>
              {salespersons.map((sp) => {
                const isSelected = selectedId === String(sp.id);
                const label = `${sp.firstName} ${sp.lastName} (${sp.code || ''})`;
                return (
                  <CommandItem
                    key={sp.id}
                    value={`${sp.code || ''} ${sp.firstName} ${sp.lastName}`}
                    onSelect={() => {
                      onSelect(String(sp.id));
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

function ClientFilterCombobox({
  clients,
  selectedId,
  onSelect,
  placeholder = "Tous les clients",
}: {
  clients: Array<{ id: number; code: string; nom: string; nomCommercial: string | null }>;
  selectedId?: string;
  onSelect: (id: string | null) => void;
  placeholder?: string;
}) {
  const [open, setOpen] = useState(false);

  const selectedClient = selectedId ? clients.find((c) => String(c.id) === selectedId) : null;
  const displayValue = selectedClient
    ? `${selectedClient.nomCommercial || selectedClient.nom} (${selectedClient.code})`
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
      <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
        <Command>
          <CommandInput placeholder="Rechercher un client..." />
          <CommandList>
            <CommandEmpty>Aucun client trouvé.</CommandEmpty>
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
                Tous les clients
              </CommandItem>
              {clients.map((c) => {
                const isSelected = selectedId === String(c.id);
                const label = `${c.nomCommercial || c.nom} (${c.code})`;
                return (
                  <CommandItem
                    key={c.id}
                    value={`${c.code} ${c.nom} ${c.nomCommercial || ''}`}
                    onSelect={() => {
                      onSelect(String(c.id));
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

// Composant Combobox pour les statuts
function StatusFilterCombobox({
  selectedStatus,
  onSelect,
  placeholder = "Tous les statuts",
}: {
  selectedStatus?: string;
  onSelect: (status: string | null) => void;
  placeholder?: string;
}) {
  const [open, setOpen] = useState(false);

  const statusOptions = [
    { value: 'cree', label: 'Créé' },
    { value: 'valide', label: 'Validé' },
    { value: 'annule', label: 'Annulé' },
  ];

  const selectedStatusLabel = selectedStatus 
    ? statusOptions.find(s => s.value === selectedStatus)?.label || selectedStatus
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
          {selectedStatusLabel}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
        <Command>
          <CommandInput placeholder="Rechercher un statut..." />
          <CommandList>
            <CommandEmpty>Aucun statut trouvé.</CommandEmpty>
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
                    !selectedStatus ? "opacity-100" : "opacity-0"
                  )}
                />
                Tous les statuts
              </CommandItem>
              {statusOptions.map((status) => {
                const isSelected = selectedStatus === status.value;
                return (
                  <CommandItem
                    key={status.value}
                    value={status.value}
                    onSelect={() => {
                      onSelect(status.value);
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
                    {status.label}
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

const statusLabels: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline'; indicatorVariant: 'success' | 'error' | 'warning' | 'info' }> = {
  cree: { label: 'Créé', variant: 'outline', indicatorVariant: 'warning' },
  valide: { label: 'Validé', variant: 'default', indicatorVariant: 'success' },
  annule: { label: 'Annulé', variant: 'destructive', indicatorVariant: 'error' },
};

interface DeliveryNoteLineForm {
  productId: number;
  qte: number;
  prixUnitaire: number;
}

export default function DeliveryNotesPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [salespersonFilter, setSalespersonFilter] = useState<string>('');
  const [clientFilter, setClientFilter] = useState<string>('');
  const limit = 10;

  const { data: deliveryNotesData, isLoading, error, refetch } = useDeliveryNotes({
    page,
    limit,
    search: search || undefined,
    status: statusFilter ? statusFilter as any : undefined,
    salespersonId: salespersonFilter ? Number(salespersonFilter) : undefined,
    clientId: clientFilter ? Number(clientFilter) : undefined,
  });

  const { data: salespersonsData } = useSalespersons({ limit: 1000 });
  const salespersons = salespersonsData?.data || [];

  const { data: clientsData } = useClients({ limit: 100, sortBy: 'id', sortOrder: 'asc' });
  const clients = clientsData?.data || [];

  const { data: availableProducts } = useAvailableProducts();

  const [viewing, setViewing] = useState<DeliveryNote | null>(null);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isValidateOpen, setIsValidateOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedNote, setSelectedNote] = useState<DeliveryNote | null>(null);

  // États pour le formulaire de création
  const [createSalespersonId, setCreateSalespersonId] = useState<string>('');
  const [createClientId, setCreateClientId] = useState<string>('');
  const [createRemarque, setCreateRemarque] = useState('');
  const [createLines, setCreateLines] = useState<DeliveryNoteLineForm[]>([]);
  const [selectedProductId, setSelectedProductId] = useState<string>('');
  const [selectedQte, setSelectedQte] = useState<string>('');

  const createMutation = useCreateDeliveryNote();
  const updateMutation = useUpdateDeliveryNote();
  const validateMutation = useValidateDeliveryNote();
  const deleteMutation = useDeleteDeliveryNote();

  const deliveryNotes = deliveryNotesData?.data || [];
  const total = deliveryNotesData?.pagination?.total || 0;
  const totalPages = deliveryNotesData?.pagination?.pages || 1;

  // Fonction pour récupérer le prix d'un produit pour un client (avec quantité)
  const getProductPriceForClient = async (productId: number, clientId: number, quantity: number = 1): Promise<number> => {
    try {
      const response = await api.post('/delivery-notes/calculate-price', {
        productId,
        clientId,
        quantity,
      });
      return response.data.prixUnitaire || 0;
    } catch (error: any) {
      // Si l'endpoint n'existe pas, utiliser le prix unitaire du BCItem
      const product = availableProducts?.find(p => p.id === productId);
      return Number((product?.bcItem as any)?.unitPrice || 0);
    }
  };

  // Ajouter une ligne au formulaire
  const handleAddLine = async () => {
    if (!selectedProductId || !selectedQte || !createClientId) {
      toast.error('Veuillez sélectionner un produit, une quantité et un client');
      return;
    }

    const productId = Number(selectedProductId);
    const qte = Number(selectedQte);

    if (qte <= 0) {
      toast.error('La quantité doit être supérieure à 0');
      return;
    }

    // Vérifier si le produit est déjà dans les lignes
    if (createLines.find(l => l.productId === productId)) {
      toast.error('Ce produit est déjà dans la liste');
      return;
    }

    // Récupérer le prix (avec la quantité pour respecter minimumQuantity)
    const prixUnitaire = await getProductPriceForClient(productId, Number(createClientId), qte);

    setCreateLines([...createLines, { productId, qte, prixUnitaire }]);
    setSelectedProductId('');
    setSelectedQte('');
  };

  // Supprimer une ligne
  const handleRemoveLine = (index: number) => {
    setCreateLines(createLines.filter((_, i) => i !== index));
  };

  // Calculer le montant total
  const calculateTotal = () => {
    return createLines.reduce((sum, line) => sum + (line.qte * line.prixUnitaire), 0);
  };

  // Calculer le total de quantité
  const calculateTotalQuantity = () => {
    return createLines.reduce((sum, line) => sum + line.qte, 0);
  };

  const openView = async (note: DeliveryNote) => {
    setViewing(note);
    setIsViewOpen(true);
  };

  const openEdit = (note: DeliveryNote) => {
    setSelectedNote(note);
    setCreateSalespersonId(note.salespersonId.toString());
    setCreateClientId(note.clientId.toString());
    setCreateRemarque(note.remarque || '');
    setCreateLines(note.lines.map(l => ({
      productId: l.productId,
      qte: Number(l.qte),
      prixUnitaire: Number(l.prixUnitaire),
    })));
    setIsEditOpen(true);
  };

  const openValidate = (note: DeliveryNote) => {
    setSelectedNote(note);
    setIsValidateOpen(true);
  };

  const openDelete = (note: DeliveryNote) => {
    setSelectedNote(note);
    setIsDeleteOpen(true);
  };

  const handleValidate = async () => {
    if (!selectedNote) {
      return;
    }

    try {
      await validateMutation.mutateAsync({
        id: selectedNote.id,
        data: {},
      });
      setIsValidateOpen(false);
      setSelectedNote(null);
    } catch (error) {
      // Error handled by mutation
    }
  };

  const handleDelete = async () => {
    if (!selectedNote) return;

    try {
      await deleteMutation.mutateAsync(selectedNote.id);
      setIsDeleteOpen(false);
      setSelectedNote(null);
    } catch (error) {
      // Error handled by mutation
    }
  };

  const openCreate = () => {
    setCreateSalespersonId('');
    setCreateClientId('');
    setCreateRemarque('');
    setCreateLines([]);
    setSelectedProductId('');
    setSelectedQte('');
    setIsCreateOpen(true);
  };

  const handleCreate = async () => {
    if (!createSalespersonId) {
      toast.error('Veuillez sélectionner un vendeur');
      return;
    }

    if (!createClientId) {
      toast.error('Veuillez sélectionner un client');
      return;
    }

    if (createLines.length === 0) {
      toast.error('Veuillez ajouter au moins un produit');
      return;
    }

    try {
      await createMutation.mutateAsync({
        salespersonId: Number(createSalespersonId),
        clientId: Number(createClientId),
        remarque: createRemarque || undefined,
        lines: createLines.map(l => ({
          productId: l.productId,
          qte: l.qte,
          prixUnitaire: l.prixUnitaire,
        })),
      });
      setIsCreateOpen(false);
      setCreateSalespersonId('');
      setCreateClientId('');
      setCreateRemarque('');
      setCreateLines([]);
    } catch (error: any) {
      // Error handled by mutation
    }
  };

  const handleUpdate = async () => {
    if (!selectedNote) return;

    if (!createSalespersonId) {
      toast.error('Veuillez sélectionner un vendeur');
      return;
    }

    if (!createClientId) {
      toast.error('Veuillez sélectionner un client');
      return;
    }

    if (createLines.length === 0) {
      toast.error('Veuillez ajouter au moins un produit');
      return;
    }

    try {
      await updateMutation.mutateAsync({
        id: selectedNote.id,
        data: {
          salespersonId: Number(createSalespersonId),
          clientId: Number(createClientId),
          remarque: createRemarque || undefined,
          lines: createLines.map(l => ({
            productId: l.productId,
            qte: l.qte,
            prixUnitaire: l.prixUnitaire,
          })),
        },
      });
      setIsEditOpen(false);
      setSelectedNote(null);
      setCreateSalespersonId('');
      setCreateClientId('');
      setCreateRemarque('');
      setCreateLines([]);
    } catch (error: any) {
      // Error handled by mutation
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getSalespersonName = (salespersonId: number) => {
    const salesperson = salespersons.find(s => s.id === salespersonId);
    if (!salesperson) return 'N/A';
    return `${salesperson.firstName || ''} ${salesperson.lastName || ''}`.trim() || salesperson.code;
  };

  const getClientName = (clientId: number) => {
    const client = clients.find(c => c.id === clientId);
    if (!client) return 'N/A';
    return client.nomCommercial || client.nom;
  };

  if (error) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <p className="text-red-600 mb-4">Erreur lors du chargement des bons de livraison</p>
          <Button onClick={() => refetch()}>Réessayer</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Bons de livraison</h1>
          <p className="text-gray-600 dark:text-gray-400">Gérez les bons de livraison et leur validation</p>
        </div>
        <div className="flex space-x-2">
          <Button onClick={() => refetch()} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Actualiser
          </Button>
          <Button onClick={openCreate}>
            <Plus className="h-4 w-4 mr-2" />
            Ajouter
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Liste des bons de livraison</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-4 mb-4">
            <div className="w-80">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Rechercher par numéro, vendeur, client..."
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setPage(1);
                  }}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="flex-1">
              <StatusFilterCombobox
                selectedStatus={statusFilter || undefined}
                onSelect={(status) => {
                  setStatusFilter(status || '');
                  setPage(1);
                }}
              />
            </div>
            <div className="flex-1">
              <SalespersonFilterCombobox
                salespersons={salespersons}
                selectedId={salespersonFilter || undefined}
                onSelect={(id) => {
                  setSalespersonFilter(id || '');
                  setPage(1);
                }}
              />
            </div>
            <div className="flex-1">
              <ClientFilterCombobox
                clients={clients}
                selectedId={clientFilter || undefined}
                onSelect={(id) => {
                  setClientFilter(id || '');
                  setPage(1);
                }}
              />
            </div>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
            </div>
          ) : deliveryNotes.length === 0 ? (
            <div className="text-center py-12">
              <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">Aucun bon de livraison trouvé</p>
            </div>
          ) : (
            <>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Numéro</TableHead>
                      <TableHead>Vendeur</TableHead>
                      <TableHead>Client</TableHead>
                      <TableHead>Date livraison</TableHead>
                      <TableHead>Date validation</TableHead>
                      <TableHead>Nb lignes</TableHead>
                      <TableHead className="text-right">Montant total</TableHead>
                      <TableHead>Statut</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {deliveryNotes.map((note) => (
                      <TableRow key={note.id}>
                        <TableCell className="font-medium">{note.numero}</TableCell>
                        <TableCell>{getSalespersonName(note.salespersonId)}</TableCell>
                        <TableCell>{getClientName(note.clientId)}</TableCell>
                        <TableCell>{formatDate(note.dateLivraison)}</TableCell>
                        <TableCell>{formatDate(note.dateValidation)}</TableCell>
                        <TableCell>{note.lines.length}</TableCell>
                        <TableCell className="text-right font-medium">
                          {Number(note.montantTotal).toFixed(2)} TND
                        </TableCell>
                        <TableCell>
                          {(() => {
                            const status = statusLabels[note.status];
                            return (
                              <Pill className="text-xs">
                                <PillIndicator variant={status.indicatorVariant} />
                                {status.label}
                              </Pill>
                            );
                          })()}
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => openView(note)}>
                                <Eye className="h-4 w-4 mr-2" />
                                Consulter
                              </DropdownMenuItem>
                              {note.status === 'cree' && (
                                <>
                                  <DropdownMenuItem onClick={() => openEdit(note)}>
                                    <FileText className="h-4 w-4 mr-2" />
                                    Modifier
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => openValidate(note)}>
                                    <CheckCircle className="h-4 w-4 mr-2" />
                                    Valider
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => openDelete(note)} className="text-red-600">
                                    <Trash2 className="h-4 w-4 mr-2" />
                                    Supprimer
                                  </DropdownMenuItem>
                                </>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              <div className="flex items-center justify-between mt-4">
                <div className="text-sm text-gray-600">
                  Page {page} sur {totalPages} ({total} résultats)
                </div>
                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                    disabled={page >= totalPages}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Drawer de consultation */}
      <Drawer open={isViewOpen} onOpenChange={setIsViewOpen}>
        <DrawerContent 
          side="right" 
          className="h-full flex flex-col"
          style={{ width: '50vw', maxWidth: '50vw' }}
        >
          <DrawerHeader className="border-b">
            <DrawerTitle className="text-2xl font-bold">Détails du bon de livraison</DrawerTitle>
          </DrawerHeader>
          {viewing && (
            <div className="flex-1 overflow-y-auto">
              <div className="p-6 space-y-6">
                {/* Informations principales */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <FileText className="h-5 w-5" />
                      Informations générales
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <Label className="text-xs text-muted-foreground flex items-center gap-1">
                          <Hash className="h-3 w-3" />
                          Numéro
                        </Label>
                        <p className="font-semibold text-base">{viewing.numero}</p>
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs text-muted-foreground">Statut</Label>
                        <div>
                          {(() => {
                            const status = statusLabels[viewing.status];
                            return (
                              <Pill className="text-sm">
                                <PillIndicator variant={status.indicatorVariant} />
                                {status.label}
                              </Pill>
                            );
                          })()}
                        </div>
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs text-muted-foreground flex items-center gap-1">
                          <User className="h-3 w-3" />
                          Vendeur
                        </Label>
                        <p className="font-medium">{getSalespersonName(viewing.salespersonId)}</p>
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs text-muted-foreground flex items-center gap-1">
                          <Building2 className="h-3 w-3" />
                          Client
                        </Label>
                        <p className="font-medium">{getClientName(viewing.clientId)}</p>
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs text-muted-foreground flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          Date livraison
                        </Label>
                        <p className="font-medium">{formatDate(viewing.dateLivraison)}</p>
                      </div>
                      {viewing.dateValidation && (
                        <div className="space-y-1">
                          <Label className="text-xs text-muted-foreground flex items-center gap-1">
                            <CheckCircle className="h-3 w-3" />
                            Date validation
                          </Label>
                          <p className="font-medium">{formatDate(viewing.dateValidation)}</p>
                        </div>
                      )}
                      <div className="space-y-1">
                        <Label className="text-xs text-muted-foreground flex items-center gap-1">
                          <ShoppingCart className="h-3 w-3" />
                          Montant total
                        </Label>
                        <p className="font-medium text-lg">{Number(viewing.montantTotal).toFixed(2)} TND</p>
                      </div>
                    </div>
                    {viewing.remarque && (
                      <>
                        <Separator />
                        <div className="space-y-1">
                          <Label className="text-xs text-muted-foreground flex items-center gap-1">
                            <Info className="h-3 w-3" />
                            Remarque
                          </Label>
                          <p className="text-sm text-muted-foreground bg-muted/50 p-3 rounded-md">{viewing.remarque}</p>
                        </div>
                      </>
                    )}
                  </CardContent>
                </Card>

                {/* Lignes du bon de livraison */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Package className="h-5 w-5" />
                      Lignes du bon de livraison
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="rounded-lg border">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="font-semibold">Produit</TableHead>
                            <TableHead className="font-semibold">Référence</TableHead>
                            <TableHead className="font-semibold text-right">Quantité</TableHead>
                            <TableHead className="font-semibold text-right">Prix unitaire</TableHead>
                            <TableHead className="font-semibold text-right">Montant</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {viewing.lines.map((line, index) => (
                            <TableRow key={line.id} className={index % 2 === 0 ? 'bg-muted/30' : ''}>
                              <TableCell className="font-medium">
                                {line.product.bcItem?.displayName || line.product.designation}
                              </TableCell>
                              <TableCell className="text-muted-foreground">
                                {line.product.ref || '-'}
                              </TableCell>
                              <TableCell className="text-right font-medium">
                                {Number(line.qte)}
                              </TableCell>
                              <TableCell className="text-right">
                                {Number(line.prixUnitaire).toFixed(2)} TND
                              </TableCell>
                              <TableCell className="text-right font-medium">
                                {Number(line.montant).toFixed(2)} TND
                              </TableCell>
                            </TableRow>
                          ))}
                          {/* Ligne de total */}
                          <TableRow className="bg-blue-50 font-semibold">
                            <TableCell>Total</TableCell>
                            <TableCell>-</TableCell>
                            <TableCell className="text-right">
                              {viewing.lines.reduce((sum, line) => sum + Number(line.qte), 0).toFixed(2)}
                            </TableCell>
                            <TableCell className="text-right">-</TableCell>
                            <TableCell className="text-right">
                              {Number(viewing.montantTotal).toFixed(2)} TND
                            </TableCell>
                          </TableRow>
                        </TableBody>
                      </Table>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}
          <DrawerFooter className="border-t">
            <Button variant="outline" onClick={() => setIsViewOpen(false)}>
              Fermer
            </Button>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>

      {/* Dialog de validation */}
      <Dialog open={isValidateOpen} onOpenChange={setIsValidateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Valider le bon de livraison</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {selectedNote && (
              <div className="text-sm text-gray-600 space-y-2">
                <p>Bon de livraison: <strong>{selectedNote.numero}</strong></p>
                <p>Vendeur: <strong>{getSalespersonName(selectedNote.salespersonId)}</strong></p>
                <p>Client: <strong>{getClientName(selectedNote.clientId)}</strong></p>
                <p className="text-yellow-600 font-medium">
                  ⚠️ La validation décrémentera le stock du vendeur
                </p>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsValidateOpen(false)}>
              Annuler
            </Button>
            <Button 
              onClick={handleValidate} 
              disabled={validateMutation.isPending}
            >
              {validateMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Validation...
                </>
              ) : (
                'Valider'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Drawer de création */}
      <Drawer open={isCreateOpen} onOpenChange={(open) => {
        setIsCreateOpen(open);
        if (!open) {
          setCreateSalespersonId('');
          setCreateClientId('');
          setCreateRemarque('');
          setCreateLines([]);
          setSelectedProductId('');
          setSelectedQte('');
        }
      }}>
        <DrawerContent 
          side="right" 
          className="h-full flex flex-col"
          style={{ width: '60vw', maxWidth: '60vw' }}
        >
          <DrawerHeader>
            <DrawerTitle>Ajouter un bon de livraison</DrawerTitle>
          </DrawerHeader>
          <div className="flex-1 overflow-y-auto px-6 py-4">
            <div className="space-y-4">
              <div>
                <Label htmlFor="salesperson">Vendeur <span className="text-red-500">*</span></Label>
                <SalespersonCombobox
                  salespersons={salespersons}
                  selectedId={createSalespersonId}
                  onSelect={(id) => setCreateSalespersonId(id)}
                />
              </div>

              <div>
                <Label htmlFor="client">Client <span className="text-red-500">*</span></Label>
                <ClientCombobox
                  clients={clients}
                  selectedId={createClientId}
                  onSelect={(id) => {
                    setCreateClientId(id);
                    // Recalculer les prix si des lignes existent déjà
                    if (createLines.length > 0) {
                      Promise.all(
                        createLines.map(async (line, index) => {
                          const prixUnitaire = await getProductPriceForClient(line.productId, Number(id), line.qte);
                          return { ...line, prixUnitaire };
                        })
                      ).then(updatedLines => setCreateLines(updatedLines));
                    }
                  }}
                />
              </div>

              <div>
                <Label htmlFor="remarque">Remarque</Label>
                <Input
                  id="remarque"
                  value={createRemarque}
                  onChange={(e) => setCreateRemarque(e.target.value)}
                  placeholder="Remarque optionnelle"
                />
              </div>

              <Separator />

              <div>
                <Label>Produits <span className="text-red-500">*</span></Label>
                <div className="flex gap-2 mb-2">
                  <div className="flex-1">
                    <ProductCombobox
                      products={availableProducts || []}
                      selectedId={selectedProductId}
                      onSelect={(id) => setSelectedProductId(id || '')}
                      disabled={!createClientId}
                      excludeIds={createLines.map(l => l.productId)}
                    />
                  </div>
                  <Input
                    type="number"
                    placeholder="Quantité"
                    value={selectedQte}
                    onChange={(e) => setSelectedQte(e.target.value)}
                    min="0.01"
                    step="0.01"
                    className="w-32"
                    disabled={!selectedProductId || !createClientId}
                  />
                  <Button
                    onClick={handleAddLine}
                    disabled={!selectedProductId || !selectedQte || !createClientId}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Ajouter
                  </Button>
                </div>

                {createLines.length > 0 && (
                  <div className="mt-4 border rounded-lg">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Produit</TableHead>
                          <TableHead className="text-right">Quantité</TableHead>
                          <TableHead className="text-right">Prix unitaire</TableHead>
                          <TableHead className="text-right">Montant</TableHead>
                          <TableHead className="w-[50px]"></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {createLines.map((line, index) => {
                          const product = availableProducts?.find(p => p.id === line.productId);
                          return (
                            <TableRow key={index}>
                              <TableCell>
                                {product?.bcItem?.displayName || product?.designation || 'Produit inconnu'}
                              </TableCell>
                              <TableCell className="text-right">{line.qte}</TableCell>
                              <TableCell className="text-right">{line.prixUnitaire.toFixed(2)} TND</TableCell>
                              <TableCell className="text-right font-medium">
                                {(line.qte * line.prixUnitaire).toFixed(2)} TND
                              </TableCell>
                              <TableCell>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleRemoveLine(index)}
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                        {/* Ligne de total */}
                        <TableRow className="bg-blue-50 font-semibold">
                          <TableCell>Total</TableCell>
                          <TableCell className="text-right">{calculateTotalQuantity().toFixed(2)}</TableCell>
                          <TableCell className="text-right">-</TableCell>
                          <TableCell className="text-right">{calculateTotal().toFixed(2)} TND</TableCell>
                          <TableCell></TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </div>
                )}
              </div>
            </div>
          </div>
          <DrawerFooter className="border-t pt-4">
            <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
              <X className="mr-2 h-4 w-4" />
              Annuler
            </Button>
            <Button
              onClick={handleCreate}
              disabled={createMutation.isPending || !createSalespersonId || !createClientId || createLines.length === 0}
            >
              {createMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Enregistrement...
                </>
              ) : (
                <>
                  <FileText className="mr-2 h-4 w-4" />
                  Enregistrer
                </>
              )}
            </Button>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>

      {/* Drawer de modification - similaire à création */}
      <Drawer open={isEditOpen} onOpenChange={(open) => {
        setIsEditOpen(open);
        if (!open) {
          setSelectedNote(null);
          setCreateSalespersonId('');
          setCreateClientId('');
          setCreateRemarque('');
          setCreateLines([]);
        }
      }}>
        <DrawerContent 
          side="right" 
          className="h-full flex flex-col"
          style={{ width: '60vw', maxWidth: '60vw' }}
        >
          <DrawerHeader>
            <DrawerTitle>Modifier le bon de livraison</DrawerTitle>
          </DrawerHeader>
          <div className="flex-1 overflow-y-auto px-6 py-4">
            <div className="space-y-4">
              <div>
                <Label htmlFor="salesperson">Vendeur <span className="text-red-500">*</span></Label>
                <SalespersonCombobox
                  salespersons={salespersons}
                  selectedId={createSalespersonId}
                  onSelect={(id) => setCreateSalespersonId(id)}
                />
              </div>

              <div>
                <Label htmlFor="client">Client <span className="text-red-500">*</span></Label>
                <ClientCombobox
                  clients={clients}
                  selectedId={createClientId}
                  onSelect={(id) => {
                    setCreateClientId(id);
                    // Recalculer les prix
                    if (createLines.length > 0) {
                      Promise.all(
                        createLines.map(async (line) => {
                          const prixUnitaire = await getProductPriceForClient(line.productId, Number(id));
                          return { ...line, prixUnitaire };
                        })
                      ).then(updatedLines => setCreateLines(updatedLines));
                    }
                  }}
                />
              </div>

              <div>
                <Label htmlFor="remarque">Remarque</Label>
                <Input
                  id="remarque"
                  value={createRemarque}
                  onChange={(e) => setCreateRemarque(e.target.value)}
                  placeholder="Remarque optionnelle"
                />
              </div>

              <Separator />

              <div>
                <Label>Produits <span className="text-red-500">*</span></Label>
                <div className="flex gap-2 mb-2">
                  <div className="flex-1">
                    <ProductCombobox
                      products={availableProducts || []}
                      selectedId={selectedProductId}
                      onSelect={(id) => setSelectedProductId(id || '')}
                      disabled={!createClientId}
                      excludeIds={createLines.map(l => l.productId)}
                    />
                  </div>
                  <Input
                    type="number"
                    placeholder="Quantité"
                    value={selectedQte}
                    onChange={(e) => setSelectedQte(e.target.value)}
                    min="0.01"
                    step="0.01"
                    className="w-32"
                    disabled={!selectedProductId || !createClientId}
                  />
                  <Button
                    onClick={handleAddLine}
                    disabled={!selectedProductId || !selectedQte || !createClientId}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Ajouter
                  </Button>
                </div>

                {createLines.length > 0 && (
                  <div className="mt-4 border rounded-lg">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Produit</TableHead>
                          <TableHead className="text-right">Quantité</TableHead>
                          <TableHead className="text-right">Prix unitaire</TableHead>
                          <TableHead className="text-right">Montant</TableHead>
                          <TableHead className="w-[50px]"></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {createLines.map((line, index) => {
                          const product = availableProducts?.find(p => p.id === line.productId);
                          return (
                            <TableRow key={index}>
                              <TableCell>
                                {product?.bcItem?.displayName || product?.designation || 'Produit inconnu'}
                              </TableCell>
                              <TableCell className="text-right">{line.qte}</TableCell>
                              <TableCell className="text-right">{line.prixUnitaire.toFixed(2)} TND</TableCell>
                              <TableCell className="text-right font-medium">
                                {(line.qte * line.prixUnitaire).toFixed(2)} TND
                              </TableCell>
                              <TableCell>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleRemoveLine(index)}
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                        {/* Ligne de total */}
                        <TableRow className="bg-blue-50 font-semibold">
                          <TableCell>Total</TableCell>
                          <TableCell className="text-right">{calculateTotalQuantity().toFixed(2)}</TableCell>
                          <TableCell className="text-right">-</TableCell>
                          <TableCell className="text-right">{calculateTotal().toFixed(2)} TND</TableCell>
                          <TableCell></TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </div>
                )}
              </div>
            </div>
          </div>
          <DrawerFooter className="border-t pt-4">
            <Button variant="outline" onClick={() => setIsEditOpen(false)}>
              <X className="mr-2 h-4 w-4" />
              Annuler
            </Button>
            <Button
              onClick={handleUpdate}
              disabled={updateMutation.isPending || !createSalespersonId || !createClientId || createLines.length === 0}
            >
              {updateMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Enregistrement...
                </>
              ) : (
                <>
                  <FileText className="mr-2 h-4 w-4" />
                  Enregistrer
                </>
              )}
            </Button>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>

      {/* Dialog de suppression */}
      <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Supprimer le bon de livraison</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-gray-600">
            Êtes-vous sûr de vouloir supprimer le bon de livraison <strong>{selectedNote?.numero}</strong> ?
            Cette action est irréversible.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteOpen(false)}>
              Annuler
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleDelete}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Suppression...
                </>
              ) : (
                'Supprimer'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

