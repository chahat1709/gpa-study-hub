import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from './AuthContext';
import {
  Users, Megaphone, FileUp, BookPlus,
  LogOut, LayoutDashboard,
  Bell, CheckCircle2,
  Database, Plus, Trash2, Globe2,
  ShieldCheck, Loader2, CalendarCheck,
  Search, Filter, FileText, Upload, Layers,
  X, ChevronDown, Download, AlertTriangle,
  Server, Wifi, Cpu, Activity, Zap,
  GraduationCap, Award, Sparkles, Clock, BarChart3
} from 'lucide-react';
import { useToast } from './ToastProvider';
import { campusService } from '../services/campusService';
import { resourceService } from '../services/resourceService';
import { academicService } from '../services/academicService';
import { attendanceService } from '../services/attendanceService';
import { examService, Quiz, QuizQuestion, ExamResult } from '../services/examService';
import { TimeSlot, LibraryResource } from '../types';
import { useDebounce } from '../hooks/useDebounce';

import { SystemDiagnostics } from './admin/SystemDiagnostics';
import { AdminConsoleTab } from './admin/AdminConsoleTab';
import { AdminClassroomTab } from './admin/AdminClassroomTab';
import { AdminVaultTab } from './admin/AdminVaultTab';
import { AdminCurriculumTab } from './admin/AdminCurriculumTab';
import { AdminExamsTab } from './admin/AdminExamsTab';

type AdminTab = 'CONSOLE' | 'VAULT' | 'CURRICULUM' | 'CLASSROOM' | 'EXAMS';

const AdminDashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const { success, error, info } = useToast();

  const [activeTab, setActiveTab] = useState<AdminTab>('CONSOLE');
  const [showDiagnostics, setShowDiagnostics] = useState(false);

  // Console State
  const [noticeTitle, setNoticeTitle] = useState('');
  const [noticeContent, setNoticeContent] = useState('');
  const [noticePriority, setNoticePriority] = useState<'low' | 'medium' | 'high'>('medium');

  // Vault State
  const [isUploading, setIsUploading] = useState(false);
  const [uploadSubject, setUploadSubject] = useState('');
  const [uploadCategory, setUploadCategory] = useState('');
  const [uploadSection, setUploadSection] = useState('All');
  const [uploadUnit, setUploadUnit] = useState('');
  const [uploadYear, setUploadYear] = useState('');
  const [uploadDeadline, setUploadDeadline] = useState('');
  const [recentUploads, setRecentUploads] = useState<LibraryResource[]>([]);
  const [vaultSearch, setVaultSearch] = useState('');

  // Classroom State
  const [activeSlot, setActiveSlot] = useState<TimeSlot | undefined>(undefined);
  const [selectedDay, setSelectedDay] = useState('MON');
  const [attendanceStatus, setAttendanceStatus] = useState<'idle' | 'marking' | 'marked'>('idle');

  // Curriculum State
  const [subjects, setSubjects] = useState<string[]>(academicService.getSubjects());
  const categories = academicService.getCategories();
  const notices = campusService.getNotices();

  // Exams State
  const [pubTitle, setPubTitle] = useState('');
  const [pubSubject, setPubSubject] = useState('DBMS');
  const [pubUnit, setPubUnit] = useState('All Units');
  const [pubDuration, setPubDuration] = useState(15);
  const [pubQuestions, setPubQuestions] = useState<QuizQuestion[]>([]);
  const [isGeneratingQuiz, setIsGeneratingQuiz] = useState(false);
  const [isPublishingQuiz, setIsPublishingQuiz] = useState(false);
  const [publishedQuizzes, setPublishedQuizzes] = useState<Quiz[]>([]);

  // Question Builder State
  const [qText, setQText] = useState('');
  const [qOpt0, setQOpt0] = useState('');
  const [qOpt1, setQOpt1] = useState('');
  const [qOpt2, setQOpt2] = useState('');
  const [qOpt3, setQOpt3] = useState('');
  const [qCorrect, setQCorrect] = useState(0);
  const [qExplanation, setQExplanation] = useState('');

  // Gradebook State
  const [gradebookResults, setGradebookResults] = useState<ExamResult[]>([]);
  const [gradebookSearch, setGradebookSearch] = useState('');
  const [gradebookSubjectFilter, setGradebookSubjectFilter] = useState('ALL');

  // Effects
  useEffect(() => {
    const checkSlot = async () => {
      if (!document.hidden) {
        const slot = await attendanceService.getCurrentSlot();
        setActiveSlot(slot || undefined);
      }
    };
    checkSlot();
    const interval = setInterval(checkSlot, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (activeTab === 'VAULT') {
      const load = () => {
        if (!document.hidden) setRecentUploads(resourceService.getAllResources());
      };
      load();
      const interval = setInterval(load, 5000);
      return () => clearInterval(interval);
    }
  }, [activeTab]);

  useEffect(() => {
    if (activeTab === 'EXAMS') {
      const loadExamsData = async () => {
        const quizzes = await examService.getOfficialQuizzes();
        setPublishedQuizzes(quizzes);
        const results = await examService.getAllExamResults();
        setGradebookResults(results);
      };
      loadExamsData();
    }
  }, [activeTab]);

  // Handlers
  const handlePostNotice = (e: React.FormEvent) => {
    e.preventDefault();
    if (!noticeTitle || !noticeContent) return;
    campusService.postNotice({
      title: noticeTitle, content: noticeContent, priority: noticePriority,
      author: user?.name || 'Faculty', category: 'General', scope: 'COLLEGE'
    });
    setNoticeTitle('');
    setNoticeContent('');
    success("Notice Broadcasted");
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!uploadSubject || !uploadCategory) {
      error("Select Subject & Category first");
      return;
    }
    setIsUploading(true);
    try {
      await resourceService.uploadResource(
        user?.branch || 'General', user?.semester || '1', uploadSection,
        uploadSubject, uploadCategory, file,
        { unit: uploadUnit, academicYear: uploadYear, deadline: uploadDeadline }
      );
      success("Resource Uploaded");
      setUploadUnit(''); setUploadYear(''); setUploadDeadline('');
      setRecentUploads(resourceService.getAllResources());
    } catch {
      error("Upload failed");
    } finally {
      setIsUploading(false);
    }
  };

  const handleDeleteResource = async (id: string) => {
    if (window.confirm("Permanently delete this resource?")) {
      setRecentUploads(prev => prev.filter(r => r.id !== id));
      try {
        await resourceService.deleteResource(id);
        success("Deleted");
        setRecentUploads(resourceService.getAllResources());
      } catch {
        error("Deletion failed");
        setRecentUploads(resourceService.getAllResources());
      }
    }
  };

  const handleAddSubject = (name: string): boolean => {
    const exists = subjects.some(s => s.toLowerCase() === name.toLowerCase());
    if (exists) return false;
    academicService.addSubject(name);
    setSubjects(academicService.getSubjects());
    success("Subject Added");
    return true;
  };

  const handleRemoveSubject = (name: string) => {
    academicService.removeSubject(name);
    setSubjects(academicService.getSubjects());
  };

  const handleAddQuestionManual = (e: React.FormEvent) => {
    e.preventDefault();
    if (!qText.trim() || !qOpt0.trim() || !qOpt1.trim() || !qOpt2.trim() || !qOpt3.trim()) {
      error("Please fill in question prompt and all 4 options.");
      return;
    }
    const newQ: QuizQuestion = {
      id: `q-${Date.now()}-${pubQuestions.length + 1}`,
      question: qText.trim(),
      options: [qOpt0.trim(), qOpt1.trim(), qOpt2.trim(), qOpt3.trim()],
      correctAnswer: qCorrect,
      explanation: qExplanation.trim() || 'Official GTU course answer explanation.'
    };
    setPubQuestions(prev => [...prev, newQ]);
    setQText(''); setQOpt0(''); setQOpt1(''); setQOpt2(''); setQOpt3('');
    setQExplanation('');
    success("Question added to test paper!");
  };

  const handleGenerateAIQuestions = async () => {
    if (!pubSubject) { error("Select a subject first."); return; }
    setIsGeneratingQuiz(true);
    info(`Generating AI Quiz Questions for ${pubSubject}...`);
    try {
      const quiz = await examService.generateAIQuiz(pubSubject, pubUnit, 5);
      if (quiz.questions && quiz.questions.length > 0) {
        setPubQuestions(quiz.questions);
        if (!pubTitle) setPubTitle(quiz.title);
        success(`Generated ${quiz.questions.length} questions successfully!`);
      }
    } catch {
      error("AI generation failed. Loading fallback questions.");
      const fallback = examService.getFallbackQuiz(pubSubject, pubUnit);
      setPubQuestions(fallback.questions);
    } finally {
      setIsGeneratingQuiz(false);
    }
  };

  const handlePublishOfficialQuiz = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pubTitle.trim() || !pubSubject) { error("Enter exam title and select subject."); return; }
    if (pubQuestions.length === 0) { error("Add at least 1 question to publish test."); return; }
    setIsPublishingQuiz(true);
    try {
      const created = await examService.publishQuiz({
        title: pubTitle.trim(), subject: pubSubject, unit: pubUnit,
        durationMinutes: pubDuration, questions: pubQuestions,
        createdBy: user?.name || 'Faculty Admin'
      });
      setPublishedQuizzes(prev => [created, ...prev]);
      setPubTitle(''); setPubQuestions([]);
      success("Exam Paper Published to Campus!");
    } catch {
      error("Failed to publish quiz.");
    } finally {
      setIsPublishingQuiz(false);
    }
  };

  const handleDeleteOfficialQuiz = async (id: string) => {
    if (window.confirm("Delete this published exam?")) {
      setPublishedQuizzes(prev => prev.filter(q => q.id !== id));
      await examService.deleteOfficialQuiz(id);
      success("Exam paper removed.");
    }
  };

  const handleMarkAttendance = async () => {
    if (activeSlot) {
      if (user?.role === 'FACULTY' && user.facultyShortCode) {
        if (user.facultyShortCode !== activeSlot.facultyName) {
          error(`Security Alert: Class belongs to ${activeSlot.facultyName}. You are authorized as ${user.facultyShortCode}.`);
          return;
        }
      }
      setAttendanceStatus('marked');
      success(`Attendance Logged: ${activeSlot.subject}`);
      try {
        const today = new Date().toISOString().split('T')[0] ?? '';
        const studentIds = (user?.role === 'STUDENT' && user.id) ? [user.id] : [];
        await attendanceService.markAttendance(activeSlot.id, activeSlot.subject, today, studentIds, 60);
      } catch {
        setAttendanceStatus('idle');
        error("Sync Failed: Retrying in background...");
      }
    } else {
      info("No active class");
    }
  };

  const debouncedVaultSearch = useDebounce(vaultSearch, 300);
  const filteredUploads = recentUploads.filter(r =>
    r.title.toLowerCase().includes(debouncedVaultSearch.toLowerCase()) ||
    (r.subject && r.subject.toLowerCase().includes(debouncedVaultSearch.toLowerCase())) ||
    (r.category && r.category.toLowerCase().includes(debouncedVaultSearch.toLowerCase()))
  );

  const classOverview = examService.getClassReadinessOverview(gradebookResults);
  const filteredGradebook = gradebookResults.filter(r => {
    const matchesSearch = r.studentName.toLowerCase().includes(gradebookSearch.toLowerCase()) ||
      r.subject.toLowerCase().includes(gradebookSearch.toLowerCase()) ||
      r.quizTitle.toLowerCase().includes(gradebookSearch.toLowerCase());
    const matchesSubject = gradebookSubjectFilter === 'ALL' || r.subject === gradebookSubjectFilter;
    return matchesSearch && matchesSubject;
  });

  const TAB_ITEMS: { id: AdminTab; label: string; icon: React.FC<{className?: string}> }[] = [
    { id: 'CONSOLE', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'CLASSROOM', label: 'Classroom', icon: CalendarCheck },
    { id: 'VAULT', label: 'Upload Vault', icon: FileUp },
    { id: 'CURRICULUM', label: 'Curriculum', icon: BookPlus },
    { id: 'EXAMS', label: 'Exams & Gradebook', icon: GraduationCap },
  ];

  const renderTab = () => {
    switch (activeTab) {
      case 'CONSOLE':
        return <AdminConsoleTab noticeTitle={noticeTitle} setNoticeTitle={setNoticeTitle}
          noticeContent={noticeContent} setNoticeContent={setNoticeContent}
          noticePriority={noticePriority} setNoticePriority={setNoticePriority}
          onPostNotice={handlePostNotice} notices={notices} subjects={subjects}
          resourceCount={recentUploads.length} />;
      case 'CLASSROOM':
        return <AdminClassroomTab activeSlot={activeSlot} selectedDay={selectedDay}
          setSelectedDay={setSelectedDay} user={user} attendanceStatus={attendanceStatus}
          onMarkAttendance={handleMarkAttendance} />;
      case 'VAULT':
        return <AdminVaultTab subjects={subjects} categories={categories}
          uploadSubject={uploadSubject} setUploadSubject={setUploadSubject}
          uploadCategory={uploadCategory} setUploadCategory={setUploadCategory}
          uploadUnit={uploadUnit} setUploadUnit={setUploadUnit}
          uploadYear={uploadYear} setUploadYear={setUploadYear}
          uploadDeadline={uploadDeadline} setUploadDeadline={setUploadDeadline}
          isUploading={isUploading} onFileUpload={handleFileUpload}
          vaultSearch={vaultSearch} setVaultSearch={setVaultSearch}
          filteredUploads={filteredUploads} onDeleteResource={handleDeleteResource}
          onRefresh={() => setRecentUploads(resourceService.getAllResources())} />;
      case 'CURRICULUM':
        return <AdminCurriculumTab subjects={subjects} onAddSubject={handleAddSubject} onRemoveSubject={handleRemoveSubject} />;
      case 'EXAMS':
        return <AdminExamsTab subjects={subjects}
          pubTitle={pubTitle} setPubTitle={setPubTitle} pubSubject={pubSubject} setPubSubject={setPubSubject}
          pubUnit={pubUnit} setPubUnit={setPubUnit} pubDuration={pubDuration} setPubDuration={setPubDuration}
          pubQuestions={pubQuestions} setPubQuestions={setPubQuestions}
          isGeneratingQuiz={isGeneratingQuiz} isPublishingQuiz={isPublishingQuiz}
          onGenerateAI={handleGenerateAIQuestions} onPublish={handlePublishOfficialQuiz}
          publishedQuizzes={publishedQuizzes} onDeleteQuiz={handleDeleteOfficialQuiz}
          classOverview={classOverview} gradebookSearch={gradebookSearch} setGradebookSearch={setGradebookSearch}
          gradebookSubjectFilter={gradebookSubjectFilter} setGradebookSubjectFilter={setGradebookSubjectFilter}
          filteredGradebook={filteredGradebook}
          qText={qText} setQText={setQText} qOpt0={qOpt0} setQOpt0={setQOpt0}
          qOpt1={qOpt1} setQOpt1={setQOpt1} qOpt2={qOpt2} setQOpt2={setQOpt2}
          qOpt3={qOpt3} setQOpt3={setQOpt3} qCorrect={qCorrect} setQCorrect={setQCorrect}
          qExplanation={qExplanation} setQExplanation={setQExplanation}
          onAddQuestion={handleAddQuestionManual} />;
    }
  };

  return (
    <div className="flex h-[100dvh] w-screen bg-slate-950/50 overflow-hidden font-sans text-white">
      {showDiagnostics && <SystemDiagnostics onClose={() => setShowDiagnostics(false)} />}

      {/* SIDEBAR (Desktop) */}
      <aside className="hidden lg:flex w-[280px] border-r border-white/10 flex-col shrink-0 z-50 bg-slate-900/40 backdrop-blur-xl text-white shadow-[4px_0_24px_rgba(0,0,0,0.2)]">
        <div className="h-20 flex items-center px-8 border-b border-white/10 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/10 rounded-bl-full -mr-12 -mt-12 shadow-[0_0_30px_rgba(34,211,238,0.1)]"></div>
          <div className="flex items-center gap-3 relative z-10">
            <div className="bg-gradient-to-br from-cyan-500 to-blue-500 w-10 h-10 rounded-xl flex items-center justify-center shadow-lg shadow-cyan-500/30">
              <ShieldCheck className="w-5 h-5 text-slate-950" />
            </div>
            <div>
              <h1 className="font-black text-lg text-white tracking-tight leading-none">Admin</h1>
              <p className="text-[10px] text-cyan-300 font-bold uppercase tracking-wider mt-1">{user?.branch || 'General'} Faculty</p>
            </div>
          </div>
        </div>
        <nav className="flex-1 px-4 py-8 space-y-2 overflow-y-auto no-scrollbar">
          {TAB_ITEMS.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button key={item.id} onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center gap-4 px-4 py-3.5 rounded-xl transition-all duration-200 group ${isActive ? 'bg-cyan-500/20 text-white font-bold shadow-inner shadow-[0_0_15px_rgba(34,211,238,0.1)] border border-cyan-400/50' : 'text-slate-300 hover:bg-white/10 hover:text-white font-medium hover:border hover:border-white/5 border border-transparent'}`}>
                <item.icon className={`w-5 h-5 ${isActive ? 'text-cyan-400 drop-shadow-[0_0_8px_rgba(34,211,238,0.5)]' : 'text-slate-400 group-hover:text-cyan-300 transition-colors'}`} />
                <span className="text-sm tracking-tight">{item.label}</span>
                {isActive && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.8)]"></div>}
              </button>
            );
          })}
        </nav>
        <div className="p-6 border-t border-white/10 bg-white/5 shadow-inner">
          <div className="glass-card bg-slate-900/40 p-4 rounded-2xl border border-white/10 shadow-[0_0_15px_rgba(0,0,0,0.2)] flex items-center gap-4 text-white">
            <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-slate-300 border border-white/10 shadow-inner">
              <Users className="w-5 h-5" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-bold text-white truncate">{user?.name}</p>
              <div className="flex gap-2">
                <button onClick={() => window.location.reload()} className="text-[10px] font-bold text-cyan-400 hover:text-cyan-300 uppercase tracking-wider mt-0.5">Exit</button>
                <button onClick={logout} className="text-[10px] font-bold text-rose-400 hover:text-rose-300 uppercase tracking-wider mt-0.5">Sign Out</button>
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <div className="flex-1 flex flex-col h-full relative overflow-hidden bg-transparent">
        <header className="h-16 bg-slate-900/40 backdrop-blur-xl border-b border-white/10 flex items-center justify-between px-6 shrink-0 z-40 sticky top-0 pt-[env(safe-area-inset-top)] text-white shadow-sm">
          <div className="flex items-center gap-3">
            <div className="lg:hidden w-8 h-8 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-lg flex items-center justify-center shadow-lg shadow-cyan-500/30">
              <ShieldCheck className="w-4 h-4 text-slate-950" />
            </div>
            <h2 className="text-lg font-black text-white tracking-tight uppercase drop-shadow-md">
              {activeTab === 'CONSOLE' ? 'Control Center' : activeTab === 'EXAMS' ? 'Exams & Gradebook' : activeTab}
            </h2>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={() => setShowDiagnostics(true)}
              className="hidden md:flex items-center gap-2 px-4 py-2.5 min-h-[44px] glass-card bg-slate-900/40 border border-white/10 rounded-full text-xs font-bold text-slate-300 hover:bg-white/10 hover:text-white transition-all shadow-inner hover:border-cyan-400/30">
              <Activity className="w-4 h-4 text-emerald-400" />
              <span>Status</span>
            </button>
            <button onClick={logout} className="lg:hidden p-3 min-h-[44px] min-w-[44px] flex items-center justify-center text-slate-400 hover:text-rose-400 transition-colors">
              <LogOut className="w-5 h-5" />
            </button>
            <div className="hidden lg:block w-px h-8 bg-white/10 mx-1"></div>
            <button className="hidden lg:block p-3 min-h-[44px] min-w-[44px] text-slate-400 hover:text-cyan-400 transition-colors relative">
              <Bell className="w-5 h-5" />
              <span className="absolute top-2 right-2 w-2 h-2 bg-rose-500 rounded-full border-2 border-slate-900 shadow-[0_0_8px_rgba(244,63,94,0.5)]"></span>
            </button>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 lg:p-8 pb-24 lg:pb-8 native-scroll relative">
          <div className="absolute top-0 right-1/4 w-96 h-96 bg-cyan-500/5 rounded-full blur-[100px] pointer-events-none"></div>
          <div className="max-w-7xl mx-auto space-y-6 lg:space-y-8 animate-fade-in relative z-10">
            {renderTab()}
          </div>
        </main>

        {/* MOBILE BOTTOM NAV */}
        <div className="lg:hidden fixed bottom-0 left-0 w-full bg-slate-900/60 backdrop-blur-xl border-t border-white/10 pb-[env(safe-area-inset-bottom)] z-50 text-white shadow-[0_-4px_24px_rgba(0,0,0,0.2)]">
          <div className="flex justify-around items-center h-[60px]">
            {TAB_ITEMS.map(item => {
              const isActive = activeTab === item.id;
              return (
                <button key={item.id} onClick={() => setActiveTab(item.id)}
                  className={`flex-1 flex flex-col items-center justify-center h-full min-h-[44px] active:scale-90 transition-all ${isActive ? 'bg-white/5 border-t-2 border-cyan-400' : ''}`}>
                  <item.icon className={`w-6 h-6 mb-1 ${isActive ? 'text-cyan-400 drop-shadow-[0_0_8px_rgba(34,211,238,0.5)]' : 'text-slate-400'}`} />
                  <span className={`text-[10px] font-bold ${isActive ? 'text-cyan-400' : 'text-slate-400'}`}>{item.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
