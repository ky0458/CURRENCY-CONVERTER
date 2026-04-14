import React, { useState, useEffect, useRef } from 'react';
import { GoogleGenAI } from '@google/genai';
import ReactMarkdown from 'react-markdown';
import { useAuth } from '../contexts/AuthContext';

// Initialize Gemini API
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const FALLBACK_MODELS = [
  "gemini-2.5-flash",
  "gemini-3-flash-preview",
  "gemini-3.1-flash-lite-preview",
  "gemma-3-12b-it"
];

const SYSTEM_INSTRUCTION = `Bạn là trợ lý AI của Gia Hân, một trợ lý thân thiện, thông minh và hữu ích. Hãy xưng hô là 'em' và gọi người dùng là 'chị' trong giao tiếp thông thường.
LƯU Ý QUAN TRỌNG: Khi nhận prompt yêu cầu dịch thuật, phần nội dung bản dịch trả về PHẢI được đổi ngôi xưng hô sao cho phù hợp với ngữ cảnh của văn bản gốc (ví dụ: giao tiếp chuyên nghiệp giữa Headhunter và Khách hàng/Ứng viên). Tuyệt đối không áp dụng quy tắc xưng hô 'em-chị' vào bên trong nội dung của bản dịch. LUÔN LUÔN tự kiểm tra lại câu trả lời để đảm bảo tính chính xác.`;

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
  const [showSidebar, setShowSidebar] = useState(typeof window !== 'undefined' && window.innerWidth >= 1024);
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [chatMode, setChatMode] = useState<'normal' | 'deep_translate'>('normal');
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedSessions, setSelectedSessions] = useState<Set<string>>(new Set());
  const [editingSessionId, setEditingSessionId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState('');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [sessionToDelete, setSessionToDelete] = useState<string | null>(null);
  const [isDeletingMultiple, setIsDeletingMultiple] = useState(false);
  
  // Voice and Attachment states
  const [attachment, setAttachment] = useState<{data: string, mimeType: string, name: string} | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const recognitionRef = useRef<any>(null);
  const chatFileInputRef = useRef<HTMLInputElement>(null);

  const scrollRef = useRef<HTMLDivElement>(null);
  const chatSessionRef = useRef<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const longPressTimerRef = useRef<NodeJS.Timeout | null>(null);
  const currentModelIndexRef = useRef(0);
  const activeModelRef = useRef(FALLBACK_MODELS[0]);

  useEffect(() => {
    const savedAvatar = localStorage.getItem('ai_avatar');
    if (savedAvatar) {
      setAvatarUrl(savedAvatar);
    }

    // Initialize Speech Recognition
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
        recognitionRef.current = new SpeechRecognition();
        recognitionRef.current.continuous = false;
        recognitionRef.current.interimResults = false;
        recognitionRef.current.lang = 'vi-VN';

        recognitionRef.current.onresult = (event: any) => {
            const transcript = event.results[0][0].transcript;
            setNewMessage(prev => prev ? `${prev} ${transcript}` : transcript);
        };

        recognitionRef.current.onerror = (event: any) => {
            console.error("Speech recognition error", event.error);
            setIsRecording(false);
            if (event.error === 'not-allowed') {
                alert("Không thể truy cập Micro. Vui lòng cấp quyền sử dụng Micro cho trình duyệt.");
            }
        };

        recognitionRef.current.onend = () => {
            setIsRecording(false);
        };
    }
  }, []);

  const startRecording = (e?: React.MouseEvent | React.TouchEvent) => {
      // Prevent default touch behavior to avoid selecting text or triggering context menus
      if (e && e.type === 'touchstart') {
          // e.preventDefault(); // Commented out to ensure button still receives focus if needed, but usually fine.
      }
      if (!recognitionRef.current) {
          alert("Trình duyệt của bạn không hỗ trợ nhận diện giọng nói.");
          return;
      }
      if (!isRecording) {
          try {
              recognitionRef.current.start();
              setIsRecording(true);
          } catch (e) {
              console.error("Failed to start recording:", e);
              setIsRecording(false);
          }
      }
  };

  const stopRecording = () => {
      if (isRecording && recognitionRef.current) {
          try {
              recognitionRef.current.stop();
          } catch (e) {
              console.error(e);
          }
          setIsRecording(false);
      }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      if (file.size > 5 * 1024 * 1024) {
          alert("Vui lòng chọn file nhỏ hơn 5MB.");
          return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
          const base64String = reader.result as string;
          const base64Data = base64String.split(',')[1];
          setAttachment({
              data: base64Data,
              mimeType: file.type,
              name: file.name
          });
      };
      reader.readAsDataURL(file);
      
      if (chatFileInputRef.current) {
          chatFileInputRef.current.value = '';
      }
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        setAvatarUrl(base64String);
        localStorage.setItem('ai_avatar', base64String);
      };
      reader.readAsDataURL(file);
    }
  };

  // Fetch sessions from local storage
  useEffect(() => {
    const loadSessions = () => {
      const localSessions = localStorage.getItem('app_chat_sessions');
      if (localSessions) {
        const parsed = JSON.parse(localSessions);
        setSessions(parsed);
      } else {
        setSessions([]);
      }
    };
    loadSessions();
  }, [user]);

  // Sync messages state when current session changes
  useEffect(() => {
    if (currentSessionId) {
      const session = sessions.find(s => s.id === currentSessionId);
      if (session) {
        setMessages(session.messages || []);
        // Re-initialize AI chat with history
        const rawHistory = (session.messages || []).map(msg => ({
          role: msg.sender === 'user' ? 'user' : 'model',
          parts: [{ text: msg.text }]
        }));
        
        let validHistory: any[] = [];
        let expectedRole = 'model';
        for (let i = rawHistory.length - 1; i >= 0; i--) {
          if (rawHistory[i].role === expectedRole) {
            validHistory.unshift(rawHistory[i]);
            expectedRole = expectedRole === 'model' ? 'user' : 'model';
          }
        }
        if (validHistory.length > 0 && validHistory[0].role === 'model') {
          validHistory.shift();
        }
        
        chatSessionRef.current = ai.chats.create({
          model: FALLBACK_MODELS[currentModelIndexRef.current],
          config: {
            systemInstruction: SYSTEM_INSTRUCTION,
          },
          history: validHistory.length > 0 ? validHistory : undefined
        });
        activeModelRef.current = FALLBACK_MODELS[currentModelIndexRef.current];
      }
    } else {
      setMessages([{
        id: Date.now().toString(),
        text: "Xin chào! Em là trợ lý AI của Gia Hân. Em có thể giúp gì cho chị hôm nay?",
        sender: 'ai',
        timestamp: Date.now()
      }]);
      chatSessionRef.current = ai.chats.create({
        model: FALLBACK_MODELS[currentModelIndexRef.current],
        config: {
          systemInstruction: SYSTEM_INSTRUCTION,
        },
      });
      activeModelRef.current = FALLBACK_MODELS[currentModelIndexRef.current];
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
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if ((!newMessage.trim() && !attachment) || isLoading) return;
    
    const text = newMessage.trim();
    const currentAttachment = attachment;
    
    setNewMessage('');
    setAttachment(null);
    
    let uiText = text;
    if (currentAttachment) {
        uiText = `[Đã đính kèm tệp: ${currentAttachment.name}]\n${text}`;
    }
    
    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      text: uiText,
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
      sessionTitle = text.length > 30 ? text.substring(0, 30) + '...' : text || "Tệp đính kèm";
    } else {
      const existingSession = sessions.find(s => s.id === sessionId);
      if (existingSession) sessionTitle = existingSession.title;
    }

    // Save user message immediately
    saveSession(sessionId, sessionTitle, currentMessages, sessions.find(s => s.id === sessionId)?.isPinned || false);

    let resultStream: any;
    let success = false;
    let attempts = 0;
    let fullResponse = "";
    const aiMsgId = (Date.now() + 1).toString();

    let promptText = text;
    if (chatMode === 'deep_translate') {
        promptText = `[DỊCH THUẬT CHUYÊN SÂU - HEADHUNTER & KHÁCH HÀNG]
Bạn là một chuyên gia dịch thuật. Hãy bỏ qua quy tắc xưng hô "em-chị" mặc định trong phần dịch này.
YÊU CẦU QUAN TRỌNG: Bản dịch (cả tiếng Trung và tiếng Việt) phải sử dụng ngôi xưng hô và văn phong hợp lý theo đúng ngữ cảnh giao tiếp chuyên nghiệp nhưng gần gũi giữa một người Headhunter (chuyên viên tuyển dụng) và Khách hàng/Ứng viên. Đảm bảo các chức danh, vị trí tuyển dụng được dịch chuẩn xác theo cách dùng thực tế của người Trung và người Việt.

1. Nếu input là tiếng Việt: Dịch sang tiếng Trung. Văn phong phải cực kỳ tự nhiên, giống như người bản xứ đang nhắn tin trò chuyện thực tế, KHÔNG dùng từ ngữ quá sách vở.
Định dạng đầu ra BẮT BUỘC:
[Câu dịch tiếng Trung]

Nghĩa tiếng Việt: [Nghĩa tiếng Việt khi dịch ngược lại câu tiếng Trung vừa dịch]

2. Nếu input là tiếng Trung: Dịch sang tiếng Việt một cách tự nhiên, đúng ngữ cảnh giao tiếp Headhunter.

3. TUYỆT ĐỐI KHÔNG giải thích, KHÔNG thêm chữ thừa. Chỉ trả về kết quả dịch theo đúng định dạng.

Input cần dịch:
${text}`;
    } else {
        promptText = `[HÃY KIỂM TRA KỸ LẠI CÂU TRẢ LỜI CỦA BẠN TRƯỚC KHI XUẤT KẾT QUẢ. TRẢ LỜI TỰ NHIÊN, NGẮN GỌN VÀ ĐÚNG TRỌNG TÂM]
${text}`;
    }

    let messageToSend: any = promptText;
    if (currentAttachment) {
        messageToSend = [
            { text: promptText || "Hãy phân tích tệp đính kèm này." },
            {
                inlineData: {
                    data: currentAttachment.data,
                    mimeType: currentAttachment.mimeType
                }
            }
        ];
    }

    while (!success && attempts < FALLBACK_MODELS.length) {
      try {
        const modelToUse = FALLBACK_MODELS[(currentModelIndexRef.current + attempts) % FALLBACK_MODELS.length];
        
        if (!chatSessionRef.current || activeModelRef.current !== modelToUse) {
          const rawHistory = currentMessages.slice(0, -1).map(msg => ({
            role: msg.sender === 'user' ? 'user' : 'model',
            parts: [{ text: msg.text }]
          }));
          
          let validHistory: any[] = [];
          let expectedRole = 'model';
          for (let i = rawHistory.length - 1; i >= 0; i--) {
            if (rawHistory[i].role === expectedRole) {
              validHistory.unshift(rawHistory[i]);
              expectedRole = expectedRole === 'model' ? 'user' : 'model';
            }
          }
          if (validHistory.length > 0 && validHistory[0].role === 'model') {
            validHistory.shift();
          }
          
          chatSessionRef.current = ai.chats.create({
            model: modelToUse,
            config: {
              systemInstruction: SYSTEM_INSTRUCTION,
            },
            history: validHistory.length > 0 ? validHistory : undefined
          });
          activeModelRef.current = modelToUse;
        }

        // Use streaming for faster perceived response
        resultStream = await chatSessionRef.current.sendMessageStream({ message: messageToSend });
        
        let isFirstChunk = true;

        for await (const chunk of resultStream) {
          fullResponse += chunk.text;
          if (isFirstChunk) {
             setIsLoading(false); // Stop loading animation as stream starts
             isFirstChunk = false;
             currentMessages = [...currentMessages, {
                id: aiMsgId,
                text: fullResponse,
                sender: 'ai',
                timestamp: Date.now()
             }];
             setMessages(currentMessages);
          } else {
             setMessages(prev => prev.map(msg => 
               msg.id === aiMsgId ? { ...msg, text: fullResponse } : msg
             ));
          }
        }

        if (isFirstChunk) {
           // Stream was empty but didn't throw
           setIsLoading(false);
           currentMessages = [...currentMessages, {
                id: aiMsgId,
                text: fullResponse,
                sender: 'ai',
                timestamp: Date.now()
           }];
           setMessages(currentMessages);
        }

        success = true;
        currentModelIndexRef.current = (currentModelIndexRef.current + attempts) % FALLBACK_MODELS.length;

        // Save final AI message
        const finalMessages = currentMessages.map(msg => 
          msg.id === aiMsgId ? { ...msg, text: fullResponse } : msg
        );
        saveSession(sessionId, sessionTitle, finalMessages, sessions.find(s => s.id === sessionId)?.isPinned || false);

      } catch (error) {
        console.warn(`AI Chat error with model ${activeModelRef.current}:`, error);
        attempts++;
        if (attempts >= FALLBACK_MODELS.length) {
          setIsLoading(false);
          const errorMsg: ChatMessage = {
            id: (Date.now() + 1).toString(),
            text: "Đã có lỗi xảy ra khi kết nối với AI (vượt quá giới hạn). Vui lòng thử lại sau.",
            sender: 'ai',
            timestamp: Date.now()
          };
          currentMessages = [...currentMessages, errorMsg];
          setMessages(currentMessages);
          if (sessionId) {
             saveSession(sessionId, sessionTitle, currentMessages, sessions.find(s => s.id === sessionId)?.isPinned || false);
          }
        }
        // Force recreation on next iteration
        chatSessionRef.current = null;
      }
    }
    
    setIsLoading(false);
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
      text: "Xin chào! Em là trợ lý AI của Gia Hân. Em có thể giúp gì cho bạn hôm nay?",
      sender: 'ai',
      timestamp: Date.now()
    }]);
    chatSessionRef.current = ai.chats.create({
      model: FALLBACK_MODELS[currentModelIndexRef.current],
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
      },
    });
    activeModelRef.current = FALLBACK_MODELS[currentModelIndexRef.current];
    if (window.innerWidth < 640) setShowSidebar(false);
  };

  const persistSessions = (updatedSessions: ChatSession[]) => {
    setSessions(updatedSessions);
    localStorage.setItem('app_chat_sessions', JSON.stringify(updatedSessions));
  };

  const togglePin = async (session: ChatSession, e: React.MouseEvent) => {
    e.stopPropagation();
    const updatedSessions = sessions.map(s => 
      s.id === session.id ? { ...s, isPinned: !s.isPinned } : s
    );
    persistSessions(updatedSessions);
  };

  const handleSessionClick = (sessionId: string) => {
    if (isSelectionMode) {
        const newSet = new Set(selectedSessions);
        if (newSet.has(sessionId)) newSet.delete(sessionId);
        else newSet.add(sessionId);
        setSelectedSessions(newSet);
    } else {
        setCurrentSessionId(sessionId);
        if (window.innerWidth < 640) setShowSidebar(false);
    }
  };

  const handleTouchStart = (sessionId: string) => {
    if (isSelectionMode) return;
    longPressTimerRef.current = setTimeout(() => {
      setIsSelectionMode(true);
      setSelectedSessions(new Set([sessionId]));
    }, 500); // 500ms long press
  };

  const handleTouchEnd = () => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  };

  const startRenaming = (session: ChatSession, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingSessionId(session.id);
    setEditingTitle(session.title);
  };

  const saveRenamedSession = async (sessionId: string) => {
    if (!editingTitle.trim()) {
        setEditingSessionId(null);
        return;
    }
    
    const updatedSessions = sessions.map(s => 
        s.id === sessionId ? { ...s, title: editingTitle.trim() } : s
    );
    persistSessions(updatedSessions);
    
    setEditingSessionId(null);
  };

  const confirmDeleteSession = (sessionId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSessionToDelete(sessionId);
    setIsDeletingMultiple(false);
    setShowDeleteConfirm(true);
  };

  const confirmDeleteSelectedSessions = () => {
    setIsDeletingMultiple(true);
    setShowDeleteConfirm(true);
  };

  const executeDelete = async () => {
    if (isDeletingMultiple) {
        const updatedSessions = sessions.filter(s => !selectedSessions.has(s.id));
        persistSessions(updatedSessions);
        if (currentSessionId && selectedSessions.has(currentSessionId)) {
            createNewChat();
        }
        setIsSelectionMode(false);
        setSelectedSessions(new Set());
    } else if (sessionToDelete) {
        const updatedSessions = sessions.filter(s => s.id !== sessionToDelete);
        persistSessions(updatedSessions);
        if (currentSessionId === sessionToDelete) {
          createNewChat();
        }
    }
    setShowDeleteConfirm(false);
    setSessionToDelete(null);
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
        <div className="fixed inset-0 z-[100] flex items-center justify-center sm:p-6 overflow-hidden">
            <div 
                className={`absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity duration-300 ${isClosing ? 'opacity-0' : 'opacity-100 animate-fade-in'}`}
                onClick={toggleChat}
            />
            
            <div 
                className={`bg-white/95 backdrop-blur-xl w-full max-w-full h-full sm:h-auto sm:max-w-5xl sm:rounded-3xl shadow-2xl overflow-hidden flex relative z-10 origin-center sm:border border-white/60
                    ${isClosing ? 'animate-fade-out-down' : 'animate-fade-in-up'}
                `}
                style={{
                    height: typeof window !== 'undefined' && window.innerWidth < 640 ? '100dvh' : '85vh',
                    maxHeight: typeof window !== 'undefined' && window.innerWidth < 640 ? '100dvh' : '85vh',
                    animationDuration: '0.3s'
                }}
            >
                {/* Sidebar (History) */}
                <div className={`absolute z-30 h-full bg-slate-50/95 backdrop-blur-md border-r border-slate-200/60 flex flex-col transition-all duration-300 ease-in-out shadow-2xl sm:shadow-none
                    ${showSidebar ? 'translate-x-0 w-[85%] sm:w-72 sm:relative' : '-translate-x-full w-[85%] sm:w-0 sm:border-none sm:opacity-0 sm:overflow-hidden'}`}>
                    <div className="p-4 sm:p-5 border-b border-slate-200/60 flex items-center justify-between bg-white/50 shrink-0 w-full sm:w-72">
                        <div className="flex items-center justify-start gap-2">
                            <button 
                                onClick={() => setShowSidebar(false)}
                                className="sm:hidden p-2 -ml-2 text-slate-500 hover:bg-slate-100 rounded-xl transition-colors"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
                                </svg>
                            </button>
                            <h3 className="font-bold text-slate-800 text-lg">Lịch sử chat</h3>
                        </div>
                        {isSelectionMode && (
                            <button 
                                onClick={() => {
                                    setIsSelectionMode(false);
                                    setSelectedSessions(new Set());
                                }}
                                className="text-sm font-medium text-indigo-600 hover:text-indigo-700"
                            >
                                Hủy
                            </button>
                        )}
                    </div>
                    
                    <div className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-4 w-full sm:w-72">
                        <button 
                            onClick={createNewChat}
                            className="w-full flex items-center gap-2 p-3.5 rounded-xl bg-indigo-600 text-white hover:bg-indigo-700 transition-all shadow-md hover:shadow-lg hover:-translate-y-0.5 font-medium text-sm"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                            </svg>
                            Cuộc trò chuyện mới
                        </button>

                        {isSelectionMode && selectedSessions.size > 0 && (
                            <button 
                                onClick={confirmDeleteSelectedSessions}
                                className="w-full flex items-center justify-center gap-2 p-2.5 rounded-xl bg-rose-100 text-rose-600 hover:bg-rose-200 transition-colors text-sm font-medium mb-4"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                                </svg>
                                Xóa {selectedSessions.size} mục
                            </button>
                        )}

                        {pinnedSessions.length > 0 && (
                            <div>
                                <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 px-2">Đã ghim</h4>
                                <div className="space-y-1">
                                    {pinnedSessions.map(session => (
                                        <div 
                                            key={session.id}
                                            onClick={() => handleSessionClick(session.id)}
                                            onTouchStart={() => handleTouchStart(session.id)}
                                            onTouchEnd={handleTouchEnd}
                                            onMouseDown={() => handleTouchStart(session.id)}
                                            onMouseUp={handleTouchEnd}
                                            onMouseLeave={handleTouchEnd}
                                            className={`group flex items-center justify-between p-3 rounded-xl cursor-pointer transition-all ${currentSessionId === session.id && !isSelectionMode ? 'bg-white shadow-sm border border-indigo-100 ring-1 ring-indigo-50' : 'hover:bg-white/60 border border-transparent hover:border-slate-200/50'} ${selectedSessions.has(session.id) ? 'bg-indigo-50 border-indigo-200' : ''}`}
                                        >
                                            {isSelectionMode && (
                                                <div className="mr-3 flex-shrink-0">
                                                    <div className={`w-4 h-4 rounded border flex items-center justify-center ${selectedSessions.has(session.id) ? 'bg-indigo-500 border-indigo-500 text-white' : 'border-slate-300'}`}>
                                                        {selectedSessions.has(session.id) && (
                                                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-3 h-3">
                                                                <path fillRule="evenodd" d="M19.916 4.626a.75.75 0 0 1 .208 1.04l-9 13.5a.75.75 0 0 1-1.154.114l-6-6a.75.75 0 0 1 1.06-1.06l5.353 5.353 8.493-12.739a.75.75 0 0 1 1.04-.208Z" clipRule="evenodd" />
                                                            </svg>
                                                        )}
                                                    </div>
                                                </div>
                                            )}
                                            <div className="flex-1 min-w-0 pr-2">
                                                {editingSessionId === session.id ? (
                                                    <input 
                                                        type="text" 
                                                        value={editingTitle}
                                                        onChange={(e) => setEditingTitle(e.target.value)}
                                                        onBlur={() => saveRenamedSession(session.id)}
                                                        onKeyDown={(e) => e.key === 'Enter' && saveRenamedSession(session.id)}
                                                        className="w-full text-sm font-semibold text-indigo-700 bg-indigo-50 border border-indigo-200 rounded px-1 outline-none"
                                                        autoFocus
                                                        onClick={(e) => e.stopPropagation()}
                                                    />
                                                ) : (
                                                    <p className={`text-sm truncate ${currentSessionId === session.id ? 'text-indigo-700 font-semibold' : 'text-slate-700 font-medium'}`}>{session.title}</p>
                                                )}
                                                <p className="text-[10px] text-slate-400 mt-1">{formatDate(session.updatedAt)}</p>
                                            </div>
                                            {!isSelectionMode && (
                                                <div className="flex items-center gap-1 opacity-100 transition-opacity">
                                                    <button onClick={(e) => startRenaming(session, e)} className="p-1.5 text-slate-400 hover:text-indigo-500 hover:bg-indigo-50 rounded-lg transition-colors" title="Đổi tên">
                                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                                                            <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" />
                                                        </svg>
                                                    </button>
                                                    <button onClick={(e) => togglePin(session, e)} className="p-1.5 text-indigo-500 hover:bg-indigo-50 rounded-lg transition-colors" title="Bỏ ghim">
                                                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
                                                            <line x1="12" y1="17" x2="12" y2="22"></line>
                                                            <path d="M5 17h14v-1.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V6h1a2 2 0 0 0 0-4H8a2 2 0 0 0 0 4h1v4.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24Z"></path>
                                                        </svg>
                                                    </button>
                                                </div>
                                            )}
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
                                            onClick={() => handleSessionClick(session.id)}
                                            onTouchStart={() => handleTouchStart(session.id)}
                                            onTouchEnd={handleTouchEnd}
                                            onMouseDown={() => handleTouchStart(session.id)}
                                            onMouseUp={handleTouchEnd}
                                            onMouseLeave={handleTouchEnd}
                                            className={`group flex items-center justify-between p-3 rounded-xl cursor-pointer transition-all ${currentSessionId === session.id && !isSelectionMode ? 'bg-white shadow-sm border border-indigo-100 ring-1 ring-indigo-50' : 'hover:bg-white/60 border border-transparent hover:border-slate-200/50'} ${selectedSessions.has(session.id) ? 'bg-indigo-50 border-indigo-200' : ''}`}
                                        >
                                            {isSelectionMode && (
                                                <div className="mr-3 flex-shrink-0">
                                                    <div className={`w-4 h-4 rounded border flex items-center justify-center ${selectedSessions.has(session.id) ? 'bg-indigo-500 border-indigo-500 text-white' : 'border-slate-300'}`}>
                                                        {selectedSessions.has(session.id) && (
                                                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-3 h-3">
                                                                <path fillRule="evenodd" d="M19.916 4.626a.75.75 0 0 1 .208 1.04l-9 13.5a.75.75 0 0 1-1.154.114l-6-6a.75.75 0 0 1 1.06-1.06l5.353 5.353 8.493-12.739a.75.75 0 0 1 1.04-.208Z" clipRule="evenodd" />
                                                            </svg>
                                                        )}
                                                    </div>
                                                </div>
                                            )}
                                            <div className="flex-1 min-w-0 pr-2">
                                                {editingSessionId === session.id ? (
                                                    <input 
                                                        type="text" 
                                                        value={editingTitle}
                                                        onChange={(e) => setEditingTitle(e.target.value)}
                                                        onBlur={() => saveRenamedSession(session.id)}
                                                        onKeyDown={(e) => e.key === 'Enter' && saveRenamedSession(session.id)}
                                                        className="w-full text-sm font-semibold text-indigo-700 bg-indigo-50 border border-indigo-200 rounded px-1 outline-none"
                                                        autoFocus
                                                        onClick={(e) => e.stopPropagation()}
                                                    />
                                                ) : (
                                                    <p className={`text-sm truncate ${currentSessionId === session.id ? 'text-indigo-700 font-semibold' : 'text-slate-700 font-medium'}`}>{session.title}</p>
                                                )}
                                                <p className="text-[10px] text-slate-400 mt-1">{formatDate(session.updatedAt)}</p>
                                            </div>
                                            {!isSelectionMode && (
                                                <div className="flex items-center gap-1 opacity-100 transition-opacity">
                                                    <button onClick={(e) => startRenaming(session, e)} className="p-1.5 text-slate-400 hover:text-indigo-500 hover:bg-indigo-50 rounded-lg transition-colors" title="Đổi tên">
                                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                                                            <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" />
                                                        </svg>
                                                    </button>
                                                    <button onClick={(e) => togglePin(session, e)} className="p-1.5 text-slate-400 hover:text-indigo-500 hover:bg-indigo-50 rounded-lg transition-colors" title="Ghim">
                                                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
                                                            <line x1="12" y1="17" x2="12" y2="22"></line>
                                                            <path d="M5 17h14v-1.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V6h1a2 2 0 0 0 0-4H8a2 2 0 0 0 0 4h1v4.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24Z"></path>
                                                        </svg>
                                                    </button>
                                                    <button onClick={(e) => confirmDeleteSession(session.id, e)} className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-colors" title="Xóa">
                                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                                                            <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                                                        </svg>
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Main Chat Area */}
                <div className="flex-1 flex flex-col min-w-0 bg-white relative z-10">
                    {/* Header */}
                    <div className="flex items-center justify-between p-4 sm:p-5 border-b border-slate-100 bg-white/50 backdrop-blur-md shrink-0">
                        <div className="flex items-center gap-3 sm:gap-4">
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
                            <div className="flex items-center gap-2 sm:gap-3">
                                <input 
                                    type="file" 
                                    ref={fileInputRef} 
                                    onChange={handleAvatarChange} 
                                    accept="image/*" 
                                    className="hidden" 
                                />
                                <div 
                                    className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white shadow-md ring-2 ring-white cursor-pointer overflow-hidden relative group"
                                    onClick={() => fileInputRef.current?.click()}
                                    title="Thay đổi ảnh đại diện"
                                >
                                    {avatarUrl ? (
                                        <img src={avatarUrl} alt="AI Avatar" className="w-full h-full object-cover" />
                                    ) : (
                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6 sm:w-7 sm:h-7">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 0 0-2.456 2.456ZM16.894 20.567 16.5 21.75l-.394-1.183a2.25 2.25 0 0 0-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 0 0 1.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 0 0 1.423 1.423l1.183.394-1.183.394a2.25 2.25 0 0 0-1.423 1.423Z" />
                                        </svg>
                                    )}
                                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5 text-white">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 0 1 5.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 0 0-1.134-.175 2.31 2.31 0 0 1-1.64-1.055l-.822-1.316a2.192 2.192 0 0 0-1.736-1.039 48.774 48.774 0 0 0-5.232 0 2.192 2.192 0 0 0-1.736 1.039l-.821 1.316Z" />
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 1 1-9 0 4.5 4.5 0 0 1 9 0ZM18.75 10.5h.008v.008h-.008V10.5Z" />
                                        </svg>
                                    </div>
                                </div>
                                <div>
                                    <h3 className="font-extrabold text-slate-800 text-base sm:text-lg tracking-tight">Trợ lý AI của Gia Hân</h3>
                                    <p className="text-[10px] sm:text-xs text-emerald-600 font-semibold flex items-center gap-1.5">
                                        <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.6)]"></span>
                                        Đang hoạt động
                                    </p>
                                </div>
                            </div>
                        </div>
                        <button onClick={toggleChat} className={`p-2 sm:p-2.5 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-600 transition-colors ${showSidebar ? 'hidden sm:block' : ''}`}>
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5 sm:w-6 sm:h-6">
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
                                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white shadow-md ring-2 ring-white overflow-hidden">
                                                {avatarUrl ? (
                                                    <img src={avatarUrl} alt="AI Avatar" className="w-full h-full object-cover" />
                                                ) : (
                                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 0 0-2.456 2.456ZM16.894 20.567 16.5 21.75l-.394-1.183a2.25 2.25 0 0 0-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 0 0 1.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 0 0 1.423 1.423l1.183.394-1.183.394a2.25 2.25 0 0 0-1.423 1.423Z" />
                                                    </svg>
                                                )}
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
                        <form onSubmit={handleSendMessage} className="flex flex-col gap-2 max-w-4xl mx-auto relative">
                            <div className="flex items-center gap-2">
                                <button 
                                    type="button"
                                    onMouseDown={startRecording}
                                    onMouseUp={stopRecording}
                                    onMouseLeave={stopRecording}
                                    onTouchStart={startRecording}
                                    onTouchEnd={stopRecording}
                                    className={`p-3 sm:p-4 rounded-2xl transition-colors border shrink-0 select-none
                                        ${isRecording ? 'bg-rose-100 text-rose-600 border-rose-200 animate-pulse' : 'bg-slate-50 text-slate-500 hover:bg-slate-100 hover:text-indigo-600 border-slate-200'}
                                    `}
                                    title="Nhấn giữ để nói"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5 sm:w-6 sm:h-6 pointer-events-none">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 0 0 6-6v-1.5m-6 7.5a6 6 0 0 1-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 0 1-3-3V4.5a3 3 0 1 1 6 0v8.25a3 3 0 0 1-3 3Z" />
                                    </svg>
                                </button>

                                {isRecording ? (
                                    <div className="flex-1 bg-rose-50 border border-rose-200 px-4 sm:px-5 py-3 sm:py-4 rounded-2xl flex items-center gap-3 shadow-inner min-w-0">
                                        <span className="relative flex h-3 w-3 shrink-0">
                                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                                          <span className="relative inline-flex rounded-full h-3 w-3 bg-rose-500"></span>
                                        </span>
                                        <span className="text-rose-600 font-medium text-[15px] animate-pulse truncate">Đang thu âm... Hãy nói gì đó</span>
                                    </div>
                                ) : (
                                    <input 
                                        type="text" 
                                        value={newMessage}
                                        onChange={(e) => setNewMessage(e.target.value)}
                                        placeholder="Hỏi AI bất cứ điều gì..." 
                                        className="flex-1 bg-slate-50 border border-slate-200 outline-none px-4 sm:px-5 py-3 sm:py-4 rounded-2xl text-[15px] font-medium focus:ring-4 focus:ring-indigo-50 focus:border-indigo-300 transition-all text-slate-800 placeholder:text-slate-400 shadow-inner min-w-0"
                                        disabled={isLoading}
                                    />
                                )}
                                
                                <button 
                                    type="submit" 
                                    disabled={!newMessage.trim() || isLoading}
                                    className={`p-3 sm:p-4 rounded-2xl shadow-md transition-all active:scale-95 flex items-center justify-center shrink-0
                                        ${newMessage.trim() && !isLoading ? 'bg-indigo-600 text-white hover:bg-indigo-700 hover:shadow-lg hover:-translate-y-0.5' : 'bg-slate-100 text-slate-400 cursor-not-allowed'}
                                    `}
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 sm:w-6 sm:h-6">
                                        <path d="M3.478 2.404a.75.75 0 0 0-.926.941l2.432 7.905H13.5a.75.75 0 0 1 0 1.5H4.984l-2.432 7.905a.75.75 0 0 0 .926.94 60.519 60.519 0 0 0 18.445-8.986.75.75 0 0 0 0-1.218A60.517 60.517 0 0 0 3.478 2.404Z" />
                                    </svg>
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
            
            {/* Delete Confirmation Modal */}
            {showDeleteConfirm && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fade-in">
                    <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full p-6 animate-scale-in">
                        <div className="flex items-center justify-center w-12 h-12 rounded-full bg-rose-100 text-rose-600 mb-4 mx-auto">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                        </div>
                        <h3 className="text-lg font-bold text-slate-800 text-center mb-2">Xác nhận xóa</h3>
                        <p className="text-slate-600 text-center text-sm mb-6">
                            {isDeletingMultiple 
                                ? `Bạn có chắc chắn muốn xóa ${selectedSessions.size} cuộc trò chuyện đã chọn? Hành động này không thể hoàn tác.`
                                : "Bạn có chắc chắn muốn xóa cuộc trò chuyện này? Hành động này không thể hoàn tác."
                            }
                        </p>
                        <div className="flex gap-3">
                            <button 
                                onClick={() => {
                                    setShowDeleteConfirm(false);
                                    setSessionToDelete(null);
                                }}
                                className="flex-1 px-4 py-2.5 rounded-xl font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors"
                            >
                                Hủy
                            </button>
                            <button 
                                onClick={executeDelete}
                                className="flex-1 px-4 py-2.5 rounded-xl font-medium text-white bg-rose-600 hover:bg-rose-700 shadow-sm shadow-rose-200 transition-all active:scale-95"
                            >
                                Xóa
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
      )}
    </>
  );
};
