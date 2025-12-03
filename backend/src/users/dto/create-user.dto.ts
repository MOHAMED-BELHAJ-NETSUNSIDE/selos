import { IsString, IsEmail, MinLength, IsOptional, IsBoolean, IsNumber, ValidateIf } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class CreateUserDto {
  @ApiProperty({ example: 'john.doe@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'password123', minLength: 6 })
  @IsString()
  @MinLength(6)
  password: string;

  @ApiProperty({ example: 'John' })
  @IsString()
  @MinLength(2)
  firstName: string;

  @ApiProperty({ example: 'Doe' })
  @IsString()
  @MinLength(2)
  lastName: string;

  @ApiProperty({ example: 'role-id-here' })
  @IsString()
  roleId: string;

  @ApiProperty({ example: true, required: false })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean = true;

  @ApiProperty({ example: 1, description: 'Type user id' })
  @Type(() => Number)
  @IsNumber()
  typeUserId: number;

  @ApiProperty({ example: 1, required: false, description: 'Secteur id' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  secteurId?: number;

  @ApiProperty({ example: 1, required: false, description: 'Region id' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  regionId?: number;

  @ApiProperty({ example: 1, required: false, description: 'Canal id' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  canalId?: number;

  @ApiProperty({ example: 1, required: false, description: 'Type vente id' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  typeVenteId?: number;

  @ApiProperty({ example: '74331f6f-bd37-f011-9a4a-000d3a898d22', required: false, description: 'BC Location bcId (GUID)', nullable: true })
  @IsOptional()
  @ValidateIf((o) => o.bcLocationId !== null)
  @IsString()
  bcLocationId?: string | null;
}


