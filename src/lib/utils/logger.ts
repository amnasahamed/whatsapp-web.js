/**
 * =============================================================================
 * LOGGER - Production-Ready Logging Service
 * =============================================================================
 * Structured logging with Pino for high performance and JSON output
 * =============================================================================
 */

import pino from 'pino';

/**
 * Create logger instance with environment-aware configuration
 */
const createLogger = () => {
  const isDevelopment = process.env.NODE_ENV === 'development';
  const logLevel = process.env.LOG_LEVEL || (isDevelopment ? 'debug' : 'info');
  const prettyPrint = process.env.LOG_PRETTY === 'true' || isDevelopment;

  return pino({
    level: logLevel,
    ...(prettyPrint && {
      transport: {
        target: 'pino-pretty',
        options: {
          colorize: true,
          translateTime: 'SYS:standard',
          ignore: 'pid,hostname',
        },
      },
    }),
    formatters: {
      level: (label) => {
        return { level: label };
      },
    },
    timestamp: pino.stdTimeFunctions.isoTime,
    base: {
      env: process.env.NODE_ENV || 'development',
    },
  });
};

export const logger = createLogger();

/**
 * Create a child logger with additional context
 */
export const createChildLogger = (context: Record<string, unknown>) => {
  return logger.child(context);
};

/**
 * Log request/response for HTTP endpoints
 */
export const logHttpRequest = (
  method: string,
  url: string,
  statusCode: number,
  duration: number,
  metadata?: Record<string, unknown>
) => {
  logger.info({
    type: 'http_request',
    method,
    url,
    statusCode,
    duration,
    ...metadata,
  });
};

/**
 * Log database queries (for debugging)
 */
export const logDatabaseQuery = (
  query: string,
  duration: number,
  metadata?: Record<string, unknown>
) => {
  logger.debug({
    type: 'database_query',
    query,
    duration,
    ...metadata,
  });
};

/**
 * Log WhatsApp events
 */
export const logWhatsAppEvent = (
  event: string,
  accountId: string,
  metadata?: Record<string, unknown>
) => {
  logger.info({
    type: 'whatsapp_event',
    event,
    accountId,
    ...metadata,
  });
};

/**
 * Log AI operations
 */
export const logAIOperation = (
  provider: string,
  operation: string,
  duration: number,
  tokens: number,
  metadata?: Record<string, unknown>
) => {
  logger.info({
    type: 'ai_operation',
    provider,
    operation,
    duration,
    tokens,
    ...metadata,
  });
};
