import React, { useState, Suspense, useEffect, useRef } from 'react';
import Sidebar from './Sidebar';
import BottomNav from './BottomNav';
import { AppMode } from '../types';
import ErrorBoundary from './ErrorBoundary';
import { ToastProvider, useToast } from './ToastProvider';
import { AuthProvider, useAuth } from './AuthContext';
import { SocketProvider } from './SocketContext';
import { NotificationProvider, useNotifications } from './NotificationContext';
import { AuthPage } from './AuthPage';
import { Onboarding } from './Onboarding';
import { Loader2, Bell, ChevronLeft, User as UserIcon, WifiOff, Download, Server, Cloud, Search, X, Command, ArrowRight, CalendarDays, BookOpen, Award, Sparkles } from 'lucide-react';
import AdminDashboard from './AdminDashboard';
import NexusAgent from './NexusAgent';
import { examService } from '../services/examService';
import { campusService } from '../services/campusService';
import { attendanceService } from '../services/attendanceService';
import { memoryMonitor } from '../utils/memoryMonitor';
import { licenseService, LicenseStatus } from '../services/licenseService';
import { useApiKeyCheck } from '../hooks/useApiKeyCheck';
import { useSafeAreaInsets, useIsMobile } from '../hooks/useMobile';
import { updateService } from '../services/updateService';
import { checkServerHealth } from '../services/apiClient';

// The web shell opens directly into the workspace after essential startup checks.

const ONBOARDED_KEY = 'gpa_hub_onboarded_v1';

// Fixed paths: Relative to components/ folder
const ChatInterface = React.lazy(() => import('./ChatInterface'));
const VisionInterface = React.lazy(() => import('./VisionInterface'));
const TextInterface = React.lazy(() => import('./TextInterface'));
const SocialInterface = React.lazy(() => import('./SocialInterface'));
// Library is in ../features
const LibraryController = React.lazy(() => import('../features/library/LibraryController'));
const PlannerInterface = React.lazy(() => import('./PlannerInterface'));
const CampusInterface = React.lazy(() => import('./CampusInterface'));
const ProfileInterface = React.lazy(() => import('./ProfileInterface'));
const AttendanceInterface = React.lazy(() => import('./AttendanceInterface'));
const ExamHubInterface = React.lazy(() => import('./ExamHubInterface'));

const CommandPalette: React.FC<{ onNavigate: (mode: AppMode) => void; onClose: () => void }> = ({ onNavigate, onClose }) => {
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const actions = [
    { mode: AppMode.CAMPUS, label: 'Open overview', detail: 'See what needs your attention', icon: Search },
    { mode: AppMode.EXAM_HUB, label: 'Prepare for an exam', detail: 'Quizzes, papers, and grading', icon: Award },
    { mode: AppMode.PLANNER, label: 'Plan my week', detail: 'Tasks, deadlines, and study blocks', icon: CalendarDays },
    { mode: AppMode.LIBRARY, label: 'Find study material', detail: 'Notes, resources, and references', icon: BookOpen },
    { mode: AppMode.TUTOR, label: 'Ask the tutor', detail: 'Get contextual help with a topic', icon: Sparkles },
  ];
  const filtered = actions.filter(action => `${action.label} ${action.detail}`.toLowerCase().includes(query.toLowerCase()));
  useEffect(() => { inputRef.current?.focus(); }, []);
  useEffect(() => { const onKeyDown = (event: KeyboardEvent) => { if (event.key === 'Escape') onClose(); }; window.addEventListener('keydown', onKeyDown); return () => window.removeEventListener('keydown', onKeyDown); }, [onClose]);
  return <div className="command-overlay" role="presentation" onMouseDown={event => event.target === event.currentTarget && onClose()}><section className="command-dialog" role="dialog" aria-modal="true" aria-label="Search and commands"><div className="command-heading"><div><p className="command-kicker">Quick switcher</p><h2>Where do you want to go?</h2></div><button onClick={onClose} aria-label="Close command palette"><X /></button></div><div className="command-input-wrap"><Search /><input ref={inputRef} value={query} onChange={event => setQuery(event.target.value)} placeholder="Search features or actions…" aria-label="Search features or actions" /><kbd>Esc</kbd></div><div className="command-results">{filtered.length ? filtered.map(action => { const Icon = action.icon; return <button key={action.label} className="command-result" onClick={() => { onNavigate(action.mode); onClose(); }}><span className="command-result-icon"><Icon /></span><span><strong>{action.label}</strong><small>{action.detail}</small></span><ArrowRight /></button>; }) : <div className="command-empty">No matching action. Try “exam”, “plan”, or “library”.</div>}</div><p className="command-footnote"><Command /> K to open anytime <span>·</span> Arrow keys to explore</p></section></div>;
};

