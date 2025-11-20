/**
 * =============================================================================
 * WHATSAPP ROUTER
 * =============================================================================
 * tRPC router for WhatsApp account operations
 * =============================================================================
 */

import { router, protectedProcedure, createPermissionProcedure } from '../trpc';
import { whatsappAccountCreateSchema, whatsappAccountUpdateSchema, idSchema } from '@/lib/utils/validation';
import { Permission } from '@/lib/auth/permissions';
import { whatsAppManager } from '@/lib/services/whatsapp/WhatsAppManager';
import { TRPCError } from '@trpc/server';
import { z } from 'zod';

const canManageAccounts = createPermissionProcedure(Permission.ACCOUNT_UPDATE);
const canReadAccounts = createPermissionProcedure(Permission.ACCOUNT_READ);
const canCreateAccounts = createPermissionProcedure(Permission.ACCOUNT_CREATE);
const canDeleteAccounts = createPermissionProcedure(Permission.ACCOUNT_DELETE);

export const whatsappRouter = router({
  /**
   * Create a new WhatsApp account
   */
  create: canCreateAccounts.input(whatsappAccountCreateSchema).mutation(async ({ ctx, input }) => {
    const sessionId = input.sessionId || `session_${Date.now()}`;

    // Create in database
    const account = await ctx.prisma.whatsAppAccount.create({
      data: {
        name: input.name,
        sessionId,
        status: 'DISCONNECTED',
        isActive: true,
      },
    });

    // Initialize WhatsApp client
    try {
      await whatsAppManager.addAccount({
        accountId: account.id,
        sessionId: account.sessionId,
        authStrategy: 'LocalAuth',
        headless: true,
      });
    } catch (error) {
      // Delete from database if initialization fails
      await ctx.prisma.whatsAppAccount.delete({
        where: { id: account.id },
      });

      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: error instanceof Error ? error.message : 'Failed to initialize WhatsApp account',
      });
    }

    return account;
  }),

  /**
   * Get all WhatsApp accounts
   */
  getAll: canReadAccounts.query(async ({ ctx }) => {
    const accounts = await ctx.prisma.whatsAppAccount.findMany({
      where: { isActive: true },
      orderBy: { createdAt: 'desc' },
    });

    // Enrich with live status from manager
    return accounts.map((account) => ({
      ...account,
      liveStatus: whatsAppManager.getAccountStatus(account.id),
      isConnected: whatsAppManager.hasAccount(account.id),
    }));
  }),

  /**
   * Get account by ID
   */
  getById: canReadAccounts.input(idSchema).query(async ({ ctx, input }) => {
    const account = await ctx.prisma.whatsAppAccount.findUnique({
      where: { id: input.id },
    });

    if (!account) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'WhatsApp account not found',
      });
    }

    return {
      ...account,
      liveStatus: whatsAppManager.getAccountStatus(account.id),
      isConnected: whatsAppManager.hasAccount(account.id),
    };
  }),

  /**
   * Update account
   */
  update: canManageAccounts.input(whatsappAccountUpdateSchema).mutation(async ({ ctx, input }) => {
    const { id, ...data } = input;

    const account = await ctx.prisma.whatsAppAccount.update({
      where: { id },
      data,
    });

    return account;
  }),

  /**
   * Delete account
   */
  delete: canDeleteAccounts.input(idSchema).mutation(async ({ ctx, input }) => {
    // Remove from manager first
    if (whatsAppManager.hasAccount(input.id)) {
      await whatsAppManager.removeAccount(input.id);
    }

    // Delete from database
    await ctx.prisma.whatsAppAccount.delete({
      where: { id: input.id },
    });

    return { success: true };
  }),

  /**
   * Get QR code for account
   */
  getQRCode: canReadAccounts.input(idSchema).query(async ({ ctx, input }) => {
    const account = await ctx.prisma.whatsAppAccount.findUnique({
      where: { id: input.id },
      select: { qrCode: true, status: true },
    });

    if (!account) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'WhatsApp account not found',
      });
    }

    return {
      qrCode: account.qrCode,
      status: account.status,
    };
  }),

  /**
   * Disconnect account
   */
  disconnect: canManageAccounts.input(idSchema).mutation(async ({ ctx, input }) => {
    if (whatsAppManager.hasAccount(input.id)) {
      await whatsAppManager.removeAccount(input.id);
    }

    await ctx.prisma.whatsAppAccount.update({
      where: { id: input.id },
      data: {
        status: 'DISCONNECTED',
        qrCode: null,
      },
    });

    return { success: true };
  }),

  /**
   * Reconnect account
   */
  reconnect: canManageAccounts.input(idSchema).mutation(async ({ ctx, input }) => {
    const account = await ctx.prisma.whatsAppAccount.findUnique({
      where: { id: input.id },
    });

    if (!account) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'WhatsApp account not found',
      });
    }

    // Remove existing connection if any
    if (whatsAppManager.hasAccount(input.id)) {
      await whatsAppManager.removeAccount(input.id);
    }

    // Reconnect
    await whatsAppManager.addAccount({
      accountId: account.id,
      sessionId: account.sessionId,
      authStrategy: 'LocalAuth',
      headless: true,
    });

    return { success: true };
  }),

  /**
   * Get account statistics
   */
  getStats: canReadAccounts.input(idSchema).query(async ({ ctx, input }) => {
    const [
      totalContacts,
      totalConversations,
      totalMessages,
      todayMessages,
    ] = await Promise.all([
      ctx.prisma.contact.count({ where: { accountId: input.id } }),
      ctx.prisma.conversation.count({ where: { accountId: input.id } }),
      ctx.prisma.message.count({ where: { accountId: input.id } }),
      ctx.prisma.message.count({
        where: {
          accountId: input.id,
          createdAt: {
            gte: new Date(new Date().setHours(0, 0, 0, 0)),
          },
        },
      }),
    ]);

    return {
      totalContacts,
      totalConversations,
      totalMessages,
      todayMessages,
    };
  }),
});
