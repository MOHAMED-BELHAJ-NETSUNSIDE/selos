import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';

export interface BCItemPrice {
  id: number;
  bcId?: string | null;
  itemId: string;
  itemNumber?: string | null;
  unitPrice: number;
  minimumQuantity?: number | null;
  salesType?: string | null;
  salesCode?: string | null;
  salesCodeName?: string | null;
  startingDate?: string | null;
  endingDate?: string | null;
  unitOfMeasureCode?: string | null;
  currencyCode?: string | null;
  variantCode?: string | null;
  priceIncludesVAT?: boolean | null;
  allowLineDisc?: boolean | null;
  allowInvoiceDisc?: boolean | null;
  vatBusPostingGr?: string | null;
  lastModified?: string | null;
  etag?: string | null;
  rawJson?: any;
  createdAt: string;
  updatedAt: string;
  bcItem?: {
    id: number;
    number?: string | null;
    displayName?: string | null;
  } | null;
}

export interface BCItemPricesResponse {
  success: boolean;
  data: BCItemPrice[];
  count: number;
}

export function useBCItemPrices(itemId?: string | null) {
  return useQuery<BCItemPrice[]>({
    queryKey: ['bc-item-prices', itemId],
    queryFn: async (): Promise<BCItemPrice[]> => {
      if (!itemId) return [];
      const response = await api.get(`/bc-item-prices/bc-item/${itemId}`);
      return response.data;
    },
    enabled: !!itemId,
  });
}

export function useBCItemPricesByNumber(itemNumber?: string | null) {
  return useQuery<BCItemPrice[]>({
    queryKey: ['bc-item-prices-number', itemNumber],
    queryFn: async (): Promise<BCItemPrice[]> => {
      if (!itemNumber) return [];
      const response = await api.get(`/bc-item-prices/item-number/${itemNumber}`);
      return response.data;
    },
    enabled: !!itemNumber,
  });
}

