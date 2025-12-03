import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsOptional, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class GetStockTransactionsDto {
  @ApiProperty({ description: 'ID du produit', required: true })
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  productId: number;

  @ApiProperty({ description: 'ID du vendeur (salesperson)', required: true })
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  salespersonId: number;

  @ApiProperty({ required: false, description: 'Numéro de page', default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number;

  @ApiProperty({ required: false, description: 'Nombre d\'éléments par page', default: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  limit?: number;
}

