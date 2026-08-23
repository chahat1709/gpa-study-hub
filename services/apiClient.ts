/**
 * API Client — GPA Study Hub
 *
 * Architecture:
 *  - Backend (Express + SQLite) runs on college PC in server room
 *  - Cloudflare Tunnel exposes server to internet (free, secure)
 *  - App connects via tunnel URL — works from any network
 *
 * Setup:
 *  1. College PC runs server + cloudflare tunnel
 *  2. Tunnel shows a public URL (e.g., https://xyz.trycloudflare.com)
 *  3. Set that URL in VITE_API_URL env, OR
 *  4. Students open app → auto-detects server on local network
 */

const API_URL_KEY = 'GPA_HUB_API_URL';
const AUTH_TOKEN_KEY = 'GPA_HUB_AUTH_TOKEN';
const DEFAULT_API_URL = import.meta.env.VITE_API_URL || '';

// ── Token Management ───────────────────────────────────────────────────────────
export function getAuthToken(): string | null {
  return localStorage.getItem(AUTH_TOKEN_KEY);
}

export function setAuthToken(token: string): void {
  localStorage.setItem(AUTH_TOKEN_KEY, token);
}

export function clearAuthToken(): void {
  localStorage.removeItem(AUTH_TOKEN_KEY);
}

// ── Server URL ─────────────────────────────────────────────────────────────────
function getServerUrl(): string {
  const stored = localStorage.getItem(API_URL_KEY);
  if (stored) return stored;
  return DEFAULT_API_URL;
}

export function getApiUrl(): string {
  return getServerUrl();
}

export function setApiUrl(url: string): void {
  const cleaned = url.replace(/\/$/, '');
  try {
    const parsed = new URL(cleaned);
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      if (import.meta.env.DEV) console.warn('Invalid API URL protocol');
      return;
    }
  } catch {
    if (!cleaned.startsWith('http') && !cleaned.match(/^[\d.]+$/)) {
      if (import.meta.env.DEV) console.warn('Invalid API URL format');
      return;
    }
  }
  localStorage.setItem(API_URL_KEY, cleaned);
}

export function clearApiUrl(): void {
  localStorage.removeItem(API_URL_KEY);
}

// ── Core API Fetch ─────────────────────────────────────────────────────────────
async function api<T = unknown>(path: string, options: RequestInit = {}): Promise<T> {
  const baseUrl = getServerUrl();

  if (!baseUrl) {
    const localUrl = await autoDetectServer();
    if (!localUrl) {
      throw new Error(
        'Cannot find GPA Study Hub server. Make sure your college server is running.'
      );
    }
    return apiFetch<T>(localUrl + path, options);
  }

  return apiFetch<T>(baseUrl + path, options);
}

async function apiFetch<T = unknown>(url: string, options: RequestInit = {}): Promise<T> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);
  const token = getAuthToken();

  try {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...((options.headers as Record<string, string>) || {}),
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const res = await fetch(url, {
      ...options,
      signal: controller.signal,
      headers,
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || `Server error (${res.status})`);
    }
    return data as T;
  } finally {
    clearTimeout(timeout);
  }
}

// ── Auto-detect server on local network ────────────────────────────────────────
async function autoDetectServer(): Promise<string | null> {
  const commonHosts = [
    window.location.hostname,
    '192.168.1.1',
    '192.168.0.1',
    '10.0.0.1',
    '10.10.1.1',
    '172.16.0.1',
  ].filter(Boolean);

  for (const host of commonHosts) {
    try {
      const res = await fetch(`http://${host}:3000/api/health`, {
        method: 'GET',
        signal: AbortSignal.timeout(3000),
      });
      if (res.ok) {
        const url = `http://${host}:3000`;
        localStorage.setItem(API_URL_KEY, url);
        return url;
      }
    } catch {
      /* try next */
    }
  }
  return null;
}

// ── Health ─────────────────────────────────────────────────────────────────────
export async function checkServerHealth(): Promise<boolean> {
  try {
    const data = await api<{ status: string }>('/api/health');
    return data.status === 'ok';
  } catch {
    return false;
  }
}

