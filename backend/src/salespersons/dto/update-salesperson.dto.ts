import { PartialType, OmitType } from '@nestjs/swagger';
import { CreateSalespersonDto } from './create-salesperson.dto';
import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, MinLength } from 'class-validator';

export class UpdateSalespersonDto extends PartialType(
  OmitType(CreateSalespersonDto, ['password'] as const)
) {
  @ApiProperty({ required: false, minLength: 6, description: 'Nouveau mot de passe pour Selos Retails' })
  @IsOptional()
  @IsString()
  @MinLength(6)
  password?: string;
}

