import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength, IsNumber, IsArray, ArrayMinSize, IsOptional, IsIn } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateZoneDto {
  @ApiProperty({ example: 'Zone Est' })
  @IsString()
  @MinLength(2)
  nom: string;

  @ApiProperty({ example: [1, 2], description: 'Canal ids' })
  @IsArray()
  @IsNumber({}, { each: true })
  @Type(() => Number)
  @ArrayMinSize(1, { message: 'Au moins un canal est requis' })
  canalIds: number[];

  @ApiProperty({ example: [1, 2], description: 'Type de vente ids' })
  @IsArray()
  @IsNumber({}, { each: true })
  @Type(() => Number)
  @ArrayMinSize(1, { message: 'Au moins un type de vente est requis' })
  typeVenteIds: number[];

  @ApiProperty({ example: [1, 2], description: 'Localité ids', required: false })
  @IsOptional()
  @IsArray()
  @IsNumber({}, { each: true })
  @Type(() => Number)
  localiteIds?: number[];

  @ApiProperty({ example: 'Par semaine', description: 'Fréquence de visite', enum: ['Par semaine', 'Par quinzaine', 'Par mois'], required: true })
  @IsString({ message: 'La fréquence de visite est requise' })
  @IsIn(['Par semaine', 'Par quinzaine', 'Par mois'], { message: 'La fréquence de visite doit être: Par semaine, Par quinzaine ou Par mois' })
  frequenceVisite: string;
}


