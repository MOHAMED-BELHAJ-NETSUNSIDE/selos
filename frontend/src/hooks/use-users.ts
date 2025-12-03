import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { toast } from 'sonner';

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  isActive: boolean;
  role: {
    id: string;
    name: string;
    permissions: string;
  };
  typeUser?: {
    id: number;
    nom: string;
  };
  secteurId?: number | null;
  typeUserId?: number | null;
  regionId?: number | null;
  canalId?: number | null;
  typeVenteId?: number | null;
  bcLocationId?: string | null;
  secteur?: {
    id: number;
    nom: string;
  };
  region?: {
    id: number;
    nom: string;
  };
  canal?: {
    id: number;
    nom: string;
  };
  typeVente?: {
    id: number;
    nom: string;
  };
  bcLocation?: {
    id: number;
    bcId: string;
    code?: string | null;
    displayName?: string | null;
  };
  createdAt: string;
  updatedAt: string;
}

export interface CreateUserData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  roleId: string;
  typeUserId: number;
  secteurId?: number;
  regionId?: number;
  canalId?: number;
  typeVenteId?: number;
  bcLocationId?: string;
}

export interface UpdateUserData extends Partial<Omit<CreateUserData, 'password'>> {
  password?: string;
}

export interface UsersResponse {
  data: User[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export interface UsersQuery {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export function useUsers(query: UsersQuery = {}) {
  return useQuery({
    queryKey: ['users', query],
    queryFn: async (): Promise<UsersResponse> => {
      const params = new URLSearchParams();
      if (query.page) params.append('page', query.page.toString());
      if (query.limit) params.append('limit', query.limit.toString());
      if (query.search) params.append('search', query.search);
      if (query.sortBy) params.append('sortBy', query.sortBy);
      if (query.sortOrder) params.append('sortOrder', query.sortOrder);

      const response = await api.get(`/users?${params.toString()}`);
      return response.data;
    },
  });
}

export function useUser(id: string) {
  return useQuery({
    queryKey: ['user', id],
    queryFn: async (): Promise<User> => {
      const response = await api.get(`/users/${id}`);
      return response.data;
    },
    enabled: !!id,
  });
}

export function useCreateUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateUserData): Promise<User> => {
      const response = await api.post('/users', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success('Utilisateur créé avec succès');
    },
    onError: () => {
      toast.error('Erreur lors de la création de l\'utilisateur');
    },
  });
}

export function useUpdateUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateUserData }): Promise<User> => {
      const response = await api.patch(`/users/${id}`, data);
      return response.data;
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      queryClient.invalidateQueries({ queryKey: ['user', id] });
      toast.success('Utilisateur modifié avec succès');
    },
    onError: () => {
      toast.error('Erreur lors de la modification de l\'utilisateur');
    },
  });
}

export function useToggleUserActive() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string): Promise<User> => {
      const response = await api.patch(`/users/${id}/toggle-active`);
      return response.data;
    },
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      queryClient.invalidateQueries({ queryKey: ['user', id] });
      toast.success('Statut de l\'utilisateur modifié');
    },
    onError: () => {
      toast.error('Erreur lors de la modification du statut');
    },
  });
}

export function useDeleteUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string): Promise<void> => {
      await api.delete(`/users/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success('Utilisateur supprimé avec succès');
    },
    onError: () => {
      toast.error('Erreur lors de la suppression de l\'utilisateur');
    },
  });
}


