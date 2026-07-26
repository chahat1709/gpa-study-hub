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
    <div className="w-[280px] flex flex-col h-full shrink-0 z-50 bg-[rgba(15,23,42,0.8)] backdrop-blur-[30px] border-r border-white/10 shadow-[4px_0_24px_rgba(0,0,0,0.2)]">
      {/* Brand Header */}
      <div className="h-20 flex items-center px-6 border-b border-white/10 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-stitch-cyan/10 rounded-bl-full -mr-12 -mt-12 shadow-[0_0_30px_rgba(47,217,244,0.1)]"></div>
        <div className="flex items-center gap-4 relative z-10">
          <div className="w-12 h-12 rounded-[16px] overflow-hidden p-0.5 bg-gradient-to-br from-stitch-primary to-stitch-secondary shadow-lg shadow-stitch-primary-container/30 shrink-0 transform hover:rotate-3 transition-transform">
            <img src="/gpa_hub_logo.png" className="w-full h-full object-cover rounded-[14px]" alt="GPA Study Hub Logo" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-display font-extrabold text-lg text-white tracking-tight leading-none">GPA Hub</h1>
              <span className="px-2 py-0.5 bg-amber-400/20 text-amber-300 border border-amber-400/40 text-[9px] font-extrabold rounded-full tracking-wider uppercase">
                GTU
              </span>
            </div>
            <p className="text-[11px] text-stitch-tertiary font-semibold uppercase tracking-wider mt-1">Academic Portal</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-8 space-y-2 overflow-y-auto no-scrollbar">
        {menuItems.map((item, idx) => {
          if (item.type === 'divider') {
            return <div key={idx} className="my-4 border-t border-white/5" />;
          }

          const Icon = (item.icon as any);
          const isActive = currentMode === item.mode;

          return (
            <button
              key={item.mode}
              onClick={() => item.mode && onModeChange(item.mode)}
              className={`w-full flex items-center justify-between px-4 py-3.5 rounded-[12px] transition-all duration-300 group active:scale-95 ${isActive
                  ? 'text-white font-bold bg-stitch-primary-container/30 border border-stitch-primary-container/50 shadow-inner shadow-stitch-primary-container/20'
                  : 'text-slate-400 hover:text-white font-medium hover:bg-white/5 border border-transparent'
                }`}
            >
              <div className="flex items-center gap-4">
                <Icon className={`w-5 h-5 transition-transform group-hover:scale-110 ${isActive ? 'text-stitch-primary drop-shadow-[0_0_8px_rgba(195,192,255,0.5)]' : 'text-slate-400 group-hover:text-stitch-primary'}`} />
                <span className="text-sm tracking-tight">{item.label}</span>
              </div>
              {item.highlight && (
                <span className="flex items-center gap-1 px-2 py-0.5 bg-amber-500/20 text-amber-300 border border-amber-400/30 text-[10px] font-bold rounded-full">
                  <Sparkles className="w-3 h-3 text-amber-300" /> New
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
