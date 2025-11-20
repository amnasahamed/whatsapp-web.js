/**
 * =============================================================================
 * SOCKET SERVER - WebSocket Server Implementation
 * =============================================================================
 * Production-ready Socket.io server with authentication and event handling
 * =============================================================================
 */

import { Server as HTTPServer } from 'http';
import { Server as SocketIOServer, Socket } from 'socket.io';
import { verify } from 'jsonwebtoken';
import {
  ServerToClientEvents,
  ClientToServerEvents,
  SocketData,
  SocketEvent,
  AuthenticatePayload,
  ExtendedSocket,
} from '@/types/socket';
import { logger } from '@/lib/utils/logger';
import { prisma } from '@/lib/db/prisma';
import { redis } from '@/lib/db/redis';

/**
 * Socket.io Server with type safety
 */
export class SocketServer {
  private io: SocketIOServer<ClientToServerEvents, ServerToClientEvents, {}, SocketData>;
  private connectedUsers: Map<string, Set<string>> = new Map(); // userId -> Set<socketId>

  constructor(httpServer: HTTPServer) {
    // Initialize Socket.io server
    this.io = new SocketIOServer<ClientToServerEvents, ServerToClientEvents, {}, SocketData>(
      httpServer,
      {
        cors: {
          origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
          credentials: true,
        },
        path: '/socket.io',
        transports: ['websocket', 'polling'],
        pingTimeout: 60000,
        pingInterval: 25000,
      }
    );

    // Setup middleware
    this.setupMiddleware();

    // Setup connection handler
    this.setupConnectionHandler();

    logger.info('Socket.io server initialized');
  }

  /**
   * Setup authentication middleware
   */
  private setupMiddleware(): void {
    this.io.use(async (socket, next) => {
      try {
        const token = socket.handshake.auth.token as string;

        if (!token) {
          logger.warn('Socket connection attempt without token', {
            socketId: socket.id,
          });
          return next(new Error('Authentication token required'));
        }

        // Verify JWT token
        const secret = process.env.NEXTAUTH_SECRET || process.env.JWT_SECRET;
        if (!secret) {
          logger.error('JWT secret not configured');
          return next(new Error('Server configuration error'));
        }

        const decoded = verify(token, secret) as { id: string; email: string };

        // Check if user exists and is active
        const user = await prisma.user.findUnique({
          where: { id: decoded.id },
          select: { id: true, status: true },
        });

        if (!user || user.status !== 'ACTIVE') {
          logger.warn('Socket connection attempt with invalid user', {
            userId: decoded.id,
            socketId: socket.id,
          });
          return next(new Error('Invalid or inactive user'));
        }

        // Attach user data to socket
        socket.data.userId = user.id;
        socket.data.authenticated = true;
        socket.data.rooms = new Set();
        socket.data.lastActivity = new Date();

        logger.info('Socket authenticated', {
          userId: user.id,
          socketId: socket.id,
        });

        next();
      } catch (error) {
        logger.error('Socket authentication error', { error });
        next(new Error('Authentication failed'));
      }
    });
  }

  /**
   * Setup connection handler
   */
  private setupConnectionHandler(): void {
    this.io.on('connection', (socket: Socket<ClientToServerEvents, ServerToClientEvents, {}, SocketData>) => {
      const userId = socket.data.userId!;

      logger.info('Socket connected', {
        userId,
        socketId: socket.id,
      });

      // Track connected user
      if (!this.connectedUsers.has(userId)) {
        this.connectedUsers.set(userId, new Set());
      }
      this.connectedUsers.get(userId)!.add(socket.id);

      // Auto-join user room
      socket.join(`user:${userId}`);

      // Emit authenticated event
      socket.emit(SocketEvent.AUTHENTICATED, {
        success: true,
        userId,
        socketId: socket.id,
      });

      // Broadcast user online status
      this.broadcastPresenceUpdate(userId, 'online');

      // Setup event handlers
      this.setupEventHandlers(socket);

      // Handle disconnection
      socket.on('disconnect', () => this.handleDisconnect(socket));
    });
  }

