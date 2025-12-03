import { ApiProperty } from '@nestjs/swagger';

export class AuthResponseDto {
  @ApiProperty()
  access_token: string;

  @ApiProperty()
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: {
      id: string;
      name: string;
      permissions: string[];
    };
    typeUser: {
      id: number;
      nom: string;
    } | null;
    bcLocationId?: number | null;
    salesperson?: {
      id: number;
      login: string;
      code: string | null;
      firstName: string;
      lastName: string;
      depotName: string;
    } | null;
  };
}




