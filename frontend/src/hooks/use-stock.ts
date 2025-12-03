import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';

export interface StockConsultationItem {
  id: number;
  product: {
    id: number;
    designation: string;
    ref: string | null;
    bcItem: {
      id: number;
      bcId: string;
      number: string | null;
      displayName: string | null;
      baseUnitOfMeasure: string | null;
      unitPrice?: number | null;
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
  purchasePrice?: number | null;
}

export interface StockConsultationQuery {
  productId?: number;
  salespersonId?: number;
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
      const params = new URLSearchParams();
      if (query.productId) params.append('productId', query.productId.toString());
      if (query.salespersonId) params.append('salespersonId', query.salespersonId.toString());
      if (query.bcItemId) params.append('bcItemId', query.bcItemId);
      if (query.minQuantity !== undefined) params.append('minQuantity', query.minQuantity.toString());
      if (query.maxQuantity !== undefined) params.append('maxQuantity', query.maxQuantity.toString());
      if (query.search) params.append('search', query.search);
      if (query.page) params.append('page', query.page.toString());
      if (query.limit) params.append('limit', query.limit.toString());
      
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
  salespersonId: number;
  page?: number;
  limit?: number;
}

export function useStockTransactions(
  query: StockTransactionsQuery,
  options?: { enabled?: boolean }
) {
  return useQuery<StockTransactionsResponse>({
    queryKey: ['stock', 'transactions', query],
    queryFn: async (): Promise<StockTransactionsResponse> => {
      const params = new URLSearchParams();
      params.append('productId', query.productId.toString());
      params.append('salespersonId', query.salespersonId.toString());
      if (query.page) params.append('page', query.page.toString());
      if (query.limit) params.append('limit', query.limit.toString());
      
      const response = await api.get(`/stock/transactions?${params.toString()}`);
      return response.data;
    },
    enabled: options?.enabled !== false && !!query.productId && !!query.salespersonId,
  });
}

export interface StockByLocationItem {
  id: number;
  bcItem: {
    id: number;
    bcId: string;
    number: string | null;
    displayName: string | null;
    baseUnitOfMeasure: string | null;
    unitPrice: number | null;
    inventory: number | null; // Stock global BC (pour référence)
  };
  location: {
    id: number;
    bcId: string;
    code: string | null;
    displayName: string | null;
    city: string | null;
    country: string | null;
  } | null;
  stockByLocation: number | null; // Stock réel par location depuis StockTotal
  prices: Array<{
    id: number;
    unitPrice: number;
    salesType: string | null;
    salesCode: string | null;
    minimumQuantity: number | null;
    currencyCode: string | null;
  }>;
}

export interface StockByLocationQuery {
  locationId?: string;
  bcItemId?: string;
  itemNumber?: string;
  search?: string;
  minQuantity?: number;
  maxQuantity?: number;
  page?: number;
  limit?: number;
}

export interface StockByLocationResponse {
  data: StockByLocationItem[];
  total: number;
  page: number;
  limit: number;
}

export function useStockByLocation(
  query: StockByLocationQuery = {},
  options?: { enabled?: boolean }
) {
  // Ne pas appeler l'API si aucun article n'est sélectionné (obligatoire)
  const hasItem = !!(query.bcItemId || query.itemNumber);
  
  return useQuery<StockByLocationResponse>({
    queryKey: ['stock', 'by-location', query],
    queryFn: async (): Promise<StockByLocationResponse> => {
      const params = new URLSearchParams();
      if (query.locationId) params.append('locationId', query.locationId);
      if (query.bcItemId) params.append('bcItemId', query.bcItemId);
      if (query.itemNumber) params.append('itemNumber', query.itemNumber);
      if (query.search) params.append('search', query.search);
      if (query.minQuantity !== undefined) params.append('minQuantity', query.minQuantity.toString());
      if (query.maxQuantity !== undefined) params.append('maxQuantity', query.maxQuantity.toString());
      if (query.page) params.append('page', query.page.toString());
      if (query.limit) params.append('limit', query.limit.toString());
      
      const response = await api.get(`/stock/by-location?${params.toString()}`);
      return response.data;
    },
    enabled: (options?.enabled !== false) && hasItem, // Désactiver si aucun article sélectionné
  });
}

