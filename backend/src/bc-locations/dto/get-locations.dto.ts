import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class GetLocationsDto {
  @ApiProperty({ required: false, description: 'Recherche par nom ou code' })
  @IsOptional()
  @IsString()
  search?: string;
}

