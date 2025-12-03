import { PartialType, OmitType } from '@nestjs/swagger';
import { CreateUserDto } from './create-user.dto';
import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, MinLength } from 'class-validator';

export class UpdateUserDto extends PartialType(
  OmitType(CreateUserDto, ['password'] as const)
) {
  @ApiProperty({ required: false, minLength: 6 })
  @IsOptional()
  @IsString()
  @MinLength(6)
  password?: string;
}


