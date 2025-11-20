/**
 * =============================================================================
 * REDIS CLIENT - Cache & Queue Connection
 * =============================================================================
 * Redis connection for caching, sessions, and message queues
 * =============================================================================
 */

import Redis from 'ioredis';
import { logger } from '@/lib/utils/logger';

/**
 * Redis client configuration
 */
const redisConfig = {
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379', 10),
  password: process.env.REDIS_PASSWORD || undefined,
  retryStrategy: (times: number) => {
    const delay = Math.min(times * 50, 2000);
    return delay;
  },
  maxRetriesPerRequest: 3,
  enableReadyCheck: true,
  enableOfflineQueue: true,
};

/**
 * Create Redis client
 */
const createRedisClient = (name: string) => {
  const client = new Redis({
    ...redisConfig,
    lazyConnect: false,
  });

  client.on('connect', () => {
    logger.info(`Redis ${name} client connected`);
  });

  client.on('ready', () => {
    logger.info(`Redis ${name} client ready`);
  });

  client.on('error', (error) => {
    logger.error(`Redis ${name} client error`, { error });
  });

  client.on('close', () => {
    logger.warn(`Redis ${name} client connection closed`);
  });

  client.on('reconnecting', () => {
    logger.info(`Redis ${name} client reconnecting`);
  });

  return client;
};

/**
 * Main Redis client for general use
 */
export const redis = createRedisClient('main');

/**
 * Separate Redis client for pub/sub (recommended by ioredis)
 */
export const redisPubSub = createRedisClient('pubsub');

/**
 * Separate Redis client for BullMQ queues
 */
export const redisQueue = createRedisClient('queue');

/**
 * Test Redis connection
 */
export const testRedisConnection = async (): Promise<boolean> => {
  try {
    await redis.ping();
    logger.info('Redis connection successful');
    return true;
  } catch (error) {
    logger.error('Redis connection failed', { error });
    return false;
  }
};

/**
 * Graceful shutdown
 */
const gracefulShutdown = async () => {
  logger.info('Disconnecting Redis clients...');

  await Promise.all([
    redis.quit(),
    redisPubSub.quit(),
    redisQueue.quit(),
  ]);

  logger.info('Redis clients disconnected');
};

process.on('SIGINT', gracefulShutdown);
process.on('SIGTERM', gracefulShutdown);

/**
 * Cache utility functions
 */
export const cache = {
  /**
   * Get value from cache
   */
  async get<T>(key: string): Promise<T | null> {
    try {
      const value = await redis.get(key);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      logger.error('Cache get error', { key, error });
      return null;
    }
  },

  /**
   * Set value in cache with optional TTL (seconds)
   */
  async set(key: string, value: unknown, ttl?: number): Promise<boolean> {
    try {
      const serialized = JSON.stringify(value);

      if (ttl) {
        await redis.setex(key, ttl, serialized);
      } else {
        await redis.set(key, serialized);
      }

      return true;
    } catch (error) {
      logger.error('Cache set error', { key, error });
      return false;
    }
  },

  /**
   * Delete key from cache
   */
  async del(key: string): Promise<boolean> {
    try {
      await redis.del(key);
      return true;
    } catch (error) {
      logger.error('Cache delete error', { key, error });
      return false;
    }
  },

  /**
   * Delete keys matching pattern
   */
  async delPattern(pattern: string): Promise<number> {
    try {
      const keys = await redis.keys(pattern);
      if (keys.length > 0) {
        return await redis.del(...keys);
      }
      return 0;
    } catch (error) {
      logger.error('Cache delete pattern error', { pattern, error });
      return 0;
    }
  },

  /**
   * Check if key exists
   */
  async exists(key: string): Promise<boolean> {
    try {
      const result = await redis.exists(key);
      return result === 1;
    } catch (error) {
      logger.error('Cache exists error', { key, error });
      return false;
    }
  },

  /**
   * Set expiration time on key
   */
  async expire(key: string, seconds: number): Promise<boolean> {
    try {
      const result = await redis.expire(key, seconds);
      return result === 1;
    } catch (error) {
      logger.error('Cache expire error', { key, error });
      return false;
    }
  },
};
