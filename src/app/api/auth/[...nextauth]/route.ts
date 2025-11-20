/**
 * =============================================================================
 * NEXTAUTH API ROUTE HANDLER
 * =============================================================================
 * Next.js API route handler for NextAuth.js authentication
 * =============================================================================
 */

import NextAuth from 'next-auth';
import { authOptions } from '@/lib/auth/nextauth.config';

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
