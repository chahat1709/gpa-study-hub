import React from 'react';
import { Megaphone, Database, Activity, BookPlus } from 'lucide-react';
import { Notice } from '../../types';

interface AdminConsoleTabProps {
  noticeTitle: string;
  setNoticeTitle: (v: string) => void;
  noticeContent: string;
  setNoticeContent: (v: string) => void;
  noticePriority: 'low' | 'medium' | 'high';
  setNoticePriority: (v: 'low' | 'medium' | 'high') => void;
  onPostNotice: (e: React.FormEvent) => void;
  notices: Notice[];
  subjects: string[];
  resourceCount: number;
}

export const AdminConsoleTab: React.FC<AdminConsoleTabProps> = ({
  noticeTitle,
  setNoticeTitle,
  noticeContent,
  setNoticeContent,
  noticePriority,
  setNoticePriority,
  onPostNotice,
  notices,
  subjects,
  resourceCount,
}) => (
  <>
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
      {[
        {
          label: 'Notices',
          value: notices.length,
          icon: Megaphone,
          color: 'text-blue-400',
          bg: 'bg-blue-500/20',
        },
        {
          label: 'Subjects',
          value: subjects.length,
          icon: BookPlus,
          color: 'text-indigo-400',
          bg: 'bg-indigo-500/20',
        },
        {
          label: 'Resources',
          value: resourceCount,
          icon: Database,
          color: 'text-emerald-400',
          bg: 'bg-emerald-500/20',
        },
        {
          label: 'System',
          value: '98%',
          icon: Activity,
          color: 'text-amber-400',
          bg: 'bg-amber-500/20',
        },
      ].map((stat, i) => (
        <div
          key={i}
          className="glass-card bg-slate-900/60 p-5 rounded-[24px] border border-white/10 shadow-sm hover:shadow-md transition-all group"
        >
          <div className="flex justify-between items-start mb-3">
            <div
              className={`p-3 rounded-2xl ${stat.bg} group-hover:scale-110 transition-transform`}
            >
              <stat.icon className={`w-5 h-5 ${stat.color}`} />
            </div>
            <span className="text-xl font-black text-white">{stat.value}</span>
          </div>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            {stat.label}
          </p>
        </div>
      ))}
    </div>

    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
      <div className="lg:col-span-2 glass-card bg-slate-900/60 rounded-[32px] border border-white/10 p-6 lg:p-8 shadow-sm">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-indigo-500/20 rounded-xl">
            <Megaphone className="w-5 h-5 text-indigo-400" />
          </div>
          <h3 className="font-bold text-white text-lg">Broadcast Notice</h3>
        </div>
        <form onSubmit={onPostNotice} className="space-y-4 lg:space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Title
              </label>
              <input
                value={noticeTitle}
                onChange={e => setNoticeTitle(e.target.value)}
                className="w-full bg-white/5 border border-white/10 text-white rounded-xl px-4 py-3 text-sm font-bold outline-none focus:ring-2 focus:ring-indigo-500/40"
                placeholder="e.g. Exam Schedule"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Priority
              </label>
              <select
                value={noticePriority}
                onChange={e => setNoticePriority(e.target.value as 'low' | 'medium' | 'high')}
                className="w-full bg-slate-900 border border-white/10 text-white rounded-xl px-4 py-3 text-sm font-bold outline-none focus:ring-2 focus:ring-indigo-500/40"
              >
                <option value="low" className="bg-slate-900 text-white">
                  Low (Info)
                </option>
                <option value="medium" className="bg-slate-900 text-white">
                  Medium (Standard)
                </option>
                <option value="high" className="bg-slate-900 text-white">
                  High (Urgent)
                </option>
              </select>
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Message Content
            </label>
            <textarea
              rows={3}
              value={noticeContent}
              onChange={e => setNoticeContent(e.target.value)}
              className="w-full bg-white/5 border border-white/10 text-white placeholder-slate-500 rounded-xl px-4 py-3 text-sm font-medium outline-none focus:ring-2 focus:ring-indigo-500/40 resize-none"
              placeholder="Type notice details..."
            />
          </div>
          <button
            type="submit"
            className="w-full md:w-auto bg-indigo-600 text-white px-8 py-3 min-h-[44px] rounded-xl text-sm font-bold uppercase tracking-wider shadow-lg shadow-indigo-600/30 hover:bg-indigo-500 transition-all active:scale-95"
          >
            Publish to Campus
          </button>
        </form>
      </div>

      <div className="glass-card bg-slate-900/60 rounded-[32px] border border-white/10 p-6 shadow-sm flex flex-col h-[400px]">
        <div className="flex items-center justify-between mb-6 pb-4 border-b border-white/10">
          <h3 className="font-bold text-white">Recent Notices</h3>
          <span className="bg-white/10 text-slate-300 px-2 py-1 rounded text-xs font-bold">
            {notices.length}
          </span>
        </div>
        <div className="flex-1 overflow-y-auto space-y-3 no-scrollbar pr-2">
          {notices.map(n => (
            <div
              key={n.id}
              className="p-4 bg-white/5 rounded-2xl border border-white/10 group hover:bg-white/10 hover:shadow-md transition-all"
            >
              <div className="flex justify-between items-start mb-1">
                <span
                  className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded ${n.priority === 'high' ? 'bg-rose-500/20 text-rose-400' : 'bg-blue-500/20 text-blue-400'}`}
                >
                  {n.priority}
                </span>
                <span className="text-[10px] text-slate-400 font-bold">
                  {new Date(n.date).toLocaleDateString()}
                </span>
              </div>
              <h4 className="font-bold text-white text-sm mt-2">{n.title}</h4>
              <p className="text-xs text-slate-300 line-clamp-2 mt-1">{n.content}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  </>
);
