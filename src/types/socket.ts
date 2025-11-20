/**
 * =============================================================================
 * SOCKET TYPES - WebSocket Event Type Definitions
 * =============================================================================
 * Type-safe Socket.io events for real-time communication
 * =============================================================================
 */

import type { Message, Contact, Conversation } from '@prisma/client';
import type { WhatsAppMessageEvent, WhatsAppQREvent } from './whatsapp';

/**
 * Socket.io event names
 */
export enum SocketEvent {
  // Connection events
  CONNECT = 'connect',
  DISCONNECT = 'disconnect',
  ERROR = 'error',

  // Authentication
  AUTHENTICATE = 'authenticate',
  AUTHENTICATED = 'authenticated',
  AUTH_ERROR = 'auth_error',

  // WhatsApp account events
  WHATSAPP_QR = 'whatsapp:qr',
  WHATSAPP_AUTHENTICATED = 'whatsapp:authenticated',
  WHATSAPP_READY = 'whatsapp:ready',
  WHATSAPP_DISCONNECTED = 'whatsapp:disconnected',
  WHATSAPP_ERROR = 'whatsapp:error',

  // Message events
  MESSAGE_NEW = 'message:new',
  MESSAGE_SENT = 'message:sent',
  MESSAGE_DELIVERED = 'message:delivered',
  MESSAGE_READ = 'message:read',
  MESSAGE_DELETED = 'message:deleted',
  MESSAGE_UPDATED = 'message:updated',

  // Typing events
  TYPING_START = 'typing:start',
  TYPING_STOP = 'typing:stop',

  // Presence events
  USER_ONLINE = 'presence:online',
  USER_OFFLINE = 'presence:offline',
  USER_STATUS = 'presence:status',

  // Conversation events
  CONVERSATION_UPDATED = 'conversation:updated',
  CONVERSATION_ASSIGNED = 'conversation:assigned',
  CONVERSATION_ARCHIVED = 'conversation:archived',

  // Contact events
  CONTACT_UPDATED = 'contact:updated',
  CONTACT_BLOCKED = 'contact:blocked',
  CONTACT_UNBLOCKED = 'contact:unblocked',

  // Notification events
  NOTIFICATION = 'notification',

  // Room events
  JOIN_ROOM = 'room:join',
  LEAVE_ROOM = 'room:leave',
}

/**
 * Socket room names
 */
export enum SocketRoom {
  USER = 'user',
  ACCOUNT = 'account',
  CONVERSATION = 'conversation',
  ADMIN = 'admin',
}

/**
 * Authentication payload
 */
export interface AuthenticatePayload {
  token: string; // JWT token
}

/**
 * Authenticated response
 */
export interface AuthenticatedResponse {
  success: boolean;
  userId: string;
  socketId: string;
}

/**
 * Message event payloads
 */
export interface MessageNewPayload {
  message: Message & {
    fromContact: Contact;
  };
  conversationId: string;
  accountId: string;
}

export interface MessageSentPayload {
  messageId: string;
  conversationId: string;
  accountId: string;
  timestamp: Date;
}

export interface MessageDeliveredPayload {
  messageId: string;
  conversationId: string;
  timestamp: Date;
}

export interface MessageReadPayload {
  messageId: string;
  conversationId: string;
  timestamp: Date;
}

export interface MessageDeletedPayload {
  messageId: string;
  conversationId: string;
}

/**
 * Typing event payloads
 */
export interface TypingStartPayload {
  conversationId: string;
  userId: string;
  userName: string;
}

export interface TypingStopPayload {
  conversationId: string;
  userId: string;
}

/**
 * Presence event payloads
 */
export interface UserPresence {
  userId: string;
  status: 'online' | 'offline' | 'away' | 'busy';
  lastSeen: Date;
  socketId?: string;
}

export interface PresenceUpdatePayload {
  userId: string;
  status: UserPresence['status'];
  timestamp: Date;
}

/**
 * Conversation event payloads
 */
export interface ConversationUpdatedPayload {
  conversation: Conversation;
  changes: Partial<Conversation>;
}

export interface ConversationAssignedPayload {
  conversationId: string;
  assignedToId: string;
  assignedByUserId: string;
  timestamp: Date;
}

