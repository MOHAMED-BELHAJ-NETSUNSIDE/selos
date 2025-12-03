import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';

export interface ReturnInvoiceLine {
  id: number;
  productId: number;
  qte: number;
  prixUnitaire: number | null;
  montant: number;
  // Champs récupérés depuis BC
  unite?: string | null;
  discountAmount?: number | null;
  discountPercent?: number | null;
  amountExcludingTax?: number | null;
  totalTaxAmount?: number | null;
  taxPercent?: number | null;
  amountIncludingTax?: number | null;
  netAmount?: number | null;
  netTaxAmount?: number | null;
  netAmountIncludingTax?: number | null;
  shipmentDate?: string | null;
  product: {
    id: number;
    designation: string;
    ref: string | null;
    bcItem?: {
      id: number;
      number: string | null;
      displayName: string | null;
      baseUnitOfMeasure: string | null;
    } | null;
  };
}

export interface ReturnInvoice {
  id: number;
  numero: string;
  purchaseOrderId: number;
  salespersonId: number;
  status: string;
  dateFacture: string;
  montantTotal: number;
  montantHT?: number | null;
  montantTTC?: number | null;
  montantTVA?: number | null;
  createdAt: string;
  updatedAt: string;
  salesperson: {
    id: number;
    code: string | null;
    firstName: string;
    lastName: string;
    depotName: string;
    statut?: string;
  };
  purchaseOrder?: {
    id: number;
    numero: string;
    status: string;
    bcNumber?: string | null;
    bcInvoiceNumber?: string | null;
    lines?: Array<{
      id: number;
      productId: number;
      qte: number;
      product: {
        id: number;
        designation: string;
        bcItem?: {
          id: number;
          number: string | null;
          displayName: string | null;
        } | null;
      };
    }>;
  } | null;
  bcId?: string | null;
  bcNumber?: string | null;
  lines: ReturnInvoiceLine[];
}

export interface ReturnInvoiceListResponse {
  data: ReturnInvoice[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export interface ReturnInvoiceQuery {
  page?: number;
  limit?: number;
  search?: string;
  salespersonId?: number;
  purchaseOrderId?: number;
  status?: string;
  dateFrom?: string;
  dateTo?: string;
}

export function useReturnInvoices(query: ReturnInvoiceQuery = {}) {
  return useQuery<ReturnInvoiceListResponse>({
    queryKey: ['return-invoices', query],
    queryFn: async (): Promise<ReturnInvoiceListResponse> => {
      const params = new URLSearchParams();
      if (query.page) params.append('page', query.page.toString());
      if (query.limit) params.append('limit', query.limit.toString());
      if (query.search) params.append('search', query.search);
      if (query.salespersonId) params.append('salespersonId', query.salespersonId.toString());
      if (query.purchaseOrderId) params.append('purchaseOrderId', query.purchaseOrderId.toString());
      if (query.status) params.append('status', query.status);
      if (query.dateFrom) params.append('dateFrom', query.dateFrom);
      if (query.dateTo) params.append('dateTo', query.dateTo);
      
      const response = await api.get(`/return-invoices?${params.toString()}`);
      return response.data;
    },
  });
}

export function useReturnInvoice(id: number | null) {
  return useQuery<ReturnInvoice>({
    queryKey: ['return-invoices', id],
    queryFn: async (): Promise<ReturnInvoice> => {
      const response = await api.get(`/return-invoices/${id}`);
      return response.data;
    },
    enabled: !!id,
  });
}

export interface CreateReturnInvoiceLine {
  productId: number;
  qte: number;
  prixUnitaire?: number;
}

export interface CreateReturnInvoiceData {
  salespersonId: number;
  purchaseOrderId?: number;
  lines: CreateReturnInvoiceLine[];
}

export function useCreateReturnInvoice() {
  const queryClient = useQueryClient();

  return useMutation<ReturnInvoice, Error, CreateReturnInvoiceData>({
    mutationFn: async (data: CreateReturnInvoiceData): Promise<ReturnInvoice> => {
      const response = await api.post('/return-invoices', data);
      return response.data;
    },
    onSuccess: () => {
      // Invalider la liste des factures de retour pour rafraîchir les données
      queryClient.invalidateQueries({ queryKey: ['return-invoices'] });
    },
  });
}

export function useValidateReturnInvoice() {
  const queryClient = useQueryClient();

  return useMutation<ReturnInvoice, Error, number>({
    mutationFn: async (id: number): Promise<ReturnInvoice> => {
      const response = await api.patch(`/return-invoices/${id}/validate`, {});
      return response.data;
    },
    onSuccess: (data, id) => {
      // Invalider la liste et la facture spécifique
      queryClient.invalidateQueries({ queryKey: ['return-invoices'] });
      queryClient.invalidateQueries({ queryKey: ['return-invoices', id] });
    },
  });
}

export function useDeleteReturnInvoice() {
  const queryClient = useQueryClient();

  return useMutation<{ message: string }, Error, number>({
    mutationFn: async (id: number): Promise<{ message: string }> => {
      const response = await api.delete(`/return-invoices/${id}`);
      return response.data;
    },
    onSuccess: (data, id) => {
      // Invalider la liste des factures de retour
      queryClient.invalidateQueries({ queryKey: ['return-invoices'] });
    },
  });
}

