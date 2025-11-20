/**
 * =============================================================================
 * PRISMA CLIENT - Database Connection
 * =============================================================================
 * Singleton Prisma client with connection pooling and logging
 * =============================================================================
 */

import { PrismaClient } from '@prisma/client';
import { logger } from '@/lib/utils/logger';

/**
 * Prisma client instance type
 */
declare global {
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined;
}

/**
 * Create Prisma client with environment-aware configuration
 */
const createPrismaClient = () => {
  const isDevelopment = process.env.NODE_ENV === 'development';

  return new PrismaClient({
    log: isDevelopment
      ? [
          { emit: 'event', level: 'query' },
          { emit: 'event', level: 'error' },
          { emit: 'event', level: 'warn' },
        ]
      : [{ emit: 'event', level: 'error' }],
  });
};

/**
 * Singleton Prisma client
 * In development, use global to prevent multiple instances during hot reload
 */
export const prisma = global.prisma || createPrismaClient();

if (process.env.NODE_ENV !== 'production') {
  global.prisma = prisma;
}

/**
 * Setup Prisma logging
 */
if (process.env.NODE_ENV === 'development') {
  prisma.$on('query' as never, (e: any) => {
    logger.debug({
      type: 'prisma_query',
      query: e.query,
      params: e.params,
      duration: e.duration,
    });
  });
}

prisma.$on('error' as never, (e: any) => {
  logger.error({
    type: 'prisma_error',
    message: e.message,
    target: e.target,
  });
});

prisma.$on('warn' as never, (e: any) => {
  logger.warn({
    type: 'prisma_warn',
    message: e.message,
  });
});

/**
 * Graceful shutdown
 */
const gracefulShutdown = async () => {
  logger.info('Disconnecting Prisma client...');
  await prisma.$disconnect();
  logger.info('Prisma client disconnected');
};

process.on('SIGINT', gracefulShutdown);
process.on('SIGTERM', gracefulShutdown);

/**
 * Test database connection
 */
export const testDatabaseConnection = async (): Promise<boolean> => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    logger.info('Database connection successful');
    return true;
  } catch (error) {
    logger.error('Database connection failed', { error });
    return false;
  }
};

/**
 * Export Prisma types for convenience
 */
export type { Prisma, PrismaClient } from '@prisma/client';
