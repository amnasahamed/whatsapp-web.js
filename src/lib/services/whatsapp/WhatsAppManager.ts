/**
 * =============================================================================
 * WHATSAPP MANAGER - Multi-Account Management Service
 * =============================================================================
 * Manages multiple WhatsApp accounts, coordinates clients, handles events
 * =============================================================================
 */

import { EventEmitter } from 'events';
import { WhatsAppClient } from './WhatsAppClient';
import {
  WhatsAppClientConfig,
  WhatsAppAccountStatus,
  WhatsAppMessageEvent,
  WhatsAppQREvent,
  SendMessageOptions,
  SendMessageResult,
  WhatsAppServiceStats,
} from '@/types/whatsapp';
import { logger } from '@/lib/utils/logger';
import { prisma } from '@/lib/db/prisma';
import { WhatsAppError } from '@/lib/utils/errors';

/**
 * WhatsApp Manager - manages multiple WhatsApp accounts
 */
export class WhatsAppManager extends EventEmitter {
  private clients: Map<string, WhatsAppClient> = new Map();
  private startTime: Date = new Date();

  constructor() {
    super();
    logger.info('WhatsApp Manager initialized');
  }

  /**
   * Initialize manager and load all active accounts from database
   */
  async initialize(): Promise<void> {
    try {
      logger.info('Loading WhatsApp accounts from database');

      // Load all active accounts
      const accounts = await prisma.whatsAppAccount.findMany({
        where: {
          isActive: true,
        },
      });

      logger.info(`Found ${accounts.length} active WhatsApp accounts`);

      // Initialize each account
      for (const account of accounts) {
        try {
          await this.addAccount({
            accountId: account.id,
            sessionId: account.sessionId,
            authStrategy: 'LocalAuth',
            headless: true,
          });
        } catch (error) {
          logger.error('Failed to initialize account', {
            accountId: account.id,
            error,
          });
        }
      }

      logger.info('WhatsApp Manager initialization complete');
    } catch (error) {
      logger.error('Failed to initialize WhatsApp Manager', { error });
      throw error;
    }
  }

  /**
   * Add a new WhatsApp account
   */
  async addAccount(config: WhatsAppClientConfig): Promise<void> {
    // Check if account already exists
    if (this.clients.has(config.accountId)) {
      logger.warn('Account already exists', { accountId: config.accountId });
      return;
    }

    logger.info('Adding new WhatsApp account', {
      accountId: config.accountId,
    });

    // Create client
    const client = new WhatsAppClient(config);

    // Setup event forwarding
    this.setupClientEventForwarding(client, config.accountId);

    // Store client
    this.clients.set(config.accountId, client);

    // Initialize client
    try {
      await client.initialize();
    } catch (error) {
      // Remove from map if initialization fails
      this.clients.delete(config.accountId);
      throw error;
    }
  }

  /**
   * Setup event forwarding from client to manager
   */
  private setupClientEventForwarding(client: WhatsAppClient, accountId: string): void {
    // QR Code event
    client.on('qr', (event: WhatsAppQREvent) => {
      this.emit('qr', event);

      // Update database
      this.updateAccountStatus(accountId, WhatsAppAccountStatus.QR_CODE, event.qr).catch(
        (error) => {
          logger.error('Failed to update QR code in database', { accountId, error });
        }
      );
    });

    // Authenticated event
    client.on('authenticated', (event) => {
      this.emit('authenticated', event);

      // Update database
      this.updateAccountStatus(accountId, WhatsAppAccountStatus.AUTHENTICATED).catch((error) => {
        logger.error('Failed to update authentication status', { accountId, error });
      });
    });

    // Ready event
    client.on('ready', (event) => {
      this.emit('ready', event);

      // Update database with phone number
      this.updateAccountReady(accountId, event.phoneNumber).catch((error) => {
        logger.error('Failed to update ready status', { accountId, error });
      });
    });

    // Message received
    client.on('message', (event: WhatsAppMessageEvent) => {
      this.emit('message', event);

      // Process message asynchronously
      this.handleIncomingMessage(event).catch((error) => {
        logger.error('Failed to handle incoming message', { accountId, error });
      });
    });

    // Message created
    client.on('message_create', (event: WhatsAppMessageEvent) => {
      this.emit('message_create', event);
    });

    // Disconnected
    client.on('disconnected', (accountId: string, reason: string) => {
      this.emit('disconnected', accountId, reason);

      // Update database
      this.updateAccountStatus(accountId, WhatsAppAccountStatus.DISCONNECTED).catch((error) => {
        logger.error('Failed to update disconnection status', { accountId, error });
      });
    });

    // Error
    client.on('error', (accountId: string, error: Error) => {
      this.emit('error', accountId, error);

      // Update database
      this.updateAccountStatus(accountId, WhatsAppAccountStatus.ERROR).catch((err) => {
        logger.error('Failed to update error status', { accountId, error: err });
      });
    });
  }

