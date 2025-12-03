import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import axios from 'axios';

export const authOptions: NextAuthOptions = {
  secret: process.env.NEXTAUTH_SECRET || 'fallback-secret-change-in-production',
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        try {
          const response = await axios.post(
            `${process.env.NEXT_PUBLIC_API_URL}/auth/login`,
            {
              email: credentials.email,
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
              bcLocationId: response.data.user.bcLocationId || null,
              accessToken: response.data.access_token,
            };
          }
        } catch (error: any) {
          console.error('Auth error:', error);
          console.error('Error details:', error?.response?.data);
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
        token.bcLocationId = (user as any).bcLocationId;
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
        (session.user as any).bcLocationId = token.bcLocationId as string | null;
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
