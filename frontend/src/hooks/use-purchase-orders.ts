import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import api from '@/lib/api';

export interface PurchaseOrderLine {
  id: number;
  productId: number;
  qte: number;
  qteRecue: number;
  product: {
    id: number;
    designation: string;
    ref: string | null;
    bcItem?: {
      id: number;
      bcId: string;
      number: string | null;
      displayName: string | null;
      baseUnitOfMeasure: string | null;
    } | null;
  };
}

export interface PurchaseOrder {
  id: number;
  numero: string;
  salespersonId: number;
  chargementTypeId: number | null;
  status: 'non_valide' | 'valide' | 'envoye_bc' | 'expedie' | 'annule';
  dateCommande: string;
  dateValidation: string | null;
  dateEnvoiBC: string | null;
  remarque: string | null;
  bcId: string | null;
  bcNumber: string | null;
  bcEtag: string | null;
  bcStatus: string | null;
  bcFullyShipped: boolean | null;
  bcShipmentNumber: string | null;
  bcInvoiced: boolean | null;
  bcInvoiceNumber: string | null;
  salesperson: {
    id: number;
    code: string;
    firstName: string | null;
    lastName: string | null;
    depotName: string | null;
  };
  chargementType: {
    id: number;
    name: string | null;
  } | null;
  lines: PurchaseOrderLine[];
  createdBy: {
    id: string;
    email: string;
    firstName: string | null;
    lastName: string | null;
  };
  validatedBy: {
    id: string;
    email: string;
    firstName: string | null;
    lastName: string | null;
  } | null;
  purchaseInvoice?: {
    id: number;
    numero: string;
    status: string;
  } | null;
}

export interface PurchaseOrderListResponse {
  data: PurchaseOrder[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export interface QueryPurchaseOrderDto {
  page?: number;
  limit?: number;
  search?: string;
  status?: 'non_valide' | 'valide' | 'envoye_bc' | 'expedie' | 'annule';
  salespersonId?: number;
  chargementTypeId?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface ValidatePurchaseOrderLineDto {
  lineId: number;
  qte: number;
}

export interface ValidatePurchaseOrderDto {
  clientNumber?: string;
  dateReception?: string;
  currency?: string;
  lines?: ValidatePurchaseOrderLineDto[];
}

export function usePurchaseOrders(query?: QueryPurchaseOrderDto) {
  return useQuery<PurchaseOrderListResponse>({
    queryKey: ['purchase-orders', query],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (query?.page) params.append('page', query.page.toString());
      if (query?.limit) params.append('limit', query.limit.toString());
      if (query?.search) params.append('search', query.search);
      if (query?.status) params.append('status', query.status);
      if (query?.salespersonId) params.append('salespersonId', query.salespersonId.toString());
      if (query?.chargementTypeId) params.append('chargementTypeId', query.chargementTypeId.toString());
      if (query?.sortBy) params.append('sortBy', query.sortBy);
      if (query?.sortOrder) params.append('sortOrder', query.sortOrder);
      
      const queryString = params.toString();
      const url = `/purchase-orders${queryString ? `?${queryString}` : ''}`;
      return (await api.get(url)).data;
    },
  });
}

export function usePurchaseOrder(id: number | null) {
  return useQuery<PurchaseOrder>({
    queryKey: ['purchase-orders', id],
    queryFn: async () => (await api.get(`/purchase-orders/${id}`)).data,
    enabled: !!id,
  });
}

export function useCreatePurchaseOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: { salespersonId: number; chargementTypeId?: number; remarque?: string; lines?: Array<{ productId: number; qte: number }> }) =>
      (await api.post('/purchase-orders', data)).data,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['purchase-orders'] });
      toast.success('Bon de commande créé avec succès');
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Erreur lors de la création du bon de commande');
    },
  });
}

