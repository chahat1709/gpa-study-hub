-- GPA Study Hub - PostgreSQL Schema
-- Run this to initialize the database

-- Institutions (multi-tenant)
CREATE TABLE IF NOT EXISTS institutions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  code VARCHAR(50) UNIQUE NOT NULL,
  domain VARCHAR(255) DEFAULT '',
  logo_url TEXT DEFAULT '',
  plan VARCHAR(20) DEFAULT 'free',
  max_users INTEGER DEFAULT 500,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Users
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id UUID DEFAULT NULL REFERENCES institutions(id),
  name VARCHAR(255) NOT NULL,
  enrollment_number VARCHAR(50),
  pin_hash VARCHAR(255) NOT NULL,
  role VARCHAR(20) DEFAULT 'STUDENT',
  branch VARCHAR(10) DEFAULT 'EC',
  semester VARCHAR(5) DEFAULT '1',
  section VARCHAR(5) DEFAULT 'A',
  university VARCHAR(255) DEFAULT '',
  photo_url TEXT DEFAULT '',
  email VARCHAR(255) DEFAULT '',
  password_hash VARCHAR(255) DEFAULT '',
  is_active BOOLEAN DEFAULT true,
  last_login_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(enrollment_number, institution_id)
);

CREATE INDEX idx_users_institution ON users(institution_id);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_branch_sem ON users(branch, semester);

-- Attendance
CREATE TABLE IF NOT EXISTS attendance_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id UUID DEFAULT NULL REFERENCES institutions(id),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  subject VARCHAR(255) NOT NULL,
  date DATE NOT NULL,
  status VARCHAR(20) DEFAULT 'PRESENT',
  slot_id VARCHAR(50) DEFAULT '',
  marked_by UUID DEFAULT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_attendance_user ON attendance_records(user_id);
CREATE INDEX idx_attendance_date ON attendance_records(date);
CREATE INDEX idx_attendance_tenant ON attendance_records(institution_id);
CREATE INDEX idx_attendance_user_date ON attendance_records(user_id, date);

-- Timetable
CREATE TABLE IF NOT EXISTS timetable (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id UUID DEFAULT NULL REFERENCES institutions(id),
  branch VARCHAR(10) NOT NULL,
  semester VARCHAR(5) NOT NULL,
  day VARCHAR(10) NOT NULL,
  slot_index INTEGER NOT NULL,
  subject VARCHAR(255) NOT NULL,
  type VARCHAR(20) DEFAULT 'LECTURE',
  start_time VARCHAR(10) NOT NULL,
  end_time VARCHAR(10) NOT NULL,
  faculty_name VARCHAR(255) DEFAULT '',
  batch VARCHAR(50) DEFAULT 'ALL'
);

CREATE INDEX idx_timetable_lookup ON timetable(branch, semester, day);

-- Tasks
CREATE TABLE IF NOT EXISTS tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id UUID DEFAULT NULL REFERENCES institutions(id),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT DEFAULT '',
  due_date DATE,
  completed BOOLEAN DEFAULT false,
  category VARCHAR(50) DEFAULT 'GENERAL',
  priority INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_tasks_user ON tasks(user_id);
CREATE INDEX idx_tasks_due ON tasks(due_date);

-- Resources
CREATE TABLE IF NOT EXISTS resources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id UUID DEFAULT NULL REFERENCES institutions(id),
  title VARCHAR(255) NOT NULL,
  description TEXT DEFAULT '',
  url TEXT DEFAULT '',
  file_url TEXT DEFAULT '',
  type VARCHAR(50) DEFAULT 'DOCUMENT',
  branch VARCHAR(10) DEFAULT 'EC',
  semester VARCHAR(5) DEFAULT '1',
  subject VARCHAR(255) DEFAULT '',
  uploaded_by UUID DEFAULT NULL,
  download_count INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_resources_branch_sem ON resources(branch, semester);

-- Notices
CREATE TABLE IF NOT EXISTS notices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id UUID DEFAULT NULL REFERENCES institutions(id),
  title VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,
  author VARCHAR(255) DEFAULT 'Administration',
  category VARCHAR(50) DEFAULT 'GENERAL',
  priority VARCHAR(20) DEFAULT 'normal',
  branch VARCHAR(10) DEFAULT 'ALL',
  is_pinned BOOLEAN DEFAULT false,
  view_count INTEGER DEFAULT 0,
  date DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_notices_tenant ON notices(institution_id);
