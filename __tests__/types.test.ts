import { describe, it, expect, expectTypeOf } from 'vitest';
import type {
  User,
  UserRole,
  TimeSlot,
  AttendanceRecord,
  LibraryResource,
  Notice,
  Task,
  Message,
  SocialMessage,
  ChatSession,
  DirectoryContact,
  SyllabusNode,
  VisionState,
  Participant,
  Subject,
  Category,
} from '../types';
import { AppMode } from '../types';

describe('Core Types', () => {
  describe('User', () => {
    it('should have correct shape', () => {
      const user: User = {
        id: 'STU-12345',
        name: 'Test Student',
        role: 'STUDENT',
        university: 'GTU',
      };
      expect(user.id).toBe('STU-12345');
      expect(user.role).toBe('STUDENT');
    });

    it('should accept all valid roles', () => {
      const roles: UserRole[] = ['STUDENT', 'FACULTY', 'GTU_ADMIN'];
      expect(roles).toHaveLength(3);
      expect(roles).toContain('STUDENT');
      expect(roles).toContain('FACULTY');
      expect(roles).toContain('GTU_ADMIN');
    });

    it('should allow optional fields', () => {
      const user: User = {
        id: 'FAC-001',
        name: 'Prof. Smith',
        role: 'FACULTY',
        university: 'GTU',
        email: 'smith@gtu.edu',
        branch: 'CSE',
        semester: '4',
        section: 'A',
        createdAt: Date.now(),
        photoURL: 'https://example.com/photo.jpg',
        enrollmentNumber: undefined,
        batch: undefined,
      };
      expect(user.email).toBe('smith@gtu.edu');
      expect(user.photoURL).toBe('https://example.com/photo.jpg');
    });

    it('UserRole should only accept string literals', () => {
      expectTypeOf<UserRole>().toEqualTypeOf<'STUDENT' | 'FACULTY' | 'GTU_ADMIN'>();
    });
  });

  describe('TimeSlot', () => {
    it('should have correct shape', () => {
      const slot: TimeSlot = {
        id: 'MON-1030-CYBER',
        day: 'MON',
        startTime: '10:30',
        endTime: '11:30',
        subject: 'CYBER SEC',
        type: 'LECTURE',
        facultyName: 'JAC',
      };
      expect(slot.id).toBe('MON-1030-CYBER');
      expect(slot.type).toBe('LECTURE');
    });

    it('should only allow valid slot types', () => {
      const validTypes: TimeSlot['type'][] = ['LECTURE', 'PRACTICAL', 'TUTORIAL', 'RECESS'];
      expect(validTypes).toHaveLength(4);
    });

    it('should allow optional room and batch', () => {
      const slot: TimeSlot = {
        id: 'TUE-1400-DBMS',
        day: 'TUE',
        startTime: '14:00',
        endTime: '16:00',
        subject: 'DBMS LAB',
        type: 'PRACTICAL',
        facultyName: 'CKP',
        room: 'Lab-3',
        batch: 'A1',
      };
      expect(slot.room).toBe('Lab-3');
      expect(slot.batch).toBe('A1');
    });
  });

  describe('AttendanceRecord', () => {
    it('should have correct shape', () => {
      const record: AttendanceRecord = {
        id: 'slot-001-2025-01-15',
        slotId: 'MON-1030-CYBER',
        subject: 'CYBER SEC',
        date: '2025-01-15',
        presentStudentIds: ['STU-001', 'STU-002'],
        totalStudents: 40,
      };
      expect(record.presentStudentIds).toHaveLength(2);
      expect(record.totalStudents).toBe(40);
    });

    it('should allow optional timestamp', () => {
      const record: AttendanceRecord = {
        id: 'rec-001',
        slotId: 'slot-001',
        subject: 'DBMS',
        date: '2025-01-15',
        presentStudentIds: [],
        totalStudents: 0,
        timestamp: '2025-01-15T10:30:00.000Z',
      };
      expect(record.timestamp).toBe('2025-01-15T10:30:00.000Z');
    });
  });

  describe('LibraryResource', () => {
    it('should have correct shape', () => {
      const resource: LibraryResource = {
        id: 'res-001',
        title: 'Unit 1 Notes.pdf',
        type: 'pdf',
        size: '2.5 MB',
        uploadDate: '01/15/2025',
        url: 'https://storage.example.com/res-001',
        collegeCode: 'GTU-028',
        branch: 'CSE',
        semester: '4',
        section: 'A',
        subject: 'CYBER SEC',
        category: 'Lecture Notes',
      };
      expect(resource.type).toBe('pdf');
    });

    it('should only allow valid resource types', () => {
      const validTypes: LibraryResource['type'][] = ['pdf', 'link', 'video'];
      expect(validTypes).toHaveLength(3);
    });

    it('should allow optional fields', () => {
      const resource: LibraryResource = {
        id: 'res-002',
        title: 'Assignment 1',
        type: 'link',
        uploadDate: '01/15/2025',
        url: 'https://example.com',
        collegeCode: 'GTU-028',
        branch: 'CSE',
        semester: '4',
        section: 'A',
        unit: 'Unit 2',
        academicYear: 'Winter 2025',
        deadline: '2025-02-01',
        searchKeywords: ['assignment', 'unit 2'],
      };
      expect(resource.unit).toBe('Unit 2');
      expect(resource.deadline).toBe('2025-02-01');
    });
  });

  describe('Notice', () => {
    it('should have correct shape', () => {
      const notice: Notice = {
        id: 'n-001',
        title: 'Exam Schedule',
        content: 'Mid-terms start next week',
        date: Date.now(),
        priority: 'high',
        author: 'Admin',
        category: 'Academic',
        scope: 'COLLEGE',
      };
      expect(notice.priority).toBe('high');
      expect(notice.scope).toBe('COLLEGE');
    });

    it('should only allow valid priorities', () => {
      const validPriorities: Notice['priority'][] = ['low', 'medium', 'high'];
      expect(validPriorities).toHaveLength(3);
    });

    it('should only allow valid scopes', () => {
      const validScopes: Notice['scope'][] = ['COLLEGE', 'GTU_GLOBAL'];
      expect(validScopes).toHaveLength(2);
    });
  });

  describe('Task', () => {
    it('should have correct shape', () => {
      const task: Task = {
        id: 't-001',
        title: 'Submit assignment',
        dueDate: '2025-02-01',
        priority: 'high',
        completed: false,
        subject: 'DBMS',
      };
      expect(task.completed).toBe(false);
      expect(task.subject).toBe('DBMS');
    });

    it('should only allow valid priorities', () => {
      const validPriorities: Task['priority'][] = ['high', 'medium', 'low'];
      expect(validPriorities).toHaveLength(3);
    });
  });

  describe('SocialMessage', () => {
    it('should have correct shape', () => {
      const msg: SocialMessage = {
        id: 'm-001',
        senderId: 'STU-001',
        senderName: 'Alice',
        content: 'Hello!',
        timestamp: Date.now(),
        type: 'text',
      };
      expect(msg.type).toBe('text');
    });

    it('should only allow valid message types', () => {
      const validTypes: SocialMessage['type'][] = ['text', 'image', 'pdf'];
      expect(validTypes).toHaveLength(3);
    });
  });

  describe('ChatSession', () => {
    it('should have correct shape', () => {
      const session: ChatSession = {
        id: 'cs-001',
        participantIds: ['STU-001', 'STU-002'],
        participants: [
          { id: 'STU-001', name: 'Alice' },
          { id: 'STU-002', name: 'Bob' },
        ],
        lastMessage: 'See you!',
        lastTimestamp: Date.now(),
        isGroup: false,
        unreadCount: 2,
      };
      expect(session.isGroup).toBe(false);
      expect(session.participants).toHaveLength(2);
    });
  });

  describe('DirectoryContact', () => {
    it('should have correct shape', () => {
      const contact: DirectoryContact = {
        id: 'f-001',
        name: 'Dr. Smith',
        designation: 'Professor',
        department: 'CSE',
        email: 'smith@gtu.edu',
        phone: '+91 98765 43210',
      };
      expect(contact.department).toBe('CSE');
    });
  });

  describe('AppMode', () => {
    it('should have all 10 modes', () => {
      const modes = Object.values(AppMode);
      expect(modes).toHaveLength(10);
      expect(modes).toContain('CAMPUS');
      expect(modes).toContain('TUTOR');
      expect(modes).toContain('EXAM_HUB');
    });
  });

  describe('Subject and Category', () => {
    it('should be string aliases', () => {
      const subject: Subject = 'DBMS';
      const category: Category = 'Lecture Notes';
      expectTypeOf<Subject>().toEqualTypeOf<string>();
      expectTypeOf<Category>().toEqualTypeOf<string>();
      expect(subject).toBe('DBMS');
      expect(category).toBe('Lecture Notes');
    });
  });

  describe('Message', () => {
    it('should have correct shape', () => {
      const msg: Message = {
        id: 'msg-001',
        role: 'user',
        content: 'What is SQL?',
        timestamp: Date.now(),
      };
      expect(msg.role).toBe('user');
    });

    it('should only allow valid roles', () => {
      const validRoles: Message['role'][] = ['user', 'model'];
      expect(validRoles).toHaveLength(2);
    });
  });

  describe('VisionState', () => {
    it('should have correct shape', () => {
      const state: VisionState = {
        image: null,
        imagePreview: null,
        prompt: '',
        result: '',
        isLoading: false,
      };
      expect(state.isLoading).toBe(false);
    });
  });

  describe('Participant', () => {
    it('should have correct shape', () => {
      const p: Participant = { id: 'u-001', name: 'Alice' };
      expect(p.name).toBe('Alice');
    });
  });
});
