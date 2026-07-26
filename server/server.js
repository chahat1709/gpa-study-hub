const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const hpp = require('hpp');
const Database = require('better-sqlite3');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const pino = require('pino');
const cluster = require('cluster');
const os = require('os');

// ── JWT Config ──────────────────────────────────────────────────────────────────
const JWT_SECRET = process.env.JWT_SECRET || crypto.randomBytes(64).toString('hex');
const JWT_EXPIRES = '30d';

function generateToken(user) {
  return jwt.sign({ id: user.id, role: user.role, name: user.name }, JWT_SECRET, { expiresIn: JWT_EXPIRES });
}

function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch {
    return null;
  }
}

function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return jsonResponse(res, { error: 'Authorization required' }, 401);
  }
  const decoded = verifyToken(authHeader.split(' ')[1]);
  if (!decoded) {
    return jsonResponse(res, { error: 'Invalid or expired token' }, 401);
  }
  req.user = decoded;
  next();
}

// ── Logger ──────────────────────────────────────────────────────────────────────
const log = pino({
  level: process.env.LOG_LEVEL || 'info',
  transport: process.env.NODE_ENV !== 'production' ? { target: 'pino-pretty', options: { colorize: true, translateTime: 'SYS:HH:MM:ss' } } : undefined,
  serializers: {
    req: (req) => ({ method: req.method, url: req.url, ip: req.ip, userAgent: req.headers['user-agent'] }),
    res: (res) => ({ statusCode: res.statusCode }),
  },
});

// ── Monitoring State ────────────────────────────────────────────────────────────
const metrics = {
  requests: 0,
  errors: 0,
  startTime: Date.now(),
  responseTimes: [],
  lastMinuteRequests: 0,
  lastMinuteStart: Date.now(),
};

function trackRequest(durationMs) {
  metrics.requests++;
  metrics.responseTimes.push(durationMs);
  if (metrics.responseTimes.length > 1000) metrics.responseTimes.shift();
  const now = Date.now();
  if (now - metrics.lastMinuteStart >= 60000) {
    metrics.lastMinuteRequests = metrics.lastMinuteRequests;
    metrics.lastMinuteStart = now;
  }
}

function trackError() {
  metrics.errors++;
}

function getMetrics() {
  const uptime = Math.floor((Date.now() - metrics.startTime) / 1000);
  const avgResponseTime = metrics.responseTimes.length > 0
    ? Math.round(metrics.responseTimes.reduce((a, b) => a + b, 0) / metrics.responseTimes.length)
    : 0;
  const p95 = metrics.responseTimes.length > 0
    ? metrics.responseTimes.sort((a, b) => a - b)[Math.floor(metrics.responseTimes.length * 0.95)]
    : 0;
  return {
    uptime,
    totalRequests: metrics.requests,
    totalErrors: metrics.errors,
    errorRate: metrics.requests > 0 ? ((metrics.errors / metrics.requests) * 100).toFixed(2) + '%' : '0%',
    avgResponseTimeMs: avgResponseTime,
    p95ResponseTimeMs: p95,
    memoryUsage: process.memoryUsage(),
    cpuUsage: process.cpuUsage(),
    dbSize: getDbSize(),
  };
}

function getDbSize() {
  try {
    const dbPath = path.join(__dirname, 'gpa_hub.db');
    if (fs.existsSync(dbPath)) {
      const stats = fs.statSync(dbPath);
      return `${(stats.size / 1024).toFixed(1)} KB`;
    }
  } catch { /* ignore */ }
  return 'unknown';
}

// ── Alert Thresholds ────────────────────────────────────────────────────────────
const ALERTS = {
  errorRateThreshold: 10,
  responseTimeThreshold: 2000,
  memoryThresholdMB: 512,
};

function checkAlerts() {
  const alerts = [];
  if (metrics.requests > 100) {
    const errorRate = (metrics.errors / metrics.requests) * 100;
    if (errorRate > ALERTS.errorRateThreshold) {
      alerts.push({ level: 'critical', message: `Error rate ${errorRate.toFixed(1)}% exceeds threshold ${ALERTS.errorRateThreshold}%` });
    }
  }
  const memMB = process.memoryUsage().heapUsed / 1024 / 1024;
  if (memMB > ALERTS.memoryThresholdMB) {
    alerts.push({ level: 'warning', message: `Memory usage ${memMB.toFixed(0)}MB exceeds threshold ${ALERTS.memoryThresholdMB}MB` });
  }
  if (metrics.responseTimes.length > 0) {
    const avg = metrics.responseTimes.reduce((a, b) => a + b, 0) / metrics.responseTimes.length;
    if (avg > ALERTS.responseTimeThreshold) {
      alerts.push({ level: 'warning', message: `Avg response time ${avg.toFixed(0)}ms exceeds threshold ${ALERTS.responseTimeThreshold}ms` });
    }
  }
  return alerts;
}

// ── App Setup ───────────────────────────────────────────────────────────────────
const app = express();
const PORT = process.env.PORT || 3000;

// ── Security Middleware ─────────────────────────────────────────────────────────
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false,
}));

app.use(hpp());

app.use(cors({
  origin: function (origin, callback) {
    const allowed = [
      'http://localhost:5173',
      'http://localhost:3000',
      'http://localhost:4173',
      'capacitor://localhost',
    ];
    if (!origin || allowed.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      const ip = origin.match(/\/\/([\d.]+):/);
      if (ip && /^192\.168\./.test(ip[1]) || /^10\./.test(ip[1]) || /^172\.(1[6-9]|2\d|3[01])\./.test(ip[1])) {
        callback(null, true);
      } else {
        callback(null, true);
      }
    }
  },
  credentials: true,
}));

const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 500,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again later' },
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many login attempts, please wait 15 minutes' },
});

const uploadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 30,
  message: { error: 'Upload limit reached, try again later' },
});

app.use(generalLimiter);
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/signup', authLimiter);
app.use('/api/auth/faculty-login', authLimiter);
app.use('/api/auth/admin-login', authLimiter);
app.use('/api/upload', uploadLimiter);

app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ extended: false, limit: '5mb' }));

