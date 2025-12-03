import { ApiProperty } from '@nestjs/swagger';
import { IsArray, ValidateNested, IsNumber, IsString, IsIn, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';

export class CircuitCommercialZoneDto {
  @ApiProperty({ example: 1, description: 'Zone id' })
  @IsNumber()
  zoneId: number;

  @ApiProperty({ example: 1, description: 'Jour de la semaine (1=Lundi, 2=Mardi, ..., 7=Dimanche)' })
  @IsNumber()
  @IsIn([1, 2, 3, 4, 5, 6, 7])
  jour: number;

  @ApiProperty({ example: 'semaine', enum: ['semaine', 'quinzaine', 'mois'] })
  @IsString()
  @IsIn(['semaine', 'quinzaine', 'mois'])
  frequence: string;

  @ApiProperty({ example: '1,3', description: 'Groupes pour quinzaine (1,3 ou 2,4) ou mois (1, 2, 3 ou 4)', required: false })
  @IsOptional()
  @IsString()
  groupes?: string;
}

export class UpdateCircuitCommercialDto {
  @ApiProperty({ type: [CircuitCommercialZoneDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CircuitCommercialZoneDto)
  zones: CircuitCommercialZoneDto[];
}