// ── Auth ───────────────────────────────────────────────────────────────────────
export interface ApiUser {
  id: string;
  name: string;
  enrollment_number?: string;
  role: string;
  branch: string;
  semester: string;
  section: string;
  university?: string;
  photo_url?: string;
  email?: string;
}

interface AuthResponse {
  success: boolean;
  user: ApiUser;
  token?: string;
}

export async function signup(data: {
  name: string;
  enrollmentNumber: string;
  pin: string;
  branch: string;
  semester: string;
  section: string;
  university?: string;
}): Promise<AuthResponse> {
  const res = await api<AuthResponse>('/api/auth/signup', {
    method: 'POST',
    body: JSON.stringify(data),
  });
  if (res.token) setAuthToken(res.token);
  return res;
}

export async function login(enrollmentNumber: string, pin: string): Promise<AuthResponse> {
  const res = await api<AuthResponse>('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ enrollmentNumber, pin }),
  });
  if (res.token) setAuthToken(res.token);
  return res;
}

export async function forgotPin(
  enrollmentNumber: string,
  newPin: string
): Promise<{ message: string }> {
  return api('/api/auth/forgot-pin', {
    method: 'POST',
    body: JSON.stringify({ enrollmentNumber, newPin }),
  });
}

export async function changePin(
  userId: string,
  oldPin: string,
  newPin: string
): Promise<{ message: string }> {
  return api('/api/auth/change-pin', {
    method: 'POST',
    body: JSON.stringify({ userId, oldPin, newPin }),
  });
}

