import React, { useState, useEffect } from 'react';
import {
  Building2, GraduationCap, Bell, Box,
  ShieldCheck, ArrowRight, Clock, AlertCircle,
  Mail, Phone, Award, Target, Book, Calendar, MessageCircle
} from 'lucide-react';
import { campusService } from '../services/campusService';
import { socialService } from '../services/socialService';
import { Notice, DirectoryContact, AppMode, Participant } from '../types';
import { useAuth } from './AuthContext';
import { useToast } from './ToastProvider';
import { attendanceService } from '../services/attendanceService';

interface CampusInterfaceProps {
  onNavigate?: (mode: AppMode) => void;
}

const CampusInterface: React.FC<CampusInterfaceProps> = ({ onNavigate }) => {
  const { user } = useAuth();
  const { error, info } = useToast();
  const [activeTab, setActiveTab] = useState<'DASHBOARD' | 'DIRECTORY' | 'INFO'>('DASHBOARD');

  const [notices, setNotices] = useState<Notice[]>(campusService.getNotices());
  const [faculty, setFaculty] = useState<DirectoryContact[]>([]);
  const [stats, setStats] = useState({
    overall: 0,
    totalClasses: 0,
    attendedClasses: 0,
    subjectWise: [] as any[]
  });

  useEffect(() => {
    setNotices(campusService.getNotices());

    const loadStats = async () => {
      if (user?.id) {
        const studentStats = await attendanceService.getStudentStats(user.id);
        setStats(studentStats);
      }
    };

    const loadFaculty = async () => {
      const data = await campusService.getFacultyForNode(user?.branch, user?.semester);
      setFaculty(data);
    };

    loadStats();
    loadFaculty();
  }, [user]);

  const safeOverall = isNaN(stats.overall) ? 0 : stats.overall;

  const handleInitiateChat = async (contact: DirectoryContact) => {
    if (!user) return;
    info(`Connecting...`);
    try {
      const targetUser: Participant = {
        id: contact.id || `fac-${contact.name.replace(/\s+/g, '-').toLowerCase()}`,
        name: contact.name
      };

      const chatSession = await socialService.startChatWithUser(
        { id: user.id, name: user.name, avatar: user.photoURL },
        targetUser
      );

      if (chatSession && onNavigate) {
        onNavigate(AppMode.SOCIAL);
      }
    } catch (err) {
      error("Failed to connect to direct message node.");
    }
  };

  const DashboardView = () => (
    <div className="p-6 md:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-2 border-b border-white/10">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Welcome, {user?.name || 'Student'}!</h1>
          <p className="text-slate-400 text-xs mt-1">
            {user?.branch || 'Diploma EC'} • Semester {user?.semester || '4'} • GTU Node
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => onNavigate?.(AppMode.PLANNER)} className="px-4 py-2.5 min-h-[44px] bg-white/10 backdrop-blur-md border border-white/15 text-slate-200 rounded-xl text-xs font-semibold hover:bg-white/20 transition-all flex items-center justify-center">
            Planner
          </button>
          <button onClick={() => onNavigate?.(AppMode.PROFILE)} className="px-4 py-2.5 min-h-[44px] bg-indigo-600/80 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold transition-all shadow-lg shadow-indigo-600/20 flex items-center justify-center">
            My Profile
          </button>
        </div>
      </div>

      {/* 3D EXAM HUB HERO BANNER */}
      <div 
        onClick={() => onNavigate?.(AppMode.EXAM_HUB)}
        className="bg-gradient-to-r from-slate-950 via-indigo-950 to-slate-900 text-white p-6 rounded-3xl border border-indigo-500/30 shadow-2xl shadow-indigo-950/50 cursor-pointer transform hover:scale-[1.01] transition-all duration-300 flex justify-between items-center relative overflow-hidden group"
      >
        <div className="absolute -right-8 -top-8 w-40 h-40 bg-indigo-500/20 rounded-full blur-2xl pointer-events-none group-hover:scale-125 transition-transform"></div>
        <div className="relative z-10">
          <div className="flex items-center gap-2 px-3 py-1 bg-indigo-500/20 border border-indigo-400/30 rounded-full text-indigo-300 text-xs font-bold w-fit mb-2">
            <GraduationCap className="w-4 h-4 text-indigo-400" /> GTU Examinations Portal
          </div>
          <h2 className="text-xl font-black text-white">Examinations & Quiz Hub</h2>
          <p className="text-slate-300 text-xs mt-1">Timed AI Mock Tests • GTU Solution Keys • AI Written Answer Grader</p>
        </div>
        <div className="bg-indigo-600 group-hover:bg-indigo-500 text-white p-3.5 min-h-[44px] min-w-[44px] rounded-2xl shadow-lg flex items-center justify-center shrink-0 z-10 transition-colors">
          <ArrowRight className="w-5 h-5" />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Stats & Tools */}
        <div className="space-y-6">
          {/* Attendance Card */}
          <div className="glass-card bg-slate-900/40 backdrop-blur-xl p-6 rounded-2xl border border-white/10 relative overflow-hidden group hover:shadow-[0_0_20px_rgba(34,211,238,0.1)] transition-all">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h3 className="font-semibold text-white">Attendance</h3>
                <p className="text-xs text-slate-400 mt-1">Aggregate Performance</p>
              </div>
              <div className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${safeOverall < 75 ? 'bg-amber-500/10 text-amber-400 border-amber-500/30' : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'}`}>
                {safeOverall < 75 ? 'Low Attendance' : 'Good Standing'}
              </div>
            </div>

            <div className="flex items-end gap-2 mb-4">
              <span className="text-5xl font-bold text-white tracking-tight">{safeOverall}%</span>
              <span className="text-sm text-slate-400 mb-1.5 font-medium">present</span>
            </div>

            <div className="w-full bg-white/10 h-2 rounded-full overflow-hidden mb-4">
              <div className={`h-full rounded-full transition-all duration-1000 ${safeOverall < 75 ? 'bg-amber-400 shadow-[0_0_10px_rgba(251,191,36,0.5)]' : 'bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.5)]'}`} style={{ width: `${safeOverall}%` }}></div>
            </div>

            <button onClick={() => onNavigate?.(AppMode.ATTENDANCE)} className="w-full flex items-center justify-between text-xs font-bold text-cyan-400 hover:text-cyan-300 transition-colors min-h-[44px]">
              <span>View Attendance Details</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          {/* Quick Access Tools Grid */}
          <div className="grid grid-cols-2 gap-3">
            <button onClick={() => onNavigate?.(AppMode.TUTOR)} className="glass-card bg-slate-900/40 backdrop-blur-xl p-5 rounded-2xl border border-white/10 hover:border-cyan-400/40 transition-all text-left group hover:shadow-[0_0_15px_rgba(34,211,238,0.15)]">
              <div className="w-10 h-10 bg-gradient-to-br from-cyan-500/20 to-blue-500/20 text-cyan-400 rounded-xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform shadow-inner">
                <GraduationCap className="w-5 h-5" />
              </div>
              <h4 className="font-semibold text-white text-sm">AI Tutor</h4>
              <p className="text-xs text-slate-400 mt-0.5">Instant help</p>
            </button>

            <button onClick={() => onNavigate?.(AppMode.HOMEWORK)} className="glass-card bg-slate-900/40 backdrop-blur-xl p-5 rounded-2xl border border-white/10 hover:border-amber-400/40 transition-all text-left group hover:shadow-[0_0_15px_rgba(251,191,36,0.15)]">
              <div className="w-10 h-10 bg-gradient-to-br from-amber-500/20 to-orange-500/20 text-amber-400 rounded-xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform shadow-inner">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h4 className="font-semibold text-white text-sm">Scanner</h4>
              <p className="text-xs text-slate-400 mt-0.5">AI problem solver</p>
            </button>
          </div>
        </div>

        {/* Right Column: Notices List */}
        <div className="lg:col-span-2 glass-card bg-slate-900/40 backdrop-blur-xl rounded-2xl border border-white/10 flex flex-col overflow-hidden h-[500px] max-h-[calc(100vh-280px)] lg:max-h-[500px]">
          <div className="p-5 border-b border-white/10 flex justify-between items-center bg-white/5 backdrop-blur-md sticky top-0 z-10">
            <div className="flex items-center gap-2">
              <Bell className="w-4 h-4 text-cyan-400" />
              <h3 className="font-bold text-white text-sm">Official Notices</h3>
            </div>
            <span className="text-xs font-bold text-cyan-300 bg-cyan-500/20 border border-cyan-400/30 px-2.5 py-1 rounded-full shadow-inner">{notices.length} Active</span>
          </div>

          <div className="flex-1 overflow-y-auto p-0 no-scrollbar">
            {notices.length > 0 ? (
              <div className="divide-y divide-white/5">
                {notices.map((notice) => (
                  <div key={notice.id} className="p-5 hover:bg-white/5 transition-colors group">
                    <div className="flex items-start justify-between gap-4 mb-2">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${notice.priority === 'high' ? 'bg-rose-500/10 text-rose-400 border-rose-500/30' :
                        'bg-blue-500/10 text-blue-400 border-blue-500/30'
                        }`}>
                        {notice.priority} Priority
                      </span>
                      <span className="text-xs text-slate-400 font-mono">{new Date(notice.date).toLocaleDateString()}</span>
                    </div>
                    <h4 className="font-bold text-white text-sm mb-1 group-hover:text-cyan-300 transition-colors">{notice.title}</h4>
                    <p className="text-xs text-slate-300 leading-relaxed">{notice.content}</p>
                    <div className="mt-3 flex items-center gap-2 text-xs text-slate-400">
                      <span>By {notice.author}</span>
                      <span>•</span>
                      <span>{notice.category}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-slate-400">
                <Box className="w-10 h-10 mb-3 opacity-30" />
                <p className="text-sm font-medium">No active notices</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="h-full flex flex-col" style={{ background: 'transparent' }}>
      {/* Sub-Header Tabs */}
      <div className="shrink-0 border-b border-white/10 bg-slate-900/40 backdrop-blur-xl">
        <div className="flex px-6 gap-6" role="tablist">
          {[
            { id: 'DASHBOARD', label: 'Dashboard' },
            { id: 'DIRECTORY', label: 'Faculty Directory' },
            { id: 'INFO', label: 'Campus Info' }
          ].map((tab) => (
            <button
              role="tab"
              aria-selected={activeTab === tab.id}
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`py-3 min-h-[44px] flex items-center text-xs font-bold border-b-2 transition-colors ${activeTab === tab.id
                ? 'border-cyan-400 text-cyan-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto no-scrollbar relative">
        {activeTab === 'DASHBOARD' && <div role="tabpanel"><DashboardView /></div>}

        {activeTab === 'DIRECTORY' && (
          <div role="tabpanel" className="p-6 md:p-8 max-w-4xl mx-auto">
            <div className="grid gap-4">
              {faculty.map(contact => (
                <div key={contact.id} className="glass-card bg-slate-900/40 backdrop-blur-xl p-5 rounded-2xl border border-white/10 flex items-center gap-5 hover:border-cyan-400/40 hover:shadow-[0_0_15px_rgba(34,211,238,0.15)] transition-all group">
                  <div className="w-12 h-12 bg-gradient-to-br from-cyan-500/20 to-blue-500/20 border border-cyan-400/30 rounded-full flex items-center justify-center font-bold text-cyan-300 text-lg group-hover:from-cyan-500/30 group-hover:to-blue-500/30 transition-colors shadow-inner">
                    {contact.name.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-bold text-white text-sm">{contact.name}</h4>
                    <p className="text-xs text-slate-400">{contact.designation} • {contact.department}</p>
                    <div className="flex gap-4 mt-2 text-xs text-slate-400">
                      <span className="flex items-center gap-1"><Mail className="w-3 h-3 text-slate-400" /> {contact.email}</span>
                      <span className="flex items-center gap-1"><Phone className="w-3 h-3 text-slate-400" /> {contact.phone}</span>
                    </div>
                  </div>
                  <button onClick={() => handleInitiateChat(contact)} className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-slate-950 px-4 py-2.5 min-h-[44px] flex items-center justify-center rounded-xl text-xs font-bold transition-all shadow-lg shadow-cyan-500/25 active:scale-95">
                    Message
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'INFO' && (
          <div role="tabpanel" className="p-12 max-w-xl mx-auto text-center">
            <div className="w-16 h-16 glass-card bg-slate-900/40 backdrop-blur-xl border border-cyan-400/20 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-[0_0_30px_rgba(34,211,238,0.15)]">
              <Building2 className="w-8 h-8 text-cyan-400" />
            </div>
            <h3 className="font-bold text-white text-lg mb-2">Secure Campus Node</h3>
            <p className="text-xs text-slate-400 leading-relaxed mb-6">
              Authorized access only. Connected to the central University Matrix.
              <br />System version 2.4.0 (Stable).
            </p>
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-500/10 text-emerald-400 rounded-full text-xs font-bold border border-emerald-500/30">
              <ShieldCheck className="w-3 h-3" /> E2EE Enabled
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CampusInterface;
