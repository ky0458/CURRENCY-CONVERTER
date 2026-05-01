import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';

export interface UpdateFeature {
    color: string;
    title: string;
    description: string;
}

export interface UpdateVersionData {
    id: string;
    versionNumber: string;
    updateName: string;
    dateStr: string;
    features: UpdateFeature[];
    timestamp: number;
}

interface UpdateNotificationsProps {
    hasBackground?: boolean;
}

const FALLBACK_UPDATES: UpdateVersionData[] = [
    {
        id: 'v109',
        versionNumber: 'v1.0.9',
        updateName: 'Tối ưu TakeNote & Tính năng Đọc CV',
        dateStr: '01/05/2026 - 04:00',
        timestamp: new Date('2026-05-01T04:00:00').getTime(),
        features: [
            {
                color: 'emerald',
                title: 'Tính năng Đọc & Phân tích CV nâng cao',
                description: 'Hỗ trợ tải lên và phân tích cùng lúc tới 5 CV. Tính năng tự động so sánh hàng loạt và đưa ra đánh giá, xếp hạng ứng viên chi tiết dựa trên Job Description (JD).',
            },
            {
                color: 'indigo',
                title: 'Tối ưu TakeNote',
                description: 'Cải tiến hiệu suất và trải nghiệm của tính năng TakeNote, giúp ghi chú mượt mà và trực quan hơn.',
            }
        ]
    },
    {
        id: 'v108',
        versionNumber: 'v1.0.8',
        updateName: 'Cải tiến Profile & Thông báo',
        dateStr: '29/04/2026 - 23:25',
        timestamp: Date.now(),
        features: [
            {
                color: 'emerald',
                title: 'Cập nhật Hệ thống Thông báo',
                description: 'Ra mắt tính năng chuông thông báo mới. Bạn có thể xem và tra cứu lại các bản cập nhật.',
            },
            {
                color: 'blue',
                title: 'Cải tiến Profile',
                description: 'Thay đổi hệ thống avatar, tinh gọn menu chọn ảnh, cho phép cá nhân hóa tốt hơn với ảnh tự tải lên.',
            }
        ]
    },
    {
        id: 'v107',
        versionNumber: 'v1.0.7',
        updateName: 'Bản cập nhật lớn tháng 4',
        dateStr: '29/04/2026 - 00:06',
        timestamp: Date.now() - 86400000,
        features: [
            {
                color: 'emerald',
                title: 'Đồng Bộ Dữ Liệu Đám Mây Đa Nền Tảng',
                description: 'Giờ đây toàn bộ lịch sử <b>Trợ lý AI, Ghi chú, Lịch sử</b> đã được sao lưu an toàn! Đăng nhập bằng Google để <b>trải nghiệm liền mạch</b> trên tất cả thiết bị của bạn.',
            },
            {
                color: 'indigo',
                title: 'Tối ưu Không gian Hiển thị Chat AI',
                description: 'Bong bóng chat của AI đã được loại bỏ, giúp văn bản phản hồi rộng rãi và liền mạch hơn.',
            },
            {
                color: 'blue',
                title: 'Cập nhật Prompt Thường dùng',
                description: 'Cấu trúc lại bộ prompt mẫu. Bổ sung các dặn dò nâng cao cho "Chế độ Viết bài".',
            },
            {
                color: 'purple',
                title: 'Đồng bộ Theme Hiển thị',
                description: 'Nút "Cuộc trò chuyện mới" của khu vực Chat AI đã được đồng bộ để thay đổi màu sắc dựa theo Theme.',
            },
            {
                color: 'orange',
                title: 'Nâng cấp Theme Tùy chỉnh Cao cấp',
                description: 'Khám phá sự lột xác với các theme chủ đề mới! Các Theme trên thanh tiêu đề và nút bấm không chỉ đổi màu sắc như trước, mà nay được nâng cấp với các chi tiết trang trí đặc trưng.',
            },
            {
                color: 'pink',
                title: 'Nâng cấp mạnh mẽ tính năng Che CV',
                description: 'Tính năng che thủ công đã được bổ sung thêm nút <strong>Hoàn tác</strong>, giúp bạn quay lại thao tác trước đó một cách dễ dàng.',
            }
        ]
    }
];

