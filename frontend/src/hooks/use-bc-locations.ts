import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { toast } from 'sonner';

export interface BCLocation {
  id: number;
  bcId: string;
  code?: string | null;
  displayName?: string | null;
  address?: string | null;
  address2?: string | null;
  city?: string | null;
  state?: string | null;
  country?: string | null;
  postalCode?: string | null;
  phoneNumber?: string | null;
  email?: string | null;
  contact?: string | null;
  useAsInTransit?: boolean | null;
  requireShipment?: boolean | null;
  requireReceive?: boolean | null;
  requirePutAway?: boolean | null;
  requirePick?: boolean | null;
  lastModified?: string | null;
  etag?: string | null;
  rawJson?: any;
  createdAt: string;
  updatedAt: string;
}

export interface BCLocationsQuery {
  page?: number;
  limit?: number;
  search?: string;
}

export interface BCLocationsResponse {
  success: boolean;
  data: BCLocation[];
  count: number;
}

export function useBCLocations(query: BCLocationsQuery = {}) {
  return useQuery<BCLocationsResponse>({
    queryKey: ['bc-locations', query],
    queryFn: async (): Promise<BCLocationsResponse> => {
      const params = new URLSearchParams();
      if (query.search) params.append('search', query.search);
      
      const response = await api.get(`/bc-locations?${params.toString()}`);
      return response.data;
    },
  });
}

export function useBCLocation(id: number | null) {
  return useQuery<BCLocation>({
    queryKey: ['bc-location', id],
    queryFn: async (): Promise<BCLocation> => {
      const response = await api.get(`/bc-locations/${id}`);
      return response.data;
    },
    enabled: !!id,
  });
}

export function useSyncBCLocations() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      // Appeler l'API route frontend qui gère la synchronisation BC
      const response = await fetch('/api/sync/locations', {
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
      queryClient.invalidateQueries({ queryKey: ['bc-locations'] });
      toast.success(`Synchronisation réussie: ${data.count} magasins synchronisés`);
    },
    onError: (error: any) => {
      const errorMessage = error?.message || 'Erreur lors de la synchronisation';
      toast.error(errorMessage);
    },
  });
}

