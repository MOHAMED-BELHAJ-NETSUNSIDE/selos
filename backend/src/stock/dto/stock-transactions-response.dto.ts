import { ApiProperty } from '@nestjs/swagger';

export class StockTransactionDto {
  @ApiProperty()
  id: number;

  @ApiProperty()
  productId: number;

  @ApiProperty()
  salespersonId: number;

  @ApiProperty({ enum: ['entree', 'sortie'] })
  type: string;

  @ApiProperty()
  qte: number;

  @ApiProperty({ required: false, nullable: true })
  purchaseOrderId?: number | null;

  @ApiProperty({ required: false, nullable: true })
  deliveryNoteId?: number | null;

  @ApiProperty({ required: false, nullable: true })
  returnInvoiceId?: number | null;

  @ApiProperty({ required: false, nullable: true })
  reference?: string | null;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty({ required: false, nullable: true })
  purchaseOrder?: {
    id: number;
    numero: string;
  } | null;

  @ApiProperty({ required: false, nullable: true })
  deliveryNote?: {
    id: number;
    numero: string;
  } | null;

  @ApiProperty({ required: false, nullable: true })
  returnInvoice?: {
    id: number;
    numero: string;
    bcNumber?: string | null;
  } | null;
}

export class StockTransactionsResponseDto {
  @ApiProperty({ type: [StockTransactionDto] })
  data: StockTransactionDto[];

  @ApiProperty()
  total: number;

  @ApiProperty()
  page: number;

  @ApiProperty()
  limit: number;
}

