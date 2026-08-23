/**
 * RBAC Auth Service — GPA Study Hub
 * Role-Based Access Control using Web Crypto API (no external deps, 100% offline)
 *
 * Roles:
 *  STUDENT    — view own data, study tools, exams, library
 *  FACULTY    — manage attendance, upload resources, post notices, view all students
 *  GTU_ADMIN  — full access: user management, system config, all faculty + student data
 */

import { User, UserRole } from '../types';
import { checkRateLimit, recordFailedAttempt, clearRateLimit } from '../utils/rateLimit';

// ─── Permission Matrix ─────────────────────────────────────────────────────────
export const PERMISSIONS = {
  // Exam & Study
  VIEW_EXAMS: ['STUDENT', 'FACULTY', 'GTU_ADMIN'],
  VIEW_LIBRARY: ['STUDENT', 'FACULTY', 'GTU_ADMIN'],
  UPLOAD_RESOURCES: ['FACULTY', 'GTU_ADMIN'],
  DELETE_RESOURCES: ['GTU_ADMIN'],

  // Attendance
  MARK_ATTENDANCE: ['FACULTY', 'GTU_ADMIN'],
  VIEW_OWN_ATTENDANCE: ['STUDENT', 'FACULTY', 'GTU_ADMIN'],
  VIEW_ALL_ATTENDANCE: ['FACULTY', 'GTU_ADMIN'],
  EDIT_ATTENDANCE: ['FACULTY', 'GTU_ADMIN'],

  // Notices
  POST_NOTICE: ['FACULTY', 'GTU_ADMIN'],
  VIEW_NOTICE: ['STUDENT', 'FACULTY', 'GTU_ADMIN'],

  // Social
  USE_SOCIAL: ['STUDENT', 'FACULTY', 'GTU_ADMIN'],
  MODERATE_SOCIAL: ['FACULTY', 'GTU_ADMIN'],

  // Admin
  VIEW_ADMIN_DASHBOARD: ['FACULTY', 'GTU_ADMIN'],
  MANAGE_USERS: ['GTU_ADMIN'],
  MANAGE_TIMETABLE: ['FACULTY', 'GTU_ADMIN'],
  VIEW_ALL_STUDENTS: ['FACULTY', 'GTU_ADMIN'],
  SYSTEM_CONFIG: ['GTU_ADMIN'],
} as const;

export type Permission = keyof typeof PERMISSIONS;

// ─── Stored User Record ────────────────────────────────────────────────────────
export interface StoredUser {
  id: string;
  name: string;
  role: UserRole;
  enrollmentNumber?: string;
  email?: string;
  branch?: string;
  semester?: string;
  section?: string;
  university: string;
  photoURL?: string;
  createdAt: number;
  lastLogin: number;
  passwordHash: string; // PBKDF2 hash hex
  passwordSalt: string; // Unique salt hex for this user
  isActive: boolean;
}

const DB_KEY = 'gpa_rbac_users_v1';
const SESSION_KEY = 'gpa_rbac_session_v1';

// ─── Crypto Helpers ────────────────────────────────────────────────────────────
// PBKDF2 with 600,000 iterations (OWASP 2023 recommendation) for password hashing
// Each user gets a unique salt stored alongside their password hash
const PBKDF2_ITERATIONS = 600000;

function generateSalt(): Uint8Array {
  return crypto.getRandomValues(new Uint8Array(16));
}

function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

function hexToBytes(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.substring(i, i + 2), 16);
  }
  return bytes;
}

async function hashPassword(
  password: string,
  salt?: Uint8Array
): Promise<{ hash: string; salt: string }> {
  const userSalt = salt || generateSalt();
  const encoder = new TextEncoder();
  const passwordData = encoder.encode(password);

  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    passwordData,
    { name: 'PBKDF2' },
    false,
    ['deriveBits']
  );

  const hashBits = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt: userSalt,
      iterations: PBKDF2_ITERATIONS,
      hash: 'SHA-256',
    },
    keyMaterial,
    256
  );

  return {
    hash: bytesToHex(new Uint8Array(hashBits)),
    salt: bytesToHex(userSalt),
  };
}