const LoadingFallback: React.FC = () => (

  <div className="flex-1 flex items-center justify-center h-full" style={{ background: 'transparent' }}>
    <div className="flex flex-col items-center gap-4">
      <Loader2 className="w-8 h-8 animate-spin text-indigo-400" />
      <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Loading Module...</span>
    </div>
  </div>
);

const OfflineBanner: React.FC = () => {
  const [offline, setOffline] = useState(!navigator.onLine);
  useEffect(() => {
    const on = () => setOffline(false);
    const off = () => setOffline(true);
    window.addEventListener('online', on);
    window.addEventListener('offline', off);
    return () => { window.removeEventListener('online', on); window.removeEventListener('offline', off); };
  }, []);
  if (!offline) return null;
  return (
    <div className="flex items-center justify-center gap-2 px-4 py-2 text-xs font-bold shrink-0"
      style={{ background: 'rgba(251,191,36,0.15)', borderBottom: '1px solid rgba(251,191,36,0.3)', color: '#fbbf24' }}>
      <WifiOff className="w-3.5 h-3.5" />
      Offline — using cached data
    </div>
  );
};

const AppShell: React.FC = () => {
  const { user, isLoading, serverOnline } = useAuth();
  const { success } = useToast();
  const [currentMode, setCurrentMode] = useState<AppMode>(AppMode.CAMPUS);
  const { hasKey: isAiActive } = useApiKeyCheck(5000);
  const [showOnboarding, setShowOnboarding] = useState(() => !localStorage.getItem(ONBOARDED_KEY));
  const [pageTransition, setPageTransition] = useState<'enter' | 'exit'>('enter');
  const [license, setLicense] = useState<LicenseStatus | null>(null);
  const prevModeRef = useRef<AppMode>(currentMode);
  const insets = useSafeAreaInsets();
  const isMobile = useIsMobile();
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [updateInfo, setUpdateInfo] = useState<null | Awaited<ReturnType<typeof updateService.checkForUpdate>>>({ version: '', versionCode: 0, apkUrl: '', changelog: '', mandatory: false });
  const [showLoading, setShowLoading] = useState(false);
  const [commandOpen, setCommandOpen] = useState(false);

    useEffect(() => {
    const onShortcut = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') { event.preventDefault(); setCommandOpen(true); }
    };
    window.addEventListener('keydown', onShortcut);
    return () => window.removeEventListener('keydown', onShortcut);
  }, []);

  // Check for app updates (native only)

  useEffect(() => {
    const checkUpdate = async () => {
      const info = await updateService.checkForUpdate();
      if (info) {
        setUpdateAvailable(true);
        setUpdateInfo(info);
      }
    };
    checkUpdate();
    const interval = setInterval(checkUpdate, 1000 * 60 * 60); // check hourly
    return () => clearInterval(interval);
  }, []);

  // Check License
  useEffect(() => {
    const checkLicense = async () => {
      const status = await licenseService.getStatus();
      setLicense(status);
    };
    checkLicense();
    const interval = setInterval(checkLicense, 1000 * 60 * 60); // check hourly
    return () => clearInterval(interval);
  }, []);

  // Seed real GTU content on first launch
  useEffect(() => {
    examService.seedDefaultQuizzes();
    campusService.seedCampusDirectory();
    attendanceService.seedTimetable();
  }, []);

  // Start memory monitoring on low-end devices
  useEffect(() => {
    const deviceInfo = memoryMonitor.getDeviceInfo();
    if (deviceInfo.isLowEndDevice) {
      memoryMonitor.startMonitoring(30000);
    }
    return () => memoryMonitor.stopMonitoring();
  }, []);

  // Page transition effect
  useEffect(() => {
    if (prevModeRef.current !== currentMode) {
      setPageTransition('exit');
      const timer = setTimeout(() => {
        setPageTransition('enter');
        prevModeRef.current = currentMode;
      }, 150);
      return () => clearTimeout(timer);
    }
  }, [currentMode]);

  // Listen for agent navigation events
  useEffect(() => {
    const handleAgentAction = (e: CustomEvent<{ name: string; args: Record<string, unknown> }>) => {
      const { name, args } = e.detail;
      if (name === 'navigate_to_feature') {
        const target = args.target_mode as AppMode;
        if (Object.values(AppMode).includes(target)) {
          setCurrentMode(target);
          success(`Navigated to ${target}`);
        }
      }
    };
    window.addEventListener('AGENT_ACTION', handleAgentAction as EventListener);
    return () => {
      window.removeEventListener('AGENT_ACTION', handleAgentAction as EventListener);
    };
  }, [success]);

  if (showOnboarding) return <Onboarding onComplete={() => { localStorage.setItem(ONBOARDED_KEY, '1'); setShowOnboarding(false); }} />;
  if (showLoading) return null;
  if (isLoading || !license) return <LoadingFallback />;



  if (!user) return <AuthPage />;
  if (user.role === 'FACULTY' || user.role === 'GTU_ADMIN') return <AdminDashboard />

  const isNavHidden = currentMode === AppMode.TUTOR || currentMode === AppMode.SOCIAL;

  const getModeLabel = () => {
    switch (currentMode) {
      case AppMode.TUTOR: return 'AI Tutor';
      case AppMode.SOCIAL: return 'Social Hub';
      case AppMode.CAMPUS: return 'Campus';
      case AppMode.PROFILE: return 'Digital Identity';
      case AppMode.LIBRARY: return 'Library';
      case AppMode.PLANNER: return 'Planner';
      case AppMode.NOTES: return 'Notes';
      case AppMode.HOMEWORK: return 'Scanner';
      case AppMode.ATTENDANCE: return 'Attendance Hub';
      case AppMode.EXAM_HUB: return 'Exam Hub';
      default: return 'Home';
    }
  };

  const renderContent = () => {
    switch (currentMode) {
      case AppMode.CAMPUS: return <CampusInterface onNavigate={setCurrentMode} />;
      case AppMode.TUTOR: return <ChatInterface />;
      case AppMode.HOMEWORK: return <VisionInterface />;
      case AppMode.NOTES: return <TextInterface />;
      case AppMode.SOCIAL: return <SocialInterface />;
      case AppMode.LIBRARY: return <LibraryController />;
      case AppMode.PLANNER: return <PlannerInterface />;
      case AppMode.PROFILE: return <ProfileInterface />;
      case AppMode.ATTENDANCE: return <AttendanceInterface />;
      case AppMode.EXAM_HUB: return <ExamHubInterface />;
      default: return <CampusInterface onNavigate={setCurrentMode} />;
    }
  };

  const bottomNavHeight = 85 + insets.bottom;

  return (
    <div className="ui-app-shell flex h-[100dvh] w-full overflow-hidden font-sans relative antialiased min-h-screen">
      

      {/* Atmospheric Backgrounds */}
      <div className="bg-blob-1"></div>
      <div className="bg-blob-2"></div>

      <div className="hidden lg:block shrink-0 h-full z-50 relative">
        <Sidebar currentMode={currentMode} onModeChange={setCurrentMode} />
      </div>

      <div className="flex-1 flex flex-col h-full relative z-10 overflow-hidden">

        {/* Offline Banner */}
        <OfflineBanner />

        {/* Server Connect Banner (shows when server is available but not connected) */}
        {!serverOnline && (
          <div className="server-connect-banner flex items-center justify-center gap-2 px-4 py-2 text-xs font-bold shrink-0">
            <Cloud className="w-3.5 h-3.5 animate-pulse" />
            <span>Running in Offline Mode — All data stored locally. Connect to a college server for multi-device sync.</span>
          </div>
        )}

        {/* Update Banner */}
        {updateAvailable && (
          <div className="flex items-center justify-between gap-3 px-4 py-2.5 text-xs font-bold shrink-0 bg-stitch-cyan/15 border-b border-stitch-cyan/30 text-stitch-cyan">
            <div className="flex items-center gap-2">
              <Download className="w-3.5 h-3.5" />
              <span>Update v{updateInfo?.version} available — {updateInfo?.changelog}</span>
            </div>
            <button
              onClick={() => updateInfo && updateService.downloadAndInstall(updateInfo.apkUrl)}
              className="px-3 py-1.5 min-h-[32px] bg-stitch-cyan text-slate-950 rounded-lg font-bold hover:bg-stitch-cyan/80 transition-all flex items-center justify-center"
            >
              Update
            </button>
          </div>
        )}

        {/* Mobile Native Header */}
        <header className="ui-mobile-header lg:hidden shrink-0 flex items-center justify-between px-4 z-40 sticky top-0 pt-[env(safe-area-inset-top)] box-content transition-all duration-300" style={{ height: 52 + insets.top }}>
          <div className="flex items-center gap-2.5">
            {currentMode !== AppMode.CAMPUS ? (
              <button
                onClick={() => setCurrentMode(AppMode.CAMPUS)}
                className="p-2 -ml-2 text-primary active:scale-90 transition-transform min-h-[44px] min-w-[44px] flex items-center justify-center focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 rounded-xl"
                aria-label="Go back to Campus Home"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
            ) : (
              <div className="w-8 h-8 rounded-[10px] overflow-hidden p-0.5 bg-gradient-to-br from-primary to-secondary shadow-sm shrink-0">
                <img src="/gpa_hub_logo.png" className="w-full h-full object-cover rounded-[8px]" alt="Logo" />
              </div>
            )}
            <div>
              <h1 className="text-sm font-display-lg font-bold text-white tracking-tight leading-none">
                {getModeLabel()}
              </h1>
              <p className="text-[10px] text-white/50 font-mono mt-0.5">GTU Node</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1 px-2 py-0.5 bg-emerald-500/10 border border-emerald-500/30 rounded-full text-[10px] text-emerald-400 font-bold">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></div>
              <span>Online</span>
            </div>
            <button
              onClick={() => setCurrentMode(AppMode.PROFILE)}
              className="min-h-[44px] min-w-[44px] rounded-full overflow-hidden border border-primary/30 flex items-center justify-center p-0.5 bg-white/5 active:scale-90 transition-transform focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
              aria-label="Open profile settings"
            >
              {user.photoURL ? (
                <img src={user.photoURL} className="w-full h-full object-cover rounded-full" alt="Me" />
              ) : (
                <div className="flex items-center justify-center h-full text-slate-400"><UserIcon className="w-4 h-4" /></div>
              )}
            </button>
          </div>
        </header>

        {/* Desktop Header */}
        <header className="ui-topbar hidden lg:flex h-16 shrink-0 items-center justify-between px-8 z-40">
          <div className="topbar-context"><span className="topbar-overline">GTU academic workspace</span><span className="topbar-divider" /><span>Academic Year 2024–25</span></div>
          <div className="topbar-actions"><button className="command-trigger" onClick={() => setCommandOpen(true)}><Search /><span>Search or jump to…</span><kbd>⌘ K</kbd></button><div className={`topbar-status ${isAiActive ? 'is-ready' : 'is-muted'}`}><span />{isAiActive ? 'Tutor ready' : 'Tutor setup'}</div><NotificationBell /></div>
        </header>

        <main className={`ui-main-scroll flex-1 overflow-y-auto overflow-x-hidden native-scroll relative w-full ${!isNavHidden ? `pb-[${bottomNavHeight}px] lg:pb-0` : ''}`}>
          <ErrorBoundary>
            <Suspense fallback={<LoadingFallback />}>
              <div className={`h-full w-full ${pageTransition === 'exit' ? 'ui-page-exit' : 'ui-page-enter'}`}>
                {renderContent()}
              </div>
            </Suspense>
          </ErrorBoundary>
        </main>

        {!isNavHidden && (
          <div className="lg:hidden">
            <BottomNav currentMode={currentMode} onModeChange={setCurrentMode} />
          </div>
        )}

                <NexusAgent forceLower={isNavHidden} />
        {commandOpen && <CommandPalette onNavigate={setCurrentMode} onClose={() => setCommandOpen(false)} />}

      </div>
    </div>
  );
};

