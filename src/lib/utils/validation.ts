/**
 * =============================================================================
 * VALIDATION SCHEMAS - Zod Schemas
 * =============================================================================
 * Centralized validation schemas for type-safe input validation
 * =============================================================================
 */

import { z } from 'zod';
import { UserRole, UserStatus } from '@prisma/client';

/**
 * User schemas
 */
export const userCreateSchema = z.object({
  email: z.string().email('Invalid email address'),
  name: z.string().min(2, 'Name must be at least 2 characters'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  role: z.nativeEnum(UserRole).default('AGENT'),
});

export const userUpdateSchema = z.object({
  id: z.string().cuid(),
  name: z.string().min(2).optional(),
  email: z.string().email().optional(),
  role: z.nativeEnum(UserRole).optional(),
  status: z.nativeEnum(UserStatus).optional(),
  avatar: z.string().url().nullable().optional(),
});

export const userLoginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

/**
 * WhatsApp account schemas
 */
export const whatsappAccountCreateSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  sessionId: z.string().optional(),
});

export const whatsappAccountUpdateSchema = z.object({
  id: z.string().cuid(),
  name: z.string().min(2).optional(),
  isActive: z.boolean().optional(),
});

/**
 * Message schemas
 */
export const sendMessageSchema = z.object({
  accountId: z.string().cuid('Invalid account ID'),
  to: z.string().min(5, 'Invalid phone number'),
  content: z.string().min(1, 'Message cannot be empty'),
  quotedMessageId: z.string().optional(),
  mentions: z.array(z.string()).optional(),
  media: z
    .object({
      data: z.string(), // base64
      mimetype: z.string(),
      filename: z.string().optional(),
      caption: z.string().optional(),
    })
    .optional(),
});

export const getMessagesSchema = z.object({
  conversationId: z.string().cuid(),
  limit: z.number().int().min(1).max(100).default(50),
  cursor: z.string().optional(),
});

/**
 * Contact schemas
 */
export const contactCreateSchema = z.object({
  accountId: z.string().cuid(),
  phoneNumber: z.string().min(5),
  name: z.string().optional(),
  email: z.string().email().optional(),
  tags: z.array(z.string()).optional(),
  customFields: z.record(z.string(), z.any()).optional(),
});

export const contactUpdateSchema = z.object({
  id: z.string().cuid(),
  name: z.string().optional(),
  email: z.string().email().optional(),
  tags: z.array(z.string()).optional(),
  customFields: z.record(z.string(), z.any()).optional(),
  isBlocked: z.boolean().optional(),
});

export const contactSearchSchema = z.object({
  accountId: z.string().cuid(),
  query: z.string().optional(),
  tags: z.array(z.string()).optional(),
  limit: z.number().int().min(1).max(100).default(20),
  offset: z.number().int().min(0).default(0),
});

/**
 * Conversation schemas
 */
export const conversationUpdateSchema = z.object({
  id: z.string().cuid(),
  status: z.enum(['OPEN', 'PENDING', 'RESOLVED', 'CLOSED']).optional(),
  assignedToId: z.string().cuid().nullable().optional(),
  isPinned: z.boolean().optional(),
  isMuted: z.boolean().optional(),
});

export const conversationNoteCreateSchema = z.object({
  conversationId: z.string().cuid(),
  content: z.string().min(1, 'Note cannot be empty'),
});

/**
 * AI configuration schemas
 */
export const aiConfigCreateSchema = z.object({
  name: z.string().min(2),
  provider: z.enum(['OPENAI', 'ANTHROPIC', 'GEMINI', 'CUSTOM']),
  apiKey: z.string().min(10, 'Invalid API key'),
  model: z.string().min(1),
  maxTokens: z.number().int().min(1).max(100000).default(2000),
  temperature: z.number().min(0).max(2).default(0.7),
  customEndpoint: z.string().url().optional(),
  systemPrompt: z.string().optional(),
});

export const aiConfigUpdateSchema = z.object({
  id: z.string().cuid(),
  name: z.string().min(2).optional(),
  apiKey: z.string().min(10).optional(),
  model: z.string().min(1).optional(),
  maxTokens: z.number().int().min(1).max(100000).optional(),
  temperature: z.number().min(0).max(2).optional(),
  isActive: z.boolean().optional(),
  isDefault: z.boolean().optional(),
  systemPrompt: z.string().optional(),
});

/**
 * Automation schemas
 */
export const automationCreateSchema = z.object({
  name: z.string().min(2),
  description: z.string().optional(),
  accountId: z.string().cuid(),
  triggerType: z.enum([
    'MESSAGE_RECEIVED',
    'MESSAGE_CONTAINS',
    'NEW_CONTACT',
    'SCHEDULED',
    'WEBHOOK',
  ]),
  triggerConditions: z.record(z.string(), z.any()),
  actions: z.array(z.record(z.string(), z.any())),
});

export const automationUpdateSchema = z.object({
  id: z.string().cuid(),
  name: z.string().min(2).optional(),
  description: z.string().optional(),
  status: z.enum(['ACTIVE', 'PAUSED', 'DRAFT']).optional(),
  triggerConditions: z.record(z.string(), z.any()).optional(),
  actions: z.array(z.record(z.string(), z.any())).optional(),
});

/**
 * Campaign schemas
 */
export const campaignCreateSchema = z.object({
  name: z.string().min(2),
  description: z.string().optional(),
  accountId: z.string().cuid(),
  messageTemplate: z.string().min(1),
  targetContactTags: z.array(z.string()).optional(),
  scheduledAt: z.date().optional(),
});

export const campaignUpdateSchema = z.object({
  id: z.string().cuid(),
  name: z.string().min(2).optional(),
  description: z.string().optional(),
  status: z.enum(['DRAFT', 'SCHEDULED', 'RUNNING', 'COMPLETED', 'PAUSED', 'CANCELLED']).optional(),
  scheduledAt: z.date().optional(),
});

/**
 * Pagination schema
 */
export const paginationSchema = z.object({
  limit: z.number().int().min(1).max(100).default(20),
  offset: z.number().int().min(0).default(0),
});

/**
 * ID parameter schema
 */
export const idSchema = z.object({
  id: z.string().cuid('Invalid ID format'),
});

/**
 * Export all schema types
 */
export type UserCreateInput = z.infer<typeof userCreateSchema>;
export type UserUpdateInput = z.infer<typeof userUpdateSchema>;
export type UserLoginInput = z.infer<typeof userLoginSchema>;
export type WhatsAppAccountCreateInput = z.infer<typeof whatsappAccountCreateSchema>;
export type SendMessageInput = z.infer<typeof sendMessageSchema>;
export type ContactCreateInput = z.infer<typeof contactCreateSchema>;
export type ContactUpdateInput = z.infer<typeof contactUpdateSchema>;
export type AIConfigCreateInput = z.infer<typeof aiConfigCreateSchema>;
export type AutomationCreateInput = z.infer<typeof automationCreateSchema>;
export type CampaignCreateInput = z.infer<typeof campaignCreateSchema>;
