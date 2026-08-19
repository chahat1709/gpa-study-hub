import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { useAuth } from './AuthContext';
import { onSocketEvent, offSocketEvent } from '../services/socketService';

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error' | 'attendance' | 'chat' | 'exam';
  isRead: boolean;
  link?: string;
  timestamp: Date;
}

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  addNotification: (n: Omit<Notification, 'id' | 'isRead' | 'timestamp'>) => void;
  markAsRead: (id: string) => void;
  markAllRead: () => void;
  clearNotification: (id: string) => void;
  clearAll: () => void;
}

const NotificationContext = createContext<NotificationContextType>({
  notifications: [],
  unreadCount: 0,
  addNotification: () => {},
  markAsRead: () => {},
  markAllRead: () => {},
  clearNotification: () => {},
  clearAll: () => {},
});

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);

  // Listen for real-time notifications from WebSocket
  useEffect(() => {
    if (!user) return;

    const handleNotification = (data: { message: string; type: string; from: string }) => {
      addNotification({
        title: data.type === 'chat' ? 'New Message' : 'Notification',
        message: data.message,
        type: (data.type as any) || 'info',
      });
    };

    const handleAttendanceMarked = (data: { studentId: string; status: string }) => {
      addNotification({
        title: 'Attendance Updated',
        message: `Your attendance was marked as ${data.status}`,
        type: 'attendance',
      });
    };

    const handleChatMessage = (data: { senderName: string; content: string; chatId: string }) => {
      addNotification({
        title: `Message from ${data.senderName}`,
        message: data.content.substring(0, 100),
        type: 'chat',
        link: `/chat/${data.chatId}`,
      });
    };

    onSocketEvent('notification:receive', handleNotification);
    onSocketEvent('attendance:marked', handleAttendanceMarked);
    onSocketEvent('chat:message', handleChatMessage);

    return () => {
      offSocketEvent('notification:receive', handleNotification);
      offSocketEvent('attendance:marked', handleAttendanceMarked);
      offSocketEvent('chat:message', handleChatMessage);
    };
  }, [user]);

  const addNotification = useCallback((n: Omit<Notification, 'id' | 'isRead' | 'timestamp'>) => {
    const newNotif: Notification = {
      ...n,
      id: Date.now().toString(36) + Math.random().toString(36).substr(2),
      isRead: false,
      timestamp: new Date(),
    };

    setNotifications(prev => [newNotif, ...prev].slice(0, 100)); // keep last 100

    // Show browser notification if permitted
    if ('Notification' in window && Notification.permission === 'granted') {
      try {
        new Notification(n.title, { body: n.message, icon: '/favicon.ico' });
      } catch { /* ignore */ }
    }
  }, []);

  const markAsRead = useCallback((id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
  }, []);

  const markAllRead = useCallback(() => {
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
  }, []);

  const clearNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  const clearAll = useCallback(() => {
    setNotifications([]);
  }, []);

  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <NotificationContext.Provider value={{
      notifications,
      unreadCount,
      addNotification,
      markAsRead,
      markAllRead,
      clearNotification,
      clearAll,
    }}>
      {children}
      {/* Toast container for real-time notifications */}
      <div ref={containerRef} className="fixed top-4 right-4 z-[9999] flex flex-col gap-2 max-w-sm" />
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  return useContext(NotificationContext);
}