CREATE INDEX idx_notices_date ON notices(date DESC);

-- Chats
CREATE TABLE IF NOT EXISTS chats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id UUID DEFAULT NULL REFERENCES institutions(id),
  participants JSONB NOT NULL DEFAULT '[]',
  is_group BOOLEAN DEFAULT false,
  group_name VARCHAR(255) DEFAULT '',
  last_message TEXT DEFAULT '',
  last_timestamp TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Messages
CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chat_id UUID NOT NULL REFERENCES chats(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES users(id),
  sender_name VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,
  is_encrypted BOOLEAN DEFAULT false,
  is_read BOOLEAN DEFAULT false,
  timestamp TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_messages_chat ON messages(chat_id);
CREATE INDEX idx_messages_timestamp ON messages(timestamp DESC);

-- Exams
CREATE TABLE IF NOT EXISTS exams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id UUID DEFAULT NULL REFERENCES institutions(id),
  title VARCHAR(255) NOT NULL,
  branch VARCHAR(10) DEFAULT 'EC',
  semester VARCHAR(5) DEFAULT '1',
  subject VARCHAR(255) DEFAULT '',
  questions JSONB DEFAULT '[]',
  duration INTEGER DEFAULT 60,
  total_marks INTEGER DEFAULT 100,
  is_published BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Exam Results
CREATE TABLE IF NOT EXISTS exam_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id UUID DEFAULT NULL REFERENCES institutions(id),
  user_id UUID NOT NULL REFERENCES users(id),
  exam_id UUID NOT NULL REFERENCES exams(id),
  score INTEGER DEFAULT 0,
  total INTEGER DEFAULT 100,
  answers JSONB DEFAULT '{}',
  completed_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_exam_results_user ON exam_results(user_id);
CREATE INDEX idx_exam_results_exam ON exam_results(exam_id);

-- Faculty
CREATE TABLE IF NOT EXISTS faculty (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id UUID DEFAULT NULL REFERENCES institutions(id),
  name VARCHAR(255) NOT NULL,
  designation VARCHAR(100) DEFAULT '',
  department VARCHAR(100) DEFAULT 'EC',
  email VARCHAR(255) DEFAULT '',
  phone VARCHAR(20) DEFAULT '',
  branch VARCHAR(10) DEFAULT 'EC'
);

-- Settings
CREATE TABLE IF NOT EXISTS settings (
  key VARCHAR(255) PRIMARY KEY,
  value TEXT NOT NULL
);

-- Audit Log
CREATE TABLE IF NOT EXISTS audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id UUID DEFAULT NULL REFERENCES institutions(id),
  action VARCHAR(100) NOT NULL,
  user_id UUID DEFAULT NULL,
  details TEXT DEFAULT '',
  ip INET,
  user_agent TEXT DEFAULT '',
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_audit_log_tenant ON audit_log(institution_id);
CREATE INDEX idx_audit_log_action ON audit_log(action);
CREATE INDEX idx_audit_log_date ON audit_log(created_at DESC);

-- Notifications
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id UUID DEFAULT NULL REFERENCES institutions(id),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  type VARCHAR(20) DEFAULT 'info',
  is_read BOOLEAN DEFAULT false,
  link TEXT DEFAULT '',
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_notifications_user ON notifications(user_id);
CREATE INDEX idx_notifications_unread ON notifications(user_id, is_read);

-- Activity Log
CREATE TABLE IF NOT EXISTS activity_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id UUID DEFAULT NULL REFERENCES institutions(id),
  user_id UUID NOT NULL REFERENCES users(id),
  action VARCHAR(100) NOT NULL,
  entity_type VARCHAR(50) DEFAULT '',
  entity_id UUID DEFAULT NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_activity_user ON activity_log(user_id);
CREATE INDEX idx_activity_tenant ON activity_log(institution_id);

-- Insert default institution
INSERT INTO institutions (id, name, code, plan, max_users)
VALUES ('default', 'GTU Diploma', 'GTU', 'enterprise', 100000)
ON CONFLICT (code) DO NOTHING;
