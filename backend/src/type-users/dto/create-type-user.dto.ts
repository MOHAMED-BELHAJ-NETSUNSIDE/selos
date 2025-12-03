import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength } from 'class-validator';

export class CreateTypeUserDto {
  @ApiProperty({ example: 'Responsable' })
  @IsString()
  @MinLength(2)
  nom: string;
}


