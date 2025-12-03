import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import axios from 'axios';

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        login: { label: 'Login', type: 'text' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.login || !credentials?.password) {
          return null;
        }

        try {
          const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
          const response = await axios.post(
            `${apiUrl}/auth/login-salesperson`,
            {
              login: credentials.login,
              password: credentials.password,
            },
            {
              headers: {
                'Content-Type': 'application/json',
              },
            }
          );

          if (response.data && response.data.user) {
            return {
              id: response.data.user.id,
              email: response.data.user.email,
              name: `${response.data.user.firstName} ${response.data.user.lastName}`,
              firstName: response.data.user.firstName,
              lastName: response.data.user.lastName,
              role: response.data.user.role,
              accessToken: response.data.access_token,
              typeUser: response.data.user.typeUser,
              salesperson: response.data.user.salesperson,
            };
          }
        } catch (error: any) {
          console.error('Auth error:', error);
          if (error.response?.status === 401) {
            throw new Error('Login ou mot de passe incorrect');
          }
          throw new Error(error.response?.data?.message || 'Erreur lors de la connexion');
        }

        return null;
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.accessToken = user.accessToken;
        token.role = user.role;
        token.firstName = user.firstName;
        token.lastName = user.lastName;
        token.typeUser = user.typeUser;
        token.salesperson = user.salesperson;
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.sub!;
        session.user.accessToken = token.accessToken as string;
        session.user.role = token.role as any;
        session.user.firstName = token.firstName as string;
        session.user.lastName = token.lastName as string;
        session.user.typeUser = token.typeUser as any;
        session.user.salesperson = token.salesperson as any;
      }
      return session;
    },
  },
  pages: {
    signIn: '/auth/signin',
  },
  session: {
    strategy: 'jwt',
  },
};

