import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength } from 'class-validator';

export class CreateTypeVenteDto {
  @ApiProperty({ example: 'Détail' })
  @IsString()
  @MinLength(2)
  nom: string;
}


