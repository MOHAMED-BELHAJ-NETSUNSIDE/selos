import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsInt, IsArray, ValidateNested, Min, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';

class ProductDto {
  @ApiProperty({ example: 'bc-item-id-123' })
  @IsString()
  productId: string; // bcId de BCItem

  @ApiProperty({ example: 10 })
  @IsInt()
  @Min(1)
  qte: number;
}

export class CreateChargementTypeDto {
  @ApiProperty({ example: 1 })
  @IsInt()
  salespersonId: number;

  @ApiProperty({ example: 'Chargement Type 1', required: false })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiProperty({ type: [ProductDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ProductDto)
  products: ProductDto[];
}

