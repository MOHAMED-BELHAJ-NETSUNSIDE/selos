import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength } from 'class-validator';

export class CreateCanalDto {
  @ApiProperty({ example: 'GMS' })
  @IsString()
  @MinLength(2)
  nom: string;
}


