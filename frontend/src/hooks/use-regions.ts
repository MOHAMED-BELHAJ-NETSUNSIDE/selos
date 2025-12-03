import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import api from '@/lib/api';

export interface Region {
  id: number;
  nom: string;
}

export function useRegions() {
  return useQuery<Region[]>({
    queryKey: ['regions'],
    queryFn: async () => (await api.get('/regions')).data,
  });
}

export function useCreateRegion() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: { nom: string }) => (await api.post('/regions', data)).data,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['regions'] });
      toast.success('Région créée avec succès');
    },
    onError: () => {
      toast.error('Erreur lors de la création de la région');
    },
  });
}

export function useUpdateRegion() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data: { nom?: string } }) => (await api.patch(`/regions/${id}`, data)).data,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['regions'] });
      toast.success('Région modifiée avec succès');
    },
    onError: () => {
      toast.error('Erreur lors de la modification de la région');
    },
  });
}

export function useDeleteRegion() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => (await api.delete(`/regions/${id}`)).data,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['regions'] });
      toast.success('Région supprimée avec succès');
    },
    onError: () => {
      toast.error('Erreur lors de la suppression de la région');
    },
  });
}


