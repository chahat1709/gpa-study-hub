import React, { useRef, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { useToast } from './ToastProvider';
import {
  User as UserIcon, Camera, Loader2,
  LogOut, Key, Eye, EyeOff,
  Shield, Globe, Cpu
} from 'lucide-react';
import {
  AIProvider, PROVIDERS,
  getSelectedProvider, setSelectedProvider,
  getGeminiApiKey, setGeminiApiKey,
  getZenApiKey, setZenApiKey,
  getCustomConfig, setCustomConfig,
} from '../services/aiProviderService';

const ProfileInterface: React.FC = () => {
  const { user, uploadProfilePicture, logout } = useAuth();
  const { success, error } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  
  // AI Config State
  const [provider, setProviderState] = useState<AIProvider>(getSelectedProvider());
  const [geminiKey, setGeminiKeyState] = useState(getGeminiApiKey());
  const [zenKey, setZenKeyState] = useState(getZenApiKey());
  const [customUrl, setCustomUrlState] = useState('');
  const [customKey, setCustomKeyState] = useState('');
  const [customModel, setCustomModelState] = useState('');
  const [showKey, setShowKey] = useState(false);

  useEffect(() => {
    setProviderState(getSelectedProvider());
    setGeminiKeyState(getGeminiApiKey());
    setZenKeyState(getZenApiKey());
    const custom = getCustomConfig();
    setCustomUrlState(custom.url);
    setCustomKeyState(custom.key);
    setCustomModelState(custom.model);
  }, []);

  const handleProviderChange = (p: AIProvider) => {
    setProviderState(p);
    setSelectedProvider(p);
    success(`Switched to ${PROVIDERS[p].name}`);
  };

  const handleSaveGemini = () => {
    if (geminiKey.trim().startsWith('AIza')) {
      setGeminiApiKey(geminiKey.trim());
      success("Gemini API Key saved");
    } else {
      error("Invalid Gemini key format (should start with AIza)");
    }
  };

  const handleSaveZen = () => {
    if (zenKey.trim().length > 10) {
      setZenApiKey(zenKey.trim());
      success("OpenCode Zen API Key saved");
    } else {
      error("Invalid API key");
    }
  };

  const handleSaveCustom = () => {
    if (customUrl && customKey && customModel) {
      setCustomConfig(customUrl.trim(), customKey.trim(), customModel.trim());
      success("Custom AI configuration saved");
    } else {
      error("URL, key, and model are all required");
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setIsUploading(true);
      try {
        await uploadProfilePicture(file);
        success("Profile image updated");
      } catch (err) {
        error("Upload failed");
      } finally { setIsUploading(false); }
    }
  };

  if (!user) return (
    <div className="h-full w-full flex flex-col items-center justify-center bg-transparent text-white gap-3">
      <Loader2 className="w-6 h-6 animate-spin text-cyan-400" />
      <p className="text-sm text-slate-400 font-medium">Loading profile...</p>
    </div>
  );

  return (
    <div className="h-full flex flex-col overflow-y-auto no-scrollbar pb-20 lg:pb-8" style={{ background: 'transparent' }}>
      <div className="max-w-3xl mx-auto p-6 md:p-10 space-y-8 w-full">
        
        {/* Profile Card */}
        <div className="glass-card bg-slate-900/40 backdrop-blur-xl p-8 rounded-3xl border border-white/10 flex flex-col items-center md:flex-row gap-8 relative overflow-hidden shadow-[0_0_30px_rgba(34,211,238,0.1)]">
          <div className="relative group shrink-0">
            <div 
              className={`w-28 h-28 rounded-full overflow-hidden border-2 border-cyan-400/40 shadow-[0_0_20px_rgba(34,211,238,0.2)] bg-white/5 cursor-pointer relative ${isUploading ? 'opacity-50' : ''}`}
              onClick={() => fileInputRef.current?.click()}
            >
              {user.photoURL ? (
                <img src={user.photoURL} alt={user.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-slate-400">
                  <UserIcon className="w-12 h-12" />
                </div>
              )}
              <div className="absolute inset-0 bg-black/40 group-hover:bg-black/60 transition-all flex items-center justify-center rounded-full">
                <Camera className="w-6 h-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            </div>
            <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileChange} />
          </div>

          <div className="text-center md:text-left flex-1">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
              <div>
                <h1 className="text-2xl font-bold text-white tracking-tight">{user.name}</h1>
                <p className="text-slate-400 font-medium text-xs mt-0.5">{user.role} • {user.branch || 'Diploma EC'}</p>
              </div>
              <span className="px-3 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 rounded-full text-xs font-bold w-fit mx-auto md:mx-0 shadow-inner">
                {user.role}
              </span>
            </div>

            <div className="flex justify-center md:justify-start gap-2 mt-4 flex-wrap">
               <span className="px-3 py-1 bg-white/5 border border-white/10 text-slate-300 rounded-xl text-xs font-semibold">
                 Sem {user.semester || '4'} - Sec {user.section || 'A'}
               </span>
               <span className="px-3 py-1 bg-cyan-500/10 border border-cyan-400/30 text-cyan-300 rounded-xl text-xs font-mono font-bold shadow-inner">
                 {user.enrollmentNumber || '22EC101'}
               </span>
            </div>

            {/* Role Info (Read-only - Roles are server-controlled) */}
            <div className="mt-5 pt-4 border-t border-white/10 flex flex-wrap items-center gap-2 justify-center md:justify-start">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider w-full md:w-auto">Current Role:</span>
              <span className={`px-4 py-2 text-xs font-bold rounded-xl border ${user.role === 'STUDENT' ? 'bg-gradient-to-r from-cyan-500 to-blue-500 text-slate-950 border-cyan-400/50 shadow-lg shadow-cyan-500/30' : user.role === 'FACULTY' ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white border-purple-400/50 shadow-lg shadow-purple-500/30' : 'bg-gradient-to-r from-amber-500 to-orange-500 text-white border-amber-400/50 shadow-lg shadow-amber-500/30'}`}>
                {user.role === 'STUDENT' ? 'Student' : user.role === 'FACULTY' ? 'Faculty' : 'GTU Admin'}
              </span>
              <span className="text-[9px] text-slate-500 italic">Role changes require admin approval</span>
            </div>
          </div>
        </div>

        {/* Configuration Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* AI Configuration */}
          <div className="glass-card bg-slate-900/40 backdrop-blur-xl p-6 rounded-3xl border border-white/10 shadow-[0_0_20px_rgba(34,211,238,0.05)]">
            <div className="flex items-center gap-3 mb-6">
               <div className="p-2.5 bg-cyan-500/20 border border-cyan-400/30 rounded-xl text-cyan-400 shadow-[0_0_15px_rgba(34,211,238,0.2)]">
                 <Cpu className="w-5 h-5" />
               </div>
               <div>
                 <h3 className="font-semibold text-white text-sm">AI Provider</h3>
                 <p className="text-xs text-slate-400">BYOK — your key, your data</p>
               </div>
            </div>

            {/* Provider Selector */}
            <div className="space-y-2 mb-5">
              {(Object.keys(PROVIDERS) as AIProvider[]).map((p) => (
                <button
                  key={p}
                  onClick={() => handleProviderChange(p)}
                  className={`w-full p-3 rounded-xl border text-left text-xs font-medium transition-all flex items-center gap-3 ${
                    provider === p
                      ? 'bg-cyan-500/20 border-cyan-400/50 text-white shadow-inner shadow-[0_0_10px_rgba(34,211,238,0.1)]'
                      : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10'
                  }`}
                >
                  <span className={`w-2 h-2 rounded-full ${provider === p ? 'bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.8)]' : 'bg-slate-500'}`} />
                  <div>
                    <div className="font-bold">{PROVIDERS[p].name}</div>
                    {p === 'opencode-zen' && <div className="text-[10px] text-emerald-400 font-bold mt-0.5">FREE — No limits</div>}
                  </div>
                </button>
              ))}
            </div>

            {/* Provider-specific key inputs */}
            <div className="space-y-4">
              {provider === 'gemini' && (
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">Gemini API Key</label>
                  <div className="relative">
                    <input
                      type={showKey ? "text" : "password"}
                      value={geminiKey}
                      onChange={(e) => setGeminiKeyState(e.target.value)}
                      className="w-full pl-3 pr-12 py-2.5 bg-white/5 border border-white/10 rounded-xl text-xs text-white focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/30 transition-all font-mono"
                      placeholder="AIza..."
                    />
                    <button
                      onClick={() => setShowKey(!showKey)}
                      className="absolute right-1 top-1 p-2.5 min-h-[44px] min-w-[44px] flex items-center justify-center text-slate-400 hover:text-white"
                    >
                      {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  <button onClick={handleSaveGemini} disabled={!geminiKey} className="w-full mt-2 py-2.5 min-h-[44px] bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-slate-950 font-bold rounded-xl text-xs transition-all shadow-[0_0_15px_rgba(34,211,238,0.2)] active:scale-95">Save Gemini Key</button>
                </div>
              )}

              {provider === 'opencode-zen' && (
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">OpenCode Zen API Key</label>
                  <div className="relative">
                    <input
                      type={showKey ? "text" : "password"}
                      value={zenKey}
                      onChange={(e) => setZenKeyState(e.target.value)}
                      className="w-full pl-3 pr-12 py-2.5 bg-white/5 border border-white/10 rounded-xl text-xs text-white focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/30 transition-all font-mono"
                      placeholder="Get free key at opencode.ai/auth"
                    />
                    <button
                      onClick={() => setShowKey(!showKey)}
                      className="absolute right-1 top-1 p-2.5 min-h-[44px] min-w-[44px] flex items-center justify-center text-slate-400 hover:text-white"
                    >
                      {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  <a href="https://opencode.ai/auth" target="_blank" rel="noopener noreferrer" className="block mt-2 text-center py-2 text-cyan-400 text-xs font-bold hover:underline drop-shadow-md">
                    Get free API key →
                  </a>
                  <button onClick={handleSaveZen} disabled={!zenKey} className="w-full mt-2 py-2.5 min-h-[44px] bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-slate-950 font-bold rounded-xl text-xs transition-all shadow-[0_0_15px_rgba(34,211,238,0.2)] active:scale-95">Save Zen Key</button>
                </div>
              )}

              {provider === 'custom' && (
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1.5">API Endpoint URL</label>
                    <input
                      type="url"
                      value={customUrl}
                      onChange={(e) => setCustomUrlState(e.target.value)}
                      className="w-full px-3 py-2.5 bg-white/5 border border-white/10 rounded-xl text-xs text-white focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/30 transition-all font-mono"
                      placeholder="https://api.example.com/v1/chat/completions"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1.5">API Key</label>
                    <div className="relative">
                      <input
                        type={showKey ? "text" : "password"}
                        value={customKey}
                        onChange={(e) => setCustomKeyState(e.target.value)}
                        className="w-full pl-3 pr-12 py-2.5 bg-white/5 border border-white/10 rounded-xl text-xs text-white focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/30 transition-all font-mono"
                        placeholder="sk-..."
                      />
                      <button
                        onClick={() => setShowKey(!showKey)}
                        className="absolute right-1 top-1 p-2.5 min-h-[44px] min-w-[44px] flex items-center justify-center text-slate-400 hover:text-white"
                      >
                        {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1.5">Model ID</label>
                    <input
                      type="text"
                      value={customModel}
                      onChange={(e) => setCustomModelState(e.target.value)}
                      className="w-full px-3 py-2.5 bg-white/5 border border-white/10 rounded-xl text-xs text-white focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/30 transition-all font-mono"
                      placeholder="e.g., gpt-4o, claude-3-5-sonnet"
                    />
                  </div>
                  <button onClick={handleSaveCustom} disabled={!customUrl || !customKey || !customModel} className="w-full py-2.5 min-h-[44px] bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-slate-950 font-bold rounded-xl text-xs transition-all shadow-[0_0_15px_rgba(34,211,238,0.2)] active:scale-95">Save Custom Config</button>
                </div>
              )}

              {window.aistudio && (
                <button
                  onClick={() => window.aistudio!.openSelectKey()}
                  className="w-full py-2 text-cyan-400 text-xs font-bold hover:underline drop-shadow-md"
                >
                  Sync from Project IDX
                </button>
              )}
            </div>
          </div>

          {/* Account Actions */}
          <div className="glass-card bg-slate-900/40 backdrop-blur-xl p-6 rounded-3xl border border-white/10 flex flex-col justify-between shadow-[0_0_20px_rgba(34,211,238,0.05)]">
            <div className="flex items-center gap-3 mb-6">
               <div className="p-2.5 bg-white/5 border border-white/10 rounded-xl text-slate-300">
                 <Shield className="w-5 h-5" />
               </div>
               <div>
                 <h3 className="font-semibold text-white text-sm">Account & Security</h3>
                 <p className="text-xs text-slate-400">Zero-Knowledge E2EE</p>
               </div>
            </div>
            
            <div className="space-y-3 mt-auto">
              <div className="flex items-center justify-between p-3 rounded-xl border border-white/10 bg-white/5 text-xs text-slate-300">
                <span>PWA Offline Cache</span>
                <span className="text-emerald-400 font-bold">Active</span>
              </div>
              
              <button 
                onClick={logout}
                className="w-full flex items-center justify-center gap-2 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 hover:bg-rose-500/20 transition-all font-bold text-xs"
              >
                <LogOut className="w-4 h-4" /> Sign Out
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default ProfileInterface;
