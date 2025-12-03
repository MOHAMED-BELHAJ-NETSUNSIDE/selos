import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsNumber, IsString, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class GetStockConsultationDto {
  @ApiProperty({ required: false, description: 'ID du produit' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  productId?: number;

  @ApiProperty({ required: false, description: 'ID du vendeur (salesperson)' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  salespersonId?: number;

  @ApiProperty({ required: false, description: 'ID de l\'item Business Central' })
  @IsOptional()
  @IsString()
  bcItemId?: string;

  @ApiProperty({ required: false, description: 'Quantité minimum' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  minQuantity?: number;

  @ApiProperty({ required: false, description: 'Quantité maximum' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  maxQuantity?: number;

  @ApiProperty({ required: false, description: 'Recherche textuelle (item, vendeur, dépôt)' })
  @IsOptional()
  @IsString()
  search?: string;

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
}

