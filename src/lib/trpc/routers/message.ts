/**
 * =============================================================================
 * MESSAGE ROUTER
 * =============================================================================
 * tRPC router for message operations
 * =============================================================================
 */

import { router, protectedProcedure, createPermissionProcedure } from '../trpc';
import { sendMessageSchema, getMessagesSchema, idSchema } from '@/lib/utils/validation';
import { Permission } from '@/lib/auth/permissions';
import { whatsAppManager } from '@/lib/services/whatsapp/WhatsAppManager';
import { TRPCError } from '@trpc/server';
import { z } from 'zod';

const canSendMessage = createPermissionProcedure(Permission.MESSAGE_SEND);
const canReadMessage = createPermissionProcedure(Permission.MESSAGE_READ);
const canDeleteMessage = createPermissionProcedure(Permission.MESSAGE_DELETE);

export const messageRouter = router({
  /**
   * Send a message
   */
  send: canSendMessage.input(sendMessageSchema).mutation(async ({ ctx, input }) => {
    try {
      // Send message via WhatsApp Manager
      const result = await whatsAppManager.sendMessage(input);

      if (!result.success) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: result.error || 'Failed to send message',
        });
      }

      // Save to database
      const contact = await ctx.prisma.contact.findFirst({
        where: {
          accountId: input.accountId,
          phoneNumber: input.to,
        },
      });

      if (contact) {
        const conversation = await ctx.prisma.conversation.upsert({
          where: {
            accountId_contactId: {
              accountId: input.accountId,
              contactId: contact.id,
            },
          },
          create: {
            accountId: input.accountId,
            contactId: contact.id,
            lastMessageAt: new Date(),
          },
          update: {
            lastMessageAt: new Date(),
          },
        });

        await ctx.prisma.message.create({
          data: {
            whatsAppId: result.messageId,
            type: input.media ? 'IMAGE' : 'TEXT',
            direction: 'OUTBOUND',
            content: input.content,
            conversationId: conversation.id,
            accountId: input.accountId,
            fromContactId: contact.id,
            toContactId: contact.id,
            sentById: ctx.session.user.id,
            sentAt: result.sentAt,
            status: 'SENT',
          },
        });
      }

      return {
        success: true,
        messageId: result.messageId,
        sentAt: result.sentAt,
      };
    } catch (error) {
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: error instanceof Error ? error.message : 'Failed to send message',
      });
    }
  }),

  /**
   * Get messages for a conversation
   */
  getMessages: canReadMessage.input(getMessagesSchema).query(async ({ ctx, input }) => {
    const messages = await ctx.prisma.message.findMany({
      where: {
        conversationId: input.conversationId,
      },
      include: {
        fromContact: {
          select: {
            id: true,
            name: true,
            phoneNumber: true,
            profilePicUrl: true,
          },
        },
        sentBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: input.limit,
      ...(input.cursor && {
        skip: 1,
        cursor: {
          id: input.cursor,
        },
      }),
    });

    return {
      messages,
      nextCursor: messages.length === input.limit ? messages[messages.length - 1]?.id : undefined,
    };
  }),

  /**
   * Get message by ID
   */
  getById: canReadMessage.input(idSchema).query(async ({ ctx, input }) => {
    const message = await ctx.prisma.message.findUnique({
      where: { id: input.id },
      include: {
        fromContact: true,
        toContact: true,
        conversation: {
          include: {
            contact: true,
          },
        },
        sentBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    if (!message) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'Message not found',
      });
    }

    return message;
  }),

  /**
   * Delete a message
   */
  delete: canDeleteMessage.input(idSchema).mutation(async ({ ctx, input }) => {
    const message = await ctx.prisma.message.findUnique({
      where: { id: input.id },
    });

    if (!message) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'Message not found',
      });
    }

    await ctx.prisma.message.delete({
      where: { id: input.id },
    });

    return { success: true };
  }),

  /**
   * Mark messages as read
   */
  markAsRead: canReadMessage
    .input(z.object({ conversationId: z.string().cuid() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.prisma.conversation.update({
        where: { id: input.conversationId },
        data: { isUnread: false },
      });

      return { success: true };
    }),

  /**
   * Get recent messages (dashboard)
   */
  getRecent: canReadMessage
    .input(
      z.object({
        accountId: z.string().cuid().optional(),
        limit: z.number().int().min(1).max(50).default(10),
      })
    )
    .query(async ({ ctx, input }) => {
      const messages = await ctx.prisma.message.findMany({
        where: {
          ...(input.accountId && { accountId: input.accountId }),
        },
        include: {
          fromContact: {
            select: {
              name: true,
              phoneNumber: true,
            },
          },
          conversation: {
            select: {
              id: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        take: input.limit,
      });

      return messages;
    }),
});
