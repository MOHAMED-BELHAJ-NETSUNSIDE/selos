import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength } from 'class-validator';

export class CreateSousRegionDto {
  @ApiProperty({ example: 'Sous-région Centre' })
  @IsString()
  @MinLength(2)
  nom: string;
}


