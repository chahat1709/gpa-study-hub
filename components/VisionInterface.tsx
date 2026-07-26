
import React, { useState, useRef, useEffect } from 'react';
import { VisionState } from '../types';
import { analyzeImage } from '../services/aiProviderService';
import { Upload, Calculator, Sparkles, Loader2, X, Copy, Check, Scan, Zap, Key } from 'lucide-react';
import { useToast } from './ToastProvider';

const VisionInterface: React.FC = () => {
  const { error: showError, success: showSuccess } = useToast();
  const [hasKey, setHasKey] = useState(false);
  const [state, setState] = useState<VisionState>({
    image: null,
    imagePreview: null,
    prompt: '',
    result: '',
    isLoading: false,
  });
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    // Check for key once on mount
    const key = localStorage.getItem('USER_GEMINI_API_KEY') || import.meta.env.VITE_GEMINI_API_KEY;
    setHasKey(!!key);
  }, []);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        showError("File too large. Max 10MB allowed.");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setState((prev) => ({
          ...prev,
          image: file,
          imagePreview: reader.result as string,
          result: '',
        }));
        showSuccess("Image scanned successfully");
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAnalyze = async () => {
    if (!state.imagePreview || !state.prompt.trim()) return;

    if (!hasKey) {
      if (window.aistudio) await window.aistudio.openSelectKey();
      return;
    }

    setState((prev) => ({ ...prev, isLoading: true, result: '' }));

    try {
      const text = await analyzeImage(state.imagePreview, state.prompt);
      setState((prev) => ({ ...prev, result: text }));
      showSuccess("Problem solved");
    } catch (error) {
      showError("Analysis failed. Try checking your API key.");
      setState((prev) => ({ ...prev, result: "Failed to analyze image. Please ensure your prompt is clear and the image is legible." }));
    } finally {
      setState((prev) => ({ ...prev, isLoading: false }));
    }
  };

  const handleCopy = () => {
    if (!state.result) return;
    navigator.clipboard.writeText(state.result);
    setCopied(true);
    showSuccess("Solution copied to clipboard");
    setTimeout(() => setCopied(false), 2000);
  };

  const clearImage = () => {
    setState({
      image: null,
      imagePreview: null,
      prompt: '',
      result: '',
      isLoading: false,
    });
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
      // Double check reset for some browsers
      fileInputRef.current.type = 'text';
      fileInputRef.current.type = 'file';
    }
  };

  return (
    <div className="h-full flex flex-col lg:flex-row gap-6 p-4 lg:p-8 overflow-y-auto bg-transparent">
      <div className="flex-1 flex flex-col gap-6">
        <div className="glass-card bg-slate-900/40 backdrop-blur-xl p-8 rounded-[40px] border border-white/10 text-white shadow-[0_0_30px_rgba(34,211,238,0.1)] flex flex-col gap-6 flex-1 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/10 rounded-bl-full -mr-12 -mt-12 shadow-[0_0_30px_rgba(34,211,238,0.3)]"></div>

          <div className="flex justify-between items-center relative z-10">
            <h2 className="text-xl font-black text-white flex items-center gap-3 uppercase tracking-tight">
              <div className="p-2 bg-gradient-to-br from-cyan-500 to-blue-500 rounded-xl shadow-[0_0_15px_rgba(34,211,238,0.3)]">
                <Calculator className="w-6 h-6 text-slate-950" />
              </div>
              Visual Solver
            </h2>
          </div>

          <div className="flex-1 border-2 border-dashed border-cyan-400/20 rounded-[32px] bg-white/5 relative overflow-hidden transition-all hover:bg-cyan-500/5 hover:border-cyan-400/40 flex items-center justify-center min-h-[350px] group shadow-inner">
            {state.imagePreview ? (
              <div className="relative w-full h-full p-6 flex items-center justify-center">
                <img
                  src={state.imagePreview}
                  alt="Preview"
                  className="max-w-full max-h-full object-contain rounded-2xl shadow-2xl z-10"
                />

                {state.isLoading && (
                  <div className="absolute inset-x-0 h-1 bg-cyan-400 shadow-[0_0_20px_rgba(34,211,238,0.8)] z-20 animate-scan"></div>
                )}

                <button
                  onClick={clearImage}
                  className="absolute top-8 right-8 z-30 bg-black/50 text-white p-3 rounded-2xl hover:bg-red-500 transition-all backdrop-blur-xl border border-white/20 active:scale-90 min-h-[44px] min-w-[44px] flex items-center justify-center"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            ) : (
              <div className="text-center p-12 transition-transform group-hover:scale-105">
                <div className="w-24 h-24 bg-white/10 shadow-[0_0_30px_rgba(34,211,238,0.15)] rounded-[32px] flex items-center justify-center mx-auto mb-6 relative border border-cyan-400/20">
                  <Upload className="w-10 h-10 text-cyan-400" />
                  <div className="absolute inset-[-8px] border-2 border-cyan-400/30 rounded-[36px] animate-pulse"></div>
                </div>
                <p className="text-white font-black text-lg uppercase tracking-tight">Drop Problem Node</p>
                <p className="text-slate-300 text-sm mt-2 font-medium">Upload equation, diagram, or text snippet</p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
              </div>
            )}
          </div>

          <div className="space-y-3 relative z-10">
            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-300 ml-2">Context Instruction</label>
            <div className="flex gap-3">
              <input
                type="text"
                value={state.prompt}
                onChange={(e) => setState(s => ({ ...s, prompt: e.target.value }))}
                placeholder="e.g. 'Show step-by-step derivation'"
                className="flex-1 bg-white/5 border border-white/10 text-white rounded-2xl px-6 py-4 text-[15px] focus:ring-2 focus:ring-cyan-400/30 focus:border-cyan-400/50 outline-none transition-all shadow-sm font-medium placeholder:text-slate-400"
                disabled={!state.imagePreview || state.isLoading}
              />
              <button
                onClick={handleAnalyze}
                disabled={!state.imagePreview || (!hasKey && !state.imagePreview) || state.isLoading}
                className={`px-8 py-4 min-h-[44px] rounded-2xl font-black uppercase tracking-widest text-xs flex items-center gap-2 shadow-2xl transition-all active:scale-95 ${hasKey ? 'bg-gradient-to-r from-cyan-500 to-blue-500 text-slate-950 shadow-[0_0_15px_rgba(34,211,238,0.3)] hover:from-cyan-400 hover:to-blue-400' : 'bg-slate-800 text-white shadow-slate-900/10 hover:bg-slate-700'}`}
              >
                {state.isLoading ? <Loader2 className="w-5 h-5 animate-spin text-slate-950" /> : hasKey ? <Zap className="w-5 h-5" /> : <Key className="w-4 h-4" />}
                {hasKey ? 'Compute' : 'Connect Key'}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 glass-card bg-slate-900/40 backdrop-blur-xl rounded-[40px] border border-white/10 text-white shadow-[0_0_30px_rgba(34,211,238,0.1)] p-8 flex flex-col h-full min-h-[400px] relative overflow-hidden">
        <div className="flex justify-between items-center mb-8 relative z-10">
          <h2 className="text-xl font-black text-white flex items-center gap-3 uppercase tracking-tight">
            <Sparkles className="w-6 h-6 text-cyan-400" />
            AI Workspace
          </h2>
          {state.result && (
            <button
              onClick={handleCopy}
              className="flex items-center gap-2 px-5 py-2.5 min-h-[44px] rounded-xl text-[10px] font-black uppercase tracking-widest border border-white/10 bg-white/5 text-white hover:bg-white/10 hover:border-cyan-400/30 transition-all active:scale-90"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-cyan-400" />}
              {copied ? 'Captured' : 'Capture'}
            </button>
          )}
        </div>
        <div className="flex-1 bg-white/5 rounded-[32px] p-8 border border-white/10 text-white overflow-y-auto relative shadow-inner">
          {state.isLoading ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-400 gap-6">
              <div className="relative">
                <div className="w-20 h-20 border-4 border-cyan-400/20 border-t-cyan-400 rounded-full animate-spin shadow-[0_0_15px_rgba(34,211,238,0.5)]"></div>
                <div className="absolute inset-0 bg-cyan-500 blur-3xl opacity-20 animate-pulse"></div>
              </div>
              <div className="text-center">
                <p className="text-sm font-black uppercase tracking-[0.3em] text-white">Decoding Image</p>
                <p className="text-[10px] text-cyan-300 mt-2 font-bold uppercase tracking-widest">Neural weights aligning...</p>
              </div>
            </div>
          ) : state.result ? (
            <div className="prose prose-invert max-w-none animate-fade-in">
              <p className="whitespace-pre-wrap leading-relaxed text-slate-100 font-medium text-[16px]">{state.result}</p>
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-slate-400 text-center opacity-40">
              <Scan className="w-20 h-20 mb-6 animate-pulse text-cyan-400" />
              <p className="text-sm font-black uppercase tracking-widest text-white">Awaiting Visual Input</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default VisionInterface;
