'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Pill, PillIndicator } from '@/components/ui/pill';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerFooter } from '@/components/ui/drawer';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
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
  Truck,
  Receipt,
  Info,
} from 'lucide-react';
import { 
  usePurchaseOrders,
  usePurchaseOrder,
  useCreatePurchaseOrderFromChargementType,
  useValidatePurchaseOrder,
  useDeletePurchaseOrder,
  useRefreshBCStatus,
  type PurchaseOrder,
} from '@/hooks/use-purchase-orders';
import { useSalespersons } from '@/hooks/use-salespersons';
import { useChargementTypeBySalesperson } from '@/hooks/use-chargement-types';
import { useStockConsultation } from '@/hooks/use-stock';
import { useBCLocations } from '@/hooks/use-bc-locations';
import { useSession } from 'next-auth/react';
import api from '@/lib/api';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { useQueries } from '@tanstack/react-query';
import { useStockByLocation } from '@/hooks/use-stock';

// Composant pour le bouton d'actualisation du statut BC
function RefreshBCStatusButton({ 
  orderId, 
  onSuccess 
}: { 
  orderId: number;
  onSuccess?: (bcStatus: string | null, bcFullyShipped: boolean | null, bcShipmentNumber: string | null, bcInvoiced: boolean | null, bcInvoiceNumber: string | null) => void;
}) {
  const refreshBCStatus = useRefreshBCStatus();

  const handleClick = () => {
    refreshBCStatus.mutate(orderId, {
      onSuccess: (data: any) => {
        if (onSuccess) {
          onSuccess(data.bcStatus, data.bcFullyShipped, data.bcShipmentNumber, data.bcInvoiced, data.bcInvoiceNumber);
        }
      },
    });
  };

  return (
    <Button
      size="sm"
      variant="outline"
      onClick={handleClick}
      disabled={refreshBCStatus.isPending}
    >
      <RefreshCw className={`h-4 w-4 mr-2 ${refreshBCStatus.isPending ? 'animate-spin' : ''}`} />
      Actualiser
    </Button>
  );
}

const statusLabels: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline'; indicatorVariant: 'success' | 'error' | 'warning' | 'info' }> = {
  non_valide: { label: 'Non validé', variant: 'outline', indicatorVariant: 'warning' },
  valide: { label: 'Validé', variant: 'default', indicatorVariant: 'info' },
  envoye_bc: { label: 'Envoyé BC', variant: 'default', indicatorVariant: 'success' }, // Vert
  expedie: { label: 'Expédié', variant: 'default', indicatorVariant: 'success' },
  annule: { label: 'Annulé', variant: 'destructive', indicatorVariant: 'error' },
};

// Fonction pour déterminer le statut combiné (local + BC)
const getCombinedStatus = (order: PurchaseOrder): { 
  label: string; 
  variant: 'default' | 'secondary' | 'destructive' | 'outline'; 
  indicatorVariant: 'success' | 'error' | 'warning' | 'info';
  pulse?: boolean;
  roundedFull?: boolean;
} => {
  // Si annulé
  if (order.status === 'annule') {
    return { 
      label: 'Annulé', 
      variant: 'destructive', 
      indicatorVariant: 'error' 
    };
  }

  // Si non validé
  if (order.status === 'non_valide') {
    return { 
      label: 'Non validé', 
      variant: 'outline', 
      indicatorVariant: 'warning' 
    };
  }

  // Si validé mais pas encore envoyé à BC
  if (order.status === 'valide') {
    return { 
      label: 'Validé', 
      variant: 'default', 
      indicatorVariant: 'info' 
    };
  }

  // Si envoyé à BC
  if (order.status === 'envoye_bc') {
    // Vérifier si expédié et/ou facturé (utiliser les propriétés BC si disponibles)
    const isExpedie = (order as any).bcFullyShipped === true;
    const isFacture = (order as any).bcInvoiced === true;

    if (isExpedie && isFacture) {
      return { 
        label: 'Expédié | Facturé', 
        variant: 'default', 
        indicatorVariant: 'success',
        pulse: true
      };
    } else if (isExpedie) {
      return { 
        label: 'Expédié', 
        variant: 'default', 
        indicatorVariant: 'success',
        pulse: true
      };
    } else if (isFacture) {
      return { 
        label: 'Facturé', 
        variant: 'default', 
        indicatorVariant: 'success',
        pulse: true
      };
    } else {
      return { 
        label: 'Envoyé BC', 
        variant: 'default', 
        indicatorVariant: 'info',
        pulse: true,
        roundedFull: true
      };
    }
  }

  // Si expédié (statut local)
  if (order.status === 'expedie') {
    const isFacture = (order as any).bcInvoiced === true;
    
    if (isFacture) {
      return { 
        label: 'Expédié | Facturé', 
        variant: 'default', 
        indicatorVariant: 'success',
        pulse: true
      };
    } else {
      return { 
        label: 'Expédié', 
        variant: 'default', 
        indicatorVariant: 'success',
        pulse: true
      };
    }
  }

  // Par défaut
  return { 
    label: statusLabels[order.status]?.label || order.status, 
    variant: statusLabels[order.status]?.variant || 'secondary', 
    indicatorVariant: statusLabels[order.status]?.indicatorVariant || 'info' 
  };
};