export const UpdateNotifications: React.FC<UpdateNotificationsProps> = ({ hasBackground = false }) => {
    const [updates, setUpdates] = useState<UpdateVersionData[]>([]);
    const [isOpen, setIsOpen] = useState(false);
    const [selectedUpdate, setSelectedUpdate] = useState<UpdateVersionData | null>(null);
    const [isModalClosing, setIsModalClosing] = useState(false);
    const [unreadCount, setUnreadCount] = useState(0);
    const menuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const fetchUpdates = async () => {
            try {
                // Fetch from MongoDB Atlas via the backend API
                const apiUrl = '/api/app-releases';
                
                const response = await fetch(apiUrl);
                let fetchedUpdates: UpdateVersionData[] = [];
                
                if (response.ok) {
                    const contentType = response.headers.get("content-type");
                    if (contentType && contentType.includes("application/json")) {
                        const data = await response.json();
                        if (Array.isArray(data) && data.length > 0) {
                            fetchedUpdates = data;
                        }
                    } else {
                        console.warn('API returned non-JSON response');
                    }
                }
                
                const finalUpdates = fetchedUpdates.length > 0 ? fetchedUpdates : FALLBACK_UPDATES;
                setUpdates(finalUpdates);
                
                // Calculate unread
                const lastSeenVersionId = localStorage.getItem('last_seen_update_version_id');
                const lastSeenIndex = finalUpdates.findIndex(u => u.id === lastSeenVersionId);
                
                if (lastSeenIndex === -1 && finalUpdates.length > 0) {
                    setUnreadCount(finalUpdates.length);
                } else if (lastSeenIndex > 0) {
                    setUnreadCount(lastSeenIndex);
                } else {
                    setUnreadCount(0);
                }
                
            } catch (error) {
                console.error("Error fetching updates from API, using fallback:", error);
                
                const finalUpdates = FALLBACK_UPDATES;
                setUpdates(finalUpdates);
                
                const lastSeenVersionId = localStorage.getItem('last_seen_update_version_id');
                const lastSeenIndex = finalUpdates.findIndex(u => u.id === lastSeenVersionId);
                
                if (lastSeenIndex === -1 && finalUpdates.length > 0) {
                    setUnreadCount(finalUpdates.length);
                } else if (lastSeenIndex > 0) {
                    setUnreadCount(lastSeenIndex);
                } else {
                    setUnreadCount(0);
                }
            }
        };

        fetchUpdates();
        
        // Setup polling every 5 minutes instead of onSnapshot
        const intervalId = setInterval(fetchUpdates, 5 * 60 * 1000);
        return () => clearInterval(intervalId);
    }, []);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const toggleMenu = () => {
        const nextState = !isOpen;
        setIsOpen(nextState);
        
        // If opening, mark as read
        if (nextState && updates.length > 0) {
            setUnreadCount(0);
            localStorage.setItem('last_seen_update_version_id', updates[0].id);
        }
    };

    const handleSelectUpdate = (update: UpdateVersionData) => {
        setSelectedUpdate(update);
        setIsOpen(false);
    };

    const handleCloseModal = () => {
        setIsModalClosing(true);
        setTimeout(() => {
            setSelectedUpdate(null);
            setIsModalClosing(false);
        }, 200);
    };

    return (
        <>
            <div className="relative" ref={menuRef}>
                <button
                    onClick={toggleMenu}
                    className={`
                        relative w-10 h-10 rounded-full backdrop-blur-md transition-all duration-300 flex items-center justify-center group border
                        ${hasBackground 
                            ? 'bg-white/20 hover:bg-white/30 text-white shadow-lg shadow-black/5 border-white/20' 
                            : 'bg-white text-slate-600 hover:bg-slate-50 hover:text-primary-600 shadow-md hover:shadow-xl hover:-translate-y-0.5 border-transparent'}
                    `}
                >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 transition-transform group-hover:scale-110">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0" />
                    </svg>

                    {unreadCount > 0 && (
                        <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[9px] font-bold text-white shadow-sm ring-2 ring-white animate-pulse">
                            {unreadCount > 9 ? '9+' : unreadCount}
                        </span>
                    )}
                </button>

                {/* Dropdown Menu */}
                {isOpen && (
                    <div className="fixed right-3 top-[70px] sm:absolute sm:right-0 sm:top-[calc(100%+12px)] bg-white/95 backdrop-blur-2xl rounded-2xl shadow-[0_20px_60px_-15px_rgba(0,0,0,0.15)] border border-white/60 p-2 w-[280px] sm:w-[340px] z-[100] animate-fade-in-up sm:origin-top-right ring-1 ring-black/5 overflow-hidden flex flex-col max-h-[60vh]">
                        <div className="p-3 border-b border-slate-100 flex items-center justify-between shrink-0">
                            <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4 text-primary-500">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 0 0 6 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 0 1 6 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 0 1 6-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0 0 18 18a8.967 8.967 0 0 0-6 2.292m0-14.25v14.25" />
                                </svg>
                                Lịch sử cập nhật
                            </h3>
                            <span className="text-xs font-semibold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">{updates.length}</span>
                        </div>
                        
                        <div className="overflow-y-auto p-1 py-2 flex flex-col gap-1 [scrollbar-width:thin]">
                            {updates.length === 0 ? (
                                <div className="p-4 text-center text-sm text-slate-500 italic">
                                    Chưa có bản cập nhật nào.
                                </div>
                            ) : (
                                updates.map(update => (
                                    <button
                                        key={update.id}
                                        onClick={() => handleSelectUpdate(update)}
                                        className="w-full text-left p-3 rounded-xl hover:bg-slate-50 transition-colors flex items-start gap-3 group active:scale-[0.98]"
                                    >
                                        <div className="w-8 h-8 rounded-full bg-primary-50 text-primary-600 flex items-center justify-center shrink-0 border border-primary-100 group-hover:scale-110 transition-transform">
                                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 0 0-2.456 2.456ZM16.894 20.567 16.5 21.75l-.394-1.183a2.25 2.25 0 0 0-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 0 0 1.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 0 0 1.423 1.423l1.183.394-1.183.394a2.25 2.25 0 0 0-1.423 1.423Z" />
                                            </svg>
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center justify-between mb-0.5">
                                                <span className="font-bold text-slate-800 text-sm truncate pr-2 group-hover:text-primary-600 transition-colors">{update.updateName}</span>
                                                <span className="text-[10px] font-bold text-white bg-slate-800 px-1.5 py-0.5 rounded shrink-0">{update.versionNumber}</span>
                                            </div>
                                            <p className="text-xs text-slate-500 font-medium">Cập nhật {update.dateStr}</p>
                                        </div>
                                    </button>
                                ))
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* Modal */}
            {selectedUpdate && createPortal(
                <div className={`fixed inset-0 z-[10005] flex items-center justify-center p-4 transition-opacity duration-200 ${isModalClosing ? 'opacity-0' : 'opacity-100'}`}>
                    <div 
                        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
                        onClick={handleCloseModal}
                    ></div>

                    <div className={`relative bg-white rounded-2xl shadow-2xl w-full max-w-lg sm:max-w-2xl lg:max-w-3xl overflow-hidden flex flex-col max-h-[90vh] m-4 ${isModalClosing ? 'animate-scale-out' : 'animate-fade-in-up'}`}>
                        <div className="bg-gradient-to-r from-indigo-500 to-purple-600 px-6 py-6 sm:py-8 text-white relative shrink-0">
                            <button 
                                onClick={handleCloseModal}
                                className="absolute top-4 right-4 text-white/70 hover:text-white bg-white/10 hover:bg-white/20 p-2 rounded-full transition-colors z-10"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                            
                            <div className="flex items-center gap-3 mb-2">
                                <div className="bg-white/20 p-2 rounded-xl shrink-0">
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-6 h-6 sm:w-8 sm:h-8">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 0 0-2.456 2.456ZM16.894 20.567 16.5 21.75l-.394-1.183a2.25 2.25 0 0 0-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 0 0 1.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 0 0 1.423 1.423l1.183.394-1.183.394a2.25 2.25 0 0 0-1.423 1.423Z" />
                                    </svg>
                                </div>
                                <h2 className="text-xl sm:text-2xl font-bold font-sans tracking-tight">[{selectedUpdate.versionNumber}] {selectedUpdate.updateName}</h2>
                            </div>
                            <p className="text-indigo-100 font-medium text-sm sm:text-base">Bản cập nhật ngày {selectedUpdate.dateStr}</p>
                        </div>

                        <div className="p-4 sm:p-6 overflow-y-auto [scrollbar-width:thin]">
                            <ul className="space-y-4">
                                {selectedUpdate.features && selectedUpdate.features.map((feature, idx) => (
                                    <li key={idx} className="flex gap-4">
                                        <div className="shrink-0 mt-1">
                                            {/* Using dynamic background color classes based on feature.color (Tailwind needs full class names, so we map safe colors) */}
                                            <div className={`w-8 h-8 rounded-full flex items-center justify-center
                                                ${feature.color === 'emerald' ? 'bg-emerald-100 text-emerald-600' :
                                                  feature.color === 'indigo' ? 'bg-indigo-100 text-indigo-600' :
                                                  feature.color === 'blue' ? 'bg-blue-100 text-blue-600' :
                                                  feature.color === 'purple' ? 'bg-purple-100 text-purple-600' :
                                                  feature.color === 'orange' ? 'bg-orange-100 text-orange-600' :
                                                  feature.color === 'pink' ? 'bg-pink-100 text-pink-600' :
                                                  'bg-slate-100 text-slate-600'}
                                            `}>
                                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4">
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99" />
                                                </svg>
                                            </div>
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-slate-800 text-lg mb-1">{feature.title}</h3>
                                            <div 
                                                className="text-slate-600 text-sm leading-relaxed"
                                                dangerouslySetInnerHTML={{ __html: feature.description }}
                                            />
                                        </div>
                                    </li>
                                ))}
                                {(!selectedUpdate.features || selectedUpdate.features.length === 0) && (
                                    <div className="text-center py-4 text-slate-500 italic">Không có chi tiết tính năng nào cho bản cập nhật này.</div>
                                )}
                            </ul>

                            <div className="mt-8 pt-4 border-t border-slate-100">
                                <button 
                                    onClick={handleCloseModal}
                                    className="w-full py-3.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-semibold shadow-md transition-all active:scale-[0.98]"
                                >
                                    Đã hiểu, Bắt đầu sử dụng!
                                </button>
                            </div>
                        </div>
                    </div>
                </div>,
                document.body
            )}
        </>
    );
};
