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
  }
}




