import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { GoogleGenAI } from '@google/genai';
import ReactMarkdown from 'react-markdown';
import remarkBreaks from 'remark-breaks';
import remarkGfm from 'remark-gfm';
import TurndownService from 'turndown';
import { useAuth } from '../contexts/AuthContext';
import { AppStyles } from '../types';
import { THEME_COLORS } from '../constants';

// Initialize Gemini API
let aiInstance: GoogleGenAI | null = null;
const getAI = () => {
  if (!aiInstance) {
    const key = process.env.GEMINI_API_KEY;
    if (!key) {
      throw new Error('Please configure GEMINI_API_KEY to use AI features.');
    }
    aiInstance = new GoogleGenAI({ apiKey: key });
  }
  return aiInstance;
};

const FALLBACK_MODELS = [
  "gemini-2.5-flash-lite",
  "gemini-2.5-flash",
  "gemini-3-flash-preview",
  "gemini-3.1-flash-lite-preview",
  "gemma-3-12b-it"
];

const COMMON_PROMPTS = [
    "Viết một bài đăng tuyển dụng thu hút ứng viên, đầy đủ thông tin, tránh bị vi phạm, không được duyệt bài theo chính sách của Facebook",
    "Viết 1 đoạn tin nhắn bằng tiếng Trung thể hiện đã cố gắng đẩy tuyển dụng nhưng vẫn chưa có ứng viên phù hợp và đề xuất hoàn lại tiền cọc nếu quý khách cảm thấy hiệu quả chưa như mong muốn và có thể thử tìm phương án tuyển dụng khác."
];

const SYSTEM_INSTRUCTION = `Bạn là trợ lý AI của Gia Hân, một trợ lý thân thiện, thông minh và hữu ích. Hãy xưng hô là 'em' và gọi người dùng là 'chị' trong giao tiếp thông thường.
LƯU Ý QUAN TRỌNG: Khi nhận prompt yêu cầu dịch thuật, phần nội dung bản dịch trả về PHẢI được đổi ngôi xưng hô sao cho phù hợp với ngữ cảnh của văn bản gốc (ví dụ: giao tiếp chuyên nghiệp giữa Headhunter và Khách hàng/Ứng viên). Tuyệt đối không áp dụng quy tắc xưng hô 'em-chị' vào bên trong nội dung của bản dịch. LUÔN LUÔN tự kiểm tra lại câu trả lời để đảm bảo tính chính xác.`;

