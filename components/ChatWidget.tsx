import React, { useState, useEffect, useRef } from 'react';
import { GoogleGenAI } from '@google/genai';
import ReactMarkdown from 'react-markdown';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../firebase';
import { collection, doc, setDoc, onSnapshot, query, where, orderBy, deleteDoc } from 'firebase/firestore';

// Initialize Gemini API
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

interface ChatMessage {
  id: string;
  text: string;
  sender: 'user' | 'ai';
  timestamp: number;
}

interface ChatSession {
  id: string;
  userId: string;
  title: string;
  isPinned: boolean;
  updatedAt: number;
  createdAt: number;
  messages: ChatMessage[];
}

export const ChatWidget: React.FC = () => {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [showSidebar, setShowSidebar] = useState(false);
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [chatMode, setChatMode] = useState<'normal' | 'deep_translate'>('normal');
  
  const scrollRef = useRef<HTMLDivElement>(null);
  const chatSessionRef = useRef<any>(null);

  // Fetch sessions from Firebase if user is logged in
  useEffect(() => {
    if (!user) {
      const localSessions = localStorage.getItem('app_chat_sessions');
      if (localSessions) {
        try {
          setSessions(JSON.parse(localSessions));
        } catch (e) {
          console.error("Failed to parse local chat sessions", e);
          setSessions([]);
        }
      } else {
        setSessions([]);
      }
      return;
    }

    // Sync local sessions to Firebase if any
    const syncLocalSessions = async () => {
      const localSessionsStr = localStorage.getItem('app_chat_sessions');
      if (localSessionsStr) {
        try {
          const localSessions: ChatSession[] = JSON.parse(localSessionsStr);
          if (localSessions.length > 0) {
            for (const session of localSessions) {
              const sessionRef = doc(db, 'chat_sessions', session.id);
              await setDoc(sessionRef, {
                ...session,
                userId: user.uid
              }, { merge: true });
            }
            localStorage.removeItem('app_chat_sessions');
          }
        } catch (e) {
          console.error("Failed to sync local chat sessions", e);
        }
      }
    };

    syncLocalSessions();

    const q = query(
      collection(db, 'chat_sessions'),
      where('userId', '==', user.uid),
      orderBy('updatedAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedSessions: ChatSession[] = [];
      snapshot.forEach((doc) => {
        fetchedSessions.push({ id: doc.id, ...doc.data() } as ChatSession);
      });
      setSessions(fetchedSessions);
    }, (error) => {
      console.error("Error fetching chat sessions:", error);
    });

    return () => unsubscribe();
  }, [user]);

  // Sync messages state when current session changes
  useEffect(() => {
    if (currentSessionId) {
      const session = sessions.find(s => s.id === currentSessionId);
      if (session) {
        setMessages(session.messages || []);
        // Re-initialize AI chat with history
        const history = (session.messages || []).map(msg => ({
          role: msg.sender === 'user' ? 'user' : 'model',
          parts: [{ text: msg.text }]
        }));
        
        chatSessionRef.current = ai.chats.create({
          model: "gemini-3-flash-preview",
          config: {
            systemInstruction: "Bạn là một trợ lý AI thân thiện, giúp người dùng giải đáp các thắc mắc về ứng dụng chuyển đổi tiền tệ và các câu hỏi chung khác. Hãy trả lời bằng tiếng Việt, ngắn gọn, súc tích, chính xác và dễ hiểu.",
          },
          history: history.length > 0 ? history : undefined
        });
      }
    } else {
      setMessages([{
        id: Date.now().toString(),
        text: "Xin chào! Tôi là trợ lý AI. Tôi có thể giúp gì cho bạn hôm nay?",
        sender: 'ai',
        timestamp: Date.now()
      }]);
      chatSessionRef.current = ai.chats.create({
        model: "gemini-3-flash-preview",
        config: {
          systemInstruction: "Bạn là một trợ lý AI thân thiện, giúp người dùng giải đáp các thắc mắc về ứng dụng chuyển đổi tiền tệ và các câu hỏi chung khác. Hãy trả lời bằng tiếng Việt, ngắn gọn, súc tích, chính xác và dễ hiểu.",
        },
      });
    }
  }, [currentSessionId, sessions.length === 0]);

  // Toggle Chat
  const toggleChat = () => {
    if (isOpen) {
      setIsClosing(true);
      setTimeout(() => {
        setIsOpen(false);
        setIsClosing(false);
      }, 300);
    } else {
      setIsOpen(true);
      setTimeout(scrollToBottom, 100);
    }
  };

  const scrollToBottom = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen, isLoading]);

  const saveSession = async (sessionId: string, title: string, newMessages: ChatMessage[], isPinned: boolean = false) => {
    const sessionData = {
      id: sessionId,
      title,
      isPinned,
      updatedAt: Date.now(),
      createdAt: sessions.find(s => s.id === sessionId)?.createdAt || Date.now(),
      messages: newMessages
    };

    if (!user) {
      // Save to local storage
      const updatedSessions = [...sessions];
      const existingIndex = updatedSessions.findIndex(s => s.id === sessionId);
      if (existingIndex >= 0) {
        updatedSessions[existingIndex] = { ...updatedSessions[existingIndex], ...sessionData, userId: 'local' };
      } else {
        updatedSessions.push({ ...sessionData, userId: 'local' });
      }
      
      // Sort by updatedAt desc
      updatedSessions.sort((a, b) => b.updatedAt - a.updatedAt);
      
      // Keep only last 50 sessions to save memory
      const trimmedSessions = updatedSessions.slice(0, 50);
      
      setSessions(trimmedSessions);
      localStorage.setItem('app_chat_sessions', JSON.stringify(trimmedSessions));
      return;
    }

    try {
      const sessionRef = doc(db, 'chat_sessions', sessionId);
      await setDoc(sessionRef, {
        ...sessionData,
        userId: user.uid
      }, { merge: true });
    } catch (error) {
      console.error("Error saving session:", error);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || isLoading) return;
    
    const text = newMessage.trim();
    setNewMessage('');
    
    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      text,
      sender: 'user',
      timestamp: Date.now()
    };
    
    let currentMessages = [...messages, userMsg];
    setMessages(currentMessages);
    setIsLoading(true);

    let sessionId = currentSessionId;
    let sessionTitle = "Cuộc trò chuyện mới";

    if (!sessionId) {
      sessionId = Date.now().toString();
      setCurrentSessionId(sessionId);
      sessionTitle = text.length > 30 ? text.substring(0, 30) + '...' : text;
    } else {
      const existingSession = sessions.find(s => s.id === sessionId);
      if (existingSession) sessionTitle = existingSession.title;
    }

    // Save user message immediately
    saveSession(sessionId, sessionTitle, currentMessages);

    try {
      if (!chatSessionRef.current) {
        chatSessionRef.current = ai.chats.create({
          model: "gemini-3-flash-preview",
          config: {
            systemInstruction: "Bạn là một trợ lý AI thân thiện, giúp người dùng giải đáp các thắc mắc về ứng dụng chuyển đổi tiền tệ và các câu hỏi chung khác. Hãy trả lời bằng tiếng Việt, ngắn gọn, súc tích, chính xác và dễ hiểu.",
          },
        });
      }

      let promptText = text;
      if (chatMode === 'deep_translate') {
          promptText = `[YÊU CẦU DỊCH CHUYÊN SÂU - HÃY KIỂM TRA KỸ TRƯỚC KHI TRẢ LỜI]
Hãy đóng vai là một chuyên gia dịch thuật tiếng Trung cao cấp.
1. Nếu input là tiếng Việt: Dịch sang tiếng Trung. Đảm bảo văn phong tự nhiên, chuyên nghiệp và lịch sự để giao tiếp với khách hàng. Sau đó, XUỐNG DÒNG và cung cấp bản dịch ngược từ tiếng Trung đó sang tiếng Việt để tôi đối chiếu.
2. Nếu input là tiếng Trung: Dịch sang tiếng Việt chính xác, đúng ngữ cảnh.
3. TUYỆT ĐỐI KHÔNG giải thích, KHÔNG thêm chữ thừa. Chỉ trả về kết quả.

Input cần dịch:
${text}`;
      } else {
          promptText = `[HÃY KIỂM TRA KỸ CÂU TRẢ LỜI ĐỂ ĐẢM BẢO ĐÚNG YÊU CẦU TRƯỚC KHI XUẤT KẾT QUẢ]
${text}`;
      }

      // Use streaming for faster perceived response
      const resultStream = await chatSessionRef.current.sendMessageStream({ message: promptText });
      
      const aiMsgId = (Date.now() + 1).toString();
      let fullResponse = "";
      
      // Add empty AI message first
      const aiMsg: ChatMessage = {
        id: aiMsgId,
        text: "",
        sender: 'ai',
        timestamp: Date.now()
      };
      currentMessages = [...currentMessages, aiMsg];
      setMessages(currentMessages);
      setIsLoading(false); // Stop loading animation as stream starts

      for await (const chunk of resultStream) {
        fullResponse += chunk.text;
        setMessages(prev => prev.map(msg => 
          msg.id === aiMsgId ? { ...msg, text: fullResponse } : msg
        ));
      }

      // Save final AI message
      const finalMessages = currentMessages.map(msg => 
        msg.id === aiMsgId ? { ...msg, text: fullResponse } : msg
      );
      saveSession(sessionId, sessionTitle, finalMessages, sessions.find(s => s.id === sessionId)?.isPinned || false);

    } catch (error) {
      console.error("AI Chat error:", error);
      const errorMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        text: "Đã có lỗi xảy ra khi kết nối với AI. Vui lòng thử lại sau.",
        sender: 'ai',
        timestamp: Date.now()
      };
      currentMessages = [...currentMessages, errorMsg];
      setMessages(currentMessages);
      if (sessionId) {
         saveSession(sessionId, sessionTitle, currentMessages);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const createNewChat = () => {
    setCurrentSessionId(null);
    setMessages([{
      id: Date.now().toString(),
      text: "Xin chào! Tôi là trợ lý AI. Tôi có thể giúp gì cho bạn hôm nay?",
      sender: 'ai',
      timestamp: Date.now()
    }]);
    chatSessionRef.current = ai.chats.create({
      model: "gemini-3-flash-preview",
      config: {
        systemInstruction: "Bạn là một trợ lý AI thân thiện, giúp người dùng giải đáp các thắc mắc về ứng dụng chuyển đổi tiền tệ và các câu hỏi chung khác. Hãy trả lời bằng tiếng Việt, ngắn gọn, súc tích, chính xác và dễ hiểu.",
      },
    });
    if (window.innerWidth < 640) setShowSidebar(false);
  };

  const togglePin = async (session: ChatSession, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user) {
      const updatedSessions = sessions.map(s => 
        s.id === session.id ? { ...s, isPinned: !s.isPinned } : s
      );
      setSessions(updatedSessions);
      localStorage.setItem('app_chat_sessions', JSON.stringify(updatedSessions));
      return;
    }
    try {
      const sessionRef = doc(db, 'chat_sessions', session.id);
      await setDoc(sessionRef, { isPinned: !session.isPinned }, { merge: true });
    } catch (error) {
      console.error("Error toggling pin:", error);
    }
  };

  const deleteSession = async (sessionId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm("Bạn có chắc chắn muốn xóa cuộc trò chuyện này?")) {
      if (!user) {
        const updatedSessions = sessions.filter(s => s.id !== sessionId);
        setSessions(updatedSessions);
        localStorage.setItem('app_chat_sessions', JSON.stringify(updatedSessions));
        if (currentSessionId === sessionId) {
          createNewChat();
        }
        return;
      }
      try {
        await deleteDoc(doc(db, 'chat_sessions', sessionId));
        if (currentSessionId === sessionId) {
          createNewChat();
        }
      } catch (error) {
        console.error("Error deleting session:", error);
      }
    }
  };

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  const pinnedSessions = sessions.filter(s => s.isPinned);
  const unpinnedSessions = sessions.filter(s => !s.isPinned);

  return (
    <>
      {/* Floating Trigger Button (Left Side) */}
      {!isOpen && (
        <div className="fixed bottom-6 left-6 z-[60] flex flex-col items-center gap-2">
            <div className="relative">
                <button 
                    onClick={toggleChat}
                    className="w-14 h-14 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-2xl flex items-center justify-center transition-transform duration-200 hover:scale-110 active:scale-95 border-2 border-white/50 backdrop-blur-md"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-7 h-7">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 0 0-2.456 2.456ZM16.894 20.567 16.5 21.75l-.394-1.183a2.25 2.25 0 0 0-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 0 0 1.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 0 0 1.423 1.423l1.183.394-1.183.394a2.25 2.25 0 0 0-1.423 1.423Z" />
                    </svg>
                </button>
                {/* Active Indicator */}
                <span className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-500 border-2 border-slate-100 rounded-full"></span>
            </div>
        </div>
      )}

      {/* Main Chat Window */}
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
            <div 
                className={`absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity duration-300 ${isClosing ? 'opacity-0' : 'opacity-100 animate-fade-in'}`}
                onClick={toggleChat}
            />
            
            <div 
                className={`bg-white/95 backdrop-blur-xl w-full max-w-5xl rounded-3xl shadow-2xl overflow-hidden flex relative z-10 origin-center border border-white/60
                    ${isClosing ? 'animate-fade-out-down' : 'animate-fade-in-up'}
                `}
                style={{
                    maxHeight: '85dvh',
                    height: typeof window !== 'undefined' && window.innerWidth >= 768 ? '85vh' : '85dvh',
                    animationDuration: '0.3s'
                }}
            >
                {/* Sidebar (History) */}
                <div className={`absolute sm:relative z-20 w-72 h-full bg-slate-50/90 backdrop-blur-md border-r border-slate-200/60 flex flex-col transition-transform duration-300 ${showSidebar ? 'translate-x-0' : '-translate-x-full sm:translate-x-0 sm:w-72 sm:border-r sm:overflow-hidden'}`}>
                    <div className="p-5 border-b border-slate-200/60 flex items-center justify-between bg-white/50 shrink-0">
                        <h3 className="font-bold text-slate-800 text-lg">Lịch sử chat</h3>
                        <button onClick={() => setShowSidebar(false)} className="sm:hidden p-1.5 text-slate-500 hover:bg-slate-200 rounded-xl transition-colors">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                    
                    <div className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-4">
                        {!user && (
                            <div className="p-4 text-center text-sm text-slate-500 bg-indigo-50/50 rounded-xl border border-indigo-100/50">
                                Đăng nhập để lưu và đồng bộ lịch sử trò chuyện.
                            </div>
                        )}
                        
                        {user && (
                            <>
                                <button 
                                    onClick={createNewChat}
                                    className="w-full flex items-center gap-2 p-3.5 rounded-xl bg-indigo-600 text-white hover:bg-indigo-700 transition-all shadow-md hover:shadow-lg hover:-translate-y-0.5 font-medium text-sm"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                                    </svg>
                                    Cuộc trò chuyện mới
                                </button>

                                {pinnedSessions.length > 0 && (
                                    <div>
                                        <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 px-2">Đã ghim</h4>
                                        <div className="space-y-1">
                                            {pinnedSessions.map(session => (
                                                <div 
                                                    key={session.id}
                                                    onClick={() => { setCurrentSessionId(session.id); if (window.innerWidth < 640) setShowSidebar(false); }}
                                                    className={`group flex items-center justify-between p-3 rounded-xl cursor-pointer transition-all ${currentSessionId === session.id ? 'bg-white shadow-sm border border-indigo-100 ring-1 ring-indigo-50' : 'hover:bg-white/60 border border-transparent hover:border-slate-200/50'}`}
                                                >
                                                    <div className="flex-1 min-w-0 pr-2">
                                                        <p className={`text-sm truncate ${currentSessionId === session.id ? 'text-indigo-700 font-semibold' : 'text-slate-700 font-medium'}`}>{session.title}</p>
                                                        <p className="text-[10px] text-slate-400 mt-1">{formatDate(session.updatedAt)}</p>
                                                    </div>
                                                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <button onClick={(e) => togglePin(session, e)} className="p-1.5 text-indigo-500 hover:bg-indigo-50 rounded-lg transition-colors">
                                                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                                                                <path fillRule="evenodd" d="M12 2.25a.75.75 0 0 1 .75.75v11.69l3.22-3.22a.75.75 0 1 1 1.06 1.06l-4.5 4.5a.75.75 0 0 1-1.06 0l-4.5-4.5a.75.75 0 1 1 1.06-1.06l3.22 3.22V3a.75.75 0 0 1 .75-.75Zm-9 13.5a.75.75 0 0 1 .75.75v2.25a1.5 1.5 0 0 0 1.5 1.5h13.5a1.5 1.5 0 0 0 1.5-1.5V16.5a.75.75 0 0 1 1.5 0v2.25a3 3 0 0 1-3 3H5.25a3 3 0 0 1-3-3V16.5a.75.75 0 0 1 .75-.75Z" clipRule="evenodd" />
                                                            </svg>
                                                        </button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {unpinnedSessions.length > 0 && (
                                    <div>
                                        <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 px-2 mt-5">Gần đây</h4>
                                        <div className="space-y-1">
                                            {unpinnedSessions.map(session => (
                                                <div 
                                                    key={session.id}
                                                    onClick={() => { setCurrentSessionId(session.id); if (window.innerWidth < 640) setShowSidebar(false); }}
                                                    className={`group flex items-center justify-between p-3 rounded-xl cursor-pointer transition-all ${currentSessionId === session.id ? 'bg-white shadow-sm border border-indigo-100 ring-1 ring-indigo-50' : 'hover:bg-white/60 border border-transparent hover:border-slate-200/50'}`}
                                                >
                                                    <div className="flex-1 min-w-0 pr-2">
                                                        <p className={`text-sm truncate ${currentSessionId === session.id ? 'text-indigo-700 font-semibold' : 'text-slate-700 font-medium'}`}>{session.title}</p>
                                                        <p className="text-[10px] text-slate-400 mt-1">{formatDate(session.updatedAt)}</p>
                                                    </div>
                                                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <button onClick={(e) => togglePin(session, e)} className="p-1.5 text-slate-400 hover:text-indigo-500 hover:bg-indigo-50 rounded-lg transition-colors">
                                                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                                                                <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5m-13.5-9L12 3m0 0 4.5 4.5M12 3v13.5" />
                                                            </svg>
                                                        </button>
                                                        <button onClick={(e) => deleteSession(session.id, e)} className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-colors">
                                                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                                                                <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                                                            </svg>
                                                        </button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                </div>

                {/* Main Chat Area */}
                <div className="flex-1 flex flex-col min-w-0 bg-white relative z-10">
                    {/* Header */}
                    <div className="flex items-center justify-between p-5 border-b border-slate-100 bg-white/50 backdrop-blur-md shrink-0">
                        <div className="flex items-center gap-4">
                            <button 
                                onClick={() => setShowSidebar(!showSidebar)}
                                className="sm:hidden p-2 -ml-2 text-slate-500 hover:bg-slate-100 rounded-xl transition-colors"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
                                </svg>
                            </button>
                            <button 
                                onClick={() => setShowSidebar(!showSidebar)}
                                className="hidden sm:block p-2 -ml-2 text-slate-500 hover:bg-slate-100 rounded-xl transition-colors"
                                title="Lịch sử chat"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25H12" />
                                </svg>
                            </button>
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white shadow-md ring-2 ring-white">
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-7 h-7">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 0 0-2.456 2.456ZM16.894 20.567 16.5 21.75l-.394-1.183a2.25 2.25 0 0 0-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 0 0 1.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 0 0 1.423 1.423l1.183.394-1.183.394a2.25 2.25 0 0 0-1.423 1.423Z" />
                                    </svg>
                                </div>
                                <div>
                                    <h3 className="font-extrabold text-slate-800 text-lg tracking-tight">Trợ lý AI Gemini</h3>
                                    <p className="text-xs text-emerald-600 font-semibold flex items-center gap-1.5">
                                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.6)]"></span>
                                        Đang hoạt động
                                    </p>
                                </div>
                            </div>
                        </div>
                        <button onClick={toggleChat} className="p-2.5 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-600 transition-colors">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-6 h-6">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>

                    {/* Content: Chat Tab */}
                    <div className={`flex-1 overflow-y-auto p-4 sm:p-6 custom-scrollbar space-y-6 transition-colors duration-300 ${chatMode === 'deep_translate' ? 'bg-gradient-to-b from-indigo-50/30 to-purple-50/30' : 'bg-slate-50/30'}`} ref={scrollRef}>
                        {messages.map((msg) => {
                            const isMe = msg.sender === 'user';
                            
                            return (
                                <div key={msg.id} className={`flex gap-3 sm:gap-4 ${isMe ? 'justify-end' : 'justify-start'}`}>
                                    {!isMe && (
                                        <div className="w-10 h-10 shrink-0 flex items-end">
                                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white shadow-md ring-2 ring-white">
                                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 0 0-2.456 2.456ZM16.894 20.567 16.5 21.75l-.394-1.183a2.25 2.25 0 0 0-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 0 0 1.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 0 0 1.423 1.423l1.183.394-1.183.394a2.25 2.25 0 0 0-1.423 1.423Z" />
                                                </svg>
                                            </div>
                                        </div>
                                    )}
                                    <div className={`max-w-[85%] sm:max-w-[75%] flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                                        <div className="group relative">
                                            <div 
                                                className={`px-5 py-3.5 rounded-2xl text-[15px] shadow-sm transition-colors duration-300
                                                    ${isMe 
                                                        ? chatMode === 'deep_translate' 
                                                            ? 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-br-none shadow-md' 
                                                            : 'bg-indigo-600 text-white rounded-br-none' 
                                                        : chatMode === 'deep_translate'
                                                            ? 'bg-white text-slate-800 rounded-bl-none border border-purple-100 shadow-[0_4px_20px_-4px_rgba(168,85,247,0.1)]'
                                                            : 'bg-white text-slate-800 rounded-bl-none border border-slate-200/60 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)]'}
                                                `}
                                            >
                                                {isMe ? (
                                                    <div className="break-words whitespace-pre-wrap leading-relaxed">{msg.text}</div>
                                                ) : (
                                                    <div className="markdown-body prose prose-sm sm:prose-base max-w-none prose-p:leading-relaxed prose-pre:bg-slate-800 prose-pre:text-slate-100 prose-headings:text-slate-800 prose-a:text-indigo-600">
                                                        <ReactMarkdown>{msg.text}</ReactMarkdown>
                                                    </div>
                                                )}
                                            </div>
                                            
                                            {/* Copy Button for AI Messages */}
                                            {!isMe && msg.text && (
                                                <button
                                                    onClick={() => handleCopy(msg.text, msg.id)}
                                                    className="absolute -right-12 top-1/2 -translate-y-1/2 p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl opacity-0 group-hover:opacity-100 transition-all shadow-sm border border-transparent hover:border-indigo-100"
                                                    title="Sao chép"
                                                >
                                                    {copiedId === msg.id ? (
                                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5 text-emerald-500">
                                                            <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                                                        </svg>
                                                    ) : (
                                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                                                            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 17.25v3.375c0 .621-.504 1.125-1.125 1.125h-9.75a1.125 1.125 0 0 1-1.125-1.125V7.875c0-.621.504-1.125 1.125-1.125H6.75a9.06 9.06 0 0 1 1.5.124m7.5 10.376h3.375c.621 0 1.125-.504 1.125-1.125V11.25c0-4.46-3.243-8.161-7.5-8.876a9.06 9.06 0 0 0-1.5-.124H9.375c-.621 0-1.125.504-1.125 1.125v3.5m7.5 10.375H9.375a1.125 1.125 0 0 1-1.125-1.125v-9.25m12 6.625v-1.875a3.375 3.375 0 0 0-3.375-3.375h-1.5a1.125 1.125 0 0 1-1.125-1.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H9.75" />
                                                        </svg>
                                                    )}
                                                </button>
                                            )}
                                        </div>
                                        <span className="text-[11px] font-medium text-slate-400 mt-1.5 px-2">{formatTime(msg.timestamp)}</span>
                                    </div>
                                </div>
                            );
                        })}
                        {isLoading && (
                            <div className="flex gap-3 sm:gap-4 justify-start">
                                <div className="w-10 h-10 shrink-0 flex items-end">
                                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white shadow-md ring-2 ring-white">
                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5 animate-spin">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99" />
                                        </svg>
                                    </div>
                                </div>
                                <div className="max-w-[80%] flex flex-col items-start">
                                    <div className="px-5 py-4 rounded-2xl bg-white text-slate-700 rounded-bl-none border border-slate-200/60 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] flex items-center gap-2">
                                        <span className="w-2.5 h-2.5 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                                        <span className="w-2.5 h-2.5 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                                        <span className="w-2.5 h-2.5 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="p-4 sm:p-5 bg-white border-t border-slate-100 relative shrink-0">
                        {/* Mode Toggle */}
                        <div className="flex items-center gap-2 mb-3 max-w-4xl mx-auto">
                            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Chế độ:</span>
                            <div className="flex bg-slate-100/80 p-1 rounded-xl ring-1 ring-slate-200/50">
                                <button 
                                    onClick={() => setChatMode('normal')}
                                    className={`flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all duration-200 ${chatMode === 'normal' ? 'bg-white text-indigo-600 shadow-[0_2px_8px_-2px_rgba(79,70,229,0.15)] ring-1 ring-indigo-100' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'}`}
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H8.25m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H12m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 0 1-2.555-.337A5.972 5.972 0 0 1 5.41 20.97a5.969 5.969 0 0 1-.474-.065 4.48 4.48 0 0 0 .978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25Z" />
                                    </svg>
                                    Bình thường
                                </button>
                                <button 
                                    onClick={() => setChatMode('deep_translate')}
                                    className={`flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all duration-200 ${chatMode === 'deep_translate' ? 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-[0_2px_10px_-2px_rgba(99,102,241,0.4)] ring-1 ring-indigo-500/50' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'}`}
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="m10.5 21 5.25-11.25L21 21m-9-3h7.5M3 5.621a48.474 48.474 0 0 1 6-.371m0 0c1.12 0 2.233.038 3.334.114M9 5.25V3m3.334 2.364C11.176 10.658 7.69 15.08 3 17.502m9.334-12.138c.896.061 1.785.147 2.666.257m-4.589 8.495a18.023 18.023 0 0 1-3.827-5.802" />
                                    </svg>
                                    Dịch chuyên sâu
                                </button>
                            </div>
                        </div>
                        <form onSubmit={handleSendMessage} className="flex items-center gap-3 max-w-4xl mx-auto">
                            <input 
                                type="text" 
                                value={newMessage}
                                onChange={(e) => setNewMessage(e.target.value)}
                                placeholder="Hỏi AI bất cứ điều gì..." 
                                className="flex-1 bg-slate-50 border border-slate-200 outline-none px-5 py-4 rounded-2xl text-[15px] font-medium focus:ring-4 focus:ring-indigo-50 focus:border-indigo-300 transition-all text-slate-800 placeholder:text-slate-400 shadow-inner"
                                disabled={isLoading}
                            />
                            
                            <button 
                                type="submit" 
                                disabled={!newMessage.trim() || isLoading}
                                className={`p-4 rounded-2xl shadow-md transition-all active:scale-95 flex items-center justify-center
                                    ${newMessage.trim() && !isLoading ? 'bg-indigo-600 text-white hover:bg-indigo-700 hover:shadow-lg hover:-translate-y-0.5' : 'bg-slate-100 text-slate-400 cursor-not-allowed'}
                                `}
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
                                    <path d="M3.478 2.404a.75.75 0 0 0-.926.941l2.432 7.905H13.5a.75.75 0 0 1 0 1.5H4.984l-2.432 7.905a.75.75 0 0 0 .926.94 60.519 60.519 0 0 0 18.445-8.986.75.75 0 0 0 0-1.218A60.517 60.517 0 0 0 3.478 2.404Z" />
                                </svg>
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        </div>
      )}
    </>
  );
};
