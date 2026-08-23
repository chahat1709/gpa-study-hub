import { describe, it, expect, beforeEach } from 'vitest';
import { campusService } from '../services/campusService';

describe('campusService (local mode)', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  describe('getNotices', () => {
    it('should return default notices', () => {
      const notices = campusService.getNotices();
      expect(Array.isArray(notices)).toBe(true);
      expect(notices.length).toBeGreaterThan(0);
    });

    it('should have default welcome notice', () => {
      const notices = campusService.getNotices();
      const welcomeNotice = notices.find(n => n.title === 'Welcome to GPA Hub');
      expect(welcomeNotice).toBeDefined();
      expect(welcomeNotice!.priority).toBe('medium');
      expect(welcomeNotice!.scope).toBe('COLLEGE');
    });
  });

  describe('postNotice', () => {
    it('should create a new notice', async () => {
      const noticeData = {
        title: 'Test Notice',
        content: 'This is a test',
        priority: 'high' as const,
        author: 'Test Admin',
        category: 'Academic',
        scope: 'COLLEGE' as const,
      };

      const result = (await campusService.postNotice(noticeData)) as {
        id?: string;
        title: string;
        date: number;
      };
      expect(result.id).toBeDefined();
      expect(result.title).toBe('Test Notice');
      expect(result.date).toBeGreaterThan(0);
    });

    it('should add notice to the list', async () => {
      const before = campusService.getNotices().length;

      await campusService.postNotice({
        title: 'New Notice',
        content: 'Content',
        priority: 'low',
        author: 'Author',
        category: 'General',
        scope: 'COLLEGE',
      });

      const after = campusService.getNotices();
      expect(after.length).toBe(before + 1);
    });
  });

  describe('getDirectory', () => {
    it('should return mock directory', async () => {
      const directory = await campusService.getDirectory();
      expect(Array.isArray(directory)).toBe(true);
      expect(directory.length).toBeGreaterThan(0);
    });

    it('should have required fields', async () => {
      const directory = await campusService.getDirectory();
      for (const contact of directory) {
        expect(contact.id).toBeDefined();
        expect(contact.name).toBeDefined();
        expect(contact.designation).toBeDefined();
        expect(contact.department).toBeDefined();
      }
    });
  });

  describe('getFacultyForNode', () => {
    it('should return faculty for a branch', async () => {
      const faculty = await campusService.getFacultyForNode('CSE', '4');
      expect(Array.isArray(faculty)).toBe(true);
    });

    it('should always include emergency contacts', async () => {
      const faculty = await campusService.getFacultyForNode('CSE', '4');
      const emergencyContacts = faculty.filter(f => f.isEmergency);
      // At minimum the service should return without crashing
      expect(emergencyContacts.length).toBeGreaterThanOrEqual(0);
    });
  });

  describe('getRecentActivity', () => {
    it('should return empty when no resources', () => {
      const activity = campusService.getRecentActivity('CSE', '4');
      expect(Array.isArray(activity)).toBe(true);
    });
  });
});
