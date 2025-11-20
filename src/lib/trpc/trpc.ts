/**
 * =============================================================================
 * TRPC INSTANCE
 * =============================================================================
 * Core tRPC instance with procedures and middleware
 * =============================================================================
 */

import { initTRPC, TRPCError } from '@trpc/server';
import { type TRPCContext } from './context';
import { Permission, hasPermission } from '@/lib/auth/permissions';
import { UserRole } from '@prisma/client';
import superjson from 'superjson';
import { ZodError } from 'zod';

/**
 * Initialize tRPC
 */
const t = initTRPC.context<TRPCContext>().create({
  transformer: superjson,
  errorFormatter({ shape, error }) {
    return {
      ...shape,
      data: {
        ...shape.data,
        zodError:
          error.cause instanceof ZodError ? error.cause.flatten() : null,
      },
    };
  },
});

/**
 * Export reusable router and procedure helpers
 */
export const router = t.router;
export const publicProcedure = t.procedure;

/**
 * Protected procedure - requires authentication
 */
export const protectedProcedure = t.procedure.use(async ({ ctx, next }) => {
  if (!ctx.session || !ctx.session.user) {
    throw new TRPCError({
      code: 'UNAUTHORIZED',
      message: 'You must be logged in to access this resource',
    });
  }

  return next({
    ctx: {
      ...ctx,
      session: {
        ...ctx.session,
        user: ctx.session.user,
      },
    },
  });
});

/**
 * Create permission-based procedure
 */
export const createPermissionProcedure = (permission: Permission) => {
  return protectedProcedure.use(async ({ ctx, next }) => {
    const userRole = ctx.session.user.role as UserRole;

    if (!hasPermission(userRole, permission)) {
      throw new TRPCError({
        code: 'FORBIDDEN',
        message: `You don't have permission to perform this action. Required: ${permission}`,
      });
    }

    return next({ ctx });
  });
};

/**
 * Admin-only procedure
 */
export const adminProcedure = protectedProcedure.use(async ({ ctx, next }) => {
  const userRole = ctx.session.user.role as UserRole;

  if (userRole !== 'ADMIN' && userRole !== 'OWNER') {
    throw new TRPCError({
      code: 'FORBIDDEN',
      message: 'This action requires admin privileges',
    });
  }

  return next({ ctx });
});

/**
 * Owner-only procedure
 */
export const ownerProcedure = protectedProcedure.use(async ({ ctx, next }) => {
  const userRole = ctx.session.user.role as UserRole;

  if (userRole !== 'OWNER') {
    throw new TRPCError({
      code: 'FORBIDDEN',
      message: 'This action requires owner privileges',
    });
  }

  return next({ ctx });
});

/**
 * Middleware builder
 */
export const middleware = t.middleware;
export const mergeRouters = t.mergeRouters;
