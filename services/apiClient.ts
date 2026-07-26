const SERVER_IP_KEY = 'GPA_HUB_SERVER_IP';
const SERVER_IP_DEFAULT = '192.168.1.1';
const SERVER_PORT = 3000;

function getServerUrl(): string {
  const ip = localStorage.getItem(SERVER_IP_KEY) || SERVER_IP_DEFAULT;
  return `http://${ip}:${SERVER_PORT}`;
}

export function getStoredServerIp(): string {
  return localStorage.getItem(SERVER_IP_KEY) || SERVER_IP_DEFAULT;
}

export function setServerIp(ip: string): void {
  localStorage.setItem(SERVER_IP_KEY, ip);
}

async function api<T = unknown>(path: string, options: RequestInit = {}): Promise<T> {
  const url = `${getServerUrl()}${path}`;
  const res = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'Server request failed');
  }
  return data as T;
}

export async function checkServerHealth(): Promise<boolean> {
  try {
    const data = await api<{ status: string }>('/api/health');
    return data.status === 'ok';
  } catch {
    return false;
  }
}

// ── Auth ────────────────────────────────────────────────────────────────────────
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

export async function signup(data: {
  name: string;
  enrollmentNumber: string;
  pin: string;
  branch: string;
  semester: string;
  section: string;
  university?: string;
}): Promise<{ user: ApiUser }> {
  return api('/api/auth/signup', { method: 'POST', body: JSON.stringify(data) });
}

export async function login(enrollmentNumber: string, pin: string): Promise<{ user: ApiUser }> {
  return api('/api/auth/login', { method: 'POST', body: JSON.stringify({ enrollmentNumber, pin }) });
}

export async function forgotPin(enrollmentNumber: string, newPin: string): Promise<{ message: string }> {
  return api('/api/auth/forgot-pin', { method: 'POST', body: JSON.stringify({ enrollmentNumber, newPin }) });
}

export async function changePin(userId: string, oldPin: string, newPin: string): Promise<{ message: string }> {
  return api('/api/auth/change-pin', { method: 'POST', body: JSON.stringify({ userId, oldPin, newPin }) });
}

export async function facultyLogin(email: string, password: string): Promise<{ user: ApiUser }> {
  return api('/api/auth/faculty-login', { method: 'POST', body: JSON.stringify({ email, password }) });
}

export async function facultySignup(data: {
  name: string;
  email: string;
  password: string;
  branch: string;
}): Promise<{ user: ApiUser }> {
  return api('/api/auth/faculty-signup', { method: 'POST', body: JSON.stringify(data) });
}

export async function adminLogin(code: string): Promise<{ user: ApiUser }> {
  return api('/api/auth/admin-login', { method: 'POST', body: JSON.stringify({ code }) });
}

export async function updateProfile(userId: string, photoUrl: string): Promise<{ user: ApiUser }> {
  return api(`/api/auth/profile/${userId}`, { method: 'PUT', body: JSON.stringify({ photo_url: photoUrl }) });
}

// ── Attendance ──────────────────────────────────────────────────────────────────
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

export async function markAttendance(userId: string, subject: string, date: string, status: string, slotId?: string): Promise<{ id: string }> {
  return api('/api/attendance', { method: 'POST', body: JSON.stringify({ userId, subject, date, status, slotId }) });
}

export async function getAttendanceStats(userId: string): Promise<AttendanceStats> {
  return api(`/api/attendance/stats/${userId}`);
}

// ── Timetable ──────────────────────────────────────────────────────────────────
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

export async function getTimetable(branch: string, semester: string, day: string): Promise<{ slots: TimeSlot[] }> {
  return api(`/api/timetable/${branch}/${semester}/${day}`);
}

export async function addTimetableSlot(data: Omit<TimeSlot, 'id'>): Promise<{ id: string }> {
  return api('/api/timetable', { method: 'POST', body: JSON.stringify(data) });
}

// ── Tasks ──────────────────────────────────────────────────────────────────────
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

export async function addTask(data: { userId: string; title: string; description?: string; dueDate?: string; category?: string }): Promise<{ id: string }> {
  return api('/api/tasks', { method: 'POST', body: JSON.stringify(data) });
}

