/**
 * =============================================================================
 * PRESENCE HANDLER - Online Presence Tracking
 * =============================================================================
 * Manages user online/offline status and activity tracking
 * =============================================================================
 */

import type { SocketServer } from '../SocketServer';
import { SocketEvent, UserPresence } from '@/types/socket';
import { logger } from '@/lib/utils/logger';
import { redis } from '@/lib/db/redis';

/**
 * Presence Handler for tracking user status
 */
export class PresenceHandler {
  private readonly PRESENCE_TTL = 300; // 5 minutes
  private readonly PRESENCE_KEY_PREFIX = 'presence:';
  private heartbeatInterval?: NodeJS.Timeout;

  constructor(private socketServer: SocketServer) {
    this.startHeartbeat();
  }

  /**
   * Start heartbeat to check stale presence
   */
  private startHeartbeat(): void {
    // Check every minute for stale presence
    this.heartbeatInterval = setInterval(async () => {
      await this.cleanStalePresence();
    }, 60000);
  }

  /**
   * Set user presence
   */
  async setUserPresence(
    userId: string,
    status: UserPresence['status'],
    socketId?: string
  ): Promise<void> {
    try {
      const presence: UserPresence = {
        userId,
        status,
        lastSeen: new Date(),
        socketId,
      };

      const key = `${this.PRESENCE_KEY_PREFIX}${userId}`;
      await redis.set(key, JSON.stringify(presence), 'EX', this.PRESENCE_TTL);

      // Broadcast presence update
      this.socketServer.emitToAll(SocketEvent.USER_STATUS, presence);

      logger.debug('User presence updated', { userId, status });
    } catch (error) {
      logger.error('Error setting user presence', { userId, error });
    }
  }

  /**
   * Get user presence
   */
  async getUserPresence(userId: string): Promise<UserPresence | null> {
    try {
      const key = `${this.PRESENCE_KEY_PREFIX}${userId}`;
      const data = await redis.get(key);

      if (!data) {
        return null;
      }

      return JSON.parse(data) as UserPresence;
    } catch (error) {
      logger.error('Error getting user presence', { userId, error });
      return null;
    }
  }

  /**
   * Get multiple user presences
   */
  async getMultiplePresences(userIds: string[]): Promise<Map<string, UserPresence>> {
    const presences = new Map<string, UserPresence>();

    try {
      const keys = userIds.map((id) => `${this.PRESENCE_KEY_PREFIX}${id}`);
      const values = await redis.mget(...keys);

      values.forEach((value, index) => {
        if (value) {
          const presence = JSON.parse(value) as UserPresence;
          presences.set(userIds[index]!, presence);
        }
      });
    } catch (error) {
      logger.error('Error getting multiple presences', { error });
    }

    return presences;
  }

  /**
   * Get all online users
   */
  async getOnlineUsers(): Promise<UserPresence[]> {
    try {
      const keys = await redis.keys(`${this.PRESENCE_KEY_PREFIX}*`);
      const values = await redis.mget(...keys);

      const presences: UserPresence[] = [];

      for (const value of values) {
        if (value) {
          const presence = JSON.parse(value) as UserPresence;
          if (presence.status === 'online') {
            presences.push(presence);
          }
        }
      }

      return presences;
    } catch (error) {
      logger.error('Error getting online users', { error });
      return [];
    }
  }

  /**
   * Update user last seen
   */
  async updateLastSeen(userId: string): Promise<void> {
    try {
      const presence = await this.getUserPresence(userId);

      if (presence) {
        presence.lastSeen = new Date();
        const key = `${this.PRESENCE_KEY_PREFIX}${userId}`;
        await redis.set(key, JSON.stringify(presence), 'EX', this.PRESENCE_TTL);
      }
    } catch (error) {
      logger.error('Error updating last seen', { userId, error });
    }
  }

  /**
   * Clean stale presence data
   */
  private async cleanStalePresence(): Promise<void> {
    try {
      const keys = await redis.keys(`${this.PRESENCE_KEY_PREFIX}*`);
      const now = Date.now();
      const staleThreshold = 10 * 60 * 1000; // 10 minutes

      for (const key of keys) {
        const value = await redis.get(key);
        if (value) {
          const presence = JSON.parse(value) as UserPresence;
          const lastSeen = new Date(presence.lastSeen).getTime();

          if (now - lastSeen > staleThreshold) {
            await redis.del(key);
            logger.debug('Cleaned stale presence', { userId: presence.userId });
          }
        }
      }
    } catch (error) {
      logger.error('Error cleaning stale presence', { error });
    }
  }

  /**
   * Remove user presence
   */
  async removeUserPresence(userId: string): Promise<void> {
    try {
      const key = `${this.PRESENCE_KEY_PREFIX}${userId}`;
      await redis.del(key);

      logger.debug('User presence removed', { userId });
    } catch (error) {
      logger.error('Error removing user presence', { userId, error });
    }
  }

  /**
   * Stop heartbeat
   */
  stop(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
    }
  }
}
