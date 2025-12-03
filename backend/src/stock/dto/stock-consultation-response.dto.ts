import { ApiProperty } from '@nestjs/swagger';

export class StockConsultationItemDto {
  @ApiProperty()
  id: number;

  @ApiProperty()
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

  @ApiProperty()
  salesperson: {
    id: number;
    code: string | null;
    firstName: string;
    lastName: string;
    depotName: string;
    statut: string;
  };

  @ApiProperty()
  totalStock: number;

  @ApiProperty()
  lastUpdated: Date;

  @ApiProperty({ description: 'Prix d\'achat depuis les factures d\'achat validées', required: false })
  purchasePrice?: number | null;
}

export class StockConsultationResponseDto {
  @ApiProperty({ type: [StockConsultationItemDto] })
  data: StockConsultationItemDto[];

  @ApiProperty()
  total: number;

  @ApiProperty()
  page: number;

  @ApiProperty()
  limit: number;
}

