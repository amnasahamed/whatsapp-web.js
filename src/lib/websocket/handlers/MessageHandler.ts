/**
 * =============================================================================
 * MESSAGE HANDLER - Real-time Message Event Handler
 * =============================================================================
 * Handles real-time message broadcasting and synchronization
 * =============================================================================
 */

import type { SocketServer } from '../SocketServer';
import type { WhatsAppMessageEvent } from '@/types/whatsapp';
import { SocketEvent } from '@/types/socket';
import { logger } from '@/lib/utils/logger';
import { prisma } from '@/lib/db/prisma';

/**
 * Message Handler for WebSocket events
 */
export class MessageHandler {
  constructor(private socketServer: SocketServer) {}

  /**
   * Handle new incoming message from WhatsApp
   */
  async handleNewMessage(event: WhatsAppMessageEvent): Promise<void> {
    try {
      const { accountId, message, contact, conversation } = event;

      // Get full message from database with relations
      const dbMessage = await prisma.message.findFirst({
        where: {
          whatsAppId: message.id._serialized,
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
          conversation: {
            select: {
              id: true,
              assignedToId: true,
            },
          },
        },
      });

      if (!dbMessage) {
        logger.warn('Message not found in database', {
          whatsAppId: message.id._serialized,
        });
        return;
      }

      // Broadcast to account room
      this.socketServer.emitToRoom(`account:${accountId}`, SocketEvent.MESSAGE_NEW, {
        message: dbMessage,
        conversationId: dbMessage.conversationId,
        accountId,
      });

      // Broadcast to conversation room
      this.socketServer.emitToRoom(
        `conversation:${dbMessage.conversationId}`,
        SocketEvent.MESSAGE_NEW,
        {
          message: dbMessage,
          conversationId: dbMessage.conversationId,
          accountId,
        }
      );

      // If conversation is assigned, notify assigned user
      if (dbMessage.conversation.assignedToId) {
        this.socketServer.emitToUser(
          dbMessage.conversation.assignedToId,
          SocketEvent.MESSAGE_NEW,
          {
            message: dbMessage,
            conversationId: dbMessage.conversationId,
            accountId,
          }
        );
      }

      logger.debug('New message broadcasted', {
        messageId: dbMessage.id,
        conversationId: dbMessage.conversationId,
        accountId,
      });
    } catch (error) {
      logger.error('Error handling new message', { error });
    }
  }

  /**
   * Handle message sent confirmation
   */
  async handleMessageSent(
    accountId: string,
    conversationId: string,
    messageId: string
  ): Promise<void> {
    try {
      this.socketServer.emitToRoom(`conversation:${conversationId}`, SocketEvent.MESSAGE_SENT, {
        messageId,
        conversationId,
        accountId,
        timestamp: new Date(),
      });

      logger.debug('Message sent event broadcasted', {
        messageId,
        conversationId,
      });
    } catch (error) {
      logger.error('Error handling message sent', { error });
    }
  }

  /**
   * Handle message delivered
   */
  async handleMessageDelivered(conversationId: string, messageId: string): Promise<void> {
    try {
      // Update message status in database
      await prisma.message.update({
        where: { id: messageId },
        data: {
          status: 'DELIVERED',
          deliveredAt: new Date(),
        },
      });

      this.socketServer.emitToRoom(
        `conversation:${conversationId}`,
        SocketEvent.MESSAGE_DELIVERED,
        {
          messageId,
          conversationId,
          timestamp: new Date(),
        }
      );

      logger.debug('Message delivered event broadcasted', {
        messageId,
        conversationId,
      });
    } catch (error) {
      logger.error('Error handling message delivered', { error });
    }
  }

  /**
   * Handle message read
   */
  async handleMessageRead(conversationId: string, messageId: string): Promise<void> {
    try {
      // Update message status in database
      await prisma.message.update({
        where: { id: messageId },
        data: {
          status: 'READ',
          readAt: new Date(),
        },
      });

      this.socketServer.emitToRoom(`conversation:${conversationId}`, SocketEvent.MESSAGE_READ, {
        messageId,
        conversationId,
        timestamp: new Date(),
      });

      logger.debug('Message read event broadcasted', {
        messageId,
        conversationId,
      });
    } catch (error) {
      logger.error('Error handling message read', { error });
    }
  }

  /**
   * Handle message deleted
   */
  async handleMessageDeleted(conversationId: string, messageId: string): Promise<void> {
    try {
      this.socketServer.emitToRoom(
        `conversation:${conversationId}`,
        SocketEvent.MESSAGE_DELETED,
        {
          messageId,
          conversationId,
        }
      );

      logger.debug('Message deleted event broadcasted', {
        messageId,
        conversationId,
      });
    } catch (error) {
      logger.error('Error handling message deleted', { error });
    }
  }
}
