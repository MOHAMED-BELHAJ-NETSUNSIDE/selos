import { IsInt, IsOptional, IsString, Min, IsNumber, IsArray, ValidateNested } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class CreateDeliveryNoteLineDto {
  @ApiProperty({ description: 'ID du produit (Product.id)' })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  productId: number;

  @ApiProperty({ description: 'Quantité livrée' })
  @Type(() => Number)
  @IsNumber()
  @Min(0.01)
  qte: number;

  @ApiProperty({ description: 'Prix unitaire' })
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  prixUnitaire: number;
}

export class CreateDeliveryNoteDto {
  @ApiProperty({ description: 'ID du vendeur (Salesperson)' })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  salespersonId: number;

  @ApiProperty({ description: 'ID du client (Client)' })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  clientId: number;

  @ApiProperty({ description: 'Remarque (optionnel)' })
  @IsOptional()
  @IsString()
  remarque?: string;

  @ApiProperty({ description: 'Lignes du bon de livraison', type: [CreateDeliveryNoteLineDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateDeliveryNoteLineDto)
  lines: CreateDeliveryNoteLineDto[];
}

