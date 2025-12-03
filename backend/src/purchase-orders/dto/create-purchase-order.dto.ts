import { IsInt, IsOptional, IsString, Min, IsNumber } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class CreatePurchaseOrderLineDto {
  @ApiProperty({ description: 'ID du produit (Product.id)' })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  productId: number;

  @ApiProperty({ description: 'Quantité commandée' })
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  qte: number;
}

export class CreatePurchaseOrderDto {
  @ApiProperty({ description: 'ID du vendeur (Salesperson)' })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  salespersonId: number;

  @ApiProperty({ description: 'ID du chargement type (optionnel, si création depuis chargement type)' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  chargementTypeId?: number;

  @ApiProperty({ description: 'Remarque (optionnel)' })
  @IsOptional()
  @IsString()
  remarque?: string;

  @ApiProperty({ description: 'Lignes du bon de commande (optionnel si création depuis chargement type)' })
  @IsOptional()
  lines?: CreatePurchaseOrderLineDto[];
}

