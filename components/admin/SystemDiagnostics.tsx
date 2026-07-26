import React from 'react';
import { Activity, Database, Cpu, Wifi, X } from 'lucide-react';
import { infrastructureService } from '../../services/infrastructureService';
import { isConfigValid } from '../../firebase';

export const SystemDiagnostics: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const infra = infrastructureService.getGovernorStatus();

  return (
    <div className="fixed inset-0 z-[100] bg-slate-950/60 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in">
      <div className="glass-card rounded-[32px] shadow-2xl max-w-lg w-full overflow-hidden border border-white/10 text-white">
        <div className="p-6 border-b border-white/10 flex justify-between items-center bg-white/5">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-500/20 border border-indigo-400/30 rounded-xl text-indigo-400">
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-white text-lg leading-tight">System Diagnostics</h3>
              <p className="text-xs text-slate-300 font-medium uppercase tracking-wide">Real-time Node Status</p>
            </div>
          </div>
          <button onClick={onClose} className="p-3 min-h-[44px] min-w-[44px] flex items-center justify-center hover:bg-white/10 rounded-full transition-colors text-slate-400 hover:text-white"><X className="w-5 h-5" /></button>
        </div>

        <div className="p-8 space-y-6">
          <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/10 text-white">
            <div className="flex items-center gap-4">
              <div className={`p-3 rounded-xl ${isConfigValid ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'}`}>
                <Database className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm font-bold text-white">Data Persistence Layer</p>
                <p className="text-xs text-slate-300 font-medium mt-0.5">{isConfigValid ? 'Firebase Production' : 'Local Mock Environment'}</p>
              </div>
            </div>
            <div className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${isConfigValid ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'}`}>
              {isConfigValid ? 'LIVE' : 'SIMULATED'}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-white/5 border border-white/10 rounded-2xl shadow-sm">
              <div className="flex items-center gap-2 mb-2 text-slate-400">
                <Cpu className="w-4 h-4" />
                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-300">Memory</span>
              </div>
              <p className="text-2xl font-black text-white">{infra.heapUsageMB}<span className="text-sm text-slate-400 font-medium ml-1">MB</span></p>
            </div>
            <div className="p-4 bg-white/5 border border-white/10 rounded-2xl shadow-sm">
              <div className="flex items-center gap-2 mb-2 text-slate-400">
                <Wifi className="w-4 h-4" />
                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-300">Latency</span>
              </div>
              <p className="text-2xl font-black text-white">24<span className="text-sm text-slate-400 font-medium ml-1">ms</span></p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
