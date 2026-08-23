import React, { useEffect, useMemo, useState } from 'react';
import {
  CalendarDays,
  Check,
  CheckCircle2,
  ClipboardCheck,
  Loader2,
  Save,
  Users,
} from 'lucide-react';
import {
  AttendanceRosterRecord,
  AttendanceRosterStudent,
  AttendanceStatus,
  TimeSlot,
  User,
} from '../../types';
import { attendanceService } from '../../services/attendanceService';

interface AdminClassroomTabProps {
  activeSlot: TimeSlot | undefined;
  selectedDay: string;
  setSelectedDay: (day: string) => void;
  user: User | null;
  attendanceStatus?: 'idle' | 'marking' | 'marked';
  onMarkAttendance?: () => void;
}

const days = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];

const todayString = () => {
  const date = new Date();
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
};

export const AdminClassroomTab: React.FC<AdminClassroomTabProps> = ({
  activeSlot,
  selectedDay,
  setSelectedDay,
  user,
}) => {
  const [schedule, setSchedule] = useState<TimeSlot[]>([]);
  const [selectedSlotId, setSelectedSlotId] = useState('');
  const [sessionDate, setSessionDate] = useState(todayString);
  const [roster, setRoster] = useState<AttendanceRosterStudent[]>([]);
  const [statuses, setStatuses] = useState<Record<string, AttendanceStatus>>({});
  const [isLoadingSchedule, setIsLoadingSchedule] = useState(true);
  const [isLoadingRoster, setIsLoadingRoster] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [savedRecord, setSavedRecord] = useState<AttendanceRosterRecord | null>(null);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    let mounted = true;
    setIsLoadingSchedule(true);
    attendanceService
      .getDailySchedule(selectedDay, user?.batch)
      .then(fetched => {
        if (!mounted) return;
        setSchedule(fetched);
        setSelectedSlotId(current => {
          if (current && fetched.some(slot => slot.id === current)) return current;
          if (activeSlot && fetched.some(slot => slot.id === activeSlot.id)) return activeSlot.id;
          return fetched[0]?.id || activeSlot?.id || '';
        });
        setIsLoadingSchedule(false);
      })
      .catch(() => {
        if (mounted) {
          setSchedule(activeSlot ? [activeSlot] : []);
          setSelectedSlotId(activeSlot?.id || '');
          setIsLoadingSchedule(false);
        }
      });
    return () => {
      mounted = false;
    };
  }, [activeSlot, selectedDay, user?.batch]);

  const selectedSlot = useMemo(
    () =>
      schedule.find(slot => slot.id === selectedSlotId) ||
      (activeSlot?.id === selectedSlotId ? activeSlot : undefined),
    [activeSlot, schedule, selectedSlotId]
  );

  useEffect(() => {
    let mounted = true;
    if (!selectedSlot || !user || (user.role !== 'FACULTY' && user.role !== 'GTU_ADMIN')) {
      setRoster([]);
      setStatuses({});
      return () => {
        mounted = false;
      };
    }

    setIsLoadingRoster(true);
    setErrorMessage('');
    setSavedRecord(null);
    attendanceService
      .getClassRoster(user.branch, user.semester, user.section)
      .then(async students => {
        if (!mounted) return;
        const record = await attendanceService.getRosterRecord(
          selectedSlot.id,
          selectedSlot.subject,
          sessionDate,
          user.id,
          students.map(student => student.id)
        );
        if (!mounted) return;
        setRoster(students);
        setStatuses(
          students.reduce<Record<string, AttendanceStatus>>((result, student) => {
            result[student.id] = record.statuses[student.id] || 'ABSENT';
            return result;
          }, {})
        );
        setIsLoadingRoster(false);
      })
      .catch(() => {
        if (mounted) {
          setRoster([]);
          setStatuses({});
          setErrorMessage('Unable to load the class roster.');
          setIsLoadingRoster(false);
        }
      });
    return () => {
      mounted = false;
    };
  }, [selectedSlot, sessionDate, user]);

  const presentCount = roster.filter(student => statuses[student.id] === 'PRESENT').length;
  const absentCount = roster.length - presentCount;

  const setAllStatuses = (status: AttendanceStatus) => {
    setSavedRecord(null);
    setStatuses(
      roster.reduce<Record<string, AttendanceStatus>>((result, student) => {
        result[student.id] = status;
        return result;
      }, {})
    );
  };

  const toggleStudent = (studentId: string, checked: boolean) => {
    setSavedRecord(null);
    setStatuses(current => ({ ...current, [studentId]: checked ? 'PRESENT' : 'ABSENT' }));
  };

  const saveAttendance = async () => {
    if (!selectedSlot || !user || roster.length === 0) return;
    setIsSaving(true);
    setErrorMessage('');
    try {
      const record: AttendanceRosterRecord = {
        id: `${selectedSlot.id}-${sessionDate}`,
        slotId: selectedSlot.id,
        subject: selectedSlot.subject,
        date: sessionDate,
        facultyId: user.id,
        statuses,
        updatedAt: new Date().toISOString(),
      };
      await attendanceService.saveRosterRecord(record);
      setSavedRecord(record);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Unable to save attendance.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6 lg:space-y-8">
      <section className="relative overflow-hidden bg-slate-900 rounded-[32px] lg:rounded-[40px] p-6 lg:p-10 text-white shadow-2xl">
        <div className="absolute top-0 right-0 w-64 lg:w-96 h-64 lg:h-96 bg-indigo-600/30 rounded-full blur-[80px] -mr-20 -mt-20" />
        <div className="relative z-10 flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="flex h-3 w-3 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-stitch-cyan opacity-75" />
                <span className="relative inline-flex rounded-full h-3 w-3 bg-stitch-cyan" />
              </div>
              <span className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400">
                Faculty attendance desk
              </span>
            </div>
            <h2 className="text-3xl lg:text-5xl font-black tracking-tight mb-2">
              {selectedSlot?.subject || 'Select a class session'}
            </h2>
            <p className="text-sm lg:text-lg text-slate-400 font-medium">
              {selectedSlot
                ? `${selectedSlot.startTime} – ${selectedSlot.endTime} • ${selectedSlot.facultyName}`
                : 'Choose a class from the schedule below to open its roster.'}
            </p>
          </div>
          <div className="w-full xl:w-auto grid grid-cols-1 sm:grid-cols-2 gap-3">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Class session
              <select
                aria-label="Class session"
                value={selectedSlotId}
                onChange={event => {
                  setSelectedSlotId(event.target.value);
                  setSavedRecord(null);
                }}
                className="mt-2 w-full min-h-[46px] rounded-xl border border-white/20 bg-white/10 px-3 text-sm font-bold text-white outline-none focus:border-stitch-cyan"
              >
                {schedule.length === 0 && <option value="">No classes available</option>}
                {schedule.map(slot => (
                  <option key={slot.id} value={slot.id} className="bg-slate-900">
                    {slot.startTime} · {slot.subject}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Session date
              <input
                aria-label="Session date"
                type="date"
                max={todayString()}
                value={sessionDate}
                onChange={event => {
                  setSessionDate(event.target.value);
                  setSavedRecord(null);
                }}
                className="mt-2 w-full min-h-[46px] rounded-xl border border-white/20 bg-white/10 px-3 text-sm font-bold text-white outline-none focus:border-stitch-cyan"
              />
            </label>
          </div>
        </div>
      </section>

      <section
        aria-labelledby="attendance-roster-heading"
        className="glass-card bg-slate-900/70 rounded-[32px] border border-white/10 shadow-sm overflow-hidden"
      >
        <div className="p-6 lg:p-8 border-b border-white/10 bg-white/5">
          <div className="flex flex-col lg:flex-row justify-between gap-5">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <ClipboardCheck className="w-5 h-5 text-stitch-cyan" />
                <h2 id="attendance-roster-heading" className="text-2xl font-black text-white">
                  Attendance roster
                </h2>
              </div>
              <p className="text-sm text-slate-400">
                {roster.length} students in this session. New sessions start with every student
                absent.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setAllStatuses('PRESENT')}
                disabled={isLoadingRoster || roster.length === 0}
                className="min-h-[44px] rounded-xl bg-emerald-500/15 border border-emerald-400/30 px-4 text-xs font-black uppercase tracking-wider text-emerald-300 hover:bg-emerald-500/25 disabled:opacity-50"
              >
                Mark all present
              </button>
              <button
                type="button"
                onClick={() => setAllStatuses('ABSENT')}
                disabled={isLoadingRoster || roster.length === 0}
                className="min-h-[44px] rounded-xl bg-rose-500/15 border border-rose-400/30 px-4 text-xs font-black uppercase tracking-wider text-rose-300 hover:bg-rose-500/25 disabled:opacity-50"
              >
                Mark all absent
              </button>
            </div>
          </div>
          <div className="mt-5 flex flex-wrap gap-3 text-sm font-bold">
            <span className="rounded-full bg-emerald-500/15 px-3 py-1.5 text-emerald-300">
              Present {presentCount}
            </span>
            <span className="rounded-full bg-rose-500/15 px-3 py-1.5 text-rose-300">
              Absent {absentCount}
            </span>
          </div>
        </div>

        <div role="region" aria-label="Attendance roster" className="divide-y divide-white/10">
          {isLoadingSchedule || isLoadingRoster ? (
            <div className="p-12 flex items-center justify-center gap-3 text-slate-400">
              <Loader2 className="w-5 h-5 animate-spin" /> Loading class roster…
            </div>
          ) : roster.length === 0 ? (
            <div className="p-12 text-center text-slate-400">
              Select a class session to load its roster.
            </div>
          ) : (
            roster.map(student => {
              const isPresent = statuses[student.id] === 'PRESENT';
              return (
                <label
                  key={student.id}
                  className="flex items-center gap-4 p-5 lg:px-8 hover:bg-white/5 transition-colors cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={isPresent}
                    onChange={event => toggleStudent(student.id, event.target.checked)}
                    aria-label={`Present for ${student.name}`}
                    className="h-5 w-5 accent-emerald-500"
                  />
                  <span
                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl font-black ${isPresent ? 'bg-emerald-500/20 text-emerald-300' : 'bg-white/10 text-slate-400'}`}
                  >
                    {isPresent ? <Check className="w-5 h-5" /> : <Users className="w-5 h-5" />}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm lg:text-base font-bold text-white truncate">
                      {student.name}
                    </span>
                    <span className="block text-xs text-slate-400 mt-1">
                      {student.enrollmentNumber}
                    </span>
                  </span>
                  <span
                    className={`text-xs font-black uppercase tracking-wider ${isPresent ? 'text-emerald-300' : 'text-rose-300'}`}
                  >
                    {isPresent ? 'Present' : 'Absent'}
                  </span>
                </label>
              );
            })
          )}
        </div>

        <div className="p-6 lg:px-8 border-t border-white/10 bg-white/[0.03] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div aria-live="polite" className="text-sm font-bold">
            {savedRecord ? (
              <span className="text-emerald-300 flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5" /> Attendance saved
              </span>
            ) : (
              <span className="text-slate-400">Review the roster, then save this session.</span>
            )}
            {errorMessage && <span className="block mt-2 text-rose-300">{errorMessage}</span>}
          </div>
          <button
            type="button"
            onClick={saveAttendance}
            disabled={isSaving || isLoadingRoster || roster.length === 0 || !selectedSlot}
            className="min-h-[48px] w-full sm:w-auto rounded-xl bg-stitch-cyan px-6 text-sm font-black uppercase tracking-wider text-slate-950 shadow-lg shadow-stitch-cyan/20 hover:brightness-110 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
            Save attendance
          </button>
        </div>
      </section>

      <section className="glass-card bg-slate-900/60 rounded-[32px] border border-white/10 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-white/10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white/5">
          <div className="flex items-center gap-3">
            <CalendarDays className="w-5 h-5 text-stitch-cyan" />
            <h3 className="font-bold text-white">Weekly schedule</h3>
          </div>
          <div
            role="tablist"
            aria-label="Class days"
            className="flex gap-1 bg-white/5 p-1 rounded-xl border border-white/10 overflow-x-auto w-full md:w-auto no-scrollbar"
          >
            {days.map(day => (
              <button
                type="button"
                role="tab"
                aria-selected={selectedDay === day}
                key={day}
                onClick={() => setSelectedDay(day)}
                className={`flex-1 md:flex-none px-4 py-2 min-h-[44px] rounded-lg text-xs font-bold transition-all ${selectedDay === day ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:bg-white/10 hover:text-white'}`}
              >
                {day}
              </button>
            ))}
          </div>
        </div>
        <div className="divide-y divide-white/10">
          {isLoadingSchedule ? (
            <div className="p-10 text-center text-slate-400">Loading schedule…</div>
          ) : (
            schedule.map(slot => (
              <button
                type="button"
                key={slot.id}
                onClick={() => setSelectedSlotId(slot.id)}
                className={`w-full text-left p-5 flex items-center hover:bg-white/5 transition-colors group ${selectedSlotId === slot.id ? 'bg-stitch-cyan/10' : ''}`}
              >
                <div className="w-24 lg:w-32 shrink-0">
                  <p className="font-bold text-white text-sm lg:text-lg">{slot.startTime}</p>
                  <p className="text-xs text-slate-400 font-medium">{slot.endTime}</p>
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-bold text-white text-sm lg:text-lg group-hover:text-stitch-cyan transition-colors truncate">
                    {slot.subject}
                  </h4>
                  <div className="flex flex-wrap gap-2 mt-1">
                    <span className="px-2 py-0.5 bg-white/10 rounded text-[10px] font-bold uppercase tracking-wider text-slate-300">
                      {slot.type}
                    </span>
                    <span className="text-xs text-slate-400 font-medium flex items-center gap-1">
                      <Users className="w-3 h-3" /> {slot.facultyName}
                    </span>
                  </div>
                </div>
              </button>
            ))
          )}
          {!isLoadingSchedule && schedule.length === 0 && (
            <div className="p-12 text-center text-slate-400 font-medium">No classes scheduled.</div>
          )}
        </div>
      </section>
    </div>
  );
};

export default AdminClassroomTab;
