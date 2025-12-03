import { DefaultSession } from 'next-auth';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      accessToken: string;
      role: {
        id: string;
        name: string;
        permissions: string[];
      };
      firstName: string;
      lastName: string;
      typeUser?: {
        id: number;
        nom: string;
      };
      salesperson?: {
        id: number;
        code: string | null;
        firstName: string;
        lastName: string;
        depotName: string;
      };
    } & DefaultSession['user'];
  }

  interface User {
    accessToken: string;
    role: {
      id: string;
      name: string;
      permissions: string[];
    };
    firstName: string;
    lastName: string;
    typeUser?: {
      id: number;
      nom: string;
    };
    salesperson?: {
      id: number;
      code: string | null;
      firstName: string;
      lastName: string;
      depotName: string;
    };
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    accessToken: string;
    role: {
      id: string;
      name: string;
      permissions: string[];
    };
    firstName: string;
    lastName: string;
    typeUser?: {
      id: number;
      nom: string;
    };
    salesperson?: {
      id: number;
      code: string | null;
      firstName: string;
      lastName: string;
      depotName: string;
    };
  }
}

