/**
 * =============================================================================
 * USE REALTIME MESSAGES - React Hook for Real-time Messages
 * =============================================================================
 * Manages real-time message updates for conversations
 * =============================================================================
 */

'use client';

import { useEffect, useCallback } from 'react';
import { useSocket } from './useSocket';
import { SocketEvent, MessageNewPayload } from '@/types/socket';
import { useQueryClient } from '@tanstack/react-query';

/**
 * Hook for real-time message updates
 */
export function useRealtimeMessages(conversationId?: string) {
  const { on, isConnected } = useSocket();
  const queryClient = useQueryClient();

  // Listen for new messages
  useEffect(() => {
    if (!isConnected) return;

    const cleanupNew = on(SocketEvent.MESSAGE_NEW, (data: MessageNewPayload) => {
      // Only handle if it's for our conversation or if we're listening to all
      if (conversationId && data.conversationId !== conversationId) {
        return;
      }

      // Invalidate messages query to refetch
      queryClient.invalidateQueries({
        queryKey: ['messages', data.conversationId],
      });

      // Invalidate conversations list
      queryClient.invalidateQueries({
        queryKey: ['conversations'],
      });

      // Optionally play notification sound
      if (!data.message.direction || data.message.direction === 'INBOUND') {
        playNotificationSound();
      }
    });

    const cleanupSent = on(SocketEvent.MESSAGE_SENT, (data) => {
      if (conversationId && data.conversationId !== conversationId) {
        return;
      }

      queryClient.invalidateQueries({
        queryKey: ['messages', data.conversationId],
      });
    });

    const cleanupDelivered = on(SocketEvent.MESSAGE_DELIVERED, (data) => {
      if (conversationId && data.conversationId !== conversationId) {
        return;
      }

      // Update message status in cache
      queryClient.setQueryData(
        ['messages', data.conversationId],
        (old: any) => {
          if (!old) return old;

          return {
            ...old,
            messages: old.messages.map((msg: any) =>
              msg.id === data.messageId
                ? { ...msg, status: 'DELIVERED', deliveredAt: data.timestamp }
                : msg
            ),
          };
        }
      );
    });

    const cleanupRead = on(SocketEvent.MESSAGE_READ, (data) => {
      if (conversationId && data.conversationId !== conversationId) {
        return;
      }

      // Update message status in cache
      queryClient.setQueryData(
        ['messages', data.conversationId],
        (old: any) => {
          if (!old) return old;

          return {
            ...old,
            messages: old.messages.map((msg: any) =>
              msg.id === data.messageId
                ? { ...msg, status: 'READ', readAt: data.timestamp }
                : msg
            ),
          };
        }
      );
    });

    const cleanupDeleted = on(SocketEvent.MESSAGE_DELETED, (data) => {
      if (conversationId && data.conversationId !== conversationId) {
        return;
      }

      // Remove message from cache
      queryClient.setQueryData(
        ['messages', data.conversationId],
        (old: any) => {
          if (!old) return old;

          return {
            ...old,
            messages: old.messages.filter((msg: any) => msg.id !== data.messageId),
          };
        }
      );
    });

    return () => {
      cleanupNew();
      cleanupSent();
      cleanupDelivered();
      cleanupRead();
      cleanupDeleted();
    };
  }, [conversationId, isConnected, on, queryClient]);

  /**
   * Join conversation room to receive updates
   */
  const joinConversation = useCallback(
    (convId: string) => {
      // Emit join room event
      // This is handled by useSocket hook
    },
    []
  );

  /**
   * Leave conversation room
   */
  const leaveConversation = useCallback(
    (convId: string) => {
      // Emit leave room event
      // This is handled by useSocket hook
    },
    []
  );

  return {
    joinConversation,
    leaveConversation,
  };
}

/**
 * Play notification sound
 */
function playNotificationSound() {
  try {
    const audio = new Audio('/sounds/notification.mp3');
    audio.volume = 0.3;
    audio.play().catch(() => {
      // Ignore errors (e.g., user hasn't interacted with page yet)
    });
  } catch {
    // Ignore errors
  }
}
