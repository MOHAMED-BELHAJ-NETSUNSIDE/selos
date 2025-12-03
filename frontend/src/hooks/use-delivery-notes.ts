import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import api from '@/lib/api';

export interface DeliveryNoteLine {
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

export interface DeliveryNote {
  id: number;
  numero: string;
  salespersonId: number;
  clientId: number;
  status: 'cree' | 'valide' | 'annule';
  dateLivraison: string;
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
  lines: DeliveryNoteLine[];
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
}

export interface DeliveryNoteListResponse {
  data: DeliveryNote[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export interface QueryDeliveryNoteDto {
  page?: number;
  limit?: number;
  search?: string;
  status?: 'cree' | 'valide' | 'annule';
  salespersonId?: number;
  clientId?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface ValidateDeliveryNoteDto {
  comment?: string;
}

export function useDeliveryNotes(query?: QueryDeliveryNoteDto) {
  return useQuery<DeliveryNoteListResponse>({
    queryKey: ['delivery-notes', query],
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
      const url = `/delivery-notes${queryString ? `?${queryString}` : ''}`;
      return (await api.get(url)).data;
    },
  });
}

export function useDeliveryNote(id: number | null) {
  return useQuery<DeliveryNote>({
    queryKey: ['delivery-notes', id],
    queryFn: async () => (await api.get(`/delivery-notes/${id}`)).data,
    enabled: !!id,
  });
}

export function useCreateDeliveryNote() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: { 
      salespersonId: number; 
      clientId: number; 
      remarque?: string; 
      lines: Array<{ productId: number; qte: number; prixUnitaire: number }> 
    }) =>
      (await api.post('/delivery-notes', data)).data,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['delivery-notes'] });
      toast.success('Bon de livraison créé avec succès');
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Erreur lors de la création du bon de livraison');
    },
  });
}

export function useUpdateDeliveryNote() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { 
      id: number; 
      data: { 
        remarque?: string; 
        lines?: Array<{ productId: number; qte: number; prixUnitaire: number }> 
      } 
    }) =>
      (await api.patch(`/delivery-notes/${id}`, data)).data,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['delivery-notes'] });
      toast.success('Bon de livraison modifié avec succès');
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Erreur lors de la modification du bon de livraison');
    },
  });
}

export function useValidateDeliveryNote() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data: ValidateDeliveryNoteDto }) =>
      (await api.post(`/delivery-notes/${id}/validate`, data)).data,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['delivery-notes'] });
      qc.invalidateQueries({ queryKey: ['stock'] });
      toast.success('Bon de livraison validé avec succès - Stock décrémenté');
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Erreur lors de la validation du bon de livraison');
    },
  });
}

export function useDeleteDeliveryNote() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) =>
      (await api.delete(`/delivery-notes/${id}`)).data,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['delivery-notes'] });
      toast.success('Bon de livraison supprimé avec succès');
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Erreur lors de la suppression du bon de livraison');
    },
  });
}

