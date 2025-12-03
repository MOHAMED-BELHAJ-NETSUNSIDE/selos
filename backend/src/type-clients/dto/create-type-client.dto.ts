import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength } from 'class-validator';

export class CreateTypeClientDto {
  @ApiProperty({ example: 'Entreprise' })
  @IsString()
  @MinLength(2)
  nom: string;
}


