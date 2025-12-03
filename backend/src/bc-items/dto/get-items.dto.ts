import { IsOptional, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class GetItemsDto {
  @ApiProperty({ required: false, description: 'Search by display name or number' })
  @IsOptional()
  @IsString()
  search?: string;
}

