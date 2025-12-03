import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { toast } from 'sonner';

export interface BCCustomer {
  id: number;
  bcId: string;
  number?: string | null;
  displayName?: string | null;
  type?: string | null;
  blocked?: boolean | null;
  phoneNumber?: string | null;
  email?: string | null;
  currencyCode?: string | null;
  taxRegistrationNumber?: string | null;
  addressStreet?: string | null;
  addressCity?: string | null;
  addressState?: string | null;
  addressCountry?: string | null;
  addressPostalCode?: string | null;
  lastModified?: string | null;
  etag?: string | null;
  rawJson?: any;
  localCanalId?: number | null;
  localTypeVenteId?: number | null;
  localCanal?: {
    id: number;
    nom: string;
  } | null;
  localTypeVente?: {
    id: number;
    nom: string;
  } | null;
  createdAt: string;
  updatedAt: string;
}

export interface BCCustomersQuery {
  page?: number;
  limit?: number;
  search?: string;
}

export interface BCCustomersResponse {
  success: boolean;
  data: BCCustomer[];
  count: number;
}

export function useBCCustomers(query: BCCustomersQuery = {}) {
  return useQuery<BCCustomersResponse>({
    queryKey: ['bc-customers', query],
    queryFn: async (): Promise<BCCustomersResponse> => {
      const params = new URLSearchParams();
      if (query.search) params.append('search', query.search);
      
      const response = await api.get(`/bc-customers?${params.toString()}`);
      return response.data;
    },
  });
}

export function useBCCustomer(id: number | null) {
  return useQuery<BCCustomer>({
    queryKey: ['bc-customer', id],
    queryFn: async (): Promise<BCCustomer> => {
      const response = await api.get(`/bc-customers/${id}`);
      return response.data;
    },
    enabled: !!id,
  });
}

export function useSyncBCCustomers() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      // Appeler l'API route frontend qui gère la synchronisation BC
      // Utiliser une URL relative qui fonctionne automatiquement dans le navigateur
      const response = await fetch('/api/sync/customers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Erreur HTTP: ${response.status}`);
      }
      
      const result = await response.json();
      if (!result.success) {
        throw new Error(result.error || 'Erreur de synchronisation');
      }
      return result;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['bc-customers'] });
      toast.success(`Synchronisation réussie: ${data.count} clients synchronisés`);
    },
    onError: (error: any) => {
      const errorMessage = error?.message || 'Erreur lors de la synchronisation';
      toast.error(errorMessage);
    },
  });
}

export interface UpdateLocalFieldsData {
  localCanalId?: number | null;
  localTypeVenteId?: number | null;
}

export function useUpdateBCCustomerLocalFields() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data: UpdateLocalFieldsData }) => {
      const response = await api.patch(`/bc-customers/${id}/local`, data);
      return response.data;
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['bc-customer', id] });
      queryClient.invalidateQueries({ queryKey: ['bc-customers'] });
      toast.success('Champs locaux mis à jour avec succès');
    },
    onError: (error: any) => {
      const errorMessage = error?.response?.data?.message || error?.message || 'Erreur lors de la mise à jour';
      toast.error(errorMessage);
    },
  });
}

