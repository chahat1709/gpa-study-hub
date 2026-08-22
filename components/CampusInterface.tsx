import React, { useEffect, useState } from 'react';
import { ArrowRight, Bell, BookOpen, Building2, CalendarDays, CheckCircle2, Clock3, GraduationCap, Mail, MessageCircle, Phone, ShieldCheck, Sparkles, Target, Users, WandSparkles } from 'lucide-react';
import { campusService } from '../services/campusService';
import { socialService } from '../services/socialService';
import { Notice, DirectoryContact, AppMode, Participant } from '../types';
import { useAuth } from './AuthContext';
import { useToast } from './ToastProvider';
import { attendanceService } from '../services/attendanceService';

interface CampusInterfaceProps { onNavigate?: (mode: AppMode) => void; }
type CampusTab = 'DASHBOARD' | 'DIRECTORY' | 'INFO';

const CampusInterface: React.FC<CampusInterfaceProps> = ({ onNavigate }) => {
  const { user } = useAuth();
  const { error, info } = useToast();
  const [activeTab, setActiveTab] = useState<CampusTab>('DASHBOARD');
  const [notices, setNotices] = useState<Notice[]>(campusService.getNotices());
  const [faculty, setFaculty] = useState<DirectoryContact[]>([]);
  const [stats, setStats] = useState({ overall: 0, totalClasses: 0, attendedClasses: 0, subjectWise: [] as any[] });

  useEffect(() => {
    setNotices(campusService.getNotices());
    if (user?.id) attendanceService.getStudentStats(user.id).then(setStats);
    campusService.getFacultyForNode(user?.branch, user?.semester).then(setFaculty);
  }, [user]);

  const safeOverall = Number.isFinite(stats.overall) ? stats.overall : 0;
  const attended = stats.attendedClasses || 0;
  const total = stats.totalClasses || 0;
  const attendanceStatus = safeOverall < 75 ? 'Needs attention' : 'On track';

  const handleInitiateChat = async (contact: DirectoryContact) => {
    if (!user) return;
    info('Connecting to your conversation…');
    try {
      const targetUser: Participant = { id: contact.id || `fac-${contact.name.replace(/\s+/g, '-').toLowerCase()}`, name: contact.name };
      const chatSession = await socialService.startChatWithUser({ id: user.id, name: user.name, avatar: user.photoURL }, targetUser);
      if (chatSession && onNavigate) onNavigate(AppMode.SOCIAL);
    } catch { error('Could not open this conversation.'); }
  };

  const quickActions = [
    { mode: AppMode.EXAM_HUB, icon: BookOpen, label: 'Prepare for exams', desc: 'Timed quizzes and past papers', tone: 'mint' },
    { mode: AppMode.PLANNER, icon: CalendarDays, label: 'Plan the week', desc: 'Tasks, reminders, and deadlines', tone: 'violet' },
    { mode: AppMode.TUTOR, icon: WandSparkles, label: 'Ask the AI Tutor', desc: 'Get help with a difficult topic', tone: 'coral' },
    { mode: AppMode.LIBRARY, icon: Target, label: 'Open the Library', desc: 'Notes, resources, and references', tone: 'blue' },
  ];

  const DashboardView = () => (
    <div className="campus-dashboard">
      <section className="campus-welcome">
        <div><p className="campus-eyebrow"><Sparkles /> Your academic command center</p><h1>Good to see you, {user?.name?.split(' ')[0] || 'student'}.</h1><p>Here is what deserves your attention today.</p></div>
        <div className="campus-context"><span className="campus-context-dot" /><span>{user?.branch || 'EC'} · Semester {user?.semester || '4'}</span><span className="campus-context-divider" /><span>GTU</span></div>
      </section>

      <section className="campus-focus-grid">
        <article className="campus-focus-card campus-focus-primary" onClick={() => onNavigate?.(AppMode.EXAM_HUB)} role="button" tabIndex={0} onKeyDown={e => e.key === 'Enter' && onNavigate?.(AppMode.EXAM_HUB)}>
          <div className="campus-focus-top"><span className="campus-badge campus-badge-mint"><BookOpen /> Exam Hub</span><ArrowRight /></div><div className="campus-focus-main"><h2>Build exam confidence.</h2><p>Practice a timed quiz, review GTU papers, or submit a written answer for feedback.</p></div><div className="campus-focus-meta"><span><Clock3 /> Start a 20-minute session</span><span className="campus-arrow-link">Open Exam Hub <ArrowRight /></span></div>
        </article>
        <article className="campus-attendance-card"><div className="campus-card-heading"><div><span className="campus-card-kicker">Attendance</span><h3>Keep your eligibility safe.</h3></div><div className={safeOverall < 75 ? 'campus-status campus-status-warn' : 'campus-status campus-status-good'}>{attendanceStatus}</div></div><div className="campus-attendance-number"><strong>{safeOverall}%</strong><span>overall presence</span></div><div className="campus-progress"><span style={{ width: `${Math.min(100, Math.max(0, safeOverall))}%` }} /></div><div className="campus-attendance-foot"><span>{attended} of {total || '—'} classes attended</span><button onClick={() => onNavigate?.(AppMode.ATTENDANCE)}>View details <ArrowRight /></button></div></article>
      </section>

      <section className="campus-section-heading"><div><p className="campus-eyebrow">Next actions</p><h2>Make progress in one tap.</h2></div><span>Most used this week</span></section>
      <section className="campus-action-grid">{quickActions.map(action => { const Icon = action.icon; return <button key={action.label} className={`campus-action campus-action-${action.tone}`} onClick={() => onNavigate?.(action.mode)}><span className="campus-action-icon"><Icon /></span><span className="campus-action-copy"><strong>{action.label}</strong><small>{action.desc}</small></span><ArrowRight className="campus-action-arrow" /></button>; })}</section>

      <section className="campus-lower-grid"><article className="campus-list-card"><div className="campus-list-head"><div><p className="campus-eyebrow">Updates</p><h2>Official notices</h2></div><span className="campus-count">{notices.length} active</span></div>{notices.length ? <div className="campus-notice-list">{notices.slice(0, 4).map(notice => <div key={notice.id} className="campus-notice"><span className={`campus-notice-dot ${notice.priority === 'high' ? 'is-high' : ''}`} /><div><div className="campus-notice-meta"><span>{notice.category}</span><time>{new Date(notice.date).toLocaleDateString()}</time></div><strong>{notice.title}</strong><p>{notice.content}</p></div></div>)}</div> : <div className="campus-empty"><Bell /><span>No new notices</span><small>You are up to date.</small></div>}</article><article className="campus-list-card campus-today-card"><div className="campus-list-head"><div><p className="campus-eyebrow">Your rhythm</p><h2>Today at a glance</h2></div><CalendarDays /></div><div className="campus-today-row"><span className="campus-today-time">09:30</span><span className="campus-today-line" /><span><strong>Study block</strong><small>Choose a topic in Planner</small></span></div><div className="campus-today-row"><span className="campus-today-time">12:15</span><span className="campus-today-line" /><span><strong>Check attendance</strong><small>Review subject-wise status</small></span></div><div className="campus-today-row"><span className="campus-today-time">18:00</span><span className="campus-today-line" /><span><strong>Exam practice</strong><small>Take one timed quiz</small></span></div><button className="campus-text-button" onClick={() => onNavigate?.(AppMode.PLANNER)}>Open planner <ArrowRight /></button></article></section>
    </div>
  );

  return <div className="campus-page"><div className="campus-tabs" role="tablist">{[{ id: 'DASHBOARD', label: 'Overview' }, { id: 'DIRECTORY', label: 'Faculty directory' }, { id: 'INFO', label: 'Campus info' }].map(tab => <button key={tab.id} role="tab" aria-selected={activeTab === tab.id} className={activeTab === tab.id ? 'is-active' : ''} onClick={() => setActiveTab(tab.id as CampusTab)}>{tab.label}</button>)}</div><div className="campus-scroll">{activeTab === 'DASHBOARD' && <DashboardView />}{activeTab === 'DIRECTORY' && <div className="campus-directory"><div className="campus-section-heading"><div><p className="campus-eyebrow">People who can help</p><h2>Faculty directory</h2></div></div><div className="campus-directory-grid">{faculty.map(contact => <article key={contact.id} className="campus-faculty-card"><div className="campus-avatar">{contact.name.charAt(0)}</div><div className="campus-faculty-copy"><strong>{contact.name}</strong><span>{contact.designation} · {contact.department}</span><small><Mail /> {contact.email}</small><small><Phone /> {contact.phone}</small></div><button onClick={() => handleInitiateChat(contact)}><MessageCircle /> Message</button></article>)}</div></div>}{activeTab === 'INFO' && <div className="campus-info"><div className="campus-info-icon"><Building2 /></div><p className="campus-eyebrow">Platform status</p><h2>Secure campus node</h2><p>GPA Study Hub is running locally on your device. Your academic workspace remains available even when the network is unavailable.</p><span><ShieldCheck /> Offline-first · Community edition</span></div>}</div></div>;
};

export default CampusInterface;
