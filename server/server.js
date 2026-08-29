require('dotenv').config();

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const hpp = require('hpp');
const cookieParser = require('cookie-parser');
const bcrypt = require('bcrypt');
const nodemailer = require('nodemailer');
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
const { z } = require('zod');

// ── JWT Config ──────────────────────────────────────────────────────────────────
if (!process.env.JWT_SECRET) {
  throw new Error(
    'JWT_SECRET environment variable is required. Set a strong random string (64+ chars).'
  );
}
const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES = process.env.JWT_EXPIRES || '7d';
const JWT_ISSUER = 'gpa-study-hub';

function generateToken(user) {
  return jwt.sign({ id: user.id, role: user.role, name: user.name }, JWT_SECRET, {
    expiresIn: JWT_EXPIRES,
    issuer: JWT_ISSUER,
  });
}

function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET, { issuer: JWT_ISSUER });
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
  // Verify user still exists and is active
  const user = db.prepare('SELECT id, is_active FROM users WHERE id = ?').get(decoded.id);
  if (!user || !user.is_active) {
    return jsonResponse(res, { error: 'Account inactive or not found' }, 401);
  }
  req.user = decoded;
  next();
}

function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return jsonResponse(res, { error: 'Insufficient permissions' }, 403);
    }
    next();
  };
}

function requireOwnershipOrAdmin(paramName = 'userId') {
  return (req, res, next) => {
    const resourceUserId = req.params[paramName] || req.body[paramName];
    if (
      req.user.role === 'GTU_ADMIN' ||
      req.user.role === 'FACULTY' ||
      req.user.id === resourceUserId
    ) {
      return next();
    }
    return jsonResponse(res, { error: 'Access denied' }, 403);
  };
}

// ── Validation Schemas (zod) ────────────────────────────────────────────────────
const signupSchema = z.object({
  name: z.string().trim().min(2).max(100),
  enrollmentNumber: z
    .string()
    .trim()
    .min(5)
    .max(20)
    .regex(/^[A-Za-z0-9/-]+$/),
  pin: z.string().regex(/^\d{4,8}$/, 'PIN must be 4-8 digits'),
  branch: z.enum(['EC', 'ICT']).optional().default('EC'),
  semester: z
    .string()
    .regex(/^[1-6]$/)
    .optional()
    .default('1'),
  section: z.string().max(5).optional().default('A'),
  university: z.string().max(100).optional().default(''),
});

const loginSchema = z.object({
  enrollmentNumber: z.string().trim().min(1),
  pin: z.string().regex(/^\d{4,8}$/),
});

const facultySignupSchema = z.object({
  name: z.string().trim().min(2).max(100),
  email: z.string().trim().email().max(254),
  password: z.string().min(8).max(128),
  branch: z.enum(['EC', 'ICT']).optional().default('EC'),
});

function validate(schema) {
  return (req, res, next) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      return jsonResponse(
        res,
        { error: result.error.issues[0].message, details: result.error.issues },
        400
      );
    }
    req.body = result.data;
    next();
  };
}

// ── Logger ──────────────────────────────────────────────────────────────────────
const log = pino({
  level: process.env.LOG_LEVEL || 'info',
  transport:
    process.env.NODE_ENV !== 'production'
      ? { target: 'pino-pretty', options: { colorize: true, translateTime: 'SYS:HH:MM:ss' } }
      : undefined,
  serializers: {
    req: req => ({
      method: req.method,
      url: req.url,
      ip: req.ip,
      userAgent: req.headers['user-agent'],
    }),
    res: res => ({ statusCode: res.statusCode }),
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
    metrics.lastMinuteRequests = 0;
    metrics.lastMinuteStart = now;
  }
  metrics.lastMinuteRequests++;
}

function trackError() {
  metrics.errors++;
}

function getMetrics() {
  const uptime = Math.floor((Date.now() - metrics.startTime) / 1000);
  const avgResponseTime =
    metrics.responseTimes.length > 0
      ? Math.round(metrics.responseTimes.reduce((a, b) => a + b, 0) / metrics.responseTimes.length)
      : 0;
  const sorted = [...metrics.responseTimes].sort((a, b) => a - b);
  const p95 = sorted.length > 0 ? sorted[Math.floor(sorted.length * 0.95)] : 0;
  return {
    uptime,
    totalRequests: metrics.requests,
    totalErrors: metrics.errors,
    errorRate:
      metrics.requests > 0 ? ((metrics.errors / metrics.requests) * 100).toFixed(2) + '%' : '0%',
    avgResponseTimeMs: avgResponseTime,
    p95ResponseTimeMs: p95,
    requestsLastMinute: metrics.lastMinuteRequests,
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
  } catch {
    /* ignore */
  }
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
      alerts.push({
        level: 'critical',
        message: `Error rate ${errorRate.toFixed(1)}% exceeds threshold ${ALERTS.errorRateThreshold}%`,
      });
    }
  }
  const memMB = process.memoryUsage().heapUsed / 1024 / 1024;
  if (memMB > ALERTS.memoryThresholdMB) {
    alerts.push({
      level: 'warning',
      message: `Memory usage ${memMB.toFixed(0)}MB exceeds threshold ${ALERTS.memoryThresholdMB}MB`,
    });
  }
  if (metrics.responseTimes.length > 0) {
    const avg = metrics.responseTimes.reduce((a, b) => a + b, 0) / metrics.responseTimes.length;
    if (avg > ALERTS.responseTimeThreshold) {
      alerts.push({
        level: 'warning',
        message: `Avg response time ${avg.toFixed(0)}ms exceeds threshold ${ALERTS.responseTimeThreshold}ms`,
      });
    }
  }
  return alerts;
}

// ── App Setup ───────────────────────────────────────────────────────────────────
const app = express();
const PORT = process.env.PORT || 3000;
const { requestId } = require('./src/middleware/requestId');
app.use(requestId);
const { tenantMiddleware } = require('./middleware/tenant');
// Tenant routing: Host header or x-tenant-id → req.tenantId (default tenant for single-college)
app.use((req, res, next) => {
  // Extract tenant from Host subdomain or header; fallback to default
  const host = req.headers.host || '';
  const hostTenant = host.split('.')[0].split(':')[0];
  const headerTenant = req.headers['x-tenant-id'];
  const tenantId =
    headerTenant ||
    (hostTenant && hostTenant !== 'localhost' && hostTenant !== '127' ? hostTenant : null) ||
    process.env.DEFAULT_TENANT ||
    'default';
  req.tenantId = tenantId;
  next();
});

// ── Security Middleware ─────────────────────────────────────────────────────────
app.use(
  helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false,
  })
);

app.use(hpp());

app.use(
  cors({
    origin: function (origin, callback) {
      const allowed = [
        'http://localhost:5173',
        'http://localhost:5174',
        'http://localhost:3000',
        'http://localhost:4173',
        'http://localhost:4174',
        'capacitor://localhost',
      ];
      // Allow requests with no origin (mobile apps, curl, server-to-server)
      if (!origin) return callback(null, true);
      if (allowed.indexOf(origin) !== -1) {
        return callback(null, true);
      }
      // Allow local network IPs in development
      if (process.env.NODE_ENV !== 'production') {
        const ip = origin.match(/\/\/([\d.]+):/);
        if (
          ip &&
          (/^192\.168\./.test(ip[1]) ||
            /^10\./.test(ip[1]) ||
            /^172\.(1[6-9]|2\d|3[01])\./.test(ip[1]))
        ) {
          return callback(null, true);
        }
      }
      callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
  })
);

const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 500,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again later' },
  keyGenerator: req => req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.ip,
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many login attempts, please wait 15 minutes' },
  keyGenerator: req => req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.ip,
});

const forgotPinLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many PIN reset attempts, please wait 15 minutes' },
  keyGenerator: req => req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.ip,
});

const uploadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 30,
  message: { error: 'Upload limit reached, try again later' },
});

// ─── AI Rate Limiting ────────────────────────────────────────────────────────────
const aiLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 50, // 50 requests per hour per user
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'AI rate limit exceeded. Try again later or use offline mode.',
    fallback: true,
    retryAfter: 3600,
  },
  keyGenerator: req =>
    req.user?.id || req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.ip,
});

const aiStrictLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 10, // stricter for grading (expensive)
  message: { error: 'Grading limit exceeded', fallback: true, retryAfter: 3600 },
  keyGenerator: req =>
    req.user?.id || req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.ip,
});

app.use(generalLimiter);
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/signup', authLimiter);
app.use('/api/auth/faculty-login', authLimiter);
app.use('/api/auth/faculty-signup', authLimiter);
app.use('/api/auth/admin-login', authLimiter);
app.use('/api/auth/forgot-pin', forgotPinLimiter);
app.use('/api/upload', uploadLimiter);

app.use(cookieParser());
app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ extended: false, limit: '5mb' }));

// ─── CSRF Protection (Double-Submit Cookie) ───────────────────────────────────────
function generateCsrfToken() {
  return crypto.randomBytes(32).toString('hex');
}

app.use((req, res, next) => {
  // Generate CSRF token if not present
  let csrfToken = req.cookies?.['csrf_token'];
  if (!csrfToken) {
    csrfToken = generateCsrfToken();
    res.cookie('csrf_token', csrfToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
    });
  }
  req.csrfToken = csrfToken;

  // Expose token for frontend
  res.locals.csrfToken = csrfToken;

  // Validate CSRF token on state-changing requests
  const stateChangingMethods = ['POST', 'PUT', 'PATCH', 'DELETE'];
  const isApiRoute = req.path.startsWith('/api/');
  const isExempt = [
    '/api/auth/login',
    '/api/auth/signup',
    '/api/auth/forgot-pin',
    '/api/auth/verify-reset-token',
    '/api/auth/reset-pin-with-token',
    '/api/auth/faculty-login',
    '/api/auth/faculty-signup',
    '/api/auth/admin-login',
    '/api/ai/mock',
    '/api/health',
  ].some(p => req.path.startsWith(p));

  if (isApiRoute && stateChangingMethods.includes(req.method) && !isExempt) {
    const headerToken = req.headers['x-csrf-token'] || req.body?.csrf_token;
    if (!headerToken || headerToken !== csrfToken) {
      return jsonResponse(res, { error: 'Invalid CSRF token' }, 403);
    }
  }

  next();
});

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

// ─── AI Usage Tracking Middleware ────────────────────────────────────────────────
function trackAIUsage(req, res, next) {
  if (!req.user) return next();
  const provider = req.body?.provider || 'unknown';
  const type = req.body?.type || req.path.split('/').pop() || 'chat';

  res.on('finish', () => {
    if (res.statusCode < 400) {
      try {
        db.prepare(
          `
          INSERT INTO ai_usage (id, user_id, provider, request_type, tokens_used, success)
          VALUES (?, ?, ?, ?, ?, ?)
        `
        ).run(
          generateId(),
          req.user.id,
          provider,
          type,
          req.body?.tokens || 0,
          res.statusCode < 400 ? 1 : 0
        );
      } catch (e) {
        log.error({ err: e }, 'AI usage tracking failed');
      }
    }
  });
  next();
}

app.use(trackAIUsage);

// ── Input Sanitization ─────────────────────────────────────────────────────────
function sanitize(input) {
  if (typeof input !== 'string') return input;
  // Encode HTML delimiters instead of stripping (preserves "x < y" semantics)
  return input
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/javascript:/gi, '')
    .replace(/on\w+\s*=/gi, '')
    .trim()
    .substring(0, 5000);
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
app.use('/uploads', authMiddleware, express.static(uploadsDir));

const ALLOWED_MIME = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'text/plain',
  'application/zip',
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

