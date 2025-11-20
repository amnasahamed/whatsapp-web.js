/**
 * =============================================================================
 * MAIN TRPC ROUTER
 * =============================================================================
 * Combines all sub-routers into the main app router
 * =============================================================================
 */

import { router } from './trpc';
import { messageRouter } from './routers/message';
import { contactRouter } from './routers/contact';
import { whatsappRouter } from './routers/whatsapp';

/**
 * Main application router
 * Export type definition for client
 */
export const appRouter = router({
  message: messageRouter,
  contact: contactRouter,
  whatsapp: whatsappRouter,
});

// Export type definition
export type AppRouter = typeof appRouter;
