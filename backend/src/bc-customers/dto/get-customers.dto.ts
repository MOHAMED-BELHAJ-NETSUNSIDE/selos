import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class GetCustomersDto {
  @ApiProperty({ required: false, description: 'Recherche par nom ou numéro' })
  @IsOptional()
  @IsString()
  search?: string;
}

