/**
 * =============================================================================
 * WEBSOCKET MANAGER - Coordinator for All WebSocket Operations
 * =============================================================================
 * Manages Socket.io server and all event handlers
 * =============================================================================
 */

import type { Server as HTTPServer } from 'http';
import { SocketServer } from './SocketServer';
import { MessageHandler } from './handlers/MessageHandler';
import { PresenceHandler } from './handlers/PresenceHandler';
import { NotificationHandler } from './handlers/NotificationHandler';
import { whatsAppManager } from '@/lib/services/whatsapp/WhatsAppManager';
import { SocketEvent } from '@/types/socket';
import { logger } from '@/lib/utils/logger';

/**
 * WebSocket Manager - coordinates all WebSocket operations
 */
export class WebSocketManager {
  private socketServer: SocketServer;
  private messageHandler: MessageHandler;
  private presenceHandler: PresenceHandler;
  private notificationHandler: NotificationHandler;
  private initialized = false;

  constructor(httpServer: HTTPServer) {
    // Initialize Socket.io server
    this.socketServer = new SocketServer(httpServer);

    // Initialize handlers
    this.messageHandler = new MessageHandler(this.socketServer);
    this.presenceHandler = new PresenceHandler(this.socketServer);
    this.notificationHandler = new NotificationHandler(this.socketServer);

    logger.info('WebSocket Manager created');
  }

  /**
   * Initialize and setup event listeners
   */
  async initialize(): Promise<void> {
    if (this.initialized) {
      logger.warn('WebSocket Manager already initialized');
      return;
    }

    // Setup WhatsApp event listeners
    this.setupWhatsAppListeners();

    this.initialized = true;
    logger.info('WebSocket Manager initialized');
  }

  /**
   * Setup WhatsApp Manager event listeners
   */
  private setupWhatsAppListeners(): void {
    // QR Code event
    whatsAppManager.on('qr', (event) => {
      this.socketServer.emitToRoom(
        `account:${event.accountId}`,
        SocketEvent.WHATSAPP_QR,
        event
      );

      logger.debug('WhatsApp QR event broadcasted', {
        accountId: event.accountId,
      });
    });

    // Authenticated event
    whatsAppManager.on('authenticated', (event) => {
      this.socketServer.emitToRoom(
        `account:${event.accountId}`,
        SocketEvent.WHATSAPP_AUTHENTICATED,
        {
          accountId: event.accountId,
        }
      );

      logger.debug('WhatsApp authenticated event broadcasted', {
        accountId: event.accountId,
      });
    });

    // Ready event
    whatsAppManager.on('ready', async (event) => {
      this.socketServer.emitToRoom(
        `account:${event.accountId}`,
        SocketEvent.WHATSAPP_READY,
        {
          accountId: event.accountId,
          phoneNumber: event.phoneNumber,
        }
      );

      // Send notification to admins
      const account = await this.getAccountName(event.accountId);
      await this.notificationHandler.notifyWhatsAppReady(
        account,
        event.phoneNumber
      );

      logger.info('WhatsApp ready event broadcasted', {
        accountId: event.accountId,
        phoneNumber: event.phoneNumber,
      });
    });

    // Message received
    whatsAppManager.on('message', async (event) => {
      await this.messageHandler.handleNewMessage(event);
    });

    // Message created (sent by us)
    whatsAppManager.on('message_create', async (event) => {
      // Handle outgoing message if needed
      logger.debug('Message created event received', {
        accountId: event.accountId,
      });
    });

    // Disconnected event
    whatsAppManager.on('disconnected', async (accountId, reason) => {
      this.socketServer.emitToRoom(
        `account:${accountId}`,
        SocketEvent.WHATSAPP_DISCONNECTED,
        {
          accountId,
          reason,
        }
      );

      // Send notification to admins
      const account = await this.getAccountName(accountId);
      await this.notificationHandler.notifyWhatsAppDisconnected(account, reason);

      logger.warn('WhatsApp disconnected event broadcasted', {
        accountId,
        reason,
      });
    });

    // Error event
    whatsAppManager.on('error', (accountId, error) => {
      this.socketServer.emitToRoom(
        `account:${accountId}`,
        SocketEvent.WHATSAPP_ERROR,
        {
          accountId,
          error: error.message,
        }
      );

      logger.error('WhatsApp error event broadcasted', {
        accountId,
        error: error.message,
      });
    });
  }

  /**
   * Get account name from database
   */
  private async getAccountName(accountId: string): Promise<string> {
    try {
      const { prisma } = await import('@/lib/db/prisma');
      const account = await prisma.whatsAppAccount.findUnique({
        where: { id: accountId },
        select: { name: true },
      });
      return account?.name || 'Unknown Account';
    } catch {
      return 'Unknown Account';
    }
  }

  /**
   * Get Socket.io server instance
   */
  getSocketServer(): SocketServer {
    return this.socketServer;
  }

  /**
   * Get message handler
   */
  getMessageHandler(): MessageHandler {
    return this.messageHandler;
  }

  /**
   * Get presence handler
   */
  getPresenceHandler(): PresenceHandler {
    return this.presenceHandler;
  }

  /**
   * Get notification handler
   */
  getNotificationHandler(): NotificationHandler {
    return this.notificationHandler;
  }

  /**
   * Shutdown WebSocket manager
   */
  async shutdown(): Promise<void> {
    logger.info('Shutting down WebSocket Manager');

    this.presenceHandler.stop();
    await this.socketServer.close();

    logger.info('WebSocket Manager shut down');
  }
}

/**
 * Global WebSocket manager instance
 */
let webSocketManager: WebSocketManager | null = null;

/**
 * Initialize WebSocket manager
 */
export function initializeWebSocketManager(httpServer: HTTPServer): WebSocketManager {
  if (webSocketManager) {
    logger.warn('WebSocket Manager already exists');
    return webSocketManager;
  }

  webSocketManager = new WebSocketManager(httpServer);
  return webSocketManager;
}

/**
 * Get WebSocket manager instance
 */
export function getWebSocketManager(): WebSocketManager {
  if (!webSocketManager) {
    throw new Error('WebSocket Manager not initialized');
  }
  return webSocketManager;
}
