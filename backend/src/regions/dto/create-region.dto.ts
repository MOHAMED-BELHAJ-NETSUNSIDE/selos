import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength } from 'class-validator';

export class CreateRegionDto {
  @ApiProperty({ example: 'Rabat-Salé-Kénitra' })
  @IsString()
  @MinLength(2)
  nom: string;
}


