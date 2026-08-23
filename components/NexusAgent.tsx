import React, { useState, useRef, useEffect } from 'react';
import { Brain, X, Mic, MicOff, Send, Loader2, Key, Search } from 'lucide-react';
import { GoogleGenAI, Modality } from '@google/genai';
import { useToast } from './ToastProvider';
import { runAgentCommand } from '../services/agentService';

interface NexusAgentProps {
  forceLower?: boolean;
}

const NexusAgent: React.FC<NexusAgentProps> = ({ forceLower }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isVoiceActive, setIsVoiceActive] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [input, setInput] = useState('');
  const [hasKey, setHasKey] = useState(false);
  const { info, success, error } = useToast();
  const sessionRef = useRef<any>(null);

  useEffect(() => {
    const check = async () => {
      if (window.aistudio) {
        const validated = await window.aistudio.hasSelectedApiKey();
        setHasKey(validated);
      }
    };
    check();
    const interval = setInterval(check, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleCommand = async () => {
    if (!input.trim() || isProcessing) return;

    if (!hasKey) {
      info('Neural Link Restricted. Connect API key to use Nexus Agent.');
      if (window.aistudio) await window.aistudio.openSelectKey();
      return;
    }

    setIsProcessing(true);

    try {
      const response = await runAgentCommand(input);
      success(response);
      setInput('');
      setIsOpen(false);
    } catch (err) {
      error('Neural link interrupted.');
    } finally {
      setIsProcessing(false);
    }
  };

  const startVoice = async () => {
    if (!hasKey) {
      info('Neural Link Restricted.');
      if (window.aistudio) await window.aistudio.openSelectKey();
      return;
    }

    setIsVoiceActive(true);
    try {
      const ai = new GoogleGenAI({
        apiKey:
          import.meta.env.VITE_GEMINI_API_KEY ||
          localStorage.getItem('USER_GEMINI_API_KEY') ||
          'missing',
      });
      const session = await ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-09-2025',
        config: {
          responseModalities: [Modality.AUDIO],
          systemInstruction: 'You are the Nexus voice assistant. Be brief and helpful.',
        },
        callbacks: {
          onopen: () => success('Voice Assistant Online'),
          onmessage: () => {},
          onclose: () => setIsVoiceActive(false),
          onerror: () => {
            error('Voice connection failed.');
            setIsVoiceActive(false);
          },
        },
      });
      sessionRef.current = session;
    } catch {
      setIsVoiceActive(false);
    }
  };

  return (
    <>
      <div
        className={`fixed right-6 z-[70] transition-all duration-500 pointer-events-none ${
          forceLower ? 'bottom-24 lg:bottom-10' : 'bottom-[100px] lg:bottom-10'
        }`}
      >
        <div className="flex flex-col items-end gap-3 pointer-events-auto">
          {isOpen && (
            <div className="glass-card bg-slate-900/90 rounded-2xl p-2 shadow-2xl border border-white/10 flex items-center gap-2 animate-slide-up w-[340px] max-w-[calc(100vw-48px)] text-white">
              <div className="pl-3 text-slate-400">
                <Search className="w-4 h-4" />
              </div>
              <input
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleCommand()}
                placeholder={hasKey ? 'Ask Nexus Agent...' : 'API Key Required...'}
                className="flex-1 bg-transparent border-none text-sm px-2 outline-none font-medium text-white placeholder:text-slate-400 h-10 min-h-[44px]"
                disabled={isProcessing}
                autoFocus
                aria-label="Nexus Agent command"
              />
              <div className="flex gap-1">
                <button
                  onClick={startVoice}
                  className="p-2.5 min-h-[44px] min-w-[44px] hover:bg-white/10 rounded-xl transition-all text-slate-400 hover:text-indigo-400 flex items-center justify-center"
                  title="Voice Mode"
                  aria-label="Voice Mode"
                >
                  <Mic className="w-4 h-4" />
                </button>
                <button
                  onClick={handleCommand}
                  disabled={isProcessing}
                  className={`p-2.5 min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl transition-all shadow-sm ${hasKey ? 'bg-indigo-600 text-white hover:bg-indigo-500' : 'bg-white/10 text-slate-400'}`}
                >
                  {isProcessing ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : hasKey ? (
                    <Send className="w-4 h-4" />
                  ) : (
                    <Key className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>
          )}

          <button
            onClick={() => setIsOpen(!isOpen)}
            className={`w-14 h-14 min-h-[44px] min-w-[44px] rounded-full flex items-center justify-center shadow-lg transition-all duration-300 border border-white/20 ${isOpen ? 'bg-slate-900 rotate-90 text-white' : 'bg-indigo-600 text-white hover:scale-105'}`}
            aria-label="Toggle Nexus Agent"
          >
            {isOpen ? <X className="w-6 h-6" /> : <Brain className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {isVoiceActive && (
        <div className="fixed inset-0 z-[1000] bg-slate-950/95 backdrop-blur-xl flex flex-col items-center justify-center p-10 animate-fade-in text-white">
          <div className="relative">
            <div className="absolute inset-0 bg-indigo-500/10 blur-[60px] animate-pulse rounded-full"></div>
            <div className="w-24 h-24 bg-indigo-600 rounded-full flex items-center justify-center shadow-2xl relative z-10 animate-pulse-slow">
              <Mic className="w-10 h-10 text-white" />
            </div>
          </div>
          <h3 className="mt-8 text-xl font-bold text-white">Listening...</h3>
          <p className="mt-2 text-slate-400 font-medium text-sm">Nexus AI Voice Interface</p>

          <button
            onClick={() => setIsVoiceActive(false)}
            className="mt-16 px-8 py-3 min-h-[44px] bg-white/10 border border-white/10 rounded-full flex items-center justify-center text-slate-300 hover:text-rose-400 hover:border-rose-500/30 hover:bg-rose-500/20 transition-all shadow-sm gap-2 text-sm font-semibold"
          >
            <MicOff className="w-4 h-4" />
            End Session
          </button>
        </div>
      )}
    </>
  );
};

export default NexusAgent;
