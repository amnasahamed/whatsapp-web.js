/**
 * =============================================================================
 * WHATSAPP CLIENT - Single Account Client Wrapper
 * =============================================================================
 * Production-ready wrapper around whatsapp-web.js Client
 * Handles lifecycle, events, and error recovery for a single account
 * =============================================================================
 */

import { Client, LocalAuth, NoAuth, Message, MessageMedia } from 'whatsapp-web.js';
import { EventEmitter } from 'events';
import {
  WhatsAppClientConfig,
  WhatsAppAccountStatus,
  WhatsAppMessageEvent,
  WhatsAppQREvent,
  WhatsAppAuthEvent,
  WhatsAppReadyEvent,
  SendMessageOptions,
  SendMessageResult,
} from '@/types/whatsapp';
import { logger } from '@/lib/utils/logger';
import { WhatsAppError } from '@/lib/utils/errors';

/**
 * WhatsApp Client for a single account
 * Extends EventEmitter to emit custom events
 */
export class WhatsAppClient extends EventEmitter {
  private client?: Client;
  private config: WhatsAppClientConfig;
  private status: WhatsAppAccountStatus = WhatsAppAccountStatus.DISCONNECTED;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 5000;
  private initialized = false;

  constructor(config: WhatsAppClientConfig) {
    super();
    this.config = config;
  }

  /**
   * Initialize and start the WhatsApp client
   */
  async initialize(): Promise<void> {
    if (this.initialized) {
      logger.warn('WhatsApp client already initialized', {
        accountId: this.config.accountId,
      });
      return;
    }

    try {
      logger.info('Initializing WhatsApp client', {
        accountId: this.config.accountId,
        sessionId: this.config.sessionId,
      });

      // Create auth strategy
      const authStrategy = this.createAuthStrategy();

      // Create WhatsApp client
      this.client = new Client({
        authStrategy,
        puppeteer: {
          headless: this.config.headless ?? true,
          args: this.config.puppeteerArgs || [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-accelerated-2d-canvas',
            '--no-first-run',
            '--no-zygote',
            '--single-process',
            '--disable-gpu',
          ],
        },
        qrMaxRetries: this.config.qrMaxRetries || 5,
      });

      // Setup event listeners
      this.setupEventListeners();

      // Initialize the client
      await this.client.initialize();

      this.initialized = true;

      logger.info('WhatsApp client initialized successfully', {
        accountId: this.config.accountId,
      });
    } catch (error) {
      logger.error('Failed to initialize WhatsApp client', {
        accountId: this.config.accountId,
        error,
      });

      this.status = WhatsAppAccountStatus.ERROR;
      this.emit('error', this.config.accountId, error);

      throw new WhatsAppError(
        `Failed to initialize WhatsApp client: ${error instanceof Error ? error.message : String(error)}`,
        this.config.accountId
      );
    }
  }

  /**
   * Create authentication strategy based on config
   */
  private createAuthStrategy() {
    switch (this.config.authStrategy) {
      case 'LocalAuth':
        return new LocalAuth({
          clientId: this.config.sessionId,
        });
      case 'NoAuth':
        return new NoAuth();
      // TODO: Implement RemoteAuth for production
      default:
        return new LocalAuth({
          clientId: this.config.sessionId,
        });
    }
  }

  /**
   * Setup all event listeners
   */
  private setupEventListeners(): void {
    if (!this.client) return;

    // QR Code event
    this.client.on('qr', (qr) => {
      this.status = WhatsAppAccountStatus.QR_CODE;

      const event: WhatsAppQREvent = {
        accountId: this.config.accountId,
        qr,
        attempt: this.reconnectAttempts,
      };

      this.emit('qr', event);

      logger.info('QR code received', {
        accountId: this.config.accountId,
        attempt: this.reconnectAttempts,
      });
    });

    // Authenticated event
    this.client.on('authenticated', () => {
      this.status = WhatsAppAccountStatus.AUTHENTICATED;

      const event: WhatsAppAuthEvent = {
        accountId: this.config.accountId,
        authenticated: true,
      };

      this.emit('authenticated', event);

      logger.info('WhatsApp authenticated', {
        accountId: this.config.accountId,
      });
    });

    // Authentication failure
    this.client.on('auth_failure', (msg) => {
      this.status = WhatsAppAccountStatus.ERROR;

      logger.error('WhatsApp authentication failed', {
        accountId: this.config.accountId,
        message: msg,
      });

      this.emit('error', this.config.accountId, new Error(`Authentication failed: ${msg}`));
    });

    // Ready event
    this.client.on('ready', () => {
      this.status = WhatsAppAccountStatus.READY;
      this.reconnectAttempts = 0; // Reset reconnect attempts

      const phoneNumber = this.client!.info?.wid?.user || 'unknown';

      const event: WhatsAppReadyEvent = {
        accountId: this.config.accountId,
        phoneNumber,
      };

      this.emit('ready', event);

      logger.info('WhatsApp client ready', {
        accountId: this.config.accountId,
        phoneNumber,
      });
    });

    // Message received
    this.client.on('message', async (message) => {
      try {
        const contact = await message.getContact();
        const chat = await message.getChat();

        const event: WhatsAppMessageEvent = {
          accountId: this.config.accountId,
          message,
          contact,
          chat,
          isGroup: chat.isGroup,
          timestamp: new Date(message.timestamp * 1000),
        };

        this.emit('message', event);

        logger.debug('Message received', {
          accountId: this.config.accountId,
          from: contact.number,
          isGroup: chat.isGroup,
          type: message.type,
        });
      } catch (error) {
        logger.error('Error processing incoming message', {
          accountId: this.config.accountId,
          error,
        });
      }
    });

    // Message created (sent by this client)
    this.client.on('message_create', async (message) => {
      try {
        const contact = await message.getContact();
        const chat = await message.getChat();

        const event: WhatsAppMessageEvent = {
          accountId: this.config.accountId,
          message,
          contact,
          chat,
          isGroup: chat.isGroup,
          timestamp: new Date(message.timestamp * 1000),
        };

        this.emit('message_create', event);

        logger.debug('Message created', {
          accountId: this.config.accountId,
          to: contact.number,
          type: message.type,
        });
      } catch (error) {
        logger.error('Error processing outgoing message', {
          accountId: this.config.accountId,
          error,
        });
      }
    });

    // Message acknowledgement
    this.client.on('message_ack', (message, ack) => {
      this.emit('message_ack', message, ack);

      logger.debug('Message ack received', {
        accountId: this.config.accountId,
        messageId: message.id._serialized,
        ack,
      });
    });

    // Disconnected
    this.client.on('disconnected', (reason) => {
      this.status = WhatsAppAccountStatus.DISCONNECTED;

      logger.warn('WhatsApp client disconnected', {
        accountId: this.config.accountId,
        reason,
      });

      this.emit('disconnected', this.config.accountId, reason);

      // Attempt to reconnect
      this.attemptReconnect();
    });

    // Loading screen
    this.client.on('loading_screen', (percent) => {
      logger.debug('Loading screen', {
        accountId: this.config.accountId,
        percent,
      });
    });
  }

