import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsNotEmpty, Min, IsOptional, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class ReturnInvoiceLineDto {
  @ApiProperty({ description: 'ID du produit' })
  @IsNumber()
  @IsNotEmpty()
  @Min(1)
  productId: number;

  @ApiProperty({ description: 'Quantité' })
  @IsNumber()
  @IsNotEmpty()
  @Min(0.01)
  qte: number;

  @ApiProperty({ description: 'Prix unitaire (optionnel)', required: false })
  @IsNumber()
  @IsOptional()
  @Min(0)
  prixUnitaire?: number;
}

export class CreateReturnInvoiceDto {
  @ApiProperty({ description: 'ID du bon de commande (optionnel)', required: false })
  @IsNumber()
  @IsOptional()
  @Min(1)
  purchaseOrderId?: number;

  @ApiProperty({ description: 'ID du vendeur' })
  @IsNumber()
  @IsNotEmpty()
  @Min(1)
  salespersonId: number;

  @ApiProperty({ description: 'Lignes de la facture de retour', type: [ReturnInvoiceLineDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ReturnInvoiceLineDto)
  @IsNotEmpty()
  lines: ReturnInvoiceLineDto[];
}

