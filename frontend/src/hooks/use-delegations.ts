import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import api from '@/lib/api';

export interface Delegation {
  id: number;
  nom: string;
  id_gouvernorat: number;
  gouvernorat?: {
    id: number;
    nom: string;
  };
}

export function useDelegations() {
  return useQuery<Delegation[]>({
    queryKey: ['delegations'],
    queryFn: async () => (await api.get('/delegations')).data,
  });
}

export function useCreateDelegation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: { nom: string; id_gouvernorat: number }) => (await api.post('/delegations', data)).data,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['delegations'] });
      toast.success('Délégation créée avec succès');
    },
    onError: () => {
      toast.error('Erreur lors de la création de la délégation');
    },
  });
}

export function useUpdateDelegation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data: { nom?: string; id_gouvernorat?: number } }) => (await api.patch(`/delegations/${id}`, data)).data,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['delegations'] });
      toast.success('Délégation modifiée avec succès');
    },
    onError: () => {
      toast.error('Erreur lors de la modification de la délégation');
    },
  });
}

export function useDeleteDelegation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => (await api.delete(`/delegations/${id}`)).data,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['delegations'] });
      toast.success('Délégation supprimée avec succès');
    },
    onError: () => {
      toast.error('Erreur lors de la suppression de la délégation');
    },
  });
}


