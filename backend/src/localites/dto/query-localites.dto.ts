import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsInt, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

export class QueryLocalitesDto {
  @ApiProperty({ required: false, description: 'Nombre de résultats à retourner', default: 100, maximum: 1000 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(1000)
  limit?: number = 100;

  @ApiProperty({ required: false, description: 'Nombre de résultats à ignorer', default: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  offset?: number = 0;
}

