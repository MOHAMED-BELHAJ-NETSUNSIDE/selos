import { IsString, IsOptional, MinLength, IsInt, Min, IsNumber, IsDecimal } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class CreateClientDto {
  @ApiProperty({ example: 'CLT0001', required: false, description: 'Code généré automatiquement si non fourni' })
  @IsOptional()
  @IsString()
  @MinLength(1)
  code?: string;

  @ApiProperty({ example: 'CARREFOUR MARSA' })
  @IsString()
  @MinLength(2)
  nom: string;

  @ApiProperty({ example: 'CARREFOUR MARSA Tunis', required: false })
  @IsOptional()
  @IsString()
  nomCommercial?: string;

  @ApiProperty({ example: '123 Rue Habib Bourguiba, Tunis', required: false })
  @IsOptional()
  @IsString()
  adresse?: string;

  @ApiProperty({ example: '+216 71 123 456', required: false })
  @IsOptional()
  @IsString()
  numeroTelephone?: string;

  @ApiProperty({ example: 10.1815, required: false })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  longitude?: number;

  @ApiProperty({ example: 36.8065, required: false })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  latitude?: number;

  @ApiProperty({ example: 'RC123456', required: false })
  @IsOptional()
  @IsString()
  registreCommerce?: string;

  @ApiProperty({ example: 1, required: false })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  typeClientId?: number;

  @ApiProperty({ example: 1, required: false })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  typeVenteId?: number;

  @ApiProperty({ example: 1, required: false })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  canalId?: number;

  @ApiProperty({ example: 1, required: false })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  localiteId?: number;
}


