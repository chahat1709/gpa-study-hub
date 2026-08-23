import React, { useEffect, useRef, useState } from 'react';
import { useAuth } from './AuthContext';
import { useToast } from './ToastProvider';
import { ForgotPin } from './ForgotPin';
import {
  ArrowRight,
  BookOpen,
  Brain,
  Building2,
  Check,
  Eye,
  EyeOff,
  Fingerprint,
  GraduationCap,
  KeyRound,
  Loader2,
  LogIn,
  Shield,
  Sparkles,
  User,
  UserPlus,
  Users,
  Zap,
} from 'lucide-react';

const BRANCHES = ['EC', 'ICT'];
const SEMESTERS = ['1', '2', '3', '4', '5', '6'];
const SECTIONS: Record<string, string[]> = { EC: ['A', 'B', 'C'], ICT: ['A', 'B'] };
type RoleTab = 'STUDENT' | 'FACULTY' | 'ADMIN';
type StudentView = 'LOGIN' | 'REGISTER';
type FacultyView = 'LOGIN' | 'REGISTER';

const roleCopy = {
  STUDENT: {
    eyebrow: 'Student workspace',
    title: 'Your academic day, organized.',
    desc: 'Open your schedule, attendance, study tools, and exam preparation from one focused workspace.',
    icon: GraduationCap,
    accent: 'mint',
  },
  FACULTY: {
    eyebrow: 'Faculty workspace',
    title: 'Keep your class moving.',
    desc: 'Manage attendance, notices, resources, and student communication from a single secure dashboard.',
    icon: Building2,
    accent: 'violet',
  },
  ADMIN: {
    eyebrow: 'GTU administration',
    title: 'Operate the academic network.',
    desc: 'Access system controls, configuration, and institutional tools with protected administrator access.',
    icon: Shield,
    accent: 'coral',
  },
} as const;

