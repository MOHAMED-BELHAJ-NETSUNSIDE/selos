import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { SousRegion } from '@/hooks/use-sous-regions';

export function useRegionSousRegions(regionId: number | null) {
  return useQuery<SousRegion[]>({
    queryKey: ['region-sous-regions', regionId],
    queryFn: async () => (await api.get(`/regions/${regionId}/sous-regions`)).data,
    enabled: !!regionId,
  });
}

export function useAddRegionSousRegion(regionId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (sousRegionId: number) => (await api.post(`/regions/${regionId}/sous-regions/${sousRegionId}`)).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['region-sous-regions', regionId] }),
  });
}

export function useRemoveRegionSousRegion(regionId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (sousRegionId: number) => (await api.delete(`/regions/${regionId}/sous-regions/${sousRegionId}`)).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['region-sous-regions', regionId] }),
  });
}


