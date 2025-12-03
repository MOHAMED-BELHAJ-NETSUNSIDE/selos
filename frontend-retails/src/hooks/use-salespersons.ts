import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';

export interface Salesperson {
  id: number;
  firstName: string;
  lastName: string;
  email: string | null;
  code: string | null;
  telephone: string | null;
  adresse: string | null;
  tva: string | null;
  dateEmbauche: string | null;
  statut: string;
  login: string;
  depotName: string;
  depotAdresse: string | null;
  depotTel: string | null;
  depotStatus: number;
  depotRemarque: string | null;
  bcCustomerId: string | null;
  bcCode: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface SalespersonsResponse {
  data: Salesperson[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export interface SalespersonsQuery {
  page?: number;
  limit?: number;
  search?: string;
}

export function useSalespersons(query: SalespersonsQuery = {}) {
  return useQuery({
    queryKey: ['salespersons', query],
    queryFn: async (): Promise<SalespersonsResponse> => {
      const params = new URLSearchParams();
      if (query.page) params.append('page', query.page.toString());
      if (query.limit) params.append('limit', query.limit.toString());
      if (query.search) params.append('search', query.search);

      const response = await api.get(`/salespersons?${params.toString()}`);
      return response.data;
    },
  });
}

export function useSalesperson(id: number) {
  return useQuery({
    queryKey: ['salesperson', id],
    queryFn: async (): Promise<Salesperson> => {
      const response = await api.get(`/salespersons/${id}`);
      return response.data;
    },
    enabled: !!id,
  });
}

