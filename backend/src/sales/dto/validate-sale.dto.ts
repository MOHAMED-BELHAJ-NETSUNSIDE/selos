import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class ValidateSaleDto {
  @ApiProperty({ description: 'Commentaire de validation (optionnel)', required: false })
  @IsOptional()
  @IsString()
  comment?: string;
}

