
import React from 'react';
import { Key, Zap, ShieldCheck } from 'lucide-react';

interface FeatureKeyGuardProps {
  featureName: string;
  description: string;
}

const FeatureKeyGuard: React.FC<FeatureKeyGuardProps> = ({ featureName, description }) => {
  const handleActivate = async () => {
    if (window.aistudio) {
      await window.aistudio.openSelectKey();
      // The parent component should re-check status via its own interval/effect
    }
  };

  return (
    <div className="h-full w-full flex items-center justify-center bg-transparent p-6 animate-fade-in text-white">
      <div className="max-w-md w-full glass-card bg-slate-900/60 rounded-[40px] p-10 text-center space-y-8 border border-white/10 shadow-2xl relative overflow-hidden text-white">
        <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/20 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>
        
        <div className="w-16 h-16 bg-white/10 text-indigo-400 rounded-3xl flex items-center justify-center mx-auto border border-white/10 shadow-inner">
          <Key className="w-8 h-8" />
        </div>

        <div className="space-y-3">
          <h2 className="text-xl font-black text-white uppercase tracking-tight">{featureName} Locked</h2>
          <p className="text-slate-300 text-xs font-medium leading-relaxed">
            {description}
          </p>
        </div>

        <button 
          onClick={handleActivate}
          className="w-full bg-indigo-600 text-white py-4 min-h-[44px] rounded-2xl font-black uppercase tracking-widest text-xs flex items-center justify-center gap-3 transition-all hover:bg-indigo-500 active:scale-95 shadow-lg shadow-indigo-600/30"
        >
          Connect Neural Key <Zap className="w-4 h-4 fill-white" />
        </button>
        
        <div className="flex items-center justify-center gap-2 pt-2">
          <ShieldCheck className="w-3 h-3 text-indigo-400" />
          <p className="text-[11px] text-slate-400 font-bold uppercase tracking-widest">Secure Handshake Required</p>
        </div>
      </div>
    </div>
  );
};

export default FeatureKeyGuard;