const NotificationBell: React.FC = () => {
  const { unreadCount, notifications, markAllRead } = useNotifications();
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => { setOpen(!open); if (!open) markAllRead(); }}
        className="relative text-slate-400 hover:text-white transition-colors p-3 min-h-[44px] min-w-[44px] flex items-center justify-center focus:outline-none focus-visible:ring-2 focus-visible:ring-white/20 rounded-xl"
        aria-label="View notifications"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute top-1.5 right-1.5 w-5 h-5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center animate-pulse">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="ui-notification-popover absolute right-0 top-full mt-2 w-80 max-h-96 overflow-y-auto bg-slate-900/95 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl z-50">
            <div className="p-3 border-b border-white/10">
              <h3 className="text-sm font-bold text-white">Notifications</h3>
            </div>
            {notifications.length === 0 ? (
              <div className="p-6 text-center text-slate-500 text-xs">No notifications yet</div>
            ) : (
              notifications.slice(0, 20).map(n => (
                <div key={n.id} className={`p-3 border-b border-white/5 ${!n.isRead ? 'bg-white/5' : ''}`}>
                  <div className="flex items-start gap-2">
                    <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${
                      n.type === 'error' ? 'bg-red-500' :
                      n.type === 'warning' ? 'bg-amber-500' :
                      n.type === 'success' ? 'bg-emerald-500' :
                      n.type === 'chat' ? 'bg-blue-500' :
                      n.type === 'attendance' ? 'bg-purple-500' : 'bg-slate-500'
                    }`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-white">{n.title}</p>
                      <p className="text-[11px] text-slate-400 mt-0.5 truncate">{n.message}</p>
                      <p className="text-[10px] text-slate-600 mt-1">{n.timestamp.toLocaleTimeString()}</p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </>
      )}
    </div>
  );
};

const App: React.FC = () => (
  <ToastProvider>
    <AuthProvider>
      <SocketProvider>
        <NotificationProvider>
          <AppShell />
        </NotificationProvider>
      </SocketProvider>
    </AuthProvider>
  </ToastProvider>
);

export default App;
