import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { ChatSession, SocialMessage, Participant } from '../types';
import { socialService } from '../services/socialService';
import { useDebounce } from '../hooks/useDebounce';
import {
  Send, Users, MoreVertical, Plus, X, Search,
  Loader2, ChevronLeft, ShieldAlert, Fingerprint,
  MessageSquare, AlertCircle
} from 'lucide-react';
import { useToast } from './ToastProvider';
import EncryptedMessage from './EncryptedMessage';

const SocialInterface: React.FC = () => {
  const { user: currentUser } = useAuth();
  const { success, error, info } = useToast();

  const [chats, setChats] = useState<ChatSession[]>([]);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [activeMessages, setActiveMessages] = useState<SocialMessage[]>([]);

  const [input, setInput] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Participant[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const activeChat = chats.find(c => c.id === activeChatId);

  useEffect(() => {
    if (!currentUser) return;
    const unsubscribe = socialService.subscribeToUserChats(currentUser.id, (updatedChats) => {
      setChats(updatedChats);
    });
    return () => unsubscribe();
  }, [currentUser]);

  useEffect(() => {
    if (!activeChatId) return;
    const unsubscribe = socialService.subscribeToChatMessages(activeChatId, (msgs) => {
      setActiveMessages(msgs);
      scrollToBottom();
    });
    return () => unsubscribe();
  }, [activeChatId]);

  const debouncedSearchQuery = useDebounce(userSearchQuery, 500); // 500ms delay for Big Tech feel

  useEffect(() => {
    const search = async () => {
      if (debouncedSearchQuery.trim()) {
        setIsSearching(true);
        const results = await socialService.searchUsers(debouncedSearchQuery);
        setSearchResults(results);
        setIsSearching(false);
      } else {
        setSearchResults([]);
      }
    };
    search();
  }, [debouncedSearchQuery]);

  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  const handleSend = async () => {
    if (!input.trim() || !activeChatId || !currentUser) return;
    try {
      await socialService.sendMessage(activeChatId, currentUser.id, currentUser.name, input);
      setInput('');
    } catch (e) {
      error("Communication error.");
    }
  };

  const handleReport = () => {
    info("Report submitted to Campus Administration for review.");
  };

  const handleStartChat = async (target: Participant) => {
    if (!currentUser) return;
    const currentParticipant: Participant = {
      id: currentUser.id,
      name: currentUser.name,
      avatar: currentUser.photoURL
    };
    try {
      const chatId = await socialService.startChatWithUser(currentParticipant, target);
      setActiveChatId(chatId);
      setShowAddModal(false);
      success(`Secure link established with ${target.name}`);
    } catch (e) {
      error("Authentication failure.");
    }
  };

  const getOtherParticipantName = (chat: ChatSession) => {
    if (chat.isGroup) return chat.groupName;
    return chat.participants.find(p => p.id !== currentUser?.id)?.name || 'Faculty Member';
  };

  const getInitials = (name: string) => name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);

  return (
    <div className="h-full flex flex-col lg:flex-row bg-slate-900/60 backdrop-blur-xl relative overflow-hidden text-white">

      {/* Sidebar - Clean Corporate */}
      <div className={`${activeChatId ? 'hidden lg:flex' : 'flex'} w-full lg:w-[350px] bg-slate-900/40 border-r border-white/10 flex-col shrink-0 h-full overflow-hidden`}>
        <div className="p-6 bg-white/5 border-b border-white/10">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-xl text-white tracking-tight">Campus Link</h2>
            <button onClick={() => setShowAddModal(true)} className="p-3 min-h-[44px] min-w-[44px] flex items-center justify-center bg-gradient-to-r from-cyan-500 to-blue-500 text-slate-950 font-bold rounded-xl hover:from-cyan-400 hover:to-blue-400 transition-colors shadow-lg shadow-cyan-500/30 active:scale-95"><Plus className="w-5 h-5" /></button>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
            <input type="text" placeholder="Search Directory..." className="w-full pl-10 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm outline-none focus:ring-2 focus:ring-cyan-400/30 transition-all font-medium text-white placeholder:text-slate-400" aria-label="Search directory" />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto no-scrollbar py-2">
          {chats.map(chat => (
            <div
              key={chat.id}
              onClick={() => setActiveChatId(chat.id)}
              className={`p-4 mx-3 my-1 rounded-2xl flex gap-4 cursor-pointer transition-all border ${activeChatId === chat.id ? 'bg-cyan-500/20 border-cyan-400 text-white shadow-[0_0_15px_rgba(34,211,238,0.15)]' : 'hover:bg-white/10 border-transparent text-slate-200'}`}
            >
              <div className="w-12 h-12 bg-white/10 text-slate-200 rounded-xl flex items-center justify-center shrink-0 font-bold text-sm border border-white/10">
                {chat.isGroup ? <Users className={`w-6 h-6 ${activeChatId === chat.id ? 'text-cyan-300' : 'text-slate-400'}`} /> : getInitials(getOtherParticipantName(chat) || 'U')}
              </div>
              <div className="flex-1 min-w-0 flex flex-col justify-center">
                <div className="flex justify-between items-baseline mb-1">
                  <h3 className="font-bold text-white truncate text-sm tracking-tight">{getOtherParticipantName(chat)}</h3>
                  <span className="text-[11px] text-slate-400 font-bold">
                    {new Date(chat.lastTimestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <p className="text-[11px] text-slate-300 truncate font-medium">
                  {chat.lastMessage}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Main Content Area */}
      {activeChat ? (
        <div className="flex-1 flex flex-col h-full bg-slate-900/60 backdrop-blur-xl z-[60] fixed inset-0 lg:relative lg:inset-auto">
          <div className="h-16 border-b border-white/10 flex justify-between items-center px-6 shrink-0 bg-slate-950/80 backdrop-blur-md">
            <div className="flex items-center gap-3">
              <button onClick={() => setActiveChatId(null)} className="p-3 -ml-2 text-slate-300 lg:hidden min-h-[44px] min-w-[44px] flex items-center justify-center"><ChevronLeft className="w-6 h-6" /></button>
              <div className="w-10 h-10 bg-gradient-to-br from-cyan-500 to-blue-500 rounded-lg flex items-center justify-center text-slate-950 shrink-0 font-bold text-sm shadow-[0_0_10px_rgba(34,211,238,0.3)]">
                {activeChat.isGroup ? <Users className="w-5 h-5" /> : getInitials(getOtherParticipantName(activeChat) || 'U')}
              </div>
              <div>
                <h2 className="font-bold text-white leading-none text-sm tracking-tight">{getOtherParticipantName(activeChat)}</h2>
                <p className="text-[11px] font-bold text-cyan-400 mt-1 uppercase tracking-widest">Identified Link</p>
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={handleReport} className="p-3 text-slate-400 hover:text-rose-400 hover:bg-white/10 rounded-lg transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center" title="Report Professional Conduct Violation"><ShieldAlert className="w-5 h-5" /></button>
              <button className="p-3 text-slate-400 hover:text-white rounded-lg transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"><MoreVertical className="w-5 h-5" /></button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-transparent no-scrollbar">
            <div className="flex justify-center mb-6">
              <div className="bg-white/5 border border-white/10 px-5 py-2.5 rounded-2xl text-[10px] text-slate-300 font-bold flex items-center gap-2 shadow-sm uppercase tracking-widest">
                <AlertCircle className="w-3.5 h-3.5 text-cyan-400" /> Campus Conduct Code Applied
              </div>
            </div>
            {activeMessages.map((msg) => {
              const isMe = msg.senderId === currentUser?.id;
              const isAI = msg.senderId === 'ai-agent';

              if (msg.senderId === 'system') return <div key={msg.id} className="text-center py-4"><span className="text-[11px] font-bold uppercase tracking-widest text-slate-300 bg-white/10 px-4 py-1.5 rounded-full border border-white/10">{msg.content}</span></div>;

              return (
                <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'} animate-fade-in`}>
                  <div className={`max-w-[80%] rounded-2xl px-5 py-3.5 shadow-sm border ${isMe ? 'bg-gradient-to-br from-cyan-500 to-blue-600 text-slate-950 border-cyan-400 rounded-br-none shadow-[0_0_15px_rgba(34,211,238,0.2)] font-medium' : isAI ? 'bg-slate-950 text-white border-slate-800 rounded-bl-none' : 'glass-card bg-slate-900/40 text-white border-white/10 rounded-bl-none'}`}>
                    {!isMe && <p className={`text-[11px] font-bold uppercase tracking-widest mb-1.5 ${isAI ? 'text-cyan-400' : 'text-slate-300'}`}>{msg.senderName}</p>}
                    <EncryptedMessage content={msg.content} chatId={activeChatId!} isMe={isMe} isEncrypted={msg.isEncrypted} isAI={isAI} />
                    <div className={`mt-2.5 flex items-center gap-1.5 opacity-60 ${isMe ? 'justify-end text-slate-900' : 'justify-start'}`}>
                      <span className="text-[10px] font-bold tracking-widest">{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      {isMe && <Fingerprint className="w-2.5 h-2.5" />}
                    </div>
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>

          <div className="p-4 bg-slate-950/80 backdrop-blur-xl border-t border-white/10">
            <div className="flex items-center gap-3 max-w-4xl mx-auto">
              <div className="flex-1 bg-white/5 border border-white/10 rounded-2xl flex items-center px-5 transition-all focus-within:ring-2 focus-within:ring-cyan-400/30 focus-within:bg-white/10">
                <textarea
                  rows={1}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleSend())}
                  placeholder="Official Faculty/Student Message..."
                  className="flex-1 bg-transparent border-none py-3.5 text-sm font-medium outline-none resize-none text-white placeholder:text-slate-400"
                  aria-label="Type your message"
                />
                <button
                  onClick={handleSend}
                  disabled={!input.trim()}
                  className="p-2.5 min-h-[44px] min-w-[44px] flex items-center justify-center bg-gradient-to-r from-cyan-500 to-blue-500 text-slate-950 font-bold rounded-xl shadow-lg transition-all active:scale-95 disabled:opacity-30 hover:from-cyan-400 hover:to-blue-400 shadow-cyan-500/30"
                  aria-label="Send message"
                >
                  <Send className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex-1 hidden lg:flex flex-col items-center justify-center text-slate-300 bg-transparent">
          <div className="w-20 h-20 glass-card bg-slate-900/40 rounded-3xl shadow-[0_0_30px_rgba(34,211,238,0.1)] flex items-center justify-center mb-6 border border-cyan-400/20"><MessageSquare className="w-10 h-10 text-cyan-400" /></div>
          <p className="font-bold text-slate-300 uppercase tracking-widest text-[10px]">Campus Communications Online</p>
          <button onClick={() => setShowAddModal(true)} className="mt-8 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-slate-950 px-10 py-4 min-h-[44px] rounded-2xl font-bold uppercase tracking-widest text-[11px] shadow-[0_0_20px_rgba(34,211,238,0.25)] transition-all active:scale-95 flex items-center justify-center">
            Initiate Connection
          </button>
        </div>
      )}

      {/* Directory Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-[100] bg-slate-950/60 backdrop-blur-md flex items-center justify-center p-6">
          <div className="glass-card bg-slate-900/80 rounded-[32px] shadow-2xl w-full max-w-md overflow-hidden animate-fade-in border border-white/10 text-white">
            <div className="p-6 border-b border-white/10 flex justify-between items-center bg-white/5">
              <h3 className="font-bold text-white uppercase tracking-tight">Institutional Directory</h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 p-3 min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl hover:bg-white/10 hover:text-white border border-transparent transition-all"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                <div className="relative">
                  <Search className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                  <input type="text" autoFocus placeholder="Search Personnel..." value={userSearchQuery} onChange={(e) => setUserSearchQuery(e.target.value)} className="w-full pl-10 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-xl outline-none font-bold text-sm text-white placeholder:text-slate-400 focus:ring-2 focus:ring-cyan-400/30 transition-all" />
                </div>
                <div className="space-y-2 max-h-[350px] overflow-y-auto no-scrollbar py-2">
                  {isSearching ? <div className="flex justify-center py-12"><Loader2 className="animate-spin text-cyan-400 w-8 h-8" /></div> : searchResults.map(u => (
                    <div key={u.id} className="flex items-center justify-between p-4 bg-white/5 border border-white/10 rounded-2xl hover:border-cyan-400/50 hover:bg-cyan-500/10 transition-all group cursor-pointer">
                      <div className="flex items-center gap-4">
                        <div className="w-11 h-11 bg-white/10 border border-white/10 rounded-xl flex items-center justify-center text-slate-200 font-bold text-xs group-hover:bg-gradient-to-br group-hover:from-cyan-500 group-hover:to-blue-500 group-hover:text-slate-950 group-hover:border-transparent transition-all">{getInitials(u.name)}</div>
                        <span className="font-bold text-white text-sm tracking-tight">{u.name}</span>
                      </div>
                      <button onClick={() => handleStartChat(u)} className="bg-gradient-to-r from-cyan-500 to-blue-500 text-slate-950 px-5 py-2.5 min-h-[44px] flex items-center justify-center rounded-xl text-[10px] font-bold uppercase tracking-widest shadow-lg shadow-cyan-500/30 hover:from-cyan-400 hover:to-blue-400 transition-all active:scale-95">Link</button>
                    </div>
                  ))}
                  {searchResults.length === 0 && !isSearching && userSearchQuery && (
                    <div className="text-center py-12 text-slate-400">
                      <p className="text-[10px] font-bold uppercase tracking-widest">No entries found</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SocialInterface;
