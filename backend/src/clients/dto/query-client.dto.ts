import { IsOptional, IsString, IsNumber, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class QueryClientDto {
  @ApiProperty({ required: false, default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @ApiProperty({ required: false, default: 10 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(100)
  limit?: number = 10;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  sortBy?: string = 'createdAt';

  @ApiProperty({ required: false, enum: ['asc', 'desc'], default: 'desc' })
  @IsOptional()
  @IsString()
  sortOrder?: 'asc' | 'desc' = 'desc';

  // Filtres par colonne
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  code?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  nom?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  nomCommercial?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  numeroTelephone?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  adresse?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  registreCommerce?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  typeClientId?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  typeVenteId?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  canalId?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  localiteId?: number;

  @ApiProperty({ required: false, description: 'Filtre par secteur (via relation Localité → Zone → Secteur)' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  secteurId?: number;
}



