import { PartialType, ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsInt, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { CreateDelegationDto } from './create-delegation.dto';

export class UpdateDelegationDto extends PartialType(CreateDelegationDto) {
  @ApiProperty({ example: 1, description: 'ID gouvernorat', required: false })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  id_gouvernorat?: number;
}


