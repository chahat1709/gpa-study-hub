import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { useAuth } from './AuthContext';
import {
  connectSocket,
  disconnectSocket,
  getSocketInstance,
  onSocketEvent,
  offSocketEvent,
  joinChat,
  leaveChat,
  sendMessage,
  sendTyping,
  sendStopTyping,
  startAttendanceSession,
  markAttendanceRealtime,
} from '../services/socketService';
import { getAuthToken } from '../services/apiClient';

interface SocketContextType {
  connected: boolean;
  onlineUsers: Set<string>;
  typingUsers: Map<string, Set<string>>;
  joinRoom: (chatId: string) => void;
  leaveRoom: (chatId: string) => void;
  sendChatMessage: (chatId: string, content: string, isEncrypted?: boolean) => void;
  startTyping: (chatId: string) => void;
  stopTyping: (chatId: string) => void;
  startAttendance: (data: { branch: string; semester: string; section: string; subject: string }) => void;
  markAttendanceLive: (chatId: string, studentId: string, status: string) => void;
}

const SocketContext = createContext<SocketContextType>({
  connected: false,
  onlineUsers: new Set(),
  typingUsers: new Map(),
  joinRoom: () => {},
  leaveRoom: () => {},
  sendChatMessage: () => {},
  startTyping: () => {},
  stopTyping: () => {},
  startAttendance: () => {},
  markAttendanceLive: () => {},
});

export function SocketProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [connected, setConnected] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set());
  const [typingUsers, setTypingUsers] = useState<Map<string, Set<string>>>(new Map());
  const typingTimeouts = useRef<Map<string, NodeJS.Timeout>>(new Map());

  useEffect(() => {
    if (!user) {
      disconnectSocket();
      setConnected(false);
      return;
    }

    const token = getAuthToken() || '';
    if (!token) return;

    const serverUrl = import.meta.env.VITE_API_URL || undefined;
    const socket = connectSocket(token, serverUrl);

    socket.on('connect', () => setConnected(true));
    socket.on('disconnect', () => setConnected(false));

    // Online users tracking
    onSocketEvent('user:online', ({ userId, online }: { userId: string; online: boolean }) => {
      setOnlineUsers(prev => {
        const next = new Set(prev);
        if (online) next.add(userId);
        else next.delete(userId);
        return next;
      });
    });

    // Typing indicators
    onSocketEvent('chat:typing', ({ chatId, userId }: { chatId: string; userId: string }) => {
      setTypingUsers(prev => {
        const next = new Map(prev);
        if (!next.has(chatId)) next.set(chatId, new Set());
        next.get(chatId)!.add(userId);
        return next;
      });
    });

    onSocketEvent('chat:stopTyping', ({ chatId, userId }: { chatId: string; userId: string }) => {
      setTypingUsers(prev => {
        const next = new Map(prev);
        next.get(chatId)?.delete(userId);
        if (next.get(chatId)?.size === 0) next.delete(chatId);
        return next;
      });
    });

    return () => {
      disconnectSocket();
      setConnected(false);
      setOnlineUsers(new Set());
      setTypingUsers(new Map());
    };
  }, [user]);

  const joinRoom = useCallback((chatId: string) => joinChat(chatId), []);
  const leaveRoom = useCallback((chatId: string) => leaveChat(chatId), []);
  const sendChatMessage = useCallback((chatId: string, content: string, isEncrypted = false) => {
    sendMessage(chatId, content, isEncrypted);
  }, []);

  const startTyping = useCallback((chatId: string) => {
    sendTyping(chatId);
    // Auto-stop after 3 seconds
    const existing = typingTimeouts.current.get(chatId);
    if (existing) clearTimeout(existing);
    typingTimeouts.current.set(chatId, setTimeout(() => sendStopTyping(chatId), 3000));
  }, []);

  const stopTyping = useCallback((chatId: string) => {
    sendStopTyping(chatId);
    const existing = typingTimeouts.current.get(chatId);
    if (existing) clearTimeout(existing);
  }, []);

  return (
    <SocketContext.Provider value={{
      connected,
      onlineUsers,
      typingUsers,
      joinRoom,
      leaveRoom,
      sendChatMessage,
      startTyping,
      stopTyping,
      startAttendance: startAttendanceSession,
      markAttendanceLive: markAttendanceRealtime,
    }}>
      {children}
    </SocketContext.Provider>
  );
}

export function useSocket() {
  return useContext(SocketContext);
}
