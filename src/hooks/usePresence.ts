/**
 * =============================================================================
 * USE PRESENCE - React Hook for User Presence
 * =============================================================================
 * Manages user online/offline status and tracks other users' presence
 * =============================================================================
 */

'use client';

import { useEffect, useState, useCallback } from 'react';
import { useSocket } from './useSocket';
import { SocketEvent, UserPresence } from '@/types/socket';

/**
 * Hook for managing user presence
 */
export function usePresence() {
  const { on, emit, isConnected } = useSocket();
  const [onlineUsers, setOnlineUsers] = useState<Map<string, UserPresence>>(new Map());

  // Listen for presence updates
  useEffect(() => {
    if (!isConnected) return;

    const cleanupOnline = on(SocketEvent.USER_ONLINE, (data) => {
      setOnlineUsers((prev) => {
        const next = new Map(prev);
        next.set(data.userId, {
          userId: data.userId,
          status: data.status,
          lastSeen: new Date(data.timestamp),
        });
        return next;
      });
    });

    const cleanupOffline = on(SocketEvent.USER_OFFLINE, (data) => {
      setOnlineUsers((prev) => {
        const next = new Map(prev);
        const user = next.get(data.userId);
        if (user) {
          user.status = 'offline';
          user.lastSeen = new Date(data.timestamp);
          next.set(data.userId, user);
        }
        return next;
      });
    });

    const cleanupStatus = on(SocketEvent.USER_STATUS, (data) => {
      setOnlineUsers((prev) => {
        const next = new Map(prev);
        next.set(data.userId, data);
        return next;
      });
    });

    return () => {
      cleanupOnline();
      cleanupOffline();
      cleanupStatus();
    };
  }, [isConnected, on]);

  /**
   * Update current user's status
   */
  const updateStatus = useCallback(
    (status: UserPresence['status']) => {
      emit(SocketEvent.USER_STATUS, { status });
    },
    [emit]
  );

  /**
   * Check if user is online
   */
  const isUserOnline = useCallback(
    (userId: string): boolean => {
      const user = onlineUsers.get(userId);
      return user?.status === 'online';
    },
    [onlineUsers]
  );

  /**
   * Get user presence
   */
  const getUserPresence = useCallback(
    (userId: string): UserPresence | undefined => {
      return onlineUsers.get(userId);
    },
    [onlineUsers]
  );

  /**
   * Get online user count
   */
  const getOnlineCount = useCallback((): number => {
    return Array.from(onlineUsers.values()).filter((u) => u.status === 'online').length;
  }, [onlineUsers]);

  return {
    onlineUsers,
    updateStatus,
    isUserOnline,
    getUserPresence,
    getOnlineCount,
  };
}
