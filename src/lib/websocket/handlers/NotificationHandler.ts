/**
 * =============================================================================
 * NOTIFICATION HANDLER - Real-time Notifications
 * =============================================================================
 * Manages real-time notifications to users
 * =============================================================================
 */

import type { SocketServer } from '../SocketServer';
import { SocketEvent, NotificationPayload } from '@/types/socket';
import { logger } from '@/lib/utils/logger';
import { prisma } from '@/lib/db/prisma';

/**
 * Notification types
 */
export enum NotificationType {
  NEW_MESSAGE = 'new_message',
  CONVERSATION_ASSIGNED = 'conversation_assigned',
  MENTION = 'mention',
  WHATSAPP_DISCONNECTED = 'whatsapp_disconnected',
  WHATSAPP_READY = 'whatsapp_ready',
  SYSTEM = 'system',
}

/**
 * Notification Handler
 */
export class NotificationHandler {
  constructor(private socketServer: SocketServer) {}

  /**
   * Send notification to specific user
   */
  async sendToUser(
    userId: string,
    type: NotificationPayload['type'],
    title: string,
    message: string,
    options?: {
      actionUrl?: string;
      metadata?: Record<string, unknown>;
    }
  ): Promise<void> {
    try {
      const notification: NotificationPayload = {
        id: `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        type,
        title,
        message,
        timestamp: new Date(),
        actionUrl: options?.actionUrl,
        metadata: options?.metadata,
      };

      this.socketServer.emitToUser(userId, SocketEvent.NOTIFICATION, notification);

      logger.debug('Notification sent to user', {
        userId,
        type,
        notificationId: notification.id,
      });
    } catch (error) {
      logger.error('Error sending notification to user', { userId, error });
    }
  }

  /**
   * Send notification to multiple users
   */
  async sendToUsers(
    userIds: string[],
    type: NotificationPayload['type'],
    title: string,
    message: string,
    options?: {
      actionUrl?: string;
      metadata?: Record<string, unknown>;
    }
  ): Promise<void> {
    await Promise.all(
      userIds.map((userId) => this.sendToUser(userId, type, title, message, options))
    );
  }

  /**
   * Send notification to all users
   */
  async sendToAll(
    type: NotificationPayload['type'],
    title: string,
    message: string,
    options?: {
      actionUrl?: string;
      metadata?: Record<string, unknown>;
    }
  ): Promise<void> {
    try {
      const notification: NotificationPayload = {
        id: `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        type,
        title,
        message,
        timestamp: new Date(),
        actionUrl: options?.actionUrl,
        metadata: options?.metadata,
      };

      this.socketServer.emitToAll(SocketEvent.NOTIFICATION, notification);

      logger.info('Notification sent to all users', {
        type,
        notificationId: notification.id,
      });
    } catch (error) {
      logger.error('Error sending notification to all', { error });
    }
  }

  /**
   * Notify about new message
   */
  async notifyNewMessage(
    userId: string,
    contactName: string,
    conversationId: string
  ): Promise<void> {
    await this.sendToUser(
      userId,
      'info',
      'New Message',
      `New message from ${contactName}`,
      {
        actionUrl: `/inbox?conversation=${conversationId}`,
        metadata: {
          type: NotificationType.NEW_MESSAGE,
          conversationId,
        },
      }
    );
  }

  /**
   * Notify about conversation assignment
   */
  async notifyConversationAssigned(
    userId: string,
    contactName: string,
    conversationId: string,
    assignedByName: string
  ): Promise<void> {
    await this.sendToUser(
      userId,
      'info',
      'Conversation Assigned',
      `${assignedByName} assigned you a conversation with ${contactName}`,
      {
        actionUrl: `/inbox?conversation=${conversationId}`,
        metadata: {
          type: NotificationType.CONVERSATION_ASSIGNED,
          conversationId,
        },
      }
    );
  }

  /**
   * Notify about mention
   */
  async notifyMention(
    userId: string,
    mentionedBy: string,
    conversationId: string
  ): Promise<void> {
    await this.sendToUser(
      userId,
      'info',
      'You were mentioned',
      `${mentionedBy} mentioned you in a conversation`,
      {
        actionUrl: `/inbox?conversation=${conversationId}`,
        metadata: {
          type: NotificationType.MENTION,
          conversationId,
        },
      }
    );
  }

  /**
   * Notify about WhatsApp account disconnected
   */
  async notifyWhatsAppDisconnected(accountName: string, reason: string): Promise<void> {
    // Get all users who should be notified (admins and owners)
    const users = await prisma.user.findMany({
      where: {
        role: {
          in: ['OWNER', 'ADMIN'],
        },
        status: 'ACTIVE',
      },
      select: { id: true },
    });

    await this.sendToUsers(
      users.map((u) => u.id),
      'error',
      'WhatsApp Disconnected',
      `Account "${accountName}" was disconnected: ${reason}`,
      {
        actionUrl: '/settings/whatsapp',
        metadata: {
          type: NotificationType.WHATSAPP_DISCONNECTED,
          accountName,
          reason,
        },
      }
    );
  }

  /**
   * Notify about WhatsApp account ready
   */
  async notifyWhatsAppReady(accountName: string, phoneNumber: string): Promise<void> {
    const users = await prisma.user.findMany({
      where: {
        role: {
          in: ['OWNER', 'ADMIN'],
        },
        status: 'ACTIVE',
      },
      select: { id: true },
    });

    await this.sendToUsers(
      users.map((u) => u.id),
      'success',
      'WhatsApp Connected',
      `Account "${accountName}" (${phoneNumber}) is now connected and ready`,
      {
        actionUrl: '/settings/whatsapp',
        metadata: {
          type: NotificationType.WHATSAPP_READY,
          accountName,
          phoneNumber,
        },
      }
    );
  }

  /**
   * Send system notification to admins
   */
  async notifyAdmins(
    title: string,
    message: string,
    type: NotificationPayload['type'] = 'info'
  ): Promise<void> {
    const admins = await prisma.user.findMany({
      where: {
        role: {
          in: ['OWNER', 'ADMIN'],
        },
        status: 'ACTIVE',
      },
      select: { id: true },
    });

    await this.sendToUsers(admins.map((u) => u.id), type, title, message, {
      metadata: {
        type: NotificationType.SYSTEM,
      },
    });
  }
}