const Field = ({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) => (
  <label className="auth-field">
    <span className="auth-label">{label}</span>
    {children}
    {hint && <span className="auth-hint">{hint}</span>}
  </label>
);

interface PinInputsProps {
  register?: boolean;
  showRegPin: boolean;
  setShowRegPin: React.Dispatch<React.SetStateAction<boolean>>;
  regPin: string;
  setRegPin: React.Dispatch<React.SetStateAction<string>>;
  regPinConfirm: string;
  setRegPinConfirm: React.Dispatch<React.SetStateAction<string>>;
  stuPin: string[];
  pinRefs: React.MutableRefObject<(HTMLInputElement | null)[]>;
  handlePinDigit: (idx: number, value: string) => void;
}

const PinInputs: React.FC<PinInputsProps> = ({
  register = false,
  showRegPin,
  setShowRegPin,
  regPin,
  setRegPin,
  regPinConfirm,
  setRegPinConfirm,
  stuPin,
  pinRefs,
  handlePinDigit,
}) => {
  if (register)
    return (
      <div className="auth-pin-row auth-pin-row-compact">
        <div className="auth-pin-wrap">
          <input
            className="auth-input auth-pin-input"
            type={showRegPin ? 'text' : 'password'}
            inputMode="numeric"
            maxLength={4}
            value={regPin}
            onChange={e => setRegPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
            placeholder="••••"
            aria-label="Set four digit PIN"
          />
          <button
            type="button"
            className="auth-input-action"
            onClick={() => setShowRegPin(p => !p)}
            aria-label={showRegPin ? 'Hide PIN' : 'Show PIN'}
          >
            {showRegPin ? <EyeOff /> : <Eye />}
          </button>
        </div>
        <input
          className="auth-input auth-pin-input"
          type="password"
          inputMode="numeric"
          maxLength={4}
          value={regPinConfirm}
          onChange={e => setRegPinConfirm(e.target.value.replace(/\D/g, '').slice(0, 4))}
          placeholder="••••"
          aria-label="Confirm four digit PIN"
        />
      </div>
    );
  return (
    <div className="auth-pin-row">
      {stuPin.map((digit, idx) => (
        <input
          key={idx}
          ref={el => {
            pinRefs.current[idx] = el;
          }}
          className="auth-input auth-pin-digit"
          type="password"
          inputMode="numeric"
          maxLength={1}
          value={digit}
          onChange={e => handlePinDigit(idx, e.target.value)}
          onKeyDown={e => {
            if (e.key === 'Backspace' && !digit && idx > 0) pinRefs.current[idx - 1]?.focus();
          }}
          aria-label={`PIN digit ${idx + 1}`}
        />
      ))}
    </div>
  );
};

export const AuthPage: React.FC = () => {
  const { studentLogin, studentRegister, facultyLogin, facultyRegister, adminLogin } = useAuth();
  const { error: showError, success: showSuccess } = useToast();
  const [role, setRole] = useState<RoleTab>('STUDENT');
  const [isLoading, setIsLoading] = useState(false);
  const [showForgotPin, setShowForgotPin] = useState(false);
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
  const [facView, setFacView] = useState<FacultyView>('LOGIN');
  const [facEmail, setFacEmail] = useState('');
  const [facPassword, setFacPassword] = useState('');
  const [facName, setFacName] = useState('');
  const [facBranch, setFacBranch] = useState('EC');
  const [showPw, setShowPw] = useState(false);
  const [adminCode, setAdminCode] = useState('');
  const [showAdminCode, setShowAdminCode] = useState(false);

  const copy = roleCopy[role];
  const RoleIcon = copy.icon;

  const handlePinDigit = (idx: number, value: string) => {
    const digit = value.replace(/\D/g, '').slice(0, 1);
    const next = [...stuPin];
    next[idx] = digit;
    setStuPin(next);
    if (digit && idx < 3) pinRefs.current[idx + 1]?.focus();
    if (!digit && idx > 0) pinRefs.current[idx - 1]?.focus();
  };

  const run = async (fn: () => Promise<void>) => {
    setIsLoading(true);
    try {
      await fn();
    } catch (e: any) {
      showError(e.message || 'Something went wrong');
    } finally {
      setIsLoading(false);
    }
  };

  const handleStudentLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const pin = stuPin.join('');
    if (!stuEnroll.trim()) return showError('Enter enrollment number');
    if (pin.length < 4) return showError('Enter your 4-digit PIN');
    run(() =>
      studentLogin(stuEnroll.trim().toUpperCase(), pin).then(() => showSuccess('Welcome back!'))
    );
  };
  const handleStudentRegister = (e: React.FormEvent) => {
    e.preventDefault();
    if (!stuName.trim() || !stuEnroll.trim())
      return showError('Name and enrollment number required');
    if (!/^\d{4}$/.test(regPin)) return showError('PIN must be exactly 4 digits');
    if (regPin !== regPinConfirm) return showError('PINs do not match');
    run(() =>
      studentRegister(stuName.trim(), stuEnroll.trim(), regPin, stuBranch, stuSem, stuSec).then(
        () => showSuccess('Account created!')
      )
    );
  };
  const handleFacultyLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!facEmail || !facPassword) return showError('Email and password required');
    run(() => facultyLogin(facEmail, facPassword).then(() => showSuccess('Welcome back!')));
  };
  const handleFacultyRegister = (e: React.FormEvent) => {
    e.preventDefault();
    if (!facName || !facEmail || !facPassword) return showError('All fields required');
    if (facPassword.length < 6) return showError('Password must be at least 6 characters');
    run(() =>
      facultyRegister(facName, facEmail, facPassword, facBranch).then(() =>
        showSuccess('Faculty account created')
      )
    );
  };
  const handleAdminLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminCode) return showError('Admin code required');
    run(() => adminLogin(adminCode).then(() => showSuccess('Administrator access granted')));
  };

  useEffect(() => {
    setShowForgotPin(false);
  }, [role, stuView]);

  return (
    <main className="auth-page">
      <div className="auth-shell">
        <section
          className={`auth-story auth-story-${copy.accent}`}
          aria-label="GPA Study Hub introduction"
        >
          <div className="auth-brand">
            <div className="auth-logo">
              <GraduationCap />
            </div>
            <div>
              <strong>GPA Study Hub</strong>
              <span>GTU academic workspace</span>
            </div>
          </div>
          <div className="auth-story-main">
            <p className="auth-kicker">
              <Sparkles /> {copy.eyebrow}
            </p>
            <h1>{copy.title}</h1>
            <p className="auth-story-copy">{copy.desc}</p>
            <div className="auth-story-list">
              <div>
                <Check />{' '}
                <span>
                  <b>One calm home</b>
                  <small>Everything important is visible at a glance.</small>
                </span>
              </div>
              <div>
                <Check />{' '}
                <span>
                  <b>Built for GTU</b>
                  <small>EC and ICT students, faculty, and administrators.</small>
                </span>
              </div>
              <div>
                <Check />{' '}
                <span>
                  <b>Works offline</b>
                  <small>Your study flow continues when the network does not.</small>
                </span>
              </div>
            </div>
          </div>
          <div className="auth-story-footer">
            <span className="auth-live-dot" /> Community edition · No subscription required
          </div>
        </section>

        <section className="auth-panel">
          <div className="auth-mobile-brand">
            <div className="auth-logo">
              <GraduationCap />
            </div>
            <div>
              <strong>GPA Study Hub</strong>
              <span>GTU academic workspace</span>
            </div>
          </div>
          <div className="auth-form-wrap">
            <div className="auth-form-heading">
              <p className="auth-overline">Welcome back</p>
              <h2>Sign in to continue</h2>
              <p>Choose your workspace and enter your details.</p>
            </div>
            <div className="auth-role-tabs" role="tablist" aria-label="Choose workspace">
              {(['STUDENT', 'FACULTY', 'ADMIN'] as RoleTab[]).map(item => {
                const ItemIcon = roleCopy[item].icon;
                return (
                  <button
                    key={item}
                    role="tab"
                    aria-selected={role === item}
                    className={role === item ? 'is-active' : ''}
                    onClick={() => setRole(item)}
                  >
                    <ItemIcon />
                    <span>
                      {item === 'STUDENT' ? 'Student' : item === 'FACULTY' ? 'Faculty' : 'Admin'}
                    </span>
                  </button>
                );
              })}
            </div>

            {role === 'STUDENT' && (
              <div className="auth-form-body" role="tabpanel">
                <div className="auth-subtabs">
                  <button
                    className={stuView === 'LOGIN' ? 'is-active' : ''}
                    onClick={() => setStuView('LOGIN')}
                  >
                    <LogIn /> Sign in
                  </button>
                  <button
                    className={stuView === 'REGISTER' ? 'is-active' : ''}
                    onClick={() => setStuView('REGISTER')}
                  >
                    <UserPlus /> Create account
                  </button>
                </div>
                {stuView === 'LOGIN' && !showForgotPin && (
                  <form className="auth-form" onSubmit={handleStudentLogin}>
                    <Field
                      label="Enrollment number"
                      hint="Use the number on your GTU identity card"
                    >
                      <input
                        className="auth-input"
                        type="text"
                        value={stuEnroll}
                        onChange={e => setStuEnroll(e.target.value)}
                        placeholder="236080307001"
                        autoCapitalize="characters"
                        aria-required="true"
                      />
                    </Field>
                    <Field label="4-digit PIN">
                      <div className="auth-pin-label">
                        <Fingerprint />
                        <span>Enter your secure campus PIN</span>
                      </div>
                      <PinInputs
                        showRegPin={showRegPin}
                        setShowRegPin={setShowRegPin}
                        regPin={regPin}
                        setRegPin={setRegPin}
                        regPinConfirm={regPinConfirm}
                        setRegPinConfirm={setRegPinConfirm}
                        stuPin={stuPin}
                        pinRefs={pinRefs}
                        handlePinDigit={handlePinDigit}
                      />
                    </Field>
                    <button
                      className="auth-submit auth-submit-mint"
                      type="submit"
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <Loader2 className="spin" />
                      ) : (
                        <>
                          <span>Enter campus</span>
                          <ArrowRight />
                        </>
                      )}
                    </button>
                    <button
                      className="auth-link-row"
                      type="button"
                      onClick={() => setShowForgotPin(true)}
                    >
                      Forgot your PIN? <span>Reset access</span>
                    </button>
                  </form>
                )}
                {stuView === 'LOGIN' && showForgotPin && (
                  <ForgotPin
                    onBack={() => setShowForgotPin(false)}
                    onSuccess={() => setShowForgotPin(false)}
                  />
                )}
                {stuView === 'REGISTER' && (
                  <form className="auth-form" onSubmit={handleStudentRegister}>
                    <Field label="Full name">
                      <input
                        className="auth-input"
                        required
                        type="text"
                        value={stuName}
                        onChange={e => setStuName(e.target.value)}
                        placeholder="Rahul Patel"
                      />
                    </Field>
                    <Field label="Enrollment number">
                      <input
                        className="auth-input"
                        required
                        type="text"
                        value={stuEnroll}
                        onChange={e => setStuEnroll(e.target.value.toUpperCase())}
                        placeholder="236080307001"
                      />
                    </Field>
                    <div className="auth-grid-3">
                      <Field label="Branch">
                        <select
                          className="auth-input"
                          value={stuBranch}
                          onChange={e => {
                            setStuBranch(e.target.value);
                            setStuSec(SECTIONS[e.target.value]?.[0] || '');
                          }}
                        >
                          {BRANCHES.map(o => (
                            <option key={o}>{o}</option>
                          ))}
                        </select>
                      </Field>
                      <Field label="Semester">
                        <select
                          className="auth-input"
                          value={stuSem}
                          onChange={e => setStuSem(e.target.value)}
                        >
                          {SEMESTERS.map(o => (
                            <option key={o}>{o}</option>
                          ))}
                        </select>
                      </Field>
                      <Field label="Section">
                        <select
                          className="auth-input"
                          value={stuSec}
                          onChange={e => setStuSec(e.target.value)}
                        >
                          {SECTIONS[stuBranch]?.map(o => (
                            <option key={o}>{o}</option>
                          ))}
                        </select>
                      </Field>
                    </div>
                    <Field label="Create a 4-digit PIN">
                      <PinInputs
                        register
                        showRegPin={showRegPin}
                        setShowRegPin={setShowRegPin}
                        regPin={regPin}
                        setRegPin={setRegPin}
                        regPinConfirm={regPinConfirm}
                        setRegPinConfirm={setRegPinConfirm}
                        stuPin={stuPin}
                        pinRefs={pinRefs}
                        handlePinDigit={handlePinDigit}
                      />
                    </Field>
                    {regPin.length === 4 && regPinConfirm.length === 4 && (
                      <div
                        className={
                          regPin === regPinConfirm ? 'auth-validation ok' : 'auth-validation error'
                        }
                      >
                        {regPin === regPinConfirm ? 'PINs match' : 'PINs do not match'}
                      </div>
                    )}
                    <button
                      className="auth-submit auth-submit-mint"
                      type="submit"
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <Loader2 className="spin" />
                      ) : (
                        <>
                          <span>Create student account</span>
                          <ArrowRight />
                        </>
                      )}
                    </button>
                  </form>
                )}
              </div>
            )}

            {role === 'FACULTY' && (
              <div className="auth-form-body" role="tabpanel">
                <div className="auth-subtabs">
                  <button
                    className={facView === 'LOGIN' ? 'is-active' : ''}
                    onClick={() => setFacView('LOGIN')}
                  >
                    <LogIn /> Sign in
                  </button>
                  <button
                    className={facView === 'REGISTER' ? 'is-active' : ''}
                    onClick={() => setFacView('REGISTER')}
                  >
                    <UserPlus /> Create account
                  </button>
                </div>
                <form
                  className="auth-form"
                  onSubmit={facView === 'LOGIN' ? handleFacultyLogin : handleFacultyRegister}
                >
                  {facView === 'REGISTER' && (
                    <Field label="Full name">
                      <input
                        className="auth-input"
                        type="text"
                        value={facName}
                        onChange={e => setFacName(e.target.value)}
                        placeholder="Prof. Sharma"
                      />
                    </Field>
                  )}
                  <Field label="Work email">
                    <input
                      className="auth-input"
                      type="email"
                      required
                      value={facEmail}
                      onChange={e => setFacEmail(e.target.value)}
                      placeholder="faculty@gtu.edu"
                    />
                  </Field>
                  <Field label="Password">
                    <div className="auth-pin-wrap">
                      <input
                        className="auth-input"
                        aria-label="Password"
                        type={showPw ? 'text' : 'password'}
                        required
                        value={facPassword}
                        onChange={e => setFacPassword(e.target.value)}
                        placeholder={
                          facView === 'LOGIN' ? 'Enter password' : 'At least 6 characters'
                        }
                      />
                      <button
                        type="button"
                        className="auth-input-action"
                        onClick={() => setShowPw(p => !p)}
                        aria-label={showPw ? 'Hide password' : 'Show password'}
                      >
                        {showPw ? <EyeOff /> : <Eye />}
                      </button>
                    </div>
                  </Field>
                  {facView === 'REGISTER' && (
                    <Field label="Department">
                      <select
                        className="auth-input"
                        value={facBranch}
                        onChange={e => setFacBranch(e.target.value)}
                      >
                        {BRANCHES.map(b => (
                          <option key={b}>{b}</option>
                        ))}
                      </select>
                    </Field>
                  )}
                  <button
                    className="auth-submit auth-submit-violet"
                    type="submit"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <Loader2 className="spin" />
                    ) : (
                      <>
                        <span>
                          {facView === 'LOGIN'
                            ? 'Access faculty workspace'
                            : 'Create faculty account'}
                        </span>
                        <ArrowRight />
                      </>
                    )}
                  </button>
                </form>
              </div>
            )}

            {role === 'ADMIN' && (
              <div className="auth-form-body" role="tabpanel">
                <div className="auth-admin-callout">
                  <div className="auth-admin-icon">
                    <Shield />
                  </div>
                  <div>
                    <strong>Protected administrator access</strong>
                    <span>This area is reserved for GTU system operators.</span>
                  </div>
                </div>
                <form className="auth-form" onSubmit={handleAdminLogin}>
                  <Field label="Admin access code">
                    <div className="auth-pin-wrap">
                      <input
                        className="auth-input"
                        type={showAdminCode ? 'text' : 'password'}
                        value={adminCode}
                        onChange={e => setAdminCode(e.target.value)}
                        placeholder="GTU-ADMIN-XXXX"
                      />
                      <button
                        type="button"
                        className="auth-input-action"
                        onClick={() => setShowAdminCode(p => !p)}
                        aria-label={showAdminCode ? 'Hide access code' : 'Show access code'}
                      >
                        {showAdminCode ? <EyeOff /> : <Eye />}
                      </button>
                    </div>
                  </Field>
                  <button
                    className="auth-submit auth-submit-coral"
                    type="submit"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <Loader2 className="spin" />
                    ) : (
                      <>
                        <span>Enter admin workspace</span>
                        <ArrowRight />
                      </>
                    )}
                  </button>
                </form>
              </div>
            )}
          </div>
          <div className="auth-security-note">
            <Shield />
            <span>Local-first access · Your credentials stay on this device</span>
          </div>
        </section>
      </div>
    </main>
  );
};
