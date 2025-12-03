import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength } from 'class-validator';

export class CreateGouvernoratDto {
  @ApiProperty({ example: 'Tunis' })
  @IsString()
  @MinLength(2)
  nom: string;
}


