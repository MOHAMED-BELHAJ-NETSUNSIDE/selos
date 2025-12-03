import { IsString, IsOptional, IsDateString, IsArray, ValidateNested, IsNumber, Min, IsInt } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class ValidatePurchaseOrderLineDto {
  @ApiProperty({ description: 'ID de la ligne du bon de commande' })
  @IsInt()
  lineId: number;

  @ApiProperty({ description: 'Nouvelle quantité (doit être inférieure ou égale à la quantité initiale)' })
  @IsNumber()
  @Min(0)
  qte: number;
}

export class ValidatePurchaseOrderDto {
  @ApiProperty({ description: 'Numéro client (optionnel, récupéré automatiquement depuis le vendeur si non fourni)' })
  @IsOptional()
  @IsString()
  clientNumber?: string;

  @ApiProperty({ description: 'Date de réception (optionnel)' })
  @IsOptional()
  @IsDateString()
  dateReception?: string;

  @ApiProperty({ description: 'Devise (optionnel)' })
  @IsOptional()
  @IsString()
  currency?: string;

  @ApiProperty({ 
    description: 'Lignes avec quantités modifiées (optionnel, si non fourni, les quantités originales sont utilisées)',
    type: [ValidatePurchaseOrderLineDto],
    required: false
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ValidatePurchaseOrderLineDto)
  lines?: ValidatePurchaseOrderLineDto[];
}

