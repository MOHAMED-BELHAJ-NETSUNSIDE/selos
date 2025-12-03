import { useQuery } from '@tanstack/react-query';
import { getSession } from 'next-auth/react';
import api from '@/lib/api';

export interface StockConsultationItem {
  id: number;
  product: {
    id: number;
    designation: string;
    ref: string | null;
    bcItem: {
      id: number;
      number: string | null;
      displayName: string | null;
      baseUnitOfMeasure: string | null;
    } | null;
  };
  salesperson: {
    id: number;
    code: string | null;
    firstName: string;
    lastName: string;
    depotName: string;
    statut: string;
  };
  totalStock: number;
  lastUpdated: string;
}

export interface StockConsultationQuery {
  productId?: number;
  bcItemId?: string;
  minQuantity?: number;
  maxQuantity?: number;
  search?: string;
  page?: number;
  limit?: number;
}

export interface StockConsultationResponse {
  data: StockConsultationItem[];
  total: number;
  page: number;
  limit: number;
}

export function useStockConsultation(
  query: StockConsultationQuery = {},
  options?: { enabled?: boolean }
) {
  return useQuery<StockConsultationResponse>({
    queryKey: ['stock', 'consultation', query],
    queryFn: async (): Promise<StockConsultationResponse> => {
      // Vérifier que le token est présent avant de faire la requête
      const session = await getSession();
      if (!session?.user?.accessToken) {
        throw new Error('No access token found in session');
      }

      const params = new URLSearchParams();
      if (query.productId) params.append('productId', query.productId.toString());
      if (query.bcItemId) params.append('bcItemId', query.bcItemId);
      if (query.minQuantity !== undefined) params.append('minQuantity', query.minQuantity.toString());
      if (query.maxQuantity !== undefined) params.append('maxQuantity', query.maxQuantity.toString());
      if (query.search) params.append('search', query.search);
      if (query.page) params.append('page', query.page.toString());
      if (query.limit) params.append('limit', query.limit.toString());
      
      // Note: salespersonId n'est pas passé car le backend filtre automatiquement
      // par le vendeur connecté depuis le token JWT
      const response = await api.get(`/stock/consultation?${params.toString()}`);
      return response.data;
    },
    enabled: options?.enabled !== false,
  });
}

export interface StockTransaction {
  id: number;
  productId: number;
  salespersonId: number;
  type: 'entree' | 'sortie';
  qte: number;
  purchaseOrderId?: number | null;
  deliveryNoteId?: number | null;
  returnInvoiceId?: number | null;
  reference?: string | null;
  createdAt: string;
  purchaseOrder?: {
    id: number;
    numero: string;
  } | null;
  deliveryNote?: {
    id: number;
    numero: string;
  } | null;
  returnInvoice?: {
    id: number;
    numero: string;
    bcNumber?: string | null;
  } | null;
}

export interface StockTransactionsResponse {
  data: StockTransaction[];
  total: number;
  page: number;
  limit: number;
}

export interface StockTransactionsQuery {
  productId: number;
  page?: number;
  limit?: number;
}

export function useStockTransactions(
  query: StockTransactionsQuery,
  options?: { enabled?: boolean; salespersonId?: number }
) {
  return useQuery<StockTransactionsResponse>({
    queryKey: ['stock', 'transactions', query, options?.salespersonId],
    queryFn: async (): Promise<StockTransactionsResponse> => {
      const session = await getSession();
      if (!session?.user?.accessToken) {
        throw new Error('No access token found in session');
      }

      const salespersonId = options?.salespersonId || session?.user?.salesperson?.id;
      if (!salespersonId) {
        throw new Error('No salesperson ID found');
      }

      const params = new URLSearchParams();
      params.append('productId', query.productId.toString());
      params.append('salespersonId', salespersonId.toString());
      if (query.page) params.append('page', query.page.toString());
      if (query.limit) params.append('limit', query.limit.toString());
      
      const response = await api.get(`/stock/transactions?${params.toString()}`);
      return response.data;
    },
    enabled: options?.enabled !== false && !!query.productId && !!(options?.salespersonId || options?.salespersonId === undefined),
  });
}

