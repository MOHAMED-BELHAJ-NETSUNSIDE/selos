import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength, IsNumber, IsArray, ArrayMinSize } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateSecteurDto {
  @ApiProperty({ example: 'Secteur Nord', description: 'Nom du secteur (obligatoire)' })
  @IsString({ message: 'Le nom est requis' })
  @MinLength(2, { message: 'Le nom doit contenir au moins 2 caractères' })
  nom: string;

  @ApiProperty({ example: [1, 2], description: 'Canal ids' })
  @IsArray()
  @IsNumber({}, { each: true })
  @Type(() => Number)
  @ArrayMinSize(1, { message: 'Au moins un canal est requis' })
  canalIds: number[];
}


