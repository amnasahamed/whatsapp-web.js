/**
 * =============================================================================
 * TRPC API ROUTE HANDLER
 * =============================================================================
 * Next.js API route handler for tRPC requests
 * =============================================================================
 */

import { fetchRequestHandler } from '@trpc/server/adapters/fetch';
import { appRouter } from '@/lib/trpc/router';
import { createContext } from '@/lib/trpc/context';

const handler = (req: Request) =>
  fetchRequestHandler({
    endpoint: '/api/trpc',
    req,
    router: appRouter,
    createContext,
    onError:
      process.env.NODE_ENV === 'development'
        ? ({ path, error }) => {
            console.error(
              `❌ tRPC failed on ${path ?? '<no-path>'}:`,
              error.message
            );
          }
        : undefined,
  });

export { handler as GET, handler as POST };
