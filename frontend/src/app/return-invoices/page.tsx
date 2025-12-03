'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter } from '@/components/ui/table';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerFooter } from '@/components/ui/drawer';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Pill, PillIndicator } from '@/components/ui/pill';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Search, 
  Loader2, 
  ChevronLeft, 
  ChevronRight,
  FileText,
  Eye,
  Hash,
  User,
  Calendar,
  Receipt,
  Package,
  DollarSign,
  Building2,
  Plus,
  CheckCircle,
  Trash2,
  X,
  MoreHorizontal,
} from 'lucide-react';
import { useReturnInvoices, useReturnInvoice, useCreateReturnInvoice, useValidateReturnInvoice, useDeleteReturnInvoice, type ReturnInvoice } from '@/hooks/use-return-invoices';
import { useSalespersons } from '@/hooks/use-salespersons';
import { useStockConsultation } from '@/hooks/use-stock';
import { toast } from 'sonner';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Check, ChevronsUpDown } from 'lucide-react';
import { cn } from '@/lib/utils';

// Mapping des statuts pour les factures de retour
const returnInvoiceStatusLabels: Record<string, { label: string; indicatorVariant: 'success' | 'error' | 'warning' | 'info' }> = {
  cree: { label: 'Créée', indicatorVariant: 'warning' },
  valide: { label: 'Validée', indicatorVariant: 'success' },
  non_valide: { label: 'Non validée', indicatorVariant: 'error' },
};

// Composant QuantityInput pour gérer les quantités
function QuantityInput({
  value,
  onChange,
  min = 1,
  max,
  disabled = false,
  className = '',
}: {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  disabled?: boolean;
  className?: string;
}) {
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = parseInt(e.target.value) || min;
    if (newValue >= min && (!max || newValue <= max)) {
      onChange(newValue);
    } else if (newValue > max) {
      onChange(max);
      toast.error(`La quantité ne peut pas dépasser le stock disponible (${max})`);
    } else if (newValue < min) {
      onChange(min);
    }
  };

  return (
    <Input
      type="number"
      value={value}
      onChange={handleInputChange}
      min={min}
      max={max}
      disabled={disabled}
      className={`w-20 h-9 text-center ${className}`}
      step="1"
    />
  );
}