interface ChatMessage {
  id: string;
  text: string;
  sender: 'user' | 'ai';
  timestamp: number;
  attachmentData?: string;
  attachmentMimeType?: string;
  attachmentName?: string;
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

interface ChatWidgetProps {
  appStyles: AppStyles;
  theme: string;
}

const TypewriterMarkdown = ({ text, timestamp }: { text: string, timestamp: number }) => {
    // If the message is older than 5 seconds when mounted, show it immediately without animation
    const isNew = Date.now() - timestamp < 5000;
    const [displayedText, setDisplayedText] = useState(isNew ? '' : text);
    const typingIndex = useRef(isNew ? 0 : text.length);
    const requestRef = useRef<number>();
    
    useEffect(() => {
        if (text.length > displayedText.length) {
            let lastUpdate = performance.now();
            const TYPING_SPEED = 20; // ms per char
            
            const typeText = (time: number) => {
                if (time - lastUpdate > TYPING_SPEED) {
                     const charsToAdd = Math.ceil((time - lastUpdate) / TYPING_SPEED);
                     typingIndex.current = Math.min(text.length, typingIndex.current + charsToAdd);
                     
                     setDisplayedText(text.slice(0, typingIndex.current));
                     lastUpdate = time;
                }
                
                if (typingIndex.current < text.length) {
                    requestRef.current = requestAnimationFrame(typeText);
                }
            };
            
            requestRef.current = requestAnimationFrame(typeText);
            
            return () => {
                if (requestRef.current) cancelAnimationFrame(requestRef.current);
            };
        } else if (!isNew && displayedText.length === 0 && text.length > 0) {
            setDisplayedText(text);
        }
    }, [text, isNew]);

    return <ReactMarkdown remarkPlugins={[remarkGfm, remarkBreaks]}>{displayedText}</ReactMarkdown>;
};

export const ChatWidget: React.FC<ChatWidgetProps> = ({ appStyles, theme }) => {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [isChatOpening, setIsChatOpening] = useState(false);
  const [showSidebar, setShowSidebar] = useState(typeof window !== 'undefined' && window.innerWidth >= 1024);
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isHistoryLoading, setIsHistoryLoading] = useState(false);
  const [isModelSelectorOpen, setIsModelSelectorOpen] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [chatMode, setChatMode] = useState<'normal' | 'deep_translate' | 'writing'>('normal');
  const [showModeGuide, setShowModeGuide] = useState(false);
  const [showPrompts, setShowPrompts] = useState(false);
  const [isClosingPrompts, setIsClosingPrompts] = useState(false);
  const [isClosingModeGuide, setIsClosingModeGuide] = useState(false);
  const [showMobileActions, setShowMobileActions] = useState(true);
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedSessions, setSelectedSessions] = useState<Set<string>>(new Set());
  const [editingSessionId, setEditingSessionId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState('');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [aiName, setAiName] = useState('Trợ lý AI của Gia Hân');
  const [isEditingAiName, setIsEditingAiName] = useState(false);
  const aiNameInputRef = useRef<HTMLInputElement>(null);
  const [sessionToDelete, setSessionToDelete] = useState<string | null>(null);
  const [isDeletingMultiple, setIsDeletingMultiple] = useState(false);
  
  // Voice and Attachment states
  const [attachment, setAttachment] = useState<{data: string, mimeType: string, name: string} | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const recognitionRef = useRef<any>(null);
  const chatFileInputRef = useRef<HTMLInputElement>(null);
  const chatImageInputRef = useRef<HTMLInputElement>(null);

  const scrollRef = useRef<HTMLDivElement>(null);
  const sidebarRef = useRef<HTMLDivElement>(null);
  const chatSessionRef = useRef<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const longPressTimerRef = useRef<NodeJS.Timeout | null>(null);
  const currentModelIndexRef = useRef(0);
  const [currentModelIndex, setCurrentModelIndex] = useState(0);
  const activeModelRef = useRef(FALLBACK_MODELS[0]);
  const availableModelsRef = useRef<string[]>(FALLBACK_MODELS);
  const [modelOptions, setModelOptions] = useState<{key:string, name:string}[]>(
    FALLBACK_MODELS.map(m => ({key: m, name: m}))
  );

  const [isFullScreen, setIsFullScreen] = useState(false);
  const isCancelingRef = useRef(false);
  const [touchStartX, setTouchStartX] = useState(0);
  const [recordingOffset, setRecordingOffset] = useState(0);

  useEffect(() => {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (user?.uid) {
        headers['x-user-uid'] = user.uid;
    }
    
    fetch('/api/models', { headers })
      .then(res => res.json())
      .then(data => {
        if (data && data.length > 0) {
          const fetchedModels = data.map((m: any) => ({ key: m.modelKey, name: m.name }));
          setModelOptions(fetchedModels);
          availableModelsRef.current = fetchedModels.map((m: any) => m.key);
          if (currentModelIndexRef.current >= fetchedModels.length) {
            currentModelIndexRef.current = 0;
            setCurrentModelIndex(0);
          }
          activeModelRef.current = fetchedModels[currentModelIndexRef.current].key;
        }
      })
      .catch(console.error);

    const savedAvatar = localStorage.getItem('ai_avatar');
    if (savedAvatar) {
      setAvatarUrl(savedAvatar);
    }
    const savedAiName = localStorage.getItem('ai_name');
    if (savedAiName) {
      setAiName(savedAiName);
    }

    // Initialize Speech Recognition
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
        recognitionRef.current = new SpeechRecognition();
        recognitionRef.current.continuous = false;
        recognitionRef.current.interimResults = false;
        recognitionRef.current.lang = 'vi-VN';

        recognitionRef.current.onresult = (event: any) => {
            if (isCancelingRef.current) {
                isCancelingRef.current = false;
                return;
            }
            const transcript = event.results[0][0].transcript;
            setNewMessage(prev => prev ? `${prev} ${transcript}` : transcript);
        };

        recognitionRef.current.onerror = (event: any) => {
            console.error("Speech recognition error", event.error);
            setIsRecording(false);
            setRecordingOffset(0);
            if (event.error === 'not-allowed') {
                alert("Không thể truy cập Micro. Vui lòng cấp quyền sử dụng Micro cho trình duyệt.");
            }
        };

        recognitionRef.current.onend = () => {
            setIsRecording(false);
            setRecordingOffset(0);
            isCancelingRef.current = false;
        };
    }
  }, []);

  const handleMicTouchStart = (e: React.TouchEvent | React.MouseEvent) => {
      if ('touches' in e) {
          setTouchStartX(e.touches[0].clientX);
      }
      startRecording(e);
  };

  const handleMicTouchMove = (e: React.TouchEvent) => {
      if (!isRecording) return;
      const currentX = e.touches[0].clientX;
      const diff = currentX - touchStartX;
      if (diff < 0) {
          setRecordingOffset(diff);
          if (diff < -100) { // Cancel recording threshold
              cancelRecording();
          }
      }
  };

  const cancelRecording = () => {
      isCancelingRef.current = true;
      if (isRecording && recognitionRef.current) {
          try {
              recognitionRef.current.stop();
          } catch (e) {
              console.error(e);
          }
          setIsRecording(false);
          setRecordingOffset(0);
      }
  };

  const startRecording = (e?: React.MouseEvent | React.TouchEvent) => {
      if (e && e.type === 'touchstart') {
          if (e.cancelable) {
              e.preventDefault();
          }
      }
      if (!recognitionRef.current) {
          alert("Trình duyệt của bạn không hỗ trợ nhận diện giọng nói.");
          return;
      }
      if (!isRecording) {
          try {
              isCancelingRef.current = false;
              setRecordingOffset(0);
              recognitionRef.current.start();
              setIsRecording(true);
          } catch (e) {
              console.error("Failed to start recording:", e);
              setIsRecording(false);
          }
      }
  };

  const stopRecording = (e?: React.MouseEvent | React.TouchEvent) => {
      if (e && (e.type === 'touchend' || e.type === 'touchcancel')) {
          if (e.cancelable) {
              e.preventDefault();
          }
      }
      if (isRecording && recognitionRef.current) {
          try {
              recognitionRef.current.stop();
          } catch (e) {
              console.error(e);
          }
          setIsRecording(false);
          setRecordingOffset(0);
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
              mimeType: file.type || 'application/octet-stream',
              name: file.name
          });
      };
      reader.readAsDataURL(file);
      
      if (chatFileInputRef.current) {
          chatFileInputRef.current.value = '';
      }
      if (chatImageInputRef.current) {
          chatImageInputRef.current.value = '';
      }
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      // Close sidebar when clicking outside (applies only on mobile screens < 640px)
      if (window.innerWidth < 640 && showSidebar && sidebarRef.current && !sidebarRef.current.contains(event.target as Node)) {
        const toggleBtn = document.getElementById('chat-sidebar-toggle');
        const toggleBtnDesktop = document.getElementById('chat-sidebar-toggle-desktop');
        if ((toggleBtn && toggleBtn.contains(event.target as Node)) || 
            (toggleBtnDesktop && toggleBtnDesktop.contains(event.target as Node))) {
             return;
        }
        
        // Don't close if clicking inside modals or confirmation dialogs
        const targetElement = event.target as Element;
        if (targetElement.closest('.fixed.inset-0.z-\\[60\\]')) {
            return;
        }
        
        setShowSidebar(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [showSidebar]);

  const handlePaste = (e: React.ClipboardEvent) => {
      if (attachment) return; // Only one file allowed
      let file: File | null = null;
      if (e.clipboardData.files && e.clipboardData.files.length > 0) {
          file = e.clipboardData.files[0];
      } else {
          const items = e.clipboardData.items;
          for (let i = 0; i < items.length; i++) {
              if (items[i].kind === 'file') {
                  file = items[i].getAsFile();
                  break;
              }
          }
      }

      if (file && (file.type.indexOf('image/') !== -1 || file.type.includes('pdf') || file.type.includes('word') || file.name?.endsWith('.docx') || file.name?.endsWith('.pdf') || file.name?.endsWith('.txt'))) {
          e.preventDefault();
          if (file.size > 5 * 1024 * 1024) {
              alert("Vui lòng dán file nhỏ hơn 5MB.");
              return;
          }
          const reader = new FileReader();
          reader.onloadend = () => {
              const base64String = reader.result as string;
              const base64Data = base64String.split(',')[1];
              let nameFallback = 'document';
              if (file!.type.indexOf('image/') !== -1) nameFallback = 'image.png';
              else if (file!.type === 'application/pdf') nameFallback = 'document.pdf';
              else nameFallback = 'document.docx';

              setAttachment({
                  data: base64Data,
                  mimeType: file!.type || 'application/octet-stream',
                  name: file!.name || nameFallback
              });
          };
          reader.readAsDataURL(file);
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

  // Fetch sessions from local storage and sync with DB
  useEffect(() => {
    const loadSessions = async () => {
      const localSessionsStr = localStorage.getItem('app_chat_sessions');
      const savedOwner = localStorage.getItem('app_chat_sessions_owner');
      const currentOwner = user?.uid || 'guest';
      
      let parsedLocal = [];
      const shouldLoadLocal = !savedOwner || savedOwner === currentOwner || savedOwner === 'guest';
      
      if (shouldLoadLocal) {
          parsedLocal = localSessionsStr ? JSON.parse(localSessionsStr) : [];
      }
      
      if (user && user.uid) {
        try {
          const localOnly = parsedLocal.filter((s: ChatSession) => !s.userId || s.userId === 'local');
          const response = await fetch('/api/chat/sync', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'x-user-uid': user.uid },
            body: JSON.stringify({ uid: user.uid, localSessions: localOnly })
          });
          if (response.ok) {
            const data = await response.json();
            if (Array.isArray(data) && data.length > 0) {
              setSessions(data);
              localStorage.setItem('app_chat_sessions', JSON.stringify(data));
              localStorage.setItem('app_chat_sessions_owner', user.uid);
              return;
            }
          }
        } catch (err) {
          console.error('Failed to sync chat history', err);
        }
      }
      
      setSessions(parsedLocal);
      localStorage.setItem('app_chat_sessions_owner', currentOwner);
    };
    loadSessions();
  }, [user]);

  // Sync messages state when current session changes
  useEffect(() => {
    try {
      if (currentSessionId) {
        setIsHistoryLoading(true);
        const session = sessions.find(s => s.id === currentSessionId);
        if (session) {
          setTimeout(() => {
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
            
            chatSessionRef.current = getAI().chats.create({
              model: availableModelsRef.current[currentModelIndexRef.current],
              config: {
                systemInstruction: SYSTEM_INSTRUCTION,
              },
              history: validHistory.length > 0 ? validHistory : undefined
            });
            activeModelRef.current = availableModelsRef.current[currentModelIndexRef.current];
            setIsHistoryLoading(false);
          }, 300);
        } else {
            setIsHistoryLoading(false);
        }
      } else {
        setMessages([{
          id: Date.now().toString(),
          text: "Xin chào! Em là trợ lý AI của Gia Hân. Em có thể giúp gì cho chị hôm nay?",
          sender: 'ai',
          timestamp: Date.now()
        }]);
        chatSessionRef.current = getAI().chats.create({
          model: availableModelsRef.current[currentModelIndexRef.current],
          config: {
            systemInstruction: SYSTEM_INSTRUCTION,
          },
        });
        activeModelRef.current = availableModelsRef.current[currentModelIndexRef.current];
      }
    } catch (err: any) {
      console.warn("AI Init failed:", err);
      setIsHistoryLoading(false);
      // Don't crash the widget
    }
  }, [currentSessionId, sessions.length === 0]);

  // Toggle Chat
  const toggleChat = () => {
    if (isOpen) {
      setIsClosing(true);
      setTimeout(() => {
        setIsOpen(false);
        setIsClosing(false);
      }, 200);
    } else {
      setIsOpen(true);
      setIsChatOpening(true);
      setTimeout(() => setIsChatOpening(false), 300);
      setTimeout(scrollToBottom, 100);
    }
  };

  const handleCloseModeGuide = () => {
    setIsClosingModeGuide(true);
    setTimeout(() => {
        setShowModeGuide(false);
        setIsClosingModeGuide(false);
    }, 200);
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
    // Không lưu base64 của file đính kèm vào localStorage để tránh tràn bộ nhớ
    const messagesToSave = newMessages.map(msg => {
        const { attachmentData, ...rest } = msg;
        return rest;
    });

    const isLocal = !user || !user.uid;
    const sessionUserId = isLocal ? 'local' : user.uid;

    const sessionData: ChatSession = {
      id: sessionId,
      userId: sessionUserId,
      title,
      isPinned,
      updatedAt: Date.now(),
      createdAt: sessions.find(s => s.id === sessionId)?.createdAt || Date.now(),
      messages: messagesToSave
    };

    // Save to local storage state
    const updatedSessions = [...sessions];
    const existingIndex = updatedSessions.findIndex(s => s.id === sessionId);
    if (existingIndex >= 0) {
      updatedSessions[existingIndex] = sessionData;
    } else {
      updatedSessions.push(sessionData);
    }
    
    // Sort by updatedAt desc
    updatedSessions.sort((a, b) => b.updatedAt - a.updatedAt);
    
    // Keep only last 50 sessions to save memory locally
    const trimmedSessions = updatedSessions.slice(0, 50);
    
    setSessions(trimmedSessions);
    localStorage.setItem('app_chat_sessions', JSON.stringify(trimmedSessions));
    localStorage.setItem('app_chat_sessions_owner', user?.uid || 'guest');

    // Save to DB if user is logged in
    if (!isLocal) {
      try {
        await fetch('/api/chat/sessions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'x-user-uid': sessionUserId },
          body: JSON.stringify({ uid: sessionUserId, session: sessionData })
        });
      } catch (err) {
        console.error('Failed to sync session to DB', err);
      }
    }
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
      timestamp: Date.now(),
      attachmentData: currentAttachment?.data,
      attachmentMimeType: currentAttachment?.mimeType,
      attachmentName: currentAttachment?.name
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
Câu dịch tiếng Trung

Nghĩa tiếng Việt: Nghĩa tiếng Việt tương ứng

2. Nếu input là tiếng Trung: Dịch sang tiếng Việt một cách tự nhiên, đúng ngữ cảnh giao tiếp Headhunter.

3. TUYỆT ĐỐI KHÔNG giải thích, KHÔNG thêm chữ thừa. Chỉ trả về kết quả dịch theo đúng định dạng.

Input cần dịch:
${text}`;
    } else if (chatMode === 'writing') {
        promptText = `[TẠO BÀI VIẾT TUYỂN DỤNG]
Bạn là một headhunter hoặc chuyên gia tuyển dụng chuyên nghiệp. Hãy viết một bài đăng tuyển dụng NGẮN GỌN, SÚC TÍCH, VĂN PHONG CHUYÊN NGHIỆP để đăng Facebook hoặc Threads, thu hút ứng viên dựa trên thông tin được cung cấp.

Bài viết BẮT BUỘC TUÂN THỦ các quy tắc sau:
1. KHÔNG xưng hô (như em-chị, tôi-bạn) hay đóng vai trợ lý AI. KHÔNG có phần mở bài hay kết luận thừa thãi.
2. CHỈ TRẢ VỀ DUY NHẤT nội dung của bài viết tuyển dụng để người dùng có thể copy và sử dụng ngay.
3. FORMAT TIÊU ĐỀ CHÍNH: Bắt buộc phải có định dạng "[Địa điểm] + Tiêu đề về job thu hút ứng viên".
4. BẢO VỆ TÀI KHOẢN (FACEBOOK SAFE): Tiêu đề và nội dung phải lách hoặc tránh tuyệt đối các từ ngữ nhạy cảm, vi phạm nguyên tắc cộng đồng của Facebook, làm bài không được duyệt.
5. TRÌNH BÀY: Rất ngắn gọn, súc tích, giữ nguyên đủ ý. Sử dụng gạch đầu dòng (-) rõ ràng.
6. HẠN CHẾ ICON: Hạn chế tối đa sử dụng icon (biểu tượng cảm xúc), phong cách chuyên nghiệp.
7. NỘI DUNG (nếu thông tin được cung cấp không có thì bỏ qua phần đó):
   - Tên công ty (nếu có).
   - Mô tả công việc ngắn gọn.
   - Yêu cầu công việc.
   - Quyền lợi ứng viên.
   - Thời gian và địa điểm làm việc.
   - Thông tin liên hệ ứng tuyển rõ ràng.

Thông tin công việc:
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

    while (!success && attempts < availableModelsRef.current.length) {
      try {
        const modelToUse = availableModelsRef.current[(currentModelIndexRef.current + attempts) % availableModelsRef.current.length];
        
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
          
          chatSessionRef.current = getAI().chats.create({
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
        currentModelIndexRef.current = (currentModelIndexRef.current + attempts) % availableModelsRef.current.length;
        setCurrentModelIndex(currentModelIndexRef.current);

        // Save final AI message
        const finalMessages = currentMessages.map(msg => 
          msg.id === aiMsgId ? { ...msg, text: fullResponse } : msg
        );
        saveSession(sessionId, sessionTitle, finalMessages, sessions.find(s => s.id === sessionId)?.isPinned || false);

      } catch (error) {
        console.warn(`AI Chat error with model ${activeModelRef.current}:`, error);
        attempts++;
        if (attempts >= availableModelsRef.current.length) {
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

  const handleCopy = async (text: string, id: string) => {
    // Clean markdown before copying for plain text fallback
    const cleanText = text
        .replace(/\*\*(.*?)\*\*/gs, '$1') // remove bold
        .replace(/\*(.*?)\*/gs, '$1')     // remove italic/bold
        .replace(/__(.*?)__/gs, '$1')     // remove underline/italic
        .replace(/^#+\s/gm, '')           // remove headings
        .replace(/\[(.*?)\]\(.*?\)/gs, '$1') // remove links
        .replace(/`(.*?)`/gs, '$1');      // remove inline code

    try {
      const messageElement = document.getElementById(`msg-content-${id}`);
      if (messageElement && window.ClipboardItem) {
          const htmlContent = messageElement.innerHTML;
          // Create blobs
          const textBlob = new Blob([cleanText], { type: 'text/plain' });
          const htmlBlob = new Blob([htmlContent], { type: 'text/html' });
          
          await navigator.clipboard.write([
              new ClipboardItem({
                  'text/plain': textBlob,
                  'text/html': htmlBlob
              })
          ]);
      } else {
          await navigator.clipboard.writeText(cleanText);
      }
    } catch (err) {
      console.warn('Clipboard write failed, using fallback:', err);
      try {
        await navigator.clipboard.writeText(cleanText);
      } catch (e) {
        console.error('Fallback clipboard failed:', e);
      }
    }

    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  useEffect(() => {
      if (isEditingAiName && aiNameInputRef.current) {
          aiNameInputRef.current.focus();
      }
  }, [isEditingAiName]);

  const handleAiNameSave = () => {
      setIsEditingAiName(false);
      localStorage.setItem('ai_name', aiName);
  };
  
  const handleAiNameKeyDown = (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') {
          handleAiNameSave();
      }
  };

  const closePrompts = () => {
      setIsClosingPrompts(true);
      setTimeout(() => {
          setShowPrompts(false);
          setIsClosingPrompts(false);
      }, 300);
  };

  const createNewChat = () => {
    setCurrentSessionId(null);
    setMessages([{
      id: Date.now().toString(),
      text: "Xin chào! Em là trợ lý AI của Gia Hân. Em có thể giúp gì cho bạn hôm nay?",
      sender: 'ai',
      timestamp: Date.now()
    }]);
    try {
      chatSessionRef.current = getAI().chats.create({
        model: availableModelsRef.current[currentModelIndexRef.current],
        config: {
          systemInstruction: SYSTEM_INSTRUCTION,
        },
      });
      activeModelRef.current = availableModelsRef.current[currentModelIndexRef.current];
    } catch (err: any) {
      console.warn("AI Init failed in createNewChat:", err);
    }
    if (window.innerWidth < 640) setShowSidebar(false);
  };

  const persistSessions = (updatedSessions: ChatSession[]) => {
    setSessions(updatedSessions);
    localStorage.setItem('app_chat_sessions', JSON.stringify(updatedSessions));
    localStorage.setItem('app_chat_sessions_owner', user?.uid || 'guest');
  };

  const togglePin = async (session: ChatSession, e: React.MouseEvent) => {
    e.stopPropagation();
    const updatedSessions = [...sessions];
    const index = updatedSessions.findIndex(s => s.id === session.id);
    if (index >= 0) {
      updatedSessions[index] = { ...updatedSessions[index], isPinned: !updatedSessions[index].isPinned };
      
      // Update local storage via persistSessions
      setSessions(updatedSessions);
      localStorage.setItem('app_chat_sessions', JSON.stringify(updatedSessions));
      localStorage.setItem('app_chat_sessions_owner', user?.uid || 'guest');
      
      // Update DB if authenticated
      if (user && user.uid && updatedSessions[index].userId !== 'local') {
          try {
              await fetch('/api/chat/sessions', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json', 'x-user-uid': user.uid },
                  body: JSON.stringify({ uid: user.uid, session: updatedSessions[index] })
              });
          } catch (err) {
              console.error('Failed to update pin state in DB', err);
          }
      }
    }
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
    
    let updatedSessionToSave: ChatSession | null = null;
    const updatedSessions = sessions.map(s => {
        if (s.id === sessionId) {
            updatedSessionToSave = { ...s, title: editingTitle.trim() };
            return updatedSessionToSave;
        }
        return s;
    });
    
    setSessions(updatedSessions);
    localStorage.setItem('app_chat_sessions', JSON.stringify(updatedSessions));
    localStorage.setItem('app_chat_sessions_owner', user?.uid || 'guest');
    
    if (updatedSessionToSave && user && user.uid && (updatedSessionToSave as ChatSession).userId !== 'local') {
        try {
            await fetch('/api/chat/sessions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'x-user-uid': user.uid },
                body: JSON.stringify({ uid: user.uid, session: updatedSessionToSave })
            });
        } catch (err) {
            console.error('Failed to update session title in DB', err);
        }
    }
    
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
        const deletedIds = Array.from(selectedSessions);
        const updatedSessions = sessions.filter(s => !selectedSessions.has(s.id));
        setSessions(updatedSessions);
        localStorage.setItem('app_chat_sessions', JSON.stringify(updatedSessions));
        localStorage.setItem('app_chat_sessions_owner', user?.uid || 'guest');
        if (currentSessionId && selectedSessions.has(currentSessionId)) {
            createNewChat();
        }
        setIsSelectionMode(false);
        setSelectedSessions(new Set());
        
        // Delete from DB if authenticated
        if (user && user.uid) {
            deletedIds.forEach(id => {
                fetch(`/api/chat/sessions/${id}?uid=${user.uid}`, { method: 'DELETE', headers: { 'x-user-uid': user.uid } }).catch(console.error);
            });
        }
    } else if (sessionToDelete) {
        const updatedSessions = sessions.filter(s => s.id !== sessionToDelete);
        setSessions(updatedSessions);
        localStorage.setItem('app_chat_sessions', JSON.stringify(updatedSessions));
        localStorage.setItem('app_chat_sessions_owner', user?.uid || 'guest');
        if (currentSessionId === sessionToDelete) {
          createNewChat();
        }
        
        // Delete from DB if authenticated
        if (user && user.uid) {
            fetch(`/api/chat/sessions/${sessionToDelete}?uid=${user.uid}`, { method: 'DELETE', headers: { 'x-user-uid': user.uid } }).catch(console.error);
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
                    className={`
                        w-14 h-14 rounded-full text-white flex items-center justify-center transition-transform duration-200 active:scale-95 backdrop-blur-md relative overflow-hidden group
                        ${appStyles.button === '3d' ? 'bg-gradient-to-br from-indigo-500 to-purple-600 border-2 border-white/50 shadow-[0_8px_0_theme(colors.indigo.800)] hover:-translate-y-2 active:shadow-[0_0px_0_theme(colors.indigo.800)] active:translate-y-0' 
                        : appStyles.button === 'glow' ? 'bg-indigo-600 border-2 border-white/50 shadow-[0_0_20px_rgba(79,70,229,0.5)] hover:shadow-[0_0_30px_rgba(79,70,229,0.7)] hover:scale-110'
                        : appStyles.button === 'leaf' ? 'bg-green-600 border-2 border-white/50 rounded-tl-none rounded-br-[16px] shadow-[0_8px_0_theme(colors.green.800)] hover:-translate-y-2 active:shadow-none active:translate-y-0'
                        : appStyles.button === 'diamond' ? 'bg-cyan-500 !rounded-none [clip-path:polygon(10%_0,90%_0,100%_50%,90%_100%,10%_100%,0_50%)] hover:scale-110'
                        : appStyles.button === 'magic_wand' ? 'bg-gradient-to-r from-violet-600 to-fuchsia-600 border-0 ring-4 ring-purple-300 ring-offset-2 ring-offset-white/20 hover:scale-110'
                        : appStyles.button === 'bubble' ? 'bg-sky-400 border-0 shadow-[inset_0_-4px_8px_rgba(0,0,0,0.2),_0_8px_16px_rgba(56,189,248,0.4)] hover:scale-110'
                        : appStyles.button === 'rocket' ? 'bg-slate-800 text-indigo-50 !rounded-t-3xl border-2 border-indigo-400 !rounded-b-md shadow-[0_6px_0_theme(colors.slate.900)] hover:-translate-y-2 active:translate-y-0 active:shadow-none'
                        : appStyles.button === 'frog' ? 'bg-green-100 text-green-900 border-[3px] border-green-600 rounded-[40px] hover:-translate-y-1 active:scale-95 shadow-[0_4px_0_theme(colors.green.700)] active:translate-y-1 active:shadow-none'
                        : appStyles.button === 'cat' ? 'bg-[#FDBA74] text-slate-900 border-[3px] border-[#EA580C] !rounded-xl hover:-translate-y-1 active:scale-95 shadow-md'
                        : appStyles.button === 'panda' ? 'bg-zinc-800 text-white border-[3px] border-zinc-900 rounded-[20px] hover:-translate-y-1 active:scale-95 shadow-[0_4px_0_theme(colors.zinc.900)] active:shadow-none active:translate-y-1'
                        : appStyles.button === 'fox' ? 'bg-[#F97316] text-white border-[3px] border-[#C2410C] rounded-xl hover:-translate-y-1 active:scale-95 shadow-[0_4px_0_theme(colors.orange.800)] active:shadow-none active:translate-y-1'
                        : appStyles.button === 'dragon' ? 'bg-red-600 text-white !rounded-none border-[3px] border-red-900 [clip-path:polygon(10%_0%,90%_0%,100%_50%,90%_100%,10%_100%,0%_50%)] hover:scale-110 active:scale-95 shadow-xl'
                        : appStyles.button === 'penguin' ? 'bg-blue-400 text-white !rounded-[24px] border-[3px] border-blue-600 hover:-translate-y-1 active:scale-95 shadow-[0_4px_0_theme(colors.blue.600)] active:shadow-none active:translate-y-1 overflow-hidden'
                        : appStyles.button === 'bear' ? 'bg-amber-700 text-amber-50 rounded-[16px] border-[3px] border-amber-900 hover:-translate-y-1 active:scale-95 shadow-[0_4px_0_theme(colors.amber.900)] active:shadow-none active:translate-y-1'
                        : appStyles.button === 'rabbit' ? 'bg-pink-400 text-white rounded-[24px] border-[3px] border-pink-600 hover:-translate-y-1 active:scale-95 shadow-[0_4px_0_theme(colors.pink.600)] active:shadow-none active:translate-y-1'
                        : appStyles.button === 'bee' ? 'bg-yellow-400 text-slate-900 rounded-[20px] border-[3px] border-yellow-600 hover:-translate-y-1 active:scale-95 shadow-[0_4px_0_theme(colors.yellow.600)] active:shadow-none active:translate-y-1 overflow-hidden'
                        : appStyles.button === 'whale' ? 'bg-sky-500 text-white rounded-[20px] border-[3px] border-sky-700 hover:-translate-y-1 active:scale-95 shadow-[0_4px_0_theme(colors.sky.700)] active:shadow-none active:translate-y-1 overflow-hidden'
                        : 'bg-gradient-to-br from-indigo-500 to-purple-600 border-2 border-white/50 shadow-2xl hover:scale-110'}
                    `}
                >
                    {appStyles.button === 'glow' && (
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full animate-[shimmer_2s_infinite]" />
                    )}
                    {appStyles.button === 'leaf' && <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rotate-45 pointer-events-none"></div>}
                    {appStyles.button === 'diamond' && <div className="absolute inset-x-0 top-0 h-1/2 bg-white/20 pointer-events-none"></div>}
                    {appStyles.button === 'bubble' && <div className="absolute top-1 left-2 w-4 h-2 bg-white/40 rounded-full rotate-[-20deg] pointer-events-none"></div>}
                    {appStyles.button === 'rocket' && <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-3 h-1.5 bg-yellow-400 rounded-b-full pointer-events-none shadow-[0_2px_6px_theme(colors.orange.500)]"></div>}
                    
                    {/* Animal Chat Decorators */}
                    {appStyles.button === 'frog' && (
                        <>
                            {/* Hai con mắt lồi to (thu nhỏ lại cho nút chat) */}
                            <div className="absolute -top-[12px] left-[15%] w-8 h-8 bg-green-100 border-[3px] border-green-600 rounded-full z-[-1] flex items-center justify-center shadow-sm">
                                <div className="w-5 h-5 bg-white rounded-full flex justify-center items-center">
                                    <div className="w-2.5 h-2.5 bg-slate-900 rounded-full translate-x-0.5">
                                        <div className="w-1 h-1 bg-white rounded-full mt-[1px] ml-[1px]"></div>
                                    </div>
                                </div>
                            </div>
                            <div className="absolute -top-[12px] right-[15%] w-8 h-8 bg-green-100 border-[3px] border-green-600 rounded-full z-[-1] flex items-center justify-center shadow-sm">
                                <div className="w-5 h-5 bg-white rounded-full flex justify-center items-center">
                                    <div className="w-2.5 h-2.5 bg-slate-900 rounded-full -translate-x-0.5">
                                        <div className="w-1 h-1 bg-white rounded-full mt-[1px] ml-[1px]"></div>
                                    </div>
                                </div>
                            </div>
                            {/* Bụng */}
                            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[85%] h-3 bg-green-200 rounded-t-[40px] opacity-95 pointer-events-none"></div>
                            {/* Má hồng */}
                            <div className="absolute top-[40%] left-[8%] w-4 h-2 bg-pink-400/60 rounded-full blur-[2px] pointer-events-none"></div>
                            <div className="absolute top-[40%] right-[8%] w-4 h-2 bg-pink-400/60 rounded-full blur-[2px] pointer-events-none"></div>
                        </>
                    )}
                    {appStyles.button === 'cat' && (
                        <>
                            <div className="absolute -top-1 left-[10%] w-4 h-4 bg-[#FDBA74] border-[2px] border-[#EA580C] rotate-[-20deg] [clip-path:polygon(50%_0%,0%_100%,100%_100%)] z-[-1] pointer-events-none"></div>
                            <div className="absolute -top-1 right-[10%] w-4 h-4 bg-[#FDBA74] border-[2px] border-[#EA580C] rotate-[20deg] [clip-path:polygon(50%_0%,0%_100%,100%_100%)] z-[-1] pointer-events-none"></div>
                            <div className="absolute top-[35%] left-1/2 -translate-x-1/2 flex gap-3 pointer-events-none z-10"><div className="w-1.5 h-1.5 bg-amber-950 rounded-full"></div><div className="w-1.5 h-1.5 bg-amber-950 rounded-full"></div></div>
                            <div className="absolute top-[50%] left-1/2 -translate-x-1/2 w-2 h-1 border-b-[2px] border-amber-900 rounded-b-full pointer-events-none z-10"></div>
                        </>
                    )}
                    {appStyles.button === 'panda' && (
                        <>
                            <div className="absolute -top-2 left-[10%] w-5 h-5 bg-zinc-900 rounded-full z-[-1] pointer-events-none"></div>
                            <div className="absolute -top-2 right-[10%] w-5 h-5 bg-zinc-900 rounded-full z-[-1] pointer-events-none"></div>
                        </>
                    )}
                    {appStyles.button === 'fox' && (
                        <>
                            <div className="absolute -top-2 left-[10%] w-5 h-5 bg-[#C2410C] rotate-[-15deg] [clip-path:polygon(50%_0%,0%_100%,100%_100%)] z-[-1] pointer-events-none"></div>
                            <div className="absolute -top-2 right-[10%] w-5 h-5 bg-[#C2410C] rotate-[15deg] [clip-path:polygon(50%_0%,0%_100%,100%_100%)] z-[-1] pointer-events-none"></div>
                        </>
                    )}
                    {appStyles.button === 'dragon' && (
                        <>
                            <div className="absolute -top-2 left-1/4 w-4 h-4 bg-red-800 rotate-45 z-[-1] pointer-events-none"></div>
                            <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-4 h-4 bg-red-900 rotate-45 z-[-1] pointer-events-none"></div>
                            <div className="absolute -top-2 right-1/4 w-4 h-4 bg-red-800 rotate-45 z-[-1] pointer-events-none"></div>
                        </>
                    )}
                    {appStyles.button === 'penguin' && (
                        <>
                            <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-[70%] h-1/2 bg-white rounded-t-full z-0 pointer-events-none"></div>
                        </>
                    )}
                    {appStyles.button === 'bear' && (
                        <>
                            <div className="absolute -top-2 left-[15%] w-5 h-5 bg-amber-800 rounded-full z-[-1] pointer-events-none"></div>
                            <div className="absolute -top-2 right-[15%] w-5 h-5 bg-amber-800 rounded-full z-[-1] pointer-events-none"></div>
                        </>
                    )}
                    {appStyles.button === 'rabbit' && (
                        <>
                            <div className="absolute -top-6 left-[20%] w-4 h-8 bg-pink-500 rounded-full rotate-[-15deg] z-[-1] pointer-events-none flex items-center justify-center border-[2px] border-pink-600"><div className="w-1.5 h-4 bg-pink-200 rounded-full"></div></div>
                            <div className="absolute -top-6 right-[20%] w-4 h-8 bg-pink-500 rounded-full rotate-[15deg] z-[-1] pointer-events-none flex items-center justify-center border-[2px] border-pink-600"><div className="w-1.5 h-4 bg-pink-200 rounded-full"></div></div>
                        </>
                    )}
                    {appStyles.button === 'bee' && (
                        <>
                            <div className="absolute inset-0 bg-[repeating-linear-gradient(90deg,transparent,transparent_10px,rgba(0,0,0,0.15)_10px,rgba(0,0,0,0.15)_20px)] pointer-events-none"></div>
                            <div className="absolute -top-2 left-[15%] w-5 h-3 bg-white/40 rotate-[-30deg] rounded-full z-[-1] pointer-events-none border border-white/60"></div>
                            <div className="absolute -top-2 right-[15%] w-5 h-3 bg-white/40 rotate-[30deg] rounded-full z-[-1] pointer-events-none border border-white/60"></div>
                        </>
                    )}
                    {appStyles.button === 'whale' && (
                        <>
                            <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-1.5 h-4 bg-sky-200/80 z-[-1] pointer-events-none"></div>
                            <div className="absolute -top-4 left-1/2 -translate-x-[90%] w-3 h-2 bg-sky-200/80 rounded-full rotate-[-30deg] z-[-1] pointer-events-none"></div>
                            <div className="absolute -top-4 left-1/2 -translate-x-[10%] w-3 h-2 bg-sky-200/80 rounded-full rotate-[30deg] z-[-1] pointer-events-none"></div>
                            <div className="absolute bottom-0 left-0 w-full h-1.5 bg-sky-600/50 pointer-events-none"></div>
                        </>
                    )}
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-7 h-7 relative z-10">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 0 0-2.456 2.456ZM16.894 20.567 16.5 21.75l-.394-1.183a2.25 2.25 0 0 0-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 0 0 1.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 0 0 1.423 1.423l1.183.394-1.183.394a2.25 2.25 0 0 0-1.423 1.423Z" />
                    </svg>
                </button>
                {/* Active Indicator */}
                <span className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-500 border-2 border-slate-100 rounded-full"></span>
            </div>
        </div>
      )}

      {/* Main Chat Window */}
      {isOpen && createPortal(
        <div className={`fixed inset-0 z-[9999] flex items-center justify-center overflow-hidden ${isFullScreen ? 'p-0' : 'sm:p-6'}`}>
            <div 
                className={`absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity duration-300 ${isClosing ? 'opacity-0' : 'opacity-100 animate-fade-in'}`}
                onClick={() => { if (window.innerWidth < 640) toggleChat() }}
            />
            
            <div 
                className={`bg-white/95 backdrop-blur-xl w-full max-w-full h-[100dvh] overflow-hidden flex relative z-10 origin-bottom-left sm:border border-white/60
                    ${isFullScreen ? 'sm:h-[100dvh] sm:max-w-full sm:rounded-none' : 'sm:h-[85vh] sm:max-w-5xl sm:rounded-3xl shadow-2xl'}
                    ${isClosing ? 'animate-scale-out' : 'animate-scale-in'}
                `}
                style={{
                    maxHeight: isFullScreen ? '100dvh' : (typeof window !== 'undefined' && window.innerWidth < 640 ? '100dvh' : '85vh'),
                    animationDuration: '0.3s'
                }}
            >
                {/* Sidebar (History) */}
                <div ref={sidebarRef} className={`absolute z-30 h-full bg-slate-50/95 backdrop-blur-md border-r border-slate-200/60 flex flex-col ease-in-out shadow-2xl sm:shadow-none ${isChatOpening ? '' : 'transition-all duration-300'}
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
                    
                    <div className="flex-1 overflow-y-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] p-3 space-y-4 w-full sm:w-72">
                        <button 
                            onClick={createNewChat}
                            className="w-full flex items-center gap-2 p-3.5 rounded-xl text-white transition-all shadow-md hover:shadow-lg hover:-translate-y-0.5 font-medium text-sm hover:brightness-110"
                            style={{ backgroundColor: THEME_COLORS.find(c => c.id === theme)?.hex || '#4f46e5' }}
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
                                                    <button onClick={(e) => confirmDeleteSession(session.id, e)} className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-colors shrink-0" title="Xóa">
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
                <div className={`flex-1 flex flex-col min-w-0 relative z-10 transition-colors duration-300 bg-slate-50`}>
                    {/* Header */}
                    <div className="flex items-center justify-between p-3 sm:p-5 border-b border-slate-100 bg-white/50 backdrop-blur-md shrink-0 relative z-20">
                        <div className="flex items-center gap-3 sm:gap-4">
                            <button 
                                id="chat-sidebar-toggle"
                                onClick={() => setShowSidebar(!showSidebar)}
                                className="sm:hidden p-2 -ml-2 text-slate-500 hover:bg-slate-100 rounded-xl transition-colors"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
                                </svg>
                            </button>
                            <button 
                                id="chat-sidebar-toggle-desktop"
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
                                    {isEditingAiName ? (
                                        <div className="flex items-center gap-2">
                                            <input 
                                                ref={aiNameInputRef}
                                                type="text" 
                                                value={aiName}
                                                onChange={(e) => setAiName(e.target.value)}
                                                onKeyDown={handleAiNameKeyDown}
                                                onBlur={handleAiNameSave}
                                                className="font-extrabold text-slate-800 text-base sm:text-lg tracking-tight bg-slate-100 border border-slate-200 rounded px-2 py-0.5 outline-none focus:ring-2 focus:ring-indigo-500 w-[180px] sm:w-[240px]"
                                            />
                                        </div>
                                    ) : (
                                        <div className="flex items-center gap-2 group/title">
                                            <h3 className="font-extrabold text-slate-800 text-base sm:text-lg tracking-tight">{aiName}</h3>
                                            <button 
                                                onClick={() => setIsEditingAiName(true)}
                                                className="p-1 text-slate-400 opacity-0 group-hover/title:opacity-100 hover:text-indigo-600 transition-all rounded hover:bg-slate-100"
                                                title="Đổi tên"
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3.5 h-3.5"><path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" /></svg>
                                            </button>
                                        </div>
                                    )}
                                    <div className="relative mt-0.5" tabIndex={0} onBlur={(e) => { if (!e.currentTarget.contains(e.relatedTarget as Node)) setIsModelSelectorOpen(false); }}>
                                        <button 
                                            onClick={() => setIsModelSelectorOpen(!isModelSelectorOpen)}
                                            className="flex items-center gap-1.5 text-[10px] sm:text-[11px] font-bold text-indigo-600 hover:text-indigo-700 bg-indigo-50/50 hover:bg-indigo-50 transition-colors border border-indigo-100/50 rounded-md px-2 py-0.5"
                                        >
                                            <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.6)] mr-0.5"></span>
                                            <span className="max-w-[120px] sm:max-w-[160px] truncate leading-none pt-0.5" title={modelOptions[currentModelIndex]?.key}>{modelOptions[currentModelIndex]?.name || 'Loading...'}</span>
                                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className={`w-3 h-3 transition-transform ${isModelSelectorOpen ? 'rotate-180' : ''}`}>
                                                <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
                                            </svg>
                                        </button>
                                        {isModelSelectorOpen && (
                                            <div className="absolute top-full left-0 mt-1 w-[200px] bg-white border border-slate-200 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.1)] rounded-xl overflow-hidden z-50 animate-fade-in-up" style={{ animationDuration: '0.2s' }}>
                                                {modelOptions.map((model, idx) => (
                                                    <button
                                                        key={model.key}
                                                        onClick={() => {
                                                            setCurrentModelIndex(idx);
                                                            currentModelIndexRef.current = idx;
                                                            activeModelRef.current = model.key;
                                                            setIsModelSelectorOpen(false);
                                                        }}
                                                        className={`w-full text-left px-3 py-2.5 text-xs transition-colors flex items-center justify-between ${idx === currentModelIndex ? 'bg-indigo-50/80 text-indigo-700 font-bold' : 'text-slate-600 hover:bg-slate-50 font-medium'}`}
                                                    >
                                                        <span className="truncate">{model.name}</span>
                                                        {idx === currentModelIndex && (
                                                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-3.5 h-3.5 text-indigo-600 shrink-0">
                                                                <path fillRule="evenodd" d="M19.916 4.626a.75.75 0 0 1 .208 1.04l-9 13.5a.75.75 0 0 1-1.154.114l-6-6a.75.75 0 0 1 1.06-1.06l5.353 5.353 8.493-12.739a.75.75 0 0 1 1.04-.208Z" clipRule="evenodd" />
                                                            </svg>
                                                        )}
                                                    </button>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className={`flex flex-row items-center sm:gap-1.5 ${showSidebar ? 'hidden sm:flex' : 'flex'}`}>
                            <button onClick={() => setIsFullScreen(!isFullScreen)} className="hidden sm:flex p-2 hover:bg-slate-100 rounded-xl text-slate-400 hover:text-indigo-600 transition-colors" title={isFullScreen ? "Thu nhỏ (Restore)" : "Phóng to (Maximize)"}>
                                {isFullScreen ? (
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M9 9V4.5M9 9H4.5M9 9 3.75 3.75M9 15v4.5M9 15H4.5M9 15l-5.25 5.25M15 9h4.5M15 9V4.5M15 9l5.25-5.25M15 15h4.5M15 15v4.5m0-4.5 5.25 5.25" /></svg>
                                ) : (
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3.75v4.5m0-4.5h4.5m-4.5 0L9 9M3.75 20.25v-4.5m0 4.5h4.5m-4.5 0L9 15M20.25 3.75h-4.5m4.5 0v4.5m0-4.5L15 9m5.25 11.25h-4.5m4.5 0v-4.5m0 4.5L15 15" /></svg>
                                )}
                            </button>
                            <button onClick={toggleChat} className="p-2 sm:p-2 hover:bg-slate-100 rounded-xl text-slate-400 hover:text-slate-600 transition-colors" title="Thu gọn widget (Minimize)">
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5 sm:w-6 sm:h-6">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 12h-15" />
                                </svg>
                            </button>
                        </div>
                    </div>

                    {/* Content: Chat Tab */}
                    <div 
                        className={`flex-1 overflow-y-auto overflow-x-hidden p-3 sm:p-6 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] space-y-6 transition-colors duration-300 ${chatMode === 'deep_translate' ? 'bg-gradient-to-b from-indigo-50/30 to-purple-50/30' : chatMode === 'writing' ? 'bg-gradient-to-b from-amber-50/30 to-orange-50/30' : 'bg-transparent'}`} 
                        ref={scrollRef}
                    >
                        {isHistoryLoading ? (
                            <div className="flex flex-col items-center justify-center h-full min-h-[200px]">
                                <div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin shadow-md mb-3"></div>
                                <p className="text-sm text-slate-500 font-medium animate-pulse">Đang tải lịch sử...</p>
                            </div>
                        ) : (
                        <>
                        {messages.map((msg) => {
                            const isMe = msg.sender === 'user';
                            
                            return (
                                <div key={msg.id} className={`flex gap-3 sm:gap-4 ${isMe ? 'justify-end' : 'justify-start w-full'}`}>
                                    <div className={`flex flex-col min-w-0 ${isMe ? 'items-end max-w-[85%] sm:max-w-[75%]' : 'items-start w-full max-w-[100%] sm:max-w-[95%]'}`}>
                                        <div className={`group relative min-w-0 ${isMe ? 'w-auto' : 'w-fit max-w-full pt-1 pb-4'}`}>
                                                                                        {(() => {
                                                const style = isMe ? appStyles.userBubble : appStyles.aiBubble;
                                                const hasImage = msg.attachmentMimeType?.startsWith('image/');
                                                const hasOtherFile = !!msg.attachmentMimeType && !hasImage;

                                                const content = isMe ? (
                                                    <div className="flex flex-col gap-2 relative z-10">
                                                        {hasImage && (
                                                            <div className="bg-white/10 p-1.5 rounded-xl border border-white/20 inline-block">
                                                                <img 
                                                                    src={`data:${msg.attachmentMimeType};base64,${msg.attachmentData}`} 
                                                                    alt="attachment" 
                                                                    className="max-w-full max-h-[250px] rounded-lg object-contain" 
                                                                />
                                                            </div>
                                                        )}
                                                        {hasOtherFile && (
                                                            <div className="flex items-center gap-2 p-2.5 rounded-xl bg-black/10 border border-black/5">
                                                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5 text-white/80 shrink-0"><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" /></svg>
                                                                <span className="text-xs font-semibold text-white truncate min-w-0">{msg.attachmentName || 'Tệp đính kèm'}</span>
                                                            </div>
                                                        )}
                                                        {msg.text && (
                                                            <div className="break-words whitespace-pre-wrap leading-relaxed font-medium">
                                                                {msg.text.startsWith('[Đã đính kèm tệp:') ? msg.text.replace(/\[Đã đính kèm tệp: .*\]\n/, '') : msg.text}
                                                            </div>
                                                        )}
                                                    </div>
                                                ) : (
                                                    <div className={`markdown-body prose prose-slate sm:prose-base max-w-3xl w-full leading-loose prose-p:mb-5 prose-li:mb-2 prose-ul:mb-5 prose-ol:mb-5 prose-pre:overflow-x-auto relative z-10 p-2 sm:p-4 rounded-xl ${
                                                        style === 'robot' ? 'prose-pre:bg-slate-900 prose-pre:text-green-400 prose-headings:text-slate-100 prose-a:text-green-500 prose-pre:border prose-pre:border-slate-700' :
                                                        style === 'alien' ? 'prose-pre:bg-lime-950 prose-pre:text-lime-400 prose-headings:text-lime-300 prose-a:text-lime-500 prose-pre:border prose-pre:border-lime-800' :
                                                        style === 'dinosaur' ? 'prose-pre:bg-emerald-900 prose-pre:text-emerald-100 prose-headings:text-emerald-800 prose-a:text-emerald-600' :
                                                        style === 'unicorn' ? 'prose-pre:bg-purple-900 prose-pre:text-purple-100 prose-headings:text-purple-900 prose-a:text-pink-600' :
                                                        style === 'ghost' ? 'prose-pre:bg-slate-800 prose-pre:text-slate-100 prose-headings:text-slate-800 prose-a:text-slate-600' :
                                                        style === 'ninja' ? 'prose-pre:bg-black prose-pre:text-slate-300 prose-headings:text-slate-100 prose-a:text-red-400' :
                                                        style === 'dragon' ? 'prose-pre:bg-red-950 prose-pre:text-orange-200 prose-headings:text-red-800 prose-a:text-red-600' :
                                                        style === 'capybara' ? 'prose-pre:bg-slate-800 prose-pre:text-slate-100 prose-headings:text-slate-800 prose-a:text-pink-600' :
                                                        style === 'fox' ? 'prose-pre:bg-orange-950 prose-pre:text-orange-200 prose-headings:text-orange-900 prose-a:text-orange-700' :
                                                        style === 'panda' ? 'prose-pre:bg-slate-900 prose-pre:text-slate-200 prose-headings:text-slate-900 prose-a:text-slate-700' :
                                                        style === 'hamster' ? 'prose-pre:bg-amber-900 prose-pre:text-amber-100 prose-headings:text-amber-900 prose-a:text-amber-700' :
                                                        style === 'owl' ? 'prose-pre:bg-amber-950 prose-pre:text-amber-100 prose-headings:text-amber-100 prose-a:text-amber-600' :
                                                        style === 'sloth' ? 'prose-pre:bg-slate-700 prose-pre:text-slate-100 prose-headings:text-slate-800 prose-a:text-slate-600' :
                                                        style === 'otter' ? 'prose-pre:bg-zinc-900 prose-pre:text-zinc-200 prose-headings:text-zinc-100 prose-a:text-zinc-400' :
                                                        style === 'turtle' ? 'prose-pre:bg-green-950 prose-pre:text-green-200 prose-headings:text-green-900 prose-a:text-green-700' :
                                                        style === 'bee' ? 'prose-pre:bg-yellow-950 prose-pre:text-yellow-200 prose-headings:text-yellow-900 prose-a:text-yellow-700' :
                                                        style === 'whale' ? 'prose-pre:bg-sky-950 prose-pre:text-sky-200 prose-headings:text-sky-100 prose-a:text-sky-300' :
                                                        style === 'octopus' ? 'prose-pre:bg-purple-950 prose-pre:text-purple-200 prose-headings:text-purple-100 prose-a:text-purple-300' :
                                                        'prose-pre:bg-slate-50 prose-pre:text-slate-800 prose-headings:text-slate-800 prose-a:text-indigo-600'
                                                    }`} id={`msg-content-${msg.id}`}>
                                                        <TypewriterMarkdown text={msg.text} timestamp={msg.timestamp} />
                                                    </div>
                                                );

                                                if (!isMe) return content;

                                                if (style === 'frog') return (
                                                    <div className="relative mt-4">
                                                        <div className="absolute -top-4 left-4 w-8 h-8 bg-[#86efac] border-[2px] border-[#4ade80] rounded-full flex justify-center items-center z-10"><div className="w-5 h-5 bg-white rounded-full flex justify-center items-center"><div className="w-2.5 h-2.5 bg-slate-900 rounded-full translate-x-[1px]"><div className="w-1 h-1 bg-white rounded-full mt-[1px] ml-[1px]"></div></div></div></div>
                                                        <div className="absolute -top-4 right-4 w-8 h-8 bg-[#86efac] border-[2px] border-[#4ade80] rounded-full flex justify-center items-center z-10"><div className="w-5 h-5 bg-white rounded-full flex justify-center items-center"><div className="w-2.5 h-2.5 bg-slate-900 rounded-full -translate-x-[1px]"><div className="w-1 h-1 bg-white rounded-full mt-[1px] ml-[1px]"></div></div></div></div>
                                                        <div className="bg-[#86efac] text-[#064e3b] font-medium border-b-[4px] border-[#4ade80] px-5 py-3 rounded-[24px] shadow-sm relative overflow-hidden">
                                                            <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 w-3/4 h-8 bg-[#bbf7d0] rounded-t-[100%] pointer-events-none"></div>
                                                            <div className="absolute top-[30%] left-[5%] w-5 h-2.5 bg-pink-400/50 rounded-full blur-[1px]"></div>
                                                            <div className="absolute top-[30%] right-[5%] w-5 h-2.5 bg-pink-400/50 rounded-full blur-[1px]"></div>
                                                            <div className="relative z-10">{content}</div>
                                                        </div>
                                                    </div>
                                                );
                                                if (style === 'cat') return (
                                                    <div className="relative mt-4">
                                                        <div className="absolute -top-4 left-4 w-0 h-0 border-l-[12px] border-r-[12px] border-b-[16px] border-transparent border-b-[#fcd34d] rotate-[-25deg] z-10"><div className="absolute -left-[4px] top-[4px] w-0 h-0 border-l-[4px] border-r-[4px] border-b-[6px] border-transparent border-b-pink-300"></div></div>
                                                        <div className="absolute -top-4 right-4 w-0 h-0 border-l-[12px] border-r-[12px] border-b-[16px] border-transparent border-b-[#fcd34d] rotate-[25deg] z-10"><div className="absolute -left-[4px] top-[4px] w-0 h-0 border-l-[4px] border-r-[4px] border-b-[6px] border-transparent border-b-pink-300"></div></div>
                                                        <div className="bg-[#fcd34d] text-slate-800 font-medium border-b-[4px] border-amber-500 px-5 py-3 rounded-[24px] shadow-sm relative overflow-hidden">
                                                            <div className="absolute top-[20%] left-[5%] w-6 h-3 bg-pink-400/40 rounded-full blur-[1px]"></div>
                                                            <div className="absolute top-[20%] right-[5%] w-6 h-3 bg-pink-400/40 rounded-full blur-[1px]"></div>
                                                            <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-4 h-3 bg-pink-300 rounded-t-full border-[1.5px] border-amber-600 border-b-0"></div>
                                                            <div className="relative z-10">{content}</div>
                                                        </div>
                                                    </div>
                                                );
                                                if (style === 'dog') return (
                                                    <div className="relative mt-3">
                                                        <div className="absolute -top-3 -left-2 w-5 h-8 bg-[#d97706] rounded-full rotate-[-45deg]"></div>
                                                        <div className="absolute -top-3 -right-2 w-5 h-8 bg-[#d97706] rounded-full rotate-[45deg]"></div>
                                                        <div className={`px-5 py-3 rounded-2xl text-[15px] shadow-sm bg-[#fbbf24] text-amber-900 border-b-4 border-amber-700`}>{content}</div>
                                                    </div>
                                                );
                                                if (style === 'penguin') return (
                                                    <div className="relative mt-4">
                                                        <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[8px] border-r-[8px] border-t-[12px] border-transparent border-t-orange-500 z-20 hover:scale-110 transition-transform origin-top"></div>
                                                        <div className="bg-slate-800 text-white font-medium border-[3px] border-slate-900 border-b-[5px] px-5 py-3 rounded-[24px] shadow-sm relative overflow-hidden z-10">
                                                            <div className="absolute inset-x-4 top-0 bottom-0 bg-white rounded-t-[100%] opacity-15 pointer-events-none"></div>
                                                            <div className="absolute top-[30%] left-[8%] w-5 h-2.5 bg-pink-400/40 rounded-full blur-[1px]"></div>
                                                            <div className="absolute top-[30%] right-[8%] w-5 h-2.5 bg-pink-400/40 rounded-full blur-[1px]"></div>
                                                            <div className="relative z-10">{content}</div>
                                                        </div>
                                                    </div>
                                                );
                                                if (style === 'bear') return (
                                                    <div className="relative mt-4">
                                                        <div className="absolute -top-3 left-4 w-7 h-7 bg-amber-700 rounded-full border-[2px] border-amber-900 z-0"><div className="absolute inset-1 bg-amber-900/40 rounded-full pointer-events-none"></div></div>
                                                        <div className="absolute -top-3 right-4 w-7 h-7 bg-amber-700 rounded-full border-[2px] border-amber-900 z-0"><div className="absolute inset-1 bg-amber-900/40 rounded-full pointer-events-none"></div></div>
                                                        <div className="bg-amber-100 text-amber-900 font-medium border-b-[4px] border-[2px] border-amber-700 px-5 py-3 rounded-[24px] shadow-sm relative overflow-hidden z-10">
                                                            <div className="absolute top-[30%] left-[8%] w-5 h-2.5 bg-pink-400/30 rounded-full blur-[1px]"></div>
                                                            <div className="absolute top-[30%] right-[8%] w-5 h-2.5 bg-pink-400/30 rounded-full blur-[1px]"></div>
                                                            <div className="relative z-10">{content}</div>
                                                        </div>
                                                    </div>
                                                );
                                                if (style === 'rabbit') return (
                                                    <div className="relative mt-6">
                                                        <div className="absolute -top-7 left-5 w-4 h-10 bg-pink-100 border-2 border-slate-200 rounded-t-full rotate-[-15deg]"></div>
                                                        <div className="absolute -top-7 right-5 w-4 h-10 bg-pink-100 border-2 border-slate-200 rounded-t-full rotate-[15deg]"></div>
                                                        <div className={`px-5 py-3 rounded-2xl text-[15px] shadow-sm bg-white text-slate-700 border-2 border-slate-200 border-b-4 border-b-slate-300`}>{content}</div>
                                                    </div>
                                                );
                                                if (style === 'koala') return (
                                                    <div className="relative mt-3">
                                                        <div className="absolute -top-2 -left-3 w-8 h-8 bg-slate-400 rounded-full"></div>
                                                        <div className="absolute -top-2 -right-3 w-8 h-8 bg-slate-400 rounded-full"></div>
                                                        <div className={`px-5 py-3 rounded-2xl text-[15px] shadow-sm bg-slate-300 text-slate-800 border-b-4 border-slate-500 z-10 relative`}>{content}</div>
                                                    </div>
                                                );
                                                if (style === 'duck') return (
                                                    <div className="relative">
                                                        <div className="absolute top-1/2 -left-4 transform -translate-y-1/2 w-6 h-4 bg-orange-400 rounded-l-full"></div>
                                                        <div className={`px-5 py-3 rounded-2xl text-[15px] shadow-sm bg-[#fef08a] text-yellow-900 border-b-4 border-yellow-500`}>{content}</div>
                                                    </div>
                                                );
                                                if (style === 'capybara') return (
                                                    <div className="relative mt-3">
                                                        <div className="absolute -top-4 left-4 w-12 h-6 bg-[#C69C6D] rounded-t-full flex items-center justify-center">
                                                            <div className="absolute top-1 left-2 w-1.5 h-1.5 bg-slate-800 rounded-full"></div>
                                                            <div className="absolute top-1 right-2 w-1.5 h-1.5 bg-slate-800 rounded-full"></div>
                                                            <div className="absolute -top-1 left-0 w-2.5 h-2.5 bg-[#a37e54] rounded-full"></div>
                                                            <div className="absolute -top-1 right-0 w-2.5 h-2.5 bg-[#a37e54] rounded-full"></div>
                                                            <div className="absolute top-2 w-2 h-1 bg-pink-300 rounded-full"></div>
                                                        </div>
                                                        <div className={`px-5 py-3 rounded-2xl text-[15px] shadow-sm bg-[#FFD6E4] text-slate-800 border-2 border-pink-200 relative`}>
                                                            <span className="absolute -left-1.5 top-2 text-xl rotate-12">💖</span>
                                                            <span className="absolute -right-2 bottom-1 text-xl -rotate-12">✨</span>
                                                            {content}
                                                        </div>
                                                    </div>
                                                );
                                                if (style === 'robot') return (
                                                    <div className="relative mt-3">
                                                        <div className="absolute -top-2 left-6 w-4 h-4 bg-slate-300 rounded-md border border-slate-400 flex items-center justify-center"><div className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse"></div></div>
                                                        <div className={`px-5 py-3 rounded-xl text-[15px] shadow-sm bg-slate-800 text-green-400 border border-slate-700 font-mono`}>{content}</div>
                                                    </div>
                                                );
                                                if (style === 'alien') return (
                                                    <div className="relative mt-3">
                                                        <div className="absolute -top-3 left-6 w-6 h-6 bg-lime-400 rounded-t-full flex items-center gap-1 justify-center"><div className="w-1.5 h-1.5 bg-black rounded-full"></div><div className="w-1.5 h-1.5 bg-black rounded-full"></div></div>
                                                        <div className={`px-5 py-3 rounded-2xl rounded-tl-none text-[15px] shadow-sm bg-lime-900 text-lime-400 border border-lime-700 font-mono`}>{content}</div>
                                                    </div>
                                                );
                                                if (style === 'dinosaur') return (
                                                    <div className="relative mt-3">
                                                        <div className="absolute -top-2 left-4 w-4 h-4 bg-emerald-600 rounded-t-md rotate-[-45deg]"></div>
                                                        <div className="absolute -top-2 left-10 w-4 h-4 bg-emerald-600 rounded-t-md rotate-[-45deg]"></div>
                                                        <div className={`px-5 py-3 rounded-xl text-[15px] shadow-sm bg-emerald-100 text-emerald-900 border-2 border-emerald-500`}>{content}</div>
                                                    </div>
                                                );
                                                if (style === 'unicorn') return (
                                                    <div className="relative mt-5">
                                                        <div className="absolute -top-5 left-6 w-0 h-0 border-l-[6px] border-r-[6px] border-b-[16px] border-transparent border-b-yellow-400"></div>
                                                        <div className={`px-5 py-3 rounded-xl text-[15px] shadow-sm bg-gradient-to-r from-pink-100 via-purple-100 to-blue-100 text-purple-900 border border-purple-200`}>{content}</div>
                                                    </div>
                                                );
                                                if (style === 'ghost') return (
                                                    <div className="relative mt-2">
                                                        <div className={`px-5 py-3 rounded-t-2xl rounded-bl-sm rounded-br-3xl text-[15px] shadow-sm bg-slate-100 text-slate-800 border border-slate-200`}>{content}</div>
                                                        <div className="absolute -bottom-3 left-4 w-3 h-3 bg-slate-100 rounded-full"></div>
                                                    </div>
                                                );
                                                if (style === 'ninja') return (
                                                    <div className="relative mt-3">
                                                        <div className="absolute -top-1 left-6 w-16 h-3 bg-red-500 transform -skew-x-12"></div>
                                                        <div className={`px-5 py-3 rounded-xl text-[15px] shadow-sm bg-slate-900 text-slate-200 border border-slate-700 z-10 relative`}>{content}</div>
                                                    </div>
                                                );
                                                if (style === 'dragon') return (
                                                    <div className="relative mt-4">
                                                        <div className="absolute -top-4 left-4 w-5 h-6 bg-red-600 rounded-t-full rotate-[-20deg]"></div>
                                                        <div className="absolute -top-4 left-8 w-5 h-6 bg-red-600 rounded-t-full rotate-[20deg]"></div>
                                                        <div className={`px-5 py-3 rounded-xl text-[15px] shadow-sm bg-orange-100 text-red-900 border-2 border-red-500 z-10 relative`}>{content}</div>
                                                    </div>
                                                );
                                                if (style === 'fox') return (
                                                    <div className="relative mt-3">
                                                        <div className="absolute -top-3 -left-1 w-0 h-0 border-l-[6px] border-r-[6px] border-b-[12px] border-transparent border-b-orange-600 rotate-[-25deg]"></div>
                                                        <div className="absolute -top-3 -right-1 w-0 h-0 border-l-[6px] border-r-[6px] border-b-[12px] border-transparent border-b-orange-600 rotate-[25deg]"></div>
                                                        <div className={`px-5 py-3 rounded-[14px] text-[15px] shadow-sm bg-orange-500 text-white border-b-4 border-orange-700 z-10 relative`}>{content}</div>
                                                    </div>
                                                );
                                                if (style === 'panda') return (
                                                    <div className="relative mt-4">
                                                        <div className="absolute -top-4 left-3 w-7 h-6 bg-zinc-800 rounded-full rotate-[-25deg] border-[2px] border-zinc-900 shadow-sm z-0"></div>
                                                        <div className="absolute -top-4 right-3 w-7 h-6 bg-zinc-800 rounded-full rotate-[25deg] border-[2px] border-zinc-900 shadow-sm z-0"></div>
                                                        <div className="bg-white text-slate-800 font-medium border-[3px] border-zinc-800 border-b-[5px] px-5 py-3 rounded-[24px] shadow-sm relative overflow-hidden z-10">
                                                            <div className="absolute top-[30%] left-[8%] w-5 h-2.5 bg-pink-300/40 rounded-full blur-[1px]"></div>
                                                            <div className="absolute top-[30%] right-[8%] w-5 h-2.5 bg-pink-300/40 rounded-full blur-[1px]"></div>
                                                            <div className="relative z-10">{content}</div>
                                                        </div>
                                                    </div>
                                                );
                                                if (style === 'hamster') return (
                                                    <div className="relative mt-3">
                                                        <div className="absolute -top-3 left-2 w-5 h-5 bg-amber-200 rounded-full"></div>
                                                        <div className="absolute -top-3 right-2 w-5 h-5 bg-amber-200 rounded-full"></div>
                                                        <div className={`px-5 py-3 rounded-3xl text-[15px] shadow-sm bg-amber-100 text-amber-900 border-2 border-amber-300 z-10 relative`}>{content}</div>
                                                    </div>
                                                );
                                                if (style === 'owl') return (
                                                    <div className="relative mt-3">
                                                        <div className="absolute -top-3 left-2 w-0 h-0 border-l-[6px] border-r-[6px] border-b-[10px] border-transparent border-b-[#451a03]"></div>
                                                        <div className="absolute -top-3 right-2 w-0 h-0 border-l-[6px] border-r-[6px] border-b-[10px] border-transparent border-b-[#451a03]"></div>
                                                        <div className={`px-5 py-3 rounded-[14px] text-[15px] shadow-sm bg-[#78350f] text-[#fef3c7] border-b-4 border-[#451a03] z-10 relative`}>{content}</div>
                                                    </div>
                                                );
                                                if (style === 'sloth') return (
                                                    <div className="relative mt-3">
                                                        <div className="absolute -top-2 left-3 w-10 h-6 bg-[#a1a1aa] rounded-t-full"></div>
                                                        <div className={`px-5 py-3 rounded-2xl text-[15px] shadow-sm bg-[#d4d4d8] text-slate-800 border-b-4 border-[#a1a1aa] z-10 relative`}>{content}</div>
                                                    </div>
                                                );
                                                if (style === 'otter') return (
                                                    <div className="relative mt-3">
                                                        <div className="absolute -top-3 left-2 w-4 h-4 bg-[#52525b] rounded-full"></div>
                                                        <div className="absolute -top-3 right-2 w-4 h-4 bg-[#52525b] rounded-full"></div>
                                                        <div className={`px-5 py-3 rounded-[16px] text-[15px] shadow-sm bg-[#71717a] text-white border-b-4 border-[#3f3f46] z-10 relative`}>{content}</div>
                                                    </div>
                                                );
                                                if (style === 'turtle') return (
                                                    <div className="relative mt-3">
                                                        <div className="absolute -top-2 left-6 w-6 h-6 bg-[#166534] rounded-t-full"></div>
                                                        <div className={`px-5 py-3 rounded-[16px] text-[15px] shadow-sm bg-[#22c55e] text-[#14532d] border-4 border-[#16a34a] z-10 relative`}>{content}</div>
                                                    </div>
                                                );
                                                if (style === 'bee') return (
                                                    <div className="relative mt-3">
                                                        <div className="absolute -top-4 left-4 w-2 h-4 bg-slate-900 rounded-full rotate-[-30deg]"></div>
                                                        <div className="absolute -top-4 right-4 w-2 h-4 bg-slate-900 rounded-full rotate-[30deg]"></div>
                                                        <div className={`px-5 py-3 rounded-2xl text-[15px] shadow-sm bg-[#fde047] text-slate-900 border-4 border-[#eab308] border-dashed z-10 relative`}>{content}</div>
                                                    </div>
                                                );
                                                if (style === 'whale') return (
                                                    <div className="relative mt-4">
                                                        <div className="absolute -top-5 left-8 w-1 h-5 bg-sky-200"></div>
                                                        <div className="absolute -top-5 left-5 w-1 h-4 bg-sky-300 rotate-[-30deg]"></div>
                                                        <div className="absolute -top-5 left-11 w-1 h-4 bg-sky-300 rotate-[30deg]"></div>
                                                        <div className={`px-5 py-3 rounded-[20px] text-[15px] shadow-sm bg-[#0ea5e9] text-white border-b-4 border-[#0284c7] z-10 relative`}>{content}</div>
                                                    </div>
                                                );
                                                if (style === 'octopus') return (
                                                    <div className="relative mt-2">
                                                        <div className={`px-5 py-3 rounded-t-[20px] text-[15px] shadow-sm bg-[#c084fc] text-white border border-[#a855f7] z-10 relative`}>{content}</div>
                                                        <div className="flex gap-2 justify-center mt-[-1px]">
                                                            <div className="w-3 h-5 bg-[#c084fc] rounded-b-full"></div>
                                                            <div className="w-3 h-4 bg-[#c084fc] rounded-b-full"></div>
                                                            <div className="w-3 h-5 bg-[#c084fc] rounded-b-full"></div>
                                                        </div>
                                                    </div>
                                                );

                                                return (
                                                    <div className={`px-4 py-2 rounded-[28px] text-[15px] shadow-sm transition-colors duration-300 ${
                                                        isMe 
                                                            ? (chatMode === 'deep_translate' ? 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-br-[10px] shadow-md' : 'bg-indigo-600 text-white rounded-br-[10px]')
                                                            : (chatMode === 'deep_translate' ? 'bg-white text-slate-800 rounded-bl-[10px] border border-purple-100 shadow-[0_4px_20px_-4px_rgba(168,85,247,0.1)]' : 'bg-white text-slate-800 rounded-bl-[10px] border border-slate-200/60 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)]')
                                                    }`}>
                                                        {content}
                                                    </div>
                                                );
                                            })()}
                                            {!isMe && msg.text && (
                                                <button
                                                    onClick={() => handleCopy(msg.text, msg.id)}
                                                    className="absolute -bottom-1 right-1 p-1.5 bg-white/70 backdrop-blur-sm text-slate-400 hover:text-indigo-600 hover:bg-slate-100 rounded-lg opacity-0 group-hover:opacity-100 transition-all shadow-sm border border-slate-200/50 hover:border-slate-300 z-20"
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
                            <div className="flex gap-3 sm:gap-4 justify-start w-full">
                                <div className="w-full flex flex-col items-start animate-fade-in-up mt-1 px-2 sm:px-4 max-w-3xl" style={{ animationDuration: '0.3s' }}>
                                    <div className="py-2 flex items-center gap-2">
                                        <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0ms', animationDuration: '1.5s' }}></span>
                                        <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '300ms', animationDuration: '1.5s' }}></span>
                                        <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '600ms', animationDuration: '1.5s' }}></span>
                                    </div>
                                </div>
                            </div>
                        )}
                        </>
                        )}
                    </div>

                    <div className="p-3 sm:p-5 z-20 bg-white border-t border-slate-200/60 shadow-[0_-12px_24px_-12px_rgba(0,0,0,0.1)] relative shrink-0">
                        {/* Mode Toggle */}
                        <div className="flex items-center justify-between gap-1 sm:gap-2 mb-3 max-w-4xl mx-auto w-full relative z-20">
                            <div className="flex items-center gap-1 sm:gap-2">
                                <div className="flex items-center gap-1.5">
                                    <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider hidden sm:inline">Chế độ:</span>
                                    <div className="relative">
                                        <button 
                                            type="button" 
                                            onClick={() => setShowModeGuide(true)} 
                                            className="text-slate-400 hover:text-indigo-500 transition-colors p-1" 
                                            title="Hướng dẫn chế độ"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="m11.25 11.25.041-.02a.75.75 0 0 1 1.063.852l-.708 2.836a.75.75 0 0 0 1.063.853l.041-.021M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9-3.75h.008v.008H12V8.25Z" /></svg>
                                        </button>
                                    </div>
                                </div>
                                <div className="flex relative bg-slate-100/80 p-1 rounded-xl ring-1 ring-slate-200/50 w-[240px] sm:w-[300px]">
                                    <div 
                                        className={`absolute inset-y-1 left-1 w-[calc(33.333%-4px)] rounded-lg transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]
                                            ${chatMode === 'normal' 
                                                ? 'translate-x-0 bg-white shadow-[0_2px_8px_-2px_rgba(79,70,229,0.15)] ring-1 ring-indigo-100' 
                                                : chatMode === 'deep_translate'
                                                ? 'translate-x-[102%] bg-gradient-to-r from-indigo-500 to-purple-500 shadow-[0_2px_10px_-2px_rgba(99,102,241,0.4)] ring-1 ring-indigo-500/50'
                                                : 'translate-x-[208%] bg-gradient-to-r from-amber-500 to-orange-500 shadow-[0_2px_10px_-2px_rgba(245,158,11,0.4)] ring-1 ring-amber-500/50'
                                            }`}
                                    />
                                    <button 
                                        type="button"
                                        onClick={() => setChatMode('normal')}
                                        className={`relative z-10 w-1/3 flex justify-center items-center gap-1.5 px-1 py-1 text-[11px] font-semibold rounded-lg transition-colors duration-300 ${chatMode === 'normal' ? 'text-indigo-600' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'}`}
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3.5 h-3.5 shrink-0"><path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H8.25m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H12m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 0 1-2.555-.337A5.972 5.972 0 0 1 5.41 20.97a5.969 5.969 0 0 1-.474-.065 4.48 4.48 0 0 0 .978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25Z" /></svg>
                                        <span className="truncate">Đa dụng</span>
                                    </button>
                                    <button 
                                        type="button"
                                        onClick={() => setChatMode('deep_translate')}
                                        className={`relative z-10 w-1/3 flex justify-center items-center gap-1.5 px-1 py-1 text-[11px] font-semibold rounded-lg transition-colors duration-300 ${chatMode === 'deep_translate' ? 'text-white' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'}`}
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3.5 h-3.5 shrink-0"><path strokeLinecap="round" strokeLinejoin="round" d="m10.5 21 5.25-11.25L21 21m-9-3h7.5M3 5.621a48.474 48.474 0 0 1 6-.371m0 0c1.12 0 2.233.038 3.334.114M9 5.25V3m3.334 2.364C11.176 10.658 7.69 15.08 3 17.502m9.334-12.138c.896.061 1.785.147 2.666.257m-4.589 8.495a18.023 18.023 0 0 1-3.827-5.802" /></svg>
                                        <span className="truncate">Dịch thuật</span>
                                    </button>
                                    <button 
                                        type="button"
                                        onClick={() => setChatMode('writing')}
                                        className={`relative z-10 w-1/3 flex justify-center items-center gap-1.5 px-1 py-1 text-[11px] font-semibold rounded-lg transition-colors duration-300 ${chatMode === 'writing' ? 'text-white' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'}`}
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3.5 h-3.5 shrink-0"><path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" /></svg>
                                        <span className="truncate">Viết bài</span>
                                    </button>
                                </div>
                            </div>
                            <div className="relative">
                                <button
                                    type="button"
                                    onClick={() => showPrompts ? closePrompts() : setShowPrompts(true)}
                                    className={`flex items-center gap-1.5 px-2 sm:px-4 py-1.5 text-xs font-bold rounded-xl transition-all shadow-sm border border-transparent bg-clip-padding relative before:absolute before:inset-0 before:-z-10 before:rounded-xl before:bg-gradient-to-r before:from-indigo-400 before:to-purple-400 before:-m-[1.5px] shrink-0 ${showPrompts ? 'bg-indigo-50 text-indigo-700' : 'bg-white text-indigo-600 hover:bg-slate-50'}`}
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M12 18v-5.25m0 0a6.01 6.01 0 001.5-.189m-1.5.189a6.01 6.01 0 01-1.5-.189m3.75 7.478a12.06 12.06 0 01-4.5 0m3.75 2.383a14.406 14.406 0 01-3 0M14.25 18v-.192c0-.983.658-1.821 1.508-2.363A5.965 5.965 0 0018 11.25c0-3.313-2.687-6-6-6s-6 2.687-6 6c0 1.616.7 3.128 1.842 4.145.85.742 1.508 1.58 1.508 2.363v.192" /></svg>
                                    <span className="hidden sm:inline">Prompt thường dùng</span>
                                </button>
                                {showPrompts && (
                                    <>
                                        <div className="fixed inset-0 z-40" onClick={closePrompts}></div>
                                        <div className={`absolute right-0 bottom-full mb-3 w-[320px] sm:w-[480px] max-w-[calc(100vw-24px)] bg-white rounded-2xl shadow-[0_12px_40px_-10px_rgba(79,70,229,0.2)] border border-indigo-100 overflow-hidden z-50 transition-all duration-300 origin-bottom-right ${isClosingPrompts ? 'opacity-0 scale-95 translate-y-2' : 'opacity-100 scale-100 translate-y-0 animate-fade-in-up'}`}>
                                            <div className="px-4 py-3 border-b border-slate-100 bg-gradient-to-r from-indigo-50/50 to-purple-50/50 flex justify-between items-center">
                                                <h4 className="text-sm font-bold text-indigo-900 tracking-tight flex items-center gap-2">
                                                    <span className="p-1 bg-indigo-100 text-indigo-600 rounded-md">
                                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3.5 h-3.5"><path strokeLinecap="round" strokeLinejoin="round" d="M12 18v-5.25m0 0a6.01 6.01 0 001.5-.189m-1.5.189a6.01 6.01 0 01-1.5-.189m3.75 7.478a12.06 12.06 0 01-4.5 0m3.75 2.383a14.406 14.406 0 01-3 0M14.25 18v-.192c0-.983.658-1.821 1.508-2.363A5.965 5.965 0 0018 11.25c0-3.313-2.687-6-6-6s-6 2.687-6 6c0 1.616.7 3.128 1.842 4.145.85.742 1.508 1.58 1.508 2.363v.192" /></svg>
                                                    </span>
                                                    Gợi ý Prompt mẫu
                                                </h4>
                                                <button type="button" onClick={closePrompts} className="text-slate-400 hover:text-indigo-600 p-1.5 rounded-lg hover:bg-white/60 transition-colors">
                                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" /></svg>
                                                </button>
                                            </div>
                                            <div className="max-h-72 overflow-y-auto p-2 space-y-1">
                                                {COMMON_PROMPTS.map((prompt, idx) => (
                                                    <button
                                                        type="button"
                                                        key={idx}
                                                        onClick={() => {
                                                            setNewMessage(prompt);
                                                            closePrompts();
                                                        }}
                                                        className="w-full text-left px-3 py-2.5 text-sm text-slate-700 bg-transparent hover:bg-indigo-50 border border-transparent hover:border-indigo-100 rounded-xl transition-all hover:text-indigo-700 group flex justify-between items-center gap-3"
                                                    >
                                                        <span className="line-clamp-2 leading-relaxed flex-1">{prompt}</span>
                                                        <span className="shrink-0 text-[11px] font-bold text-white bg-indigo-500 px-2.5 py-1 rounded-md opacity-0 scale-95 group-hover:opacity-100 group-hover:scale-100 transition-all shadow-sm">Sử dụng</span>
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>
                        <form onSubmit={handleSendMessage} className="flex flex-col gap-2 max-w-4xl mx-auto relative">
                            {attachment && (
                                <div className="flex flex-col animate-fade-in-up">
                                    <div className="flex items-center gap-3 bg-white border border-slate-200 shadow-sm p-2 pr-3 rounded-2xl w-max max-w-[85%] relative group">
                                        <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-500 shrink-0">
                                            {attachment.mimeType.includes('image') ? (
                                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 0 0 1.5-1.5V6a1.5 1.5 0 0 0-1.5-1.5H3.75A1.5 1.5 0 0 0 2.25 6v12a1.5 1.5 0 0 0 1.5 1.5Zm10.5-11.25h.008v.008h-.008V8.25Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" /></svg>
                                            ) : (
                                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" /></svg>
                                            )}
                                        </div>
                                        <div className="flex flex-col min-w-0 pr-4">
                                            <span className="text-sm font-bold text-slate-700 truncate">{attachment.name}</span>
                                            <span className="text-[11px] text-slate-400 font-medium tracking-wide">Tệp đính kèm</span>
                                        </div>
                                        <button 
                                            type="button" 
                                            onClick={() => setAttachment(null)} 
                                            className="absolute -top-2 -right-2 w-6 h-6 bg-slate-100 hover:bg-slate-200 flex items-center justify-center rounded-full text-slate-500 hover:text-slate-700 transition-colors shadow-sm ring-2 ring-white"
                                            title="Xóa tệp"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-3.5 h-3.5"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" /></svg>
                                        </button>
                                    </div>
                                </div>
                            )}
                            <div className="flex items-center gap-1.5 sm:gap-2">
                                <div className={`flex items-center gap-1.5 overflow-hidden transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] ${!showMobileActions ? 'max-w-0 opacity-0 sm:max-w-none sm:opacity-100' : 'max-w-[200px] sm:max-w-none opacity-100 mr-1.5 sm:mr-0'}`}>
                                    <input type="file" ref={chatImageInputRef} onChange={handleFileSelect} className="hidden" accept="image/*" />
                                    <button
                                        type="button"
                                        onClick={() => chatImageInputRef.current?.click()}
                                        className="p-2.5 sm:p-3 rounded-xl transition-colors border shrink-0 bg-slate-50 text-slate-500 hover:bg-slate-100 hover:text-indigo-600 border-slate-200"
                                        title="Chèn ảnh"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 0 0 1.5-1.5V6a1.5 1.5 0 0 0-1.5-1.5H3.75A1.5 1.5 0 0 0 2.25 6v12a1.5 1.5 0 0 0 1.5 1.5Zm10.5-11.25h.008v.008h-.008V8.25Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" />
                                        </svg>
                                    </button>
                                    <input type="file" ref={chatFileInputRef} onChange={handleFileSelect} className="hidden" accept=".pdf,.doc,.docx" />
                                    <button
                                        type="button"
                                        onClick={() => chatFileInputRef.current?.click()}
                                        className="p-2.5 sm:p-3 rounded-xl transition-colors border shrink-0 bg-slate-50 text-slate-500 hover:bg-slate-100 hover:text-indigo-600 border-slate-200"
                                        title="Đính kèm tệp"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="m18.375 12.739-7.693 7.693a4.5 4.5 0 0 1-6.364-6.364l10.94-10.94A3 3 0 1 1 19.5 7.372L8.552 18.32m.009-.01-.01.01m5.699-9.941-7.81 7.81a1.5 1.5 0 0 0 2.112 2.13" />
                                        </svg>
                                    </button>

                                    <button 
                                        type="button"
                                        onMouseDown={handleMicTouchStart}
                                        onMouseUp={stopRecording}
                                        onMouseLeave={stopRecording}
                                        onTouchStart={handleMicTouchStart}
                                        onTouchEnd={stopRecording}
                                        onContextMenu={(e) => e.preventDefault()}
                                        className={`p-2.5 sm:p-3 rounded-xl transition-colors border shrink-0 select-none
                                            ${isRecording ? 'bg-rose-100 text-rose-600 border-rose-200' : 'bg-slate-50 text-slate-500 hover:bg-slate-100 hover:text-indigo-600 border-slate-200'}
                                        `}
                                        title="Nhấn giữ để nói"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5 pointer-events-none">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 0 0 6-6v-1.5m-6 7.5a6 6 0 0 1-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 0 1-3-3V4.5a3 3 0 1 1 6 0v8.25a3 3 0 0 1-3 3Z" />
                                        </svg>
                                    </button>
                                </div>

                                {!showMobileActions && (
                                    <button
                                        type="button"
                                        onClick={() => setShowMobileActions(true)}
                                        className="p-2.5 sm:hidden mr-1.5 rounded-xl transition-colors border shrink-0 bg-indigo-50 text-indigo-600 hover:bg-indigo-100 border-indigo-200 shadow-sm animate-fade-in-up"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
                                        </svg>
                                    </button>
                                )}

                                {isRecording ? (
                                    <div 
                                        className="flex-1 bg-gradient-to-r from-rose-50 to-pink-50 border border-rose-200 px-3 sm:px-4 py-2.5 sm:py-3 rounded-xl flex items-center justify-between gap-2 sm:gap-4 shadow-inner min-w-0 relative overflow-hidden select-none"
                                        onTouchMove={handleMicTouchMove}
                                    >
                                        <div 
                                            className="flex items-center gap-2 sm:gap-3 w-full"
                                            style={{ transform: `translateX(${recordingOffset}px)`, transition: recordingOffset === 0 ? 'transform 0.2s' : 'none' }}
                                        >
                                            <style>{`
                                                @keyframes sound-wave {
                                                    0%, 100% { height: 6px; }
                                                    50% { height: 24px; }
                                                }
                                            `}</style>
                                            <div className="flex items-center gap-1.5 h-6">
                                                <div className="w-1.5 bg-rose-500 rounded-full" style={{ animation: 'sound-wave 1.2s ease-in-out infinite 0s' }}></div>
                                                <div className="w-1.5 bg-rose-500 rounded-full" style={{ animation: 'sound-wave 1.2s ease-in-out infinite 0.2s' }}></div>
                                                <div className="w-1.5 bg-rose-500 rounded-full" style={{ animation: 'sound-wave 1.2s ease-in-out infinite 0.4s' }}></div>
                                                <div className="w-1.5 bg-rose-500 rounded-full" style={{ animation: 'sound-wave 1.2s ease-in-out infinite 0.1s' }}></div>
                                                <div className="w-1.5 bg-rose-500 rounded-full" style={{ animation: 'sound-wave 1.2s ease-in-out infinite 0.3s' }}></div>
                                            </div>
                                            <span className="text-rose-600 font-semibold text-[14px] sm:text-[15px] animate-pulse truncate flex-1 text-center sm:text-left">
                                                <span className="hidden sm:inline">Đang thu âm thanh... thả tay để gửi</span>
                                                <span className="sm:hidden">Vuốt trái để hủy</span>
                                            </span>
                                        </div>
                                        <button 
                                            type="button"
                                            onClick={cancelRecording}
                                            className="hidden sm:flex shrink-0 p-1.5 text-rose-400 hover:text-rose-600 hover:bg-rose-100 rounded-lg transition-colors absolute right-2 z-10"
                                            title="Hủy ghi âm"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                                            </svg>
                                        </button>
                                    </div>
                                ) : (
                                    <input 
                                        type="text" 
                                        inputMode="text" 
                                        role="presentation" 
                                        autoComplete="off" 
                                        spellCheck="false" 
                                        autoCorrect="off" 
                                        autoCapitalize="sentences" 
                                        name="chat_message_input_random" 
                                        data-1p-ignore="true" 
                                        data-lpignore="true" 
                                        data-form-type="other"
                                        value={newMessage}
                                        onChange={(e) => setNewMessage(e.target.value)}
                                        onFocus={() => { if (window.innerWidth < 640) setShowMobileActions(false) }}
                                        onPaste={handlePaste}
                                        placeholder="Hỏi AI bất cứ điều gì..." 
                                        className={`flex-1 outline-none px-3 sm:px-4 py-2.5 sm:py-3 rounded-xl text-[14px] sm:text-[15px] font-medium transition-all text-slate-800 focus:ring-4 min-w-0 border ${
                                            chatMode === 'deep_translate' 
                                                ? 'bg-white border-transparent shadow-[0_0_20px_rgba(168,85,247,0.4)] ring-2 ring-purple-300/80 focus:ring-purple-400/50 placeholder:text-purple-300' 
                                                : chatMode === 'writing'
                                                ? 'bg-white border-transparent shadow-[0_0_20px_rgba(245,158,11,0.4)] ring-2 ring-orange-300/80 focus:ring-orange-400/50 placeholder:text-orange-300'
                                                : 'bg-slate-50 border-slate-200 focus:ring-indigo-50 focus:border-indigo-300 placeholder:text-slate-400 shadow-inner'
                                        }`}
                                        disabled={isLoading}
                                    />
                                )}
                                
                                <button 
                                    type="submit" 
                                    disabled={(!newMessage.trim() && !attachment) || isLoading}
                                    className={`p-2.5 sm:p-3 rounded-xl shadow-md transition-all active:scale-95 flex items-center justify-center shrink-0
                                        ${(newMessage.trim() || attachment) && !isLoading ? 'bg-indigo-600 text-white hover:bg-indigo-700 hover:shadow-lg hover:-translate-y-0.5' : 'bg-slate-100 text-slate-400 cursor-not-allowed'}
                                    `}
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                                        <path d="M3.478 2.404a.75.75 0 0 0-.926.941l2.432 7.905H13.5a.75.75 0 0 1 0 1.5H4.984l-2.432 7.905a.75.75 0 0 0 .926.94 60.519 60.519 0 0 0 18.445-8.986.75.75 0 0 0 0-1.218A60.517 60.517 0 0 0 3.478 2.404Z" />
                                    </svg>
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
            
            {/* Mode Guide Modal */}
            {showModeGuide && (
                <div className={`fixed inset-0 z-[60] flex items-center justify-center p-4 transition-opacity duration-200 ${isClosingModeGuide ? 'opacity-0' : 'opacity-100'}`} onClick={handleCloseModeGuide}>
                    <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"></div>
                    <div className={`bg-white rounded-2xl shadow-xl w-full max-w-lg sm:max-w-2xl lg:max-w-3xl flex flex-col max-h-[90vh] relative z-10 m-4 ${isClosingModeGuide ? 'animate-scale-out' : 'animate-scale-in'}`} onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-slate-100 shrink-0">
                            <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5 text-indigo-500">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="m11.25 11.25.041-.02a.75.75 0 0 1 1.063.852l-.708 2.836a.75.75 0 0 0 1.063.853l.041-.021M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9-3.75h.008v.008H12V8.25Z" />
                                </svg>
                                Hướng dẫn chế độ chat
                            </h3>
                            <button onClick={handleCloseModeGuide} className="text-slate-400 hover:text-slate-600 bg-slate-50 hover:bg-slate-100 p-1.5 rounded-full transition-colors">
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" /></svg>
                            </button>
                        </div>
                        
                        <div className="p-4 sm:p-6 overflow-y-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none]">
                            <div className="space-y-4 text-sm text-slate-600">
                                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                                    <div className="font-semibold text-slate-800 mb-1 flex items-center gap-1.5">
                                        <span className="w-2 h-2 rounded-full bg-slate-400"></span>
                                        Chế độ "Đa dụng"
                                    </div>
                                    <p>Sử dụng cho hệ thống hỏi đáp, làm việc thông thường. Trợ lý AI sẽ xưng hô thân thiện "em-chị".</p>
                                    <div className="mt-3 bg-white p-3 rounded-lg border border-slate-200">
                                        <p className="font-semibold text-[13px] text-slate-700 mb-1">💡 Mẹo prompt hiệu quả:</p>
                                        <ul className="list-disc pl-4 text-[13px] space-y-1 text-slate-500">
                                            <li>Viết rõ bối cảnh (vd: <i>"Viết email từ chối ứng viên tế nhị, do họ thiếu kinh nghiệm quản lý"</i>)</li>
                                            <li>Yêu cầu định dạng (vd: <i>"Hãy trình bày dưới dạng gạch đầu dòng ngắn gọn"</i>)</li>
                                        </ul>
                                    </div>
                                </div>
                                
                                <div className="bg-indigo-50 p-4 rounded-xl border border-indigo-100">
                                    <div className="font-semibold text-indigo-700 mb-1 flex items-center gap-1.5">
                                        <span className="w-2 h-2 rounded-full bg-indigo-500"></span>
                                        Chế độ "Dịch thuật"
                                    </div>
                                    <p>Tối ưu hóa để dịch văn bản chuyên ngành nhân sự, khử xưng hô không phù hợp, giữ nguyên văn phong chuyên nghiệp khi giao tiếp với <strong>Ứng viên</strong> hoặc <strong>Khách hàng/Đối tác nước ngoài</strong>.</p>
                                    <div className="mt-3 bg-white/60 p-3 rounded-lg border border-indigo-100">
                                        <p className="font-semibold text-[13px] text-indigo-800 mb-1">💡 Hướng dẫn sử dụng hiệu quả:</p>
                                        <ul className="list-disc pl-4 text-[13px] space-y-1 text-indigo-700/80">
                                            <li>Chỉ cần <strong>dán văn bản</strong> cần dịch (Tiếng Việt, Anh, Trung, Nhật, Hàn...), AI sẽ tự động nhận diện ngôn ngữ và dịch qua lại một cách tự nhiên.</li>
                                            <li>Để độ chính xác cao hơn, dán JD (Job Description) vào trước để AI học ngữ cảnh trước khi dịch.</li>
                                        </ul>
                                    </div>
                                    <p className="mt-2 text-xs italic text-indigo-600 font-medium">Lưu ý: Chế độ này tập trung 100% vào việc dịch, AI sẽ không tự ý thêm các câu dư thừa như "Dưới đây là phần dịch của em:".</p>
                                </div>

                                <div className="bg-amber-50 p-4 rounded-xl border border-amber-100">
                                    <div className="font-semibold text-amber-700 mb-1 flex items-center gap-1.5">
                                        <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                                        Chế độ "Viết bài"
                                    </div>
                                    <p>Tối ưu hóa để viết post tuyển dụng đăng Facebook, Threads, content ngắn gọn, thu hút, chuẩn cấu trúc.</p>
                                    <div className="mt-3 bg-white/60 p-3 rounded-lg border border-amber-100">
                                        <p className="font-semibold text-[13px] text-amber-800 mb-1">💡 Mẹo prompt hiệu quả:</p>
                                        <ul className="list-disc pl-4 text-[13px] space-y-1 text-amber-700/80">
                                            <li>Chỉ cần dán <strong>JD (Mô tả công việc)</strong> hoặc thông tin ngắn gọn, AI sẽ tự động phân tích và tạo bài hoàn chỉnh.</li>
                                            <li>Yêu cầu thêm (vd: <i>"Thêm câu call-to-action hài hước"</i>).</li>
                                        </ul>
                                    </div>
                                </div>
                            </div>
                            
                            <div className="mt-6 flex justify-end">
                                <button 
                                    onClick={handleCloseModeGuide}
                                    className="px-5 py-2.5 rounded-xl font-medium text-white bg-indigo-600 hover:bg-indigo-700 shadow-sm shadow-indigo-200 transition-all active:scale-95"
                                >
                                    Đã hiểu
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
            
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
        </div>,
        document.body
      )}
    </>
  );
};
