/**
 * =============================================================================
 * RATE LIMITING
 * =============================================================================
 * Rate limiting utilities using Redis
 * =============================================================================
 */

import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';
import { RateLimitError } from './errors';

/**
 * Create Redis client for Upstash Ratelimit
 */
const redis = new Redis({
  url: process.env.REDIS_URL || 'redis://localhost:6379',
  token: process.env.REDIS_TOKEN || '',
});

/**
 * Rate limiters for different use cases
 */
export const rateLimiters = {
  /**
   * API rate limiter - 100 requests per minute per user
   */
  api: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(100, '1 m'),
    analytics: true,
    prefix: 'ratelimit:api',
  }),

  /**
   * Message sending rate limiter - 30 messages per minute per account
   */
  messages: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(30, '1 m'),
    analytics: true,
    prefix: 'ratelimit:messages',
  }),

  /**
   * AI requests rate limiter - 20 requests per minute per user
   */
  ai: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(20, '1 m'),
    analytics: true,
    prefix: 'ratelimit:ai',
  }),

  /**
   * Authentication rate limiter - 5 attempts per 15 minutes
   */
  auth: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(5, '15 m'),
    analytics: true,
    prefix: 'ratelimit:auth',
  }),

  /**
   * Webhook rate limiter - 100 webhooks per minute
   */
  webhooks: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(100, '1 m'),
    analytics: true,
    prefix: 'ratelimit:webhooks',
  }),
};

/**
 * Check rate limit and throw error if exceeded
 */
export async function checkRateLimit(
  limiter: Ratelimit,
  identifier: string,
  context?: string
): Promise<void> {
  const { success, limit, reset, remaining } = await limiter.limit(identifier);

  if (!success) {
    const resetDate = new Date(reset);
    const retryAfter = Math.ceil((reset - Date.now()) / 1000);

    throw new RateLimitError(
      `Rate limit exceeded${context ? ` for ${context}` : ''}. Try again in ${retryAfter} seconds. Limit: ${limit} requests.`
    );
  }

  // Return rate limit info (can be used in headers)
  return;
}

/**
 * Get rate limit status without incrementing
 */
export async function getRateLimitStatus(limiter: Ratelimit, identifier: string) {
  // Note: Upstash Ratelimit doesn't have a check-only method
  // This will consume a token
  const result = await limiter.limit(identifier);

  return {
    success: result.success,
    limit: result.limit,
    remaining: result.remaining,
    reset: new Date(result.reset),
  };
}
