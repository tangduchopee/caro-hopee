import React, { createContext, useContext, useEffect, ReactNode } from 'react';
import { socketService } from '../services/socketService';
import { useAuth } from './AuthContext';

interface SocketContextType {
  isConnected: boolean;
}

const SocketContext = createContext<SocketContextType | undefined>(undefined);

export const SocketProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const [isConnected, setIsConnected] = React.useState(false);

  useEffect(() => {
    // Only reconnect if authentication status changed
    // Get token and reconnect
    const token = localStorage.getItem('token');
    
    // Check if we need to reconnect (socket doesn't exist or token changed)
    const socket = socketService.getSocket();
    const needsReconnect = !socket || !socket.connected;
    
    if (needsReconnect) {
      // Disconnect existing socket first (if any)
      socketService.disconnect();
      socketService.connect(token || undefined);
    }

    const currentSocket = socketService.getSocket();
    if (!currentSocket) return;

    const handleConnect = () => {
      console.log('Socket connected with token:', token ? 'Yes' : 'No');
      setIsConnected(true);
    };

    const handleDisconnect = () => {
      setIsConnected(false);
    };

    // Only add listeners if socket is new or not already listening
    // Check if listeners already exist to avoid duplicates
    currentSocket.on('connect', handleConnect);
    currentSocket.on('disconnect', handleDisconnect);

    return () => {
      // Cleanup: remove listeners
      if (currentSocket) {
        currentSocket.off('connect', handleConnect);
        currentSocket.off('disconnect', handleDisconnect);
      }
      // Don't disconnect on unmount - keep connection alive
      // socketService.disconnect();
    };
  }, [isAuthenticated]);

  return (
    <SocketContext.Provider value={{ isConnected }}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = (): SocketContextType => {
  const context = useContext(SocketContext);
  if (context === undefined) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};

