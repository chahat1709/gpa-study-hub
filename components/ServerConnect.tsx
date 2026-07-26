import React, { useState, useEffect } from 'react';
import { Loader2, Server, Wifi, WifiOff, CheckCircle, XCircle, Settings } from 'lucide-react';
import { checkServerHealth, getStoredServerIp, setServerIp } from '../services/apiClient';

interface ServerConnectProps {
  onConnected: () => void;
}

const ServerConnect: React.FC<ServerConnectProps> = ({ onConnected }) => {
  const [ip, setIp] = useState(getStoredServerIp());
  const [status, setStatus] = useState<'idle' | 'checking' | 'connected' | 'error'>('idle');
  const [showSettings, setShowSettings] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const testConnection = async () => {
    setStatus('checking');
    setErrorMsg('');
    setServerIp(ip);

    const ok = await checkServerHealth();
    if (ok) {
      setStatus('connected');
      setTimeout(() => onConnected(), 800);
    } else {
      setStatus('error');
      setErrorMsg('Cannot reach server. Make sure the server is running on your college PC.');
    }
  };

  useEffect(() => {
    testConnection();
  }, []);

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4"
      style={{ background: 'linear-gradient(135deg, #050810 0%, #0a0f20 50%, #050810 100%)' }}>

      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-40 -left-40 w-[500px] h-[500px] rounded-full opacity-[0.12] blur-3xl"
          style={{ background: 'radial-gradient(circle, #00f2fe, transparent)' }} />
        <div className="absolute -bottom-40 -right-40 w-[500px] h-[500px] rounded-full opacity-[0.10] blur-3xl"
          style={{ background: 'radial-gradient(circle, #fbbf24, transparent)' }} />
      </div>

      <div className="relative z-10 w-full max-w-sm">
        <div className="glass-card p-8 rounded-3xl border border-white/10 text-center">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6"
            style={{ background: 'linear-gradient(135deg, #00f2fe, #10b981)', boxShadow: '0 0 32px rgba(0,242,254,0.3)' }}>
            <Server className="w-8 h-8 text-white" />
          </div>

          <h1 className="text-xl font-bold text-white mb-2">Connect to Campus</h1>
          <p className="text-xs text-slate-400 mb-6">
            Enter your college PC's IP address to connect
          </p>

          {/* Status */}
          {status === 'connected' && (
            <div className="flex items-center justify-center gap-2 text-emerald-400 text-sm font-bold mb-4">
              <CheckCircle className="w-5 h-5" /> Connected!
            </div>
          )}

          {status === 'error' && (
            <div className="flex items-center justify-center gap-2 text-rose-400 text-xs font-medium mb-4">
              <XCircle className="w-4 h-4" /> {errorMsg}
            </div>
          )}

          {/* Server IP Input */}
          <div className="space-y-3">
            <div>
              <label className="block text-[10px] font-semibold text-slate-400 mb-1.5 uppercase tracking-widest">
                College PC IP Address
              </label>
              <input
                type="text"
                value={ip}
                onChange={e => setIp(e.target.value)}
                className="w-full px-4 py-3 text-center text-lg font-mono font-bold rounded-xl focus:ring-2 focus:ring-cyan-500/40"
                placeholder="192.168.1.100"
              />
            </div>

            <p className="text-[10px] text-slate-500">
              Find your PC's IP: Open CMD → type <span className="font-mono text-cyan-400">ipconfig</span>
            </p>

            <button
              onClick={testConnection}
              disabled={status === 'checking'}
              className="w-full py-3.5 min-h-[52px] rounded-xl font-black text-sm flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
              style={{ background: 'linear-gradient(135deg, #00f2fe, #10b981)', color: '#040810' }}
            >
              {status === 'checking' ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : status === 'connected' ? (
                <><CheckCircle className="w-5 h-5" /> Launching...</>
              ) : (
                <><Wifi className="w-5 h-5" /> Connect</>
              )}
            </button>
          </div>

          <div className="mt-6 p-3 rounded-xl bg-white/5 border border-white/10">
            <div className="flex items-start gap-2">
              <Settings className="w-3.5 h-3.5 text-slate-400 mt-0.5 shrink-0" />
              <div className="text-left">
                <p className="text-[10px] font-bold text-slate-300 uppercase tracking-wider mb-1">How to set up:</p>
                <ol className="text-[10px] text-slate-400 space-y-0.5 list-decimal list-inside">
                  <li>Run <span className="font-mono text-cyan-400">npm start</span> in the server folder</li>
                  <li>Note the IP shown in the terminal</li>
                  <li>Enter it above and tap Connect</li>
                </ol>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ServerConnect;