// ── Database (unified: SQLite default, Postgres when DATABASE_URL is set) ───────
let db;
let pgPool = null;
try {
  const { getDb } = require('./src/db');
  const instance = getDb();
  // getDb returns pg Pool when DATABASE_URL is postgres, else better-sqlite3 Database
  if (instance && typeof instance.query === 'function' && !instance.prepare) {
    pgPool = instance;
    // For now, keep SQLite as primary for college PC; pgPool is available for SaaS middleware
    const Database = require('better-sqlite3');
    db = new Database(path.join(__dirname, 'gpa_hub.db'));
    db.pragma('journal_mode = WAL');
    db.pragma('foreign_keys = ON');
    db.pragma('synchronous = NORMAL');
    db.pragma('cache_size = -64000');
    db.pragma('busy_timeout = 5000');
    log.warn(
      'DATABASE_URL is set (Postgres) but server currently runs on SQLite — unified pg adapter is scaffolded in server/src/db/index.js; set SaaS profile to use pg for all queries'
    );
  } else {
    db = instance;
  }
} catch (e) {
  const Database = require('better-sqlite3');
  db = new Database(path.join(__dirname, 'gpa_hub.db'));
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');
  db.pragma('synchronous = NORMAL');
  db.pragma('cache_size = -64000');
  db.pragma('busy_timeout = 5000');
}

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
    is_active INTEGER DEFAULT 1,
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS attendance_records (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    subject TEXT NOT NULL,
    date TEXT NOT NULL,
    status TEXT DEFAULT 'PRESENT',
    slot_id TEXT DEFAULT '',
    created_at TEXT DEFAULT (datetime('now'))
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
    created_at TEXT DEFAULT (datetime('now'))
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
    timestamp TEXT DEFAULT (datetime('now'))
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
    completed_at TEXT DEFAULT (datetime('now'))
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

  -- Core Academic Content Tables
  CREATE TABLE IF NOT EXISTS subjects (
    id TEXT PRIMARY KEY,
    code TEXT NOT NULL,
    name TEXT NOT NULL,
    branch TEXT NOT NULL CHECK (branch IN ('EC', 'ICT')),
    semester INTEGER NOT NULL CHECK (semester BETWEEN 1 AND 6),
    credits INTEGER DEFAULT 3,
    is_lab INTEGER DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now')),
    UNIQUE(code, branch, semester)
  );

  CREATE TABLE IF NOT EXISTS units (
    id TEXT PRIMARY KEY,
    subject_id TEXT NOT NULL,
    unit_number INTEGER NOT NULL,
    title TEXT NOT NULL,
    topics TEXT, -- JSON array of topic strings
    weightage INTEGER DEFAULT 0, -- exam weightage %
    created_at TEXT DEFAULT (datetime('now')),
    UNIQUE(subject_id, unit_number),
    FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS syllabus (
    id TEXT PRIMARY KEY,
    subject_id TEXT NOT NULL,
    unit_id TEXT NOT NULL,
    topic TEXT NOT NULL,
    subtopics TEXT, -- JSON array
    learning_outcomes TEXT, -- JSON array of CO codes
    bloom_level TEXT CHECK (bloom_level IN ('Remember', 'Understand', 'Apply', 'Analyze', 'Evaluate', 'Create')),
    hours_allocated INTEGER DEFAULT 1,
    created_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE CASCADE,
    FOREIGN KEY (unit_id) REFERENCES units(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS question_banks (
    id TEXT PRIMARY KEY,
    subject_id TEXT NOT NULL,
    unit_id TEXT,
    question_text TEXT NOT NULL,
    question_type TEXT NOT NULL CHECK (question_type IN ('MCQ', 'DESCRIPTIVE', 'NUMERICAL', 'TRUE_FALSE')),
    options TEXT, -- JSON array for MCQ
    correct_answer TEXT NOT NULL,
    explanation TEXT,
    marks INTEGER DEFAULT 1,
    difficulty TEXT CHECK (difficulty IN ('Easy', 'Medium', 'Hard')) DEFAULT 'Medium',
    bloom_level TEXT CHECK (bloom_level IN ('Remember', 'Understand', 'Apply', 'Analyze', 'Evaluate', 'Create')),
    co_code TEXT, -- Course Outcome code
    source TEXT DEFAULT 'manual', -- 'manual', 'pyq', 'generated'
    is_active INTEGER DEFAULT 1,
    created_by TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE CASCADE,
    FOREIGN KEY (unit_id) REFERENCES units(id) ON DELETE SET NULL,
    FOREIGN KEY (created_by) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS pyqs (
    id TEXT PRIMARY KEY,
    subject_id TEXT NOT NULL,
    year INTEGER NOT NULL,
    semester INTEGER NOT NULL,
    exam_type TEXT CHECK (exam_type IN ('WINTER', 'SUMMER', 'REMID', 'IMPROVEMENT')),
    question_number INTEGER,
    question_text TEXT NOT NULL,
    question_type TEXT NOT NULL CHECK (question_type IN ('MCQ', 'DESCRIPTIVE', 'NUMERICAL')),
    options TEXT, -- JSON array for MCQ
    correct_answer TEXT,
    solution TEXT, -- Detailed solution
    marks INTEGER DEFAULT 1,
    unit_id TEXT,
    co_code TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE CASCADE,
    FOREIGN KEY (unit_id) REFERENCES units(id) ON DELETE SET NULL
  );

  CREATE TABLE IF NOT EXISTS notes (
    id TEXT PRIMARY KEY,
    subject_id TEXT NOT NULL,
    unit_id TEXT NOT NULL,
    title TEXT NOT NULL,
    content TEXT NOT NULL, -- Markdown/HTML content
    content_type TEXT CHECK (content_type IN ('THEORY', 'FORMULA', 'DERIVATION', 'DIAGRAM', 'SUMMARY', 'MNEMONIC')) DEFAULT 'THEORY',
    file_url TEXT,
    tags TEXT, -- JSON array
    is_verified INTEGER DEFAULT 0,
    created_by TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE CASCADE,
    FOREIGN KEY (unit_id) REFERENCES units(id) ON DELETE CASCADE,
    FOREIGN KEY (created_by) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS labs (
    id TEXT PRIMARY KEY,
    subject_id TEXT NOT NULL,
    experiment_number INTEGER NOT NULL,
    title TEXT NOT NULL,
    aim TEXT NOT NULL,
    apparatus TEXT, -- JSON array
    theory TEXT,
    procedure TEXT NOT NULL, -- Step-by-step
    observations TEXT, -- Expected observations format
    calculations TEXT,
    result TEXT,
    viva_questions TEXT, -- JSON array of {question, answer}
    precautions TEXT, -- JSON array
    reference_material TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    UNIQUE(subject_id, experiment_number)
  );

  CREATE TABLE IF NOT EXISTS projects (
    id TEXT PRIMARY KEY,
    subject_id TEXT,
    branch TEXT NOT NULL CHECK (branch IN ('EC', 'ICT', 'COMMON')),
    semester INTEGER CHECK (semester BETWEEN 1 AND 6),
    title TEXT NOT NULL,
    type TEXT CHECK (type IN ('MINI', 'MAJOR', 'RESEARCH', 'INDUSTRY')) DEFAULT 'MINI',
    description TEXT,
    objectives TEXT, -- JSON array
    technologies TEXT, -- JSON array
    prerequisites TEXT,
    timeline_weeks INTEGER,
    deliverables TEXT, -- JSON array
    difficulty TEXT CHECK (difficulty IN ('Beginner', 'Intermediate', 'Advanced')),
    github_url TEXT,
    report_url TEXT,
    created_by TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE SET NULL,
    FOREIGN KEY (created_by) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS student_progress (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    subject_id TEXT NOT NULL,
    unit_id TEXT,
    questions_attempted INTEGER DEFAULT 0,
    questions_correct INTEGER DEFAULT 0,
    pyqs_attempted INTEGER DEFAULT 0,
    pyqs_correct INTEGER DEFAULT 0,
    notes_read INTEGER DEFAULT 0,
    labs_completed INTEGER DEFAULT 0,
    last_activity TEXT DEFAULT (datetime('now')),
    mastery_level TEXT CHECK (mastery_level IN ('Novice', 'Beginner', 'Intermediate', 'Advanced', 'Expert')) DEFAULT 'Novice',
    UNIQUE(user_id, subject_id, unit_id),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE CASCADE,
    FOREIGN KEY (unit_id) REFERENCES units(id) ON DELETE SET NULL
  );

  CREATE INDEX IF NOT EXISTS idx_attendance_user ON attendance_records(user_id);
  CREATE INDEX IF NOT EXISTS idx_tasks_user ON tasks(user_id);
  CREATE INDEX IF NOT EXISTS idx_messages_chat ON messages(chat_id);
  CREATE INDEX IF NOT EXISTS idx_chats_participants ON chats(participants);
  CREATE INDEX IF NOT EXISTS idx_users_enrollment ON users(enrollment_number);
  CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
`);

// Migrations: ensure evolved columns exist
(() => {
  const cols = new Set(
    db
      .prepare('PRAGMA table_info(users)')
      .all()
      .map(c => c.name)
  );
  if (!cols.has('is_active')) db.exec('ALTER TABLE users ADD COLUMN is_active INTEGER DEFAULT 1');
  if (!cols.has('last_login_at')) db.exec('ALTER TABLE users ADD COLUMN last_login_at TEXT');
  if (!cols.has('password_hash') && cols.has('pin_hash')) {
    // legacy check - no action, both coexist for role separation
  }
})();

// ── Academic Indexes (tables are created in main schema above) ────────────────────
function initAcademicIndexes() {
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_subjects_branch_sem ON subjects(branch, semester);
    CREATE INDEX IF NOT EXISTS idx_units_subject ON units(subject_id);
    CREATE INDEX IF NOT EXISTS idx_syllabus_subject_unit ON syllabus(subject_id, unit_id);
    CREATE INDEX IF NOT EXISTS idx_question_banks_subject_unit ON question_banks(subject_id, unit_id);
    CREATE INDEX IF NOT EXISTS idx_question_banks_type ON question_banks(question_type);
    CREATE INDEX IF NOT EXISTS idx_pyqs_subject_year ON pyqs(subject_id, year);
    CREATE INDEX IF NOT EXISTS idx_notes_subject_unit ON notes(subject_id, unit_id);
    CREATE INDEX IF NOT EXISTS idx_labs_subject ON labs(subject_id);
    CREATE INDEX IF NOT EXISTS idx_projects_branch_sem ON projects(branch, semester);
    CREATE INDEX IF NOT EXISTS idx_student_progress_user_subject ON student_progress(user_id, subject_id);
  `);
}

// Initialize academic indexes after main schema
initAcademicIndexes();

// ─── AI Rate Limiting Table ──────────────────────────────────────────────────────
function initAIRateLimitTable() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS ai_usage (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      provider TEXT NOT NULL,
      request_type TEXT NOT NULL, -- 'chat', 'grading', 'tutoring', 'explanation'
      tokens_used INTEGER DEFAULT 0,
      success INTEGER DEFAULT 1,
      created_at TEXT DEFAULT (datetime('now'))
    );
    CREATE INDEX IF NOT EXISTS idx_ai_usage_user_date ON ai_usage(user_id, created_at);
  `);
}
initAIRateLimitTable();

// ─── PIN Reset Tokens Table ───────────────────────────────────────────────────────
function initPinResetTable() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS pin_reset_tokens (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      token TEXT NOT NULL UNIQUE,
      email TEXT NOT NULL,
      used INTEGER DEFAULT 0,
      expires_at TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );
    CREATE INDEX IF NOT EXISTS idx_pin_reset_token ON pin_reset_tokens(token);
    CREATE INDEX IF NOT EXISTS idx_pin_reset_user ON pin_reset_tokens(user_id);
  `);
}
initPinResetTable();

// ─── Email Transporter ─────────────────────────────────────────────────────────────
const emailTransporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT) || 587,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

async function sendResetEmail(email, token, name) {
  const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/reset-pin?token=${token}`;

  const mailOptions = {
    from: `"GPA Study Hub" <${process.env.SMTP_USER}>`,
    to: email,
    subject: 'Reset Your PIN - GPA Study Hub',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
          <h1 style="color: white; margin: 0;">GPA Study Hub</h1>
        </div>
        <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
          <h2 style="color: #333;">Hi ${name},</h2>
          <p style="color: #666; line-height: 1.6;">You requested to reset your PIN. Click the button below to set a new PIN:</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetUrl}" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">Reset My PIN</a>
          </div>
          <p style="color: #666; font-size: 14px;">Or copy this link: <a href="${resetUrl}">${resetUrl}</a></p>
          <p style="color: #999; font-size: 12px;">This link expires in 1 hour. If you didn't request this, please ignore this email.</p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
          <p style="color: #999; font-size: 12px;">GPA Study Hub - Your GTU Study Companion</p>
        </div>
      </div>
    `,
  };

  try {
    await emailTransporter.sendMail(mailOptions);
    return { success: true };
  } catch (error) {
    log.error({ err: error }, 'Failed to send reset email');
    return { success: false, error: error.message };
  }
}

function hashPin(pin) {
  return bcrypt.hashSync(pin, 12);
}

function verifyPin(pin, hash) {
  if (!hash) return false;
  if (hash.startsWith('$2b$') || hash.startsWith('$2a$')) {
    return bcrypt.compareSync(pin, hash);
  }
  // Legacy SHA256 migration path
  const legacy = crypto
    .createHash('sha256')
    .update(pin + 'gpa_hub_salt_v2')
    .digest('hex');
  return legacy === hash;
}

function needsRehash(hash) {
  return !(hash && (hash.startsWith('$2b$') || hash.startsWith('$2a$')));
}

// Bcrypt for faculty passwords
function hashPassword(password) {
  return bcrypt.hashSync(password, 12);
}

function verifyPassword(password, hash) {
  return bcrypt.compareSync(password, hash);
}

function generateId() {
  return uuidv4();
}

function jsonResponse(res, data, status = 200) {
  res.status(status).json(data);
}

function auditLog(action, userId, details, ip) {
  try {
    db.prepare(
      'INSERT INTO audit_log (id, action, user_id, details, ip) VALUES (?, ?, ?, ?, ?)'
    ).run(generateId(), action, userId || '', details || '', ip || '');
  } catch (e) {
    log.error({ err: e }, 'Failed to write audit log');
  }
}

// ── Auth Routes ─────────────────────────────────────────────────────────────────
app.post('/api/auth/signup', validate(signupSchema), (req, res) => {
  try {
    const { name, enrollmentNumber, pin, branch, semester, section, university } = req.body;

    const existing = db
      .prepare('SELECT id FROM users WHERE enrollment_number = ?')
      .get(enrollmentNumber);
    if (existing) {
      return jsonResponse(res, { error: 'Enrollment number already registered' }, 409);
    }

    const id = generateId();
    const pinHash = hashPin(pin);

    db.prepare(
      `
      INSERT INTO users (id, name, enrollment_number, pin_hash, branch, semester, section, university, role)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'STUDENT')
    `
    ).run(
      id,
      name,
      enrollmentNumber,
      pinHash,
      branch || 'EC',
      semester || '1',
      section || 'A',
      university || ''
    );

    auditLog('USER_SIGNUP', id, `New student: ${name} (${enrollmentNumber})`, req.ip);

    const user = db
      .prepare(
        'SELECT id, name, enrollment_number, role, branch, semester, section, university, photo_url FROM users WHERE id = ?'
      )
      .get(id);
    jsonResponse(res, { success: true, user, token: generateToken(user) }, 201);
  } catch (e) {
    log.error({ err: e }, 'Signup error');
    jsonResponse(res, { error: 'Internal server error' }, 500);
  }
});

app.post('/api/auth/login', validate(loginSchema), (req, res) => {
  try {
    const { enrollmentNumber, pin } = req.body;

    const user = db
      .prepare(
        `
      SELECT id, name, enrollment_number, pin_hash, role, branch, semester, section, university, photo_url, email
      FROM users WHERE enrollment_number = ?
    `
      )
      .get(enrollmentNumber);

    if (!user || !verifyPin(pin, user.pin_hash)) {
      auditLog('LOGIN_FAILED', '', `Failed login: ${enrollmentNumber}`, req.ip);
      return jsonResponse(res, { error: 'Invalid enrollment number or PIN' }, 401);
    }

    // Transparent migration: re-hash legacy SHA256 to bcrypt
    if (needsRehash(user.pin_hash)) {
      try {
        db.prepare('UPDATE users SET pin_hash = ? WHERE id = ?').run(hashPin(pin), user.id);
      } catch {}
    }
    try {
      db.prepare("UPDATE users SET last_login_at = datetime('now') WHERE id = ?").run(user.id);
    } catch {}

    const { pin_hash, ...safeUser } = user;
    auditLog('LOGIN_SUCCESS', user.id, '', req.ip);
    jsonResponse(res, { success: true, user: safeUser, token: generateToken(safeUser) });
  } catch (e) {
    log.error({ err: e }, 'Login error');
    jsonResponse(res, { error: 'Internal server error' }, 500);
  }
});

app.post('/api/auth/forgot-pin', forgotPinLimiter, async (req, res) => {
  try {
    const { enrollmentNumber, email } = req.body;
    if (!enrollmentNumber || !email) {
      return jsonResponse(res, { error: 'Enrollment number and email required' }, 400);
    }

    const user = db
      .prepare('SELECT id, name, email FROM users WHERE enrollment_number = ?')
      .get(enrollmentNumber);
    if (!user) {
      // Don't reveal if enrollment exists
      return jsonResponse(res, {
        success: true,
        message: 'If the enrollment exists, a reset link has been sent',
      });
    }

    if (!user.email || user.email.toLowerCase() !== email.toLowerCase()) {
      return jsonResponse(res, {
        success: true,
        message: 'If the enrollment exists, a reset link has been sent',
      });
    }

    // Generate reset token
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString(); // 1 hour

    db.prepare(
      `
      INSERT INTO pin_reset_tokens (id, user_id, token, email, expires_at)
      VALUES (?, ?, ?, ?, ?)
    `
    ).run(generateId(), user.id, token, email, expiresAt);

    // Send reset email
    await sendResetEmail(email, token, user.name);

    auditLog('PIN_RESET_REQUESTED', user.id, `Reset requested for ${email}`, req.ip);
    jsonResponse(res, {
      success: true,
      message: 'If the enrollment exists, a reset link has been sent',
    });
  } catch (e) {
    log.error({ err: e }, 'Forgot PIN error');
    jsonResponse(res, { error: 'Internal server error' }, 500);
  }
});

// Verify reset token
app.post('/api/auth/verify-reset-token', (req, res) => {
  try {
    const { token } = req.body;
    if (!token) {
      return jsonResponse(res, { error: 'Token required' }, 400);
    }

    const resetToken = db
      .prepare(
        `
      SELECT id, user_id, email, expires_at, used
      FROM pin_reset_tokens WHERE token = ?
    `
      )
      .get(token);

    if (!resetToken) {
      return jsonResponse(res, { error: 'Invalid token' }, 400);
    }

    if (resetToken.used) {
      return jsonResponse(res, { error: 'Token already used' }, 400);
    }

    if (new Date(resetToken.expires_at) < new Date()) {
      return jsonResponse(res, { error: 'Token expired' }, 400);
    }

    jsonResponse(res, { success: true, valid: true });
  } catch (e) {
    log.error({ err: e }, 'Verify reset token error');
    jsonResponse(res, { error: 'Internal server error' }, 500);
  }
});

// Reset PIN with token
app.post('/api/auth/reset-pin-with-token', (req, res) => {
  try {
    const { token, newPin } = req.body;
    if (!token || !newPin) {
      return jsonResponse(res, { error: 'Token and new PIN required' }, 400);
    }
    if (!/^\d{4,8}$/.test(newPin)) {
      return jsonResponse(res, { error: 'PIN must be 4-8 digits' }, 400);
    }

    const resetToken = db
      .prepare(
        `
      SELECT id, user_id, email, expires_at, used
      FROM pin_reset_tokens WHERE token = ?
    `
      )
      .get(token);

    if (!resetToken) {
      return jsonResponse(res, { error: 'Invalid token' }, 400);
    }

    if (resetToken.used) {
      return jsonResponse(res, { error: 'Token already used' }, 400);
    }

    if (new Date(resetToken.expires_at) < new Date()) {
      return jsonResponse(res, { error: 'Token expired' }, 400);
    }

    // Update PIN
    const pinHash = hashPin(newPin);
    db.prepare('UPDATE users SET pin_hash = ? WHERE id = ?').run(pinHash, resetToken.user_id);

    // Mark token as used
    db.prepare('UPDATE pin_reset_tokens SET used = 1 WHERE id = ?').run(resetToken.id);

    auditLog('PIN_RESET', resetToken.user_id, 'PIN reset via email token', '');
    jsonResponse(res, { success: true, message: 'PIN updated successfully' });
  } catch (e) {
    log.error({ err: e }, 'Reset PIN with token error');
    jsonResponse(res, { error: 'Internal server error' }, 500);
  }
});

app.post('/api/auth/change-pin', authMiddleware, (req, res) => {
  try {
    const { oldPin, newPin } = req.body;
    if (!oldPin || !newPin) {
      return jsonResponse(res, { error: 'All fields required' }, 400);
    }
    if (newPin.length < 4 || newPin.length > 8 || !/^\d+$/.test(newPin)) {
      return jsonResponse(res, { error: 'New PIN must be 4-8 digits' }, 400);
    }

    const userId = req.user.id;
    const user = db.prepare('SELECT pin_hash FROM users WHERE id = ?').get(userId);
    if (!user || !verifyPin(oldPin, user.pin_hash)) {
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

    const user = db
      .prepare(
        `
      SELECT id, name, email, role, branch, photo_url, pin_hash
      FROM users WHERE email = ? AND role IN ('FACULTY', 'GTU_ADMIN')
    `
      )
      .get(email);

    if (!user || !verifyPassword(password, user.pin_hash)) {
      auditLog('FACULTY_LOGIN_FAILED', '', `Failed faculty login: ${email}`, req.ip);
      return jsonResponse(res, { error: 'Invalid credentials' }, 401);
    }

    auditLog('FACULTY_LOGIN', user.id, '', req.ip);
    const { pin_hash, ...userWithoutHash } = user;
    jsonResponse(res, {
      success: true,
      user: userWithoutHash,
      token: generateToken(userWithoutHash),
    });
  } catch (e) {
    log.error({ err: e }, 'Faculty login error');
    jsonResponse(res, { error: 'Internal server error' }, 500);
  }
});

app.post(
  '/api/auth/faculty-signup',
  authMiddleware,
  requireRole('GTU_ADMIN'),
  validate(facultySignupSchema),
  (req, res) => {
    try {
      const { name, email, password, branch } = req.body;
      if (!/[A-Z]/.test(password) || !/[a-z]/.test(password) || !/[0-9]/.test(password)) {
        return jsonResponse(
          res,
          { error: 'Password must contain uppercase, lowercase, and number' },
          400
        );
      }

      const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
      if (existing) {
        return jsonResponse(res, { error: 'Email already registered' }, 409);
      }

      const id = generateId();
      const pinHash = hashPassword(password);

      db.prepare(
        `
      INSERT INTO users (id, name, email, pin_hash, role, branch)
      VALUES (?, ?, ?, ?, 'FACULTY', ?)
    `
      ).run(id, name, email, pinHash, branch || 'EC');

      auditLog('FACULTY_SIGNUP', id, `New faculty: ${name} (created by ${req.user.id})`, req.ip);

      const user = db
        .prepare('SELECT id, name, email, role, branch, photo_url FROM users WHERE id = ?')
        .get(id);
      jsonResponse(res, { success: true, user }, 201);
    } catch (e) {
      log.error({ err: e }, 'Faculty signup error');
      jsonResponse(res, { error: 'Internal server error' }, 500);
    }
  }
);

app.post('/api/auth/admin-login', (req, res) => {
  try {
    const { code } = req.body;
    if (!code) {
      return jsonResponse(res, { error: 'Admin code required' }, 400);
    }
    const ADMIN_CODE = process.env.ADMIN_CODE;
    if (!ADMIN_CODE) {
      log.error('ADMIN_CODE environment variable not set');
      return jsonResponse(res, { error: 'Admin login not configured' }, 500);
    }
    if (code !== ADMIN_CODE) {
      auditLog('ADMIN_LOGIN_FAILED', '', 'Invalid admin code', req.ip);
      return jsonResponse(res, { error: 'Invalid admin code' }, 401);
    }

    let user = db
      .prepare(`SELECT id, name, role FROM users WHERE role = 'GTU_ADMIN' LIMIT 1`)
      .get();
    if (!user) {
      const id = generateId();
      const adminPin = crypto.randomBytes(4).readUInt32BE(0).toString().substring(0, 6);
      db.prepare(
        `INSERT INTO users (id, name, email, pin_hash, role) VALUES (?, 'GTU Admin', 'admin@gtu.edu', ?, 'GTU_ADMIN')`
      ).run(id, hashPin(adminPin));
      log.info({ adminId: id }, 'Admin account created');
      user = { id, name: 'GTU Admin', role: 'GTU_ADMIN', initialPin: adminPin };
    }

    auditLog('ADMIN_LOGIN', user.id, '', req.ip);
    jsonResponse(res, { success: true, user, token: generateToken(user) });
  } catch (e) {
    log.error({ err: e }, 'Admin login error');
    jsonResponse(res, { error: 'Internal server error' }, 500);
  }
});

app.put('/api/auth/profile/:id', authMiddleware, requireOwnershipOrAdmin('id'), (req, res) => {
  try {
    const { photo_url } = req.body;
    if (photo_url && photo_url.length > 200000) {
      return jsonResponse(res, { error: 'Photo too large' }, 400);
    }
    if (photo_url) {
      db.prepare('UPDATE users SET photo_url = ? WHERE id = ?').run(photo_url, req.params.id);
    }
    const user = db
      .prepare(
        'SELECT id, name, enrollment_number, role, branch, semester, section, university, photo_url, email FROM users WHERE id = ?'
      )
      .get(req.params.id);
    jsonResponse(res, { success: true, user, token: generateToken(user) });
  } catch (e) {
    log.error({ err: e }, 'Profile update error');
    jsonResponse(res, { error: 'Internal server error' }, 500);
  }
});

// ── Attendance Routes ───────────────────────────────────────────────────────────
app.get(
  '/api/attendance/:userId',
  authMiddleware,
  requireOwnershipOrAdmin('userId'),
  (req, res) => {
    try {
      const records = db
        .prepare('SELECT * FROM attendance_records WHERE user_id = ? ORDER BY date DESC')
        .all(req.params.userId);
      jsonResponse(res, { records });
    } catch (e) {
      log.error({ err: e }, 'Get attendance error');
      jsonResponse(res, { error: 'Internal server error' }, 500);
    }
  }
);

app.post('/api/attendance', authMiddleware, requireRole('FACULTY', 'GTU_ADMIN'), (req, res) => {
  try {
    const { userId, subject, date, status, slotId } = req.body;
    if (!userId || !subject || !date) {
      return jsonResponse(res, { error: 'userId, subject, and date required' }, 400);
    }
    const validStatuses = ['PRESENT', 'ABSENT', 'LATE', 'EXCUSED'];
    const finalStatus = validStatuses.includes(status) ? status : 'PRESENT';
    const id = generateId();
    db.prepare(
      'INSERT INTO attendance_records (id, user_id, subject, date, status, slot_id) VALUES (?, ?, ?, ?, ?, ?)'
    ).run(id, userId, subject, date, finalStatus, slotId || '');
    jsonResponse(res, { success: true, id }, 201);
  } catch (e) {
    log.error({ err: e }, 'Mark attendance error');
    jsonResponse(res, { error: 'Internal server error' }, 500);
  }
});

app.get(
  '/api/attendance/stats/:userId',
  authMiddleware,
  requireOwnershipOrAdmin('userId'),
  (req, res) => {
    try {
      const all = db
        .prepare(
          'SELECT subject, status, COUNT(*) as count FROM attendance_records WHERE user_id = ? GROUP BY subject, status'
        )
        .all(req.params.userId);
      const subjects = {};
      all.forEach(r => {
        if (!subjects[r.subject])
          subjects[r.subject] = { subject: r.subject, total: 0, attended: 0, percentage: 0 };
        subjects[r.subject].total += r.count;
        if (r.status === 'PRESENT') subjects[r.subject].attended += r.count;
      });
      const subjectWise = Object.values(subjects).map(s => ({
        ...s,
        percentage: s.total > 0 ? Math.round((s.attended / s.total) * 100) : 0,
      }));
      const totalClasses = subjectWise.reduce((a, s) => a + s.total, 0);
      const attendedClasses = subjectWise.reduce((a, s) => a + s.attended, 0);
      const overall = totalClasses > 0 ? Math.round((attendedClasses / totalClasses) * 100) : 0;
      jsonResponse(res, { overall, totalClasses, attendedClasses, subjectWise });
    } catch (e) {
      log.error({ err: e }, 'Attendance stats error');
      jsonResponse(res, { error: 'Internal server error' }, 500);
    }
  }
);

// ── Timetable Routes ────────────────────────────────────────────────────────────
app.get('/api/timetable/:branch/:semester/:day', (req, res) => {
  try {
    const slots = db
      .prepare(
        'SELECT * FROM timetable WHERE branch = ? AND semester = ? AND day = ? ORDER BY slot_index'
      )
      .all(req.params.branch, req.params.semester, req.params.day);
    jsonResponse(res, { slots });
  } catch (e) {
    log.error({ err: e }, 'Get timetable error');
    jsonResponse(res, { error: 'Internal server error' }, 500);
  }
});

app.post('/api/timetable', authMiddleware, requireRole('FACULTY', 'GTU_ADMIN'), (req, res) => {
  try {
    const {
      branch,
      semester,
      day,
      slotIndex,
      subject,
      type,
      startTime,
      endTime,
      facultyName,
      batch,
    } = req.body;
    if (
      !branch ||
      !semester ||
      !day ||
      slotIndex === undefined ||
      !subject ||
      !startTime ||
      !endTime
    ) {
      return jsonResponse(res, { error: 'Missing required fields' }, 400);
    }
    const id = generateId();
    db.prepare(
      'INSERT INTO timetable (id, branch, semester, day, slot_index, subject, type, start_time, end_time, faculty_name, batch) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
    ).run(
      id,
      branch,
      semester,
      day,
      slotIndex,
      subject,
      type || 'LECTURE',
      startTime,
      endTime,
      facultyName || '',
      batch || 'ALL'
    );
    jsonResponse(res, { success: true, id }, 201);
  } catch (e) {
    log.error({ err: e }, 'Add timetable error');
    jsonResponse(res, { error: 'Internal server error' }, 500);
  }
});

// ── Tasks Routes ────────────────────────────────────────────────────────────────
app.get('/api/tasks/:userId', authMiddleware, requireOwnershipOrAdmin('userId'), (req, res) => {
  try {
    const tasks = db
      .prepare('SELECT * FROM tasks WHERE user_id = ? ORDER BY created_at DESC')
      .all(req.params.userId);
    jsonResponse(res, { tasks });
  } catch (e) {
    log.error({ err: e }, 'Get tasks error');
    jsonResponse(res, { error: 'Internal server error' }, 500);
  }
});

app.post('/api/tasks', authMiddleware, (req, res) => {
  try {
    const { title, description, dueDate, category } = req.body;
    if (!title) {
      return jsonResponse(res, { error: 'title required' }, 400);
    }
    const id = generateId();
    db.prepare(
      'INSERT INTO tasks (id, user_id, title, description, due_date, category) VALUES (?, ?, ?, ?, ?, ?)'
    ).run(id, req.user.id, title, description || '', dueDate || '', category || 'GENERAL');
    jsonResponse(res, { success: true, id }, 201);
  } catch (e) {
    log.error({ err: e }, 'Add task error');
    jsonResponse(res, { error: 'Internal server error' }, 500);
  }
});

app.put('/api/tasks/:id', authMiddleware, (req, res) => {
  try {
    const { completed } = req.body;
    const task = db.prepare('SELECT user_id FROM tasks WHERE id = ?').get(req.params.id);
    if (!task) return jsonResponse(res, { error: 'Task not found' }, 404);
    if (task.user_id !== req.user.id && req.user.role !== 'GTU_ADMIN') {
      return jsonResponse(res, { error: 'Access denied' }, 403);
    }
    db.prepare('UPDATE tasks SET completed = ? WHERE id = ?').run(completed ? 1 : 0, req.params.id);
    jsonResponse(res, { success: true });
  } catch (e) {
    log.error({ err: e }, 'Update task error');
    jsonResponse(res, { error: 'Internal server error' }, 500);
  }
});

app.delete('/api/tasks/:id', authMiddleware, (req, res) => {
  try {
    const task = db.prepare('SELECT user_id FROM tasks WHERE id = ?').get(req.params.id);
    if (!task) return jsonResponse(res, { error: 'Task not found' }, 404);
    if (task.user_id !== req.user.id && req.user.role !== 'GTU_ADMIN') {
      return jsonResponse(res, { error: 'Access denied' }, 403);
    }
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
      resources = db
        .prepare(
          'SELECT * FROM resources WHERE branch = ? AND semester = ? ORDER BY created_at DESC'
        )
        .all(branch, semester);
    } else {
      resources = db.prepare('SELECT * FROM resources ORDER BY created_at DESC').all();
    }
    jsonResponse(res, { resources });
  } catch (e) {
    log.error({ err: e }, 'Get resources error');
    jsonResponse(res, { error: 'Internal server error' }, 500);
  }
});

app.post('/api/resources', authMiddleware, requireRole('FACULTY', 'GTU_ADMIN'), (req, res) => {
  try {
    const { title, description, url, type, branch, semester, subject, uploadedBy } = req.body;
    if (!title) {
      return jsonResponse(res, { error: 'Title required' }, 400);
    }
    const id = generateId();
    db.prepare(
      'INSERT INTO resources (id, title, description, url, type, branch, semester, subject, uploaded_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)'
    ).run(
      id,
      title,
      description || '',
      url || '',
      type || 'DOCUMENT',
      branch || 'EC',
      semester || '1',
      subject || '',
      uploadedBy || ''
    );
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

app.post('/api/notices', authMiddleware, requireRole('FACULTY', 'GTU_ADMIN'), (req, res) => {
  try {
    const { title, content, author, category, priority, branch } = req.body;
    if (!title || !content) {
      return jsonResponse(res, { error: 'Title and content required' }, 400);
    }
    const id = generateId();
    db.prepare(
      'INSERT INTO notices (id, title, content, author, category, priority, branch) VALUES (?, ?, ?, ?, ?, ?, ?)'
    ).run(
      id,
      title,
      content,
      author || 'Administration',
      category || 'GENERAL',
      priority || 'normal',
      branch || 'ALL'
    );
    auditLog('NOTICE_POSTED', '', `Notice: ${title}`, req.ip);
    jsonResponse(res, { success: true, id }, 201);
  } catch (e) {
    log.error({ err: e }, 'Add notice error');
    jsonResponse(res, { error: 'Internal server error' }, 500);
  }
});

// ── Chat Routes ─────────────────────────────────────────────────────────────────
app.get('/api/chats/:userId', authMiddleware, requireOwnershipOrAdmin('userId'), (req, res) => {
  try {
    const chats = db
      .prepare('SELECT * FROM chats WHERE participants LIKE ? ORDER BY last_timestamp DESC')
      .all(`%${req.params.userId}%`);
    jsonResponse(res, { chats });
  } catch (e) {
    log.error({ err: e }, 'Get chats error');
    jsonResponse(res, { error: 'Internal server error' }, 500);
  }
});

app.post('/api/chats', authMiddleware, (req, res) => {
  try {
    const { participants, isGroup, groupName } = req.body;
    if (!participants || !Array.isArray(participants)) {
      return jsonResponse(res, { error: 'Participants array required' }, 400);
    }
    const id = generateId();
    db.prepare(
      'INSERT INTO chats (id, participants, is_group, group_name) VALUES (?, ?, ?, ?)'
    ).run(id, JSON.stringify(participants), isGroup ? 1 : 0, groupName || '');
    jsonResponse(res, { success: true, id }, 201);
  } catch (e) {
    log.error({ err: e }, 'Create chat error');
    jsonResponse(res, { error: 'Internal server error' }, 500);
  }
});

app.get('/api/messages/:chatId', authMiddleware, (req, res) => {
  try {
    const chat = db.prepare('SELECT participants FROM chats WHERE id = ?').get(req.params.chatId);
    if (!chat) return jsonResponse(res, { error: 'Chat not found' }, 404);
    const participants = JSON.parse(chat.participants || '[]');
    if (!participants.includes(req.user.id) && req.user.role !== 'GTU_ADMIN') {
      return jsonResponse(res, { error: 'Access denied' }, 403);
    }
    const messages = db
      .prepare('SELECT * FROM messages WHERE chat_id = ? ORDER BY timestamp ASC')
      .all(req.params.chatId);
    jsonResponse(res, { messages });
  } catch (e) {
    log.error({ err: e }, 'Get messages error');
    jsonResponse(res, { error: 'Internal server error' }, 500);
  }
});

app.post('/api/messages', authMiddleware, (req, res) => {
  try {
    const { chatId, content, isEncrypted } = req.body;
    if (!chatId || !content) {
      return jsonResponse(res, { error: 'chatId and content required' }, 400);
    }
    if (content.length > 5000) {
      return jsonResponse(res, { error: 'Message too long (max 5000 chars)' }, 400);
    }
    const chat = db.prepare('SELECT participants FROM chats WHERE id = ?').get(chatId);
    if (!chat) return jsonResponse(res, { error: 'Chat not found' }, 404);
    const participants = JSON.parse(chat.participants || '[]');
    if (!participants.includes(req.user.id)) {
      return jsonResponse(res, { error: 'Access denied' }, 403);
    }
    const id = generateId();
    db.prepare(
      'INSERT INTO messages (id, chat_id, sender_id, sender_name, content, is_encrypted) VALUES (?, ?, ?, ?, ?, ?)'
    ).run(id, chatId, req.user.id, req.user.name, sanitizeInput(content), isEncrypted ? 1 : 0);
    db.prepare(
      'UPDATE chats SET last_message = ?, last_timestamp = datetime("now") WHERE id = ?'
    ).run(content.substring(0, 100), chatId);
    jsonResponse(res, { success: true, id }, 201);
  } catch (e) {
    log.error({ err: e }, 'Send message error');
    jsonResponse(res, { error: 'Internal server error' }, 500);
  }
});

app.get('/api/users/search', authMiddleware, (req, res) => {
  try {
    const { q } = req.query;
    if (!q || q.length < 2) return jsonResponse(res, { users: [] });
    const users = db
      .prepare(
        `SELECT id, name, enrollment_number, branch, semester, section, photo_url FROM users WHERE name LIKE ? OR enrollment_number LIKE ? LIMIT 20`
      )
      .all(`%${q}%`, `%${q}%`);
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
      exams = db
        .prepare(
          'SELECT id, title, branch, semester, subject, duration, total_marks, created_at FROM exams WHERE branch = ? AND semester = ? ORDER BY created_at DESC'
        )
        .all(branch, semester);
    } else {
      exams = db
        .prepare(
          'SELECT id, title, branch, semester, subject, duration, total_marks, created_at FROM exams ORDER BY created_at DESC'
        )
        .all();
    }
    jsonResponse(res, { exams });
  } catch (e) {
    log.error({ err: e }, 'Get exams error');
    jsonResponse(res, { error: 'Internal server error' }, 500);
  }
});

app.post('/api/exams', authMiddleware, requireRole('FACULTY', 'GTU_ADMIN'), (req, res) => {
  try {
    const { title, branch, semester, subject, questions, duration, totalMarks } = req.body;
    if (!title) {
      return jsonResponse(res, { error: 'Title required' }, 400);
    }
    const id = generateId();
    db.prepare(
      'INSERT INTO exams (id, title, branch, semester, subject, questions, duration, total_marks) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
    ).run(
      id,
      title,
      branch || 'EC',
      semester || '1',
      subject || '',
      JSON.stringify(questions || []),
      duration || 60,
      totalMarks || 100
    );
    jsonResponse(res, { success: true, id }, 201);
  } catch (e) {
    log.error({ err: e }, 'Create exam error');
    jsonResponse(res, { error: 'Internal server error' }, 500);
  }
});

app.get('/api/exams/:id', (req, res) => {
  try {
    const exam = db
      .prepare(
        'SELECT id, title, branch, semester, subject, duration, total_marks, created_at FROM exams WHERE id = ?'
      )
      .get(req.params.id);
    if (!exam) return jsonResponse(res, { error: 'Exam not found' }, 404);
    jsonResponse(res, { exam });
  } catch (e) {
    log.error({ err: e }, 'Get exam error');
    jsonResponse(res, { error: 'Internal server error' }, 500);
  }
});

app.get('/api/exams/:id/questions', authMiddleware, (req, res) => {
  try {
    const exam = db.prepare('SELECT * FROM exams WHERE id = ?').get(req.params.id);
    if (!exam) return jsonResponse(res, { error: 'Exam not found' }, 404);
    exam.questions = JSON.parse(exam.questions || '[]');
    jsonResponse(res, { exam });
  } catch (e) {
    log.error({ err: e }, 'Get exam questions error');
    jsonResponse(res, { error: 'Internal server error' }, 500);
  }
});

app.post('/api/exams/:id/submit', authMiddleware, (req, res) => {
  try {
    const { answers } = req.body;
    if (!answers || typeof answers !== 'object') {
      return jsonResponse(res, { error: 'Answers required' }, 400);
    }

    const userId = req.user.id;
    const exam = db
      .prepare('SELECT id, total_marks, questions FROM exams WHERE id = ?')
      .get(req.params.id);
    if (!exam) {
      return jsonResponse(res, { error: 'Exam not found' }, 404);
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
      /* default to 0 if questions parsing fails */
    }

    const id = generateId();
    db.prepare(
      'INSERT INTO exam_results (id, user_id, exam_id, score, total, answers) VALUES (?, ?, ?, ?, ?, ?)'
    ).run(id, userId, req.params.id, score, total, JSON.stringify(answers));
    jsonResponse(res, { success: true, resultId: id, score, total }, 201);
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

app.post('/api/faculty', authMiddleware, requireRole('GTU_ADMIN'), (req, res) => {
  try {
    const { name, designation, department, email, phone, branch } = req.body;
    if (!name) {
      return jsonResponse(res, { error: 'Name required' }, 400);
    }
    const id = generateId();
    db.prepare(
      'INSERT INTO faculty (id, name, designation, department, email, phone, branch) VALUES (?, ?, ?, ?, ?, ?, ?)'
    ).run(id, name, designation || '', department || '', email || '', phone || '', branch || 'EC');
    jsonResponse(res, { success: true, id }, 201);
  } catch (e) {
    log.error({ err: e }, 'Add faculty error');
    jsonResponse(res, { error: 'Internal server error' }, 500);
  }
});

// ── File Upload ─────────────────────────────────────────────────────────────────
app.post('/api/upload', authMiddleware, upload.single('file'), (req, res) => {
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
app.get('/api/settings/:key', authMiddleware, (req, res) => {
  try {
    const setting = db.prepare('SELECT value FROM settings WHERE key = ?').get(req.params.key);
    jsonResponse(res, { value: setting ? setting.value : null });
  } catch (e) {
    log.error({ err: e }, 'Get setting error');
    jsonResponse(res, { error: 'Internal server error' }, 500);
  }
});

app.post('/api/settings', authMiddleware, requireRole('GTU_ADMIN'), (req, res) => {
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

// ─── AI Endpoints (Server-Side Rate Limited + Mock Fallbacks) ────────────────────
app.post('/api/ai/chat', authMiddleware, aiLimiter, (req, res) => {
  const { message, context, provider } = req.body;
  if (!message) return jsonResponse(res, { error: 'Message required' }, 400);

  // Server-side: return mock fallback immediately (real AI is client-side)
  const mockResponse = getMockAIResponse('chat', message, context);
  jsonResponse(res, {
    response: mockResponse,
    fallback: true,
    provider: provider || 'mock',
    tokensUsed: mockResponse.length / 4,
  });
});

app.post('/api/ai/grade', authMiddleware, aiStrictLimiter, (req, res) => {
  const { answers, questions, subject } = req.body;
  if (!answers || !questions)
    return jsonResponse(res, { error: 'Answers and questions required' }, 400);

  const mockGrading = getMockGrading(answers, questions);
  jsonResponse(res, {
    score: mockGrading.score,
    total: mockGrading.total,
    feedback: mockGrading.feedback,
    fallback: true,
  });
});

app.post('/api/ai/explain', authMiddleware, aiLimiter, (req, res) => {
  const { topic, subject, level } = req.body;
  if (!topic) return jsonResponse(res, { error: 'Topic required' }, 400);

  const mockExplanation = getMockExplanation(topic, subject, level);
  jsonResponse(res, {
    explanation: mockExplanation,
    fallback: true,
    provider: 'mock',
  });
});

// RAG: retrieval-augmented ask on tenant corpus (question_banks + notes)
app.post('/api/ai/ask', authMiddleware, aiLimiter, (req, res) => {
  const { query, subjectId, limit } = req.body;
  if (!query || query.trim().length < 2)
    return jsonResponse(res, { error: 'query required (min 2 chars)' }, 400);
  try {
    const max = Math.min(parseInt(limit) || 5, 10);
    const like = `%${query.trim()}%`;
    let qSql =
      'SELECT id, question_text, explanation, subject_id FROM question_banks WHERE is_active=1 AND (question_text LIKE ? OR explanation LIKE ?)';
    const qParams = [like, like];
    if (subjectId) {
      qSql += ' AND subject_id=?';
      qParams.push(subjectId);
    }
    qSql += ' ORDER BY rowid DESC LIMIT ?';
    qParams.push(max);
    const questions = db.prepare(qSql).all(...qParams);
    let nSql =
      'SELECT id, title, content, subject_id FROM notes WHERE (title LIKE ? OR content LIKE ?)';
    const nParams = [like, like];
    if (subjectId) {
      nSql += ' AND subject_id=?';
      nParams.push(subjectId);
    }
    nSql += ' ORDER BY rowid DESC LIMIT ?';
    nParams.push(max);
    const notes = db.prepare(nSql).all(...nParams);
    // Simple tenant-aware context: filter by tenantId if academic tables had institution_id (scaffold)
    const context = [
      ...questions.map(q => `Q: ${q.question_text}\nA: ${q.explanation}`),
      ...notes.map(n => `${n.title}: ${n.content.slice(0, 400)}`),
    ]
      .slice(0, max)
      .join('\n\n---\n\n');
    const answer = context
      ? `Based on your corpus for "${query}":\n\n${context}\n\n---\n\n` +
        getMockAIResponse('chat', query, 'retrieved corpus')
      : getMockAIResponse('chat', query, 'no corpus hit');
    jsonResponse(res, {
      answer,
      context,
      questions,
      notes,
      fallback: !context,
      tenantId: req.tenantId || 'default',
    });
  } catch (e) {
    log.error({ err: e }, 'AI ask RAG error');
    jsonResponse(res, { error: 'Internal server error' }, 500);
  }
});

app.get('/api/ai/usage', authMiddleware, (req, res) => {
  try {
    const days = parseInt(req.query.days) || 30;
    const usage = db
      .prepare(
        `
      SELECT provider, request_type, COUNT(*) as count, SUM(tokens_used) as tokens
      FROM ai_usage 
      WHERE user_id = ? AND created_at >= datetime('now', ?)
      GROUP BY provider, request_type
    `
      )
      .all(req.user.id, `-${days} days`);
    jsonResponse(res, { usage });
  } catch (e) {
    log.error({ err: e }, 'AI usage error');
    jsonResponse(res, { error: 'Internal server error' }, 500);
  }
});

app.post('/api/ai/mock', (req, res) => {
  // Public mock endpoint (no auth) for offline mode
  const { type, message, topic, answers, questions } = req.body;
  try {
    console.log('AI Mock Request:', {
      type,
      hasAnswers: !!answers,
      hasQuestions: !!questions,
      questionsType: typeof questions,
      isArray: Array.isArray(questions),
    });
    let mock;
    switch (type) {
      case 'chat':
        mock = { response: getMockAIResponse('chat', message) };
        break;
      case 'grade':
        mock = getMockGrading(answers, questions);
        break;
      case 'explain':
        mock = { explanation: getMockExplanation(message) };
        break;
      default:
        mock = { response: 'Mock response available for chat, grade, explain' };
    }
    jsonResponse(res, { ...mock, fallback: true, provider: 'mock' });
  } catch (e) {
    log.error({ err: e, body: req.body }, 'AI mock error');
    jsonResponse(res, { error: 'Internal server error', detail: e.message }, 500);
  }
});

// ─── Academic Content Routes (seeded GTU 2024-25 data) ─────────────────────────
app.get('/api/academic/meta', (req, res) => {
  try {
    const branches = db
      .prepare('SELECT DISTINCT branch FROM subjects ORDER BY branch')
      .all()
      .map(r => r.branch);
    const semesters = db
      .prepare('SELECT DISTINCT semester FROM subjects ORDER BY semester')
      .all()
      .map(r => r.semester);
    jsonResponse(res, {
      branches,
      semesters,
      updated_at:
        db.prepare("SELECT value FROM settings WHERE key = 'seed_gtu_2024_25_v1'").get()?.value ||
        null,
    });
  } catch (e) {
    log.error({ err: e }, 'Academic meta error');
    jsonResponse(res, { error: 'Internal server error' }, 500);
  }
});

app.get('/api/academic/subjects', (req, res) => {
  try {
    const { branch, semester } = req.query;
    let sql = 'SELECT id, code, name, branch, semester, credits, is_lab FROM subjects WHERE 1=1';
    const params = [];
    if (branch) {
      sql += ' AND branch = ?';
      params.push(branch);
    }
    if (semester) {
      sql += ' AND semester = ?';
      params.push(parseInt(semester));
    }
    sql += ' ORDER BY semester, is_lab, code';
    jsonResponse(res, { subjects: db.prepare(sql).all(...params) });
  } catch (e) {
    log.error({ err: e }, 'Academic subjects error');
    jsonResponse(res, { error: 'Internal server error' }, 500);
  }
});

app.get('/api/academic/subjects/:id', (req, res) => {
  try {
    const subject = db.prepare('SELECT * FROM subjects WHERE id = ?').get(req.params.id);
    if (!subject) return jsonResponse(res, { error: 'Subject not found' }, 404);
    const units = db
      .prepare(
        'SELECT id, unit_number, title, topics, weightage FROM units WHERE subject_id = ? ORDER BY unit_number'
      )
      .all(subject.id);
    jsonResponse(res, { subject, units });
  } catch (e) {
    log.error({ err: e }, 'Academic subject detail error');
    jsonResponse(res, { error: 'Internal server error' }, 500);
  }
});

app.get('/api/academic/units/:id', (req, res) => {
  try {
    const unit = db.prepare('SELECT * FROM units WHERE id = ?').get(req.params.id);
    if (!unit) return jsonResponse(res, { error: 'Unit not found' }, 404);
    const topics = db
      .prepare(
        'SELECT id, topic, subtopics, learning_outcomes, bloom_level, hours_allocated FROM syllabus WHERE unit_id = ? ORDER BY rowid'
      )
      .all(unit.id);
    jsonResponse(res, { unit, topics });
  } catch (e) {
    log.error({ err: e }, 'Academic unit detail error');
    jsonResponse(res, { error: 'Internal server error' }, 500);
  }
});

app.get('/api/academic/questions', authMiddleware, (req, res) => {
  try {
    const { subjectId, unitId, type, difficulty, limit } = req.query;
    let sql =
      'SELECT id, subject_id, unit_id, question_text, question_type, options, correct_answer, explanation, marks, difficulty, bloom_level, co_code, source FROM question_banks WHERE is_active = 1';
    const params = [];
    if (subjectId) {
      sql += ' AND subject_id = ?';
      params.push(subjectId);
    }
    if (unitId) {
      sql += ' AND unit_id = ?';
      params.push(unitId);
    }
    if (type) {
      sql += ' AND question_type = ?';
      params.push(type);
    }
    if (difficulty) {
      sql += ' AND difficulty = ?';
      params.push(difficulty);
    }
    sql += ' ORDER BY rowid';
    const max = Math.min(parseInt(limit) || 50, 200);
    sql += ' LIMIT ?';
    params.push(max);
    jsonResponse(res, { questions: db.prepare(sql).all(...params) });
  } catch (e) {
    log.error({ err: e }, 'Academic questions error');
    jsonResponse(res, { error: 'Internal server error' }, 500);
  }
});

app.get('/api/academic/pyqs', authMiddleware, (req, res) => {
  try {
    const { subjectId, year, examType } = req.query;
    let sql =
      'SELECT id, subject_id, year, semester, exam_type, question_number, question_text, question_type, options, correct_answer, solution, marks, unit_id, co_code FROM pyqs WHERE 1=1';
    const params = [];
    if (subjectId) {
      sql += ' AND subject_id = ?';
      params.push(subjectId);
    }
    if (year) {
      sql += ' AND year = ?';
      params.push(parseInt(year));
    }
    if (examType) {
      sql += ' AND exam_type = ?';
      params.push(examType);
    }
    sql += ' ORDER BY year DESC, question_number';
    jsonResponse(res, { pyqs: db.prepare(sql).all(...params) });
  } catch (e) {
    log.error({ err: e }, 'Academic pyqs error');
    jsonResponse(res, { error: 'Internal server error' }, 500);
  }
});

app.get('/api/academic/notes', authMiddleware, (req, res) => {
  try {
    const { subjectId, unitId, contentType } = req.query;
    let sql =
      'SELECT id, subject_id, unit_id, title, content, content_type, tags, is_verified FROM notes WHERE 1=1';
    const params = [];
    if (subjectId) {
      sql += ' AND subject_id = ?';
      params.push(subjectId);
    }
    if (unitId) {
      sql += ' AND unit_id = ?';
      params.push(unitId);
    }
    if (contentType) {
      sql += ' AND content_type = ?';
      params.push(contentType);
    }
    sql += ' ORDER BY unit_id, content_type';
    jsonResponse(res, { notes: db.prepare(sql).all(...params) });
  } catch (e) {
    log.error({ err: e }, 'Academic notes error');
    jsonResponse(res, { error: 'Internal server error' }, 500);
  }
});

app.get('/api/academic/labs', authMiddleware, (req, res) => {
  try {
    const { subjectId } = req.query;
    let sql =
      'SELECT id, subject_id, experiment_number, title, aim, apparatus, theory, procedure, observations, calculations, result, viva_questions, precautions, reference_material FROM labs WHERE 1=1';
    const params = [];
    if (subjectId) {
      sql += ' AND subject_id = ?';
      params.push(subjectId);
    }
    sql += ' ORDER BY experiment_number';
    jsonResponse(res, { labs: db.prepare(sql).all(...params) });
  } catch (e) {
    log.error({ err: e }, 'Academic labs error');
    jsonResponse(res, { error: 'Internal server error' }, 500);
  }
});

app.get('/api/academic/projects', (req, res) => {
  try {
    const { branch, semester } = req.query;
    let sql =
      'SELECT id, subject_id, branch, semester, title, type, description, objectives, technologies, prerequisites, timeline_weeks, deliverables, difficulty FROM projects WHERE 1=1';
    const params = [];
    if (branch) {
      sql += ' AND branch = ?';
      params.push(branch);
    }
    if (semester) {
      sql += ' AND semester = ?';
      params.push(parseInt(semester));
    }
    sql += ' ORDER BY semester, branch';
    jsonResponse(res, { projects: db.prepare(sql).all(...params) });
  } catch (e) {
    log.error({ err: e }, 'Academic projects error');
    jsonResponse(res, { error: 'Internal server error' }, 500);
  }
});

app.get('/api/academic/dashboard', (req, res) => {
  try {
    const { branch, semester } = req.query;
    const semInt = semester ? parseInt(semester) : null;
    const params = () => [branch || null, branch || null, semInt, semInt];
    const count = sql => db.prepare(sql).get(...params()).c;
    const subjects = count(
      'SELECT COUNT(*) c FROM subjects WHERE (branch = ? OR ? IS NULL) AND (semester = ? OR ? IS NULL)'
    );
    const units = count(
      'SELECT COUNT(*) c FROM units u JOIN subjects s ON s.id = u.subject_id WHERE (s.branch = ? OR ? IS NULL) AND (s.semester = ? OR ? IS NULL)'
    );
    const questions = count(
      'SELECT COUNT(*) c FROM question_banks q JOIN subjects s ON s.id = q.subject_id WHERE (s.branch = ? OR ? IS NULL) AND (s.semester = ? OR ? IS NULL)'
    );
    const pyqs = count(
      'SELECT COUNT(*) c FROM pyqs p JOIN subjects s ON s.id = p.subject_id WHERE (s.branch = ? OR ? IS NULL) AND (s.semester = ? OR ? IS NULL)'
    );
    const notes = count(
      'SELECT COUNT(*) c FROM notes n JOIN subjects s ON s.id = n.subject_id WHERE (s.branch = ? OR ? IS NULL) AND (s.semester = ? OR ? IS NULL)'
    );
    const labs = count(
      'SELECT COUNT(*) c FROM labs l JOIN subjects s ON s.id = l.subject_id WHERE (s.branch = ? OR ? IS NULL) AND (s.semester = ? OR ? IS NULL)'
    );
    const projects = count(
      'SELECT COUNT(*) c FROM projects WHERE (branch = ? OR ? IS NULL) AND (semester = ? OR ? IS NULL)'
    );
    jsonResponse(res, { subjects, units, questions, pyqs, notes, labs, projects });
  } catch (e) {
    log.error({ err: e }, 'Academic dashboard error');
    jsonResponse(res, { error: 'Internal server error' }, 500);
  }
});

// ─── Academic Write API — faculty can create curriculum via API (not only CLI seed) ───
const academicSubjectSchema = z.object({
  code: z.string().trim().min(2).max(20),
  name: z.string().trim().min(2).max(200),
  branch: z.enum(['EC', 'ICT']),
  semester: z.coerce.number().int().min(1).max(6),
  credits: z.coerce.number().int().min(1).max(10).optional().default(3),
  is_lab: z.coerce.number().int().min(0).max(1).optional().default(0),
});
app.post(
  '/api/academic/subjects',
  authMiddleware,
  requireRole('FACULTY', 'GTU_ADMIN'),
  (req, res) => {
    const parsed = academicSubjectSchema.safeParse(req.body);
    if (!parsed.success) return jsonResponse(res, { error: parsed.error.issues[0].message }, 400);
    try {
      const { code, name, branch, semester, credits, is_lab } = parsed.data;
      const id = generateId();
      db.prepare(
        'INSERT INTO subjects (id, code, name, branch, semester, credits, is_lab) VALUES (?,?,?,?,?,?,?)'
      ).run(id, code, name, branch, semester, credits, is_lab);
      auditLog('ACADEMIC_SUBJECT_CREATE', req.user.id, `${code} ${name}`, req.ip);
      jsonResponse(res, { success: true, id }, 201);
    } catch (e) {
      if (String(e.message).includes('UNIQUE'))
        return jsonResponse(res, { error: 'Subject already exists for code/branch/semester' }, 409);
      log.error({ err: e }, 'Academic subject create error');
      jsonResponse(res, { error: 'Internal server error' }, 500);
    }
  }
);

const academicUnitSchema = z.object({
  subject_id: z.string().min(1),
  unit_number: z.coerce.number().int().min(1).max(20),
  title: z.string().trim().min(2).max(200),
  topics: z.string().optional().default('[]'),
  weightage: z.coerce.number().int().min(0).max(100).optional().default(0),
});
app.post('/api/academic/units', authMiddleware, requireRole('FACULTY', 'GTU_ADMIN'), (req, res) => {
  const parsed = academicUnitSchema.safeParse(req.body);
  if (!parsed.success) return jsonResponse(res, { error: parsed.error.issues[0].message }, 400);
  try {
    const { subject_id, unit_number, title, topics, weightage } = parsed.data;
    const id = generateId();
    db.prepare(
      'INSERT INTO units (id, subject_id, unit_number, title, topics, weightage) VALUES (?,?,?,?,?,?)'
    ).run(id, subject_id, unit_number, title, topics, weightage);
    jsonResponse(res, { success: true, id }, 201);
  } catch (e) {
    log.error({ err: e }, 'Academic unit create error');
    jsonResponse(res, { error: 'Internal server error' }, 500);
  }
});

const academicNoteSchema = z.object({
  subject_id: z.string().min(1),
  unit_id: z.string().min(1),
  title: z.string().trim().min(2).max(300),
  content: z.string().min(1).max(100000),
  content_type: z
    .enum(['THEORY', 'FORMULA', 'DERIVATION', 'DIAGRAM', 'SUMMARY', 'MNEMONIC'])
    .optional()
    .default('THEORY'),
  tags: z.string().optional().default('[]'),
});
app.post('/api/academic/notes', authMiddleware, requireRole('FACULTY', 'GTU_ADMIN'), (req, res) => {
  const parsed = academicNoteSchema.safeParse(req.body);
  if (!parsed.success) return jsonResponse(res, { error: parsed.error.issues[0].message }, 400);
  try {
    const { subject_id, unit_id, title, content, content_type, tags } = parsed.data;
    const id = generateId();
    db.prepare(
      'INSERT INTO notes (id, subject_id, unit_id, title, content, content_type, tags, is_verified, created_by) VALUES (?,?,?,?,?,?,?,?,?)'
    ).run(id, subject_id, unit_id, title, content, content_type, tags, 0, req.user.id);
    jsonResponse(res, { success: true, id }, 201);
  } catch (e) {
    log.error({ err: e }, 'Academic note create error');
    jsonResponse(res, { error: 'Internal server error' }, 500);
  }
});

const academicQuestionSchema = z.object({
  subject_id: z.string().min(1),
  unit_id: z.string().optional(),
  question_text: z.string().min(5).max(5000),
  question_type: z
    .enum(['MCQ', 'DESCRIPTIVE', 'NUMERICAL', 'TRUE_FALSE'])
    .optional()
    .default('MCQ'),
  options: z.string().nullable().optional(),
  correct_answer: z.string().min(1).max(2000),
  explanation: z.string().max(5000).optional().default(''),
  marks: z.coerce.number().int().min(1).max(20).optional().default(1),
  difficulty: z.enum(['Easy', 'Medium', 'Hard']).optional().default('Medium'),
});
app.post(
  '/api/academic/questions',
  authMiddleware,
  requireRole('FACULTY', 'GTU_ADMIN'),
  (req, res) => {
    const parsed = academicQuestionSchema.safeParse(req.body);
    if (!parsed.success) return jsonResponse(res, { error: parsed.error.issues[0].message }, 400);
    try {
      const d = parsed.data;
      const id = generateId();
      db.prepare(
        'INSERT INTO question_banks (id, subject_id, unit_id, question_text, question_type, options, correct_answer, explanation, marks, difficulty, is_active, created_by) VALUES (?,?,?,?,?,?,?,?,?,?,1,?)'
      ).run(
        id,
        d.subject_id,
        d.unit_id || null,
        d.question_text,
        d.question_type,
        d.options || null,
        d.correct_answer,
        d.explanation,
        d.marks,
        d.difficulty,
        req.user.id
      );
      jsonResponse(res, { success: true, id }, 201);
    } catch (e) {
      log.error({ err: e }, 'Academic question create error');
      jsonResponse(res, { error: 'Internal server error' }, 500);
    }
  }
);

// ─── Mock AI Response Generators ─────────────────────────────────────────────────
function getMockAIResponse(type, message, context = '') {
  const responses = {
    chat: [
      `I understand you're asking about "${message}". Based on the GTU syllabus, this relates to ${context || 'core concepts'}. Let me break it down:\n\n**Key Points:**\n1. Fundamental principle\n2. Practical application\n3. Common exam pattern\n\n**Study Tip:** Focus on numerical problems from past papers - they repeat often.\n\nNeed a numerical example or diagram explanation?`,
      `Great question on "${message}"! This is a ${getRandomItem(['frequently asked', 'conceptually important', 'numerical-heavy'])} topic in GTU exams.\n\n**Quick Summary:**\n• Definition & formula\n• Step-by-step derivation\n• Common variants\n\n**Pro Tip:** Create a one-page formula sheet for this unit. 80% of questions come from 20% of formulas.\n\nWant me to generate a practice problem?`,
    ],
    explain: [
      `**${message}** - Simplified Explanation\n\n**What it is:** Core concept in simple terms\n**Formula:** [Standard formula]\n**Units:** [SI units]\n\n**Derivation Steps:**\n1. Start from basic principle\n2. Apply boundary conditions\n3. Arrive at final equation\n\n**Memory Hook:** "${getRandomMnemonic(message)}"\n\n**Typical Exam Questions:**\n- Derive the expression for...\n- Calculate when given...\n- Explain the physical significance of...`,
      `**Topic: ${message}**\n\n**Concept Map:**\n├── Definition\n├── Formula → Variables\n├── Assumptions\n├── Applications\n└── Limitations\n\n**Bloom's Level:** Understand → Apply\n**CO Mapping:** CO${Math.floor(Math.random() * 4) + 1}\n\n**Practice:** Try solving Q${Math.floor(Math.random() * 5) + 1} from last 3 years' papers.`,
    ],
  };

  const arr = responses[type] || responses.chat;
  return arr[Math.floor(Math.random() * arr.length)];
}

function getMockGrading(answers, questions) {
  const qArray = Array.isArray(questions) ? questions : [];
  const total = qArray.length || 10;
  let correct = 0;

  if (Array.isArray(answers)) {
    answers.forEach((ans, i) => {
      if (qArray[i] && qArray[i].correct === ans) correct++;
      else if (Math.random() > 0.4) correct++;
    });
  }

  const score = Math.max(0, Math.min(total, correct + Math.floor(Math.random() * 2)));
  const percentage = Math.round((score / total) * 100);

  const breakdown = qArray.map(function (q, i) {
    return {
      question: i + 1,
      yourAnswer: answers?.[i],
      correct: q?.correct,
      status: answers?.[i] === q?.correct ? 'correct' : 'incorrect',
    };
  });

  return {
    score: score,
    total: total,
    percentage: percentage,
    feedback:
      percentage >= 80
        ? 'Excellent! You have strong grasp of this unit.'
        : percentage >= 60
          ? 'Good effort. Review the incorrect answers - focus on concept clarity.'
          : 'Needs improvement. Revisit the unit notes and try practice questions.',
    breakdown: breakdown,
  };
}

function getMockExplanation(topic, subject = '', level = 'intermediate') {
  const explanations = [
    `**${topic}** (${subject || 'General'})\n\n**Definition:** Fundamental concept in engineering\n\n**Key Formula:** ${getRandomFormula()}\n\n**Step-by-Step Derivation:**\n1. Identify given parameters\n2. Apply governing principle\n3. Substitute and solve\n\n**Common Mistakes:**\n- Unit conversion errors\n- Sign convention\n- Boundary conditions\n\n**Exam Pattern:** ${getRandomExamPattern()}\n\n**Quick Reference Card:**\n• When to use: [Condition]\n• What to find: [Unknown]\n• Check: [Validation step]`,

    `**${topic}** - ${level.charAt(0).toUpperCase() + level.slice(1)} Level\n\n**Concept:** ${getRandomConcept()}\n\n**Visual:** [Diagram would be here]\n\n**Worked Example:**\nGiven: [Standard problem]\nFind: [Unknown]\nSolution: [Step-by-step]\nAnswer: [With units]\n\n**Practice Set:** Try problems from Unit ${Math.floor(Math.random() * 6) + 1} PYQs`,
  ];

  return explanations[Math.floor(Math.random() * explanations.length)];
}

function getRandomItem(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}
function getRandomMnemonic(topic) {
  return topic
    .split(' ')
    .map(w => w[0])
    .join('')
    .toUpperCase();
}
function getRandomFormula() {
  return 'V = IR / P = VI / F = ma';
}
function getRandomExamPattern() {
  return '2-3 marks numerical, 1 mark theory';
}
function getRandomConcept() {
  return 'Core principle applied to real-world scenarios';
}

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
app.get('/api/metrics', authMiddleware, requireRole('GTU_ADMIN'), (req, res) => {
  jsonResponse(res, getMetrics());
});

// ── Alerts Endpoint ─────────────────────────────────────────────────────────────
app.get('/api/alerts', authMiddleware, requireRole('GTU_ADMIN'), (req, res) => {
  jsonResponse(res, { alerts: checkAlerts() });
});

// ── Audit Log Endpoint ──────────────────────────────────────────────────────────
app.get('/api/audit-log', authMiddleware, requireRole('GTU_ADMIN'), (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit) || 50, 200);
    const logs = db.prepare('SELECT * FROM audit_log ORDER BY created_at DESC LIMIT ?').all(limit);
    jsonResponse(res, { logs });
  } catch (e) {
    log.error({ err: e }, 'Audit log error');
    jsonResponse(res, { error: 'Internal server error' }, 500);
  }
});

// ── Serve frontend dist (college PC without nginx) ──────────────────────────────
const distPath = path.join(__dirname, '..', 'dist');
if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));
  // SPA fallback for non-API routes
  app.get(/^(?!\/api).*/, (req, res) => {
    res.sendFile(path.join(distPath, 'index.html'));
  });
}

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
      {
        title: 'Mid-Term Exam Schedule Released',
        content:
          'Mid-term examinations for all semesters will begin from 15th August 2026. Please check the exam hub for detailed schedule.',
        author: 'GTU Examination Cell',
        priority: 'high',
        category: 'EXAM',
      },
      {
        title: 'Campus Placement Drive',
        content:
          'TCS will be conducting a campus placement drive for eligible final year students on 20th August 2026. Register through the campus portal.',
        author: 'Training & Placement Cell',
        priority: 'normal',
        category: 'PLACEMENT',
      },
      {
        title: 'Library Extended Hours',
        content:
          'The central library will remain open until 10 PM during the examination period starting from 10th August.',
        author: 'Library Administration',
        priority: 'normal',
        category: 'GENERAL',
      },
    ];
    notices.forEach(n => {
      db.prepare(
        'INSERT INTO notices (id, title, content, author, priority, category, branch) VALUES (?, ?, ?, ?, ?, ?, ?)'
      ).run(generateId(), n.title, n.content, n.author, n.priority, n.category, 'ALL');
    });
  }

  const facultyCount = db.prepare('SELECT COUNT(*) as count FROM faculty').get().count;
  if (facultyCount === 0) {
    const faculties = [
      {
        name: 'Dr. Priya Sharma',
        designation: 'HOD',
        department: 'Electronics & Communication',
        email: 'priya.sharma@gtu.edu',
        phone: '9876543210',
        branch: 'EC',
      },
      {
        name: 'Prof. Rajesh Patel',
        designation: 'Assistant Professor',
        department: 'Electronics & Communication',
        email: 'rajesh.patel@gtu.edu',
        phone: '9876543211',
        branch: 'EC',
      },
      {
        name: 'Prof. Sneha Mehta',
        designation: 'Assistant Professor',
        department: 'Electronics & Communication',
        email: 'sneha.mehta@gtu.edu',
        phone: '9876543212',
        branch: 'EC',
      },
      {
        name: 'Dr. Amit Joshi',
        designation: 'HOD',
        department: 'ICT',
        email: 'amit.joshi@gtu.edu',
        phone: '9876543213',
        branch: 'ICT',
      },
      {
        name: 'Prof. Kavita Singh',
        designation: 'Assistant Professor',
        department: 'ICT',
        email: 'kavita.singh@gtu.edu',
        phone: '9876543214',
        branch: 'ICT',
      },
      {
        name: 'Prof. Deepak Kumar',
        designation: 'Assistant Professor',
        department: 'ICT',
        email: 'deepak.kumar@gtu.edu',
        phone: '9876543215',
        branch: 'ICT',
      },
    ];
    faculties.forEach(f => {
      db.prepare(
        'INSERT INTO faculty (id, name, designation, department, email, phone, branch) VALUES (?, ?, ?, ?, ?, ?, ?)'
      ).run(generateId(), f.name, f.designation, f.department, f.email, f.phone, f.branch);
    });
  }

  const timetableCount = db.prepare('SELECT COUNT(*) as count FROM timetable').get().count;
  if (timetableCount === 0) {
    const days = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
    const ecSubjects = [
      'Mathematics-III',
      'Digital Electronics',
      'Analog Circuits',
      'Signals & Systems',
      'Programming in C',
      'Communication Systems',
    ];
    const ictSubjects = [
      'Data Structures',
      'Web Technologies',
      'Database Management',
      'Computer Networks',
      'Software Engineering',
      'AI & ML Basics',
    ];

    ['EC', 'ICT'].forEach(branch => {
      const subjects = branch === 'EC' ? ecSubjects : ictSubjects;
      for (let sem = 1; sem <= 6; sem++) {
        days.forEach((day, dayIdx) => {
          for (let slot = 0; slot < 6; slot++) {
            const subjectIdx = (dayIdx + slot) % subjects.length;
            const times = ['09:00', '10:00', '11:00', '12:00', '13:30', '14:30'];
            const endTimes = ['10:00', '11:00', '12:00', '13:00', '14:30', '15:30'];
            db.prepare(
              'INSERT INTO timetable (id, branch, semester, day, slot_index, subject, type, start_time, end_time, faculty_name, batch) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
            ).run(
              generateId(),
              branch,
              String(sem),
              day,
              slot,
              subjects[subjectIdx],
              slot === 4 ? 'RECESS' : 'LECTURE',
              times[slot],
              endTimes[slot],
              slot === 4 ? '' : 'Faculty ' + (slot + 1),
              'ALL'
            );
          }
        });
      }
    });
  }

  const examCount = db.prepare('SELECT COUNT(*) as count FROM exams').get().count;
  if (examCount === 0) {
    const quizzes = [
      {
        title: 'Digital Electronics - Quiz 1',
        branch: 'EC',
        semester: '3',
        subject: 'Digital Electronics',
        questions: JSON.stringify([
          {
            id: '1',
            text: 'What is a flip-flop?',
            options: ['A combinational circuit', 'A sequential circuit', 'A logic gate', 'None'],
            correctIndex: 1,
          },
          {
            id: '2',
            text: 'How many states does a JK flip-flop have?',
            options: ['1', '2', '3', '4'],
            correctIndex: 1,
          },
          {
            id: '3',
            text: 'Which gate is called universal gate?',
            options: ['AND', 'OR', 'NAND', 'XOR'],
            correctIndex: 2,
          },
        ]),
        duration: 15,
        totalMarks: 30,
      },
      {
        title: 'Data Structures - Quiz 1',
        branch: 'ICT',
        semester: '2',
        subject: 'Data Structures',
        questions: JSON.stringify([
          {
            id: '1',
            text: 'What is the time complexity of binary search?',
            options: ['O(n)', 'O(log n)', 'O(n²)', 'O(1)'],
            correctIndex: 1,
          },
          {
            id: '2',
            text: 'Which data structure uses FIFO?',
            options: ['Stack', 'Queue', 'Tree', 'Graph'],
            correctIndex: 1,
          },
          {
            id: '3',
            text: 'What is the height of a balanced BST with n nodes?',
            options: ['O(n)', 'O(log n)', 'O(n log n)', 'O(1)'],
            correctIndex: 1,
          },
        ]),
        duration: 15,
        totalMarks: 30,
      },
    ];
    quizzes.forEach(q => {
      db.prepare(
        'INSERT INTO exams (id, title, branch, semester, subject, questions, duration, total_marks) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
      ).run(
        generateId(),
        q.title,
        q.branch,
        q.semester,
        q.subject,
        q.questions,
        q.duration,
        q.totalMarks
      );
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
process.on('uncaughtException', err => {
  log.fatal({ err }, 'Uncaught exception');
  trackError();
  process.exit(1);
});
process.on('unhandledRejection', reason => {
  log.error({ reason }, 'Unhandled rejection');
  trackError();
});

// ── Periodic Alert Check ────────────────────────────────────────────────────────
setInterval(() => {
  const alerts = checkAlerts();
  if (alerts.length > 0) {
    alerts.forEach(a =>
      log[a.level === 'critical' ? 'fatal' : 'warn']({ alert: a }, 'System alert')
    );
  }
}, 60000);

// ── SaaS Tenant Routes ──────────────────────────────────────────────
const { TenantManager } = require('./config/tenant');
const tenantMgr = new TenantManager(db);

app.get('/api/saas/tenants', authMiddleware, requireRole('GTU_ADMIN'), (req, res) => {
  try {
    jsonResponse(res, { tenants: tenantMgr.listTenants() });
  } catch (e) {
    log.error({ err: e }, 'List tenants error');
    jsonResponse(res, { error: 'Internal server error' }, 500);
  }
});

app.post('/api/saas/tenants', authMiddleware, requireRole('GTU_ADMIN'), (req, res) => {
  try {
    const { name, code, domain, plan, adminEmail, maxUsers } = req.body;
    if (!name || !code) return jsonResponse(res, { error: 'Name and code required' }, 400);
    const tenant = tenantMgr.createTenant({ name, code, domain, plan, adminEmail, maxUsers });
    jsonResponse(res, { success: true, tenant }, 201);
  } catch (e) {
    log.error({ err: e }, 'Create tenant error');
    jsonResponse(res, { error: 'Internal server error' }, 500);
  }
});

app.get('/api/saas/tenants/:id/stats', authMiddleware, requireRole('GTU_ADMIN'), (req, res) => {
  try {
    jsonResponse(res, { stats: tenantMgr.getTenantStats(req.params.id) });
  } catch (e) {
    log.error({ err: e }, 'Tenant stats error');
    jsonResponse(res, { error: 'Internal server error' }, 500);
  }
});

app.get('/api/saas/tenants/:id/capacity', authMiddleware, requireRole('GTU_ADMIN'), (req, res) => {
  try {
    jsonResponse(res, { capacity: tenantMgr.checkCapacity(req.params.id) });
  } catch (e) {
    log.error({ err: e }, 'Tenant capacity error');
    jsonResponse(res, { error: 'Internal server error' }, 500);
  }
});

app.put('/api/saas/tenants/:id/plan', authMiddleware, requireRole('GTU_ADMIN'), (req, res) => {
  try {
    const { plan } = req.body;
    if (!plan) return jsonResponse(res, { error: 'Plan required' }, 400);
    jsonResponse(res, { success: true, result: tenantMgr.updatePlan(req.params.id, plan) });
  } catch (e) {
    log.error({ err: e }, 'Update plan error');
    jsonResponse(res, { error: 'Internal server error' }, 500);
  }
});

// ── Redis Integration (optional) ────────────────────────────────────
let redisCache = null;
let useRedis = false;

try {
  if (process.env.REDIS_URL) {
    const { cache } = require('./config/redis');
    redisCache = cache;
    useRedis = true;
    log.info('Redis cache enabled');
  }
} catch {
  log.warn('Redis not available, running without cache');
}

// ── WebSocket Integration ───────────────────────────────────────────
const http = require('http');
const server = http.createServer(app);
const { setupWebSocket } = require('./websocket');
const io = setupWebSocket(server, db);

// ── Start ───────────────────────────────────────────────────────────────
seedData();

server.listen(PORT, '0.0.0.0', () => {
  const interfaces = os.networkInterfaces();
  let localIP = 'localhost';
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name] || []) {
      if (iface.family === 'IPv4' && !iface.internal) {
        localIP = iface.address;
      }
    }
  }
  log.info(`GPA Study Hub Server v3.0 started on port ${PORT}`);
  log.info(`Local:   http://localhost:${PORT}`);
  log.info(`Network: http://${localIP}:${PORT}`);
  log.info(`Health:  http://${localIP}:${PORT}/api/health`);
  log.info(`Metrics: http://${localIP}:${PORT}/api/metrics`);
  log.info(`WebSocket: ws://${localIP}:${PORT}/socket.io/`);
  log.info(`Redis: ${useRedis ? 'enabled' : 'disabled'}`);
  console.log(`\n  GPA Study Hub Server v3.0 running!`);
  console.log(`  Local:      http://localhost:${PORT}`);
  console.log(`  Network:    http://${localIP}:${PORT}`);
  console.log(`  Health:     http://${localIP}:${PORT}/api/health`);
  console.log(`  Metrics:    http://${localIP}:${PORT}/api/metrics`);
  console.log(`  WebSocket:  ws://${localIP}:${PORT}/socket.io/`);
  console.log(`  Redis:      ${useRedis ? 'enabled' : 'disabled'}`);
  console.log(`\n  Use this IP in the app: ${localIP}\n`);
});
