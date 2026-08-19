import React, { useState, useRef, useEffect } from 'react';
import { Message } from '../types';
import { sendChatMessage, hasAnyApiKey } from '../services/aiProviderService';
import { Send, Loader2, Trash2, Bot } from 'lucide-react';
import { useToast } from './ToastProvider';
import FeatureKeyGuard from './FeatureKeyGuard';
import { useApiKeyCheck } from '../hooks/useApiKeyCheck';

const SYSTEM_PROMPT = "You are a professional study tutor for GTU diploma students. Be helpful, concise, and academic. Use simple language students can understand.";

const ChatInterface: React.FC = () => {
  const { error: showError } = useToast();
  const { hasKey, isChecking } = useApiKeyCheck(3000);
  const [messages, setMessages] = useState<Message[]>([
    { id: 'welcome', role: 'model', content: "Hello! I am your AI study assistant. How can I help you today?", timestamp: Date.now() },
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const handleSend = async () => {
    if (!input.trim() || isTyping || !hasKey) return;
    const userMsg: Message = { id: Date.now().toString(), role: 'user', content: input, timestamp: Date.now() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);

    try {
      const modelMsgId = (Date.now() + 1).toString();
      setMessages(prev => [...prev, { id: modelMsgId, role: 'model', content: '', timestamp: Date.now(), isLoading: true }]);

      // Build conversation history for the provider
      const history = [...messages, userMsg]
        .filter(m => m.id !== 'welcome' && m.id !== 'w')
        .map(m => ({ role: m.role === 'model' ? 'assistant' as const : 'user' as const, content: m.content }));

      const response = await sendChatMessage(history, SYSTEM_PROMPT);
      setMessages(prev => prev.map(m => m.id === modelMsgId ? { ...m, content: response, isLoading: false } : m));
    } catch {
      showError("Sync failed.");
      setMessages(prev => prev.filter(m => !m.isLoading));
    } finally {
      setIsTyping(false);
    }
  };

  const clearChat = () => {
    setMessages([{ id: 'w', role: 'model', content: "Memory buffer cleared. How can I help?", timestamp: Date.now() }]);
  };

  if (isChecking) {
    return (
      <div className="h-full w-full flex items-center justify-center bg-transparent">
        <Loader2 className="w-6 h-6 animate-spin text-stitch-cyan" />
      </div>
    );
  }

  if (!hasKey) {
    return (
      <FeatureKeyGuard
        featureName="AI Tutor"
        description="Connect your API key to start chatting."
      />
    );
  }

  return (
    <div className="flex flex-col h-full bg-transparent backdrop-blur-xl relative">
      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 no-scrollbar">
        <div className="max-w-3xl mx-auto space-y-4">
          {messages.map((msg) => (
            <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[85%] px-4 py-3 text-[15px] leading-relaxed shadow-sm ${
                msg.role === 'user'
                  ? 'bg-stitch-primary text-slate-950 font-medium rounded-[16px] rounded-tr-[4px] shadow-[0_0_15px_rgba(195,192,255,0.25)] shadow-lg'
                  : 'glass-card bg-white/5 border border-white/10 text-white rounded-[16px] rounded-tl-[4px]'
              }`}>
                <p className={`whitespace-pre-wrap ${msg.role === 'user' ? 'text-slate-950' : 'text-white'}`}>{msg.content}</p>
                {msg.isLoading && (
                  <div className="flex gap-1 mt-1 opacity-70">
                     <span className="text-xs text-stitch-cyan font-bold font-display">Thinking...</span>
                  </div>
                )}
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} className="h-2" />
        </div>
      </div>

      {/* Input Area */}
      <div className="shrink-0 p-3 bg-slate-950/80 backdrop-blur-xl border-t border-white/10 z-20 pb-[env(safe-area-inset-bottom)]">
        <div className="max-w-3xl mx-auto flex items-end gap-2">
          <button
            onClick={clearChat}
            className="p-3 min-h-[44px] min-w-[44px] flex items-center justify-center text-slate-400 hover:text-red-400 transition-colors"
            aria-label="Clear chat history"
          >
            <Trash2 className="w-5 h-5" />
          </button>

           <div className="flex-1 bg-white/5 rounded-3xl flex items-center px-4 py-2 border border-white/10 focus-within:border-stitch-cyan focus-within:bg-white/10 transition-all shadow-inner">
             <textarea
               value={input}
               onChange={(e) => {
                 setInput(e.target.value);
                 e.target.style.height = 'auto';
                 e.target.style.height = `${Math.max(24, e.target.scrollHeight)}px`;
               }}
               onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleSend())}
               placeholder="Message..."
               rows={1}
               className="flex-1 bg-transparent text-[15px] outline-none text-white placeholder:text-slate-400 resize-none max-h-32 min-h-[24px]"
               aria-label="Type your message"
             />
          </div>
          <button
            onClick={handleSend}
            disabled={!input.trim() || isTyping}
            className="p-3 min-h-[44px] min-w-[44px] flex items-center justify-center bg-stitch-cyan rounded-full text-slate-950 font-bold disabled:opacity-50 transition-all active:scale-95 shadow-[0_0_15px_rgba(47,217,244,0.3)] hover:bg-[rgba(47,217,244,0.8)]"
            aria-label="Send message"
          >
            {isTyping ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatInterface;