async function verifyPassword(
  password: string,
  storedHash: string,
  storedSalt: string
): Promise<boolean> {
  const salt = hexToBytes(storedSalt);
  const result = await hashPassword(password, salt);
  return result.hash === storedHash;
}

const LEGACY_SALT = 'gpa_hub_salt_2025';

/**
 * Verify password against stored hash, supporting both legacy SHA-256 and modern PBKDF2.
 * Returns { isValid, migratedHash?, migratedSalt? } — caller should persist migration if needed.
 */
async function verifyWithMigration(
  password: string,
  stored: StoredUser
): Promise<{ isValid: boolean; migratedHash?: string; migratedSalt?: string }> {
  if (stored.passwordSalt) {
    const isValid = await verifyPassword(password, stored.passwordHash, stored.passwordSalt);
    return { isValid };
  }
  // Legacy SHA-256 verification
  const encoder = new TextEncoder();
  const data = encoder.encode(password + LEGACY_SALT);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const legacyHash = bytesToHex(new Uint8Array(hashBuffer));
  const isValid = legacyHash === stored.passwordHash;
  // Migrate to PBKDF2 on success
  if (isValid) {
    const { hash, salt } = await hashPassword(password);
    return { isValid: true, migratedHash: hash, migratedSalt: salt };
  }
  return { isValid: false };
}

