import React, { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react';
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react';

type ToastType = 'success' | 'error' | 'info' | 'warning';

interface Toast {
  id: string;
  message: string;
  type: ToastType;
  isExiting: boolean;
  progress: number;
}

interface ToastContextType {
  addToast: (message: string, type: ToastType) => void;
  success: (message: string) => void;
  error: (message: string) => void;
  info: (message: string) => void;
  warning: (message: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

const MAX_VISIBLE_TOASTS = 3;
const TOAST_DURATION = 5000;
const EXIT_ANIMATION_MS = 300;

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const timersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());
  const progressIntervalsRef = useRef<Map<string, ReturnType<typeof setInterval>>>(new Map());
  const pausedRef = useRef<Set<string>>(new Set());

  const clearTimers = useCallback((id: string) => {
    const timer = timersRef.current.get(id);
    if (timer) {
      clearTimeout(timer);
      timersRef.current.delete(id);
    }
    const interval = progressIntervalsRef.current.get(id);
    if (interval) {
      clearInterval(interval);
      progressIntervalsRef.current.delete(id);
    }
    pausedRef.current.delete(id);
  }, []);

  const startTimers = useCallback((id: string) => {
    const startTime = Date.now();
    const interval = setInterval(() => {
      if (pausedRef.current.has(id)) return;
      const elapsed = Date.now() - startTime;
      const progress = Math.min(100, (elapsed / TOAST_DURATION) * 100);
      setToasts(prev => prev.map(t => (t.id === id ? { ...t, progress } : t)));
      if (progress >= 100) clearInterval(interval);
    }, 50);
    progressIntervalsRef.current.set(id, interval);

    const timer = setTimeout(() => {
      removeToast(id);
    }, TOAST_DURATION);
    timersRef.current.set(id, timer);
  }, []);

  const removeToast = useCallback(
    (id: string) => {
      clearTimers(id);
      // Start exit animation
      setToasts(prev => prev.map(t => (t.id === id ? { ...t, isExiting: true } : t)));
      // Remove after animation
      setTimeout(() => {
        setToasts(prev => prev.filter(toast => toast.id !== id));
      }, EXIT_ANIMATION_MS);
    },
    [clearTimers]
  );

  const addToast = useCallback(
    (message: string, type: ToastType) => {
      const id = `toast_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

      setToasts(prev => {
        // Deduplicate: if same message exists, don't add
        if (prev.some(t => t.message === message && !t.isExiting)) return prev;
        // Enforce max visible limit
        const newToasts = prev.length >= MAX_VISIBLE_TOASTS ? prev.slice(1) : prev;
        return [...newToasts, { id, message, type, isExiting: false, progress: 0 }];
      });

      startTimers(id);
    },
    [startTimers]
  );

  const handleMouseEnter = useCallback((id: string) => {
    pausedRef.current.add(id);
  }, []);

  const handleMouseLeave = useCallback((id: string) => {
    pausedRef.current.delete(id);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      timersRef.current.forEach(timer => {
        if (typeof timer === 'number') clearTimeout(timer);
      });
      progressIntervalsRef.current.forEach(interval => clearInterval(interval));
    };
  }, []);

  const success = (msg: string) => addToast(msg, 'success');
  const error = (msg: string) => addToast(msg, 'error');
  const info = (msg: string) => addToast(msg, 'info');
  const warning = (msg: string) => addToast(msg, 'warning');

  const typeConfig = {
    success: {
      icon: CheckCircle,
      color: 'text-emerald-400',
      border: 'border-emerald-500/30',
      bg: 'bg-emerald-500/10',
      progress: 'bg-emerald-500',
    },
    error: {
      icon: AlertCircle,
      color: 'text-rose-400',
      border: 'border-rose-500/30',
      bg: 'bg-rose-500/10',
      progress: 'bg-rose-500',
    },
    info: {
      icon: Info,
      color: 'text-indigo-400',
      border: 'border-indigo-500/30',
      bg: 'bg-indigo-500/10',
      progress: 'bg-indigo-500',
    },
    warning: {
      icon: AlertTriangle,
      color: 'text-amber-400',
      border: 'border-amber-500/30',
      bg: 'bg-amber-500/10',
      progress: 'bg-amber-500',
    },
  };

  return (
    <ToastContext.Provider value={{ addToast, success, error, info, warning }}>
      {children}
      <div
        className="fixed bottom-6 right-6 z-[60] flex flex-col gap-3 pointer-events-none max-h-[calc(100dvh-48px)] overflow-hidden"
        aria-live="polite"
        aria-label="Notifications"
        role="status"
      >
        {toasts.map(toast => {
          const config = typeConfig[toast.type];
          const Icon = config.icon;
          return (
            <div
              key={toast.id}
              role={toast.type === 'error' ? 'alert' : 'status'}
              onMouseEnter={() => handleMouseEnter(toast.id)}
              onMouseLeave={() => handleMouseLeave(toast.id)}
              className={`pointer-events-auto min-w-[320px] max-w-sm w-full rounded-xl shadow-2xl border overflow-hidden transition-all duration-300 ease-out ${
                toast.isExiting
                  ? 'opacity-0 translate-x-full scale-95'
                  : 'opacity-100 translate-x-0 scale-100'
              } ${config.border}`}
              style={{ background: 'rgba(15,15,25,0.95)', backdropFilter: 'blur(20px)' }}
            >
              <div className="p-4 flex items-start gap-3">
                <div className={`shrink-0 mt-0.5 ${config.color}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <div className="flex-1 pt-0.5 min-w-0">
                  <p className="text-sm font-medium text-white leading-snug">{toast.message}</p>
                </div>
                <button
                  onClick={() => removeToast(toast.id)}
                  className="text-slate-400 hover:text-white transition-colors p-1.5 min-h-[44px] min-w-[44px] flex items-center justify-center shrink-0"
                  aria-label="Dismiss notification"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              {/* Progress bar */}
              <div className="h-0.5 w-full bg-white/5">
                <div
                  className={`h-full transition-all duration-100 linear ${config.progress} opacity-60`}
                  style={{ width: `${toast.progress}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};
