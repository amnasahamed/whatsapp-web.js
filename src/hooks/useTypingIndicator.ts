/**
 * =============================================================================
 * USE TYPING INDICATOR - React Hook for Typing Indicators
 * =============================================================================
 * Manages typing indicators for conversations
 * =============================================================================
 */

'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useSocket } from './useSocket';
import { SocketEvent, TypingStartPayload } from '@/types/socket';

/**
 * Typing user info
 */
interface TypingUser {
  userId: string;
  userName: string;
  startedAt: Date;
}

/**
 * Hook for managing typing indicators
 */
export function useTypingIndicator(conversationId: string) {
  const { on, emit, isConnected } = useSocket();
  const [typingUsers, setTypingUsers] = useState<Map<string, TypingUser>>(new Map());
  const typingTimeoutRef = useRef<Map<string, NodeJS.Timeout>>(new Map());

  // Listen for typing events
  useEffect(() => {
    if (!isConnected || !conversationId) return;

    const cleanupStart = on(SocketEvent.TYPING_START, (data: TypingStartPayload) => {
      if (data.conversationId === conversationId) {
        setTypingUsers((prev) => {
          const next = new Map(prev);
          next.set(data.userId, {
            userId: data.userId,
            userName: data.userName,
            startedAt: new Date(),
          });
          return next;
        });

        // Clear existing timeout
        const existingTimeout = typingTimeoutRef.current.get(data.userId);
        if (existingTimeout) {
          clearTimeout(existingTimeout);
        }

        // Auto-remove after 5 seconds
        const timeout = setTimeout(() => {
          setTypingUsers((prev) => {
            const next = new Map(prev);
            next.delete(data.userId);
            return next;
          });
          typingTimeoutRef.current.delete(data.userId);
        }, 5000);

        typingTimeoutRef.current.set(data.userId, timeout);
      }
    });

    const cleanupStop = on(SocketEvent.TYPING_STOP, (data) => {
      if (data.conversationId === conversationId) {
        setTypingUsers((prev) => {
          const next = new Map(prev);
          next.delete(data.userId);
          return next;
        });

        const timeout = typingTimeoutRef.current.get(data.userId);
        if (timeout) {
          clearTimeout(timeout);
          typingTimeoutRef.current.delete(data.userId);
        }
      }
    });

    return () => {
      cleanupStart();
      cleanupStop();

      // Clear all timeouts
      typingTimeoutRef.current.forEach((timeout) => clearTimeout(timeout));
      typingTimeoutRef.current.clear();
    };
  }, [conversationId, isConnected, on]);

  /**
   * Start typing
   */
  const startTyping = useCallback(() => {
    if (conversationId) {
      emit(SocketEvent.TYPING_START, { conversationId });
    }
  }, [conversationId, emit]);

  /**
   * Stop typing
   */
  const stopTyping = useCallback(() => {
    if (conversationId) {
      emit(SocketEvent.TYPING_STOP, { conversationId });
    }
  }, [conversationId, emit]);

  /**
   * Get typing users as array
   */
  const getTypingUsers = useCallback((): TypingUser[] => {
    return Array.from(typingUsers.values());
  }, [typingUsers]);

  /**
   * Get typing indicator text
   */
  const getTypingText = useCallback((): string => {
    const users = getTypingUsers();

    if (users.length === 0) {
      return '';
    } else if (users.length === 1) {
      return `${users[0]!.userName} is typing...`;
    } else if (users.length === 2) {
      return `${users[0]!.userName} and ${users[1]!.userName} are typing...`;
    } else {
      return `${users[0]!.userName} and ${users.length - 1} others are typing...`;
    }
  }, [getTypingUsers]);

  /**
   * Check if anyone is typing
   */
  const isAnyoneTyping = useCallback((): boolean => {
    return typingUsers.size > 0;
  }, [typingUsers]);

  return {
    typingUsers: getTypingUsers(),
    startTyping,
    stopTyping,
    getTypingText,
    isAnyoneTyping,
  };
}