  /**
   * Handle incoming message
   */
  private async handleIncomingMessage(event: WhatsAppMessageEvent): Promise<void> {
    try {
      // Save contact if not exists
      const contact = await this.saveOrUpdateContact(event);

      // Save message to database
      await this.saveMessage(event, contact.id);

      logger.debug('Incoming message processed', {
        accountId: event.accountId,
        from: event.contact.number,
      });
    } catch (error) {
      logger.error('Error handling incoming message', {
        accountId: event.accountId,
        error,
      });
    }
  }

  /**
   * Save or update contact in database
   */
  private async saveOrUpdateContact(event: WhatsAppMessageEvent) {
    const whatsAppId = event.contact.id._serialized;

    return await prisma.contact.upsert({
      where: {
        accountId_whatsAppId: {
          accountId: event.accountId,
          whatsAppId,
        },
      },
      create: {
        accountId: event.accountId,
        whatsAppId,
        phoneNumber: event.contact.number || '',
        name: event.contact.name || event.contact.pushname || event.contact.number || 'Unknown',
        profilePicUrl: await event.contact.getProfilePicUrl().catch(() => undefined),
        isBusiness: event.contact.isBusiness,
        firstMessageAt: event.timestamp,
        lastMessageAt: event.timestamp,
        totalMessages: 1,
      },
      update: {
        name: event.contact.name || event.contact.pushname || event.contact.number || 'Unknown',
        lastMessageAt: event.timestamp,
        totalMessages: {
          increment: 1,
        },
      },
    });
  }

  /**
   * Save message to database
   */
  private async saveMessage(event: WhatsAppMessageEvent, contactId: string) {
    // Get or create conversation
    const conversation = await prisma.conversation.upsert({
      where: {
        accountId_contactId: {
          accountId: event.accountId,
          contactId,
        },
      },
      create: {
        accountId: event.accountId,
        contactId,
        lastMessageAt: event.timestamp,
      },
      update: {
        lastMessageAt: event.timestamp,
        isUnread: !event.message.fromMe,
      },
    });

    // Save message
    await prisma.message.create({
      data: {
        whatsAppId: event.message.id._serialized,
        type: this.mapMessageType(event.message.type),
        direction: event.message.fromMe ? 'OUTBOUND' : 'INBOUND',
        content: event.message.body || '',
        mediaUrl: event.message.hasMedia ? 'pending' : undefined,
        conversationId: conversation.id,
        accountId: event.accountId,
        fromContactId: contactId,
        toContactId: contactId,
        sentAt: event.timestamp,
      },
    });
  }

  /**
   * Map WhatsApp message type to our enum
   */
  private mapMessageType(type: string): 'TEXT' | 'IMAGE' | 'VIDEO' | 'AUDIO' | 'DOCUMENT' {
    switch (type) {
      case 'image':
        return 'IMAGE';
      case 'video':
        return 'VIDEO';
      case 'audio':
      case 'ptt': // Push to talk
        return 'AUDIO';
      case 'document':
        return 'DOCUMENT';
      default:
        return 'TEXT';
    }
  }

