import { useQuery, useQueries, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import api from '@/lib/api';

export interface Localite {
  id: number;
  nom: string;
  idDelegation?: number;
  delegation?: { id: number; nom: string; id_gouvernorat: number; gouvernorat?: { id: number; nom: string } };
}

export interface LocalitesResponse {
  data: Localite[];
  total: number;
  limit: number;
  offset: number;
  hasMore: boolean;
}

export function useLocalites(options?: { enabled?: boolean }) {
  // Charger d'abord les 100 premières localités
  const firstPageQuery = useQuery<LocalitesResponse>({
    queryKey: ['localites', 'first', 100],
    queryFn: async () => {
      const response = await api.get('/localites', { params: { limit: 100, offset: 0 } });
      return response.data;
    },
    enabled: options?.enabled !== false,
    placeholderData: (previousData) => previousData,
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnMount: true,
  });

  const total = firstPageQuery.data?.total || 0;
  const remainingCount = Math.max(0, total - 100);
  const chunksNeeded = Math.ceil(remainingCount / 1000); // Chunks de 1000 max

  // Charger le reste par chunks de 1000 maximum avec useQueries
  const remainingQueries = useQueries({
    queries: Array.from({ length: chunksNeeded }, (_, i) => {
      const offset = 100 + (i * 1000);
      const limit = Math.min(1000, remainingCount - (i * 1000));
      
      return {
        queryKey: ['localites', 'remaining', offset, limit],
        queryFn: async (): Promise<LocalitesResponse> => {
          if (limit <= 0) {
            return { data: [], total: 0, limit: 0, offset, hasMore: false };
          }
          const response = await api.get('/localites', { params: { limit, offset } });
          return response.data;
        },
        enabled: options?.enabled !== false && !!firstPageQuery.data && remainingCount > 0 && limit > 0,
        placeholderData: (previousData: LocalitesResponse | undefined) => previousData,
        staleTime: 5 * 60 * 1000,
      };
    }),
  });

  // Combiner toutes les données
  const allLocalites = firstPageQuery.data?.data || [];
  const remainingLocalites = remainingQueries.flatMap(query => query.data?.data || []);
  const combinedData = [...allLocalites, ...remainingLocalites];

  const isLoading = firstPageQuery.isLoading || remainingQueries.some(q => q.isLoading && !q.data);
  const isFetching = firstPageQuery.isFetching || remainingQueries.some(q => q.isFetching);
  const error = firstPageQuery.error || remainingQueries.find(q => q.error)?.error;

  return {
    data: combinedData,
    isLoading,
    isFetching,
    error,
    refetch: async () => {
      await Promise.all([
        firstPageQuery.refetch(),
        ...remainingQueries.map(q => q.refetch())
      ]);
    },
  };
}

export function useCreateLocalite() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: { nom: string; idDelegation: number }) => (await api.post('/localites', data)).data,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['localites'] });
      toast.success('Localité créée avec succès');
    },
    onError: () => {
      toast.error('Erreur lors de la création de la localité');
    },
  });
}

export function useUpdateLocalite() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data: { nom?: string; idDelegation?: number } }) => (await api.patch(`/localites/${id}`, data)).data,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['localites'] });
      toast.success('Localité modifiée avec succès');
    },
    onError: () => {
      toast.error('Erreur lors de la modification de la localité');
    },
  });
}

export function useDeleteLocalite() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => (await api.delete(`/localites/${id}`)).data,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['localites'] });
      toast.success('Localité supprimée avec succès');
    },
    onError: () => {
      toast.error('Erreur lors de la suppression de la localité');
    },
  });
}