/**
 * Contact event payloads
 */
export interface ContactUpdatedPayload {
  contact: Contact;
  changes: Partial<Contact>;
}

/**
 * Notification payload
 */
export interface NotificationPayload {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error';
  title: string;
  message: string;
  timestamp: Date;
  actionUrl?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Room join/leave payloads
 */
export interface JoinRoomPayload {
  room: string;
  roomType: SocketRoom;
  resourceId?: string; // account ID, conversation ID, etc.
}

export interface LeaveRoomPayload {
  room: string;
}

/**
 * Server-to-client events
 */
export interface ServerToClientEvents {
  [SocketEvent.AUTHENTICATED]: (data: AuthenticatedResponse) => void;
  [SocketEvent.AUTH_ERROR]: (error: string) => void;

  // WhatsApp events
  [SocketEvent.WHATSAPP_QR]: (data: WhatsAppQREvent) => void;
  [SocketEvent.WHATSAPP_AUTHENTICATED]: (data: { accountId: string }) => void;
  [SocketEvent.WHATSAPP_READY]: (data: { accountId: string; phoneNumber: string }) => void;
  [SocketEvent.WHATSAPP_DISCONNECTED]: (data: { accountId: string; reason: string }) => void;
  [SocketEvent.WHATSAPP_ERROR]: (data: { accountId: string; error: string }) => void;

  // Message events
  [SocketEvent.MESSAGE_NEW]: (data: MessageNewPayload) => void;
  [SocketEvent.MESSAGE_SENT]: (data: MessageSentPayload) => void;
  [SocketEvent.MESSAGE_DELIVERED]: (data: MessageDeliveredPayload) => void;
  [SocketEvent.MESSAGE_READ]: (data: MessageReadPayload) => void;
  [SocketEvent.MESSAGE_DELETED]: (data: MessageDeletedPayload) => void;

  // Typing events
  [SocketEvent.TYPING_START]: (data: TypingStartPayload) => void;
  [SocketEvent.TYPING_STOP]: (data: TypingStopPayload) => void;

  // Presence events
  [SocketEvent.USER_ONLINE]: (data: PresenceUpdatePayload) => void;
  [SocketEvent.USER_OFFLINE]: (data: PresenceUpdatePayload) => void;
  [SocketEvent.USER_STATUS]: (data: UserPresence) => void;

  // Conversation events
  [SocketEvent.CONVERSATION_UPDATED]: (data: ConversationUpdatedPayload) => void;
  [SocketEvent.CONVERSATION_ASSIGNED]: (data: ConversationAssignedPayload) => void;

  // Contact events
  [SocketEvent.CONTACT_UPDATED]: (data: ContactUpdatedPayload) => void;

  // Notifications
  [SocketEvent.NOTIFICATION]: (data: NotificationPayload) => void;

  // Error
  [SocketEvent.ERROR]: (error: string) => void;
}

/**
 * Client-to-server events
 */
export interface ClientToServerEvents {
  [SocketEvent.AUTHENTICATE]: (data: AuthenticatePayload) => void;

  // Typing events
  [SocketEvent.TYPING_START]: (data: { conversationId: string }) => void;
  [SocketEvent.TYPING_STOP]: (data: { conversationId: string }) => void;

  // Presence events
  [SocketEvent.USER_STATUS]: (data: { status: UserPresence['status'] }) => void;

  // Room events
  [SocketEvent.JOIN_ROOM]: (data: JoinRoomPayload) => void;
  [SocketEvent.LEAVE_ROOM]: (data: LeaveRoomPayload) => void;
}

/**
 * Socket data attached to each socket
 */
export interface SocketData {
  userId?: string;
  sessionId?: string;
  authenticated: boolean;
  rooms: Set<string>;
  lastActivity: Date;
}

/**
 * Extended Socket type with custom data
 */
export interface ExtendedSocket {
  id: string;
  data: SocketData;
  join: (room: string) => void;
  leave: (room: string) => void;
  emit: <K extends keyof ServerToClientEvents>(
    event: K,
    data: Parameters<ServerToClientEvents[K]>[0]
  ) => void;
  disconnect: (close?: boolean) => void;
}
