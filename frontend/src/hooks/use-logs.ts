import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';

export interface Log {
  id: string;
  userId: string;
  user: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  module: string;
  action: string;
  recordId?: string;
  description?: string;
  oldData?: any;
  newData?: any;
  createdAt: string;
}

export interface LogsQuery {
  page?: number;
  limit?: number;
  search?: string;
  module?: string;
  action?: string;
  userId?: string;
}

export interface LogsResponse {
  data: Log[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export function useLogs(query: LogsQuery = {}) {
  return useQuery({
    queryKey: ['logs', query],
    queryFn: async (): Promise<LogsResponse> => {
      const params = new URLSearchParams();
      
      if (query.page) params.append('page', query.page.toString());
      if (query.limit) params.append('limit', query.limit.toString());
      if (query.search) params.append('search', query.search);
      if (query.module) params.append('module', query.module);
      if (query.action) params.append('action', query.action);
      if (query.userId) params.append('userId', query.userId);

      const response = await api.get(`/logs?${params.toString()}`);
      return response.data;
    },
  });
}
