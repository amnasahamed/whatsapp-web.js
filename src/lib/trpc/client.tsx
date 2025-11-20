/**
 * =============================================================================
 * TRPC CLIENT - Client-side tRPC Setup
 * =============================================================================
 * Type-safe API client for React components
 * =============================================================================
 */

'use client';

import { createTRPCReact } from '@trpc/react-query';
import { httpBatchLink } from '@trpc/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState } from 'react';
import superjson from 'superjson';
import type { AppRouter } from '@/lib/trpc/router';

/**
 * Create tRPC React hooks
 */
export const trpc = createTRPCReact<AppRouter>();

/**
 * Create tRPC client
 */
function createTRPCClient() {
  return trpc.createClient({
    transformer: superjson,
    links: [
      httpBatchLink({
        url: '/api/trpc',
        headers() {
          return {
            'content-type': 'application/json',
          };
        },
      }),
    ],
  });
}

/**
 * tRPC Provider Component
 */
export function TRPCProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 5 * 1000, // 5 seconds
        refetchOnWindowFocus: false,
      },
    },
  }));

  const [trpcClient] = useState(() => createTRPCClient());

  return (
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    </trpc.Provider>
  );
}
