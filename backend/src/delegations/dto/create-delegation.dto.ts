import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsString, Min, MinLength } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateDelegationDto {
  @ApiProperty({ example: 'Ariana Ville' })
  @IsString()
  @MinLength(2)
  nom: string;

  @ApiProperty({ example: 1, description: 'ID gouvernorat' })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  id_gouvernorat: number;
}


