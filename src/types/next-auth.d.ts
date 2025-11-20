/**
 * =============================================================================
 * NEXTAUTH TYPE DEFINITIONS
 * =============================================================================
 * Extend NextAuth types with custom fields
 * =============================================================================
 */

import { DefaultSession, DefaultUser } from 'next-auth';
import { UserRole } from '@prisma/client';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      role: UserRole;
      avatar: string | null;
    } & DefaultSession['user'];
  }

  interface User extends DefaultUser {
    role: UserRole;
    avatar: string | null;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string;
    role: UserRole;
    avatar: string | null;
  }
}
