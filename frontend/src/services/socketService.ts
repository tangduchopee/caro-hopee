import { io, Socket } from 'socket.io-client';
import { SOCKET_URL } from '../utils/constants';
import { ClientToServerEvents, ServerToClientEvents } from '../types/socket.types';
import { logger } from '../utils/logger';

class SocketService {
  private socket: Socket<ServerToClientEvents, ClientToServerEvents> | null = null;

  connect(token?: string): void {
    // If socket already exists and is connected, don't reconnect
    if (this.socket?.connected) {
      return;
    }

    // If socket exists but not connected, disconnect and remove listeners first
    if (this.socket) {
      this.socket.removeAllListeners();
      this.socket.disconnect();
      this.socket = null;
    }

    // Optimized socket configuration (fixes Issue #15: WebSocket reconnection strategy)
    this.socket = io(SOCKET_URL, {
      auth: {
        token: token || null,
      },
      transports: ['websocket'],
      // Reconnection strategy with exponential backoff
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,      // Start with 1 second delay
      reconnectionDelayMax: 10000,  // Cap at 10 seconds
      randomizationFactor: 0.5,     // Add jitter to prevent thundering herd
      timeout: 20000,               // Connection timeout
    });

    // Add listeners only once
    this.socket.on('connect', () => {
      logger.log('Socket connected:', this.socket?.id);
    });

    this.socket.on('disconnect', () => {
      logger.log('Socket disconnected');
    });

    this.socket.on('connect_error', (error) => {
      logger.error('Socket connection error:', error);
    });
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  getSocket(): Socket<ServerToClientEvents, ClientToServerEvents> | null {
    return this.socket;
  }

  isConnected(): boolean {
    return this.socket?.connected || false;
  }
}

export const socketService = new SocketService();

