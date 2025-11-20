/**
 * =============================================================================
 * TRPC CONTEXT
 * =============================================================================
 * Context creation for tRPC procedures
 * =============================================================================
 */

import { getServerSession } from 'next-auth/next';
import type { Session } from 'next-auth';
import { authOptions } from '@/lib/auth/nextauth.config';
import { prisma } from '@/lib/db/prisma';
import { redis } from '@/lib/db/redis';

/**
 * Context for tRPC procedures
 */
export interface Context {
  session: Session | null;
  prisma: typeof prisma;
  redis: typeof redis;
}

/**
 * Create context for tRPC
 * This runs for every request
 */
export async function createContext(): Promise<Context> {
  const session = await getServerSession(authOptions);

  return {
    session,
    prisma,
    redis,
  };
}

export type TRPCContext = Awaited<ReturnType<typeof createContext>>;
