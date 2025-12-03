import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsInt } from 'class-validator';
import { Type } from 'class-transformer';

export class UpdateLocalFieldsDto {
  @ApiProperty({ required: false, description: 'ID du canal local', example: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  localCanalId?: number | null;

  @ApiProperty({ required: false, description: 'ID du type de vente local', example: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  localTypeVenteId?: number | null;
}

