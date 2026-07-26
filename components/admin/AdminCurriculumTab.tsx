import React, { useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';

interface AdminCurriculumTabProps {
  subjects: string[];
  onAddSubject: (name: string) => boolean;
  onRemoveSubject: (name: string) => void;
}

export const AdminCurriculumTab: React.FC<AdminCurriculumTabProps> = ({ subjects, onAddSubject, onRemoveSubject }) => {
  const [newSubject, setNewSubject] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanSubject = newSubject.trim();
    if (!cleanSubject) return;
    const added = onAddSubject(cleanSubject);
    if (!added) {
      setError('Subject already exists');
      setTimeout(() => setError(''), 2000);
      return;
    }
    setNewSubject('');
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 lg:space-y-8">
      <div className="glass-card bg-slate-900/60 p-6 lg:p-8 rounded-[32px] border border-white/10 shadow-sm flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="text-center md:text-left">
          <h3 className="text-xl font-black text-white">Subject Matrix</h3>
          <p className="text-sm text-slate-400 font-medium mt-1">Manage active curriculum for current semester.</p>
        </div>
        <form onSubmit={handleSubmit} className="flex gap-2 w-full md:w-auto">
          <input value={newSubject} onChange={e => setNewSubject(e.target.value)} placeholder="New Subject Name" className="flex-1 md:w-64 bg-white/5 border border-white/10 text-white placeholder-slate-500 rounded-xl px-5 py-3 min-h-[44px] text-sm font-bold outline-none focus:ring-2 focus:ring-indigo-500/40" />
          <button type="submit" disabled={!newSubject.trim()} className="bg-indigo-600 text-white px-5 py-3 min-h-[44px] rounded-xl font-bold uppercase tracking-wider text-xs hover:bg-indigo-500 transition-colors shadow-lg disabled:opacity-50 flex items-center justify-center"><Plus className="w-4 h-4" /></button>
        </form>
        {error && <p className="text-xs text-rose-400 font-bold text-center md:text-left">{error}</p>}
      </div>

      <div className="glass-card bg-slate-900/60 rounded-[32px] border border-white/10 shadow-sm overflow-hidden">
        <div className="divide-y divide-white/10">
          {subjects.map(s => (
            <div key={s} className="p-6 flex items-center justify-between hover:bg-white/5 transition-colors group">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-indigo-400 font-bold shrink-0">
                  {s.charAt(0)}
                </div>
                <span className="font-bold text-white">{s}</span>
              </div>
              <button onClick={() => onRemoveSubject(s)} className="p-3 min-h-[44px] min-w-[44px] text-slate-400 hover:text-rose-400 hover:bg-rose-500/20 rounded-lg transition-colors opacity-100 lg:opacity-0 group-hover:opacity-100 flex items-center justify-center"><Trash2 className="w-4 h-4" /></button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
