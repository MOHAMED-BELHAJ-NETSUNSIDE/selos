import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { toast } from 'sonner';

export interface TypeClient {
  id: number;
  nom: string;
}

export interface CreateTypeClientData {
  nom: string;
}

export interface UpdateTypeClientData {
  nom?: string;
}

export function useTypeClients() {
  return useQuery<TypeClient[]>({
    queryKey: ['type-clients'],
    queryFn: async () => {
      const res = await api.get('/type-clients');
      return res.data;
    },
  });
}

export function useTypeClient(id: number | null) {
  return useQuery<TypeClient>({
    queryKey: ['type-client', id],
    queryFn: async () => {
      const res = await api.get(`/type-clients/${id}`);
      return res.data;
    },
    enabled: !!id,
  });
}

export function useCreateTypeClient() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: CreateTypeClientData): Promise<TypeClient> => {
      const res = await api.post('/type-clients', data);
      return res.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['type-clients'] });
      toast.success('Type client créé');
    },
    onError: () => {
      toast.error('Erreur lors de la création du type client');
    },
  });
}

export function useUpdateTypeClient() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data: UpdateTypeClientData }): Promise<TypeClient> => {
      const res = await api.patch(`/type-clients/${id}`, data);
      return res.data;
    },
    onSuccess: (_, variables) => {
      qc.invalidateQueries({ queryKey: ['type-clients'] });
      qc.invalidateQueries({ queryKey: ['type-client', variables.id] });
      toast.success('Type client modifié');
    },
    onError: () => {
      toast.error('Erreur lors de la modification');
    },
  });
}

export function useDeleteTypeClient() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: number): Promise<void> => {
      await api.delete(`/type-clients/${id}`);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['type-clients'] });
      toast.success('Type client supprimé');
    },
    onError: () => {
      toast.error('Erreur lors de la suppression');
    },
  });
}

