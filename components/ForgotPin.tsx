import React, { useState } from 'react';
import { useToast } from './ToastProvider';
import { Loader2, KeyRound, Eye, EyeOff, ChevronLeft } from 'lucide-react';
import { inputCls, inputStyle } from '../utils/authStyles';

/**
 * ForgotPin — Allows a student to reset their PIN by:
 * 1. Entering their enrollment number
 * 2. Setting a new 4-digit PIN (treated as re-registration / PIN reset)
 *
 * Since we are 100% offline with no server, "reset" = re-register with same enrollment.
 * The old account is overwritten with the new PIN hash.
 */
interface ForgotPinProps {
  onBack: () => void;
  onSuccess: () => void;
}

export const ForgotPin: React.FC<ForgotPinProps> = ({ onBack, onSuccess }) => {
  const { error: showError, success: showSuccess } = useToast();
  const [step, setStep] = useState<'ENROLL' | 'NEWPIN'>('ENROLL');
  const [enrollment, setEnrollment] = useState('');
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [showPin, setShowPin] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleCheckEnroll = (e: React.FormEvent) => {
    e.preventDefault();
    if (!enrollment.trim()) {
      showError('Enter your enrollment number');
      return;
    }
    setStep('NEWPIN');
  };

  const handleResetPin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!/^\d{4}$/.test(newPin)) {
      showError('PIN must be exactly 4 digits');
      return;
    }
    if (newPin !== confirmPin) {
      showError('PINs do not match');
      return;
    }

    setIsLoading(true);
    try {
      // Load user DB and overwrite password hash for this enrollment
      const db: Record<string, any> = JSON.parse(localStorage.getItem('gpa_rbac_users_v1') || '{}');
      const id = `STU-${enrollment.toUpperCase()}`;
      if (!db[id] || !db[id].isActive) {
        showError('Enrollment number not found. Please register first.');
        setIsLoading(false);
        return;
      }

      // Hash new PIN using Web Crypto (same salt as rbacAuthService)
      const encoder = new TextEncoder();
      const data = encoder.encode(newPin + 'gpa_hub_salt_2025');
      const hashBuffer = await crypto.subtle.digest('SHA-256', data);
      const hashHex = Array.from(new Uint8Array(hashBuffer))
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');

      db[id].passwordHash = hashHex;
      db[id].lastLogin = Date.now();
      localStorage.setItem('gpa_rbac_users_v1', JSON.stringify(db));

      showSuccess('PIN reset! Please login with your new PIN.');
      onSuccess();
    } catch (err: any) {
      showError(err.message || 'PIN reset failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3 mb-2">
        <button
          type="button"
          aria-label="Back to sign in"
          onClick={onBack}
          className="p-2 rounded-xl text-slate-400 hover:text-white transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
          style={{ background: 'rgba(255,255,255,0.06)' }}
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        <div>
          <div className="text-sm font-black text-white">Reset PIN</div>
          <div className="text-xs text-slate-500">Enter enrollment → set new PIN</div>
        </div>
      </div>

      {step === 'ENROLL' && (
        <form onSubmit={handleCheckEnroll} className="space-y-4">
          <div>
            <label
              htmlFor="forgot-pin-enrollment"
              className="block text-[11px] font-semibold text-slate-400 mb-1.5 uppercase tracking-widest"
            >
              Your Enrollment Number
            </label>
            <input
              id="forgot-pin-enrollment"
              type="text"
              required
              value={enrollment}
              onChange={e => setEnrollment(e.target.value.toUpperCase())}
              className={inputCls}
              style={inputStyle}
              placeholder="e.g. 236080307001"
              autoFocus
            />
          </div>
          <button
            type="submit"
            className="w-full py-3.5 min-h-[52px] rounded-xl font-black text-sm flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
            style={{
              background: 'linear-gradient(135deg, #00f2fe, #10b981)',
              color: '#040810',
              boxShadow: '0 8px 24px rgba(0,242,254,0.25)',
            }}
          >
            Continue <KeyRound className="w-4 h-4" />
          </button>
        </form>
      )}

      {step === 'NEWPIN' && (
        <form onSubmit={handleResetPin} className="space-y-4">
          <div
            className="px-3 py-2.5 rounded-xl text-xs text-cyan-300 font-medium"
            style={{ background: 'rgba(0,242,254,0.08)', border: '1px solid rgba(0,242,254,0.2)' }}
          >
            Resetting PIN for: <span className="font-black">{enrollment}</span>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label
                htmlFor="forgot-pin-new"
                className="block text-[11px] font-semibold text-slate-400 mb-1.5 uppercase tracking-widest"
              >
                New PIN
              </label>
              <div className="relative">
                <input
                  id="forgot-pin-new"
                  type={showPin ? 'text' : 'password'}
                  inputMode="numeric"
                  maxLength={4}
                  value={newPin}
                  onChange={e => setNewPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
                  className={`${inputCls} pr-10 text-center text-xl tracking-widest font-black`}
                  style={inputStyle}
                  placeholder="••••"
                  autoFocus
                />
                <button
                  type="button"
                  onClick={() => setShowPin(p => !p)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500"
                  aria-label={showPin ? 'Hide PIN' : 'Show PIN'}
                >
                  {showPin ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>
            <div>
              <label
                htmlFor="forgot-pin-confirm"
                className="block text-[11px] font-semibold text-slate-400 mb-1.5 uppercase tracking-widest"
              >
                Confirm PIN
              </label>
              <input
                id="forgot-pin-confirm"
                type="password"
                inputMode="numeric"
                maxLength={4}
                value={confirmPin}
                onChange={e => setConfirmPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
                className={`${inputCls} text-center text-xl tracking-widest font-black`}
                style={inputStyle}
                placeholder="••••"
              />
            </div>
          </div>
          {newPin.length === 4 && confirmPin.length === 4 && (
            <div
              className={`text-[11px] text-center font-bold ${newPin === confirmPin ? 'text-emerald-400' : 'text-red-400'}`}
            >
              {newPin === confirmPin ? '✓ PINs match' : '✗ PINs do not match'}
            </div>
          )}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3.5 min-h-[52px] rounded-xl font-black text-sm flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
            style={{
              background: 'linear-gradient(135deg, #00f2fe, #10b981)',
              color: '#040810',
              boxShadow: '0 8px 24px rgba(0,242,254,0.25)',
            }}
          >
            {isLoading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>
                <KeyRound className="w-4 h-4" /> Reset PIN
              </>
            )}
          </button>
        </form>
      )}
    </div>
  );
};
