import React, { useState, Suspense, useEffect, useRef } from 'react';
import Sidebar from './Sidebar';
import BottomNav from './BottomNav';
import { AppMode } from '../types';
import ErrorBoundary from './ErrorBoundary';
import { ToastProvider, useToast } from './ToastProvider';
import { AuthProvider, useAuth } from './AuthContext';
import { AuthPage } from './AuthPage';
import { Onboarding } from './Onboarding';
import { Loader2, Bell, ChevronLeft, User as UserIcon, WifiOff, Download } from 'lucide-react';
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
import ServerConnect from './ServerConnect';

const ONBOARDED_KEY = 'gpa_hub_onboarded_v1';
const SERVER_CONNECTED_KEY = 'gpa_hub_server_connected';

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

const LoadingFallback: React.FC = () => (
  <div className="flex-1 flex items-center justify-center h-full" style={{background:'transparent'}}>
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
  const { user, isLoading } = useAuth();
  const { success } = useToast();
  const [currentMode, setCurrentMode] = useState<AppMode>(AppMode.EXAM_HUB);
  const { hasKey: isAiActive } = useApiKeyCheck(5000);
  const [showOnboarding, setShowOnboarding] = useState(() => !localStorage.getItem(ONBOARDED_KEY));
  const [serverConnected, setServerConnected] = useState(() => localStorage.getItem(SERVER_CONNECTED_KEY) === 'true');
  const [pageTransition, setPageTransition] = useState<'enter' | 'exit'>('enter');
  const [license, setLicense] = useState<LicenseStatus | null>(null);
  const prevModeRef = useRef<AppMode>(currentMode);
  const insets = useSafeAreaInsets();
  const isMobile = useIsMobile();
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [updateInfo, setUpdateInfo] = useState<null | Awaited<ReturnType<typeof updateService.checkForUpdate>>>({ version: '', versionCode: 0, apkUrl: '', changelog: '', mandatory: false });

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
  if (!serverConnected) return <ServerConnect onConnected={() => { localStorage.setItem(SERVER_CONNECTED_KEY, 'true'); setServerConnected(true); }} />;
  if (isLoading || !license) return <LoadingFallback />;
  
  if (!license.isActive && user?.role !== 'GTU_ADMIN') {
    return (
      <div className="flex-1 flex flex-col items-center justify-center h-[100dvh] bg-slate-950 p-8 text-center" style={{background:'#0a0a0a'}}>
        <div className="w-16 h-16 bg-red-500/20 rounded-2xl flex items-center justify-center mb-6 border border-red-500/30">
          <WifiOff className="w-8 h-8 text-red-500" />
        </div>
        <h1 className="text-2xl font-bold text-white mb-2">Service Suspended</h1>
        <p className="text-slate-400 max-w-sm">The institutional node lease for this campus has expired or is suspended due to unpaid maintenance. Please contact the administrator.</p>
      </div>
    );
  }

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
    <div className="flex h-[100dvh] w-full overflow-hidden font-sans relative bg-[#050810]">
      <div className="glow-orb glow-orb-1" />
      <div className="glow-orb glow-orb-2" />
      <div className="glow-orb glow-orb-3" />

      <div className="hidden lg:block shrink-0 h-full z-50 relative">
        <Sidebar currentMode={currentMode} onModeChange={setCurrentMode} />
      </div>

      <div className="flex-1 flex flex-col h-full relative z-10 overflow-hidden">

        {/* Offline Banner */}
        <OfflineBanner />

        {/* Update Banner */}
        {updateAvailable && (
          <div className="flex items-center justify-between gap-3 px-4 py-2.5 text-xs font-bold shrink-0"
            style={{ background: 'rgba(56, 189, 248, 0.15)', borderBottom: '1px solid rgba(56, 189, 248, 0.3)', color: '#38bdf8' }}>
            <div className="flex items-center gap-2">
              <Download className="w-3.5 h-3.5" />
              <span>Update v{updateInfo?.version} available — {updateInfo?.changelog}</span>
            </div>
            <button
              onClick={() => updateInfo && updateService.downloadAndInstall(updateInfo.apkUrl)}
              className="px-3 py-1.5 min-h-[32px] bg-cyan-500 text-slate-950 rounded-lg font-bold hover:bg-cyan-400 transition-all flex items-center justify-center"
            >
              Update
            </button>
          </div>
        )}

        {/* Mobile Native Header */}
        <header className="lg:hidden shrink-0 flex items-center justify-between px-4 z-40 sticky top-0 pt-[env(safe-area-inset-top)] box-content bg-slate-950/85 backdrop-blur-2xl border-b border-white/10" style={{height: 52 + insets.top}}>
          <div className="flex items-center gap-2.5">
            {currentMode !== AppMode.CAMPUS ? (
              <button
                onClick={() => setCurrentMode(AppMode.CAMPUS)}
                className="p-2 -ml-2 text-cyan-400 active:scale-90 transition-transform min-h-[44px] min-w-[44px] flex items-center justify-center focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/50 rounded-xl"
                aria-label="Go back to Campus Home"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
            ) : (
              <div className="w-8 h-8 rounded-lg overflow-hidden p-0.5 bg-gradient-to-tr from-cyan-400 to-amber-400 shadow-sm shrink-0">
                <img src="/gpa_hub_logo.png" className="w-full h-full object-cover rounded-[6px]" alt="Logo" />
              </div>
            )}
            <div>
              <h1 className="text-sm font-bold text-white tracking-tight leading-none">
                {getModeLabel()}
              </h1>
              <p className="text-[10px] text-cyan-300 font-mono mt-0.5">GTU Node</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1 px-2 py-0.5 bg-emerald-500/10 border border-emerald-500/30 rounded-full text-[10px] text-emerald-400 font-bold">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></div>
              <span>Online</span>
            </div>
            <button 
              onClick={() => setCurrentMode(AppMode.PROFILE)} 
              className="min-h-[44px] min-w-[44px] rounded-full overflow-hidden border border-cyan-400/30 flex items-center justify-center p-0.5 bg-white/5 active:scale-90 transition-transform focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/50"
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
        <header className="hidden lg:flex h-16 shrink-0 items-center justify-between px-8 z-40" style={{background:'rgba(15,10,30,0.7)', backdropFilter:'blur(20px)', borderBottom:'1px solid rgba(255,255,255,0.08)'}}>
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-slate-400">Academic Year 2024-25</span>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full border" style={{background:'rgba(255,255,255,0.06)', borderColor:'rgba(255,255,255,0.12)'}}>
              <div className={`w-2 h-2 rounded-full ${isAiActive ? 'bg-green-500' : 'bg-amber-500'}`}></div>
              <span className="text-xs font-medium text-slate-300">{isAiActive ? 'Online' : 'API Key Needed'}</span>
            </div>
            <button 
              className="text-slate-400 hover:text-white transition-colors p-3 min-h-[44px] min-w-[44px] flex items-center justify-center focus:outline-none focus-visible:ring-2 focus-visible:ring-white/20 rounded-xl"
              aria-label="View notifications"
            >
              <Bell className="w-5 h-5" />
            </button>
          </div>
        </header>

        <main className={`flex-1 overflow-y-auto overflow-x-hidden native-scroll relative w-full ${!isNavHidden ? `pb-[${bottomNavHeight}px] lg:pb-0` : ''}`}>
          <ErrorBoundary>
            <Suspense fallback={<LoadingFallback />}>
              <div className={`h-full w-full ${pageTransition === 'exit' ? 'page-exit' : 'page-enter'}`}>
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
      </div>
    </div>
  );
};

const App: React.FC = () => (
  <ToastProvider>
    <AuthProvider>
      <AppShell />
    </AuthProvider>
  </ToastProvider>
);

export default App;