export default function PurchaseOrdersPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [salespersonFilter, setSalespersonFilter] = useState<string>('');
  const limit = 10;

  const { data: purchaseOrdersData, isLoading, error, refetch } = usePurchaseOrders({
    page,
    limit,
    search: search || undefined,
    status: statusFilter ? statusFilter as any : undefined,
    salespersonId: salespersonFilter ? Number(salespersonFilter) : undefined,
  });

  const { data: salespersonsData } = useSalespersons({ limit: 1000 });
  const salespersons = salespersonsData?.data || [];

  // Récupérer le bcLocationId de l'utilisateur connecté
  const { data: session } = useSession();
  const userBcLocationId = (session?.user as any)?.bcLocationId || null;

  const [viewing, setViewing] = useState<PurchaseOrder | null>(null);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isValidateOpen, setIsValidateOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<PurchaseOrder | null>(null);
  const [modifiedQuantities, setModifiedQuantities] = useState<Map<number, number>>(new Map());

  // États pour le formulaire de création
  const [createSalespersonId, setCreateSalespersonId] = useState<string>('');
  const [createRemarque, setCreateRemarque] = useState('');
  const [selectedChargementTypeId, setSelectedChargementTypeId] = useState<number | null>(null);
  const [selectedLocationId, setSelectedLocationId] = useState<string>('');

  // Charger les magasins
  const { data: locationsData } = useBCLocations({ limit: 1000 });
  const allLocations = locationsData?.data || [];

  // Trouver le vendeur sélectionné
  const selectedSalesperson = createSalespersonId
    ? salespersons.find(sp => sp.id === Number(createSalespersonId))
    : null;
  
  // Récupérer le magasin du vendeur sélectionné
  const salespersonBcLocationId = selectedSalesperson?.bcLocationId || null;
  
  // Filtrer les magasins : si le vendeur a un magasin, afficher uniquement ce magasin
  // salespersonBcLocationId est maintenant un bcId (GUID), on doit comparer avec bcId
  const locations = salespersonBcLocationId
    ? allLocations.filter(loc => loc.bcId === salespersonBcLocationId)
    : allLocations;

  // Mettre à jour le magasin quand le vendeur change
  useEffect(() => {
    if (salespersonBcLocationId) {
      // Si le vendeur a un magasin, le pré-sélectionner (bcId est déjà un string)
      setSelectedLocationId(salespersonBcLocationId);
    } else {
      // Si le vendeur n'a pas de magasin, ne rien pré-sélectionner
      setSelectedLocationId('');
    }
  }, [salespersonBcLocationId]);

  // Charger le chargement type du vendeur sélectionné
  const { data: chargementType, isLoading: isLoadingChargementType, error: chargementTypeError } = 
    useChargementTypeBySalesperson(createSalespersonId ? Number(createSalespersonId) : null);

  // Charger le stock du vendeur pour calculer les quantités à charger
  const { data: stockData } = useStockConsultation(
    {
      salespersonId: createSalespersonId ? Number(createSalespersonId) : undefined,
      limit: 10000, // Récupérer tout le stock
    },
    {
      enabled: !!createSalespersonId,
    }
  );

  // Créer un map du stock par bcItemId pour accès rapide
  const stockByBcItemId = new Map<string, number>();
  if (stockData?.data) {
    stockData.data.forEach((item) => {
      if (item.product.bcItem?.bcId) {
        stockByBcItemId.set(item.product.bcItem.bcId, Number(item.totalStock));
      }
    });
  }

  // Récupérer le stock du magasin BC de l'utilisateur pour tous les produits du chargement type
  const stockQueries = useQueries({
    queries: chargementType?.products && userBcLocationId
      ? chargementType.products.map((product) => ({
          queryKey: ['stock', 'by-location', { bcItemId: product.productId, locationId: userBcLocationId }],
          queryFn: async () => {
            const params = new URLSearchParams();
            params.append('bcItemId', product.productId);
            params.append('locationId', userBcLocationId);
            const response = await api.get(`/stock/by-location?${params.toString()}`);
            return response.data;
          },
          enabled: !!product.productId && !!userBcLocationId,
        }))
      : [],
  });

  // Créer un map du stock par bcItemId pour le magasin BC de l'utilisateur
  const stockByBcItemIdUserLocation = new Map<string, number | null>();
  stockQueries.forEach((query, index) => {
    if (chargementType?.products && query.data?.data && query.data.data.length > 0) {
      const product = chargementType.products[index];
      if (product) {
        // L'API filtre déjà par locationId, donc on prend le premier résultat
        const stockItem = query.data.data[0];
        stockByBcItemIdUserLocation.set(
          product.productId,
          stockItem?.stockByLocation ?? null
        );
      }
    } else if (chargementType?.products && query.data?.data && query.data.data.length === 0) {
      // Aucun stock trouvé pour ce produit dans ce magasin
      const product = chargementType.products[index];
      if (product) {
        stockByBcItemIdUserLocation.set(product.productId, null);
      }
    }
  });

  // Vérifier si un bon de commande non validé existe déjà pour ce chargement type
  const { data: existingPurchaseOrder } = usePurchaseOrders({
    page: 1,
    limit: 1,
    chargementTypeId: selectedChargementTypeId || undefined,
  });

  // Vérifier s'il existe un bon de commande avec un statut pas encore envoyé à BC (non_valide ou valide)
  const hasExistingNonValideOrder = existingPurchaseOrder?.data && 
    existingPurchaseOrder.data.some(order => order.status === 'non_valide' || order.status === 'valide');

  // Mettre à jour l'ID du chargement type quand il est chargé
  useEffect(() => {
    if (chargementType?.id) {
      setSelectedChargementTypeId(chargementType.id);
    } else {
      setSelectedChargementTypeId(null);
    }
  }, [chargementType]);

  const createMutation = useCreatePurchaseOrderFromChargementType();
  const validateMutation = useValidatePurchaseOrder();
  const deleteMutation = useDeletePurchaseOrder();

  const purchaseOrders = purchaseOrdersData?.data || [];
  const total = purchaseOrdersData?.pagination?.total || 0;
  const totalPages = purchaseOrdersData?.pagination?.pages || 1;

  const openView = async (order: PurchaseOrder) => {
    setViewing(order);
    setIsViewOpen(true);
  };

  const openValidate = (order: PurchaseOrder) => {
    setSelectedOrder(order);
    // Initialiser les quantités modifiées avec les quantités actuelles
    const initialQuantities = new Map<number, number>();
    order.lines.forEach(line => {
      initialQuantities.set(line.id, Number(line.qte));
    });
    setModifiedQuantities(initialQuantities);
    setIsValidateOpen(true);
  };

  const openDelete = (order: PurchaseOrder) => {
    setSelectedOrder(order);
    setIsDeleteOpen(true);
  };

  const handleValidate = async () => {
    if (!selectedOrder) {
      return;
    }

    // Préparer les lignes avec quantités modifiées
    const linesToSend: Array<{ lineId: number; qte: number }> = [];
    let hasModifications = false;

    selectedOrder.lines.forEach(line => {
      const originalQte = Number(line.qte);
      const modifiedQte = modifiedQuantities.get(line.id) ?? originalQte;
      
      if (modifiedQte !== originalQte) {
        hasModifications = true;
        linesToSend.push({
          lineId: line.id,
          qte: modifiedQte,
        });
      }
    });

    try {
      await validateMutation.mutateAsync({
        id: selectedOrder.id,
        data: {
          // Le numéro client est récupéré automatiquement depuis le vendeur
          lines: hasModifications ? linesToSend : undefined,
        },
      });
      setIsValidateOpen(false);
      setSelectedOrder(null);
      setModifiedQuantities(new Map());
    } catch (error) {
      // Error handled by mutation
    }
  };

  const handleQuantityChange = (lineId: number, newQte: number, maxQte: number) => {
    // Vérifier que la quantité ne dépasse pas la quantité de référence
    if (newQte < 0) {
      toast.error('La quantité ne peut pas être négative');
      return;
    }
    if (newQte > maxQte) {
      toast.error(`La quantité ne peut pas dépasser ${maxQte} (quantité du chargement type)`);
      return;
    }

    setModifiedQuantities(prev => {
      const newMap = new Map(prev);
      newMap.set(lineId, newQte);
      return newMap;
    });
  };

  const handleDelete = async () => {
    if (!selectedOrder) return;

    try {
      await deleteMutation.mutateAsync(selectedOrder.id);
      setIsDeleteOpen(false);
      setSelectedOrder(null);
    } catch (error) {
      // Error handled by mutation
    }
  };

  const openCreate = () => {
    setCreateSalespersonId('');
    setCreateRemarque('');
    setSelectedChargementTypeId(null);
    setSelectedLocationId('');
    setIsCreateOpen(true);
  };

  const handleCreate = async () => {
    if (!createSalespersonId) {
      toast.error('Veuillez sélectionner un vendeur');
      return;
    }

    if (!chargementType) {
      toast.error('Aucun chargement type trouvé pour ce vendeur');
      return;
    }

    if (!chargementType.id) {
      toast.error('Chargement type invalide');
      return;
    }

    // Vérifier si un bon de commande non validé existe déjà
    if (hasExistingNonValideOrder) {
      const existingOrder = existingPurchaseOrder?.data.find(order => order.status === 'non_valide' || order.status === 'valide');
      toast.error(`Un bon de commande avec le statut "${existingOrder?.status}" existe déjà pour ce chargement type (${existingOrder?.numero}). Vous devez d'abord valider ou annuler ce bon de commande.`);
      return;
    }

    if (!selectedLocationId) {
      toast.error('Veuillez sélectionner un magasin');
      return;
    }

    try {
      await createMutation.mutateAsync({
        chargementTypeId: chargementType.id,
        locationId: selectedLocationId || null,
      });
      setIsCreateOpen(false);
      setCreateSalespersonId('');
      setCreateRemarque('');
      setSelectedChargementTypeId(null);
    } catch (error: any) {
      // Afficher un message plus spécifique si c'est un conflit
      if (error?.response?.status === 409) {
        toast.error('Un bon de commande existe déjà pour ce chargement type');
      }
      // Sinon, l'erreur est déjà gérée par le hook
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

  if (error) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <p className="text-red-600 mb-4">Erreur lors du chargement des bons de commande</p>
          <Button onClick={() => refetch()}>Réessayer</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Bons de commande</h1>
          <p className="text-gray-600 dark:text-gray-400">Gérez les bons de commande et leur validation</p>
        </div>
        <div className="flex space-x-2">
          <Button onClick={() => refetch()} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Actualiser
          </Button>
          <Button onClick={() => setIsCreateOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Ajouter
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Liste des bons de commande</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-4 mb-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Rechercher par numéro, vendeur..."
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setPage(1);
                  }}
                  className="pl-10"
                />
              </div>
            </div>
            <Select 
              value={statusFilter || 'all'} 
              onValueChange={(value) => { 
                setStatusFilter(value === 'all' ? '' : value); 
                setPage(1); 
              }}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Tous les statuts" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les statuts</SelectItem>
                <SelectItem value="non_valide">Non validé</SelectItem>
                <SelectItem value="valide">Validé</SelectItem>
                <SelectItem value="envoye_bc">Envoyé BC</SelectItem>
                <SelectItem value="expedie">Expédié</SelectItem>
                <SelectItem value="annule">Annulé</SelectItem>
              </SelectContent>
            </Select>
            <Select 
              value={salespersonFilter || 'all'} 
              onValueChange={(value) => { 
                setSalespersonFilter(value === 'all' ? '' : value); 
                setPage(1); 
              }}
            >
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Tous les vendeurs" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les vendeurs</SelectItem>
                {salespersons.map((sp) => (
                  <SelectItem key={sp.id} value={sp.id.toString()}>
                    {sp.firstName} {sp.lastName} ({sp.code})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
            </div>
          ) : purchaseOrders.length === 0 ? (
            <div className="text-center py-12">
              <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">Aucun bon de commande trouvé</p>
            </div>
          ) : (
            <>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Numéro</TableHead>
                      <TableHead>Vendeur</TableHead>
                      <TableHead>Date commande</TableHead>
                      <TableHead>Date validation</TableHead>
                      <TableHead>Nb lignes</TableHead>
                      <TableHead>BC Number</TableHead>
                      <TableHead>Statut</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {purchaseOrders.map((order) => (
                      <TableRow key={order.id}>
                        <TableCell className="font-medium">{order.numero}</TableCell>
                        <TableCell>{getSalespersonName(order.salespersonId)}</TableCell>
                        <TableCell>{formatDate(order.dateCommande)}</TableCell>
                        <TableCell>{formatDate(order.dateValidation)}</TableCell>
                        <TableCell>{order.lines.length}</TableCell>
                        <TableCell>{order.bcNumber || '-'}</TableCell>
                        <TableCell>
                          {(() => {
                            const combinedStatus = getCombinedStatus(order);
                            return (
                              <Pill className="text-xs">
                                <PillIndicator 
                                  variant={combinedStatus.indicatorVariant} 
                                  pulse={combinedStatus.pulse}
                                />
                                {combinedStatus.label}
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
                              <DropdownMenuItem onClick={() => openView(order)}>
                                <Eye className="h-4 w-4 mr-2" />
                                Consulter
                              </DropdownMenuItem>
                              {order.status === 'non_valide' && (
                                <>
                                  <DropdownMenuItem onClick={() => openValidate(order)}>
                                    <CheckCircle className="h-4 w-4 mr-2" />
                                    Valider
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => openDelete(order)} className="text-red-600">
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
            <DrawerTitle className="text-2xl font-bold">Détails du bon de commande</DrawerTitle>
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
                                const combinedStatus = getCombinedStatus(viewing);
                                return (
                                  <Pill className="text-sm">
                                    <PillIndicator 
                                      variant={combinedStatus.indicatorVariant} 
                                      pulse={combinedStatus.pulse}
                                    />
                                    {combinedStatus.label}
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
                          <Calendar className="h-3 w-3" />
                          Date commande
                        </Label>
                        <p className="font-medium">{formatDate(viewing.dateCommande)}</p>
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
                      {viewing.bcNumber && (
                        <div className="space-y-1">
                          <Label className="text-xs text-muted-foreground flex items-center gap-1">
                            <Building2 className="h-3 w-3" />
                            Numéro BC
                          </Label>
                          <p className="font-medium">{viewing.bcNumber}</p>
                        </div>
                      )}
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

                {/* Statut Business Central */}
                {viewing.bcId && (
                  <Card>
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg flex items-center gap-2">
                          <Building2 className="h-5 w-5" />
                          Statut Business Central
                        </CardTitle>
                        <RefreshBCStatusButton 
                          orderId={viewing.id}
                          onSuccess={async (bcStatus, bcFullyShipped, bcShipmentNumber, bcInvoiced, bcInvoiceNumber) => {
                            if (viewing) {
                              // Recharger le bon de commande complet pour obtenir les quantités reçues mises à jour
                              try {
                                const response = await api.get(`/purchase-orders/${viewing.id}`);
                                setViewing(response.data);
                              } catch (err: any) {
                                // Si le rechargement échoue, mettre à jour au moins les champs BC
                                setViewing({ ...viewing, bcStatus, bcFullyShipped, bcShipmentNumber, bcInvoiced, bcInvoiceNumber } as any);
                              }
                            }
                          }}
                        />
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label className="text-xs text-muted-foreground flex items-center gap-1">
                            <Truck className="h-3 w-3" />
                            Expédié
                          </Label>
                          <div>
                            {(viewing as any).bcFullyShipped === true ? (
                              <Pill className="text-sm">
                                <PillIndicator variant="success" pulse={true} />
                                {(viewing as any).bcShipmentNumber || 'Oui'}
                              </Pill>
                            ) : (
                              <Pill className="text-sm">
                                <PillIndicator 
                                  variant={(viewing as any).bcFullyShipped === false ? 'error' : 'info'} 
                                />
                                {(viewing as any).bcFullyShipped === false ? 'Non' : 'Non disponible'}
                              </Pill>
                            )}
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label className="text-xs text-muted-foreground flex items-center gap-1">
                            <Receipt className="h-3 w-3" />
                            Facturé
                          </Label>
                          <div>
                            {(viewing as any).bcInvoiced === true ? (
                              <Pill className="text-sm">
                                <PillIndicator variant="success" pulse={true} />
                                {(viewing as any).bcInvoiceNumber || 'Oui'}
                              </Pill>
                            ) : (
                              <Pill className="text-sm">
                                <PillIndicator 
                                  variant={(viewing as any).bcInvoiced === false ? 'error' : 'info'} 
                                />
                                {(viewing as any).bcInvoiced === false ? 'Non' : 'Non disponible'}
                              </Pill>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Lignes du bon de commande */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Package className="h-5 w-5" />
                      Lignes du bon de commande
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
                            <TableHead className="font-semibold text-right">Quantité reçue</TableHead>
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
                                <span className={Number(line.qteRecue) > 0 ? 'font-medium text-primary' : 'text-muted-foreground'}>
                                  {Number(line.qteRecue)}
                                </span>
                              </TableCell>
                            </TableRow>
                          ))}
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

      {/* Drawer de validation */}
      <Drawer open={isValidateOpen} onOpenChange={(open) => {
        setIsValidateOpen(open);
        if (!open) {
          setModifiedQuantities(new Map());
        }
      }}>
        <DrawerContent 
          side="right" 
          className="h-full flex flex-col"
          style={{ width: '50vw', maxWidth: '50vw' }}
        >
          <DrawerHeader className="border-b">
            <DrawerTitle className="text-2xl font-bold">Valider le bon de commande</DrawerTitle>
          </DrawerHeader>
          <div className="flex-1 overflow-y-auto">
            {selectedOrder && (
              <div className="p-6 space-y-6">
                <div className="text-sm text-gray-600 space-y-2">
                  <p>Bon de commande: <strong>{selectedOrder.numero}</strong></p>
                  <p>Vendeur: <strong>{getSalespersonName(selectedOrder.salespersonId)}</strong></p>
                </div>
                
                <Separator />
                
                <div>
                  <Label className="text-base font-semibold mb-3 block">
                    Produits et quantités
                  </Label>
                  <p className="text-sm text-muted-foreground mb-4">
                    Vous pouvez modifier les quantités (diminution uniquement). La quantité de référence est celle du chargement type.
                  </p>
                  <div className="border rounded-lg">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Produit</TableHead>
                          <TableHead className="text-right">Quantité référence</TableHead>
                          <TableHead className="text-right">Quantité à valider</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {selectedOrder.lines.map((line) => {
                          const originalQte = Number(line.qte);
                          const modifiedQte = modifiedQuantities.get(line.id) ?? originalQte;
                          const hasChanged = modifiedQte !== originalQte;
                          
                          return (
                            <TableRow key={line.id}>
                              <TableCell className="font-medium">
                                {line.product.bcItem?.displayName || line.product.designation}
                                {line.product.ref && (
                                  <span className="text-muted-foreground text-xs ml-2">
                                    ({line.product.ref})
                                  </span>
                                )}
                              </TableCell>
                              <TableCell className="text-right">
                                <span className="font-medium">{originalQte}</span>
                              </TableCell>
                              <TableCell className="text-right">
                                <div className="flex items-center justify-end gap-2">
                                  <Input
                                    type="number"
                                    min="0"
                                    max={originalQte}
                                    value={modifiedQte}
                                    onChange={(e) => {
                                      const newQte = parseFloat(e.target.value) || 0;
                                      handleQuantityChange(line.id, newQte, originalQte);
                                    }}
                                    className="w-24 text-right"
                                    disabled={validateMutation.isPending}
                                  />
                                  {hasChanged && (
                                    <Badge variant="outline" className="text-xs">
                                      Modifié
                                    </Badge>
                                  )}
                                </div>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              </div>
            )}
          </div>
          <DrawerFooter className="border-t">
            <div className="flex justify-end gap-2 w-full">
              <Button 
                variant="outline" 
                onClick={() => {
                  setIsValidateOpen(false);
                  setModifiedQuantities(new Map());
                }}
                disabled={validateMutation.isPending}
              >
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
            </div>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>

      {/* Drawer de création */}
      <Drawer open={isCreateOpen} onOpenChange={(open) => {
        setIsCreateOpen(open);
        if (!open) {
          setCreateSalespersonId('');
          setCreateRemarque('');
          setSelectedChargementTypeId(null);
        }
      }}>
        <DrawerContent 
          side="right" 
          className="h-full flex flex-col"
          style={{ width: '50vw', maxWidth: '50vw' }}
        >
          <DrawerHeader>
            <DrawerTitle>Ajouter un bon de commande</DrawerTitle>
          </DrawerHeader>
          <div className="flex-1 overflow-y-auto px-6 py-4">
            <div className="space-y-4">
              <div>
                <Label htmlFor="salesperson">Vendeur <span className="text-red-500">*</span></Label>
                <Select
                  value={createSalespersonId}
                  onValueChange={(value) => setCreateSalespersonId(value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner un vendeur" />
                  </SelectTrigger>
                  <SelectContent>
                    {salespersons.length === 0 ? (
                      <div className="px-2 py-1.5 text-sm text-muted-foreground">
                        Aucun vendeur trouvé pour votre magasin
                      </div>
                    ) : (
                      salespersons.map((sp) => (
                        <SelectItem key={sp.id} value={sp.id.toString()}>
                          {sp.firstName} {sp.lastName} - {sp.depotName}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="location">Magasin <span className="text-red-500">*</span></Label>
                <Select
                  value={selectedLocationId}
                  onValueChange={(value) => setSelectedLocationId(value)}
                  disabled={true}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner un magasin" />
                  </SelectTrigger>
                  <SelectContent>
                    {locations.length === 0 ? (
                      <div className="px-2 py-1.5 text-sm text-muted-foreground">
                        Aucun magasin disponible
                      </div>
                    ) : (
                      locations.map((location) => (
                        <SelectItem key={location.id} value={location.bcId}>
                          {location.displayName || location.code || `Magasin ${location.id}`}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground mt-1">
                  Le magasin est déterminé automatiquement selon le vendeur sélectionné
                </p>
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

              <div>
                <Label>Produits du chargement type <span className="text-red-500">*</span></Label>
                {isLoadingChargementType ? (
                  <div className="flex items-center gap-2 p-4 border rounded-lg">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span className="text-sm text-gray-500">Chargement du chargement type...</span>
                  </div>
                ) : chargementTypeError ? (
                  <div className="p-4 border border-red-200 rounded-lg bg-red-50">
                    <p className="text-sm text-red-600">
                      {(chargementTypeError as any)?.response?.data?.message || 'Aucun chargement type trouvé pour ce vendeur'}
                    </p>
                  </div>
                ) : !chargementType ? (
                  <div className="p-4 border rounded-lg bg-gray-50">
                    <p className="text-sm text-gray-500">
                      Veuillez sélectionner un vendeur pour charger son chargement type
                    </p>
                  </div>
                ) : chargementType.products.length === 0 ? (
                  <div className="p-4 border rounded-lg bg-yellow-50">
                    <p className="text-sm text-yellow-600">
                      Le chargement type de ce vendeur ne contient aucun produit
                    </p>
                  </div>
                ) : (
                  <>
                    {hasExistingNonValideOrder && (
                      <div className="mb-4 p-4 border border-yellow-200 rounded-lg bg-yellow-50">
                        <p className="text-sm text-yellow-800 font-medium mb-1">
                          ⚠️ Un bon de commande pas encore envoyé à BC existe déjà pour ce chargement type
                        </p>
                        <p className="text-sm text-yellow-700">
                          {(() => {
                            const existingOrder = existingPurchaseOrder?.data.find(order => order.status === 'non_valide' || order.status === 'valide');
                            return existingOrder ? (
                              <>
                                Numéro: <strong>{existingOrder.numero}</strong> - 
                                Statut: <strong>{statusLabels[existingOrder.status]?.label || existingOrder.status}</strong>
                              </>
                            ) : null;
                          })()}
                        </p>
                      </div>
                    )}
                    <div className="mt-2 border rounded-lg">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Produit</TableHead>
                            <TableHead className="text-right">Chargement type</TableHead>
                            <TableHead className="text-right">Qte en stock</TableHead>
                            <TableHead className="text-right">Quantité à charger</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {chargementType.products.map((product, index) => {
                            const chargementTypeQte = Number(product.qte);
                            // product.productId est déjà le bcId (string)
                            const stockActuel = product.productId 
                              ? (stockByBcItemId.get(product.productId) || 0)
                              : 0;
                            const qteToCharge = Math.max(0, chargementTypeQte - stockActuel);
                            
                            // Récupérer le stock du magasin BC de l'utilisateur
                            const stockUserLocation = product.productId
                              ? (stockByBcItemIdUserLocation.get(product.productId) ?? null)
                              : null;
                            
                            // Vérifier si la requête est en cours de chargement
                            const isLoadingStock = stockQueries[index]?.isLoading ?? false;
                            
                            return (
                              <TableRow key={index}>
                                <TableCell>
                                  {product.bcItem?.number ? `${product.bcItem.number} - ` : ''}
                                  {product.bcItem?.displayName || 'Produit inconnu'}
                                </TableCell>
                                <TableCell className="text-right font-medium">
                                  {chargementTypeQte}
                                </TableCell>
                                <TableCell className="text-right">
                                  {isLoadingStock ? (
                                    <Loader2 className="h-4 w-4 animate-spin inline-block" />
                                  ) : stockUserLocation !== null ? (
                                    <span className="font-medium">{stockUserLocation}</span>
                                  ) : (
                                    <span className="text-muted-foreground">-</span>
                                  )}
                                </TableCell>
                                <TableCell className="text-right font-medium">
                                  <span className={qteToCharge > 0 ? 'text-primary font-semibold' : 'text-muted-foreground'}>
                                    {qteToCharge}
                                  </span>
                                </TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                      <div className="p-3 bg-blue-50 border-t">
                        <div className="flex justify-between text-sm">
                          <span className="font-medium text-blue-900">Total produits:</span>
                          <span className="font-medium text-blue-900">{chargementType.products.length}</span>
                        </div>
                        <div className="flex justify-between text-sm mt-1">
                          <span className="font-medium text-blue-900">Quantité totale à charger:</span>
                          <span className="font-medium text-blue-900">
                            {chargementType.products.reduce((sum, p) => {
                              const chargementTypeQte = Number(p.qte);
                              // p.productId est déjà le bcId (string)
                              const stockActuel = p.productId 
                                ? (stockByBcItemId.get(p.productId) || 0)
                                : 0;
                              const qteToCharge = Math.max(0, chargementTypeQte - stockActuel);
                              return sum + qteToCharge;
                            }, 0)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </>
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
              disabled={createMutation.isPending || !createSalespersonId || !chargementType || !selectedLocationId || isLoadingChargementType || hasExistingNonValideOrder}
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

      {/* Dialog de suppression */}
      <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Supprimer le bon de commande</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-gray-600">
            Êtes-vous sûr de vouloir supprimer le bon de commande <strong>{selectedOrder?.numero}</strong> ?
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

