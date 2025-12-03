export interface BCItem {
  id: string;
  number: string;
  displayName: string;
  type?: string;
  itemCategoryCode?: string;
  itemCategoryId?: string;
  baseUnitOfMeasure?: string;
  unitPrice?: number;
  unitCost?: number;
  inventory?: number;
  blocked?: boolean | string;
  gtin?: string;
  lastModifiedDateTime?: string;
  '@odata.etag'?: string;
}

