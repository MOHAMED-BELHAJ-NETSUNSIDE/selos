import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';

export interface PermissionCatalogItem {
  key: string;
  label: string;
  permissions: string[]; // e.g., ["users:read","users:write",...]
}

export function usePermissionsCatalog() {
  return useQuery<PermissionCatalogItem[]>({
    queryKey: ['permission-catalog'],
    queryFn: async () => {
      const res = await api.get('/permissions');
      return res.data;
    },
  });
}