  /**
   * Update account status in database
   */
  private async updateAccountStatus(
    accountId: string,
    status: WhatsAppAccountStatus,
    qrCode?: string
  ): Promise<void> {
    await prisma.whatsAppAccount.update({
      where: { id: accountId },
      data: {
        status,
        qrCode,
        lastSeen: new Date(),
      },
    });
  }

  /**
   * Update account ready status
   */
  private async updateAccountReady(accountId: string, phoneNumber: string): Promise<void> {
    await prisma.whatsAppAccount.update({
      where: { id: accountId },
      data: {
        status: WhatsAppAccountStatus.READY,
        phoneNumber,
        lastSeen: new Date(),
        qrCode: null, // Clear QR code
      },
    });
  }

  /**
   * Remove an account
   */
  async removeAccount(accountId: string): Promise<void> {
    const client = this.clients.get(accountId);

    if (!client) {
      throw new WhatsAppError('Account not found', accountId);
    }

    logger.info('Removing WhatsApp account', { accountId });

    // Logout and destroy client
    await client.logout();

    // Remove from map
    this.clients.delete(accountId);

    // Update database
    await prisma.whatsAppAccount.update({
      where: { id: accountId },
      data: {
        isActive: false,
        status: WhatsAppAccountStatus.DISCONNECTED,
      },
    });

    logger.info('WhatsApp account removed', { accountId });
  }

  /**
   * Send a message
   */
  async sendMessage(options: SendMessageOptions): Promise<SendMessageResult> {
    const client = this.clients.get(options.accountId);

    if (!client) {
      throw new WhatsAppError('Account not found', options.accountId);
    }

    if (!client.isReady()) {
      throw new WhatsAppError(
        `Account not ready. Current status: ${client.getStatus()}`,
        options.accountId
      );
    }

    return await client.sendMessage(options);
  }

  /**
   * Get account by ID
   */
  getAccount(accountId: string): WhatsAppClient | undefined {
    return this.clients.get(accountId);
  }

  /**
   * Get all accounts
   */
  getAllAccounts(): WhatsAppClient[] {
    return Array.from(this.clients.values());
  }

  /**
   * Get account IDs
   */
  getAccountIds(): string[] {
    return Array.from(this.clients.keys());
  }

  /**
   * Check if account exists
   */
  hasAccount(accountId: string): boolean {
    return this.clients.has(accountId);
  }

  /**
   * Get account status
   */
  getAccountStatus(accountId: string): WhatsAppAccountStatus | undefined {
    const client = this.clients.get(accountId);
    return client?.getStatus();
  }

  /**
   * Get service statistics
   */
  getStats(): WhatsAppServiceStats {
    const clients = Array.from(this.clients.values());

    return {
      totalAccounts: clients.length,
      activeAccounts: clients.filter((c) => c.isReady()).length,
      disconnectedAccounts: clients.filter(
        (c) => c.getStatus() === WhatsAppAccountStatus.DISCONNECTED
      ).length,
      totalMessagesSent: 0, // TODO: Implement
      totalMessagesReceived: 0, // TODO: Implement
      uptime: Date.now() - this.startTime.getTime(),
    };
  }

  /**
   * Shutdown all clients
   */
  async shutdown(): Promise<void> {
    logger.info('Shutting down WhatsApp Manager');

    const clients = Array.from(this.clients.values());

    await Promise.all(
      clients.map(async (client) => {
        try {
          await client.destroy();
        } catch (error) {
          logger.error('Error destroying client during shutdown', { error });
        }
      })
    );

    this.clients.clear();

    logger.info('WhatsApp Manager shutdown complete');
  }
}

/**
 * Singleton instance
 */
export const whatsAppManager = new WhatsAppManager();
