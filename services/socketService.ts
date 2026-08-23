import { io, Socket } from 'socket.io-client';

let socket: Socket | null = null;
let listeners: Map<string, Set<Function>> = new Map();

export function getSocket(token: string, serverUrl?: string): Socket {
  if (socket?.connected) return socket;

  const url = serverUrl || import.meta.env.VITE_API_URL || window.location.origin;

  socket = io(url, {
    auth: { token },
    transports: ['websocket', 'polling'],
    reconnection: true,
    reconnectionAttempts: 10,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 10000,
    timeout: 10000,
    autoConnect: false,
  });

  // Store reference for event listeners (not exposed on window)
  const socketRef = socket;

  socket.on('connect', () => {
    if (import.meta.env.DEV) console.log('[WS] Connected');
  });

  socket.on('disconnect', reason => {
    if (import.meta.env.DEV) console.log('[WS] Disconnected:', reason);
  });

  socket.on('connect_error', err => {
    if (import.meta.env.DEV) console.error('[WS] Connection error:', err.message);
  });

  return socket;
}

export function connectSocket(token: string, serverUrl?: string): Socket {
  const s = getSocket(token, serverUrl);
  if (!s.connected) {
    s.connect();
  }
  return s;
}

export function disconnectSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
    listeners.clear();
  }
}

export function getSocketInstance(): Socket | null {
  return socket;
}

// ── Event Helpers ────────────────────────────────────────────────────────
export function onSocketEvent(event: string, callback: Function) {
  if (!socket) return;
  socket.on(event, callback as any);
  if (!listeners.has(event)) listeners.set(event, new Set());
  listeners.get(event)!.add(callback);
}

export function offSocketEvent(event: string, callback: Function) {
  if (!socket) return;
  socket.off(event, callback as any);
  listeners.get(event)?.delete(callback);
}

// ── Chat Events ─────────────────────────────────────────────────────────
export function joinChat(chatId: string) {
  socket?.emit('chat:join', { chatId });
}

export function leaveChat(chatId: string) {
  socket?.emit('chat:leave', { chatId });
}

export function sendMessage(chatId: string, content: string, isEncrypted = false) {
  socket?.emit('chat:message', { chatId, content, isEncrypted });
}

export function sendTyping(chatId: string) {
  socket?.emit('chat:typing', { chatId });
}

export function sendStopTyping(chatId: string) {
  socket?.emit('chat:stopTyping', { chatId });
}

// ── Attendance Events ───────────────────────────────────────────────────
export function startAttendanceSession(data: {
  branch: string;
  semester: string;
  section: string;
  subject: string;
}) {
  socket?.emit('attendance:startSession', data);
}

export function markAttendanceRealtime(chatId: string, studentId: string, status: string) {
  socket?.emit('attendance:mark', { chatId, studentId, status });
}

// ── Exam Events ─────────────────────────────────────────────────────────
export function joinExam(examId: string) {
  socket?.emit('exam:join', { examId });
}

export function submitExamRealtime(examId: string, answers: Record<string, any>) {
  socket?.emit('exam:submit', { examId, answers });
}

// ── Notification Events ─────────────────────────────────────────────────
export function sendNotification(targetUserId: string, message: string, type = 'info') {
  socket?.emit('notification:send', { targetUserId, message, type });
}