// ─── User Database (localStorage) ─────────────────────────────────────────────
function loadDB(): Record<string, StoredUser> {
  try {
    const raw = localStorage.getItem(DB_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveDB(db: Record<string, StoredUser>) {
  localStorage.setItem(DB_KEY, JSON.stringify(db));
}

// ─── Session ───────────────────────────────────────────────────────────────────
export function getSession(): User | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function saveSession(user: User) {
  localStorage.setItem(SESSION_KEY, JSON.stringify(user));
}

export function clearSession() {
  localStorage.removeItem(SESSION_KEY);
}

function storedToUser(s: StoredUser): User {
  return {
    id: s.id,
    name: s.name,
    role: s.role,
    enrollmentNumber: s.enrollmentNumber,
    email: s.email,
    branch: s.branch,
    semester: s.semester,
    section: s.section,
    university: s.university,
    photoURL: s.photoURL,
    createdAt: s.createdAt,
  };
}

// ─── Auth Operations ───────────────────────────────────────────────────────────

/**
 * Register a new student
 * PIN: 4-digit numeric
 */
export async function registerStudent(params: {
  name: string;
  enrollmentNumber: string;
  pin: string;
  branch: string;
  semester: string;
  section: string;
  university?: string;
}): Promise<User> {
  const db = loadDB();
  const id = `STU-${params.enrollmentNumber.toUpperCase()}`;

  if (db[id] && db[id].isActive) {
    throw new Error(
      `Enrollment number ${params.enrollmentNumber} is already registered. Please login with your PIN.`
    );
  }

  if (!/^\d{4}$/.test(params.pin)) {
    throw new Error('PIN must be exactly 4 digits.');
  }

  const { hash, salt } = await hashPassword(params.pin);
  const now = Date.now();

  const stored: StoredUser = {
    id,
    name: params.name,
    role: 'STUDENT',
    enrollmentNumber: params.enrollmentNumber.toUpperCase(),
    branch: params.branch,
    semester: params.semester,
    section: params.section,
    university: params.university || 'GTU',
    photoURL: `https://ui-avatars.com/api/?name=${encodeURIComponent(params.name)}&background=0d9488&color=fff&bold=true&size=128`,
    createdAt: now,
    lastLogin: now,
    passwordHash: hash,
    passwordSalt: salt,
    isActive: true,
  };

  db[id] = stored;
  saveDB(db);

  const user = storedToUser(stored);
  saveSession(user);
  return user;
}

/**
 * Student login: enrollmentNumber + PIN
 */
export async function loginStudent(enrollmentNumber: string, pin: string): Promise<User> {
  const rateLimitKey = `login_student_${enrollmentNumber.toUpperCase()}`;
  const rateCheck = checkRateLimit(rateLimitKey);

  if (!rateCheck.allowed) {
    throw new Error(
      `Too many failed attempts. Please try again in ${Math.ceil((rateCheck.retryAfter || 0) / 60)} minutes.`
    );
  }

  const db = loadDB();
  const id = `STU-${enrollmentNumber.toUpperCase()}`;
  const stored = db[id];

  if (!stored || !stored.isActive) {
    recordFailedAttempt(rateLimitKey);
    throw new Error('Account not found. Please register first.');
  }
  if (stored.role !== 'STUDENT') {
    recordFailedAttempt(rateLimitKey);
    throw new Error('Invalid credentials.');
  }

  const { isValid, migratedHash, migratedSalt } = await verifyWithMigration(pin, stored);

  if (!isValid) {
    recordFailedAttempt(rateLimitKey);
    const remaining = rateCheck.remainingAttempts - 1;
    if (remaining > 0) {
      throw new Error(`Wrong PIN. ${remaining} attempts remaining.`);
    } else {
      throw new Error('Wrong PIN. Account locked for 15 minutes due to too many failed attempts.');
    }
  }

  clearRateLimit(rateLimitKey);
  stored.lastLogin = Date.now();
  if (migratedHash && migratedSalt) {
    stored.passwordHash = migratedHash;
    stored.passwordSalt = migratedSalt;
  }
  db[id] = stored;
  saveDB(db);

  const user = storedToUser(stored);
  saveSession(user);
  return user;
}

/**
 * Register a new faculty
 */
export async function registerFacultyLocal(params: {
  name: string;
  email: string;
  password: string;
  branch: string;
  university?: string;
}): Promise<User> {
  const db = loadDB();
  const id = `FAC-${params.email.toLowerCase().replace(/[^a-z0-9]/g, '-')}`;

  if (db[id] && db[id].isActive) {
    throw new Error('Email already registered. Please login.');
  }

  if (params.password.length < 6) {
    throw new Error('Password must be at least 6 characters.');
  }

  const { hash, salt } = await hashPassword(params.password);
  const now = Date.now();

  const stored: StoredUser = {
    id,
    name: params.name,
    role: 'FACULTY',
    email: params.email.toLowerCase(),
    branch: params.branch,
    university: params.university || 'GTU',
    photoURL: `https://ui-avatars.com/api/?name=${encodeURIComponent(params.name)}&background=7c3aed&color=fff&bold=true&size=128`,
    createdAt: now,
    lastLogin: now,
    passwordHash: hash,
    passwordSalt: salt,
    isActive: true,
  };

  db[id] = stored;
  saveDB(db);

  const user = storedToUser(stored);
  saveSession(user);
  return user;
}

/**
 * Faculty login: email + password
 */
export async function loginFacultyLocal(email: string, password: string): Promise<User> {
  const rateLimitKey = `login_faculty_${email.toLowerCase()}`;
  const rateCheck = checkRateLimit(rateLimitKey);

  if (!rateCheck.allowed) {
    throw new Error(
      `Too many failed attempts. Please try again in ${Math.ceil((rateCheck.retryAfter || 0) / 60)} minutes.`
    );
  }

  const db = loadDB();

  // Find by email
  const stored = Object.values(db).find(
    u => u.email === email.toLowerCase() && u.role === 'FACULTY' && u.isActive
  );

  if (!stored) {
    recordFailedAttempt(rateLimitKey);
    throw new Error('Faculty account not found. Please register first.');
  }

  const { isValid, migratedHash, migratedSalt } = await verifyWithMigration(password, stored);

  if (!isValid) {
    recordFailedAttempt(rateLimitKey);
    const remaining = rateCheck.remainingAttempts - 1;
    if (remaining > 0) {
      throw new Error(`Wrong password. ${remaining} attempts remaining.`);
    } else {
      throw new Error(
        'Wrong password. Account locked for 15 minutes due to too many failed attempts.'
      );
    }
  }

  clearRateLimit(rateLimitKey);
  stored.lastLogin = Date.now();
  if (migratedHash && migratedSalt) {
    stored.passwordHash = migratedHash;
    stored.passwordSalt = migratedSalt;
  }
  db[stored.id] = stored;
  saveDB(db);

  const user = storedToUser(stored);
  saveSession(user);
  return user;
}

/**
 * GTU Admin login — single admin account seeded on first use
 * Default code from environment variable or fallback to GTU-ADMIN-2025 (user should change this)
 */
export async function loginAdmin(adminCode: string): Promise<User> {
  const rateLimitKey = 'login_admin';
  const rateCheck = checkRateLimit(rateLimitKey);

  if (!rateCheck.allowed) {
    throw new Error(
      `Too many failed attempts. Please try again in ${Math.ceil((rateCheck.retryAfter || 0) / 60)} minutes.`
    );
  }

  const db = loadDB();
  const ADMIN_ID = 'GTU-ADMIN-001';

  // Seed admin account on first run
  if (!db[ADMIN_ID]) {
    const defaultCode = import.meta.env.VITE_ADMIN_DEFAULT_CODE;
    if (!defaultCode) {
      throw new Error(
        'VITE_ADMIN_DEFAULT_CODE environment variable is required to initialize the admin account.'
      );
    }
    const { hash, salt } = await hashPassword(defaultCode);
    db[ADMIN_ID] = {
      id: ADMIN_ID,
      name: 'GTU Administrator',
      role: 'GTU_ADMIN',
      university: 'GTU',
      email: 'admin@gtu.ac.in',
      createdAt: Date.now(),
      lastLogin: Date.now(),
      passwordHash: hash,
      passwordSalt: salt,
      isActive: true,
    };
    saveDB(db);
  }

  const admin = db[ADMIN_ID];

  const { isValid, migratedHash, migratedSalt } = await verifyWithMigration(adminCode, admin);

  if (!isValid) {
    recordFailedAttempt(rateLimitKey);
    const remaining = rateCheck.remainingAttempts - 1;
    if (remaining > 0) {
      throw new Error(`Invalid admin code. ${remaining} attempts remaining.`);
    } else {
      throw new Error(
        'Invalid admin code. Account locked for 15 minutes due to too many failed attempts.'
      );
    }
  }

  clearRateLimit(rateLimitKey);
  admin.lastLogin = Date.now();
  if (migratedHash && migratedSalt) {
    admin.passwordHash = migratedHash;
    admin.passwordSalt = migratedSalt;
  }
  db[ADMIN_ID] = admin;
  saveDB(db);

  const user = storedToUser(admin);
  saveSession(user);
  return user;
}

/**
 * Change student PIN
 */
export async function changePin(
  enrollmentNumber: string,
  oldPin: string,
  newPin: string
): Promise<void> {
  const db = loadDB();
  const id = `STU-${enrollmentNumber.toUpperCase()}`;
  const stored = db[id];
  if (!stored) throw new Error('Account not found.');

  const { isValid, migratedHash, migratedSalt } = await verifyWithMigration(oldPin, stored);

  if (!isValid) throw new Error('Old PIN is incorrect.');
  if (!/^\d{4}$/.test(newPin)) throw new Error('New PIN must be 4 digits.');

  const { hash, salt } = await hashPassword(newPin);
  stored.passwordHash = hash;
  stored.passwordSalt = salt;
  db[id] = stored;
  saveDB(db);
}

/**
 * List all users (admin only)
 */
export function getAllUsers(): StoredUser[] {
  return Object.values(loadDB()).filter(u => u.isActive);
}

/**
 * Deactivate a user (admin only)
 */
export function deactivateUser(userId: string): void {
  const db = loadDB();
  if (db[userId]) {
    db[userId].isActive = false;
    saveDB(db);
  }
}

// ─── Permission Check ──────────────────────────────────────────────────────────
export function hasPermission(user: User | null, permission: Permission): boolean {
  if (!user) return false;
  return (PERMISSIONS[permission] as readonly string[]).includes(user.role);
}

export function requireRole(user: User | null, roles: UserRole[]): boolean {
  if (!user) return false;
  return roles.includes(user.role);
}
