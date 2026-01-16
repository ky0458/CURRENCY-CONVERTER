
import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../firebase';
import { collection, query, orderBy, limit, addDoc, onSnapshot, where } from 'firebase/firestore';
import { ChatMessage, ChatUser, MessageType } from '../types';
import { compressImage } from '../utils/themeUtils';

const EMOJIS = ['👍', '❤️', '😂', '😮', '😢', '😡', '🎉', '🔥', '👋', '🙏', '💯', '💩', '🥰', '🤔', '👀', '✨', '🚀', '✅', '❌', '😭', '🤣', '🤝', '💪', '💔'];

export const ChatWidget: React.FC = () => {
  const { user, loginGoogle, showNotification } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'chat' | 'users'>('chat');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [onlineUsers, setOnlineUsers] = useState<ChatUser[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isFirstLoad, setIsFirstLoad] = useState(true);

  // Multimedia State
  const [showEmoji, setShowEmoji] = useState(false);
  const [showAttachMenu, setShowAttachMenu] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerIntervalRef = useRef<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Toggle Chat
  const toggleChat = () => {
    setIsOpen(!isOpen);
    if (!isOpen) {
      setUnreadCount(0);
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
          if (snapshot.docChanges().some(change => change.type === 'added')) {
             setUnreadCount(prev => prev + 1);
          }
      }
      setIsFirstLoad(false);
      
      if (isOpen) {
        setTimeout(scrollToBottom, 100);
      }
    }, (error) => {
        // Gracefully handle permission errors (e.g. if user is not logged in and rules require auth)
        console.log("Chat listener info:", error.code); 
    });

    return () => unsubscribe();
  }, [isOpen, isFirstLoad]);

  // 2. Fetch Online Users Real-time (Optimized & Guarded)
  useEffect(() => {
    // Guard: Only attempt to fetch users if logged in to avoid permission-denied loop
    if (!user) {
        setOnlineUsers([]);
        return;
    }

    // Fetch active users in last 24h
    const yesterday = Date.now() - 24 * 60 * 60 * 1000; 
    const q = query(collection(db, 'users'), where('lastSeen', '>', yesterday));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const users: ChatUser[] = [];
      const now = Date.now();
      snapshot.forEach((doc) => {
        const data = doc.data();
        // Calculate status strictly
        const timeDiff = now - data.lastSeen;
        let isOnline = false;
        
        // Online if seen within 2 minutes
        if (timeDiff < 2 * 60 * 1000) {
            isOnline = true;
        }

        users.push({
          uid: doc.id,
          displayName: data.displayName,
          photoURL: data.photoURL,
          lastSeen: data.lastSeen,
          isOnline: isOnline
        });
      });
      
      // Sort: Online first, then by Last Seen descending
      users.sort((a, b) => {
        if (a.isOnline && !b.isOnline) return -1;
        if (!a.isOnline && b.isOnline) return 1;
        return b.lastSeen - a.lastSeen;
      });
      
      setOnlineUsers(users);
    }, (error) => {
        // Gracefully handle permission errors
        console.log("User list listener info:", error.code);
    });

    return () => unsubscribe();
  }, [user]); // Add user dependency so it re-subscribes on login

  // --- MEDIA HANDLERS ---

  const sendPayload = async (payload: Partial<ChatMessage>) => {
      if (!user) return;
      try {
        await addDoc(collection(db, 'messages'), {
            text: '',
            type: 'text',
            senderId: user.uid,
            senderName: user.displayName || 'User',
            photoURL: user.photoURL || '',
            timestamp: Date.now(),
            ...payload
        });
        scrollToBottom();
      } catch (error) {
        console.error("Error sending message:", error);
        showNotification("Gửi tin nhắn thất bại", "error");
      }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !user) return;
    const text = newMessage.trim();
    setNewMessage('');
    setShowEmoji(false);
    sendPayload({ text, type: 'text' });
  };

  const handleEmojiClick = (emoji: string) => {
      setNewMessage(prev => prev + emoji);
  };

  // --- FILE HANDLING ---
  
  const convertToBase64 = (file: File): Promise<string> => {
      return new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.readAsDataURL(file);
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = error => reject(error);
      });
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
      if (!e.target.files || !e.target.files[0]) return;
      const file = e.target.files[0];
      
      // Size check (Limit to 800KB for Firestore safety)
      if (file.size > 800 * 1024) {
          showNotification("File quá lớn (Max 800KB). Vui lòng chọn file nhỏ hơn.", "error");
          return;
      }

      setShowAttachMenu(false);
      
      try {
          let contentUrl = '';
          let type: MessageType = 'file';

          if (file.type.startsWith('image/')) {
              // Compress image if it's an image
              type = 'image';
              contentUrl = await compressImage(file); // Reuse existing utility
          } else {
              // Other files
              type = 'file';
              contentUrl = await convertToBase64(file);
          }

          await sendPayload({
              type,
              text: file.name, // Use text field for filename
              contentUrl,
              fileName: file.name,
              fileSize: file.size
          });

      } catch (error) {
          console.error("File processing error", error);
          showNotification("Lỗi xử lý file", "error");
      }
      
      // Reset input
      if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // --- VOICE RECORDING ---

  const startRecording = async () => {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
          showNotification("Trình duyệt không hỗ trợ ghi âm.", "error");
          return;
      }

      try {
          const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
          const mediaRecorder = new MediaRecorder(stream);
          mediaRecorderRef.current = mediaRecorder;
          audioChunksRef.current = [];

          mediaRecorder.ondataavailable = (event) => {
              if (event.data.size > 0) {
                  audioChunksRef.current.push(event.data);
              }
          };

          mediaRecorder.onstop = async () => {
              const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
              // Limit audio size check approx
              if (audioBlob.size > 500 * 1024) {
                  showNotification("Ghi âm quá dài (>500KB).", "error");
                  return;
              }
              
              const reader = new FileReader();
              reader.readAsDataURL(audioBlob);
              reader.onloadend = async () => {
                  const base64Audio = reader.result as string;
                  await sendPayload({
                      type: 'audio',
                      text: 'Voice message',
                      contentUrl: base64Audio
                  });
              };
              
              // Stop all tracks
              stream.getTracks().forEach(track => track.stop());
          };

          mediaRecorder.start();
          setIsRecording(true);
          setRecordingTime(0);
          timerIntervalRef.current = setInterval(() => {
              setRecordingTime(prev => prev + 1);
          }, 1000);

      } catch (err) {
          console.error("Mic error", err);
          showNotification("Không thể truy cập microphone.", "error");
      }
  };

  const stopRecording = () => {
      if (mediaRecorderRef.current && isRecording) {
          mediaRecorderRef.current.stop();
          setIsRecording(false);
          clearInterval(timerIntervalRef.current);
      }
  };

  const cancelRecording = () => {
      if (mediaRecorderRef.current && isRecording) {
          // Stop but don't process
          mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
          mediaRecorderRef.current = null;
          setIsRecording(false);
          clearInterval(timerIntervalRef.current);
      }
  };

  const formatDuration = (sec: number) => {
      const m = Math.floor(sec / 60);
      const s = sec % 60;
      return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
  };

  // --- RENDERERS ---

  const renderMessageContent = (msg: ChatMessage, isMe: boolean) => {
      switch (msg.type) {
          case 'image':
              return (
                  <div className="relative group/img">
                      <img 
                        src={msg.contentUrl} 
                        alt="sent image" 
                        className="max-w-[200px] max-h-[200px] rounded-lg border border-white/20 object-cover cursor-pointer hover:opacity-90 transition-opacity"
                        onClick={() => {
                            const w = window.open();
                            if(w) {
                                const img = new Image();
                                img.src = msg.contentUrl!;
                                w.document.write(img.outerHTML);
                            }
                        }} 
                      />
                  </div>
              );
          case 'audio':
              return (
                  <div className="flex items-center gap-2 min-w-[150px]">
                      <audio controls src={msg.contentUrl} className="h-8 w-48 max-w-full" />
                  </div>
              );
          case 'file':
              return (
                  <a href={msg.contentUrl} download={msg.fileName} className={`flex items-center gap-2 p-1 hover:underline ${isMe ? 'text-white' : 'text-primary-600'}`}>
                      <div className="bg-white/20 p-1.5 rounded">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
                        </svg>
                      </div>
                      <div className="flex flex-col overflow-hidden">
                          <span className="text-xs font-bold truncate max-w-[120px]">{msg.fileName}</span>
                          <span className="text-[9px] opacity-80">{msg.fileSize ? (msg.fileSize / 1024).toFixed(1) + ' KB' : 'File'}</span>
                      </div>
                  </a>
              );
          default:
              return <div className="break-words whitespace-pre-wrap">{msg.text}</div>;
      }
  };

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
        <div className="fixed bottom-24 left-4 sm:left-6 z-[60] w-[90vw] sm:w-[350px] md:w-[400px] h-[550px] max-h-[75vh] bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/60 flex flex-col overflow-hidden animate-fade-in-up origin-bottom-left">
            
            {/* Header */}
            <div className="flex items-center justify-between p-3 border-b border-slate-100 bg-white/80 shrink-0">
                <div className="flex gap-2 bg-slate-100 p-1 rounded-xl">
                    <button 
                        onClick={() => setActiveTab('chat')}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${activeTab === 'chat' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        Trò chuyện
                    </button>
                    <button 
                        onClick={() => setActiveTab('users')}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${activeTab === 'users' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        Trực tuyến
                        <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
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
                    <div className="flex-1 overflow-y-auto p-4 custom-scrollbar bg-slate-50/50 space-y-3" ref={scrollRef}>
                        {!user && (
                            <div className="text-center py-10 px-6">
                                <div className="w-16 h-16 bg-blue-50 text-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" /></svg>
                                </div>
                                <p className="text-sm text-slate-500 font-medium mb-3">Đăng nhập để tham gia trò chuyện.</p>
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
                                    <div className={`max-w-[80%] flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                                        {!isMe && showAvatar && <span className="text-[10px] text-slate-400 ml-1 mb-0.5 font-bold">{msg.senderName}</span>}
                                        <div 
                                            className={`px-3 py-2 rounded-2xl text-sm font-medium shadow-sm 
                                                ${isMe ? 'bg-blue-600 text-white rounded-br-none' : 'bg-white text-slate-700 rounded-bl-none border border-slate-100'}
                                            `}
                                        >
                                            {renderMessageContent(msg, isMe)}
                                        </div>
                                        <span className="text-[9px] text-slate-300 mt-1 px-1">{formatTime(msg.timestamp)}</span>
                                    </div>
                                </div>
                            );
                        })}
                        {messages.length === 0 && user && (
                            <p className="text-center text-xs text-slate-400 italic mt-10">Hãy là người đầu tiên nhắn tin!</p>
                        )}
                    </div>

                    {user && (
                        <div className="p-3 bg-white border-t border-slate-100 relative">
                            {/* Recording Overlay */}
                            {isRecording && (
                                <div className="absolute inset-0 bg-white z-20 flex items-center justify-between px-4 animate-fade-in-up">
                                    <div className="flex items-center gap-2">
                                        <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                                        <span className="text-slate-700 font-mono font-bold">{formatDuration(recordingTime)}</span>
                                    </div>
                                    <div className="flex gap-2">
                                        <button onClick={cancelRecording} className="text-slate-400 hover:text-slate-600 px-3 py-1 font-bold text-xs">Hủy</button>
                                        <button onClick={stopRecording} className="bg-red-500 hover:bg-red-600 text-white p-2 rounded-full shadow-lg transition-transform hover:scale-110">
                                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5"><path d="M3.478 2.404a.75.75 0 0 0-.926.941l2.432 7.905H13.5a.75.75 0 0 1 0 1.5H4.984l-2.432 7.905a.75.75 0 0 0 .926.94 60.519 60.519 0 0 0 18.445-8.986.75.75 0 0 0 0-1.218A60.517 60.517 0 0 0 3.478 2.404Z" /></svg>
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* Emoji Picker */}
                            {showEmoji && (
                                <div className="absolute bottom-full left-0 mb-2 p-2 bg-white rounded-xl shadow-xl border border-slate-100 grid grid-cols-6 gap-2 w-full animate-fade-in-up z-10">
                                    {EMOJIS.map(emoji => (
                                        <button key={emoji} onClick={() => handleEmojiClick(emoji)} className="text-xl hover:bg-slate-50 rounded p-1 transition-colors">{emoji}</button>
                                    ))}
                                </div>
                            )}

                            {/* Attachment Menu */}
                            {showAttachMenu && (
                                <div className="absolute bottom-full left-0 mb-2 p-2 bg-white rounded-xl shadow-xl border border-slate-100 flex flex-col gap-1 w-40 animate-fade-in-up z-10">
                                    <button onClick={() => fileInputRef.current?.click()} className="flex items-center gap-2 text-sm font-bold text-slate-600 hover:bg-slate-50 p-2 rounded-lg transition-colors text-left">
                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4 text-primary-500"><path strokeLinecap="round" strokeLinejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 0 0 1.5-1.5V6a1.5 1.5 0 0 0-1.5-1.5H3.75A1.5 1.5 0 0 0 2.25 6v12a1.5 1.5 0 0 0 1.5 1.5Zm10.5-11.25h.008v.008h-.008V8.25Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" /></svg>
                                        Gửi ảnh/File
                                    </button>
                                    <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileSelect} />
                                </div>
                            )}

                            <form onSubmit={handleSendMessage} className="flex items-center gap-2">
                                <button type="button" onClick={() => { setShowAttachMenu(!showAttachMenu); setShowEmoji(false); }} className="p-2 text-slate-400 hover:text-primary-600 hover:bg-slate-50 rounded-full transition-colors">
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
                                </button>
                                
                                <input 
                                    type="text" 
                                    value={newMessage}
                                    onChange={(e) => setNewMessage(e.target.value)}
                                    placeholder="Nhập tin nhắn..." 
                                    className="flex-1 bg-slate-100 border-none outline-none px-4 py-2.5 rounded-xl text-sm font-medium focus:ring-2 focus:ring-blue-100 transition-all text-slate-800 placeholder:text-slate-400"
                                />
                                
                                <button type="button" onClick={() => { setShowEmoji(!showEmoji); setShowAttachMenu(false); }} className="p-2 text-slate-400 hover:text-yellow-500 hover:bg-slate-50 rounded-full transition-colors">
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M15.182 15.182a4.5 4.5 0 0 1-6.364 0M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0ZM9.75 9.75c0 .414-.168.75-.375.75S9 10.164 9 9.75 9.168 9 9.375 9s.375.336.375.75Zm-.375 0h.008v.015h-.008V9.75Zm5.625 0c0 .414-.168.75-.375.75s-.375-.336-.375-.75.168-.75.375-.75.375.336.375.75Zm-.375 0h.008v.015h-.008V9.75Z" /></svg>
                                </button>

                                {newMessage.trim() ? (
                                    <button type="submit" className="p-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 shadow-md transition-all active:scale-95">
                                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5"><path d="M3.478 2.404a.75.75 0 0 0-.926.941l2.432 7.905H13.5a.75.75 0 0 1 0 1.5H4.984l-2.432 7.905a.75.75 0 0 0 .926.94 60.519 60.519 0 0 0 18.445-8.986.75.75 0 0 0 0-1.218A60.517 60.517 0 0 0 3.478 2.404Z" /></svg>
                                    </button>
                                ) : (
                                    <button type="button" onClick={startRecording} className="p-2.5 bg-slate-100 text-slate-500 rounded-xl hover:bg-red-50 hover:text-red-500 transition-colors active:scale-95">
                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 0 0 6-6v-1.5m-6 7.5a6 6 0 0 1-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 0 1-3-3V4.5a3 3 0 1 1 6 0v8.25a3 3 0 0 1-3 3Z" /></svg>
                                    </button>
                                )}
                            </form>
                        </div>
                    )}
                </>
            )}

            {/* Content: Users Tab */}
            {activeTab === 'users' && (
                <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
                    <h4 className="text-xs font-bold text-slate-400 uppercase mb-3">Người dùng hoạt động ({onlineUsers.length})</h4>
                    <div className="space-y-3">
                        {onlineUsers.map(u => (
                            <div key={u.uid} className="flex items-center gap-3 p-2 hover:bg-slate-50 rounded-xl transition-colors cursor-default border border-transparent hover:border-slate-100">
                                <div className="relative">
                                    <img src={u.photoURL || `https://ui-avatars.com/api/?name=${u.displayName}`} className="w-10 h-10 rounded-full object-cover border border-slate-200" alt={u.displayName} />
                                    <span className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white ${u.isOnline ? 'bg-green-500' : 'bg-slate-300'}`}></span>
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-bold text-slate-700 truncate">{u.displayName} {user?.uid === u.uid && '(Bạn)'}</p>
                                    <p className={`text-xs truncate ${u.isOnline ? 'text-green-600 font-medium' : 'text-slate-400'}`}>
                                        {u.isOnline ? 'Đang hoạt động' : `Online ${formatTime(u.lastSeen)}`}
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
