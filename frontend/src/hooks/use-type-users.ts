import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';

export interface TypeUser {
  id: number;
  nom: string;
}

export function useTypeUsers() {
  return useQuery<TypeUser[]>({
    queryKey: ['type-users'],
    queryFn: async () => {
      const res = await api.get('/type-users');
      return res.data;
    },
  });
}


