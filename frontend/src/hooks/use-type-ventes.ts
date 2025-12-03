import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import api from '@/lib/api';

export interface TypeVente {
  id: number;
  nom: string;
}

export function useTypeVentes() {
  return useQuery<TypeVente[]>({
    queryKey: ['type-ventes'],
    queryFn: async () => (await api.get('/type-ventes')).data,
  });
}

export function useCreateTypeVente() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: { nom: string }) => (await api.post('/type-ventes', data)).data,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['type-ventes'] });
      toast.success('Type de vente créé avec succès');
    },
    onError: () => {
      toast.error('Erreur lors de la création du type de vente');
    },
  });
}

export function useUpdateTypeVente() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data: { nom?: string } }) => (await api.patch(`/type-ventes/${id}`, data)).data,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['type-ventes'] });
      toast.success('Type de vente modifié avec succès');
    },
    onError: () => {
      toast.error('Erreur lors de la modification du type de vente');
    },
  });
}

export function useDeleteTypeVente() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => (await api.delete(`/type-ventes/${id}`)).data,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['type-ventes'] });
      toast.success('Type de vente supprimé avec succès');
    },
    onError: () => {
      toast.error('Erreur lors de la suppression du type de vente');
    },
  });
}


