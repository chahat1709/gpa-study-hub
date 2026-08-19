const Database = require('better-sqlite3');
const path = require('path');
const pino = require('pino');

const log = pino({ name: 'database' });

function initializeDatabase(dbPath) {
  const db = new Database(dbPath || path.join(__dirname, '..', 'gpa_hub.db'));

  // Performance pragmas
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');
  db.pragma('synchronous = NORMAL');
  db.pragma('cache_size = -128000'); // 128MB cache
  db.pragma('busy_timeout = 10000');
  db.pragma('mmap_size = 268435456'); // 256MB mmap
  db.pragma('temp_store = MEMORY');

  // Schema with multi-tenancy support
  db.exec(`
    -- Institutions (tenants)
    CREATE TABLE IF NOT EXISTS institutions (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      code TEXT UNIQUE NOT NULL,
      domain TEXT DEFAULT '',
      logo_url TEXT DEFAULT '',
      plan TEXT DEFAULT 'free',
      max_users INTEGER DEFAULT 500,
      created_at TEXT DEFAULT (datetime('now'))
    );

    -- Users with institution_id for multi-tenancy
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      institution_id TEXT DEFAULT 'default',
      name TEXT NOT NULL,
      enrollment_number TEXT,
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
      last_login_at TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (institution_id) REFERENCES institutions(id)
    );

    CREATE UNIQUE INDEX IF NOT EXISTS idx_users_enrollment_tenant
      ON users(enrollment_number, institution_id);
    CREATE INDEX IF NOT EXISTS idx_users_institution ON users(institution_id);
    CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
    CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
    CREATE INDEX IF NOT EXISTS idx_users_branch_sem ON users(branch, semester);

    -- Attendance with proper relations
    CREATE TABLE IF NOT EXISTS attendance_records (
      id TEXT PRIMARY KEY,
      institution_id TEXT DEFAULT 'default',
      user_id TEXT NOT NULL,
      subject TEXT NOT NULL,
      date TEXT NOT NULL,
      status TEXT DEFAULT 'PRESENT',
      slot_id TEXT DEFAULT '',
      marked_by TEXT DEFAULT '',
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (institution_id) REFERENCES institutions(id)
    );

    CREATE INDEX IF NOT EXISTS idx_attendance_user ON attendance_records(user_id);
    CREATE INDEX IF NOT EXISTS idx_attendance_date ON attendance_records(date);
    CREATE INDEX IF NOT EXISTS idx_attendance_subject ON attendance_records(subject);
    CREATE INDEX IF NOT EXISTS idx_attendance_tenant ON attendance_records(institution_id);
    CREATE INDEX IF NOT EXISTS idx_attendance_user_date ON attendance_records(user_id, date);

    -- Timetable
    CREATE TABLE IF NOT EXISTS timetable (
      id TEXT PRIMARY KEY,
      institution_id TEXT DEFAULT 'default',
      branch TEXT NOT NULL,
      semester TEXT NOT NULL,
      day TEXT NOT NULL,
      slot_index INTEGER NOT NULL,
      subject TEXT NOT NULL,
      type TEXT DEFAULT 'LECTURE',
      start_time TEXT NOT NULL,
      end_time TEXT NOT NULL,
      faculty_name TEXT DEFAULT '',
      batch TEXT DEFAULT 'ALL',
      FOREIGN KEY (institution_id) REFERENCES institutions(id)
    );

    CREATE INDEX IF NOT EXISTS idx_timetable_lookup ON timetable(branch, semester, day);
    CREATE INDEX IF NOT EXISTS idx_timetable_tenant ON timetable(institution_id);

    -- Tasks
    CREATE TABLE IF NOT EXISTS tasks (
      id TEXT PRIMARY KEY,
      institution_id TEXT DEFAULT 'default',
      user_id TEXT NOT NULL,
      title TEXT NOT NULL,
      description TEXT DEFAULT '',
      due_date TEXT DEFAULT '',
      completed INTEGER DEFAULT 0,
      category TEXT DEFAULT 'GENERAL',
      priority INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (institution_id) REFERENCES institutions(id)
    );

    CREATE INDEX IF NOT EXISTS idx_tasks_user ON tasks(user_id);
    CREATE INDEX IF NOT EXISTS idx_tasks_due ON tasks(due_date);
    CREATE INDEX IF NOT EXISTS idx_tasks_tenant ON tasks(institution_id);

    -- Resources
    CREATE TABLE IF NOT EXISTS resources (
      id TEXT PRIMARY KEY,
      institution_id TEXT DEFAULT 'default',
      title TEXT NOT NULL,
      description TEXT DEFAULT '',
      url TEXT DEFAULT '',
      file_url TEXT DEFAULT '',
      type TEXT DEFAULT 'DOCUMENT',
      branch TEXT DEFAULT 'EC',
      semester TEXT DEFAULT '1',
      subject TEXT DEFAULT '',
      uploaded_by TEXT DEFAULT '',
      download_count INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (institution_id) REFERENCES institutions(id)
    );

    CREATE INDEX IF NOT EXISTS idx_resources_branch_sem ON resources(branch, semester);
    CREATE INDEX IF NOT EXISTS idx_resources_tenant ON resources(institution_id);

    -- Notices
    CREATE TABLE IF NOT EXISTS notices (
      id TEXT PRIMARY KEY,
      institution_id TEXT DEFAULT 'default',
      title TEXT NOT NULL,
      content TEXT NOT NULL,
      author TEXT DEFAULT 'Administration',
      category TEXT DEFAULT 'GENERAL',
      priority TEXT DEFAULT 'normal',
      branch TEXT DEFAULT 'ALL',
      is_pinned INTEGER DEFAULT 0,
      view_count INTEGER DEFAULT 0,
      date TEXT DEFAULT (date('now')),
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (institution_id) REFERENCES institutions(id)
    );

    CREATE INDEX IF NOT EXISTS idx_notices_tenant ON notices(institution_id);
    CREATE INDEX IF NOT EXISTS idx_notices_date ON notices(date DESC);

    -- Chats
    CREATE TABLE IF NOT EXISTS chats (
      id TEXT PRIMARY KEY,
      institution_id TEXT DEFAULT 'default',
      participants TEXT NOT NULL,
      is_group INTEGER DEFAULT 0,
      group_name TEXT DEFAULT '',
      last_message TEXT DEFAULT '',
      last_timestamp TEXT DEFAULT (datetime('now')),
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (institution_id) REFERENCES institutions(id)
    );

    CREATE INDEX IF NOT EXISTS idx_chats_participants ON chats(participants);
    CREATE INDEX IF NOT EXISTS idx_chats_tenant ON chats(institution_id);

    -- Messages
    CREATE TABLE IF NOT EXISTS messages (
      id TEXT PRIMARY KEY,
      chat_id TEXT NOT NULL,
      sender_id TEXT NOT NULL,
      sender_name TEXT NOT NULL,
      content TEXT NOT NULL,
      is_encrypted INTEGER DEFAULT 0,
      is_read INTEGER DEFAULT 0,
      timestamp TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (chat_id) REFERENCES chats(id)
    );

    CREATE INDEX IF NOT EXISTS idx_messages_chat ON messages(chat_id);
    CREATE INDEX IF NOT EXISTS idx_messages_timestamp ON messages(timestamp DESC);

    -- Exams
    CREATE TABLE IF NOT EXISTS exams (
      id TEXT PRIMARY KEY,
      institution_id TEXT DEFAULT 'default',
      title TEXT NOT NULL,
      branch TEXT DEFAULT 'EC',
      semester TEXT DEFAULT '1',
      subject TEXT DEFAULT '',
      questions TEXT DEFAULT '[]',
      duration INTEGER DEFAULT 60,
      total_marks INTEGER DEFAULT 100,
      is_published INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (institution_id) REFERENCES institutions(id)
    );

    CREATE INDEX IF NOT EXISTS idx_exams_tenant ON exams(institution_id);

    -- Exam Results
    CREATE TABLE IF NOT EXISTS exam_results (
      id TEXT PRIMARY KEY,
      institution_id TEXT DEFAULT 'default',
      user_id TEXT NOT NULL,
      exam_id TEXT NOT NULL,
      score INTEGER DEFAULT 0,
      total INTEGER DEFAULT 100,
      answers TEXT DEFAULT '{}',
      completed_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (exam_id) REFERENCES exams(id),
      FOREIGN KEY (institution_id) REFERENCES institutions(id)
    );

    CREATE INDEX IF NOT EXISTS idx_exam_results_user ON exam_results(user_id);
    CREATE INDEX IF NOT EXISTS idx_exam_results_exam ON exam_results(exam_id);

    -- Faculty
    CREATE TABLE IF NOT EXISTS faculty (
      id TEXT PRIMARY KEY,
      institution_id TEXT DEFAULT 'default',
      name TEXT NOT NULL,
      designation TEXT DEFAULT '',
      department TEXT DEFAULT 'EC',
      email TEXT DEFAULT '',
      phone TEXT DEFAULT '',
      branch TEXT DEFAULT 'EC',
      FOREIGN KEY (institution_id) REFERENCES institutions(id)
    );

    CREATE INDEX IF NOT EXISTS idx_faculty_tenant ON faculty(institution_id);

    -- Settings (key-value per tenant)
    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );

    -- Audit Log
    CREATE TABLE IF NOT EXISTS audit_log (
      id TEXT PRIMARY KEY,
      institution_id TEXT DEFAULT 'default',
      action TEXT NOT NULL,
      user_id TEXT DEFAULT '',
      details TEXT DEFAULT '',
      ip TEXT DEFAULT '',
      user_agent TEXT DEFAULT '',
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE INDEX IF NOT EXISTS idx_audit_log_tenant ON audit_log(institution_id);
    CREATE INDEX IF NOT EXISTS idx_audit_log_action ON audit_log(action);
    CREATE INDEX IF NOT EXISTS idx_audit_log_date ON audit_log(created_at DESC);

    -- Notifications (for push/websocket)
    CREATE TABLE IF NOT EXISTS notifications (
      id TEXT PRIMARY KEY,
      institution_id TEXT DEFAULT 'default',
      user_id TEXT NOT NULL,
      title TEXT NOT NULL,
      message TEXT NOT NULL,
      type TEXT DEFAULT 'info',
      is_read INTEGER DEFAULT 0,
      link TEXT DEFAULT '',
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
    CREATE INDEX IF NOT EXISTS idx_notifications_unread ON notifications(user_id, is_read);

    -- Activity Log (user actions for analytics)
    CREATE TABLE IF NOT EXISTS activity_log (
      id TEXT PRIMARY KEY,
      institution_id TEXT DEFAULT 'default',
      user_id TEXT NOT NULL,
      action TEXT NOT NULL,
      entity_type TEXT DEFAULT '',
      entity_id TEXT DEFAULT '',
      metadata TEXT DEFAULT '{}',
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE INDEX IF NOT EXISTS idx_activity_user ON activity_log(user_id);
    CREATE INDEX IF NOT EXISTS idx_activity_tenant ON activity_log(institution_id);
    CREATE INDEX IF NOT EXISTS idx_activity_date ON activity_log(created_at DESC);
  `);

  log.info('Database schema initialized');
  return db;
}

module.exports = { initializeDatabase };