// ── Request Logging & Metrics ───────────────────────────────────────────────────
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    trackRequest(duration);
    if (res.statusCode >= 400) {
      trackError();
      log.error({ req, res, duration }, 'request error');
    } else if (req.url !== '/api/health' && req.url !== '/api/metrics') {
      log.info({ req, res, duration }, 'request completed');
    }
  });
  next();
});

// ── Input Sanitization ─────────────────────────────────────────────────────────
function sanitize(input) {
  if (typeof input !== 'string') return input;
  return input.replace(/[<>]/g, '').trim().substring(0, 5000);
}

function sanitizeObj(obj) {
  if (!obj || typeof obj !== 'object') return obj;
  const cleaned = {};
  for (const [key, val] of Object.entries(obj)) {
    if (typeof val === 'string') {
      cleaned[key] = sanitize(val);
    } else if (typeof val === 'object' && val !== null) {
      cleaned[key] = sanitizeObj(val);
    } else {
      cleaned[key] = val;
    }
  }
  return cleaned;
}

app.use((req, res, next) => {
  if (req.body && typeof req.body === 'object') {
    req.body = sanitizeObj(req.body);
  }
  if (req.query && typeof req.query === 'object') {
    for (const [key, val] of Object.entries(req.query)) {
      if (typeof val === 'string') req.query[key] = sanitize(val);
    }
  }
  next();
});

// ── File Uploads ────────────────────────────────────────────────────────────────
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });
app.use('/uploads', express.static(uploadsDir));

const ALLOWED_MIME = new Set([
  'image/jpeg', 'image/png', 'image/webp', 'image/gif',
  'application/pdf', 'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'text/plain', 'application/zip',
]);

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `${Date.now()}-${crypto.randomBytes(8).toString('hex')}${ext}`);
  },
});
const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (ALLOWED_MIME.has(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('File type not allowed'), false);
    }
  },
});

// ── Database ────────────────────────────────────────────────────────────────────
const db = new Database(path.join(__dirname, 'gpa_hub.db'));
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');
db.pragma('synchronous = NORMAL');
db.pragma('cache_size = -64000');
db.pragma('busy_timeout = 5000');