  /**
   * Attempt to reconnect after disconnection
   */
  private async attemptReconnect(): Promise<void> {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      logger.error('Max reconnect attempts reached', {
        accountId: this.config.accountId,
      });
      return;
    }

    this.reconnectAttempts++;
    this.status = WhatsAppAccountStatus.CONNECTING;

    logger.info('Attempting to reconnect', {
      accountId: this.config.accountId,
      attempt: this.reconnectAttempts,
    });

    await this.sleep(this.reconnectDelay * this.reconnectAttempts);

    try {
      if (this.client) {
        await this.client.initialize();
      }
    } catch (error) {
      logger.error('Reconnection failed', {
        accountId: this.config.accountId,
        error,
      });

      // Try again
      this.attemptReconnect();
    }
  }

  /**
   * Send a message
   */
  async sendMessage(options: Omit<SendMessageOptions, 'accountId'>): Promise<SendMessageResult> {
    if (!this.client) {
      throw new WhatsAppError('Client not initialized', this.config.accountId);
    }

    if (this.status !== WhatsAppAccountStatus.READY) {
      throw new WhatsAppError(
        `Client not ready. Current status: ${this.status}`,
        this.config.accountId
      );
    }

    try {
      let message: Message;

      // Send with media
      if (options.media) {
        const media = new MessageMedia(
          options.media.mimetype,
          options.media.data.toString('base64'),
          options.media.filename
        );

        message = await this.client.sendMessage(options.to, media, {
          caption: options.media.caption || options.content,
          quotedMessageId: options.quotedMessageId,
          mentions: options.mentions,
        });
      } else {
        // Send text message
        message = await this.client.sendMessage(options.to, options.content, {
          quotedMessageId: options.quotedMessageId,
          mentions: options.mentions,
        });
      }

      logger.info('Message sent successfully', {
        accountId: this.config.accountId,
        to: options.to,
        messageId: message.id._serialized,
      });

      return {
        success: true,
        messageId: message.id._serialized,
        sentAt: new Date(),
      };
    } catch (error) {
      logger.error('Failed to send message', {
        accountId: this.config.accountId,
        to: options.to,
        error,
      });

      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
        sentAt: new Date(),
      };
    }
  }

  /**
   * Get chat by ID
   */
  async getChat(chatId: string) {
    if (!this.client) {
      throw new WhatsAppError('Client not initialized', this.config.accountId);
    }

    return await this.client.getChatById(chatId);
  }

  /**
   * Get contact by ID
   */
  async getContact(contactId: string) {
    if (!this.client) {
      throw new WhatsAppError('Client not initialized', this.config.accountId);
    }

    return await this.client.getContactById(contactId);
  }

  /**
   * Get all chats
   */
  async getChats() {
    if (!this.client) {
      throw new WhatsAppError('Client not initialized', this.config.accountId);
    }

    return await this.client.getChats();
  }

  /**
   * Get all contacts
   */
  async getContacts() {
    if (!this.client) {
      throw new WhatsAppError('Client not initialized', this.config.accountId);
    }

    return await this.client.getContacts();
  }

  /**
   * Get client status
   */
  getStatus(): WhatsAppAccountStatus {
    return this.status;
  }

  /**
   * Check if client is ready
   */
  isReady(): boolean {
    return this.status === WhatsAppAccountStatus.READY;
  }

  /**
   * Logout and destroy client
   */
  async logout(): Promise<void> {
    if (!this.client) return;

    try {
      logger.info('Logging out WhatsApp client', {
        accountId: this.config.accountId,
      });

      await this.client.logout();
      await this.destroy();

      logger.info('WhatsApp client logged out successfully', {
        accountId: this.config.accountId,
      });
    } catch (error) {
      logger.error('Error logging out', {
        accountId: this.config.accountId,
        error,
      });
      throw error;
    }
  }

  /**
   * Destroy client and cleanup
   */
  async destroy(): Promise<void> {
    if (!this.client) return;

    try {
      await this.client.destroy();
      this.client = undefined;
      this.initialized = false;
      this.status = WhatsAppAccountStatus.DISCONNECTED;

      logger.info('WhatsApp client destroyed', {
        accountId: this.config.accountId,
      });
    } catch (error) {
      logger.error('Error destroying client', {
        accountId: this.config.accountId,
        error,
      });
    }
  }

  /**
   * Sleep utility
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
