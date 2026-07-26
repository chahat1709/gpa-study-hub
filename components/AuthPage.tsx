import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { useToast } from './ToastProvider';
import { ForgotPin } from './ForgotPin';
import {
  GraduationCap, Loader2, User, Building2, Shield,
  ChevronRight, Eye, EyeOff, KeyRound, UserPlus,
  LogIn, Fingerprint, BookOpen, Brain, Zap
} from 'lucide-react';
import { inputCls, inputStyle, btnPrimary } from '../utils/authStyles';

const BRANCHES = ['EC', 'ICT'];
const SEMESTERS = ['1', '2', '3', '4', '5', '6'];
const SECTIONS: Record<string, string[]> = {
  EC: ['A', 'B', 'C'],
  ICT: ['A', 'B'],
};

type RoleTab = 'STUDENT' | 'FACULTY' | 'ADMIN';
type StudentView = 'LOGIN' | 'REGISTER';
type FacultyView = 'LOGIN' | 'REGISTER';

const features = [
  { icon: Brain, label: 'AI Tutor', color: '#00f2fe' },
  { icon: BookOpen, label: 'GTU Exam Hub', color: '#fbbf24' },
  { icon: Zap, label: '100% Offline', color: '#10b981' },
];

export const AuthPage: React.FC = () => {
  const { studentLogin, studentRegister, facultyLogin, facultyRegister, adminLogin } = useAuth();
  const { error: showError, success: showSuccess } = useToast();

  const [role, setRole] = useState<RoleTab>('STUDENT');
  const [isLoading, setIsLoading] = useState(false);
  const [showForgotPin, setShowForgotPin] = useState(false);

  // Student
  const [stuView, setStuView] = useState<StudentView>('LOGIN');
  const [stuEnroll, setStuEnroll] = useState('');
  const [stuName, setStuName] = useState('');
  const [stuPin, setStuPin] = useState(['', '', '', '']);
  const pinRefs = useRef<(HTMLInputElement | null)[]>([]);
  const [stuBranch, setStuBranch] = useState('EC');
  const [stuSem, setStuSem] = useState('1');
  const [stuSec, setStuSec] = useState('A');
  const [showRegPin, setShowRegPin] = useState(false);
  const [regPin, setRegPin] = useState('');
  const [regPinConfirm, setRegPinConfirm] = useState('');

  // Faculty
  const [facView, setFacView] = useState<FacultyView>('LOGIN');
  const [facEmail, setFacEmail] = useState('');
  const [facPassword, setFacPassword] = useState('');
  const [facName, setFacName] = useState('');
  const [facBranch, setFacBranch] = useState('EC');
  const [showPw, setShowPw] = useState(false);

  // Admin
  const [adminCode, setAdminCode] = useState('');
  const [showAdminCode, setShowAdminCode] = useState(false);

  // Carousel
  const [fi, setFi] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setFi(i => (i + 1) % features.length), 2800);
    return () => clearInterval(t);
  }, []);

  // PIN digit input (4-digit)
  const handlePinDigit = (idx: number, val: string) => {
    const d = val.replace(/\D/g, '').slice(0, 1);
    const next = [...stuPin];
    next[idx] = d;
    setStuPin(next);
    if (d && idx < 3) pinRefs.current[idx + 1]?.focus();
    if (!d && idx > 0) pinRefs.current[idx - 1]?.focus();
  };

  const run = async (fn: () => Promise<void>) => {
    setIsLoading(true);
    try { await fn(); }
    catch (e: any) { showError(e.message || 'Something went wrong'); }
    finally { setIsLoading(false); }
  };

  // ── Handlers ─────────────────────────────────────────────────────────────────
  const handleStudentLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const pin = stuPin.join('');
    if (!stuEnroll.trim()) return showError('Enter enrollment number');
    if (pin.length < 4) return showError('Enter your 4-digit PIN');
    run(() => studentLogin(stuEnroll.trim().toUpperCase(), pin).then(() => showSuccess('Welcome back! 🎓')));
  };

  const handleStudentRegister = (e: React.FormEvent) => {
    e.preventDefault();
    if (!stuName.trim() || !stuEnroll.trim()) return showError('Name and Enrollment Number required');
    if (!/^\d{4}$/.test(regPin)) return showError('PIN must be exactly 4 digits');
    if (regPin !== regPinConfirm) return showError('PINs do not match');
    run(() => studentRegister(stuName.trim(), stuEnroll.trim(), regPin, stuBranch, stuSem, stuSec)
      .then(() => showSuccess('Account created! Welcome 🎓')));
  };

  const handleFacultyLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!facEmail || !facPassword) return showError('Email and password required');
    run(() => facultyLogin(facEmail, facPassword).then(() => showSuccess('Admin access granted ✓')));
  };

  const handleFacultyRegister = (e: React.FormEvent) => {
    e.preventDefault();
    if (!facName || !facEmail || !facPassword) return showError('All fields required');
    if (facPassword.length < 6) return showError('Password min 6 characters');
    run(() => facultyRegister(facName, facEmail, facPassword, facBranch)
      .then(() => showSuccess('Faculty account created ✓')));
  };

  const handleAdminLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminCode) return showError('Admin code required');
    run(() => adminLogin(adminCode).then(() => showSuccess('GTU Admin access granted 🔐')));
  };

  // ── Styles (shared) ─────────────────────────────────────────────────────────
  const Feat = features[fi] || features[0]!;
  const FeatIcon = Feat.icon;

  return (
    <div className="min-h-screen w-full flex relative overflow-hidden bg-transparent">
      {/* Background orbs from index.css */}
      <div className="glow-orb glow-orb-1" />
      <div className="glow-orb glow-orb-2" />
      <div className="glow-orb glow-orb-3" />

      {/* Main Container */}
      <div className="flex-1 flex flex-col lg:flex-row relative z-10 w-full h-full">
        
        {/* Left panel — desktop hero */}
        <div className="hidden lg:flex w-[45%] flex-col justify-between p-12 relative overflow-hidden border-r border-white/10 bg-[rgba(15,23,42,0.6)] backdrop-blur-[40px]">
          {/* Logo */}
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center shadow-lg bg-gradient-to-br from-stitch-primary to-stitch-secondary shadow-stitch-primary-container/20">
              <GraduationCap className="w-8 h-8 text-stitch-navy" />
            </div>
            <div>
              <div className="text-3xl font-display font-black text-white tracking-tight">GPA Study Hub</div>
              <div className="text-sm font-mono text-stitch-cyan mt-1">GTU Diploma Platform</div>
            </div>
          </div>

          {/* Hero text */}
          <div className="space-y-8">
            <h1 className="text-6xl font-display font-black text-white leading-[1.1] tracking-tight">
              Secure.<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-stitch-primary to-stitch-cyan">
                Role-Based.
              </span><br />
              Powerful.
            </h1>
            <p className="text-slate-400 text-xl leading-relaxed max-w-md">
              A private, offline-first ecosystem tailored for GTU EC & ICTET students.
            </p>

            <div className="space-y-4">
              {[
                { role: 'STUDENT', color: 'text-stitch-cyan', bg: 'bg-stitch-cyan/10', border: 'border-stitch-cyan/20', icon: User, desc: 'Exams, Library, AI Tutor, Planner' },
                { role: 'FACULTY', color: 'text-stitch-primary', bg: 'bg-stitch-primary-container/20', border: 'border-stitch-primary-container/30', icon: Building2, desc: 'Attendance, Notices, Resources' },
                { role: 'GTU ADMIN', color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/20', icon: Shield, desc: 'Full System Access & Config' },
              ].map(r => {
                const RIcon = r.icon;
                return (
                  <div key={r.role} className={`flex items-center gap-4 p-4 rounded-2xl border ${r.bg} ${r.border} backdrop-blur-sm transition-transform hover:scale-[1.02] duration-300`}>
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center bg-white/5`}>
                      <RIcon className={`w-5 h-5 ${r.color}`} />
                    </div>
                    <div>
                      <div className={`text-sm font-black tracking-wider ${r.color}`}>{r.role}</div>
                      <div className="text-sm text-slate-400 mt-0.5">{r.desc}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Feature Carousel */}
          <div className="glass-card p-5 mt-8 flex items-center gap-5 card-3d">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-white/5 border border-white/10 shrink-0">
              <FeatIcon className="w-6 h-6" style={{ color: Feat.color }} />
            </div>
            <div className="flex-1">
              <div className="font-bold font-display text-white text-lg">{Feat.label}</div>
              <div className="flex gap-2 mt-3">
                {features.map((_, i) => (
                  <div key={i} className={`h-1.5 rounded-full transition-all duration-500 ${i === fi ? 'w-8 bg-stitch-cyan' : 'w-2 bg-white/20'}`} style={{ backgroundColor: i === fi ? Feat.color : undefined }} />
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Right panel — Form area */}
        <div className="flex-1 flex flex-col items-center justify-center p-6 lg:p-12 relative overflow-y-auto auth-scroll-container">
          
          {/* Mobile Header */}
          <div className="lg:hidden flex flex-col items-center gap-3 mb-8 text-center">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center shadow-lg bg-gradient-to-br from-stitch-primary to-stitch-secondary shadow-stitch-primary-container/20">
              <GraduationCap className="w-8 h-8 text-stitch-navy" />
            </div>
            <div>
              <h1 className="text-2xl font-display font-black text-white tracking-tight">GPA Study Hub</h1>
              <p className="text-sm font-mono text-stitch-cyan mt-1">GTU Diploma</p>
            </div>
          </div>

          {/* Glass Form Card */}
          <div className="glass-card w-full max-w-[400px] p-8 card-3d">
            
            {/* Elegant Segmented Control */}
            <div className="flex p-1.5 bg-[rgba(15,23,42,0.8)] rounded-2xl mb-8 border border-white/5 shadow-inner">
              {([
                { id: 'STUDENT', label: 'Student', color: 'text-stitch-cyan', activeBg: 'bg-stitch-cyan/20' },
                { id: 'FACULTY', label: 'Faculty', color: 'text-stitch-primary', activeBg: 'bg-stitch-primary-container/30' },
                { id: 'ADMIN', label: 'Admin', color: 'text-amber-400', activeBg: 'bg-amber-500/20' },
              ] as const).map(t => (
                <button
                  key={t.id}
                  onClick={() => setRole(t.id as RoleTab)}
                  className={`flex-1 py-3 text-sm font-bold rounded-xl transition-all duration-300 ${role === t.id ? `${t.activeBg} ${t.color} shadow-sm border border-white/10` : 'text-slate-400 hover:text-white hover:bg-white/5 border border-transparent'}`}
                >
                  {t.label}
                </button>
              ))}
            </div>

            {/* Content Based on Role */}
            {role === 'STUDENT' && (
              <div role="tabpanel" className="animate-fade-in">
                <div className="flex gap-2 mb-6" role="tablist">
                  {(['LOGIN', 'REGISTER'] as StudentView[]).map(v => (
                    <button key={v} onClick={() => setStuView(v)}
                      className={`flex-1 flex items-center justify-center gap-2 text-xs py-3 rounded-xl font-bold transition-all ${stuView === v ? 'bg-stitch-cyan/20 border-stitch-cyan/30 text-stitch-cyan border' : 'bg-white/5 border-white/10 text-slate-400 border'}`}>
                      {v === 'LOGIN' ? <LogIn className="w-4 h-4" /> : <UserPlus className="w-4 h-4" />}
                      {v === 'LOGIN' ? 'Login' : 'Register'}
                    </button>
                  ))}
                </div>

                {stuView === 'LOGIN' && !showForgotPin && (
                  <form onSubmit={handleStudentLogin} className="space-y-6">
                    <div>
                      <label className="block text-xs font-bold text-slate-400 mb-2 uppercase tracking-widest">Enrollment Number</label>
                      <input type="text" required value={stuEnroll} onChange={e => setStuEnroll(e.target.value)}
                        className={inputCls} style={inputStyle} placeholder="e.g. 236080307001" autoFocus autoCapitalize="characters" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-400 mb-3 uppercase tracking-widest flex items-center gap-2">
                        <Fingerprint className="w-4 h-4 text-stitch-cyan" />
                        4-Digit PIN
                      </label>
                      <div className="flex gap-4 justify-center">
                        {stuPin.map((d, i) => (
                           <input key={i} ref={el => { pinRefs.current[i] = el; }}
                             type="password" inputMode="numeric" maxLength={1} value={d}
                             onChange={e => handlePinDigit(i, e.target.value)}
                             onKeyDown={e => { if (e.key === 'Backspace' && !d && i > 0) pinRefs.current[i - 1]?.focus(); }}
                             className="w-[60px] h-[68px] text-center text-3xl font-black rounded-2xl outline-none transition-all duration-300 focus:scale-105"
                             style={{ ...inputStyle, border: d ? '2px solid var(--stitch-cyan)' : '1px solid rgba(255,255,255,0.12)', color: 'var(--stitch-cyan)' }}
                           />
                        ))}
                      </div>
                    </div>
                    <button type="submit" disabled={isLoading} className="stitch-btn w-full py-4 font-black text-sm flex items-center justify-center gap-2">
                      {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <><KeyRound className="w-4 h-4" /> Enter Campus</>}
                    </button>
                    <p className="text-center text-xs text-slate-500 pt-2">
                      <button type="button" onClick={() => setStuView('REGISTER')} className="text-stitch-cyan font-bold hover:text-stitch-cyan/80 transition-colors">Register</button>
                      {' · '}
                      <button type="button" onClick={() => setShowForgotPin(true)} className="text-amber-400 font-bold hover:text-amber-300 transition-colors">Forgot PIN?</button>
                    </p>
                  </form>
                )}

                {stuView === 'LOGIN' && showForgotPin && (
                  <ForgotPin onBack={() => setShowForgotPin(false)} onSuccess={() => setShowForgotPin(false)} />
                )}

                {stuView === 'REGISTER' && (
                  <form onSubmit={handleStudentRegister} className="space-y-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-400 mb-2 uppercase tracking-widest">Full Name</label>
                      <input required type="text" value={stuName} onChange={e => setStuName(e.target.value)} className={inputCls} style={inputStyle} placeholder="e.g. Rahul Patel" autoFocus />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-400 mb-2 uppercase tracking-widest">Enrollment Number</label>
                      <input required type="text" value={stuEnroll} onChange={e => setStuEnroll(e.target.value.toUpperCase())} className={inputCls} style={inputStyle} placeholder="236080307001" />
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 mb-2 uppercase tracking-widest">Branch</label>
                        <select value={stuBranch} onChange={e => { setStuBranch(e.target.value); setStuSec(SECTIONS[e.target.value]?.[0] || ''); }} className={inputCls} style={{ ...inputStyle, padding: '0 12px' }}>
                          {BRANCHES.map(o => <option key={o} value={o} className="bg-slate-900">{o}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 mb-2 uppercase tracking-widest">Sem</label>
                        <select value={stuSem} onChange={e => setStuSem(e.target.value)} className={inputCls} style={{ ...inputStyle, padding: '0 12px' }}>
                          {SEMESTERS.map(o => <option key={o} value={o} className="bg-slate-900">{o}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 mb-2 uppercase tracking-widest">Sec</label>
                        <select value={stuSec} onChange={e => setStuSec(e.target.value)} className={inputCls} style={{ ...inputStyle, padding: '0 12px' }}>
                          {SECTIONS[stuBranch]?.map(o => <option key={o} value={o} className="bg-slate-900">{o}</option>)}
                        </select>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4 pt-2">
                      <div>
                        <label className="block text-xs font-bold text-slate-400 mb-2 uppercase tracking-widest">Set PIN</label>
                        <div className="relative">
                          <input type={showRegPin ? 'text' : 'password'} inputMode="numeric" maxLength={4} value={regPin} onChange={e => setRegPin(e.target.value.replace(/\D/g, '').slice(0, 4))} className={`${inputCls} pr-10 text-center text-xl tracking-[0.2em] font-black`} style={inputStyle} placeholder="••••" />
                          <button type="button" onClick={() => setShowRegPin(p => !p)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-cyan-400 transition-colors">
                            {showRegPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-400 mb-2 uppercase tracking-widest">Confirm</label>
                        <input type="password" inputMode="numeric" maxLength={4} value={regPinConfirm} onChange={e => setRegPinConfirm(e.target.value.replace(/\D/g, '').slice(0, 4))} className={`${inputCls} text-center text-xl tracking-[0.2em] font-black`} style={inputStyle} placeholder="••••" />
                      </div>
                    </div>
                    {regPin.length === 4 && regPinConfirm.length === 4 && (
                      <div className={`text-xs text-center font-bold mt-2 ${regPin === regPinConfirm ? 'text-emerald-400' : 'text-red-400'}`}>
                        {regPin === regPinConfirm ? '✓ PINs match' : '✗ PINs do not match'}
                      </div>
                    )}
                    <button type="submit" disabled={isLoading} className="w-full py-4 rounded-2xl font-black text-sm flex items-center justify-center gap-2 transition-all active:scale-95 text-slate-950 mt-4 btn-3d" style={btnPrimary('#22d3ee', '#10b981', 'rgba(34,211,238,0.4)')}>
                      {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <><UserPlus className="w-4 h-4" /> Create Account</>}
                    </button>
                  </form>
                )}
              </div>
            )}

            {/* Content Based on Role: FACULTY */}
            {role === 'FACULTY' && (
              <div role="tabpanel" className="animate-fade-in">
                <div className="flex gap-2 mb-6" role="tablist">
                  {(['LOGIN', 'REGISTER'] as FacultyView[]).map(v => (
                    <button key={v} onClick={() => setFacView(v)}
                      className={`flex-1 flex items-center justify-center gap-2 text-xs py-3 rounded-xl font-bold transition-all ${facView === v ? 'bg-stitch-primary-container/30 border-stitch-primary-container/50 text-stitch-primary border' : 'bg-white/5 border-white/10 text-slate-400 border'}`}>
                      {v === 'LOGIN' ? <LogIn className="w-4 h-4" /> : <UserPlus className="w-4 h-4" />}
                      {v === 'LOGIN' ? 'Login' : 'Register'}
                    </button>
                  ))}
                </div>
                <form onSubmit={facView === 'LOGIN' ? handleFacultyLogin : handleFacultyRegister} className="space-y-5">
                  {facView === 'REGISTER' && (
                    <div>
                      <label className="block text-xs font-bold text-slate-400 mb-2 uppercase tracking-widest">Full Name</label>
                      <input type="text" value={facName} onChange={e => setFacName(e.target.value)} className={inputCls} style={inputStyle} placeholder="Prof. Sharma" autoFocus />
                    </div>
                  )}
                  <div>
                    <label className="block text-xs font-bold text-slate-400 mb-2 uppercase tracking-widest">Work Email</label>
                    <input type="email" required value={facEmail} onChange={e => setFacEmail(e.target.value)} className={inputCls} style={inputStyle} placeholder="faculty@gtu.edu" autoFocus={facView === 'LOGIN'} />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-400 mb-2 uppercase tracking-widest">Password</label>
                    <div className="relative">
                      <input type={showPw ? 'text' : 'password'} required value={facPassword} onChange={e => setFacPassword(e.target.value)} className={`${inputCls} pr-12`} style={inputStyle} placeholder={facView === 'LOGIN' ? '••••••••' : 'Min 6 characters'} />
                      <button type="button" onClick={() => setShowPw(p => !p)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-stitch-primary transition-colors">
                        {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                  {facView === 'REGISTER' && (
                    <div>
                      <label className="block text-xs font-bold text-slate-400 mb-2 uppercase tracking-widest">Department</label>
                      <select value={facBranch} onChange={e => setFacBranch(e.target.value)} className={inputCls} style={{ ...inputStyle, padding: '0 12px' }}>
                        {BRANCHES.map(b => <option key={b} value={b} className="bg-slate-900">{b}</option>)}
                      </select>
                    </div>
                  )}
                  <button type="submit" disabled={isLoading} className="w-full py-4 rounded-2xl font-black text-sm flex items-center justify-center gap-2 transition-all active:scale-95 text-white mt-4 btn-3d" style={btnPrimary('#a855f7', '#7e22ce', 'rgba(168,85,247,0.4)')}>
                    {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <>{facView === 'LOGIN' ? 'Access Dashboard' : 'Create Faculty Account'}</>}
                  </button>
                </form>
              </div>
            )}

            {/* Content Based on Role: ADMIN */}
            {role === 'ADMIN' && (
              <div role="tabpanel" className="animate-fade-in">
                <div className="text-center mb-8 space-y-2">
                  <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 bg-gradient-to-br from-amber-400 to-orange-500 shadow-lg shadow-amber-500/20">
                    <Shield className="w-8 h-8 text-white" />
                  </div>
                  <h2 className="text-lg font-black text-white">GTU Administrator</h2>
                  <p className="text-xs text-slate-400">Default code: <span className="text-amber-400 font-mono bg-amber-500/10 px-2 py-0.5 rounded">GTU-ADMIN-2025</span></p>
                </div>
                <form onSubmit={handleAdminLogin} className="space-y-6">
                  <div>
                    <label className="block text-xs font-bold text-slate-400 mb-2 uppercase tracking-widest">Admin Access Code</label>
                    <div className="relative">
                      <input type={showAdminCode ? 'text' : 'password'} value={adminCode} onChange={e => setAdminCode(e.target.value)} className={`${inputCls} pr-12 font-mono tracking-wider`} style={inputStyle} placeholder="GTU-ADMIN-XXXX" autoFocus />
                      <button type="button" onClick={() => setShowAdminCode(p => !p)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-amber-400 transition-colors">
                        {showAdminCode ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                  <button type="submit" disabled={isLoading} className="w-full py-4 rounded-2xl font-black text-sm flex items-center justify-center gap-2 transition-all active:scale-95 text-orange-950 mt-4 btn-3d" style={btnPrimary('#fbbf24', '#f97316', 'rgba(245,158,11,0.4)')}>
                    {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Shield className="w-4 h-4" /> Access GTU Admin</>}
                  </button>
                </form>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="mt-8 text-center opacity-60">
            <p className="text-xs text-slate-400 font-medium">GTU Diploma · EC & ICTET · Semesters 1–6</p>
            <p className="text-[10px] text-slate-500 mt-1 uppercase tracking-widest">Secured Locally · SHA-256 · Offline First</p>
          </div>
        </div>
      </div>
    </div>
  );
};
