
export enum AppMode {
  CAMPUS = 'CAMPUS',
  TUTOR = 'TUTOR',
  HOMEWORK = 'HOMEWORK',
  NOTES = 'NOTES',
  SOCIAL = 'SOCIAL',
  LIBRARY = 'LIBRARY',
  PLANNER = 'PLANNER',
  PROFILE = 'PROFILE',
  ATTENDANCE = 'ATTENDANCE',
  EXAM_HUB = 'EXAM_HUB'
}

export type UserRole = 'STUDENT' | 'FACULTY' | 'GTU_ADMIN';

export interface User {
  id: string;
  name: string;
  role: UserRole;
  phoneNumber?: string;
  enrollmentNumber?: string;
  collegeCode?: string;
  university: string;
  branch?: string;
  semester?: string;
  section?: string;
  email?: string;
  createdAt?: number;
  photoURL?: string;
  facultyShortCode?: string;
  batch?: string;
}

export interface SyllabusNode {
  subjectCode: string;
  subjectName: string;
  units: {
    id: string;
    name: string;
    weightage: number;
    isCovered: boolean;
  }[];
}

export interface Message {
  id: string;
  role: 'user' | 'model';
  content: string;
  timestamp: number;
  isLoading?: boolean;
}

export interface LibraryResource {
  id: string;
  title: string;
  type: 'pdf' | 'link' | 'video';
  size?: string;
  uploadDate: string;
  url: string;
  collegeCode: string;
  branch: string;
  semester: string;
  section: string;
  subject?: string;
  category?: string;

  // New Fields for Syllabus/Assignment tracking
  unit?: string;         // e.g., "Unit 1", "Module 3"
  academicYear?: string; // e.g., "Winter 2023" for Papers
  deadline?: string;     // For Assignments

  searchKeywords?: string[];
}

export interface Notice {
  id: string;
  title: string;
  content: string;
  date: number;
  priority: 'low' | 'medium' | 'high';
  author: string;
  category: string;
  scope: 'COLLEGE' | 'GTU_GLOBAL';
}

export interface Participant {
  id: string;
  name: string;
  avatar?: string;
}

export interface SocialMessage {
  id: string;
  senderId: string;
  senderName: string;
  content: string;
  timestamp: number;
  type: 'text' | 'image' | 'pdf';
  attachmentUrl?: string;
  isEncrypted?: boolean;
}

export interface ChatSession {
  id: string;
  participantIds: string[];
  participants: Participant[];
  lastMessage: string;
  lastTimestamp: number;
  isGroup: boolean;
  groupName?: string;
  groupDescription?: string;
  unreadCount: number;
  messages?: SocialMessage[];
  admins?: string[];
}

export interface Task {
  id: string;
  title: string;
  dueDate: string;
  priority: 'high' | 'medium' | 'low';
  completed: boolean;
  subject?: string;
}

export interface VisionState {
  image: File | null;
  imagePreview: string | null;
  prompt: string;
  result: string;
  isLoading: boolean;
}

export interface DirectoryContact {
  id: string;
  name: string;
  designation: string;
  department: string;
  email: string;
  phone: string;
  isEmergency?: boolean;
}

export interface TimeSlot {
  id: string;
  day: string; // "MON", "TUE", etc.
  startTime: string; // "10:30"
  endTime: string; // "11:30"
  subject: string; // "CYBER SEC"
  type: 'LECTURE' | 'PRACTICAL' | 'TUTORIAL' | 'RECESS';
  facultyName: string; // "JAC"
  room?: string;
  batch?: string; // "A1", "A2" or "ALL"
}

export interface AttendanceRecord {
  id: string;
  slotId: string;
  subject: string;
  date: string; // Format: YYYY-MM-DD
  presentStudentIds: string[];
  totalStudents: number;
  timestamp?: string; // ISO string or Firestore Timestamp
}

declare global {
  interface AIStudio {
    hasSelectedApiKey: () => Promise<boolean>;
    openSelectKey: () => Promise<void>;
  }
  interface Window {
    aistudio?: AIStudio;
  }
}

export type Subject = string;
export type Category = string;
