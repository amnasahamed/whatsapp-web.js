/**
 * =============================================================================
 * CONTACT ROUTER
 * =============================================================================
 * tRPC router for contact operations
 * =============================================================================
 */

import { router, protectedProcedure, createPermissionProcedure } from '../trpc';
import {
  contactCreateSchema,
  contactUpdateSchema,
  contactSearchSchema,
  idSchema,
} from '@/lib/utils/validation';
import { Permission } from '@/lib/auth/permissions';
import { TRPCError } from '@trpc/server';
import { z } from 'zod';

const canReadContact = createPermissionProcedure(Permission.CONTACT_READ);
const canUpdateContact = createPermissionProcedure(Permission.CONTACT_UPDATE);
const canDeleteContact = createPermissionProcedure(Permission.CONTACT_DELETE);

export const contactRouter = router({
  /**
   * Create a contact
   */
  create: canUpdateContact.input(contactCreateSchema).mutation(async ({ ctx, input }) => {
    // Check if contact already exists
    const existing = await ctx.prisma.contact.findFirst({
      where: {
        accountId: input.accountId,
        phoneNumber: input.phoneNumber,
      },
    });

    if (existing) {
      throw new TRPCError({
        code: 'CONFLICT',
        message: 'Contact with this phone number already exists',
      });
    }

    const contact = await ctx.prisma.contact.create({
      data: {
        accountId: input.accountId,
        whatsAppId: `${input.phoneNumber}@c.us`,
        phoneNumber: input.phoneNumber,
        name: input.name || input.phoneNumber,
        email: input.email,
        tags: input.tags || [],
        customFields: input.customFields || {},
      },
    });

    return contact;
  }),

  /**
   * Update a contact
   */
  update: canUpdateContact.input(contactUpdateSchema).mutation(async ({ ctx, input }) => {
    const { id, ...data } = input;

    const contact = await ctx.prisma.contact.update({
      where: { id },
      data,
    });

    return contact;
  }),

  /**
   * Delete a contact
   */
  delete: canDeleteContact.input(idSchema).mutation(async ({ ctx, input }) => {
    await ctx.prisma.contact.delete({
      where: { id: input.id },
    });

    return { success: true };
  }),

  /**
   * Get contact by ID
   */
  getById: canReadContact.input(idSchema).query(async ({ ctx, input }) => {
    const contact = await ctx.prisma.contact.findUnique({
      where: { id: input.id },
      include: {
        conversations: {
          include: {
            _count: {
              select: { messages: true },
            },
          },
          take: 1,
          orderBy: { lastMessageAt: 'desc' },
        },
        _count: {
          select: {
            sentMessages: true,
            receivedMessages: true,
          },
        },
      },
    });

    if (!contact) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'Contact not found',
      });
    }

    return contact;
  }),

  /**
   * Search contacts
   */
  search: canReadContact.input(contactSearchSchema).query(async ({ ctx, input }) => {
    const where: any = {
      accountId: input.accountId,
    };

    // Add query filter
    if (input.query) {
      where.OR = [
        { name: { contains: input.query, mode: 'insensitive' } },
        { phoneNumber: { contains: input.query } },
        { email: { contains: input.query, mode: 'insensitive' } },
      ];
    }

    // Add tags filter
    if (input.tags && input.tags.length > 0) {
      where.tags = {
        hasSome: input.tags,
      };
    }

    const [contacts, total] = await Promise.all([
      ctx.prisma.contact.findMany({
        where,
        take: input.limit,
        skip: input.offset,
        orderBy: { lastMessageAt: 'desc' },
      }),
      ctx.prisma.contact.count({ where }),
    ]);

    return {
      contacts,
      total,
      hasMore: input.offset + input.limit < total,
    };
  }),

  /**
   * Get all contacts for an account
   */
  getAll: canReadContact
    .input(
      z.object({
        accountId: z.string().cuid(),
        limit: z.number().int().min(1).max(100).default(50),
        offset: z.number().int().min(0).default(0),
      })
    )
    .query(async ({ ctx, input }) => {
      const [contacts, total] = await Promise.all([
        ctx.prisma.contact.findMany({
          where: { accountId: input.accountId },
          take: input.limit,
          skip: input.offset,
          orderBy: { lastMessageAt: 'desc' },
        }),
        ctx.prisma.contact.count({
          where: { accountId: input.accountId },
        }),
      ]);

      return {
        contacts,
        total,
        hasMore: input.offset + input.limit < total,
      };
    }),

  /**
   * Add tags to contact
   */
  addTags: canUpdateContact
    .input(z.object({ id: z.string().cuid(), tags: z.array(z.string()) }))
    .mutation(async ({ ctx, input }) => {
      const contact = await ctx.prisma.contact.findUnique({
        where: { id: input.id },
      });

      if (!contact) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Contact not found',
        });
      }

      const updatedTags = [...new Set([...contact.tags, ...input.tags])];

      const updated = await ctx.prisma.contact.update({
        where: { id: input.id },
        data: { tags: updatedTags },
      });

      return updated;
    }),

  /**
   * Remove tags from contact
   */
  removeTags: canUpdateContact
    .input(z.object({ id: z.string().cuid(), tags: z.array(z.string()) }))
    .mutation(async ({ ctx, input }) => {
      const contact = await ctx.prisma.contact.findUnique({
        where: { id: input.id },
      });

      if (!contact) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Contact not found',
        });
      }

      const updatedTags = contact.tags.filter((tag) => !input.tags.includes(tag));

      const updated = await ctx.prisma.contact.update({
        where: { id: input.id },
        data: { tags: updatedTags },
      });

      return updated;
    }),

  /**
   * Block/unblock contact
   */
  toggleBlock: canUpdateContact
    .input(z.object({ id: z.string().cuid(), blocked: z.boolean() }))
    .mutation(async ({ ctx, input }) => {
      const contact = await ctx.prisma.contact.update({
        where: { id: input.id },
        data: { isBlocked: input.blocked },
      });

      return contact;
    }),
});
