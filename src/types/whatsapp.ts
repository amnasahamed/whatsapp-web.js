/**
 * =============================================================================
 * WHATSAPP TYPES - Type Definitions for WhatsApp Integration
 * =============================================================================
 * Comprehensive type system for WhatsApp operations
 * =============================================================================
 */

import type { Message, Contact, Chat, GroupChat, MessageMedia } from 'whatsapp-web.js';

/**
 * WhatsApp account status
 */
export enum WhatsAppAccountStatus {
  DISCONNECTED = 'DISCONNECTED',
  CONNECTING = 'CONNECTING',
  QR_CODE = 'QR_CODE',
  AUTHENTICATED = 'AUTHENTICATED',
  READY = 'READY',
  ERROR = 'ERROR',
}

/**
 * WhatsApp client configuration
 */
export interface WhatsAppClientConfig {
  accountId: string;
  sessionId: string;
  authStrategy: 'NoAuth' | 'LocalAuth' | 'RemoteAuth';
  puppeteerArgs?: string[];
  headless?: boolean;
  qrMaxRetries?: number;
}

/**
 * WhatsApp account info
 */
export interface WhatsAppAccountInfo {
  id: string;
  name: string;
  phoneNumber?: string;
  profilePicUrl?: string;
  status: WhatsAppAccountStatus;
  lastSeen?: Date;
  sessionId: string;
}

/**
 * WhatsApp message event data
 */
export interface WhatsAppMessageEvent {
  accountId: string;
  message: Message;
  contact: Contact;
  chat: Chat;
  isGroup: boolean;
  timestamp: Date;
}

/**
 * WhatsApp QR code event
 */
export interface WhatsAppQREvent {
  accountId: string;
  qr: string;
  attempt: number;
}

/**
 * WhatsApp authentication event
 */
export interface WhatsAppAuthEvent {
  accountId: string;
  authenticated: boolean;
}

/**
 * WhatsApp ready event
 */
export interface WhatsAppReadyEvent {
  accountId: string;
  phoneNumber: string;
}

/**
 * Message send options
 */
export interface SendMessageOptions {
  accountId: string;
  to: string; // Phone number or chat ID
  content: string;
  quotedMessageId?: string;
  media?: {
    data: Buffer | string; // Buffer or base64
    mimetype: string;
    filename?: string;
    caption?: string;
  };
  mentions?: string[];
}

/**
 * Message send result
 */
export interface SendMessageResult {
  success: boolean;
  messageId?: string;
  error?: string;
  sentAt: Date;
}

/**
 * Contact info
 */
export interface ContactInfo {
  id: string;
  name: string;
  phoneNumber: string;
  profilePicUrl?: string;
  isBlocked: boolean;
  isBusiness: boolean;
  about?: string;
}

/**
 * Chat info
 */
export interface ChatInfo {
  id: string;
  name: string;
  isGroup: boolean;
  unreadCount: number;
  lastMessage?: {
    body: string;
    timestamp: Date;
    fromMe: boolean;
  };
  participants?: ContactInfo[];
  profilePicUrl?: string;
}

/**
 * Group info
 */
export interface GroupInfo extends ChatInfo {
  isGroup: true;
  description?: string;
  participants: ContactInfo[];
  admins: string[];
  owner: string;
  createdAt: Date;
}

/**
 * WhatsApp client events
 */
export type WhatsAppClientEvents = {
  qr: (data: WhatsAppQREvent) => void;
  authenticated: (data: WhatsAppAuthEvent) => void;
  ready: (data: WhatsAppReadyEvent) => void;
  message: (data: WhatsAppMessageEvent) => void;
  message_create: (data: WhatsAppMessageEvent) => void;
  message_ack: (message: Message, ack: number) => void;
  disconnected: (accountId: string, reason: string) => void;
  error: (accountId: string, error: Error) => void;
};

/**
 * WhatsApp service stats
 */
export interface WhatsAppServiceStats {
  totalAccounts: number;
  activeAccounts: number;
  disconnectedAccounts: number;
  totalMessagesSent: number;
  totalMessagesReceived: number;
  uptime: number;
}
