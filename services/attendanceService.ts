import {
  AttendanceRecord,
  AttendanceRosterRecord,
  AttendanceRosterStudent,
  AttendanceStatus,
  TimeSlot,
} from '../types';
import { getAllUsers } from './rbacAuthService';
import { db, isConfigValid } from '../firebase';
import {
  collection,
  addDoc,
  query,
  where,
  getDocs,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore';
import { offlineStorageService } from './offlineStorageService';

/**
 * ATTENDANCE & TIMETABLE SERVICE
 * NOW WITH FIREBASE SUPPORT - Real cloud-based attendance tracking!
 * Falls back to localStorage if Firebase is not configured.
 */

const STORAGE_KEY_TT = 'GPA_HUB_TIME_TABLE';
const STORAGE_KEY_ATT = 'GPA_HUB_ATTENDANCE_RECORDS';
const STORAGE_KEY_ROSTER_ATT = 'GPA_HUB_ATTENDANCE_ROSTER_RECORDS';

// Helper to generate the Mock Time Table based on the PDF image
const generateInitialTimeTable = (): TimeSlot[] => {
  const slots: TimeSlot[] = [];
  const days = ['MON', 'TUE', 'WED', 'THU', 'FRI'];

  const rawSchedule: Record<
    string,
    { start: string; end: string; sub: string; fac: string; type: string; batch?: string }[]
  > = {
    MON: [
      { start: '10:30', end: '11:30', sub: 'CYBER SEC', fac: 'JAC', type: 'LECTURE' },
      { start: '11:30', end: '12:30', sub: 'DBMS', fac: 'CKP', type: 'LECTURE' },
      { start: '12:30', end: '13:30', sub: 'ES', fac: 'KDT', type: 'LECTURE' },
      { start: '13:30', end: '14:00', sub: 'RECESS', fac: '-', type: 'RECESS' },
      { start: '14:00', end: '15:00', sub: 'AD PYTHON', fac: 'DMM', type: 'LECTURE' },
      { start: '15:00', end: '16:00', sub: 'MP & MC', fac: 'NHP', type: 'LECTURE' },
      {
        start: '16:10',
        end: '18:10',
        sub: 'WT TUTORIAL',
        fac: 'MDD',
        type: 'PRACTICAL',
        batch: 'A1',
      },
    ],
    TUE: [
      { start: '10:30', end: '11:30', sub: 'AD PYTHON', fac: 'DMM', type: 'LECTURE' },
      { start: '11:30', end: '12:30', sub: 'D&DC', fac: 'KKS', type: 'LECTURE' },
      { start: '12:30', end: '13:30', sub: 'ES', fac: 'SMK', type: 'LECTURE' },
      { start: '13:30', end: '14:00', sub: 'RECESS', fac: '-', type: 'RECESS' },
      { start: '14:00', end: '16:00', sub: 'DBMS LAB', fac: 'CKP', type: 'PRACTICAL', batch: 'A1' },
      { start: '16:10', end: '18:10', sub: 'WT LAB', fac: 'MDD', type: 'PRACTICAL', batch: 'A1' },
    ],
    WED: [
      { start: '10:30', end: '11:30', sub: 'D&DC', fac: 'MNC', type: 'LECTURE' },
      { start: '11:30', end: '12:30', sub: 'CYBER SEC', fac: 'JAC', type: 'LECTURE' },
      { start: '12:30', end: '13:30', sub: 'DBMS', fac: 'CKP', type: 'LECTURE' },
      { start: '13:30', end: '14:00', sub: 'RECESS', fac: '-', type: 'RECESS' },
      {
        start: '14:00',
        end: '16:00',
        sub: 'AD PYTHON LAB',
        fac: 'MPMC',
        type: 'PRACTICAL',
        batch: 'A1',
      },
      { start: '16:10', end: '18:10', sub: 'WT LAB', fac: 'MDD', type: 'PRACTICAL', batch: 'A1' },
    ],
    THU: [
      { start: '10:30', end: '11:30', sub: 'ES', fac: 'SMK', type: 'LECTURE' },
      { start: '11:30', end: '12:30', sub: 'D&DC', fac: 'KKS', type: 'LECTURE' },
      { start: '12:30', end: '13:30', sub: 'MP & MC', fac: 'NHP', type: 'LECTURE' },
      { start: '13:30', end: '14:00', sub: 'RECESS', fac: '-', type: 'RECESS' },
      { start: '14:00', end: '16:00', sub: 'D&DC LAB', fac: 'KKS', type: 'PRACTICAL', batch: 'A1' },
      { start: '16:10', end: '17:10', sub: 'ES', fac: 'SMK', type: 'LECTURE' },
    ],
    FRI: [
      { start: '10:30', end: '11:30', sub: 'MP & MC', fac: 'HDP', type: 'LECTURE' },
      { start: '11:30', end: '12:30', sub: 'AD PYTHON', fac: 'DMM', type: 'LECTURE' },
      { start: '12:30', end: '13:30', sub: 'CYBER SEC', fac: 'JAC', type: 'LECTURE' },
      { start: '13:30', end: '14:00', sub: 'RECESS', fac: '-', type: 'RECESS' },
      {
        start: '14:00',
        end: '16:00',
        sub: 'MP & MC LAB',
        fac: 'HDP',
        type: 'PRACTICAL',
        batch: 'A1',
      },
    ],
  };

  days.forEach(day => {
    const daySlots = rawSchedule[day];
    if (daySlots) {
      daySlots.forEach(s => {
        slots.push({
          id: `${day}-${s.start}-${s.sub}`.replace(/\s/g, ''),
          day,
          startTime: s.start,
          endTime: s.end,
          subject: s.sub,
          type: s.type as TimeSlot['type'],
          facultyName: s.fac,
          batch: s.batch || 'ALL',
        });
      });
    }
  });

  return slots;
};

// Module-level state (replaces window.TIME_TABLE and window.ATTENDANCE_RECORDS)
function loadTimeTable(): TimeSlot[] {
  const saved = localStorage.getItem(STORAGE_KEY_TT);
  return saved ? JSON.parse(saved) : generateInitialTimeTable();
}

function saveTimeTable(data: TimeSlot[]) {
  localStorage.setItem(STORAGE_KEY_TT, JSON.stringify(data));
}

function loadAttendanceRecords(): AttendanceRecord[] {
  const saved = localStorage.getItem(STORAGE_KEY_ATT);
  return saved ? JSON.parse(saved) : [];
}

function saveAttendanceRecords(data: AttendanceRecord[]) {
  localStorage.setItem(STORAGE_KEY_ATT, JSON.stringify(data));
}

function loadRosterRecords(): AttendanceRosterRecord[] {
  try {
    const saved = localStorage.getItem(STORAGE_KEY_ROSTER_ATT);
    return saved ? JSON.parse(saved) : [];
  } catch {
    return [];
  }
}

function saveRosterRecords(data: AttendanceRosterRecord[]) {
  localStorage.setItem(STORAGE_KEY_ROSTER_ATT, JSON.stringify(data));
}

function fallbackRoster(branch?: string, semester?: string): AttendanceRosterStudent[] {
  return (
    [
      ['STU-DEMO-001', 'Aarav Shah', '236080307001'],
      ['STU-DEMO-002', 'Diya Patel', '236080307002'],
      ['STU-DEMO-003', 'Rohan Mehta', '236080307003'],
      ['STU-DEMO-004', 'Kavya Desai', '236080307004'],
      ['STU-DEMO-005', 'Ishaan Joshi', '236080307005'],
    ] as [string, string, string][]
  ).map(([id, name, enrollmentNumber]) => ({ id, name, enrollmentNumber, branch, semester }));
}

// Initialize localStorage with defaults if empty
if (!localStorage.getItem(STORAGE_KEY_TT)) {
  saveTimeTable(generateInitialTimeTable());
}

export const attendanceService = {
  // --- Timetable Management ---

  seedTimetable: async () => {
    if (isConfigValid && db) {
      const q = query(collection(db, 'timetables'));
      const snap = await getDocs(q);
      if (snap.empty) {
        const slots = generateInitialTimeTable();
        for (const slot of slots) {
          await addDoc(collection(db, 'timetables'), slot);
        }
      }
    }
  },

  getTimeTable: async (): Promise<TimeSlot[]> => {
    if (isConfigValid && db) {
      const q = query(collection(db, 'timetables'));
      const snap = await getDocs(q);
      return snap.docs.map(d => ({ id: d.id, ...d.data() }) as TimeSlot);
    }
    return loadTimeTable();
  },

  getDailySchedule: async (day: string, userBatch?: string): Promise<TimeSlot[]> => {
    let slots: TimeSlot[];
    if (isConfigValid && db) {
      try {
        const q = query(collection(db, 'timetables'), where('day', '==', day));
        const snap = await Promise.race([
          getDocs(q),
          new Promise<never>((_, reject) =>
            setTimeout(() => reject(new Error('Timetable request timed out')), 1500)
          ),
        ]);
        slots = snap.docs.map(d => ({ id: d.id, ...d.data() }) as TimeSlot);
      } catch {
        slots = loadTimeTable().filter(s => s.day === day);
      }
    } else {
      slots = loadTimeTable().filter(s => s.day === day);
    }

    if (slots.length === 0) {
      slots = loadTimeTable().filter(s => s.day === day);
    }

    return slots
      .filter(s => {
        if (!s.batch || s.batch === 'ALL') return true;
        if (userBatch && s.batch === userBatch) return true;
        return false;
      })
      .sort((a, b) => a.startTime.localeCompare(b.startTime));
  },

  updateTimeTable: (newSchedule: TimeSlot[]) => {
    saveTimeTable(newSchedule);
  },

  getClassRoster: async (
    branch?: string,
    semester?: string,
    section?: string
  ): Promise<AttendanceRosterStudent[]> => {
    const registered = getAllUsers()
      .filter(user => user.role === 'STUDENT')
      .filter(user => !branch || !user.branch || user.branch === branch)
      .filter(user => !semester || !user.semester || user.semester === semester)
      .filter(user => !section || section === 'ALL' || !user.section || user.section === section)
      .map(user => ({
        id: user.id,
        name: user.name,
        enrollmentNumber: user.enrollmentNumber || user.id,
        branch: user.branch,
        semester: user.semester,
        section: user.section,
      }));
    return registered.length > 0 ? registered : fallbackRoster(branch, semester);
  },

  getRosterRecord: async (
    slotId: string,
    subject: string,
    date: string,
    facultyId: string,
    studentIds: string[]
  ): Promise<AttendanceRosterRecord> => {
    const id = `${slotId}-${date}`;
    const existing = loadRosterRecords().find(record => record.id === id);
    if (existing) return existing;
    const statuses = Object.fromEntries(
      studentIds.map(studentId => [studentId, 'ABSENT' as AttendanceStatus])
    );
    return { id, slotId, subject, date, facultyId, statuses, updatedAt: new Date().toISOString() };
  },

  saveRosterRecord: async (record: AttendanceRosterRecord): Promise<void> => {
    const today = new Date();
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    if (record.date > todayStr) throw new Error('Cannot mark attendance for future dates.');

    const records = loadRosterRecords();
    const index = records.findIndex(existing => existing.id === record.id);
    if (index >= 0) records[index] = record;
    else records.push(record);
    saveRosterRecords(records);

    const presentStudentIds = Object.entries(record.statuses)
      .filter(([, status]) => status === 'PRESENT')
      .map(([studentId]) => studentId);
    await attendanceService.markAttendance(
      record.slotId,
      record.subject,
      record.date,
      presentStudentIds,
      Object.keys(record.statuses).length
    );
  },

  // --- Attendance Management ---

  markAttendance: async (
    slotId: string,
    subject: string,
    date: string,
    presentStudentIds: string[],
    totalCapacity: number
  ) => {
    const today = new Date();
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

    if (date > todayStr) {
      throw new Error('Cannot mark attendance for future dates.');
    }

    const record: AttendanceRecord = {
      id: `${slotId}-${date}`,
      slotId,
      subject,
      date,
      presentStudentIds,
      totalStudents: totalCapacity,
      timestamp: new Date().toISOString(),
    };

    const localRecords = loadAttendanceRecords();
    const localIndex = localRecords.findIndex(r => r.id === record.id);
    if (localIndex !== -1) localRecords[localIndex] = record;
    else localRecords.push(record);
    saveAttendanceRecords(localRecords);

    if (isConfigValid && db) {
      try {
        const existingQuery = query(
          collection(db, 'attendance_records'),
          where('slotId', '==', slotId),
          where('date', '==', date)
        );
        const existingDocs = await Promise.race([
          getDocs(existingQuery),
          new Promise<never>((_, reject) =>
            setTimeout(() => reject(new Error('Attendance request timed out')), 1500)
          ),
        ]);

        if (existingDocs.empty) {
          await Promise.race([
            addDoc(collection(db, 'attendance_records'), {
              ...record,
              timestamp: serverTimestamp(),
            }),
            new Promise<never>((_, reject) =>
              setTimeout(() => reject(new Error('Attendance write timed out')), 1500)
            ),
          ]);
        }
        return;
      } catch {
        offlineStorageService.enqueue('ATTENDANCE_LOG', record);
      }
    }

    const records = loadAttendanceRecords();
    const existingIndex = records.findIndex(r => r.id === record.id);
    if (existingIndex !== -1) {
      records[existingIndex] = record;
    } else {
      records.push(record);
    }

    saveAttendanceRecords(records);
  },

  getStudentStats: async (studentId: string) => {
    let records: AttendanceRecord[] = [];

    if (isConfigValid && db) {
      try {
        const q = query(collection(db, 'attendance_records'));
        const querySnapshot = await getDocs(q);
        records = querySnapshot.docs.map(d => {
          const data = d.data();
          return {
            id: d.id,
            slotId: data.slotId,
            subject: data.subject,
            date: data.date,
            presentStudentIds: data.presentStudentIds || [],
            totalStudents: data.totalStudents || 0,
            timestamp:
              data.timestamp instanceof Timestamp
                ? data.timestamp.toDate().toISOString()
                : data.timestamp,
          };
        });
      } catch {
        records = loadAttendanceRecords();
      }
    } else {
      records = loadAttendanceRecords();
    }

    if (records.length === 0)
      return {
        overall: 72,
        totalClasses: 45,
        attendedClasses: 32,
        subjectWise: [
          { subject: 'CYBER SEC', percentage: 80, attended: 8, total: 10 },
          { subject: 'DBMS', percentage: 65, attended: 6, total: 9 },
          { subject: 'AD PYTHON', percentage: 90, attended: 9, total: 10 },
          { subject: 'ES', percentage: 50, attended: 4, total: 8 },
          { subject: 'MP & MC', percentage: 75, attended: 6, total: 8 },
        ],
      };

    const studentRecords = records.filter(r => r.totalStudents > 0);

    const totalClasses = studentRecords.length;
    const attendedClasses = studentRecords.filter(r =>
      r.presentStudentIds.includes(studentId)
    ).length;

    const subjectMap: Record<string, { total: number; attended: number }> = {};

    studentRecords.forEach(r => {
      if (!subjectMap[r.subject]) subjectMap[r.subject] = { total: 0, attended: 0 };
      const entry = subjectMap[r.subject] as { total: number; attended: number };
      entry.total += 1;
      if (r.presentStudentIds.includes(studentId)) {
        entry.attended += 1;
      }
    });

    const subjectWise = Object.keys(subjectMap).map(sub => {
      const entry = subjectMap[sub]!;
      return {
        subject: sub,
        total: entry.total,
        attended: entry.attended,
        percentage: Math.round((entry.attended / entry.total) * 100),
      };
    });

    return {
      overall: totalClasses === 0 ? 0 : Math.round((attendedClasses / totalClasses) * 100),
      totalClasses,
      attendedClasses,
      subjectWise,
    };
  },

  getCurrentSlot: async (dayOverride?: string, timeOverride?: string): Promise<TimeSlot | null> => {
    const days = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
    const now = new Date();
    const day = dayOverride || (days[now.getDay()] ?? 'MON');
    const timeStr =
      timeOverride ||
      `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    const currentTime = parseInt(timeStr.replace(':', ''));

    const slots = await attendanceService.getDailySchedule(day);

    return (
      slots.find(s => {
        const start = parseInt(s.startTime.replace(':', ''));
        const end = parseInt(s.endTime.replace(':', ''));
        return currentTime >= start && currentTime < end;
      }) || null
    );
  },
};
