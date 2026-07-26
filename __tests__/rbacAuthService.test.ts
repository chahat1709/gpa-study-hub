import { describe, it, expect, beforeEach } from 'vitest';
import {
  PERMISSIONS,
  hasPermission,
  requireRole,
  registerStudent,
  loginStudent,
  registerFacultyLocal,
  loginFacultyLocal,
  getSession,
  clearSession,
  changePin,
  getAllUsers,
  deactivateUser,
} from '../services/rbacAuthService';
import type { User } from '../types';

describe('rbacAuthService', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  describe('PERMISSIONS', () => {
    it('should define all permission keys', () => {
      expect(Object.keys(PERMISSIONS).length).toBeGreaterThan(0);
    });

    it('VIEW_EXAMS should be available to all roles', () => {
      expect(PERMISSIONS.VIEW_EXAMS).toContain('STUDENT');
      expect(PERMISSIONS.VIEW_EXAMS).toContain('FACULTY');
      expect(PERMISSIONS.VIEW_EXAMS).toContain('GTU_ADMIN');
    });

    it('MANAGE_USERS should be GTU_ADMIN only', () => {
      expect(PERMISSIONS.MANAGE_USERS).toEqual(['GTU_ADMIN']);
    });

    it('MARK_ATTENDANCE should be FACULTY and GTU_ADMIN', () => {
      expect(PERMISSIONS.MARK_ATTENDANCE).toContain('FACULTY');
      expect(PERMISSIONS.MARK_ATTENDANCE).toContain('GTU_ADMIN');
      expect(PERMISSIONS.MARK_ATTENDANCE).not.toContain('STUDENT');
    });
  });

  describe('hasPermission', () => {
    it('should return true for authorized role', () => {
      const user: User = { id: 'u1', name: 'A', role: 'STUDENT', university: 'GTU' };
      expect(hasPermission(user, 'VIEW_EXAMS')).toBe(true);
    });

    it('should return false for unauthorized role', () => {
      const user: User = { id: 'u1', name: 'A', role: 'STUDENT', university: 'GTU' };
      expect(hasPermission(user, 'MANAGE_USERS')).toBe(false);
    });

    it('should return false for null user', () => {
      expect(hasPermission(null, 'VIEW_EXAMS')).toBe(false);
    });
  });

  describe('requireRole', () => {
    it('should return true when user has required role', () => {
      const user: User = { id: 'u1', name: 'A', role: 'FACULTY', university: 'GTU' };
      expect(requireRole(user, ['FACULTY', 'GTU_ADMIN'])).toBe(true);
    });

    it('should return false when user does not have required role', () => {
      const user: User = { id: 'u1', name: 'A', role: 'STUDENT', university: 'GTU' };
      expect(requireRole(user, ['FACULTY'])).toBe(false);
    });

    it('should return false for null user', () => {
      expect(requireRole(null, ['STUDENT'])).toBe(false);
    });
  });

  describe('registerStudent', () => {
    it('should register a new student', async () => {
      const user = await registerStudent({
        name: 'Test Student',
        enrollmentNumber: '2464010',
        pin: '1234',
        branch: 'CSE',
        semester: '4',
        section: 'A',
      });

      expect(user.id).toBe('STU-2464010');
      expect(user.name).toBe('Test Student');
      expect(user.role).toBe('STUDENT');
      expect(user.branch).toBe('CSE');
    });

    it('should persist the student to localStorage', async () => {
      await registerStudent({
        name: 'Persist Test',
        enrollmentNumber: '2464099',
        pin: '5678',
        branch: 'CSE',
        semester: '4',
        section: 'A',
      });

      const session = getSession();
      expect(session).not.toBeNull();
      expect(session!.id).toBe('STU-2464099');
    });

    it('should reject duplicate enrollment', async () => {
      await registerStudent({
        name: 'First',
        enrollmentNumber: '2464010',
        pin: '1234',
        branch: 'CSE',
        semester: '4',
        section: 'A',
      });

      await expect(
        registerStudent({
          name: 'Second',
          enrollmentNumber: '2464010',
          pin: '5678',
          branch: 'CSE',
          semester: '4',
          section: 'A',
        })
      ).rejects.toThrow('already registered');
    });

    it('should reject non-4-digit PIN', async () => {
      await expect(
        registerStudent({
          name: 'Test',
          enrollmentNumber: '2464010',
          pin: '123',
          branch: 'CSE',
          semester: '4',
          section: 'A',
        })
      ).rejects.toThrow('4 digits');
    });

    it('should uppercase enrollment number', async () => {
      const user = await registerStudent({
        name: 'Upper',
        enrollmentNumber: 'abc1234',
        pin: '1234',
        branch: 'CSE',
        semester: '4',
        section: 'A',
      });
      expect(user.enrollmentNumber).toBe('ABC1234');
    });
  });

  describe('loginStudent', () => {
    it('should login with correct PIN', async () => {
      await registerStudent({
        name: 'Login Test',
        enrollmentNumber: '2464020',
        pin: '1234',
        branch: 'CSE',
        semester: '4',
        section: 'A',
      });
      clearSession();

      const user = await loginStudent('2464020', '1234');
      expect(user.id).toBe('STU-2464020');
    });

    it('should reject wrong PIN', async () => {
      await registerStudent({
        name: 'Wrong PIN',
        enrollmentNumber: '2464030',
        pin: '1234',
        branch: 'CSE',
        semester: '4',
        section: 'A',
      });
      clearSession();

      await expect(loginStudent('2464030', '9999')).rejects.toThrow();
    });

    it('should reject non-existent account', async () => {
      await expect(loginStudent('9999999', '1234')).rejects.toThrow('Account not found');
    });
  });

  describe('registerFacultyLocal', () => {
    it('should register a new faculty', async () => {
      const user = await registerFacultyLocal({
        name: 'Prof. Test',
        email: 'test@gtu.edu',
        password: 'password123',
        branch: 'CSE',
      });

      expect(user.id).toContain('FAC-');
      expect(user.role).toBe('FACULTY');
    });

    it('should reject short password', async () => {
      await expect(
        registerFacultyLocal({
          name: 'Prof. Short',
          email: 'short@gtu.edu',
          password: '123',
          branch: 'CSE',
        })
      ).rejects.toThrow('at least 6 characters');
    });
  });

  describe('loginFacultyLocal', () => {
    it('should login with correct password', async () => {
      await registerFacultyLocal({
        name: 'Prof. Login',
        email: 'login@gtu.edu',
        password: 'password123',
        branch: 'CSE',
      });
      clearSession();

      const user = await loginFacultyLocal('login@gtu.edu', 'password123');
      expect(user.role).toBe('FACULTY');
    });

    it('should reject wrong password', async () => {
      await registerFacultyLocal({
        name: 'Prof. Wrong',
        email: 'wrong@gtu.edu',
        password: 'password123',
        branch: 'CSE',
      });
      clearSession();

      await expect(loginFacultyLocal('wrong@gtu.edu', 'wrongpassword')).rejects.toThrow();
    });
  });

  describe('changePin', () => {
    it('should change PIN successfully', async () => {
      await registerStudent({
        name: 'PIN Change',
        enrollmentNumber: '2464040',
        pin: '1234',
        branch: 'CSE',
        semester: '4',
        section: 'A',
      });

      await changePin('2464040', '1234', '5678');
      clearSession();

      const user = await loginStudent('2464040', '5678');
      expect(user.id).toBe('STU-2464040');
    });

    it('should reject wrong old PIN', async () => {
      await registerStudent({
        name: 'PIN Fail',
        enrollmentNumber: '2464050',
        pin: '1234',
        branch: 'CSE',
        semester: '4',
        section: 'A',
      });

      await expect(
        changePin('2464050', '9999', '5678')
      ).rejects.toThrow('Old PIN is incorrect');
    });

    it('should reject non-4-digit new PIN', async () => {
      await registerStudent({
        name: 'PIN Bad',
        enrollmentNumber: '2464060',
        pin: '1234',
        branch: 'CSE',
        semester: '4',
        section: 'A',
      });

      await expect(
        changePin('2464060', '1234', '123')
      ).rejects.toThrow('4 digits');
    });
  });

  describe('getAllUsers', () => {
    it('should return all active users', async () => {
      await registerStudent({
        name: 'User 1',
        enrollmentNumber: '2464070',
        pin: '1234',
        branch: 'CSE',
        semester: '4',
        section: 'A',
      });

      const users = getAllUsers();
      expect(users.length).toBeGreaterThanOrEqual(1);
      expect(users.some(u => u.enrollmentNumber === '2464070')).toBe(true);
    });
  });

  describe('deactivateUser', () => {
    it('should deactivate a user', async () => {
      await registerStudent({
        name: 'Deactivate',
        enrollmentNumber: '2464080',
        pin: '1234',
        branch: 'CSE',
        semester: '4',
        section: 'A',
      });

      deactivateUser('STU-2464080');
      const users = getAllUsers();
      expect(users.some(u => u.id === 'STU-2464080')).toBe(false);
    });
  });

  describe('session management', () => {
    it('getSession should return null when no session', () => {
      clearSession();
      expect(getSession()).toBeNull();
    });

    it('clearSession should remove session', async () => {
      await registerStudent({
        name: 'Session',
        enrollmentNumber: '2464100',
        pin: '1234',
        branch: 'CSE',
        semester: '4',
        section: 'A',
      });
      expect(getSession()).not.toBeNull();

      clearSession();
      expect(getSession()).toBeNull();
    });
  });
});
