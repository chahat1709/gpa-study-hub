import React, { useState } from 'react';
import { Users, CheckCircle2 } from 'lucide-react';
import { TimeSlot } from '../../types';
import { attendanceService } from '../../services/attendanceService';
import { User } from '../../types';
import { useEffect } from 'react';

interface AdminClassroomTabProps {
  activeSlot: TimeSlot | undefined;
  selectedDay: string;
  setSelectedDay: (d: string) => void;
  user: User | null;
  attendanceStatus: 'idle' | 'marking' | 'marked';
  onMarkAttendance: () => void;
}

export const AdminClassroomTab: React.FC<AdminClassroomTabProps> = ({
  activeSlot, selectedDay, setSelectedDay, user, attendanceStatus, onMarkAttendance
}) => {
  const days = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
  const [schedule, setSchedule] = useState<TimeSlot[]>([]);

  useEffect(() => {
    let active = true;
    const fetchSchedule = async () => {
      // @ts-ignore - Ignore the batch property issue on User for now
      const fetched = await attendanceService.getDailySchedule(selectedDay, user?.batch);
      if (active) setSchedule(fetched);
    };
    fetchSchedule();
    return () => { active = false; };
  }, [selectedDay, user]);

  return (
    <div className="space-y-6 lg:space-y-8">
      <div className="relative overflow-hidden bg-slate-900 rounded-[32px] lg:rounded-[40px] p-6 lg:p-10 text-white shadow-2xl">
        <div className="absolute top-0 right-0 w-64 lg:w-96 h-64 lg:h-96 bg-indigo-600/30 rounded-full blur-[80px] -mr-20 -mt-20"></div>
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="relative flex h-3 w-3">
                <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${activeSlot ? 'bg-emerald-400' : 'bg-slate-500'}`}></span>
                <span className={`relative inline-flex rounded-full h-3 w-3 ${activeSlot ? 'bg-emerald-500' : 'bg-slate-600'}`}></span>
              </div>
              <span className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400">Current Status</span>
            </div>
            <h2 className="text-3xl lg:text-5xl font-black tracking-tight mb-2">{activeSlot ? activeSlot.subject : 'No Active Session'}</h2>
            <p className="text-sm lg:text-lg text-slate-400 font-medium">
              {activeSlot ? `${activeSlot.startTime} - ${activeSlot.endTime} • ${activeSlot.facultyName}` : 'The campus is currently between academic blocks.'}
            </p>
          </div>
          {activeSlot && (
            <button
              onClick={attendanceStatus === 'idle' ? onMarkAttendance : undefined}
              className={`w-full md:w-auto px-6 lg:px-8 py-3 lg:py-4 rounded-2xl font-black uppercase tracking-widest text-xs flex items-center justify-center gap-3 shadow-xl transition-all scale-100 active:scale-95 ${attendanceStatus === 'marked'
                ? 'bg-emerald-500 text-white cursor-default'
                : 'bg-white/10 text-white hover:bg-white/20 border border-white/20'
              }`}
            >
              {attendanceStatus === 'marked' ? (
                <><CheckCircle2 className="w-5 h-5 animate-bounce" /> Marked</>
              ) : (
                <><Users className="w-4 h-4" /> Start Attendance</>
              )}
            </button>
          )}
        </div>
      </div>

      <div className="glass-card bg-slate-900/60 rounded-[32px] border border-white/10 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-white/10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white/5">
          <h3 className="font-bold text-white">Weekly Schedule</h3>
          <div className="flex gap-1 bg-white/5 p-1 rounded-xl border border-white/10 overflow-x-auto w-full md:w-auto no-scrollbar">
            {days.map(d => (
              <button key={d} onClick={() => setSelectedDay(d)} className={`flex-1 md:flex-none px-4 py-2 min-h-[44px] rounded-lg text-xs font-bold transition-all ${selectedDay === d ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:bg-white/10 hover:text-white'}`}>{d}</button>
            ))}
          </div>
        </div>
        <div className="divide-y divide-white/10">
          {schedule.map((slot, i) => (
            <div key={i} className="p-5 flex items-center hover:bg-white/5 transition-colors group">
              <div className="w-24 lg:w-32 shrink-0">
                <p className="font-bold text-white text-sm lg:text-lg">{slot.startTime}</p>
                <p className="text-xs text-slate-400 font-medium">{slot.endTime}</p>
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="font-bold text-white text-sm lg:text-lg group-hover:text-indigo-400 transition-colors truncate">{slot.subject}</h4>
                <div className="flex flex-wrap gap-2 mt-1">
                  <span className="px-2 py-0.5 bg-white/10 rounded text-[10px] font-bold uppercase tracking-wider text-slate-300">{slot.type}</span>
                  <span className="text-xs text-slate-400 font-medium flex items-center gap-1"><Users className="w-3 h-3" /> {slot.facultyName}</span>
                </div>
              </div>
            </div>
          ))}
          {schedule.length === 0 && (
            <div className="p-12 text-center text-slate-400 font-medium">No classes scheduled.</div>
          )}
        </div>
      </div>
    </div>
  );
};