export async function updateTask(id: string, completed: boolean): Promise<{ success: boolean }> {
  return api(`/api/tasks/${id}`, { method: 'PUT', body: JSON.stringify({ completed }) });
}

export async function deleteTask(id: string): Promise<{ success: boolean }> {
  return api(`/api/tasks/${id}`, { method: 'DELETE' });
}

// ── Resources ──────────────────────────────────────────────────────────────────
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

export async function getResources(branch?: string, semester?: string): Promise<{ resources: Resource[] }> {
  const params = new URLSearchParams();
  if (branch) params.set('branch', branch);
  if (semester) params.set('semester', semester);
  const qs = params.toString();
  return api(`/api/resources${qs ? '?' + qs : ''}`);
}

export async function addResource(data: Omit<Resource, 'id' | 'created_at'>): Promise<{ id: string }> {
  return api('/api/resources', { method: 'POST', body: JSON.stringify(data) });
}

// ── Notices ────────────────────────────────────────────────────────────────────
export interface Notice {
  id: string;
  title: string;
  content: string;
  author: string;
  category: string;
  priority: string;
  branch: string;
  date: string;
  created_at: string;
}

export async function getNotices(): Promise<{ notices: Notice[] }> {
  return api('/api/notices');
}

export async function addNotice(data: Omit<Notice, 'id' | 'date' | 'created_at'>): Promise<{ id: string }> {
  return api('/api/notices', { method: 'POST', body: JSON.stringify(data) });
}

// ── Chats ──────────────────────────────────────────────────────────────────────
export interface Chat {
  id: string;
  participants: string;
  is_group: number;
  group_name: string;
  last_message: string;
  last_timestamp: string;
  created_at: string;
}

export interface ChatMessage {
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

export async function createChat(participants: string[], isGroup?: boolean, groupName?: string): Promise<{ id: string }> {
  return api('/api/chats', { method: 'POST', body: JSON.stringify({ participants, isGroup, groupName }) });
}

export async function getMessages(chatId: string): Promise<{ messages: ChatMessage[] }> {
  return api(`/api/messages/${chatId}`);
}

export async function sendMessage(chatId: string, senderId: string, senderName: string, content: string, isEncrypted?: boolean): Promise<{ id: string }> {
  return api('/api/messages', { method: 'POST', body: JSON.stringify({ chatId, senderId, senderName, content, isEncrypted }) });
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
  questions: { id: string; text: string; options: string[]; correctIndex: number }[];
  duration: number;
  total_marks: number;
  created_at: string;
}

export async function getExams(branch?: string, semester?: string): Promise<{ exams: Omit<Exam, 'questions'>[] }> {
  const params = new URLSearchParams();
  if (branch) params.set('branch', branch);
  if (semester) params.set('semester', semester);
  const qs = params.toString();
  return api(`/api/exams${qs ? '?' + qs : ''}`);
}

export async function getExam(id: string): Promise<{ exam: Exam }> {
  return api(`/api/exams/${id}`);
}

export async function submitExam(examId: string, userId: string, score: number, total: number, answers: Record<string, number>): Promise<{ resultId: string }> {
  return api(`/api/exams/${examId}/submit`, { method: 'POST', body: JSON.stringify({ userId, score, total, answers }) });
}

// ── Faculty ────────────────────────────────────────────────────────────────────
export interface Faculty {
  id: string;
  name: string;
  designation: string;
  department: string;
  email: string;
  phone: string;
  branch: string;
}

export async function getFaculty(branch?: string): Promise<{ faculty: Faculty[] }> {
  const qs = branch ? `?branch=${branch}` : '';
  return api(`/api/faculty${qs}`);
}

// ── File Upload ────────────────────────────────────────────────────────────────
export async function uploadFile(file: File): Promise<{ url: string; filename: string }> {
  const formData = new FormData();
  formData.append('file', file);
  const res = await fetch(`${getServerUrl()}/api/upload`, { method: 'POST', body: formData });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Upload failed');
  return data;
}
