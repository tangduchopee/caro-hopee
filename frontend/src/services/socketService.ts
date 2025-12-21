import { io, Socket } from 'socket.io-client';
import { SOCKET_URL } from '../utils/constants';
import { ClientToServerEvents, ServerToClientEvents } from '../types/socket.types';

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

    this.socket = io(SOCKET_URL, {
      auth: {
        token: token || null,
      },
      transports: ['websocket'],
    });

    // Add listeners only once
    this.socket.on('connect', () => {
      console.log('Socket connected:', this.socket?.id);
    });

    this.socket.on('disconnect', () => {
      console.log('Socket disconnected');
    });

    this.socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
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

