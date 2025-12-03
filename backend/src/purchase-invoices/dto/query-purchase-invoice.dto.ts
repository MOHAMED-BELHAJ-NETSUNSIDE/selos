import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsNumber, IsString, Min, IsDateString } from 'class-validator';
import { Type } from 'class-transformer';

export class QueryPurchaseInvoiceDto {
  @ApiProperty({ required: false, description: 'Numéro de page', default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number;

  @ApiProperty({ required: false, description: 'Nombre d\'éléments par page', default: 10 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  limit?: number;

  @ApiProperty({ required: false, description: 'Recherche par numéro de facture' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiProperty({ required: false, description: 'Filtre par ID du vendeur' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  salespersonId?: number;

  @ApiProperty({ required: false, description: 'Filtre par ID du bon de commande' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  purchaseOrderId?: number;

  @ApiProperty({ required: false, description: 'Filtre par statut' })
  @IsOptional()
  @IsString()
  status?: string;

  @ApiProperty({ required: false, description: 'Date de début (format: YYYY-MM-DD)' })
  @IsOptional()
  @IsDateString()
  dateFrom?: string;

  @ApiProperty({ required: false, description: 'Date de fin (format: YYYY-MM-DD)' })
  @IsOptional()
  @IsDateString()
  dateTo?: string;
}

