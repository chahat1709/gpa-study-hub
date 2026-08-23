import React, { useState, useEffect } from 'react';
import { generateTextContent } from '../services/aiProviderService';
import { BookOpen, Sparkles, Loader2, Copy, Check, FileText, HelpCircle, List } from 'lucide-react';
import { useToast } from './ToastProvider';
import FeatureKeyGuard from './FeatureKeyGuard';

const TextInterface: React.FC = () => {
  const { error: showError, success: showSuccess } = useToast();
  const [prompt, setPrompt] = useState('');
  const [result, setResult] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [hasKey, setHasKey] = useState(false);
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    // Immediate check
    const key = localStorage.getItem('USER_GEMINI_API_KEY') || import.meta.env.VITE_GEMINI_API_KEY;
    setHasKey(!!key);
    setIsChecking(false);
  }, []);

  const handleGenerate = async (customPrompt?: string) => {
    if (!hasKey) return;
    const finalPrompt = customPrompt || prompt;
    if (!finalPrompt.trim()) return;

    if (customPrompt) setPrompt(customPrompt);

    setIsLoading(true);
    setResult('');

    try {
      const text = await generateTextContent(finalPrompt);
      setResult(text);
    } catch (error) {
      showError('Error processing request. Please try again.');
      setResult('Error processing request. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(result);
    setCopied(true);
    showSuccess('Copied to clipboard');
    setTimeout(() => setCopied(false), 2000);
  };

  const presets = [
    {
      label: 'Summarize Notes',
      icon: FileText,
      prompt: 'Summarize the following notes into concise bullet points:',
    },
    {
      label: 'Create Quiz',
      icon: HelpCircle,
      prompt: 'Create 5 multiple choice questions with answers based on this text:',
    },
    {
      label: 'Glossary',
      icon: List,
      prompt: 'Extract key terms and definitions from the following text:',
    },
    {
      label: 'Simplify',
      icon: Sparkles,
      prompt: 'Explain the following concept like I am a beginner:',
    },
  ];

  const applyPreset = (presetPrompt: string) => {
    setPrompt(prev => (prev.trim() ? `${prev}\n\n---\n${presetPrompt}` : presetPrompt));
  };

  if (isChecking)
    return (
      <div className="h-full w-full flex items-center justify-center bg-transparent">
        <Loader2 className="w-8 h-8 animate-spin text-stitch-cyan" />
      </div>
    );

  if (!hasKey)
    return (
      <FeatureKeyGuard
        featureName="Notes Assistant"
        description="Connect your neural key to enable AI-powered summaries, quiz generation, and concept simplification."
      />
    );

  return (
    <div className="h-full flex flex-col gap-6 max-w-4xl mx-auto p-4 lg:p-8 animate-fade-in">
      <div className="glass-card p-6 rounded-[32px] border border-white/10 text-white shadow-2xl">
        <h2 className="text-lg font-black font-display text-white mb-6 flex items-center gap-2 uppercase tracking-tight">
          <BookOpen className="w-5 h-5 text-stitch-primary" />
          Study Tools
        </h2>

        <div className="flex gap-2 mb-6 overflow-x-auto pb-2 no-scrollbar">
          {presets.map(p => (
            <button
              key={p.label}
              onClick={() => applyPreset(p.prompt)}
              className="flex items-center gap-2 px-5 py-2.5 min-h-[44px] bg-white/5 text-slate-200 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-white/10 hover:text-white border border-white/10 transition-all whitespace-nowrap"
            >
              <p.icon className="w-4 h-4" />
              {p.label}
            </button>
          ))}
        </div>

        <div className="space-y-4">
          <textarea
            value={prompt}
            onChange={e => setPrompt(e.target.value)}
            placeholder="Paste your lecture notes, essay draft, or topic here..."
            className="w-full h-40 p-5 bg-white/5 border border-white/10 rounded-[28px] focus:ring-4 focus:ring-stitch-cyan/20 focus:bg-white/10 outline-none resize-none text-white placeholder:text-slate-400 font-medium transition-all"
          />
          <div className="flex justify-end">
            <button
              onClick={() => handleGenerate()}
              disabled={!prompt.trim() || isLoading}
              className="stitch-btn text-white px-8 py-4 min-h-[44px] rounded-[16px] font-black uppercase tracking-widest text-xs disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-3 transition-all"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Computing...
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5" />
                  Generate Insights
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      <div
        className={`flex-1 glass-card rounded-[40px] border border-white/10 text-white shadow-2xl flex flex-col transition-all duration-500 ${result || isLoading ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'}`}
      >
        <div className="border-b border-white/10 p-6 flex justify-between items-center bg-white/5">
          <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-300">
            Neural Response
          </h3>
          <button
            onClick={copyToClipboard}
            disabled={!result}
            className="text-slate-300 hover:text-white p-3 min-h-[44px] min-w-[44px] rounded-[16px] hover:bg-white/10 transition-colors flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-widest"
          >
            {copied ? (
              <Check className="w-3.5 h-3.5 text-stitch-cyan" />
            ) : (
              <Copy className="w-3.5 h-3.5" />
            )}
            {copied ? 'Captured' : 'Capture'}
          </button>
        </div>
        <div className="p-8 flex-1 overflow-y-auto no-scrollbar">
          {isLoading ? (
            <div className="space-y-4 animate-pulse">
              <div className="h-4 bg-white/10 rounded-full w-3/4"></div>
              <div className="h-4 bg-white/10 rounded-full w-1/2"></div>
              <div className="h-4 bg-white/10 rounded-full w-5/6"></div>
            </div>
          ) : (
            <div className="prose prose-invert max-w-none">
              <p className="whitespace-pre-wrap leading-relaxed text-slate-100 font-medium">
                {result}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TextInterface;