export function useCreatePurchaseOrderFromChargementType() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ chargementTypeId, locationId }: { chargementTypeId: number; locationId?: string | null }) =>
      (await api.post(`/purchase-orders/from-chargement-type/${chargementTypeId}`, { locationId })).data,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['purchase-orders'] });
      qc.invalidateQueries({ queryKey: ['chargement-types'] });
      toast.success('Bon de commande créé depuis le chargement type avec succès');
    },
    onError: (error: any) => {
      const status = error?.response?.status;
      const message = error?.response?.data?.message || error?.message;
      
      if (status === 409) {
        toast.error('Un bon de commande existe déjà pour ce chargement type');
      } else if (status === 400) {
        toast.error(message || 'Le chargement type ne contient aucun produit');
      } else if (status === 404) {
        toast.error(message || 'Chargement type ou produits non trouvés');
      } else {
        toast.error(message || 'Erreur lors de la création du bon de commande');
      }
    },
  });
}

export function useUpdatePurchaseOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data: { remarque?: string } }) =>
      (await api.patch(`/purchase-orders/${id}`, data)).data,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['purchase-orders'] });
      toast.success('Bon de commande modifié avec succès');
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Erreur lors de la modification du bon de commande');
    },
  });
}

export function useValidatePurchaseOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data: ValidatePurchaseOrderDto }) =>
      (await api.post(`/purchase-orders/${id}/validate`, data)).data,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['purchase-orders'] });
      qc.invalidateQueries({ queryKey: ['stock'] });
      toast.success('Bon de commande validé avec succès');
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Erreur lors de la validation du bon de commande');
    },
  });
}

export function useMarkAsExpedie() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) =>
      (await api.post(`/purchase-orders/${id}/mark-as-expedie`)).data,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['purchase-orders'] });
      qc.invalidateQueries({ queryKey: ['stock'] });
      toast.success('Bon de commande marqué comme expédié - Stock alimenté');
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Erreur lors du marquage comme expédié');
    },
  });
}

export function useCancelPurchaseOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) =>
      (await api.post(`/purchase-orders/${id}/cancel`)).data,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['purchase-orders'] });
      toast.success('Bon de commande annulé avec succès');
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Erreur lors de l\'annulation du bon de commande');
    },
  });
}

export function useDeletePurchaseOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) =>
      (await api.delete(`/purchase-orders/${id}`)).data,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['purchase-orders'] });
      toast.success('Bon de commande supprimé avec succès');
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Erreur lors de la suppression du bon de commande');
    },
  });
}

export interface AvailableProduct {
  id: number;
  designation: string;
  ref: string | null;
  bcItem: {
    id: number;
    bcId: string;
    number: string | null;
    displayName: string | null;
    baseUnitOfMeasure: string | null;
  } | null;
}

export function useAvailableProducts() {
  return useQuery<AvailableProduct[]>({
    queryKey: ['purchase-orders', 'products', 'available'],
    queryFn: async () => (await api.get('/purchase-orders/products/available')).data,
  });
}

export function useRefreshBCStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) =>
      (await api.get(`/purchase-orders/${id}/bc-status`)).data,
    onSuccess: (data, id) => {
      qc.invalidateQueries({ queryKey: ['purchase-orders', id] });
      qc.invalidateQueries({ queryKey: ['purchase-orders'] });
      const expedieText = data.bcFullyShipped && data.bcShipmentNumber 
        ? data.bcShipmentNumber 
        : data.bcFullyShipped ? 'Oui' : 'Non';
      const factureText = data.bcInvoiced && data.bcInvoiceNumber 
        ? data.bcInvoiceNumber 
        : data.bcInvoiced ? 'Oui' : 'Non';
      const qtyText = data.bcFullyShipped ? ' - Quantités reçues mises à jour' : '';
      toast.success(`Statut BC actualisé: ${data.bcStatus || 'N/A'} - Expédié: ${expedieText} - Facturé: ${factureText}${qtyText}`);
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Erreur lors de l\'actualisation du statut BC');
    },
  });
}

