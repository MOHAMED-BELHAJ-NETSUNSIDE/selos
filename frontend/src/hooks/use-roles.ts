import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { toast } from 'sonner';

// Utility function to parse permissions from various formats
function parsePermissions(permissions: any): string[] {
  if (Array.isArray(permissions)) {
    return permissions;
  } else if (typeof permissions === 'string') {
    try {
      return JSON.parse(permissions);
    } catch {
      return permissions.split(',').map((p: string) => p.trim());
    }
  } else {
    return [];
  }
}

export interface Role {
  id: string;
  name: string;
  permissions: string[]; // Stored as JSON string in backend, parsed here
  createdAt: string;
  updatedAt: string;
}

export interface CreateRoleData {
  name: string;
  permissions: string[];
}

export interface UpdateRoleData {
  name?: string;
  permissions?: string[];
}

export function useRoles() {
  return useQuery<Role[], Error>({
    queryKey: ['roles'],
    queryFn: async () => {
      try {
        const response = await api.get('/roles');
        // Handle permissions parsing - they might be JSON string, comma-separated string, or already an array
        return response.data.map((role: any) => ({
          ...role,
          permissions: parsePermissions(role.permissions),
        }));
      } catch (error) {
        console.error('Error fetching roles:', error);
        throw error;
      }
    },
  });
}

export function useRole(id: string | null) {
  return useQuery<Role, Error>({
    queryKey: ['role', id],
    queryFn: async () => {
      const response = await api.get(`/roles/${id}`);
      return {
        ...response.data,
        permissions: parsePermissions(response.data.permissions),
      };
    },
    enabled: !!id,
  });
}

export function useCreateRole() {
  const queryClient = useQueryClient();
  return useMutation<Role, Error, CreateRoleData>({
    mutationFn: async (data) => {
      const response = await api.post('/roles', {
        ...data,
        // Le backend s'attend à recevoir un tableau de permissions, pas une chaîne JSON
        // Le service backend fait lui-même le JSON.stringify
      });
      return {
        ...response.data,
        permissions: parsePermissions(response.data.permissions),
      };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roles'] });
      toast.success('Rôle créé avec succès');
    },
    onError: (error) => {
      toast.error(`Erreur lors de la création du rôle: ${error.message}`);
    },
  });
}

export function useUpdateRole() {
  const queryClient = useQueryClient();
  return useMutation<Role, Error, { id: string; data: UpdateRoleData }>({
    mutationFn: async ({ id, data }) => {
      const response = await api.patch(`/roles/${id}`, {
        ...data,
        // Le backend s'attend à recevoir un tableau de permissions, pas une chaîne JSON
        // Le service backend fait lui-même le JSON.stringify
      });
      return {
        ...response.data,
        permissions: parsePermissions(response.data.permissions),
      };
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['roles'] });
      queryClient.invalidateQueries({ queryKey: ['role', id] });
      toast.success('Rôle modifié avec succès');
    },
    onError: (error) => {
      toast.error(`Erreur lors de la modification du rôle: ${error.message}`);
    },
  });
}

export function useDeleteRole() {
  const queryClient = useQueryClient();
  return useMutation<void, Error, string>({
    mutationFn: async (id) => {
      await api.delete(`/roles/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roles'] });
      toast.success('Rôle supprimé avec succès');
    },
    onError: (error) => {
      toast.error(`Erreur lors de la suppression du rôle: ${error.message}`);
    },
  });
}