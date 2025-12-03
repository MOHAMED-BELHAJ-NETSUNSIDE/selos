import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import api from '@/lib/api';

export interface SaleLine {
  id: number;
  productId: number;
  qte: number;
  prixUnitaire: number;
  montant: number;
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

export interface Sale {
  id: number;
  numero: string;
  salespersonId: number;
  clientId: number;
  status: 'cree' | 'valide' | 'annule';
  dateVente: string;
  dateValidation: string | null;
  remarque: string | null;
  montantTotal: number;
  montantHT: number | null;
  montantTTC: number | null;
  montantTVA: number | null;
  salesperson: {
    id: number;
    code: string;
    firstName: string | null;
    lastName: string | null;
    depotName: string | null;
  };
  client: {
    id: number;
    code: string;
    nom: string;
    nomCommercial: string | null;
    adresse: string | null;
    numeroTelephone: string | null;
  };
  lines: SaleLine[];
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
  deliveryNoteId: number | null;
  deliveryNote: {
    id: number;
    numero: string;
  } | null;
}

export interface SaleListResponse {
  data: Sale[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export interface QuerySaleDto {
  page?: number;
  limit?: number;
  search?: string;
  status?: 'cree' | 'valide' | 'annule';
  salespersonId?: number;
  clientId?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface ValidateSaleDto {
  comment?: string;
}

export function useSales(query?: QuerySaleDto) {
  return useQuery<SaleListResponse>({
    queryKey: ['sales', query],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (query?.page) params.append('page', query.page.toString());
      if (query?.limit) params.append('limit', query.limit.toString());
      if (query?.search) params.append('search', query.search);
      if (query?.status) params.append('status', query.status);
      if (query?.salespersonId) params.append('salespersonId', query.salespersonId.toString());
      if (query?.clientId) params.append('clientId', query.clientId.toString());
      if (query?.sortBy) params.append('sortBy', query.sortBy);
      if (query?.sortOrder) params.append('sortOrder', query.sortOrder);
      
      const queryString = params.toString();
      const url = `/sales${queryString ? `?${queryString}` : ''}`;
      return (await api.get(url)).data;
    },
  });
}

export function useSale(id: number | null) {
  return useQuery<Sale>({
    queryKey: ['sales', id],
    queryFn: async () => (await api.get(`/sales/${id}`)).data,
    enabled: !!id,
  });
}

export function useCreateSale() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: { 
      salespersonId: number; 
      clientId: number; 
      remarque?: string; 
      lines: Array<{ productId: number; qte: number; prixUnitaire: number }> 
    }) =>
      (await api.post('/sales', data)).data,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['sales'] });
      toast.success('Vente créée avec succès');
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Erreur lors de la création de la vente');
    },
  });
}

export function useUpdateSale() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { 
      id: number; 
      data: { 
        salespersonId?: number;
        clientId?: number;
        remarque?: string; 
        lines?: Array<{ productId: number; qte: number; prixUnitaire: number }> 
      } 
    }) =>
      (await api.patch(`/sales/${id}`, data)).data,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['sales'] });
      toast.success('Vente modifiée avec succès');
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Erreur lors de la modification de la vente');
    },
  });
}

export function useValidateSale() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data: ValidateSaleDto }) =>
      (await api.post(`/sales/${id}/validate`, data)).data,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['sales'] });
      qc.invalidateQueries({ queryKey: ['stock'] });
      toast.success('Vente validée avec succès - Stock décrémenté');
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Erreur lors de la validation de la vente');
    },
  });
}

export function useDeleteSale() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) =>
      (await api.delete(`/sales/${id}`)).data,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['sales'] });
      toast.success('Vente supprimée avec succès');
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Erreur lors de la suppression de la vente');
    },
  });
}

