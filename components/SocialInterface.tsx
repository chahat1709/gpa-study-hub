import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { useSocket } from './SocketContext';
import { getChats, createChat, getMessages, sendMessage, searchUsers, Chat as ApiChat, Message as ApiMessage, ApiUser } from '../services/apiClient';
import { useDebounce } from '../hooks/useDebounce';
import {
  Send, Users, MoreVertical, Plus, X, Search,
  Loader2, ChevronLeft, ShieldAlert, Fingerprint,
  MessageSquare, AlertCircle, Circle
} from 'lucide-react';
import { useToast } from './ToastProvider';
import EncryptedMessage from './EncryptedMessage';

const SocialInterface: React.FC = () => {
  const { user: currentUser } = useAuth();
  const { connected, onlineUsers, typingUsers, joinRoom, leaveRoom, sendChatMessage, startTyping, stopTyping } = useSocket();
  const { success, error, info } = useToast();

  const [chats, setChats] = useState<ApiChat[]>([]);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [activeMessages, setActiveMessages] = useState<ApiMessage[]>([]);

  const [input, setInput] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<ApiUser[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [sending, setSending] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const activeChat = chats.find(c => c.id === activeChatId);

  // Parse participants from JSON string
  const parseParticipants = (chat: ApiChat): string[] => {
    try {
      return typeof chat.participants === 'string' ? JSON.parse(chat.participants) : (chat.participants as any);
    } catch { return []; }
  };

  // Load chats from server
  useEffect(() => {
    if (!currentUser) return;
    getChats(currentUser.id).then(({ chats }) => {
      setChats(chats || []);
    }).catch(() => {});
  }, [currentUser]);

  // Load messages + join room when chat selected
  useEffect(() => {
    if (!activeChatId || !currentUser) return;

    getMessages(activeChatId).then(({ messages }) => {
      setActiveMessages(messages || []);
      scrollToBottom();
    }).catch(() => {});

    joinRoom(activeChatId);

    return () => {
      leaveRoom(activeChatId);
    };
  }, [activeChatId, currentUser]);

  // Listen for real-time messages via Socket.IO
  useEffect(() => {
    if (!activeChatId) return;

    const handleNewMessage = (msg: ApiMessage) => {
      if (msg.chat_id === activeChatId) {
        setActiveMessages(prev => {
          if (prev.some(m => m.id === msg.id)) return prev;
          return [...prev, msg];
        });
        scrollToBottom();
      }
      // Update chat list last message
      setChats(prev => prev.map(c =>
        c.id === activeChatId
          ? { ...c, last_message: msg.content.substring(0, 100), last_timestamp: msg.timestamp }
          : c
      ));
    };

    // Socket.IO events are already handled by SocketContext
    // We just need to listen via the socket directly
    // The socket is managed by SocketContext - events are forwarded there
  }, [activeChatId]);

  const debouncedSearchQuery = useDebounce(userSearchQuery, 500);

  useEffect(() => {
    const search = async () => {
      if (debouncedSearchQuery.trim()) {
        setIsSearching(true);
        try {
          const { users } = await searchUsers(debouncedSearchQuery);
          setSearchResults(users || []);
        } catch {
          setSearchResults([]);
        }
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
    if (!input.trim() || !activeChatId || !currentUser || sending) return;
    setSending(true);
    try {
      sendChatMessage(activeChatId, input);
      // Also persist via REST API
      await sendMessage(activeChatId, currentUser.id, currentUser.name, input);
      setInput('');
      inputRef.current?.focus();
    } catch (e) {
      error("Failed to send message");
    } finally {
      setSending(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    if (activeChatId) startTyping(activeChatId);
  };

  const handleStartChat = async (target: ApiUser) => {
    if (!currentUser) return;
    try {
      const chatResult = await createChat([currentUser.id, target.id]);
      if (chatResult) {
        const newChat: ApiChat = {
          id: chatResult.id,
          participants: JSON.stringify([currentUser.id, target.id]),
          is_group: 0,
          group_name: '',
          last_message: '',
          last_timestamp: new Date().toISOString(),
        };
        setChats(prev => [newChat, ...prev]);
        setActiveChatId(chatResult.id);
      }
      setShowAddModal(false);
      success(`Connected with ${target.name}`);
    } catch (e) {
      error("Failed to create chat");
    }
  };

  const getOtherParticipantName = (chat: ApiChat) => {
    if (chat.is_group) return chat.group_name;
    const participants = parseParticipants(chat);
    const otherId = participants.find((p: string) => p !== currentUser?.id);
    return otherId || 'Unknown';
  };

  const getInitials = (name: string) => name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);

  // Typing indicator for current chat
  const currentChatTyping = activeChatId ? (typingUsers.get(activeChatId) || new Set()) : new Set();
  const typingNames = Array.from(currentChatTyping).filter(id => id !== currentUser?.id);

  return (
    <div className="h-full flex flex-col lg:flex-row bg-slate-900/60 backdrop-blur-xl relative overflow-hidden text-white">

      {/* Sidebar */}
      <div className={`${activeChatId ? 'hidden lg:flex' : 'flex'} w-full lg:w-[350px] bg-[rgba(15,23,42,0.6)] border-r border-white/10 flex-col shrink-0 h-full overflow-hidden`}>
        <div className="p-6 bg-white/5 border-b border-white/10">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="font-bold font-display text-xl text-white tracking-tight">Campus Link</h2>
              <div className="flex items-center gap-1.5 mt-1">
                <div className={`w-1.5 h-1.5 rounded-full ${connected ? 'bg-emerald-400' : 'bg-red-400'}`} />
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                  {connected ? 'Real-time Active' : 'Offline'}
                </span>
              </div>
            </div>
            <button onClick={() => setShowAddModal(true)} className="stitch-btn p-3 min-h-[44px] min-w-[44px] flex items-center justify-center font-bold rounded-[12px] text-white transition-colors shadow-lg active:scale-95"><Plus className="w-5 h-5" /></button>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
            <input type="text" placeholder="Search Directory..." className="w-full pl-10 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-[12px] text-sm outline-none focus:ring-2 focus:ring-stitch-cyan/30 transition-all font-medium text-white placeholder:text-slate-400" aria-label="Search directory" />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto no-scrollbar py-2">
          {chats.map(chat => {
            const otherName = getOtherParticipantName(chat);
            const participants = parseParticipants(chat);
            const isOnline = participants.some((p: string) => p !== currentUser?.id && onlineUsers.has(p));
            return (
              <div
                key={chat.id}
                onClick={() => setActiveChatId(chat.id)}
                className={`p-4 mx-3 my-1 rounded-2xl flex gap-4 cursor-pointer transition-all border ${activeChatId === chat.id ? 'bg-stitch-primary-container/30 border-stitch-primary text-white shadow-[0_0_15px_rgba(67,56,202,0.3)]' : 'hover:bg-white/10 border-transparent text-slate-200'}`}
              >
                <div className="relative">
                  <div className="w-12 h-12 bg-white/10 text-slate-200 rounded-xl flex items-center justify-center shrink-0 font-bold text-sm border border-white/10">
                    {chat.is_group ? <Users className={`w-6 h-6 ${activeChatId === chat.id ? 'text-stitch-primary' : 'text-slate-400'}`} /> : getInitials(otherName)}
                  </div>
                  {isOnline && (
                    <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-emerald-400 rounded-full border-2 border-slate-900" />
                  )}
                </div>
                <div className="flex-1 min-w-0 flex flex-col justify-center">
                  <div className="flex justify-between items-baseline mb-1">
                    <h3 className="font-bold font-display text-white truncate text-sm tracking-tight">{otherName}</h3>
                    <span className="text-[11px] text-slate-400 font-bold">
                      {new Date(chat.last_timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-300 truncate font-medium">
                    {chat.last_message || 'No messages yet'}
                  </p>
                </div>
              </div>
            );
          })}
          {chats.length === 0 && (
            <div className="p-8 text-center text-slate-500">
              <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-xs font-bold">No conversations yet</p>
            </div>
          )}
        </div>
      </div>

      {/* Main Chat Area */}
      {activeChat ? (
        <div className="flex-1 flex flex-col h-full bg-slate-900/60 backdrop-blur-xl z-[60] fixed inset-0 lg:relative lg:inset-auto">
          {/* Chat Header */}
          <div className="h-16 border-b border-white/10 flex justify-between items-center px-6 shrink-0 bg-slate-950/80 backdrop-blur-md">
            <div className="flex items-center gap-3">
              <button onClick={() => setActiveChatId(null)} className="p-3 -ml-2 text-slate-300 lg:hidden min-h-[44px] min-w-[44px] flex items-center justify-center"><ChevronLeft className="w-6 h-6" /></button>
              <div className="w-10 h-10 bg-gradient-to-br from-stitch-primary to-stitch-secondary rounded-lg flex items-center justify-center text-slate-950 shrink-0 font-bold text-sm shadow-[0_0_10px_rgba(195,192,255,0.3)]">
                {activeChat.is_group ? <Users className="w-5 h-5" /> : getInitials(getOtherParticipantName(activeChat))}
              </div>
              <div>
                <h2 className="font-bold font-display text-white leading-none text-sm tracking-tight">{getOtherParticipantName(activeChat)}</h2>
                <p className="text-[11px] font-bold text-stitch-cyan mt-1 uppercase tracking-widest">
                  {connected ? 'Live' : 'Offline'}
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={() => info("Report submitted")} className="p-3 text-slate-400 hover:text-rose-400 hover:bg-white/10 rounded-lg transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center" title="Report"><ShieldAlert className="w-5 h-5" /></button>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-transparent no-scrollbar">
            <div className="flex justify-center mb-6">
              <div className="bg-white/5 border border-white/10 px-5 py-2.5 rounded-2xl text-[10px] text-slate-300 font-bold flex items-center gap-2 shadow-sm uppercase tracking-widest">
                <AlertCircle className="w-3.5 h-3.5 text-stitch-cyan" /> End-to-End Encrypted
              </div>
            </div>
            {activeMessages.map((msg) => {
              const isMe = msg.sender_id === currentUser?.id;

              if (msg.sender_id === 'system') return (
                <div key={msg.id} className="text-center py-4">
                  <span className="text-[11px] font-bold uppercase tracking-widest text-slate-300 bg-white/10 px-4 py-1.5 rounded-full border border-white/10">{msg.content}</span>
                </div>
              );

              return (
                <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'} animate-fade-in`}>
                  <div className={`max-w-[80%] rounded-2xl px-5 py-3.5 shadow-sm border ${isMe ? 'bg-stitch-primary-container text-white border-stitch-primary rounded-br-none shadow-[0_0_15px_rgba(67,56,202,0.2)] font-medium' : 'glass-card bg-[rgba(15,23,42,0.6)] text-white border-white/10 rounded-bl-none'}`}>
                    {!isMe && <p className="text-[11px] font-bold uppercase tracking-widest mb-1.5 text-slate-300">{msg.sender_name}</p>}
                    <EncryptedMessage content={msg.content} chatId={activeChatId!} isMe={isMe} isEncrypted={msg.is_encrypted === 1} />
                    <div className={`mt-2.5 flex items-center gap-1.5 opacity-60 ${isMe ? 'justify-end text-slate-900' : 'justify-start'}`}>
                      <span className="text-[10px] font-bold tracking-widest">{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      {isMe && <Fingerprint className="w-2.5 h-2.5" />}
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Typing indicator */}
            {typingNames.length > 0 && (
              <div className="flex items-center gap-2 text-slate-400">
                <div className="flex gap-1">
                  <div className="w-2 h-2 bg-stitch-cyan rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <div className="w-2 h-2 bg-stitch-cyan rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <div className="w-2 h-2 bg-stitch-cyan rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
                <span className="text-[11px] font-bold">Someone is typing...</span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="p-4 bg-slate-950/80 backdrop-blur-xl border-t border-white/10">
            <div className="flex items-center gap-3 max-w-4xl mx-auto">
              <div className="flex-1 bg-white/5 border border-white/10 rounded-[16px] flex items-center px-5 transition-all focus-within:ring-2 focus-within:ring-stitch-cyan/30 focus-within:bg-white/10">
                <textarea
                  ref={inputRef}
                  rows={1}
                  value={input}
                  onChange={handleInputChange}
                  onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleSend())}
                  placeholder="Type a message..."
                  className="flex-1 bg-transparent border-none py-3.5 text-sm font-medium outline-none resize-none text-white placeholder:text-slate-400"
                  aria-label="Type your message"
                />
                <button
                  onClick={handleSend}
                  disabled={!input.trim() || sending}
                  className="stitch-btn p-2.5 min-h-[44px] min-w-[44px] flex items-center justify-center font-bold rounded-xl transition-all active:scale-95 disabled:opacity-30 text-white"
                  aria-label="Send message"
                >
                  {sending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex-1 hidden lg:flex flex-col items-center justify-center text-slate-300 bg-transparent">
          <div className="w-20 h-20 glass-card bg-white/5 rounded-[24px] shadow-[0_0_30px_rgba(47,217,244,0.1)] flex items-center justify-center mb-6 border border-stitch-cyan/20">
            <MessageSquare className="w-10 h-10 text-stitch-cyan" />
          </div>
          <p className="font-bold font-display text-slate-300 uppercase tracking-widest text-[10px]">Campus Communications Online</p>
          <div className="flex items-center gap-2 mt-2">
            <div className={`w-2 h-2 rounded-full ${connected ? 'bg-emerald-400 animate-pulse' : 'bg-red-400'}`} />
            <span className="text-[10px] text-slate-500 font-bold">{connected ? 'Real-time messaging active' : 'Offline mode'}</span>
          </div>
          <button onClick={() => setShowAddModal(true)} className="stitch-btn mt-8 px-10 py-4 min-h-[44px] rounded-[16px] font-bold uppercase tracking-widest text-[11px] shadow-[0_0_20px_rgba(67,56,202,0.25)] transition-all active:scale-95 flex items-center justify-center text-white">
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
                  <input type="text" autoFocus placeholder="Search by name or enrollment..." value={userSearchQuery} onChange={(e) => setUserSearchQuery(e.target.value)} className="w-full pl-10 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-xl outline-none font-bold text-sm text-white placeholder:text-slate-400 focus:ring-2 focus:ring-stitch-cyan/30 transition-all" />
                </div>
                <div className="space-y-2 max-h-[350px] overflow-y-auto no-scrollbar py-2">
                  {isSearching ? <div className="flex justify-center py-12"><Loader2 className="animate-spin text-stitch-cyan w-8 h-8" /></div> : searchResults.map(u => (
                    <div key={u.id} className="flex items-center justify-between p-4 bg-white/5 border border-white/10 rounded-2xl hover:border-stitch-cyan/50 hover:bg-stitch-cyan/10 transition-all group cursor-pointer">
                      <div className="flex items-center gap-4">
                        <div className="w-11 h-11 bg-white/10 border border-white/10 rounded-xl flex items-center justify-center text-slate-200 font-bold text-xs group-hover:bg-stitch-cyan group-hover:text-slate-950 group-hover:border-transparent transition-all">{getInitials(u.name)}</div>
                        <div>
                          <span className="font-bold font-display text-white text-sm tracking-tight block">{u.name}</span>
                          <span className="text-[10px] text-slate-400 font-bold">{u.enrollment_number || ''} - {u.branch} {u.semester}</span>
                        </div>
                      </div>
                      <button onClick={() => handleStartChat(u)} className="stitch-btn text-white px-5 py-2.5 min-h-[44px] flex items-center justify-center rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all active:scale-95">Link</button>
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
