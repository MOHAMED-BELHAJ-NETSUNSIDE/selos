// Interface basée sur la structure itemSalesPrices OData V4
export interface BCItemPrice {
  // Champs principaux depuis itemSalesPrices
  Item_No?: string; // Numéro de l'item
  Unit_Price?: number;
  Minimum_Quantity?: number; // Format OData standard
  quantity?: number; // Format alternatif (si Business Central retourne quantity au lieu de Minimum_Quantity)
  Sales_Type?: string; // "All Customers", "Customer", "Customer Price Group", "Campaign"
  Sales_Code?: string; // Code client ou groupe de prix
  Starting_Date?: string; // Format: "YYYY-MM-DD" ou "0001-01-01" pour null
  Ending_Date?: string; // Format: "YYYY-MM-DD" ou "0001-01-01" pour null
  Unit_of_Measure_Code?: string;
  Currency_Code?: string;
  Variant_Code?: string;
  Price_Includes_VAT?: boolean;
  Allow_Line_Disc?: boolean;
  Allow_Invoice_Disc?: boolean;
  VAT_Bus_Posting_Gr_Price?: string;
  
  // Champs additionnels pour la synchronisation
  id?: string; // ID unique si disponible
  lastModifiedDateTime?: string;
  '@odata.etag'?: string;
}

export interface SyncPricesDto {
  prices: BCItemPrice[];
}

