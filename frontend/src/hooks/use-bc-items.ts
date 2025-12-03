import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { toast } from 'sonner';

export interface BCItem {
  id: number;
  bcId: string;
  number?: string | null;
  displayName?: string | null;
  type?: string | null;
  itemCategoryCode?: string | null;
  itemCategoryId?: string | null;
  baseUnitOfMeasure?: string | null;
  unitPrice?: number | null;
  unitCost?: number | null;
  inventory?: number | null;
  blocked?: boolean | null;
  gtin?: string | null;
  lastModified?: string | null;
  etag?: string | null;
  rawJson?: any;
  createdAt: string;
  updatedAt: string;
}

export interface BCItemsQuery {
  page?: number;
  limit?: number;
  search?: string;
}

export interface BCItemsResponse {
  success: boolean;
  data: BCItem[];
  count: number;
}

export function useBCItems(query: BCItemsQuery = {}) {
  return useQuery<BCItemsResponse>({
    queryKey: ['bc-items', query],
    queryFn: async (): Promise<BCItemsResponse> => {
      const params = new URLSearchParams();
      if (query.search) params.append('search', query.search);
      // Note: page et limit ne sont pas encore supportés par le backend
      // Le backend retourne déjà tous les articles sans pagination
      
      const response = await api.get(`/bc-items?${params.toString()}`);
      return response.data;
    },
  });
}

export function useBCItem(id: number | null) {
  return useQuery<BCItem>({
    queryKey: ['bc-item', id],
    queryFn: async (): Promise<BCItem> => {
      const response = await api.get(`/bc-items/${id}`);
      return response.data;
    },
    enabled: !!id,
  });
}

export function useSyncBCItems() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      // Appeler l'API route frontend qui gère la synchronisation BC
      // Utiliser une URL relative qui fonctionne automatiquement dans le navigateur
      const response = await fetch('/api/sync/items', {
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
      queryClient.invalidateQueries({ queryKey: ['bc-items'] });
      const priceCount = data.priceCount || 0;
      if (priceCount > 0) {
        toast.success(`Synchronisation réussie: ${data.count} articles et ${priceCount} prix synchronisés`);
      } else {
        toast.success(`Synchronisation réussie: ${data.count} articles synchronisés`);
      }
    },
    onError: (error: any) => {
      const errorMessage = error?.message || 'Erreur lors de la synchronisation';
      toast.error(errorMessage);
    },
  });
}

