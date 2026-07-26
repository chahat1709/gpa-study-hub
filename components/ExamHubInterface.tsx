import React, { useState, useEffect } from 'react';
import { GraduationCap, Clock, FileText, BrainCircuit } from 'lucide-react';
import { examService } from '../services/examService';
import { useAuth } from './AuthContext';

import { QuizTab } from './exam/QuizTab';
import { PapersTab } from './exam/PapersTab';
import { GraderTab } from './exam/GraderTab';

type ExamTab = 'QUIZ' | 'PAPERS' | 'GRADER';

const subjects = ['DBMS', 'CYBER SEC', 'AD PYTHON', 'ES', 'MP & MC'];
const units = ['All Units', 'Unit 1: Fundamentals', 'Unit 2: Core Concepts', 'Unit 3: Advanced Topics'];

const ExamHubInterface: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<ExamTab>('QUIZ');
  const [stats, setStats] = useState({ readinessIndex: 0, totalExams: 0, avgPercentage: 0 });

  useEffect(() => {
    if (user?.id) {
      examService.getStudentStats(user.id).then(s => {
        setStats({ readinessIndex: s.readinessIndex, totalExams: s.totalExams, avgPercentage: s.avgPercentage });
      });
    }
  }, [user]);

  return (
    <div className="h-full flex flex-col overflow-y-auto no-scrollbar pb-24 lg:pb-8" style={{ background: 'transparent' }}>
      {/* Top Banner */}
      <div className="bg-slate-900/40 backdrop-blur-xl text-white p-6 lg:p-8 shrink-0 relative overflow-hidden shadow-[0_4px_30px_rgba(0,0,0,0.1)] border-b border-white/10">
        <div className="absolute -right-12 -top-12 w-64 h-64 bg-cyan-500/15 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute right-1/3 -bottom-12 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative z-10">
          <div>
            <div className="flex items-center gap-2 px-3 py-1 bg-cyan-500/20 border border-cyan-400/30 rounded-full text-cyan-300 text-xs font-bold w-fit mb-2 shadow-inner">
              <GraduationCap className="w-4 h-4 text-cyan-400" /> GTU Examination Portal
            </div>
            <h1 className="text-2xl lg:text-3xl font-black tracking-tight text-white drop-shadow-sm">Examinations & Quiz Hub</h1>
            <p className="text-slate-300 text-xs lg:text-sm mt-1 max-w-xl font-medium">
              Practice timed AI mock tests, explore GTU past paper solution keys, and get your handwritten answers evaluated against official GTU marking rubrics.
            </p>
          </div>
          <div className="glass-card bg-slate-900/40 backdrop-blur-xl border border-white/20 p-5 rounded-3xl flex items-center gap-4 shrink-0 min-w-[260px] shadow-[0_0_20px_rgba(34,211,238,0.15)] transform hover:scale-[1.02] hover:shadow-[0_0_25px_rgba(34,211,238,0.25)] transition-all duration-300">
            <div className="relative w-16 h-16 flex items-center justify-center">
              <svg className="w-full h-full transform -rotate-90 filter drop-shadow-[0_0_8px_rgba(16,185,129,0.5)]">
                <circle cx="32" cy="32" r="26" stroke="currentColor" strokeWidth="5" className="text-white/10" fill="transparent" />
                <circle cx="32" cy="32" r="26" stroke="currentColor" strokeWidth="5" className="text-emerald-400" fill="transparent"
                  strokeDasharray={163} strokeDashoffset={163 - (163 * stats.readinessIndex) / 100} strokeLinecap="round" />
              </svg>
              <span className="absolute text-sm font-black text-white">{stats.readinessIndex}%</span>
            </div>
            <div>
              <p className="text-[10px] uppercase font-bold text-slate-300 tracking-wider">GTU Readiness Index</p>
              <p className="text-base font-black text-emerald-400 drop-shadow-sm">{stats.readinessIndex >= 75 ? 'Exam Ready' : 'Needs Practice'}</p>
              <p className="text-[11px] text-slate-300 font-medium mt-0.5">{stats.totalExams} Tests Completed</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl w-full mx-auto p-4 lg:p-8 flex-1 flex flex-col gap-6 relative z-10">
        {/* Navigation Tabs */}
        <div className="flex p-1.5 rounded-2xl gap-1 overflow-x-auto no-scrollbar glass-card bg-slate-900/40 backdrop-blur-xl border border-white/10 shadow-[0_0_15px_rgba(34,211,238,0.05)]" role="tablist">
          {([
            { id: 'QUIZ' as ExamTab, label: 'Timed AI Quizzes', icon: Clock },
            { id: 'PAPERS' as ExamTab, label: 'GTU Past Papers', icon: FileText },
            { id: 'GRADER' as ExamTab, label: 'AI Answer Grader', icon: BrainCircuit },
          ]).map(tab => (
            <button key={tab.id} role="tab" aria-selected={activeTab === tab.id} onClick={() => setActiveTab(tab.id)}
              className={`flex-1 min-w-[130px] py-3 px-4 min-h-[44px] rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all ${activeTab === tab.id ? 'bg-gradient-to-r from-cyan-500 to-blue-500 text-slate-950 shadow-[0_0_15px_rgba(34,211,238,0.3)]' : 'text-slate-300 hover:bg-white/10'}`}>
              <tab.icon className="w-4 h-4" /> {tab.label}
            </button>
          ))}
        </div>

        {activeTab === 'QUIZ' && <QuizTab subjects={subjects} units={units} />}
        {activeTab === 'PAPERS' && <PapersTab />}
        {activeTab === 'GRADER' && <GraderTab subjects={subjects} />}
      </div>
    </div>
  );
};

export default ExamHubInterface;
