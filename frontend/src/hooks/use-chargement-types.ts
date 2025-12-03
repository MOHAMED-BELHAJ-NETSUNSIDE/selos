import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import api from '@/lib/api';

export interface ChargementTypeProduct {
  id: number;
  productId: string; // bcId de BCItem
  qte: number;
  bcItem?: {
    id: number;
    bcId: string;
    number: string | null;
    displayName: string | null;
  } | null;
}

export interface ChargementType {
  id: number;
  salespersonId: number;
  name: string | null;
  createdAt: string;
  updatedAt: string;
  salesperson?: {
    id: number;
    firstName: string;
    lastName: string;
    depotName: string;
  };
  products: ChargementTypeProduct[];
}

export interface CreateChargementTypeDto {
  salespersonId: number;
  name?: string;
  products: Array<{ productId: string; qte: number }>; // productId est maintenant bcId (string)
}

export function useChargementTypes() {
  return useQuery<ChargementType[]>({
    queryKey: ['chargement-types'],
    queryFn: async () => (await api.get('/chargement-types')).data,
  });
}

export function useChargementType(id: number | null) {
  return useQuery<ChargementType>({
    queryKey: ['chargement-types', id],
    queryFn: async () => (await api.get(`/chargement-types/${id}`)).data,
    enabled: !!id,
  });
}

export function useChargementTypeBySalesperson(salespersonId: number | null) {
  return useQuery<ChargementType>({
    queryKey: ['chargement-types', 'by-salesperson', salespersonId],
    queryFn: async () => (await api.get(`/chargement-types/by-salesperson/${salespersonId}`)).data,
    enabled: !!salespersonId,
    retry: false, // Ne pas réessayer si 404 (pas de chargement type)
  });
}

export function useCreateChargementType() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: CreateChargementTypeDto) =>
      (await api.post('/chargement-types', data)).data,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['chargement-types'] });
      toast.success('Chargement type créé avec succès');
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Erreur lors de la création du chargement type');
    },
  });
}

export function useUpdateChargementType() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<CreateChargementTypeDto> }) =>
      (await api.patch(`/chargement-types/${id}`, data)).data,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['chargement-types'] });
      toast.success('Chargement type modifié avec succès');
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Erreur lors de la modification du chargement type');
    },
  });
}

export function useDeleteChargementType() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => (await api.delete(`/chargement-types/${id}`)).data,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['chargement-types'] });
      toast.success('Chargement type supprimé avec succès');
    },
    onError: () => {
      toast.error('Erreur lors de la suppression du chargement type');
    },
  });
}

export function useDuplicateChargementType() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, salespersonId }: { id: number; salespersonId: number }) =>
      (await api.post(`/chargement-types/${id}/duplicate`, { salespersonId })).data,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['chargement-types'] });
      toast.success('Chargement type dupliqué avec succès');
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Erreur lors de la duplication du chargement type');
    },
  });
}

export interface AvailableProduct {
  id: number;
  number: string | null;
  displayName: string | null;
  bcId: string;
}

export function useAvailableProducts() {
  return useQuery<AvailableProduct[]>({
    queryKey: ['chargement-types', 'products', 'available'],
    queryFn: async () => (await api.get('/chargement-types/products/available')).data,
  });
}