// Composant Combobox pour les vendeurs
function SalespersonCombobox({
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

  const selectedSalesperson = salespersons.find((sp) => String(sp.id) === selectedId);
  const displayValue = selectedSalesperson
    ? `${selectedSalesperson.code || ''} - ${selectedSalesperson.firstName} ${selectedSalesperson.lastName}`.trim()
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
                const label = `${sp.code || ''} - ${sp.firstName} ${sp.lastName}`.trim();
                return (
                  <CommandItem
                    key={sp.id}
                    value={`${sp.code} ${sp.firstName} ${sp.lastName}`}
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

// Composant Combobox pour les produits
function ProductCombobox({
  products,
  onSelect,
  placeholder = "Sélectionner un produit",
}: {
  products: Array<{ product: { id: number; designation: string; ref: string | null } }>;
  onSelect: (product: { id: number; designation: string }) => void;
  placeholder?: string;
}) {
  const [open, setOpen] = useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between"
        >
          {placeholder}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0" align="start">
        <Command>
          <CommandInput placeholder="Rechercher un produit..." />
          <CommandList>
            <CommandEmpty>Aucun produit trouvé.</CommandEmpty>
            <CommandGroup>
              {products.map((item) => {
                const product = item.product;
                const label = product.ref 
                  ? `${product.designation} (${product.ref})`
                  : product.designation;
                return (
                  <CommandItem
                    key={product.id}
                    value={`${product.designation} ${product.ref || ''}`}
                    onSelect={() => {
                      onSelect(product);
                      setOpen(false);
                    }}
                    className="cursor-pointer"
                  >
                    <Package className="mr-2 h-4 w-4" />
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

export default function ReturnInvoicesPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [salespersonFilter, setSalespersonFilter] = useState<string>('');
  const [dateFrom, setDateFrom] = useState<string>('');
  const [dateTo, setDateTo] = useState<string>('');
  const [viewing, setViewing] = useState<ReturnInvoice | null>(null);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedSalespersonId, setSelectedSalespersonId] = useState<string>('');
  const [selectedProducts, setSelectedProducts] = useState<Array<{ productId: number; qte: number; prixUnitaire?: number; productName: string }>>([]);
  const [invoiceToDelete, setInvoiceToDelete] = useState<ReturnInvoice | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const limit = 10;

  const { data: returnInvoicesData, isLoading } = useReturnInvoices({
    page,
    limit,
    search: search || undefined,
    salespersonId: salespersonFilter ? Number(salespersonFilter) : undefined,
    dateFrom: dateFrom || undefined,
    dateTo: dateTo || undefined,
  });

  const { data: invoiceData } = useReturnInvoice(viewing?.id || null);

  const { data: salespersonsData } = useSalespersons({ limit: 1000 });
  const salespersons = salespersonsData?.data || [];

  const createReturnInvoiceMutation = useCreateReturnInvoice();
  const validateReturnInvoiceMutation = useValidateReturnInvoice();
  const deleteReturnInvoiceMutation = useDeleteReturnInvoice();

  const returnInvoices = returnInvoicesData?.data || [];
  const total = returnInvoicesData?.pagination?.total || 0;
  const totalPages = returnInvoicesData?.pagination?.pages || 1;

  // Récupérer les produits disponibles pour le vendeur sélectionné
  const { data: stockData } = useStockConsultation(
    {
      salespersonId: selectedSalespersonId ? Number(selectedSalespersonId) : undefined,
      limit: 1000,
    },
    { enabled: !!selectedSalespersonId && isCreateOpen }
  );
  const availableProducts = stockData?.data || [];

  const openView = async (invoice: ReturnInvoice) => {
    setViewing(invoice);
    setIsViewOpen(true);
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'TND',
    }).format(amount);
  };

  const formatNumber = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  const getSalespersonName = (salespersonId: number) => {
    const salesperson = salespersons.find((sp) => sp.id === salespersonId);
    if (!salesperson) return `Vendeur ${salespersonId}`;
    return `${salesperson.firstName} ${salesperson.lastName}`.trim() || salesperson.code || `Vendeur ${salespersonId}`;
  };

  const handleCreateReturnInvoice = async () => {
    if (!selectedSalespersonId) {
      toast.error('Veuillez sélectionner un vendeur');
      return;
    }

    if (selectedProducts.length === 0) {
      toast.error('Veuillez ajouter au moins un produit');
      return;
    }

    try {
      await createReturnInvoiceMutation.mutateAsync({
        salespersonId: Number(selectedSalespersonId),
        lines: selectedProducts.map((p) => {
          // Récupérer le prix depuis le stock si prixUnitaire n'est pas défini
          const stockItem = availableProducts.find((item) => item.product.id === p.productId);
          const prixUnitaire = p.prixUnitaire || stockItem?.purchasePrice || 0;
          
          return {
            productId: p.productId,
            qte: Math.floor(p.qte), // S'assurer que la quantité est un entier
            prixUnitaire: prixUnitaire > 0 ? prixUnitaire : undefined,
          };
        }),
      });
      toast.success('Facture de retour créée avec succès');
      setIsCreateOpen(false);
      setSelectedSalespersonId('');
      setSelectedProducts([]);
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Erreur lors de la création de la facture de retour');
    }
  };

  const handleAddProduct = (product: { id: number; designation: string }) => {
    const existingIndex = selectedProducts.findIndex((p) => p.productId === product.id);
    const stockItem = availableProducts.find((item) => item.product.id === product.id);
    const maxStock = stockItem ? Math.floor(Number(stockItem.totalStock)) : 0;

    if (existingIndex >= 0) {
      const updated = [...selectedProducts];
      const currentQte = Math.floor(updated[existingIndex].qte);
      // Vérifier qu'on ne dépasse pas le stock
      if (currentQte < maxStock) {
        updated[existingIndex].qte = currentQte + 1;
        setSelectedProducts(updated);
      } else {
        toast.error(`La quantité ne peut pas dépasser le stock disponible (${maxStock})`);
      }
    } else {
      // Vérifier qu'il y a du stock disponible
      if (maxStock < 1) {
        toast.error('Stock insuffisant pour ce produit');
        return;
      }
      setSelectedProducts([
        ...selectedProducts,
        {
          productId: product.id,
          qte: 1,
          prixUnitaire: undefined,
          productName: product.designation,
        },
      ]);
    }
  };

  const handleRemoveProduct = (index: number) => {
    setSelectedProducts(selectedProducts.filter((_, i) => i !== index));
  };

  const handleUpdateProductQuantity = (index: number, qte: number) => {
    const product = selectedProducts[index];
    const stockItem = availableProducts.find((item) => item.product.id === product.productId);
    const maxStock = stockItem ? Math.floor(Number(stockItem.totalStock)) : 0;

    // Valider que la quantité ne dépasse pas le stock disponible
    if (qte > maxStock) {
      toast.error(`La quantité ne peut pas dépasser le stock disponible (${maxStock})`);
      return;
    }

    // Valider que la quantité est au moins 1
    if (qte < 1) {
      toast.error('La quantité doit être au moins 1');
      return;
    }

    const updated = [...selectedProducts];
    updated[index].qte = qte;
    setSelectedProducts(updated);
  };


  const handleValidateReturnInvoice = async (invoiceId: number) => {
    try {
      await validateReturnInvoiceMutation.mutateAsync(invoiceId);
      toast.success('Facture de retour validée avec succès - Stock mis à jour');
      if (viewing?.id === invoiceId) {
        setIsViewOpen(false);
        setViewing(null);
      }
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Erreur lors de la validation de la facture de retour');
    }
  };

  const handleDeleteReturnInvoice = (invoice: ReturnInvoice) => {
    setInvoiceToDelete(invoice);
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!invoiceToDelete) return;

    try {
      await deleteReturnInvoiceMutation.mutateAsync(invoiceToDelete.id);
      toast.success('Facture de retour supprimée avec succès');
      if (viewing?.id === invoiceToDelete.id) {
        setIsViewOpen(false);
        setViewing(null);
      }
      setIsDeleteDialogOpen(false);
      setInvoiceToDelete(null);
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Erreur lors de la suppression de la facture de retour');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Factures de retour</h1>
          <p className="text-gray-600 dark:text-gray-400">Consultez les factures de retour générées automatiquement</p>
        </div>
        <Button onClick={() => setIsCreateOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Ajouter
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Liste des factures de retour</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          {/* Filtres */}
          <div className="mb-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Vendeur</label>
                <SalespersonCombobox
                  salespersons={salespersons}
                  selectedId={salespersonFilter}
                  onSelect={(id) => {
                    setSalespersonFilter(id || '');
                    setPage(1);
                  }}
                  placeholder="Tous les vendeurs"
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Date du</label>
                <Input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => {
                    setDateFrom(e.target.value);
                    setPage(1);
                  }}
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Date au</label>
                <Input
                  type="date"
                  value={dateTo}
                  onChange={(e) => {
                    setDateTo(e.target.value);
                    setPage(1);
                  }}
                  min={dateFrom || undefined}
                />
              </div>
            </div>
            {(dateFrom || dateTo || salespersonFilter) && (
              <div className="flex justify-end">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setDateFrom('');
                    setDateTo('');
                    setSalespersonFilter('');
                    setPage(1);
                  }}
                >
                  Réinitialiser les filtres
                </Button>
              </div>
            )}
          </div>

          {/* Barre de recherche */}
          <div className="mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Rechercher par numéro de facture..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                className="pl-10"
              />
            </div>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
            </div>
          ) : returnInvoices.length === 0 ? (
            <div className="text-center py-12">
              <Receipt className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">Aucune facture de retour trouvée</p>
            </div>
          ) : (
            <>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Numéro</TableHead>
                      <TableHead>Vendeur</TableHead>
                      <TableHead>Date facture</TableHead>
                      <TableHead className="text-right">Montant total</TableHead>
                      <TableHead>Nb lignes</TableHead>
                      <TableHead>Statut</TableHead>
                      <TableHead>N° Facture BC</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {returnInvoices.map((invoice) => (
                      <TableRow key={invoice.id}>
                        <TableCell className="font-medium">
                          {invoice.bcNumber || invoice.numero}
                        </TableCell>
                        <TableCell>{getSalespersonName(invoice.salespersonId)}</TableCell>
                        <TableCell>{formatDate(invoice.dateFacture)}</TableCell>
                        <TableCell className="text-right font-semibold">
                          {formatCurrency(Number(invoice.montantTotal))}
                        </TableCell>
                        <TableCell>{invoice.lines.length}</TableCell>
                        <TableCell>
                          {(() => {
                            const status = returnInvoiceStatusLabels[invoice.status] || { label: invoice.status, indicatorVariant: 'info' as const };
                            return (
                              <Pill className="text-xs">
                                <PillIndicator variant={status.indicatorVariant} />
                                {status.label}
                              </Pill>
                            );
                          })()}
                        </TableCell>
                        <TableCell>
                          {invoice.bcNumber ? (
                            <span className="text-sm font-mono text-gray-600 dark:text-gray-400">
                              {invoice.bcNumber}
                            </span>
                          ) : (
                            <span className="text-sm text-gray-400">-</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => openView(invoice)}>
                                <Eye className="h-4 w-4 mr-2" />
                                Consulter
                              </DropdownMenuItem>
                              {invoice.status === 'cree' && (
                                <>
                                  <DropdownMenuItem 
                                    onClick={() => handleValidateReturnInvoice(invoice.id)}
                                    disabled={validateReturnInvoiceMutation.isPending}
                                  >
                                    {validateReturnInvoiceMutation.isPending ? (
                                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    ) : (
                                      <CheckCircle className="h-4 w-4 mr-2" />
                                    )}
                                    Valider
                                  </DropdownMenuItem>
                                  <DropdownMenuItem 
                                    onClick={() => handleDeleteReturnInvoice(invoice)}
                                    className="text-red-600"
                                  >
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

              {/* Pagination */}
              {totalPages > 1 && (
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
                      Précédent
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                      disabled={page === totalPages}
                    >
                      Suivant
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Drawer de consultation */}
      <Drawer open={isViewOpen} onOpenChange={(open) => {
        setIsViewOpen(open);
        if (!open) {
          setViewing(null);
        }
      }}>
        <DrawerContent
          side="right"
          className="h-full flex flex-col"
          style={{ width: '70vw', maxWidth: '70vw' }}
        >
          <DrawerHeader className="border-b">
            <DrawerTitle className="text-2xl font-bold">Détails de la facture de retour</DrawerTitle>
          </DrawerHeader>
          {invoiceData && (
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
                    <div className="grid grid-cols-3 gap-4">
                      <div className="space-y-1">
                        <Label className="text-xs text-muted-foreground flex items-center gap-1">
                          <Hash className="h-3 w-3" />
                          Numéro facture
                        </Label>
                        <p className="font-semibold text-base">
                          {invoiceData.purchaseOrder?.bcInvoiceNumber || invoiceData.numero}
                        </p>
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs text-muted-foreground">Statut</Label>
                        <div>
                          {(() => {
                            const status = returnInvoiceStatusLabels[invoiceData.status] || { label: invoiceData.status, indicatorVariant: 'info' as const };
                            return (
                              <Pill className="text-xs">
                                <PillIndicator variant={status.indicatorVariant} />
                                {status.label}
                              </Pill>
                            );
                          })()}
                        </div>
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs text-muted-foreground flex items-center gap-1">
                          <DollarSign className="h-3 w-3" />
                          Total TTC
                        </Label>
                        <p className="font-semibold text-base text-primary">
                          {invoiceData.montantTTC ? formatCurrency(Number(invoiceData.montantTTC)) : formatCurrency(Number(invoiceData.montantTotal))}
                        </p>
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs text-muted-foreground flex items-center gap-1">
                          <User className="h-3 w-3" />
                          Vendeur
                        </Label>
                        <p className="font-medium">{getSalespersonName(invoiceData.salespersonId)}</p>
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs text-muted-foreground flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          Date facture
                        </Label>
                        <p className="font-medium">{formatDate(invoiceData.dateFacture)}</p>
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs text-muted-foreground">Nb lignes</Label>
                        <p className="font-medium">{invoiceData.lines.length}</p>
                      </div>
                      {invoiceData.purchaseOrder && (
                        <div className="space-y-1">
                          <Label className="text-xs text-muted-foreground flex items-center gap-1">
                            <Package className="h-3 w-3" />
                            Bon de commande
                          </Label>
                          <p className="font-medium">{invoiceData.purchaseOrder.numero}</p>
                        </div>
                      )}
                      {invoiceData.purchaseOrder?.bcNumber && (
                        <div className="space-y-1">
                          <Label className="text-xs text-muted-foreground flex items-center gap-1">
                            <Building2 className="h-3 w-3" />
                            Numéro BC
                          </Label>
                          <p className="font-medium">{invoiceData.purchaseOrder.bcNumber}</p>
                        </div>
                      )}
                      {invoiceData.bcNumber && (
                        <div className="space-y-1">
                          <Label className="text-xs text-muted-foreground flex items-center gap-1">
                            <Building2 className="h-3 w-3" />
                            Numéro BC (Facture)
                          </Label>
                          <p className="font-medium">{invoiceData.bcNumber}</p>
                        </div>
                      )}
                      {invoiceData.bcNumber && (
                        <div className="space-y-1">
                          <Label className="text-xs text-muted-foreground flex items-center gap-1">
                            <Hash className="h-3 w-3" />
                            N° Facture BC
                          </Label>
                          <p className="font-medium font-mono text-sm">{invoiceData.bcNumber}</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Lignes de la facture */}
                <Card>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Receipt className="h-5 w-5" />
                        Lignes de la facture
                      </CardTitle>
                      <Badge variant="outline" className="text-xs">
                        {invoiceData.lines.length} ligne{invoiceData.lines.length > 1 ? 's' : ''}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="rounded-lg border overflow-hidden">
                      <div className="overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow className="bg-muted/50">
                              <TableHead className="font-semibold">Produit</TableHead>
                              <TableHead className="font-semibold text-right">Quantité</TableHead>
                              <TableHead className="font-semibold">Unité</TableHead>
                              <TableHead className="font-semibold text-right">Prix unitaire</TableHead>
                              <TableHead className="font-semibold text-right">Montant TTC</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {invoiceData.lines.map((line, index) => (
                              <TableRow key={line.id} className={index % 2 === 0 ? 'bg-muted/20' : ''}>
                                <TableCell className="font-medium">
                                  {line.product.bcItem?.displayName || line.product.designation}
                                </TableCell>
                                <TableCell className="text-right font-medium">
                                  {Number(line.qte).toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </TableCell>
                                <TableCell className="text-sm">
                                  {line.unite || line.product.bcItem?.baseUnitOfMeasure || '-'}
                                </TableCell>
                                <TableCell className="text-right text-sm">
                                  {line.prixUnitaire ? formatNumber(Number(line.prixUnitaire)) : '-'}
                                </TableCell>
                                <TableCell className="text-right font-semibold">
                                  {line.amountIncludingTax !== null && line.amountIncludingTax !== undefined
                                    ? formatNumber(Number(line.amountIncludingTax))
                                    : formatNumber(Number(line.montant))}
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}
          <DrawerFooter className="border-t">
            <div className="flex items-center justify-end gap-2 w-full">
              {invoiceData && invoiceData.status === 'non_valide' && (
                <Button
                  onClick={() => handleValidateReturnInvoice(invoiceData.id)}
                  disabled={validateReturnInvoiceMutation.isPending}
                >
                  {validateReturnInvoiceMutation.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Validation...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Valider la facture
                    </>
                  )}
                </Button>
              )}
              <Button variant="outline" onClick={() => setIsViewOpen(false)}>
                Fermer
              </Button>
            </div>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>

      {/* Drawer de création */}
      <Drawer open={isCreateOpen} onOpenChange={(open) => {
        setIsCreateOpen(open);
        if (!open) {
          setSelectedSalespersonId('');
          setSelectedProducts([]);
        }
      }}>
        <DrawerContent 
          side="right" 
          className="h-full flex flex-col"
          style={{ width: '50vw', maxWidth: '50vw' }}
        >
          <DrawerHeader>
            <DrawerTitle>Ajouter une facture de retour</DrawerTitle>
          </DrawerHeader>
          <div className="flex-1 overflow-y-auto px-6">
            <div className="space-y-4 py-4">
              {/* Sélection du vendeur */}
              <div>
                <Label htmlFor="salesperson">Vendeur <span className="text-red-500">*</span></Label>
                <SalespersonCombobox
                  salespersons={salespersons}
                  selectedId={selectedSalespersonId}
                  onSelect={(id) => {
                    setSelectedSalespersonId(id || '');
                    setSelectedProducts([]);
                  }}
                  placeholder="Sélectionner un vendeur"
                />
              </div>

              {/* Ajout de produits */}
              {selectedSalespersonId && (
                <>
                  <Separator />
                  <div>
                    <Label>Ajouter un produit</Label>
                    <div className="mt-2">
                      <ProductCombobox
                        products={availableProducts}
                        onSelect={handleAddProduct}
                        placeholder="Sélectionner un produit"
                      />
                    </div>
                  </div>

                  {/* Liste des produits sélectionnés */}
                  {selectedProducts.length > 0 && (
                    <>
                      <Separator />
                      <div className="-my-4">
                        <Label className="mb-2 block">Produits sélectionnés</Label>
                        <div className="rounded-md border">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Produit</TableHead>
                                <TableHead className="text-center">Quantité</TableHead>
                                <TableHead className="text-right">Prix unitaire</TableHead>
                                <TableHead className="text-right">Total</TableHead>
                                <TableHead className="w-[50px]"></TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {selectedProducts.map((product, index) => {
                                const stockItem = availableProducts.find((item) => item.product.id === product.productId);
                                const prixUnitaire = product.prixUnitaire || stockItem?.purchasePrice || 0;
                                const total = Number(prixUnitaire) * Number(product.qte);
                                return (
                                  <TableRow key={index}>
                                    <TableCell>
                                      <div>
                                        <p className="font-semibold">{product.productName}</p>
                                        {stockItem && (
                                          <p className="text-xs text-muted-foreground">
                                            Stock: {Number(stockItem.totalStock).toFixed(2)}
                                          </p>
                                        )}
                                      </div>
                                    </TableCell>
                                    <TableCell>
                                      <div className="flex justify-center">
                                        <QuantityInput
                                          value={Math.floor(product.qte)}
                                          onChange={(newQte) => handleUpdateProductQuantity(index, newQte)}
                                          min={1}
                                          max={stockItem ? Math.floor(Number(stockItem.totalStock)) : undefined}
                                        />
                                      </div>
                                    </TableCell>
                                    <TableCell className="text-right">
                                      {prixUnitaire > 0 ? `${Number(prixUnitaire).toFixed(2)} TND` : '-'}
                                    </TableCell>
                                    <TableCell className="text-right font-medium">
                                      {prixUnitaire > 0 ? `${formatNumber(total)} TND` : '-'}
                                    </TableCell>
                                    <TableCell>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => handleRemoveProduct(index)}
                                        className="h-8 w-8 p-0"
                                      >
                                        <Trash2 className="h-4 w-4" />
                                      </Button>
                                    </TableCell>
                                  </TableRow>
                                );
                              })}
                            </TableBody>
                            <TableFooter>
                              <TableRow>
                                <TableCell colSpan={3} className="text-right font-semibold">
                                  Total TTC
                                </TableCell>
                                <TableCell className="text-right font-bold text-primary text-lg">
                                  {(() => {
                                    const totalTTC = selectedProducts.reduce((sum, p) => {
                                      const stockItem = availableProducts.find((item) => item.product.id === p.productId);
                                      const prixUnitaire = p.prixUnitaire || stockItem?.purchasePrice || 0;
                                      return sum + (Number(prixUnitaire) * Number(p.qte));
                                    }, 0);
                                    return formatNumber(totalTTC);
                                  })()} TND
                                </TableCell>
                                <TableCell></TableCell>
                              </TableRow>
                            </TableFooter>
                          </Table>
                        </div>
                      </div>
                    </>
                  )}
                </>
              )}
            </div>
          </div>
          <DrawerFooter className="border-t pt-4">
            <div className="flex items-center justify-end gap-2 w-full">
              <Button
                variant="outline"
                onClick={() => {
                  setIsCreateOpen(false);
                  setSelectedSalespersonId('');
                  setSelectedProducts([]);
                }}
              >
                <X className="mr-2 h-4 w-4" />
                Annuler
              </Button>
              <Button
                onClick={handleCreateReturnInvoice}
                disabled={!selectedSalespersonId || selectedProducts.length === 0 || createReturnInvoiceMutation.isPending}
              >
                {createReturnInvoiceMutation.isPending ? (
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
            </div>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>

      {/* AlertDialog de confirmation de suppression */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer la facture de retour</AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir supprimer la facture de retour <strong>{invoiceToDelete?.numero}</strong> ?
              Cette action est irréversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setInvoiceToDelete(null)}>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              disabled={deleteReturnInvoiceMutation.isPending}
              className="bg-red-600 hover:bg-red-700"
            >
              {deleteReturnInvoiceMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Suppression...
                </>
              ) : (
                'Supprimer'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

