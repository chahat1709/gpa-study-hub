import { describe, it, expect, beforeEach } from 'vitest';
import { attendanceService } from '../services/attendanceService';

describe('attendanceService (local mode)', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  describe('getTimeTable', () => {
    it('should return default timetable', async () => {
      const timetable = await attendanceService.getTimeTable();
      expect(Array.isArray(timetable)).toBe(true);
      expect(timetable.length).toBeGreaterThan(0);
    });

    it('should have slots with valid days', async () => {
      const validDays = ['MON', 'TUE', 'WED', 'THU', 'FRI'];
      const timetable = await attendanceService.getTimeTable();
      for (const slot of timetable) {
        expect(validDays).toContain(slot.day);
      }
    });

    it('should have slots with valid types', async () => {
      const validTypes = ['LECTURE', 'PRACTICAL', 'TUTORIAL', 'RECESS'];
      const timetable = await attendanceService.getTimeTable();
      for (const slot of timetable) {
        expect(validTypes).toContain(slot.type);
      }
    });

    it('should have startTime before endTime', async () => {
      const timetable = await attendanceService.getTimeTable();
      for (const slot of timetable) {
        expect(slot.startTime.localeCompare(slot.endTime)).toBeLessThan(0);
      }
    });
  });

  describe('getDailySchedule', () => {
    it('should return slots for a specific day', async () => {
      const monSlots = await attendanceService.getDailySchedule('MON');
      expect(monSlots.length).toBeGreaterThan(0);
      for (const slot of monSlots) {
        expect(slot.day).toBe('MON');
      }
    });

    it('should return empty for non-existent day', async () => {
      const slots = await attendanceService.getDailySchedule('SAT');
      expect(slots).toEqual([]);
    });

    it('should sort by startTime', async () => {
      const slots = await attendanceService.getDailySchedule('MON');
      for (let i = 1; i < slots.length; i++) {
        expect(slots[i - 1]!.startTime.localeCompare(slots[i]!.startTime)).toBeLessThanOrEqual(0);
      }
    });
  });

  describe('getCurrentSlot', () => {
    it('should find the current active slot', async () => {
      const slot = await attendanceService.getCurrentSlot('MON', '11:00');
      expect(slot).not.toBeNull();
      expect(slot!.day).toBe('MON');
    });

    it('should return null outside class hours', async () => {
      const slot = await attendanceService.getCurrentSlot('MON', '09:00');
      expect(slot).toBeNull();
    });

    it('should find RECESS slot', async () => {
      const slot = await attendanceService.getCurrentSlot('MON', '13:30');
      expect(slot).not.toBeNull();
      expect(slot!.type).toBe('RECESS');
    });
  });

  describe('markAttendance', () => {
    it('should mark attendance successfully', async () => {
      await expect(
        attendanceService.markAttendance(
          'slot-001', 'DBMS', '2025-01-15',
          ['STU-001', 'STU-002'], 40
        )
      ).resolves.toBeUndefined();
    });

    it('should not allow future dates', async () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 5);
      const dateStr = futureDate.toISOString().split('T')[0]!;

      await expect(
        attendanceService.markAttendance(
          'slot-001', 'DBMS', dateStr,
          ['STU-001'], 40
        )
      ).rejects.toThrow('Cannot mark attendance for future dates');
    });

    it('should allow today\'s date', async () => {
      const now = new Date();
      const today = `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}-${now.getDate().toString().padStart(2, '0')}`;
      await expect(
        attendanceService.markAttendance(
          'slot-001', 'DBMS', today,
          ['STU-001'], 40
        )
      ).resolves.toBeUndefined();
    });

    it('should update existing record for same slot+date', async () => {
      const now = new Date();
      const today = `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}-${now.getDate().toString().padStart(2, '0')}`;

      await attendanceService.markAttendance(
        'slot-001', 'DBMS', today,
        ['STU-001'], 40
      );
      await attendanceService.markAttendance(
        'slot-001', 'DBMS', today,
        ['STU-001', 'STU-002', 'STU-003'], 40
      );

      const stats = await attendanceService.getStudentStats('STU-001');
      expect(stats.totalClasses).toBe(1);
    });
  });

  describe('getStudentStats', () => {
    it('should return default stats when no records', async () => {
      const stats = await attendanceService.getStudentStats('STU-001');
      expect(stats.overall).toBe(72);
      expect(stats.subjectWise).toHaveLength(5);
    });

    it('should calculate correct stats with records', async () => {
      const now = new Date();
      const today = `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}-${now.getDate().toString().padStart(2, '0')}`;

      await attendanceService.markAttendance(
        'slot-001', 'DBMS', today,
        ['STU-001', 'STU-002'], 40
      );

      const stats = await attendanceService.getStudentStats('STU-001');
      expect(stats.totalClasses).toBe(1);
      expect(stats.attendedClasses).toBe(1);
      expect(stats.overall).toBe(100);
    });
  });

  describe('persistence', () => {
    it('should persist attendance to localStorage', async () => {
      const now = new Date();
      const today = `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}-${now.getDate().toString().padStart(2, '0')}`;
      await attendanceService.markAttendance(
        'slot-001', 'DBMS', today,
        ['STU-001'], 40
      );

      const saved = localStorage.getItem('GPA_HUB_ATTENDANCE_RECORDS');
      expect(saved).not.toBeNull();
      const records = JSON.parse(saved!);
      expect(records.length).toBe(1);
    });
  });
});