  /**
   * Setup event handlers for a socket
   */
  private setupEventHandlers(socket: Socket<ClientToServerEvents, ServerToClientEvents, {}, SocketData>): void {
    const userId = socket.data.userId!;

    // Room management
    socket.on(SocketEvent.JOIN_ROOM, async (data) => {
      try {
        const roomName = this.getRoomName(data.roomType, data.resourceId);
        socket.join(roomName);
        socket.data.rooms.add(roomName);

        logger.debug('Socket joined room', {
          userId,
          socketId: socket.id,
          room: roomName,
        });
      } catch (error) {
        logger.error('Error joining room', { userId, error });
      }
    });

    socket.on(SocketEvent.LEAVE_ROOM, (data) => {
      socket.leave(data.room);
      socket.data.rooms.delete(data.room);

      logger.debug('Socket left room', {
        userId,
        socketId: socket.id,
        room: data.room,
      });
    });

    // Typing indicators
    socket.on(SocketEvent.TYPING_START, async (data) => {
      try {
        const user = await prisma.user.findUnique({
          where: { id: userId },
          select: { name: true },
        });

        // Broadcast to conversation room (except sender)
        socket.to(`conversation:${data.conversationId}`).emit(SocketEvent.TYPING_START, {
          conversationId: data.conversationId,
          userId,
          userName: user?.name || 'Unknown',
        });

        logger.debug('Typing started', {
          userId,
          conversationId: data.conversationId,
        });
      } catch (error) {
        logger.error('Error broadcasting typing start', { userId, error });
      }
    });

    socket.on(SocketEvent.TYPING_STOP, (data) => {
      socket.to(`conversation:${data.conversationId}`).emit(SocketEvent.TYPING_STOP, {
        conversationId: data.conversationId,
        userId,
      });

      logger.debug('Typing stopped', {
        userId,
        conversationId: data.conversationId,
      });
    });

    // Presence updates
    socket.on(SocketEvent.USER_STATUS, async (data) => {
      try {
        // Update presence in Redis
        await this.updatePresenceInRedis(userId, data.status);

        // Broadcast to all users
        this.io.emit(SocketEvent.USER_STATUS, {
          userId,
          status: data.status,
          lastSeen: new Date(),
          socketId: socket.id,
        });

        logger.debug('User status updated', {
          userId,
          status: data.status,
        });
      } catch (error) {
        logger.error('Error updating user status', { userId, error });
      }
    });

    // Update last activity
    const updateActivity = () => {
      socket.data.lastActivity = new Date();
    };

    socket.onAny(updateActivity);
  }

  /**
   * Handle socket disconnection
   */
  private handleDisconnect(socket: Socket<ClientToServerEvents, ServerToClientEvents, {}, SocketData>): void {
    const userId = socket.data.userId!;

    logger.info('Socket disconnected', {
      userId,
      socketId: socket.id,
    });

    // Remove from connected users
    const userSockets = this.connectedUsers.get(userId);
    if (userSockets) {
      userSockets.delete(socket.id);
      if (userSockets.size === 0) {
        this.connectedUsers.delete(userId);
        // User is fully offline
        this.broadcastPresenceUpdate(userId, 'offline');
      }
    }

    // Update presence in Redis
    this.updatePresenceInRedis(userId, 'offline').catch((error) => {
      logger.error('Error updating presence on disconnect', { userId, error });
    });
  }

  /**
   * Broadcast presence update
   */
  private broadcastPresenceUpdate(userId: string, status: 'online' | 'offline'): void {
    const event = status === 'online' ? SocketEvent.USER_ONLINE : SocketEvent.USER_OFFLINE;

    this.io.emit(event, {
      userId,
      status,
      timestamp: new Date(),
    });

    logger.debug('Presence updated', { userId, status });
  }

  /**
   * Update presence in Redis
   */
  private async updatePresenceInRedis(
    userId: string,
    status: 'online' | 'offline' | 'away' | 'busy'
  ): Promise<void> {
    const key = `presence:${userId}`;
    const data = {
      userId,
      status,
      lastSeen: new Date().toISOString(),
    };

    if (status === 'offline') {
      await redis.set(key, JSON.stringify(data), 'EX', 86400); // 24 hours
    } else {
      await redis.set(key, JSON.stringify(data), 'EX', 300); // 5 minutes (refresh)
    }
  }

  /**
   * Get room name for a resource
   */
  private getRoomName(roomType: string, resourceId?: string): string {
    return resourceId ? `${roomType}:${resourceId}` : roomType;
  }

  /**
   * Emit event to specific user
   */
  emitToUser<K extends keyof ServerToClientEvents>(
    userId: string,
    event: K,
    data: Parameters<ServerToClientEvents[K]>[0]
  ): void {
    this.io.to(`user:${userId}`).emit(event, data);
  }

  /**
   * Emit event to specific room
   */
  emitToRoom<K extends keyof ServerToClientEvents>(
    room: string,
    event: K,
    data: Parameters<ServerToClientEvents[K]>[0]
  ): void {
    this.io.to(room).emit(event, data);
  }

  /**
   * Emit event to all connected clients
   */
  emitToAll<K extends keyof ServerToClientEvents>(
    event: K,
    data: Parameters<ServerToClientEvents[K]>[0]
  ): void {
    this.io.emit(event, data);
  }

  /**
   * Check if user is online
   */
  isUserOnline(userId: string): boolean {
    return this.connectedUsers.has(userId);
  }

  /**
   * Get online user count
   */
  getOnlineUserCount(): number {
    return this.connectedUsers.size;
  }

  /**
   * Get all online user IDs
   */
  getOnlineUserIds(): string[] {
    return Array.from(this.connectedUsers.keys());
  }

  /**
   * Get Socket.io instance
   */
  getIO(): SocketIOServer<ClientToServerEvents, ServerToClientEvents, {}, SocketData> {
    return this.io;
  }

  /**
   * Close server
   */
  async close(): Promise<void> {
    logger.info('Closing Socket.io server');
    this.io.close();
  }
}

/**
 * Global socket server instance
 */
let socketServer: SocketServer | null = null;

/**
 * Initialize socket server
 */
export function initializeSocketServer(httpServer: HTTPServer): SocketServer {
  if (socketServer) {
    logger.warn('Socket server already initialized');
    return socketServer;
  }

  socketServer = new SocketServer(httpServer);
  return socketServer;
}

/**
 * Get socket server instance
 */
export function getSocketServer(): SocketServer {
  if (!socketServer) {
    throw new Error('Socket server not initialized');
  }
  return socketServer;
}
