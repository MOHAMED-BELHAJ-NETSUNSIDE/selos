import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsString, Min, MinLength } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateLocaliteDto {
  @ApiProperty({ example: 'La Marsa' })
  @IsString()
  @MinLength(2)
  nom: string;

  @ApiProperty({ example: 1, description: 'ID délégation' })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  idDelegation: number;
}


