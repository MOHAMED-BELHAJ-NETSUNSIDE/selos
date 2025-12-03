import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import api from '@/lib/api';

export interface Secteur {
  id: number;
  nom: string;
  secteurCanals?: {
    canal: {
      id: number;
      nom: string;
    };
  }[];
}

export function useSecteurs() {
  return useQuery<Secteur[]>({
    queryKey: ['secteurs'],
    queryFn: async () => {
      const res = await api.get('/secteurs');
      return res.data;
    },
  });
}

export function useCreateSecteur() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: { nom: string; canalIds: number[] }) => (await api.post('/secteurs', data)).data,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['secteurs'] });
      toast.success('Secteur créé avec succès');
    },
    onError: () => {
      toast.error('Erreur lors de la création du secteur');
    },
  });
}

export function useUpdateSecteur() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data: { nom?: string; canalIds?: number[] } }) => (await api.patch(`/secteurs/${id}`, data)).data,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['secteurs'] });
      toast.success('Secteur modifié avec succès');
    },
    onError: () => {
      toast.error('Erreur lors de la modification du secteur');
    },
  });
}

export function useDeleteSecteur() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => (await api.delete(`/secteurs/${id}`)).data,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['secteurs'] });
      toast.success('Secteur supprimé avec succès');
    },
    onError: () => {
      toast.error('Erreur lors de la suppression du secteur');
    },
  });
}


