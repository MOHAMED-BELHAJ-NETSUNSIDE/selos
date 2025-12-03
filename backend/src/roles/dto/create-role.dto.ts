import { IsString, IsArray, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateRoleDto {
  @ApiProperty({ example: 'Manager' })
  @IsString()
  @MinLength(2)
  name: string;

  @ApiProperty({ 
    example: ['clients:read', 'clients:write', 'users:read'],
    description: 'Array of permissions'
  })
  @IsArray()
  @IsString({ each: true })
  permissions: string[];
}




