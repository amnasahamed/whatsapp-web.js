/**
 * =============================================================================
 * USE SOCKET - React Hook for Socket.io Client
 * =============================================================================
 * Manages Socket.io connection and provides event subscription
 * =============================================================================
 */

'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { useSession } from 'next-auth/react';
import type { ClientToServerEvents, ServerToClientEvents, SocketEvent } from '@/types/socket';

/**
 * Socket connection state
 */
export type SocketState = 'disconnected' | 'connecting' | 'connected' | 'error';

/**
 * Socket.io hook return type
 */
interface UseSocketReturn {
  socket: Socket<ServerToClientEvents, ClientToServerEvents> | null;
  isConnected: boolean;
  state: SocketState;
  emit: <K extends keyof ClientToServerEvents>(
    event: K,
    data: Parameters<ClientToServerEvents[K]>[0]
  ) => void;
  on: <K extends keyof ServerToClientEvents>(
    event: K,
    handler: ServerToClientEvents[K]
  ) => () => void;
}

/**
 * Hook for Socket.io connection
 */
export function useSocket(): UseSocketReturn {
  const { data: session, status } = useSession();
  const socketRef = useRef<Socket<ServerToClientEvents, ClientToServerEvents> | null>(null);
  const [state, setState] = useState<SocketState>('disconnected');
  const [isConnected, setIsConnected] = useState(false);

  // Initialize socket connection
  useEffect(() => {
    if (status !== 'authenticated' || !session) {
      return;
    }

    // Create socket connection
    const socket = io({
      path: '/socket.io',
      auth: {
        token: session.accessToken || '', // Assuming session has accessToken
      },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
    });

    socketRef.current = socket;

    // Connection event handlers
    socket.on('connect', () => {
      setState('connected');
      setIsConnected(true);
      console.log('Socket connected:', socket.id);
    });

    socket.on('disconnect', (reason) => {
      setState('disconnected');
      setIsConnected(false);
      console.log('Socket disconnected:', reason);
    });

    socket.on('connect_error', (error) => {
      setState('error');
      setIsConnected(false);
      console.error('Socket connection error:', error.message);
    });

    // Cleanup on unmount
    return () => {
      if (socket.connected) {
        socket.disconnect();
      }
      socketRef.current = null;
    };
  }, [session, status]);

  /**
   * Emit event to server
   */
  const emit = useCallback(
    <K extends keyof ClientToServerEvents>(
      event: K,
      data: Parameters<ClientToServerEvents[K]>[0]
    ) => {
      if (socketRef.current?.connected) {
        socketRef.current.emit(event, data);
      } else {
        console.warn('Socket not connected, cannot emit:', event);
      }
    },
    []
  );

  /**
   * Subscribe to event from server
   * Returns cleanup function
   */
  const on = useCallback(
    <K extends keyof ServerToClientEvents>(event: K, handler: ServerToClientEvents[K]) => {
      if (socketRef.current) {
        socketRef.current.on(event, handler);

        // Return cleanup function
        return () => {
          socketRef.current?.off(event, handler);
        };
      }

      return () => {};
    },
    []
  );

  return {
    socket: socketRef.current,
    isConnected,
    state,
    emit,
    on,
  };
}
