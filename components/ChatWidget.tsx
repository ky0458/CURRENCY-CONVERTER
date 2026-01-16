
import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../firebase';
import { collection, query, orderBy, limit, addDoc, onSnapshot, where, getDocs } from 'firebase/firestore';
import { ChatMessage, ChatUser } from '../types';

export const ChatWidget: React.FC = () => {
  const { user, loginGoogle } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'chat' | 'users'>('chat');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [onlineUsers, setOnlineUsers] = useState<ChatUser[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isFirstLoad, setIsFirstLoad] = useState(true);

  // Toggle Chat
  const toggleChat = () => {
    setIsOpen(!isOpen);
    if (!isOpen) {
      setUnreadCount(0); // Reset unread when opening
      setTimeout(scrollToBottom, 100);
    }
  };

  const scrollToBottom = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  };

  // 1. Fetch Messages Real-time
  useEffect(() => {
    const q = query(collection(db, 'messages'), orderBy('timestamp', 'asc'), limit(100));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const msgs: ChatMessage[] = [];
      snapshot.forEach((doc) => {
        msgs.push({ id: doc.id, ...doc.data() } as ChatMessage);
      });
      setMessages(msgs);
      
      // Handle Unread Badge
      if (!isFirstLoad && !isOpen) {
          // Simple logic: increment if new messages come in while closed
          // In a real app, check timestamps against last read
          if (snapshot.docChanges().some(change => change.type === 'added')) {
             setUnreadCount(prev => prev + 1);
          }
      }
      setIsFirstLoad(false);
      
      if (isOpen) {
        setTimeout(scrollToBottom, 100);
      }
    });
    return () => unsubscribe();
  }, [isOpen, isFirstLoad]);

  // 2. Fetch Online Users Real-time (Pseudo-presence via lastSeen)
  useEffect(() => {
    // Only fetch users who have been active in the last 24 hours to save reads,
    // client-side filtering does the rest for "online" status
    const yesterday = Date.now() - 24 * 60 * 60 * 1000; 
    const q = query(collection(db, 'users'), where('lastSeen', '>', yesterday));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const users: ChatUser[] = [];
      const now = Date.now();
      snapshot.forEach((doc) => {
        const data = doc.data();
        // Skip current user in the list if desired, but seeing yourself is fine
        // if (doc.id === user?.uid) return; 
        
        users.push({
          uid: doc.id,
          displayName: data.displayName,
          photoURL: data.photoURL,
          lastSeen: data.lastSeen,
          // Consider online if seen in last 3 minutes
          isOnline: now - data.lastSeen < 3 * 60 * 1000 
        });
      });
      
      // Sort: Online first, then by name
      users.sort((a, b) => {
        if (a.isOnline === b.isOnline) return a.displayName.localeCompare(b.displayName);
        return a.isOnline ? -1 : 1;
      });
      
      setOnlineUsers(users);
    });
    return () => unsubscribe();
  }, []);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !user) return;

    const text = newMessage.trim();
    setNewMessage(''); // Optimistic clear

    try {
      await addDoc(collection(db, 'messages'), {
        text: text,
        senderId: user.uid,
        senderName: user.displayName || 'User',
        photoURL: user.photoURL || '',
        timestamp: Date.now()
      });
      scrollToBottom();
    } catch (error) {
      console.error("Error sending message:", error);
    }
  };

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
  };

  // --- UI RENDER ---

  return (
    <>
      {/* Floating Trigger Button (Left Side) */}
      <div className="fixed bottom-6 left-6 z-[60] flex flex-col items-center gap-2">
        {isOpen ? (
             <button 
                onClick={toggleChat}
                className="w-14 h-14 rounded-full bg-slate-800 text-white shadow-2xl flex items-center justify-center transition-transform duration-200 hover:scale-105 active:scale-95 border-2 border-white/50 backdrop-blur-md"
             >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-6 h-6">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                </svg>
             </button>
        ) : (
            <div className="relative">
                <button 
                    onClick={toggleChat}
                    className="w-14 h-14 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-2xl flex items-center justify-center transition-transform duration-200 hover:scale-110 active:scale-95 border-2 border-white/50 backdrop-blur-md"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-7 h-7">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 8.511c.884.284 1.5 1.128 1.5 2.097v4.286c0 1.136-.847 2.1-1.98 2.193-.34.027-.68.052-1.02.072v3.091l-3-3c-1.354 0-2.694-.055-4.02-.163a2.115 2.115 0 0 1-.825-.242m9.345-8.334a2.126 2.126 0 0 0-.476-.095 48.64 48.64 0 0 0-8.048 0c-1.131.094-1.976 1.057-1.976 2.192v4.286c0 .837.46 1.58 1.155 1.951m9.347-8.33c-.28-.154-.57-.294-.87-.418ZM5.625 8.512a2.126 2.126 0 0 0-.476.095 48.64 48.64 0 0 0-8.048 0c-1.131-.094-1.976-1.057-1.976-2.192v-4.286c0-1.137.846-2.1 1.98-2.193.34-.027.68-.052 1.02-.072V.75l3 3c1.354 0 2.694.055 4.02.163.928.074 1.688.72 1.938 1.59" />
                    </svg>
                </button>
                {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-[10px] font-bold flex items-center justify-center rounded-full border-2 border-slate-100 shadow-sm animate-bounce">
                        {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                )}
                {/* Active Indicator */}
                <span className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-500 border-2 border-slate-100 rounded-full"></span>
            </div>
        )}
      </div>

      {/* Main Chat Window */}
      {isOpen && (
        <div className="fixed bottom-24 left-4 sm:left-6 z-[60] w-[90vw] sm:w-[350px] md:w-[400px] h-[500px] max-h-[70vh] bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/60 flex flex-col overflow-hidden animate-fade-in-up origin-bottom-left">
            
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-slate-100 bg-white/80">
                <div className="flex gap-4 bg-slate-100 p-1 rounded-xl">
                    <button 
                        onClick={() => setActiveTab('chat')}
                        className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${activeTab === 'chat' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        Trò chuyện
                    </button>
                    <button 
                        onClick={() => setActiveTab('users')}
                        className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${activeTab === 'users' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        Trực tuyến
                        <span className="w-2 h-2 rounded-full bg-green-500"></span>
                        {onlineUsers.filter(u => u.isOnline).length}
                    </button>
                </div>
                <button onClick={toggleChat} className="p-2 hover:bg-slate-100 rounded-full text-slate-400">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                    </svg>
                </button>
            </div>

            {/* Content: Chat Tab */}
            {activeTab === 'chat' && (
                <>
                    <div className="flex-1 overflow-y-auto p-4 custom-scrollbar bg-slate-50/50 space-y-4" ref={scrollRef}>
                        {!user && (
                            <div className="text-center py-10 px-6">
                                <div className="w-16 h-16 bg-blue-50 text-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" /></svg>
                                </div>
                                <p className="text-sm text-slate-500 font-medium mb-3">Đăng nhập để tham gia trò chuyện cùng mọi người.</p>
                                <button onClick={() => { loginGoogle(); }} className="px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-bold shadow-lg shadow-blue-200">Đăng nhập ngay</button>
                            </div>
                        )}
                        
                        {messages.map((msg, index) => {
                            const isMe = user?.uid === msg.senderId;
                            const showAvatar = !isMe && (index === 0 || messages[index - 1].senderId !== msg.senderId);
                            
                            return (
                                <div key={msg.id} className={`flex gap-2 ${isMe ? 'justify-end' : 'justify-start'}`}>
                                    {!isMe && (
                                        <div className="w-8 h-8 shrink-0 flex items-end">
                                            {showAvatar ? (
                                                <img src={msg.photoURL || `https://ui-avatars.com/api/?name=${msg.senderName}`} className="w-8 h-8 rounded-full border border-white shadow-sm" alt={msg.senderName} />
                                            ) : <div className="w-8" />}
                                        </div>
                                    )}
                                    <div className={`max-w-[75%] flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                                        {!isMe && showAvatar && <span className="text-[10px] text-slate-400 ml-1 mb-0.5">{msg.senderName}</span>}
                                        <div 
                                            className={`px-3 py-2 rounded-2xl text-sm font-medium shadow-sm break-words
                                                ${isMe ? 'bg-blue-600 text-white rounded-br-none' : 'bg-white text-slate-700 rounded-bl-none border border-slate-100'}
                                            `}
                                        >
                                            {msg.text}
                                        </div>
                                        <span className="text-[9px] text-slate-300 mt-1 px-1">{formatTime(msg.timestamp)}</span>
                                    </div>
                                </div>
                            );
                        })}
                        {messages.length === 0 && user && (
                            <p className="text-center text-xs text-slate-400 italic mt-10">Chưa có tin nhắn nào. Hãy bắt đầu cuộc trò chuyện!</p>
                        )}
                    </div>

                    {user && (
                        <div className="p-3 bg-white border-t border-slate-100">
                            <form onSubmit={handleSendMessage} className="flex items-center gap-2">
                                <input 
                                    type="text" 
                                    value={newMessage}
                                    onChange={(e) => setNewMessage(e.target.value)}
                                    placeholder="Nhập tin nhắn..." 
                                    className="flex-1 bg-slate-100 border-none outline-none px-4 py-2.5 rounded-xl text-sm font-medium focus:ring-2 focus:ring-blue-100 transition-all text-slate-800 placeholder:text-slate-400"
                                />
                                <button 
                                    type="submit" 
                                    disabled={!newMessage.trim()}
                                    className={`p-2.5 rounded-xl transition-all shadow-sm ${newMessage.trim() ? 'bg-blue-600 text-white hover:bg-blue-700' : 'bg-slate-200 text-slate-400 cursor-not-allowed'}`}
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                                        <path d="M3.478 2.404a.75.75 0 0 0-.926.941l2.432 7.905H13.5a.75.75 0 0 1 0 1.5H4.984l-2.432 7.905a.75.75 0 0 0 .926.94 60.519 60.519 0 0 0 18.445-8.986.75.75 0 0 0 0-1.218A60.517 60.517 0 0 0 3.478 2.404Z" />
                                    </svg>
                                </button>
                            </form>
                        </div>
                    )}
                </>
            )}

            {/* Content: Users Tab */}
            {activeTab === 'users' && (
                <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
                    <h4 className="text-xs font-bold text-slate-400 uppercase mb-3">Người dùng hoạt động gần đây</h4>
                    <div className="space-y-3">
                        {onlineUsers.map(u => (
                            <div key={u.uid} className="flex items-center gap-3 p-2 hover:bg-slate-50 rounded-xl transition-colors cursor-default">
                                <div className="relative">
                                    <img src={u.photoURL || `https://ui-avatars.com/api/?name=${u.displayName}`} className="w-10 h-10 rounded-full object-cover border border-slate-200" alt={u.displayName} />
                                    {u.isOnline && (
                                        <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></span>
                                    )}
                                </div>
                                <div className="flex-1">
                                    <p className="text-sm font-bold text-slate-700">{u.displayName} {user?.uid === u.uid && '(Bạn)'}</p>
                                    <p className={`text-xs ${u.isOnline ? 'text-green-600 font-medium' : 'text-slate-400'}`}>
                                        {u.isOnline ? 'Đang hoạt động' : `Hoạt động ${new Date(u.lastSeen).toLocaleTimeString('vi-VN', {hour: '2-digit', minute:'2-digit'})}`}
                                    </p>
                                </div>
                            </div>
                        ))}
                        {onlineUsers.length === 0 && (
                            <p className="text-center text-xs text-slate-400 italic">Không tìm thấy người dùng nào.</p>
                        )}
                    </div>
                </div>
            )}
        </div>
      )}
    </>
  );
};
