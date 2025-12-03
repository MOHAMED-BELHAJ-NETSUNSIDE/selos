import { useQuery } from '@tanstack/react-query';
import { getSession } from 'next-auth/react';
import api from '@/lib/api';

export interface PurchaseInvoiceLine {
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

export interface PurchaseInvoice {
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
  purchaseOrder: {
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
  };
  lines: PurchaseInvoiceLine[];
}

export interface PurchaseInvoiceListResponse {
  data: PurchaseInvoice[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export interface PurchaseInvoiceQuery {
  page?: number;
  limit?: number;
  search?: string;
  salespersonId?: number;
  purchaseOrderId?: number;
  status?: string;
  dateFrom?: string;
  dateTo?: string;
}

export function usePurchaseInvoices(query: PurchaseInvoiceQuery = {}) {
  return useQuery<PurchaseInvoiceListResponse>({
    queryKey: ['purchase-invoices', query],
    queryFn: async (): Promise<PurchaseInvoiceListResponse> => {
      // Vérifier que le token est présent avant de faire la requête
      const session = await getSession();
      if (!session?.user?.accessToken) {
        throw new Error('No access token found in session');
      }

      const params = new URLSearchParams();
      if (query.page) params.append('page', query.page.toString());
      if (query.limit) params.append('limit', query.limit.toString());
      if (query.search) params.append('search', query.search);
      if (query.salespersonId) params.append('salespersonId', query.salespersonId.toString());
      if (query.purchaseOrderId) params.append('purchaseOrderId', query.purchaseOrderId.toString());
      if (query.status) params.append('status', query.status);
      if (query.dateFrom) params.append('dateFrom', query.dateFrom);
      if (query.dateTo) params.append('dateTo', query.dateTo);
      
      const response = await api.get(`/purchase-invoices?${params.toString()}`);
      return response.data;
    },
    enabled: !!query.salespersonId, // Ne pas faire de requête si le vendeur n'est pas défini
  });
}

export function usePurchaseInvoice(id: number | null) {
  return useQuery<PurchaseInvoice>({
    queryKey: ['purchase-invoices', id],
    queryFn: async (): Promise<PurchaseInvoice> => {
      const response = await api.get(`/purchase-invoices/${id}`);
      return response.data;
    },
    enabled: !!id,
  });
}

