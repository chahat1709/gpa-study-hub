const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const pino = require('pino');
const { v4: uuidv4 } = require('uuid');

const log = pino({ name: 'websocket' });

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  log.fatal('JWT_SECRET environment variable is required for WebSocket');
  throw new Error('JWT_SECRET environment variable is required');
}

const MAX_SOCKETS_PER_USER = 10;
const MAX_MESSAGES_PER_MINUTE = 30;
const MAX_JOINS_PER_MINUTE = 20;

function setupWebSocket(server, db) {
  const io = new Server(server, {
    cors: {
      origin: process.env.CORS_ORIGINS?.split(',') || ['http://localhost:5173'],
      methods: ['GET', 'POST'],
      credentials: true,
    },
    pingTimeout: 60000,
    pingInterval: 25000,
    transports: ['websocket', 'polling'],
    maxHttpBufferSize: 1e6, // 1MB max message size
  });

  // Rate limiter per socket
  const rateLimits = new Map();

  function checkRateLimit(socketId, event, maxPerMinute) {
    const key = `${socketId}:${event}`;
    const now = Date.now();
    const entry = rateLimits.get(key);
    if (!entry || now > entry.resetTime) {
      rateLimits.set(key, { count: 1, resetTime: now + 60000 });
      return true;
    }
    if (entry.count >= maxPerMinute) return false;
    entry.count++;
    return true;
  }

  // Auth middleware for WebSocket
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token || socket.handshake.query?.token;
    if (!token) {
      return next(new Error('Authentication required'));
    }
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      // Verify user exists and is active
      const user = db
        .prepare('SELECT id, name, role, is_active, institution_id FROM users WHERE id = ?')
        .get(decoded.id);
      if (!user || !user.is_active) {
        return next(new Error('Account inactive or not found'));
      }
      socket.user = {
        id: user.id,
        name: user.name,
        role: user.role,
        institutionId: user.institution_id,
      };
      next();
    } catch {
      next(new Error('Invalid token'));
    }
  });

  // Track connected users
  const onlineUsers = new Map(); // userId -> Set<socketId>

  // Check if user is participant of a chat
  function isChatParticipant(chatId, userId) {
    try {
      const chat = db.prepare('SELECT participants FROM chats WHERE id = ?').get(chatId);
      if (!chat) return false;
      const participants = JSON.parse(chat.participants);
      return participants.includes(userId);
    } catch {
      return false;
    }
  }

  // Sanitize message content
  function sanitizeContent(content) {
    if (typeof content !== 'string') return '';
    return content
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;')
      .replace(/javascript:/gi, '')
      .replace(/on\w+\s*=/gi, '')
      .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, '')
      .trim()
      .substring(0, 5000);
  }

  io.on('connection', socket => {
    const userId = socket.user.id;

    // Enforce max connections per user
    if (onlineUsers.has(userId) && onlineUsers.get(userId).size >= MAX_SOCKETS_PER_USER) {
      log.warn({ userId }, 'Max connections reached, disconnecting');
      socket.disconnect(true);
      return;
    }

    log.info({ userId, socketId: socket.id }, 'WebSocket connected');

    // Register user as online
    if (!onlineUsers.has(userId)) {
      onlineUsers.set(userId, new Set());
    }
    onlineUsers.get(userId).add(socket.id);

    // Broadcast online status only to relevant users (not globally)
    socket.broadcast.emit('user:online', { userId, online: true });

    // ── Chat Events ──────────────────────────────────────────────────────
    socket.on('chat:join', chatId => {
      if (!checkRateLimit(socket.id, 'chat:join', MAX_JOINS_PER_MINUTE)) {
        return socket.emit('error', { message: 'Rate limit exceeded' });
      }
      if (!chatId || typeof chatId !== 'string') return;
      if (!isChatParticipant(chatId, userId)) {
        return socket.emit('error', { message: 'Not authorized to join this chat' });
      }
      socket.join(`chat:${chatId}`);
      log.debug({ userId, chatId }, 'Joined chat room');
    });

    socket.on('chat:leave', chatId => {
      if (!chatId || typeof chatId !== 'string') return;
      socket.leave(`chat:${chatId}`);
    });

    socket.on('chat:message', data => {
      if (!checkRateLimit(socket.id, 'chat:message', MAX_MESSAGES_PER_MINUTE)) {
        return socket.emit('error', { message: 'Rate limit exceeded' });
      }

      const { chatId, content, isEncrypted } = data;
      if (!chatId || !content || typeof content !== 'string') return;

      // Verify user is participant of this chat
      if (!isChatParticipant(chatId, userId)) {
        return socket.emit('error', { message: 'Not authorized to send messages to this chat' });
      }

      const sanitized = sanitizeContent(content);
      if (!sanitized) return;

      try {
        const id = uuidv4();
        db.prepare(
          'INSERT INTO messages (id, chat_id, sender_id, sender_name, content, is_encrypted) VALUES (?, ?, ?, ?, ?, ?)'
        ).run(id, chatId, userId, socket.user.name, sanitized, isEncrypted ? 1 : 0);
        db.prepare(
          'UPDATE chats SET last_message = ?, last_timestamp = datetime("now") WHERE id = ?'
        ).run(sanitized.substring(0, 100), chatId);

        io.to(`chat:${chatId}`).emit('chat:message', {
          id,
          chatId,
          senderId: userId,
          senderName: socket.user.name,
          content: sanitized,
          isEncrypted: isEncrypted ? 1 : 0,
          timestamp: new Date().toISOString(),
        });
      } catch (e) {
        log.error({ err: e }, 'Failed to send message');
      }
    });

    socket.on('chat:typing', ({ chatId }) => {
      if (!chatId || typeof chatId !== 'string') return;
      if (!isChatParticipant(chatId, userId)) return;
      if (!checkRateLimit(socket.id, 'chat:typing', 10)) return;
      socket.to(`chat:${chatId}`).emit('chat:typing', { chatId, userId, name: socket.user.name });
    });

    socket.on('chat:stopTyping', ({ chatId }) => {
      if (!chatId || typeof chatId !== 'string') return;
      if (!checkRateLimit(socket.id, 'chat:stopTyping', 10)) return;
      socket.to(`chat:${chatId}`).emit('chat:stopTyping', { chatId, userId });
    });

    // ── Attendance Events (Faculty only) ────────────────────────────────
    socket.on('attendance:startSession', data => {
      if (socket.user.role !== 'FACULTY' && socket.user.role !== 'GTU_ADMIN') {
        return socket.emit('error', { message: 'Faculty only' });
      }
      if (!checkRateLimit(socket.id, 'attendance', 10)) return;
      const { branch, semester, section, subject } = data;
      if (!branch || !semester || !section || !subject) return;
      const room = `attendance:${branch}:${semester}:${section}`;
      socket.join(room);
      io.to(room).emit('attendance:sessionStarted', {
        subject,
        branch,
        semester,
        section,
        startedBy: userId,
      });
    });

    socket.on('attendance:mark', data => {
      if (socket.user.role !== 'FACULTY' && socket.user.role !== 'GTU_ADMIN') {
        return socket.emit('error', { message: 'Faculty only' });
      }
      if (!checkRateLimit(socket.id, 'attendance', 60)) return;
      const { chatId, studentId, status } = data;
      if (!chatId || !studentId || !status) return;
      const validStatuses = ['PRESENT', 'ABSENT', 'LATE', 'EXCUSED'];
      if (!validStatuses.includes(status)) return;

      const student = db.prepare('SELECT institution_id FROM users WHERE id = ?').get(studentId);
      if (!student) return socket.emit('error', { message: 'Student not found' });
      if (student.institution_id && student.institution_id !== socket.user.institutionId) {
        return socket.emit('error', { message: 'Access denied' });
      }

      io.to(`chat:${chatId}`).emit('attendance:marked', { studentId, status, markedBy: userId });
    });

    // ── Notifications (admin/system only) ────────────────────────────────
    socket.on('notification:send', data => {
      if (socket.user.role !== 'GTU_ADMIN') {
        return socket.emit('error', { message: 'Admin only' });
      }
      if (!checkRateLimit(socket.id, 'notification', 30)) return;
      const { targetUserId, message, type } = data;
      if (!targetUserId || !message || typeof message !== 'string') return;
      const sanitizedMsg = sanitizeContent(message).substring(0, 500);

      const target = db.prepare('SELECT institution_id FROM users WHERE id = ?').get(targetUserId);
      if (!target) return socket.emit('error', { message: 'Target user not found' });
      if (target.institution_id && target.institution_id !== socket.user.institutionId) {
        return socket.emit('error', { message: 'Access denied' });
      }

      const targetSockets = onlineUsers.get(targetUserId);
      if (targetSockets) {
        targetSockets.forEach(sid => {
          io.to(sid).emit('notification:receive', {
            message: sanitizedMsg,
            type: type || 'info',
            from: userId,
          });
        });
      }
    });

    // ── Exam Events ──────────────────────────────────────────────────────
    socket.on('exam:join', examId => {
      if (!checkRateLimit(socket.id, 'exam', 10)) return;
      if (!examId || typeof examId !== 'string') return;
      const exam = db
        .prepare(
          'SELECT id, branch, semester, institution_id, is_published FROM exams WHERE id = ?'
        )
        .get(examId);
      if (!exam) return socket.emit('error', { message: 'Exam not found' });
      if (exam.institution_id && exam.institution_id !== socket.user.institutionId) {
        return socket.emit('error', { message: 'Access denied' });
      }
      if (
        exam.is_published === 0 &&
        socket.user.role !== 'FACULTY' &&
        socket.user.role !== 'GTU_ADMIN'
      ) {
        return socket.emit('error', { message: 'Exam not yet available' });
      }
      socket.join(`exam:${examId}`);
    });

    socket.on('exam:submit', data => {
      if (!checkRateLimit(socket.id, 'exam', 5)) return;
      const { examId, answers } = data;
      if (!examId || !answers || typeof answers !== 'object') return;

      const exam = db
        .prepare('SELECT id, total_marks, questions, institution_id FROM exams WHERE id = ?')
        .get(examId);
      if (!exam) return socket.emit('error', { message: 'Exam not found' });
      if (exam.institution_id && exam.institution_id !== socket.user.institutionId) {
        return socket.emit('error', { message: 'Access denied' });
      }

      let score = 0;
      const total = exam.total_marks || 100;
      try {
        const questions = JSON.parse(exam.questions || '[]');
        if (Array.isArray(questions) && questions.length > 0) {
          const pointsPerQ = total / questions.length;
          for (const q of questions) {
            if (answers[q.id] && answers[q.id] === q.correctAnswer) {
              score += pointsPerQ;
            }
          }
          score = Math.round(score);
        }
      } catch {
        /* default to 0 */
      }

      try {
        const id = uuidv4();
        db.prepare(
          'INSERT INTO exam_results (id, user_id, exam_id, score, total, answers) VALUES (?, ?, ?, ?, ?, ?)'
        ).run(id, userId, examId, score, total, JSON.stringify(answers));
        socket.emit('exam:submitted', { examId, success: true, score, total });
      } catch (e) {
        log.error({ err: e }, 'Failed to save exam result');
        socket.emit('error', { message: 'Failed to submit exam' });
      }
    });

    // ── Disconnect ───────────────────────────────────────────────────────
    socket.on('disconnect', reason => {
      const userSockets = onlineUsers.get(userId);
      if (userSockets) {
        userSockets.delete(socket.id);
        if (userSockets.size === 0) {
          onlineUsers.delete(userId);
          socket.broadcast.emit('user:online', { userId, online: false });
        }
      }
      // Cleanup rate limits
      for (const [key] of rateLimits) {
        if (key.startsWith(socket.id + ':')) rateLimits.delete(key);
      }
      log.info({ userId, socketId: socket.id, reason }, 'WebSocket disconnected');
    });
  });

  // Periodic cleanup of stale connections
  setInterval(() => {
    for (const [userId, sockets] of onlineUsers) {
      for (const socketId of sockets) {
        const socket = io.sockets.sockets.get(socketId);
        if (!socket) {
          sockets.delete(socketId);
        }
      }
      if (sockets.size === 0) {
        onlineUsers.delete(userId);
      }
    }
    // Cleanup expired rate limits
    const now = Date.now();
    for (const [key, entry] of rateLimits) {
      if (now > entry.resetTime) rateLimits.delete(key);
    }
  }, 60000);

  // Expose metrics
  io.getMetrics = () => ({
    connectedUsers: onlineUsers.size,
    totalConnections: Array.from(onlineUsers.values()).reduce((sum, s) => sum + s.size, 0),
  });

  return io;
}

module.exports = { setupWebSocket };
