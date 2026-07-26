import React, { useRef, useState } from 'react';
import { AppMode } from '../types';
import {
  GraduationCap, Library, LogOut, Award,
  User as UserIcon, Loader2, MessageCircle,
  Scan, LayoutDashboard, Target,
  UserCircle, CalendarCheck, Sparkles
} from 'lucide-react';
import { useAuth } from './AuthContext';
import { useToast } from './ToastProvider';

interface SidebarProps { currentMode: AppMode; onModeChange: (mode: AppMode) => void; }

const Sidebar: React.FC<SidebarProps> = ({ currentMode, onModeChange }) => {
  const { user, logout, uploadProfilePicture } = useAuth();
  const { error: showError, success: showSuccess } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);

  const menuItems = [
    { mode: AppMode.CAMPUS, label: 'Overview', icon: LayoutDashboard },
    { mode: AppMode.ATTENDANCE, label: 'Attendance', icon: CalendarCheck },
    { mode: AppMode.PLANNER, label: 'Planner', icon: Target },
    { mode: AppMode.LIBRARY, label: 'Library', icon: Library },
    { mode: AppMode.EXAM_HUB, label: 'Exam Hub', icon: Award, highlight: true },
    { type: 'divider' },
    { mode: AppMode.TUTOR, label: 'AI Tutor', icon: GraduationCap },
    { mode: AppMode.HOMEWORK, label: 'Scanner', icon: Scan },
    { mode: AppMode.SOCIAL, label: 'Network', icon: MessageCircle },
    { type: 'divider' },
    { mode: AppMode.PROFILE, label: 'Identity', icon: UserCircle },
  ];

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setIsUploading(true);
      try {
        await uploadProfilePicture(file);
        showSuccess("Profile updated");
      } catch (err) {
        showError("Upload failed");
      } finally { setIsUploading(false); }
    }
  };

  return (
    <div className="w-[260px] flex flex-col h-full shrink-0 z-50 bg-slate-950/80 backdrop-blur-2xl border-r border-white/10">
      {/* Brand Header with Generated App Logo */}
      <div className="h-16 flex items-center px-5 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl overflow-hidden p-0.5 bg-gradient-to-tr from-cyan-400 via-amber-400 to-emerald-400 shadow-lg shadow-cyan-500/20 shrink-0 transform hover:rotate-6 transition-transform">
            <img src="/gpa_hub_logo.png" className="w-full h-full object-cover rounded-[10px]" alt="GPA Study Hub Logo" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h1 className="font-bold text-base text-white tracking-tight leading-none">GPA Hub</h1>
              <span className="px-1.5 py-0.5 bg-amber-400/20 text-amber-300 border border-amber-400/40 text-[9px] font-extrabold rounded-full tracking-wider uppercase pulse-gold">
                GTU
              </span>
            </div>
            <p className="text-[10px] text-cyan-300 font-medium uppercase tracking-wider mt-0.5">Academic Portal</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-6 space-y-1.5 overflow-y-auto no-scrollbar">
        {menuItems.map((item, idx) => {
          if (item.type === 'divider') {
            return <div key={idx} className="my-3 border-t border-white/10" />;
          }

          const Icon = (item.icon as any);
          const isActive = currentMode === item.mode;

          return (
            <button
              key={item.mode}
              onClick={() => item.mode && onModeChange(item.mode)}
              className={`w-full flex items-center justify-between px-3.5 py-3 rounded-xl transition-all duration-200 group active:scale-95 ${isActive
                  ? 'text-white font-bold bg-gradient-to-r from-cyan-500/20 via-cyan-500/10 to-transparent border border-cyan-400/40 shadow-lg shadow-cyan-500/15 pulse-cyan'
                  : 'text-slate-400 hover:text-white font-medium hover:bg-white/5 border border-transparent'
                }`}
            >
              <div className="flex items-center gap-3">
                <Icon className={`w-4 h-4 transition-transform group-hover:scale-110 ${isActive ? 'text-cyan-400' : 'text-slate-400 group-hover:text-slate-200'}`} />
                <span className="text-sm tracking-tight">{item.label}</span>
              </div>
              {item.highlight && (
                <span className="flex items-center gap-0.5 px-1.5 py-0.5 bg-indigo-500/20 text-indigo-300 border border-indigo-400/30 text-[9px] font-bold rounded-full">
                  <Sparkles className="w-2.5 h-2.5 text-amber-300" /> New
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* User Identity Footer */}
      <div className="p-4 border-t border-white/10 bg-white/5">
        <div className="flex items-center gap-3 p-2 rounded-xl transition-all cursor-pointer group hover:bg-white/5 border border-transparent hover:border-white/10" onClick={() => fileInputRef.current?.click()}>
          <div className="w-10 h-10 rounded-full overflow-hidden shrink-0 relative border-2 border-cyan-400/30 shadow-md group-hover:border-cyan-400 transition-colors">
            {isUploading ? (
              <div className="w-full h-full flex items-center justify-center bg-slate-900">
                <Loader2 className="w-4 h-4 animate-spin text-cyan-400" />
              </div>
            ) : user?.photoURL ? (
              <img src={user.photoURL} className="w-full h-full object-cover" alt="ID" />
            ) : (<div className="w-full h-full flex items-center justify-center bg-slate-900"><UserIcon className="w-4 h-4 text-slate-400" /></div>)}
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-semibold text-xs truncate text-white group-hover:text-cyan-300 transition-colors">{user?.name}</p>
            <p className="text-[11px] text-slate-400 truncate font-mono">{user?.enrollmentNumber || user?.role}</p>
          </div>
          <button onClick={(e) => { e.stopPropagation(); logout(); }} className="p-3 min-h-[48px] min-w-[48px] text-slate-400 hover:text-rose-400 transition-colors rounded-xl hover:bg-rose-500/10 flex items-center justify-center" aria-label="Log out">
            <LogOut className="w-4 h-4" />
          </button>
          <input
            type="file"
            ref={fileInputRef}
            style={{ display: 'none' }}
            accept="image/*"
            onChange={handleFileChange}
          />
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