export async function facultyLogin(email: string, password: string): Promise<AuthResponse> {
  const res = await api<AuthResponse>('/api/auth/faculty-login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
  if (res.token) setAuthToken(res.token);
  return res;
}

export async function facultySignup(data: {
  name: string;
  email: string;
  password: string;
  branch: string;
}): Promise<AuthResponse> {
  const res = await api<AuthResponse>('/api/auth/faculty-signup', {
    method: 'POST',
    body: JSON.stringify(data),
  });
  if (res.token) setAuthToken(res.token);
  return res;
}

export async function adminLogin(code: string): Promise<AuthResponse> {
  const res = await api<AuthResponse>('/api/auth/admin-login', {
    method: 'POST',
    body: JSON.stringify({ code }),
  });
  if (res.token) setAuthToken(res.token);
  return res;
}

export async function updateProfile(userId: string, photoUrl: string): Promise<{ user: ApiUser }> {
  return api(`/api/auth/profile/${userId}`, {
    method: 'PUT',
    body: JSON.stringify({ photo_url: photoUrl }),
  });
}

// ── Attendance ─────────────────────────────────────────────────────────────────
export interface AttendanceRecord {
  id: string;
  user_id: string;
  subject: string;
  date: string;
  status: string;
  slot_id: string;
}

export interface AttendanceStats {
  overall: number;
  totalClasses: number;
  attendedClasses: number;
  subjectWise: { subject: string; percentage: number; attended: number; total: number }[];
}

export async function getAttendance(userId: string): Promise<{ records: AttendanceRecord[] }> {
  return api(`/api/attendance/${userId}`);
}

export async function markAttendance(
  userId: string,
  subject: string,
  date: string,
  status: string,
  slotId?: string
): Promise<{ id: string }> {
  return api('/api/attendance', {
    method: 'POST',
    body: JSON.stringify({ userId, subject, date, status, slotId }),
  });
}

export async function getAttendanceStats(userId: string): Promise<AttendanceStats> {
  return api(`/api/attendance/stats/${userId}`);
}

// ── Timetable ─────────────────────────────────────────────────────────────────
export interface TimeSlot {
  id: string;
  branch: string;
  semester: string;
  day: string;
  slot_index: number;
  subject: string;
  type: string;
  start_time: string;
  end_time: string;
  faculty_name: string;
  batch: string;
}

export async function getTimetable(
  branch: string,
  semester: string,
  day: string
): Promise<{ slots: TimeSlot[] }> {
  return api(`/api/timetable/${branch}/${semester}/${day}`);
}

export async function addTimetableSlot(data: Omit<TimeSlot, 'id'>): Promise<{ id: string }> {
  return api('/api/timetable', { method: 'POST', body: JSON.stringify(data) });
}

// ── Tasks ─────────────────────────────────────────────────────────────────────
export interface Task {
  id: string;
  user_id: string;
  title: string;
  description: string;
  due_date: string;
  completed: number;
  category: string;
  created_at: string;
}

export async function getTasks(userId: string): Promise<{ tasks: Task[] }> {
  return api(`/api/tasks/${userId}`);
}

export async function addTask(data: {
  userId: string;
  title: string;
  description?: string;
  dueDate?: string;
  category?: string;
}): Promise<{ id: string }> {
  return api('/api/tasks', { method: 'POST', body: JSON.stringify(data) });
}

export async function updateTask(id: string, completed: boolean): Promise<{ success: boolean }> {
  return api(`/api/tasks/${id}`, { method: 'PUT', body: JSON.stringify({ completed }) });
}

export async function deleteTask(id: string): Promise<{ success: boolean }> {
  return api(`/api/tasks/${id}`, { method: 'DELETE' });
}

// ── Resources ─────────────────────────────────────────────────────────────────
export interface Resource {
  id: string;
  title: string;
  description: string;
  url: string;
  type: string;
  branch: string;
  semester: string;
  subject: string;
  uploaded_by: string;
  created_at: string;
}

export async function getResources(
  branch?: string,
  semester?: string
): Promise<{ resources: Resource[] }> {
  const params = new URLSearchParams();
  if (branch) params.set('branch', branch);
  if (semester) params.set('semester', semester);
  const qs = params.toString();
  return api(`/api/resources${qs ? '?' + qs : ''}`);
}

export async function addResource(
  data: Omit<Resource, 'id' | 'created_at'>
): Promise<{ id: string }> {
  return api('/api/resources', { method: 'POST', body: JSON.stringify(data) });
}

// ── Notices ───────────────────────────────────────────────────────────────────
export interface Notice {
  id: string;
  title: string;
  content: string;
  author: string;
  category: string;
  priority: string;
  branch: string;
  date: string;
}

export async function getNotices(): Promise<{ notices: Notice[] }> {
  return api('/api/notices');
}

export async function addNotice(data: {
  title: string;
  content: string;
  author?: string;
  category?: string;
  priority?: string;
  branch?: string;
}): Promise<{ id: string }> {
  return api('/api/notices', { method: 'POST', body: JSON.stringify(data) });
}

// ── Chat ───────────────────────────────────────────────────────────────────────
export interface Chat {
  id: string;
  participants: string;
  is_group: number;
  group_name: string;
  last_message: string;
  last_timestamp: string;
}

export interface Message {
  id: string;
  chat_id: string;
  sender_id: string;
  sender_name: string;
  content: string;
  is_encrypted: number;
  timestamp: string;
}

export async function getChats(userId: string): Promise<{ chats: Chat[] }> {
  return api(`/api/chats/${userId}`);
}

export async function createChat(
  participants: string[],
  isGroup?: boolean,
  groupName?: string
): Promise<{ id: string }> {
  return api('/api/chats', {
    method: 'POST',
    body: JSON.stringify({ participants, isGroup, groupName }),
  });
}

export async function getMessages(chatId: string): Promise<{ messages: Message[] }> {
  return api(`/api/messages/${chatId}`);
}

export async function sendMessage(
  chatId: string,
  senderId: string,
  senderName: string,
  content: string,
  isEncrypted?: boolean
): Promise<{ id: string }> {
  return api('/api/messages', {
    method: 'POST',
    body: JSON.stringify({ chatId, senderId, senderName, content, isEncrypted }),
  });
}

export async function searchUsers(query: string): Promise<{ users: ApiUser[] }> {
  return api(`/api/users/search?q=${encodeURIComponent(query)}`);
}

// ── Exams ──────────────────────────────────────────────────────────────────────
export interface Exam {
  id: string;
  title: string;
  branch: string;
  semester: string;
  subject: string;
  questions: any[];
  duration: number;
  total_marks: number;
  created_at: string;
}

export async function getExams(branch?: string, semester?: string): Promise<{ exams: Exam[] }> {
  const params = new URLSearchParams();
  if (branch) params.set('branch', branch);
  if (semester) params.set('semester', semester);
  const qs = params.toString();
  return api(`/api/exams${qs ? '?' + qs : ''}`);
}

export async function getExam(id: string): Promise<{ exam: Exam }> {
  return api(`/api/exams/${id}`);
}

export async function createExam(data: {
  title: string;
  branch?: string;
  semester?: string;
  subject?: string;
  questions?: any[];
  duration?: number;
  totalMarks?: number;
}): Promise<{ id: string }> {
  return api('/api/exams', { method: 'POST', body: JSON.stringify(data) });
}

export async function submitExam(
  examId: string,
  userId: string,
  score: number,
  total: number,
  answers: Record<string, any>
): Promise<{ resultId: string }> {
  return api(`/api/exams/${examId}/submit`, {
    method: 'POST',
    body: JSON.stringify({ userId, score, total, answers }),
  });
}

// ── Faculty ────────────────────────────────────────────────────────────────────
export async function getFaculty(branch?: string): Promise<{ faculty: any[] }> {
  const params = new URLSearchParams();
  if (branch) params.set('branch', branch);
  const qs = params.toString();
  return api(`/api/faculty${qs ? '?' + qs : ''}`);
}

// ── File Upload ────────────────────────────────────────────────────────────────
export async function uploadFile(file: File): Promise<{ url: string; filename: string }> {
  const formData = new FormData();
  formData.append('file', file);
  const baseUrl = getServerUrl() || (await autoDetectServer()) || '';
  const token = getAuthToken();
  const headers: Record<string, string> = {};
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const res = await fetch(`${baseUrl}/api/upload`, {
    method: 'POST',
    body: formData,
    headers,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Upload failed');
  return data;
}

// ── Settings ───────────────────────────────────────────────────────────────────
export async function getSetting(key: string): Promise<{ value: string | null }> {
  return api(`/api/settings/${key}`);
}

export async function setSetting(key: string, value: string): Promise<{ success: boolean }> {
  return api('/api/settings', { method: 'POST', body: JSON.stringify({ key, value }) });
}

// ── Academic Content (GTU 2024-25 syllabus, questions, notes, labs) ─────────────
export interface AcademicSubject {
  id: string;
  code: string;
  name: string;
  branch: string;
  semester: number;
  credits: number;
  is_lab: number;
}

export interface AcademicUnit {
  id: string;
  subject_id: string;
  unit_number: number;
  title: string;
  topics: string;
  weightage: number;
}

export interface SyllabusTopic {
  id: string;
  unit_id: string;
  topic: string;
  subtopics: string;
  learning_outcomes: string;
  bloom_level: string;
  hours_allocated: number;
}

export interface AcademicQuestion {
  id: string;
  subject_id: string;
  unit_id: string;
  question_text: string;
  question_type: string;
  options: string | null;
  correct_answer: string;
  explanation: string;
  marks: number;
  difficulty: string;
  bloom_level: string;
  co_code: string;
  source: string;
}

export interface Pyq {
  id: string;
  subject_id: string;
  year: number;
  semester: string;
  exam_type: string;
  question_number: number;
  question_text: string;
  question_type: string;
  options: string | null;
  correct_answer: string;
  solution: string;
  marks: number;
  unit_id: string;
  co_code: string;
}

export interface AcademicNote {
  id: string;
  subject_id: string;
  unit_id: string;
  title: string;
  content: string;
  content_type: string;
  tags: string;
  is_verified: number;
}

export interface LabExperiment {
  id: string;
  subject_id: string;
  experiment_number: number;
  title: string;
  aim: string;
  apparatus: string;
  theory: string;
  procedure: string;
  observations: string;
  calculations: string;
  result: string;
  viva_questions: string;
  precautions: string;
  reference_material: string;
}

export interface AcademicProject {
  id: string;
  subject_id: string;
  branch: string;
  semester: number;
  title: string;
  type: string;
  description: string;
  objectives: string;
  technologies: string;
  prerequisites: string;
  timeline_weeks: number;
  deliverables: string;
  difficulty: string;
}

export async function getAcademicMeta(): Promise<{
  branches: string[];
  semesters: string[];
  updated_at: string | null;
}> {
  return api('/api/academic/meta');
}

export async function getAcademicSubjects(
  branch?: string,
  semester?: string
): Promise<{ subjects: AcademicSubject[] }> {
  const params = new URLSearchParams();
  if (branch) params.set('branch', branch);
  if (semester) params.set('semester', semester);
  const qs = params.toString();
  return api(`/api/academic/subjects${qs ? '?' + qs : ''}`);
}

export async function getAcademicSubjectDetail(
  id: string
): Promise<{ subject: AcademicSubject; units: AcademicUnit[] }> {
  return api(`/api/academic/subjects/${id}`);
}

export async function getAcademicUnit(
  id: string
): Promise<{ unit: AcademicUnit; topics: SyllabusTopic[] }> {
  return api(`/api/academic/units/${id}`);
}

export async function getAcademicQuestions(
  opts: {
    subjectId?: string;
    unitId?: string;
    type?: string;
    difficulty?: string;
    limit?: number;
  } = {}
): Promise<{ questions: AcademicQuestion[] }> {
  const params = new URLSearchParams();
  if (opts.subjectId) params.set('subjectId', opts.subjectId);
  if (opts.unitId) params.set('unitId', opts.unitId);
  if (opts.type) params.set('type', opts.type);
  if (opts.difficulty) params.set('difficulty', opts.difficulty);
  if (opts.limit) params.set('limit', String(opts.limit));
  const qs = params.toString();
  return api(`/api/academic/questions${qs ? '?' + qs : ''}`);
}

export async function getAcademicPyqs(
  opts: { subjectId?: string; year?: number; examType?: string } = {}
): Promise<{ pyqs: Pyq[] }> {
  const params = new URLSearchParams();
  if (opts.subjectId) params.set('subjectId', opts.subjectId);
  if (opts.year) params.set('year', String(opts.year));
  if (opts.examType) params.set('examType', opts.examType);
  const qs = params.toString();
  return api(`/api/academic/pyqs${qs ? '?' + qs : ''}`);
}

export async function getAcademicNotes(
  opts: { subjectId?: string; unitId?: string; contentType?: string } = {}
): Promise<{ notes: AcademicNote[] }> {
  const params = new URLSearchParams();
  if (opts.subjectId) params.set('subjectId', opts.subjectId);
  if (opts.unitId) params.set('unitId', opts.unitId);
  if (opts.contentType) params.set('contentType', opts.contentType);
  const qs = params.toString();
  return api(`/api/academic/notes${qs ? '?' + qs : ''}`);
}

export async function getAcademicLabs(subjectId?: string): Promise<{ labs: LabExperiment[] }> {
  const qs = subjectId ? `?subjectId=${encodeURIComponent(subjectId)}` : '';
  return api(`/api/academic/labs${qs}`);
}

export async function getAcademicProjects(
  branch?: string,
  semester?: string
): Promise<{ projects: AcademicProject[] }> {
  const params = new URLSearchParams();
  if (branch) params.set('branch', branch);
  if (semester) params.set('semester', semester);
  const qs = params.toString();
  return api(`/api/academic/projects${qs ? '?' + qs : ''}`);
}

export async function getAcademicDashboard(
  branch?: string,
  semester?: string
): Promise<{
  subjects: number;
  units: number;
  questions: number;
  pyqs: number;
  notes: number;
  labs: number;
  projects: number;
}> {
  const params = new URLSearchParams();
  if (branch) params.set('branch', branch);
  if (semester) params.set('semester', semester);
  const qs = params.toString();
  return api(`/api/academic/dashboard${qs ? '?' + qs : ''}`);
}

// ── Legacy compatibility ───────────────────────────────────────────────────────
export function getStoredServerIp(): string {
  return getApiUrl();
}

export function setServerIp(url: string): void {
  setApiUrl(url);
}
