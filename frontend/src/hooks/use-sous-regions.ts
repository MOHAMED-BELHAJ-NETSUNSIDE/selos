import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import api from '@/lib/api';

export interface SousRegion {
  id: number;
  nom: string;
}

export function useSousRegions() {
  return useQuery<SousRegion[]>({
    queryKey: ['sous-regions'],
    queryFn: async () => (await api.get('/sous-regions')).data,
  });
}

export function useCreateSousRegion() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: { nom: string }) => (await api.post('/sous-regions', data)).data,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['sous-regions'] });
      toast.success('Sous-région créée avec succès');
    },
    onError: () => {
      toast.error('Erreur lors de la création de la sous-région');
    },
  });
}

export function useUpdateSousRegion() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data: { nom?: string } }) => (await api.patch(`/sous-regions/${id}`, data)).data,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['sous-regions'] });
      toast.success('Sous-région modifiée avec succès');
    },
    onError: () => {
      toast.error('Erreur lors de la modification de la sous-région');
    },
  });
}

export function useDeleteSousRegion() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => (await api.delete(`/sous-regions/${id}`)).data,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['sous-regions'] });
      toast.success('Sous-région supprimée avec succès');
    },
    onError: () => {
      toast.error('Erreur lors de la suppression de la sous-région');
    },
  });
}