// ── Schema ──────────────────────────────────────────────────────────────────────
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    enrollment_number TEXT UNIQUE,
    pin_hash TEXT NOT NULL,
    role TEXT DEFAULT 'STUDENT',
    branch TEXT DEFAULT 'EC',
    semester TEXT DEFAULT '1',
    section TEXT DEFAULT 'A',
    university TEXT DEFAULT '',
    photo_url TEXT DEFAULT '',
    email TEXT DEFAULT '',
    password_hash TEXT DEFAULT '',
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS attendance_records (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    subject TEXT NOT NULL,
    date TEXT NOT NULL,
    status TEXT DEFAULT 'PRESENT',
    slot_id TEXT DEFAULT '',
    created_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS timetable (
    id TEXT PRIMARY KEY,
    branch TEXT NOT NULL,
    semester TEXT NOT NULL,
    day TEXT NOT NULL,
    slot_index INTEGER NOT NULL,
    subject TEXT NOT NULL,
    type TEXT DEFAULT 'LECTURE',
    start_time TEXT NOT NULL,
    end_time TEXT NOT NULL,
    faculty_name TEXT DEFAULT '',
    batch TEXT DEFAULT 'ALL'
  );

  CREATE TABLE IF NOT EXISTS tasks (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT DEFAULT '',
    due_date TEXT DEFAULT '',
    completed INTEGER DEFAULT 0,
    category TEXT DEFAULT 'GENERAL',
    created_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS resources (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT DEFAULT '',
    url TEXT DEFAULT '',
    type TEXT DEFAULT 'DOCUMENT',
    branch TEXT DEFAULT 'EC',
    semester TEXT DEFAULT '1',
    subject TEXT DEFAULT '',
    uploaded_by TEXT DEFAULT '',
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS notices (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    author TEXT DEFAULT 'Administration',
    category TEXT DEFAULT 'GENERAL',
    priority TEXT DEFAULT 'normal',
    branch TEXT DEFAULT 'ALL',
    date TEXT DEFAULT (date('now')),
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS chats (
    id TEXT PRIMARY KEY,
    participants TEXT NOT NULL,
    is_group INTEGER DEFAULT 0,
    group_name TEXT DEFAULT '',
    last_message TEXT DEFAULT '',
    last_timestamp TEXT DEFAULT (datetime('now')),
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS messages (
    id TEXT PRIMARY KEY,
    chat_id TEXT NOT NULL,
    sender_id TEXT NOT NULL,
    sender_name TEXT NOT NULL,
    content TEXT NOT NULL,
    is_encrypted INTEGER DEFAULT 0,
    timestamp TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (chat_id) REFERENCES chats(id)
  );

  CREATE TABLE IF NOT EXISTS exams (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    branch TEXT DEFAULT 'EC',
    semester TEXT DEFAULT '1',
    subject TEXT DEFAULT '',
    questions TEXT DEFAULT '[]',
    duration INTEGER DEFAULT 60,
    total_marks INTEGER DEFAULT 100,
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS exam_results (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    exam_id TEXT NOT NULL,
    score INTEGER DEFAULT 0,
    total INTEGER DEFAULT 100,
    answers TEXT DEFAULT '{}',
    completed_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (exam_id) REFERENCES exams(id)
  );

  CREATE TABLE IF NOT EXISTS faculty (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    designation TEXT DEFAULT '',
    department TEXT DEFAULT 'EC',
    email TEXT DEFAULT '',
    phone TEXT DEFAULT '',
    branch TEXT DEFAULT 'EC'
  );

  CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS audit_log (
    id TEXT PRIMARY KEY,
    action TEXT NOT NULL,
    user_id TEXT DEFAULT '',
    details TEXT DEFAULT '',
    ip TEXT DEFAULT '',
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE INDEX IF NOT EXISTS idx_attendance_user ON attendance_records(user_id);
  CREATE INDEX IF NOT EXISTS idx_tasks_user ON tasks(user_id);
  CREATE INDEX IF NOT EXISTS idx_messages_chat ON messages(chat_id);
  CREATE INDEX IF NOT EXISTS idx_chats_participants ON chats(participants);
  CREATE INDEX IF NOT EXISTS idx_users_enrollment ON users(enrollment_number);
  CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
`);

// ── Helpers ─────────────────────────────────────────────────────────────────────
function hashPin(pin) {
  const salt = 'gpa_hub_salt_v2';
  return crypto.createHash('sha256').update(pin + salt).digest('hex');
}

function generateId() {
  return uuidv4();
}

function jsonResponse(res, data, status = 200) {
  res.status(status).json(data);
}

function auditLog(action, userId, details, ip) {
  try {
    db.prepare('INSERT INTO audit_log (id, action, user_id, details, ip) VALUES (?, ?, ?, ?, ?)').run(
      generateId(), action, userId || '', details || '', ip || ''
    );
  } catch (e) {
    log.error({ err: e }, 'Failed to write audit log');
  }
}

// ── Auth Routes ─────────────────────────────────────────────────────────────────
app.post('/api/auth/signup', (req, res) => {
  try {
    const { name, enrollmentNumber, pin, branch, semester, section, university } = req.body;
    if (!name || !enrollmentNumber || !pin) {
      return jsonResponse(res, { error: 'Name, enrollment number, and PIN required' }, 400);
    }
    if (pin.length < 4 || pin.length > 8) {
      return jsonResponse(res, { error: 'PIN must be 4-8 digits' }, 400);
    }

    const existing = db.prepare('SELECT id FROM users WHERE enrollment_number = ?').get(enrollmentNumber);
    if (existing) {
      return jsonResponse(res, { error: 'Enrollment number already registered' }, 409);
    }

    const id = generateId();
    const pinHash = hashPin(pin);

    db.prepare(`
      INSERT INTO users (id, name, enrollment_number, pin_hash, branch, semester, section, university, role)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'STUDENT')
    `).run(id, name, enrollmentNumber, pinHash, branch || 'EC', semester || '1', section || 'A', university || '');

    auditLog('USER_SIGNUP', id, `New student: ${name} (${enrollmentNumber})`, req.ip);

    const user = db.prepare('SELECT id, name, enrollment_number, role, branch, semester, section, university, photo_url FROM users WHERE id = ?').get(id);
    jsonResponse(res, { success: true, user, token: generateToken(user) }, 201);
  } catch (e) {
    log.error({ err: e }, 'Signup error');
    jsonResponse(res, { error: 'Internal server error' }, 500);
  }
});

app.post('/api/auth/login', (req, res) => {
  try {
    const { enrollmentNumber, pin } = req.body;
    if (!enrollmentNumber || !pin) {
      return jsonResponse(res, { error: 'Enrollment number and PIN required' }, 400);
    }

    const pinHash = hashPin(pin);
    const user = db.prepare(`
      SELECT id, name, enrollment_number, role, branch, semester, section, university, photo_url, email
      FROM users WHERE enrollment_number = ? AND pin_hash = ?
    `).get(enrollmentNumber, pinHash);

    if (!user) {
      auditLog('LOGIN_FAILED', '', `Failed login: ${enrollmentNumber}`, req.ip);
      return jsonResponse(res, { error: 'Invalid enrollment number or PIN' }, 401);
    }

    auditLog('LOGIN_SUCCESS', user.id, '', req.ip);
    jsonResponse(res, { success: true, user, token: generateToken(user) });
  } catch (e) {
    log.error({ err: e }, 'Login error');
    jsonResponse(res, { error: 'Internal server error' }, 500);
  }
});

app.post('/api/auth/forgot-pin', (req, res) => {
  try {
    const { enrollmentNumber, newPin } = req.body;
    if (!enrollmentNumber || !newPin) {
      return jsonResponse(res, { error: 'Enrollment number and new PIN required' }, 400);
    }
    if (newPin.length < 4 || newPin.length > 8) {
      return jsonResponse(res, { error: 'PIN must be 4-8 digits' }, 400);
    }

    const user = db.prepare('SELECT id FROM users WHERE enrollment_number = ?').get(enrollmentNumber);
    if (!user) {
      return jsonResponse(res, { error: 'Enrollment number not found' }, 404);
    }

    const pinHash = hashPin(newPin);
    db.prepare('UPDATE users SET pin_hash = ? WHERE id = ?').run(pinHash, user.id);
    auditLog('PIN_RESET', user.id, 'PIN reset via forgot-pin', req.ip);
    jsonResponse(res, { success: true, message: 'PIN updated successfully' });
  } catch (e) {
    log.error({ err: e }, 'Forgot PIN error');
    jsonResponse(res, { error: 'Internal server error' }, 500);
  }
});

app.post('/api/auth/change-pin', (req, res) => {
  try {
    const { userId, oldPin, newPin } = req.body;
    if (!userId || !oldPin || !newPin) {
      return jsonResponse(res, { error: 'All fields required' }, 400);
    }
    if (newPin.length < 4 || newPin.length > 8) {
      return jsonResponse(res, { error: 'New PIN must be 4-8 digits' }, 400);
    }

    const user = db.prepare('SELECT pin_hash FROM users WHERE id = ?').get(userId);
    if (!user || user.pin_hash !== hashPin(oldPin)) {
      auditLog('PIN_CHANGE_FAILED', userId, 'Incorrect old PIN', req.ip);
      return jsonResponse(res, { error: 'Current PIN is incorrect' }, 401);
    }

    db.prepare('UPDATE users SET pin_hash = ? WHERE id = ?').run(hashPin(newPin), userId);
    auditLog('PIN_CHANGED', userId, '', req.ip);
    jsonResponse(res, { success: true, message: 'PIN changed successfully' });
  } catch (e) {
    log.error({ err: e }, 'Change PIN error');
    jsonResponse(res, { error: 'Internal server error' }, 500);
  }
});

app.post('/api/auth/faculty-login', (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return jsonResponse(res, { error: 'Email and password required' }, 400);
    }

    const pinHash = hashPin(password);
    const user = db.prepare(`
      SELECT id, name, email, role, branch, photo_url
      FROM users WHERE email = ? AND pin_hash = ? AND role IN ('FACULTY', 'GTU_ADMIN')
    `).get(email, pinHash);

    if (!user) {
      auditLog('FACULTY_LOGIN_FAILED', '', `Failed faculty login: ${email}`, req.ip);
      return jsonResponse(res, { error: 'Invalid credentials' }, 401);
    }

    auditLog('FACULTY_LOGIN', user.id, '', req.ip);
    jsonResponse(res, { success: true, user, token: generateToken(user) });
  } catch (e) {
    log.error({ err: e }, 'Faculty login error');
    jsonResponse(res, { error: 'Internal server error' }, 500);
  }
});

app.post('/api/auth/faculty-signup', (req, res) => {
  try {
    const { name, email, password, branch } = req.body;
    if (!name || !email || !password) {
      return jsonResponse(res, { error: 'All fields required' }, 400);
    }

    const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
    if (existing) {
      return jsonResponse(res, { error: 'Email already registered' }, 409);
    }

    const id = generateId();
    const pinHash = hashPin(password);

    db.prepare(`
      INSERT INTO users (id, name, email, pin_hash, role, branch)
      VALUES (?, ?, ?, ?, 'FACULTY', ?)
    `).run(id, name, email, pinHash, branch || 'EC');

    auditLog('FACULTY_SIGNUP', id, `New faculty: ${name}`, req.ip);

    const user = db.prepare('SELECT id, name, email, role, branch, photo_url FROM users WHERE id = ?').get(id);
    jsonResponse(res, { success: true, user, token: generateToken(user) }, 201);
  } catch (e) {
    log.error({ err: e }, 'Faculty signup error');
    jsonResponse(res, { error: 'Internal server error' }, 500);
  }
});

app.post('/api/auth/admin-login', (req, res) => {
  try {
    const { code } = req.body;
    if (!code) {
      return jsonResponse(res, { error: 'Admin code required' }, 400);
    }
    const ADMIN_CODE = process.env.ADMIN_CODE || 'GTU-ADMIN-2025';
    if (code !== ADMIN_CODE) {
      auditLog('ADMIN_LOGIN_FAILED', '', 'Invalid admin code', req.ip);
      return jsonResponse(res, { error: 'Invalid admin code' }, 401);
    }

    let user = db.prepare(`SELECT id, name, role FROM users WHERE role = 'GTU_ADMIN' LIMIT 1`).get();
    if (!user) {
      const id = generateId();
      db.prepare(`INSERT INTO users (id, name, email, pin_hash, role) VALUES (?, 'GTU Admin', 'admin@gtu.edu', ?, 'GTU_ADMIN')`).run(id, hashPin('admin'));
      user = { id, name: 'GTU Admin', role: 'GTU_ADMIN' };
    }

    auditLog('ADMIN_LOGIN', user.id, '', req.ip);
    jsonResponse(res, { success: true, user, token: generateToken(user) });
  } catch (e) {
    log.error({ err: e }, 'Admin login error');
    jsonResponse(res, { error: 'Internal server error' }, 500);
  }
});

app.put('/api/auth/profile/:id', (req, res) => {
  try {
    const { photo_url } = req.body;
    if (photo_url && photo_url.length > 200000) {
      return jsonResponse(res, { error: 'Photo too large' }, 400);
    }
    if (photo_url) {
      db.prepare('UPDATE users SET photo_url = ? WHERE id = ?').run(photo_url, req.params.id);
    }
    const user = db.prepare('SELECT id, name, enrollment_number, role, branch, semester, section, university, photo_url, email FROM users WHERE id = ?').get(req.params.id);
    jsonResponse(res, { success: true, user, token: generateToken(user) });
  } catch (e) {
    log.error({ err: e }, 'Profile update error');
    jsonResponse(res, { error: 'Internal server error' }, 500);
  }
});

// ── Attendance Routes ───────────────────────────────────────────────────────────
app.get('/api/attendance/:userId', (req, res) => {
  try {
    const records = db.prepare('SELECT * FROM attendance_records WHERE user_id = ? ORDER BY date DESC').all(req.params.userId);
    jsonResponse(res, { records });
  } catch (e) {
    log.error({ err: e }, 'Get attendance error');
    jsonResponse(res, { error: 'Internal server error' }, 500);
  }
});

app.post('/api/attendance', (req, res) => {
  try {
    const { userId, subject, date, status, slotId } = req.body;
    if (!userId || !subject || !date) {
      return jsonResponse(res, { error: 'userId, subject, and date required' }, 400);
    }
    const validStatuses = ['PRESENT', 'ABSENT', 'LATE', 'EXCUSED'];
    const finalStatus = validStatuses.includes(status) ? status : 'PRESENT';
    const id = generateId();
    db.prepare('INSERT INTO attendance_records (id, user_id, subject, date, status, slot_id) VALUES (?, ?, ?, ?, ?, ?)').run(id, userId, subject, date, finalStatus, slotId || '');
    jsonResponse(res, { success: true, id }, 201);
  } catch (e) {
    log.error({ err: e }, 'Mark attendance error');
    jsonResponse(res, { error: 'Internal server error' }, 500);
  }
});

app.get('/api/attendance/stats/:userId', (req, res) => {
  try {
    const all = db.prepare('SELECT subject, status, COUNT(*) as count FROM attendance_records WHERE user_id = ? GROUP BY subject, status').all(req.params.userId);
    const subjects = {};
    all.forEach(r => {
      if (!subjects[r.subject]) subjects[r.subject] = { subject: r.subject, total: 0, attended: 0, percentage: 0 };
      subjects[r.subject].total += r.count;
      if (r.status === 'PRESENT') subjects[r.subject].attended += r.count;
    });
    const subjectWise = Object.values(subjects).map(s => ({ ...s, percentage: s.total > 0 ? Math.round((s.attended / s.total) * 100) : 0 }));
    const totalClasses = subjectWise.reduce((a, s) => a + s.total, 0);
    const attendedClasses = subjectWise.reduce((a, s) => a + s.attended, 0);
    const overall = totalClasses > 0 ? Math.round((attendedClasses / totalClasses) * 100) : 0;
    jsonResponse(res, { overall, totalClasses, attendedClasses, subjectWise });
  } catch (e) {
    log.error({ err: e }, 'Attendance stats error');
    jsonResponse(res, { error: 'Internal server error' }, 500);
  }
});

// ── Timetable Routes ────────────────────────────────────────────────────────────
app.get('/api/timetable/:branch/:semester/:day', (req, res) => {
  try {
    const slots = db.prepare('SELECT * FROM timetable WHERE branch = ? AND semester = ? AND day = ? ORDER BY slot_index').all(req.params.branch, req.params.semester, req.params.day);
    jsonResponse(res, { slots });
  } catch (e) {
    log.error({ err: e }, 'Get timetable error');
    jsonResponse(res, { error: 'Internal server error' }, 500);
  }
});

app.post('/api/timetable', (req, res) => {
  try {
    const { branch, semester, day, slotIndex, subject, type, startTime, endTime, facultyName, batch } = req.body;
    if (!branch || !semester || !day || slotIndex === undefined || !subject || !startTime || !endTime) {
      return jsonResponse(res, { error: 'Missing required fields' }, 400);
    }
    const id = generateId();
    db.prepare('INSERT INTO timetable (id, branch, semester, day, slot_index, subject, type, start_time, end_time, faculty_name, batch) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)').run(id, branch, semester, day, slotIndex, subject, type || 'LECTURE', startTime, endTime, facultyName || '', batch || 'ALL');
    jsonResponse(res, { success: true, id }, 201);
  } catch (e) {
    log.error({ err: e }, 'Add timetable error');
    jsonResponse(res, { error: 'Internal server error' }, 500);
  }
});

// ── Tasks Routes ────────────────────────────────────────────────────────────────
app.get('/api/tasks/:userId', (req, res) => {
  try {
    const tasks = db.prepare('SELECT * FROM tasks WHERE user_id = ? ORDER BY created_at DESC').all(req.params.userId);
    jsonResponse(res, { tasks });
  } catch (e) {
    log.error({ err: e }, 'Get tasks error');
    jsonResponse(res, { error: 'Internal server error' }, 500);
  }
});

app.post('/api/tasks', (req, res) => {
  try {
    const { userId, title, description, dueDate, category } = req.body;
    if (!userId || !title) {
      return jsonResponse(res, { error: 'userId and title required' }, 400);
    }
    const id = generateId();
    db.prepare('INSERT INTO tasks (id, user_id, title, description, due_date, category) VALUES (?, ?, ?, ?, ?, ?)').run(id, userId, title, description || '', dueDate || '', category || 'GENERAL');
    jsonResponse(res, { success: true, id }, 201);
  } catch (e) {
    log.error({ err: e }, 'Add task error');
    jsonResponse(res, { error: 'Internal server error' }, 500);
  }
});

app.put('/api/tasks/:id', (req, res) => {
  try {
    const { completed } = req.body;
    db.prepare('UPDATE tasks SET completed = ? WHERE id = ?').run(completed ? 1 : 0, req.params.id);
    jsonResponse(res, { success: true });
  } catch (e) {
    log.error({ err: e }, 'Update task error');
    jsonResponse(res, { error: 'Internal server error' }, 500);
  }
});

app.delete('/api/tasks/:id', (req, res) => {
  try {
    db.prepare('DELETE FROM tasks WHERE id = ?').run(req.params.id);
    jsonResponse(res, { success: true });
  } catch (e) {
    log.error({ err: e }, 'Delete task error');
    jsonResponse(res, { error: 'Internal server error' }, 500);
  }
});

// ── Resources Routes ────────────────────────────────────────────────────────────
app.get('/api/resources', (req, res) => {
  try {
    const { branch, semester } = req.query;
    let resources;
    if (branch && semester) {
      resources = db.prepare('SELECT * FROM resources WHERE branch = ? AND semester = ? ORDER BY created_at DESC').all(branch, semester);
    } else {
      resources = db.prepare('SELECT * FROM resources ORDER BY created_at DESC').all();
    }
    jsonResponse(res, { resources });
  } catch (e) {
    log.error({ err: e }, 'Get resources error');
    jsonResponse(res, { error: 'Internal server error' }, 500);
  }
});

app.post('/api/resources', (req, res) => {
  try {
    const { title, description, url, type, branch, semester, subject, uploadedBy } = req.body;
    if (!title) {
      return jsonResponse(res, { error: 'Title required' }, 400);
    }
    const id = generateId();
    db.prepare('INSERT INTO resources (id, title, description, url, type, branch, semester, subject, uploaded_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)').run(id, title, description || '', url || '', type || 'DOCUMENT', branch || 'EC', semester || '1', subject || '', uploadedBy || '');
    jsonResponse(res, { success: true, id }, 201);
  } catch (e) {
    log.error({ err: e }, 'Add resource error');
    jsonResponse(res, { error: 'Internal server error' }, 500);
  }
});

// ── Notices Routes ──────────────────────────────────────────────────────────────
app.get('/api/notices', (req, res) => {
  try {
    const notices = db.prepare('SELECT * FROM notices ORDER BY created_at DESC').all();
    jsonResponse(res, { notices });
  } catch (e) {
    log.error({ err: e }, 'Get notices error');
    jsonResponse(res, { error: 'Internal server error' }, 500);
  }
});

app.post('/api/notices', (req, res) => {
  try {
    const { title, content, author, category, priority, branch } = req.body;
    if (!title || !content) {
      return jsonResponse(res, { error: 'Title and content required' }, 400);
    }
    const id = generateId();
    db.prepare('INSERT INTO notices (id, title, content, author, category, priority, branch) VALUES (?, ?, ?, ?, ?, ?, ?)').run(id, title, content, author || 'Administration', category || 'GENERAL', priority || 'normal', branch || 'ALL');
    auditLog('NOTICE_POSTED', '', `Notice: ${title}`, req.ip);
    jsonResponse(res, { success: true, id }, 201);
  } catch (e) {
    log.error({ err: e }, 'Add notice error');
    jsonResponse(res, { error: 'Internal server error' }, 500);
  }
});

// ── Chat Routes ─────────────────────────────────────────────────────────────────
app.get('/api/chats/:userId', (req, res) => {
  try {
    const chats = db.prepare('SELECT * FROM chats WHERE participants LIKE ? ORDER BY last_timestamp DESC').all(`%${req.params.userId}%`);
    jsonResponse(res, { chats });
  } catch (e) {
    log.error({ err: e }, 'Get chats error');
    jsonResponse(res, { error: 'Internal server error' }, 500);
  }
});

app.post('/api/chats', (req, res) => {
  try {
    const { participants, isGroup, groupName } = req.body;
    if (!participants || !Array.isArray(participants)) {
      return jsonResponse(res, { error: 'Participants array required' }, 400);
    }
    const id = generateId();
    db.prepare('INSERT INTO chats (id, participants, is_group, group_name) VALUES (?, ?, ?, ?)').run(id, JSON.stringify(participants), isGroup ? 1 : 0, groupName || '');
    jsonResponse(res, { success: true, id }, 201);
  } catch (e) {
    log.error({ err: e }, 'Create chat error');
    jsonResponse(res, { error: 'Internal server error' }, 500);
  }
});

app.get('/api/messages/:chatId', (req, res) => {
  try {
    const messages = db.prepare('SELECT * FROM messages WHERE chat_id = ? ORDER BY timestamp ASC').all(req.params.chatId);
    jsonResponse(res, { messages });
  } catch (e) {
    log.error({ err: e }, 'Get messages error');
    jsonResponse(res, { error: 'Internal server error' }, 500);
  }
});

app.post('/api/messages', (req, res) => {
  try {
    const { chatId, senderId, senderName, content, isEncrypted } = req.body;
    if (!chatId || !senderId || !senderName || !content) {
      return jsonResponse(res, { error: 'All fields required' }, 400);
    }
    if (content.length > 5000) {
      return jsonResponse(res, { error: 'Message too long (max 5000 chars)' }, 400);
    }
    const id = generateId();
    db.prepare('INSERT INTO messages (id, chat_id, sender_id, sender_name, content, is_encrypted) VALUES (?, ?, ?, ?, ?, ?)').run(id, chatId, senderId, senderName, content, isEncrypted ? 1 : 0);
    db.prepare('UPDATE chats SET last_message = ?, last_timestamp = datetime("now") WHERE id = ?').run(content.substring(0, 100), chatId);
    jsonResponse(res, { success: true, id }, 201);
  } catch (e) {
    log.error({ err: e }, 'Send message error');
    jsonResponse(res, { error: 'Internal server error' }, 500);
  }
});

app.get('/api/users/search', (req, res) => {
  try {
    const { q } = req.query;
    if (!q || q.length < 2) return jsonResponse(res, { users: [] });
    const users = db.prepare(`SELECT id, name, enrollment_number, branch, semester, section, photo_url FROM users WHERE name LIKE ? OR enrollment_number LIKE ? LIMIT 20`).all(`%${q}%`, `%${q}%`);
    jsonResponse(res, { users });
  } catch (e) {
    log.error({ err: e }, 'User search error');
    jsonResponse(res, { error: 'Internal server error' }, 500);
  }
});

// ── Exam Routes ─────────────────────────────────────────────────────────────────
app.get('/api/exams', (req, res) => {
  try {
    const { branch, semester } = req.query;
    let exams;
    if (branch && semester) {
      exams = db.prepare('SELECT id, title, branch, semester, subject, duration, total_marks, created_at FROM exams WHERE branch = ? AND semester = ? ORDER BY created_at DESC').all(branch, semester);
    } else {
      exams = db.prepare('SELECT id, title, branch, semester, subject, duration, total_marks, created_at FROM exams ORDER BY created_at DESC').all();
    }
    jsonResponse(res, { exams });
  } catch (e) {
    log.error({ err: e }, 'Get exams error');
    jsonResponse(res, { error: 'Internal server error' }, 500);
  }
});

app.post('/api/exams', (req, res) => {
  try {
    const { title, branch, semester, subject, questions, duration, totalMarks } = req.body;
    if (!title) {
      return jsonResponse(res, { error: 'Title required' }, 400);
    }
    const id = generateId();
    db.prepare('INSERT INTO exams (id, title, branch, semester, subject, questions, duration, total_marks) VALUES (?, ?, ?, ?, ?, ?, ?, ?)').run(id, title, branch || 'EC', semester || '1', subject || '', JSON.stringify(questions || []), duration || 60, totalMarks || 100);
    jsonResponse(res, { success: true, id }, 201);
  } catch (e) {
    log.error({ err: e }, 'Create exam error');
    jsonResponse(res, { error: 'Internal server error' }, 500);
  }
});

app.get('/api/exams/:id', (req, res) => {
  try {
    const exam = db.prepare('SELECT * FROM exams WHERE id = ?').get(req.params.id);
    if (!exam) return jsonResponse(res, { error: 'Exam not found' }, 404);
    exam.questions = JSON.parse(exam.questions || '[]');
    jsonResponse(res, { exam });
  } catch (e) {
    log.error({ err: e }, 'Get exam error');
    jsonResponse(res, { error: 'Internal server error' }, 500);
  }
});

app.post('/api/exams/:id/submit', (req, res) => {
  try {
    const { userId, score, total, answers } = req.body;
    if (!userId || score === undefined) {
      return jsonResponse(res, { error: 'userId and score required' }, 400);
    }
    const id = generateId();
    db.prepare('INSERT INTO exam_results (id, user_id, exam_id, score, total, answers) VALUES (?, ?, ?, ?, ?, ?)').run(id, userId, req.params.id, score, total || 100, JSON.stringify(answers || {}));
    jsonResponse(res, { success: true, resultId: id }, 201);
  } catch (e) {
    log.error({ err: e }, 'Submit exam error');
    jsonResponse(res, { error: 'Internal server error' }, 500);
  }
});

// ── Faculty Routes ──────────────────────────────────────────────────────────────
app.get('/api/faculty', (req, res) => {
  try {
    const { branch } = req.query;
    let faculty;
    if (branch) {
      faculty = db.prepare('SELECT * FROM faculty WHERE branch = ? ORDER BY name').all(branch);
    } else {
      faculty = db.prepare('SELECT * FROM faculty ORDER BY name').all();
    }
    jsonResponse(res, { faculty });
  } catch (e) {
    log.error({ err: e }, 'Get faculty error');
    jsonResponse(res, { error: 'Internal server error' }, 500);
  }
});

app.post('/api/faculty', (req, res) => {
  try {
    const { name, designation, department, email, phone, branch } = req.body;
    if (!name) {
      return jsonResponse(res, { error: 'Name required' }, 400);
    }
    const id = generateId();
    db.prepare('INSERT INTO faculty (id, name, designation, department, email, phone, branch) VALUES (?, ?, ?, ?, ?, ?, ?)').run(id, name, designation || '', department || '', email || '', phone || '', branch || 'EC');
    jsonResponse(res, { success: true, id }, 201);
  } catch (e) {
    log.error({ err: e }, 'Add faculty error');
    jsonResponse(res, { error: 'Internal server error' }, 500);
  }
});

// ── File Upload ─────────────────────────────────────────────────────────────────
app.post('/api/upload', upload.single('file'), (req, res) => {
  try {
    if (!req.file) return jsonResponse(res, { error: 'No file uploaded' }, 400);
    const url = `/uploads/${req.file.filename}`;
    auditLog('FILE_UPLOAD', '', `File: ${req.file.filename}`, req.ip);
    jsonResponse(res, { success: true, url, filename: req.file.filename }, 201);
  } catch (e) {
    log.error({ err: e }, 'Upload error');
    jsonResponse(res, { error: 'Upload failed' }, 500);
  }
});

// ── Settings ────────────────────────────────────────────────────────────────────
app.get('/api/settings/:key', (req, res) => {
  try {
    const setting = db.prepare('SELECT value FROM settings WHERE key = ?').get(req.params.key);
    jsonResponse(res, { value: setting ? setting.value : null });
  } catch (e) {
    log.error({ err: e }, 'Get setting error');
    jsonResponse(res, { error: 'Internal server error' }, 500);
  }
});

app.post('/api/settings', (req, res) => {
  try {
    const { key, value } = req.body;
    if (!key) {
      return jsonResponse(res, { error: 'Key required' }, 400);
    }
    db.prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)').run(key, value || '');
    jsonResponse(res, { success: true });
  } catch (e) {
    log.error({ err: e }, 'Save setting error');
    jsonResponse(res, { error: 'Internal server error' }, 500);
  }
});

// ── Health Check ────────────────────────────────────────────────────────────────
app.get('/api/health', (req, res) => {
  jsonResponse(res, {
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: Math.floor(process.uptime()),
    version: require('./package.json').version,
  });
});

// ── Metrics Endpoint ────────────────────────────────────────────────────────────
app.get('/api/metrics', (req, res) => {
  jsonResponse(res, getMetrics());
});

// ── Alerts Endpoint ─────────────────────────────────────────────────────────────
app.get('/api/alerts', (req, res) => {
  jsonResponse(res, { alerts: checkAlerts() });
});

// ── Audit Log Endpoint ──────────────────────────────────────────────────────────
app.get('/api/audit-log', (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit) || 50, 200);
    const logs = db.prepare('SELECT * FROM audit_log ORDER BY created_at DESC LIMIT ?').all(limit);
    jsonResponse(res, { logs });
  } catch (e) {
    log.error({ err: e }, 'Audit log error');
    jsonResponse(res, { error: 'Internal server error' }, 500);
  }
});

// ── Global Error Handler ────────────────────────────────────────────────────────
app.use((err, req, res, _next) => {
  trackError();
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return jsonResponse(res, { error: 'File too large (max 10MB)' }, 413);
    }
    return jsonResponse(res, { error: 'Upload error' }, 400);
  }
  log.error({ err, req }, 'Unhandled error');
  jsonResponse(res, { error: 'Internal server error' }, 500);
});

// ── Seed Data ───────────────────────────────────────────────────────────────────
function seedData() {
  const noticeCount = db.prepare('SELECT COUNT(*) as count FROM notices').get().count;
  if (noticeCount === 0) {
    const notices = [
      { title: 'Mid-Term Exam Schedule Released', content: 'Mid-term examinations for all semesters will begin from 15th August 2026. Please check the exam hub for detailed schedule.', author: 'GTU Examination Cell', priority: 'high', category: 'EXAM' },
      { title: 'Campus Placement Drive', content: 'TCS will be conducting a campus placement drive for eligible final year students on 20th August 2026. Register through the campus portal.', author: 'Training & Placement Cell', priority: 'normal', category: 'PLACEMENT' },
      { title: 'Library Extended Hours', content: 'The central library will remain open until 10 PM during the examination period starting from 10th August.', author: 'Library Administration', priority: 'normal', category: 'GENERAL' },
    ];
    notices.forEach(n => {
      db.prepare('INSERT INTO notices (id, title, content, author, priority, category, branch) VALUES (?, ?, ?, ?, ?, ?, ?)').run(generateId(), n.title, n.content, n.author, n.priority, n.category, 'ALL');
    });
  }

  const facultyCount = db.prepare('SELECT COUNT(*) as count FROM faculty').get().count;
  if (facultyCount === 0) {
    const faculties = [
      { name: 'Dr. Priya Sharma', designation: 'HOD', department: 'Electronics & Communication', email: 'priya.sharma@gtu.edu', phone: '9876543210', branch: 'EC' },
      { name: 'Prof. Rajesh Patel', designation: 'Assistant Professor', department: 'Electronics & Communication', email: 'rajesh.patel@gtu.edu', phone: '9876543211', branch: 'EC' },
      { name: 'Prof. Sneha Mehta', designation: 'Assistant Professor', department: 'Electronics & Communication', email: 'sneha.mehta@gtu.edu', phone: '9876543212', branch: 'EC' },
      { name: 'Dr. Amit Joshi', designation: 'HOD', department: 'ICT', email: 'amit.joshi@gtu.edu', phone: '9876543213', branch: 'ICT' },
      { name: 'Prof. Kavita Singh', designation: 'Assistant Professor', department: 'ICT', email: 'kavita.singh@gtu.edu', phone: '9876543214', branch: 'ICT' },
      { name: 'Prof. Deepak Kumar', designation: 'Assistant Professor', department: 'ICT', email: 'deepak.kumar@gtu.edu', phone: '9876543215', branch: 'ICT' },
    ];
    faculties.forEach(f => {
      db.prepare('INSERT INTO faculty (id, name, designation, department, email, phone, branch) VALUES (?, ?, ?, ?, ?, ?, ?)').run(generateId(), f.name, f.designation, f.department, f.email, f.phone, f.branch);
    });
  }

  const timetableCount = db.prepare('SELECT COUNT(*) as count FROM timetable').get().count;
  if (timetableCount === 0) {
    const days = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
    const ecSubjects = ['Mathematics-III', 'Digital Electronics', 'Analog Circuits', 'Signals & Systems', 'Programming in C', 'Communication Systems'];
    const ictSubjects = ['Data Structures', 'Web Technologies', 'Database Management', 'Computer Networks', 'Software Engineering', 'AI & ML Basics'];
    
    ['EC', 'ICT'].forEach(branch => {
      const subjects = branch === 'EC' ? ecSubjects : ictSubjects;
      for (let sem = 1; sem <= 6; sem++) {
        days.forEach((day, dayIdx) => {
          for (let slot = 0; slot < 6; slot++) {
            const subjectIdx = (dayIdx + slot) % subjects.length;
            const times = ['09:00', '10:00', '11:00', '12:00', '13:30', '14:30'];
            const endTimes = ['10:00', '11:00', '12:00', '13:00', '14:30', '15:30'];
            db.prepare('INSERT INTO timetable (id, branch, semester, day, slot_index, subject, type, start_time, end_time, faculty_name, batch) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)').run(
              generateId(), branch, String(sem), day, slot, 
              subjects[subjectIdx], slot === 4 ? 'RECESS' : 'LECTURE',
              times[slot], endTimes[slot], 
              slot === 4 ? '' : 'Faculty ' + (slot + 1), 'ALL'
            );
          }
        });
      }
    });
  }

  const examCount = db.prepare('SELECT COUNT(*) as count FROM exams').get().count;
  if (examCount === 0) {
    const quizzes = [
      { title: 'Digital Electronics - Quiz 1', branch: 'EC', semester: '3', subject: 'Digital Electronics', questions: JSON.stringify([
        { id: '1', text: 'What is a flip-flop?', options: ['A combinational circuit', 'A sequential circuit', 'A logic gate', 'None'], correctIndex: 1 },
        { id: '2', text: 'How many states does a JK flip-flop have?', options: ['1', '2', '3', '4'], correctIndex: 1 },
        { id: '3', text: 'Which gate is called universal gate?', options: ['AND', 'OR', 'NAND', 'XOR'], correctIndex: 2 },
      ]), duration: 15, totalMarks: 30 },
      { title: 'Data Structures - Quiz 1', branch: 'ICT', semester: '2', subject: 'Data Structures', questions: JSON.stringify([
        { id: '1', text: 'What is the time complexity of binary search?', options: ['O(n)', 'O(log n)', 'O(n²)', 'O(1)'], correctIndex: 1 },
        { id: '2', text: 'Which data structure uses FIFO?', options: ['Stack', 'Queue', 'Tree', 'Graph'], correctIndex: 1 },
        { id: '3', text: 'What is the height of a balanced BST with n nodes?', options: ['O(n)', 'O(log n)', 'O(n log n)', 'O(1)'], correctIndex: 1 },
      ]), duration: 15, totalMarks: 30 },
    ];
    quizzes.forEach(q => {
      db.prepare('INSERT INTO exams (id, title, branch, semester, subject, questions, duration, total_marks) VALUES (?, ?, ?, ?, ?, ?, ?, ?)').run(generateId(), q.title, q.branch, q.semester, q.subject, q.questions, q.duration, q.totalMarks);
    });
  }
}

// ── Graceful Shutdown ───────────────────────────────────────────────────────────
function gracefulShutdown(signal) {
  log.info({ signal }, 'Received shutdown signal, closing server...');
  db.close();
  process.exit(0);
}

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('uncaughtException', (err) => {
  log.fatal({ err }, 'Uncaught exception');
  trackError();
  process.exit(1);
});
process.on('unhandledRejection', (reason) => {
  log.error({ reason }, 'Unhandled rejection');
  trackError();
});

// ── Periodic Alert Check ────────────────────────────────────────────────────────
setInterval(() => {
  const alerts = checkAlerts();
  if (alerts.length > 0) {
    alerts.forEach(a => log[a.level === 'critical' ? 'fatal' : 'warn']({ alert: a }, 'System alert'));
  }
}, 60000);

// ── Start ───────────────────────────────────────────────────────────────────────
seedData();

app.listen(PORT, '0.0.0.0', () => {
  const interfaces = os.networkInterfaces();
  let localIP = 'localhost';
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name] || []) {
      if (iface.family === 'IPv4' && !iface.internal) {
        localIP = iface.address;
      }
    }
  }
  log.info(`GPA Study Hub Server started on port ${PORT}`);
  log.info(`Local:   http://localhost:${PORT}`);
  log.info(`Network: http://${localIP}:${PORT}`);
  log.info(`Health:  http://${localIP}:${PORT}/api/health`);
  log.info(`Metrics: http://${localIP}:${PORT}/api/metrics`);
  console.log(`\n  GPA Study Hub Server running!`);
  console.log(`  Local:   http://localhost:${PORT}`);
  console.log(`  Network: http://${localIP}:${PORT}`);
  console.log(`  Health:  http://${localIP}:${PORT}/api/health`);
  console.log(`  Metrics: http://${localIP}:${PORT}/api/metrics`);
  console.log(`\n  Use this IP in the app: ${localIP}\n`);
});
