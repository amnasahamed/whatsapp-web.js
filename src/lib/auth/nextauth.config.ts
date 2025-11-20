/**
 * =============================================================================
 * NEXTAUTH CONFIGURATION
 * =============================================================================
 * NextAuth.js configuration with credentials and JWT strategy
 * =============================================================================
 */

import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { PrismaAdapter } from '@next-auth/prisma-adapter';
import { compare } from 'bcryptjs';
import { prisma } from '@/lib/db/prisma';
import { logger } from '@/lib/utils/logger';

/**
 * NextAuth configuration
 */
export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  session: {
    strategy: 'jwt',
    maxAge: 7 * 24 * 60 * 60, // 7 days
  },
  pages: {
    signIn: '/login',
    signOut: '/login',
    error: '/login',
  },
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          logger.warn('Login attempt with missing credentials');
          return null;
        }

        try {
          // Find user
          const user = await prisma.user.findUnique({
            where: { email: credentials.email },
          });

          if (!user) {
            logger.warn('Login attempt for non-existent user', {
              email: credentials.email,
            });
            return null;
          }

          // Check if user is active
          if (user.status !== 'ACTIVE') {
            logger.warn('Login attempt for inactive user', {
              email: credentials.email,
              status: user.status,
            });
            return null;
          }

          // Verify password
          const isValid = await compare(credentials.password, user.password);

          if (!isValid) {
            logger.warn('Login attempt with invalid password', {
              email: credentials.email,
            });
            return null;
          }

          // Update last login
          await prisma.user.update({
            where: { id: user.id },
            data: { lastLoginAt: new Date() },
          });

          logger.info('User logged in successfully', {
            userId: user.id,
            email: user.email,
          });

          // Return user data
          return {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            avatar: user.avatar,
          };
        } catch (error) {
          logger.error('Error during authentication', { error });
          return null;
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.avatar = user.avatar;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
        session.user.avatar = token.avatar as string | null;
      }
      return session;
    },
  },
  events: {
    async signIn({ user }) {
      logger.info('User signed in', { userId: user.id, email: user.email });
    },
    async signOut({ token }) {
      logger.info('User signed out', { userId: token.id });
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
  debug: process.env.NODE_ENV === 'development',
};
