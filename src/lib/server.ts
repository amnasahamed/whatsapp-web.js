/**
 * =============================================================================
 * SERVER INITIALIZATION
 * =============================================================================
 * Server setup with HTTP, WebSocket, and WhatsApp services
 * =============================================================================
 */

import { createServer } from 'http';
import { parse } from 'url';
import next from 'next';
import { initializeWebSocketManager } from './websocket/WebSocketManager';
import { whatsAppManager } from './services/whatsapp/WhatsAppManager';
import { testDatabaseConnection } from './db/prisma';
import { testRedisConnection } from './db/redis';
import { logger } from './utils/logger';

const dev = process.env.NODE_ENV !== 'production';
const hostname = 'localhost';
const port = parseInt(process.env.PORT || '3000', 10);

/**
 * Initialize and start the server
 */
export async function startServer() {
  try {
    logger.info('Starting server initialization...');

    // Test database connection
    const dbConnected = await testDatabaseConnection();
    if (!dbConnected) {
      throw new Error('Database connection failed');
    }

    // Test Redis connection
    const redisConnected = await testRedisConnection();
    if (!redisConnected) {
      throw new Error('Redis connection failed');
    }

    // Initialize Next.js app
    const app = next({ dev, hostname, port });
    const handle = app.getRequestHandler();

    await app.prepare();

    // Create HTTP server
    const httpServer = createServer(async (req, res) => {
      try {
        const parsedUrl = parse(req.url!, true);
        await handle(req, res, parsedUrl);
      } catch (err) {
        logger.error('Error handling request', { error: err });
        res.statusCode = 500;
        res.end('Internal Server Error');
      }
    });

    // Initialize WebSocket manager
    const wsManager = initializeWebSocketManager(httpServer);
    await wsManager.initialize();
    logger.info('WebSocket server initialized');

    // Initialize WhatsApp manager
    await whatsAppManager.initialize();
    logger.info('WhatsApp manager initialized');

    // Start listening
    httpServer.listen(port, () => {
      logger.info(`Server ready on http://${hostname}:${port}`);
      logger.info(`WebSocket ready on ws://${hostname}:${port}`);
    });

    // Graceful shutdown
    const shutdown = async (signal: string) => {
      logger.info(`${signal} received, shutting down gracefully...`);

      httpServer.close(() => {
        logger.info('HTTP server closed');
      });

      await wsManager.shutdown();
      await whatsAppManager.shutdown();

      process.exit(0);
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));

    return httpServer;
  } catch (error) {
    logger.error('Failed to start server', { error });
    process.exit(1);
  }
}

// Start server if this file is run directly
if (require.main === module) {
  startServer();
}
