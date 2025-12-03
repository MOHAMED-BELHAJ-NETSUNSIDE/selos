import { IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LoginSalespersonDto {
  @ApiProperty({ example: 'john.doe', description: 'Login du vendeur pour Selos Retails' })
  @IsString()
  @MinLength(3)
  login: string;

  @ApiProperty({ example: 'password123', minLength: 6, description: 'Mot de passe du vendeur' })
  @IsString()
  @MinLength(6)
  password: string;
}

