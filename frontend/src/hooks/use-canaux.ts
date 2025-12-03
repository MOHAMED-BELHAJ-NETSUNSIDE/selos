import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import api from '@/lib/api';

export interface Canal {
  id: number;
  nom: string;
}

export function useCanaux() {
  return useQuery<Canal[]>({
    queryKey: ['canaux'],
    queryFn: async () => (await api.get('/canals')).data,
  });
}

export function useCreateCanal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: { nom: string }) => (await api.post('/canals', data)).data,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['canaux'] });
      toast.success('Canal créé avec succès');
    },
    onError: () => {
      toast.error('Erreur lors de la création du canal');
    },
  });
}

export function useUpdateCanal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data: { nom?: string } }) => (await api.patch(`/canals/${id}`, data)).data,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['canaux'] });
      toast.success('Canal modifié avec succès');
    },
    onError: () => {
      toast.error('Erreur lors de la modification du canal');
    },
  });
}

export function useDeleteCanal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => (await api.delete(`/canals/${id}`)).data,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['canaux'] });
      toast.success('Canal supprimé avec succès');
    },
    onError: () => {
      toast.error('Erreur lors de la suppression du canal');
    },
  });
}


