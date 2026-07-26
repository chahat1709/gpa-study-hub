
import React, { useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { attendanceService } from '../services/attendanceService';
import { TimeSlot } from '../types';
import {
  CheckCircle2, XCircle, Clock,
  ChevronRight, CalendarDays, BarChart3
} from 'lucide-react';

const AttendanceInterface: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'OVERVIEW' | 'TIMETABLE'>('OVERVIEW');
  const [stats, setStats] = useState({
    overall: 0,
    totalClasses: 0,
    attendedClasses: 0,
    subjectWise: [] as { subject: string, percentage: number, attended: number, total: number }[]
  });

  const days = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];
  // Provide safe fallback and ensure Sunday (0) maps securely or shows generic state
  const dayIndex = new Date().getDay() - 1;
  const safeDay = days[dayIndex >= 0 ? dayIndex : 6]; // Default to SUN if calculation weird, but logic below handles it

  const [selectedDay, setSelectedDay] = useState<string>(
    (dayIndex >= 0 && dayIndex < 5) ? days[dayIndex]! : 'MON' // Default to MON if weekend
  );
  const [dailySchedule, setDailySchedule] = useState<TimeSlot[]>([]);

  const [currentSlot, setCurrentSlot] = useState<TimeSlot | null>(null);

  useEffect(() => {
    const loadData = async () => {
      const schedule = await attendanceService.getDailySchedule(selectedDay);
      setDailySchedule(schedule);
      
      const slot = await attendanceService.getCurrentSlot();
      setCurrentSlot(slot);

      if (user?.id) {
        const userStats = await attendanceService.getStudentStats(user.id);
        setStats(userStats);
      }
    };
    loadData();
  }, [selectedDay, user?.id]);

  // Safety for NaN
  const displayPercentage = stats.totalClasses > 0 ? stats.overall : 0;

  return (
    <div className="h-full flex flex-col bg-transparent text-white">
      {/* Header */}
      <div className="bg-white/5 border-b border-white/10 px-6 py-4 flex justify-between items-center shrink-0">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight">Attendance</h1>
        </div>
        <div className="flex bg-white/10 rounded-lg p-1" role="tablist">
          <button
            role="tab"
            aria-selected={activeTab === 'OVERVIEW'}
            onClick={() => setActiveTab('OVERVIEW')}
            className={`px-4 py-2 min-h-[44px] rounded-md text-xs font-bold transition-all flex items-center justify-center ${activeTab === 'OVERVIEW' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-300 hover:text-white'}`}
          >
            Stats
          </button>
          <button
            role="tab"
            aria-selected={activeTab === 'TIMETABLE'}
            onClick={() => setActiveTab('TIMETABLE')}
            className={`px-4 py-2 min-h-[44px] rounded-md text-xs font-bold transition-all flex items-center justify-center ${activeTab === 'TIMETABLE' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-300 hover:text-white'}`}
          >
            Schedule
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto no-scrollbar p-6">
        {activeTab === 'OVERVIEW' && (
          <div role="tabpanel" className="max-w-4xl mx-auto space-y-6 animate-fade-in">
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="glass-card p-6 rounded-xl border border-white/10 text-white shadow-2xl">
                <p className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">Aggregate</p>
                <div className="flex items-baseline gap-2">
                  <span className={`text-4xl font-bold ${displayPercentage >= 75 ? 'text-emerald-400' : 'text-amber-400'}`}>{displayPercentage}%</span>
                  <span className="text-sm text-slate-400">attendance</span>
                </div>
              </div>
              <div className="glass-card p-6 rounded-xl border border-white/10 text-white shadow-2xl">
                <p className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">Total Sessions</p>
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl font-bold text-white">{stats.totalClasses}</span>
                  <span className="text-sm text-slate-400">classes</span>
                </div>
              </div>
              <div className="glass-card p-6 rounded-xl border border-white/10 text-white shadow-2xl">
                <p className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">Attended</p>
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl font-bold text-indigo-400">{stats.attendedClasses}</span>
                  <span className="text-sm text-slate-400">present</span>
                </div>
              </div>
            </div>

            {/* Subject Table */}
            <div className="glass-card rounded-xl border border-white/10 text-white shadow-2xl overflow-hidden">
              <div className="px-6 py-4 border-b border-white/10 bg-white/5">
                <h3 className="font-semibold text-white text-sm">Subject Breakdown</h3>
              </div>
              <div className="divide-y divide-white/10">
                {stats.subjectWise.map((sub) => (
                  <div key={sub.subject} className="p-4 flex items-center justify-between hover:bg-white/5 transition-colors">
                    <div className="w-1/3">
                      <p className="font-semibold text-white text-sm">{sub.subject}</p>
                      <p className="text-xs text-slate-400 mt-0.5">{sub.attended}/{sub.total} sessions</p>
                    </div>
                    <div className="w-1/3 flex flex-col justify-center px-4">
                      <div className="w-full bg-white/10 h-2 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${sub.percentage >= 75 ? 'bg-emerald-400' : sub.percentage >= 60 ? 'bg-amber-400' : 'bg-rose-400'}`}
                          style={{ width: `${sub.percentage}%` }}
                        />
                      </div>
                    </div>
                    <div className="w-1/6 text-right">
                      <span className={`text-sm font-bold ${sub.percentage >= 75 ? 'text-emerald-400' : sub.percentage >= 60 ? 'text-amber-400' : 'text-rose-400'}`}>
                        {sub.percentage}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'TIMETABLE' && (
          <div role="tabpanel" className="max-w-3xl mx-auto space-y-6 animate-fade-in">
            {/* Day Tabs */}
            <div className="flex border-b border-white/10 overflow-x-auto no-scrollbar" role="tablist">
              {days.map(d => (
                <button
                  role="tab"
                  aria-selected={selectedDay === d}
                  key={d}
                  onClick={() => setSelectedDay(d)}
                  className={`px-4 py-3 min-h-[44px] flex items-center justify-center text-xs font-bold transition-all relative ${selectedDay === d
                      ? 'text-indigo-400'
                      : 'text-slate-400 hover:text-white'
                    }`}
                >
                  {d}
                  {selectedDay === d && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-indigo-400"></div>}
                </button>
              ))}
            </div>

            {/* Vertical Timeline */}
            <div className="space-y-0 relative pl-4">
              {/* Vertical Line */}
              <div className="absolute left-[27px] top-4 bottom-4 w-px bg-white/10"></div>

              {dailySchedule.length > 0 ? dailySchedule.map((slot, index) => {
                const isNow = currentSlot?.id === slot.id;

                return (
                  <div key={index} className={`relative flex gap-6 pb-8 group ${slot.type === 'RECESS' ? 'opacity-60' : ''}`}>
                    {/* Dot */}
                    <div className={`w-3 h-3 rounded-full border-2 mt-1.5 z-10 shrink-0 ${isNow ? 'bg-indigo-400 border-indigo-200 shadow-[0_0_0_4px_rgba(129,140,248,0.3)]' :
                        'bg-slate-900 border-white/30 group-hover:border-indigo-400'
                      } transition-colors`}></div>

                    {/* Card */}
                    <div className={`flex-1 p-4 rounded-xl border transition-all ${isNow ? 'glass-card border-indigo-500/50 shadow-lg shadow-indigo-600/20 text-white' :
                        slot.type === 'RECESS' ? 'bg-white/5 border-white/10 border-dashed text-slate-300' :
                          'glass-card border-white/10 hover:border-indigo-400/30 text-white'
                      }`}>
                      <div className="flex justify-between items-start">
                        <div>
                          <span className="text-xs font-mono font-medium text-slate-400">{slot.startTime} - {slot.endTime}</span>
                          <h3 className="text-base font-bold text-white mt-0.5">{slot.subject}</h3>
                          {slot.type !== 'RECESS' && (
                            <p className="text-xs text-slate-300 mt-1">
                              {slot.type} • {slot.facultyName} {slot.batch !== 'ALL' && `• Batch ${slot.batch}`}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              }) : (
                <div className="text-center py-12 text-slate-400 pl-8">
                  <p className="font-medium text-sm">No classes scheduled</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AttendanceInterface;
