import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import api from '@/lib/api';

export interface Gouvernorat {
  id: number;
  nom: string;
}

export function useGouvernorats() {
  return useQuery<Gouvernorat[]>({
    queryKey: ['gouvernorats'],
    queryFn: async () => (await api.get('/gouvernorats')).data,
  });
}

export function useCreateGouvernorat() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: { nom: string }) => (await api.post('/gouvernorats', data)).data,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['gouvernorats'] });
      toast.success('Gouvernorat créé avec succès');
    },
    onError: () => {
      toast.error('Erreur lors de la création du gouvernorat');
    },
  });
}

export function useUpdateGouvernorat() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data: { nom?: string } }) => (await api.patch(`/gouvernorats/${id}`, data)).data,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['gouvernorats'] });
      toast.success('Gouvernorat modifié avec succès');
    },
    onError: () => {
      toast.error('Erreur lors de la modification du gouvernorat');
    },
  });
}

export function useDeleteGouvernorat() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => (await api.delete(`/gouvernorats/${id}`)).data,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['gouvernorats'] });
      toast.success('Gouvernorat supprimé avec succès');
    },
    onError: () => {
      toast.error('Erreur lors de la suppression du gouvernorat');
    },
  });
}


