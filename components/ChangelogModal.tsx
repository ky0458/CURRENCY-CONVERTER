import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';

const CURRENT_VERSION = 'v1.0.4'; // Change this to show modal again in future updates

export const ChangelogModal: React.FC = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [isClosing, setIsClosing] = useState(false);

    useEffect(() => {
        const hasSeen = localStorage.getItem(`has_seen_changelog_${CURRENT_VERSION}`);
        if (!hasSeen) {
            setIsOpen(true);
        }
    }, []);

    const handleClose = () => {
        setIsClosing(true);
        setTimeout(() => {
            setIsOpen(false);
            localStorage.setItem(`has_seen_changelog_${CURRENT_VERSION}`, 'true');
        }, 200);
    };

    if (!isOpen) return null;

    const modalContent = (
        <div className={`fixed inset-0 z-[100] flex items-center justify-center p-4 transition-opacity duration-200 ${isClosing ? 'opacity-0' : 'opacity-100'}`}>
            {/* Backdrop */}
            <div 
                className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
                onClick={handleClose}
            ></div>

            {/* Modal */}
            <div className={`relative bg-white rounded-2xl shadow-2xl w-full max-w-lg sm:max-w-2xl lg:max-w-3xl overflow-hidden flex flex-col max-h-[90vh] m-4 ${isClosing ? 'animate-scale-out' : 'animate-fade-in-up'}`}>
                <div className="bg-gradient-to-r from-indigo-500 to-purple-600 px-6 py-6 sm:py-8 text-white relative shrink-0">
                    <button 
                        onClick={handleClose}
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
                        <h2 className="text-xl sm:text-2xl font-bold font-sans tracking-tight">Cập nhật mới!</h2>
                    </div>
                    <p className="text-indigo-100 font-medium text-sm sm:text-base">Bản cập nhật ngày 26/04/2026 - 11:24</p>
                </div>

                <div className="p-4 sm:p-6 overflow-y-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none]">
                    <ul className="space-y-4">
                        <li className="flex gap-4">
                            <div className="shrink-0 mt-1">
                                <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center text-orange-600">
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M9.53 16.122a3 3 0 0 0-5.78 1.128 2.25 2.25 0 0 1-2.4 2.245 4.5 4.5 0 0 0 8.4-2.245c0-.399-.078-.78-.22-1.128Zm0 0a15.998 15.998 0 0 0 3.388-1.62m-5.043-.025a15.994 15.994 0 0 1 1.622-3.395m3.42 3.42a15.995 15.995 0 0 0 4.764-4.648l3.861-3.86a2.25 2.25 0 0 0-3.182-3.182l-3.86 3.86a15.995 15.995 0 0 0-4.648 4.764m3.42 3.42a15.995 15.995 0 0 1-4.648-4.764m3.42 3.42a15.994 15.994 0 0 0 4.764-4.648" />
                                    </svg>
                                </div>
                            </div>
                            <div>
                                <h3 className="font-bold text-slate-800 text-lg mb-1">Nâng cấp Theme Tùy chỉnh Cao cấp</h3>
                                <p className="text-slate-600 text-sm leading-relaxed">
                                    Khám phá sự lột xác với các theme chủ đề mới! Các Theme trên thanh tiêu đề và nút bấm không chỉ đổi màu sắc như trước, mà nay được nâng cấp với các chi tiết trang trí đặc trưng (Ếch xanh, Mèo vàng, Gấu trúc...). Làm cho máy đổi tiền của bạn độc đáo hơn bao giờ hết!
                                </p>
                            </div>
                        </li>

                        <li className="flex gap-4">
                            <div className="shrink-0 mt-1">
                                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 0 0 8.716-6.747M12 21a9.004 9.004 0 0 1-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 0 1 7.843 4.582M12 3a8.997 8.997 0 0 0-7.843 4.582m15.686 0A11.953 11.953 0 0 1 12 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0 1 21 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0 1 12 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 0 1 3 12c0-1.605.42-3.113 1.157-4.418" />
                                    </svg>
                                </div>
                            </div>
                            <div>
                                <h3 className="font-bold text-slate-800 text-lg mb-1">Nâng cấp mạnh mẽ tính năng Che CV</h3>
                                <p className="text-slate-600 text-sm leading-relaxed">
                                    Tính năng che thủ công đã được bổ sung thêm nút <strong>Hoàn tác</strong>, giúp bạn quay lại thao tác trước đó một cách dễ dàng. Đồng thời hỗ trợ <strong>chạm giữ</strong> (trên mobile/tablet) hoặc phím <strong>Delete/Backspace</strong> (trên PC) để xóa đi các vùng chắn bị vẽ nhầm. Tốc độ nhận diện cũng được cải thiện đáng kể!
                                </p>
                            </div>
                        </li>

                        <li className="flex gap-4">
                            <div className="shrink-0 mt-1">
                                <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center text-purple-600">
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="m11.25 11.25.041-.02a.75.75 0 0 1 1.063.852l-.708 2.836a.75.75 0 0 0 1.063.853l.041-.021M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9-3.75h.008v.008H12V8.25Z" />
                                    </svg>
                                </div>
                            </div>
                            <div>
                                <h3 className="font-bold text-slate-800 text-lg mb-1">Cập nhật Hướng dẫn Chế độ Chat AI</h3>
                                <p className="text-slate-600 text-sm leading-relaxed">
                                    Trong chức năng Chat AI, chúng tôi đã bổ sung các hướng dẫn sử dụng chi tiết, giúp bạn dễ dàng tiến hành các thao tác thuận lợi khi cần dùng đến chế độ Dịch Chuyên Sâu!
                                </p>
                            </div>
                        </li>

                        <li className="flex gap-4">
                            <div className="shrink-0 mt-1">
                                <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600">
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 1.5H8.25A2.25 2.25 0 0 0 6 3.75v16.5a2.25 2.25 0 0 0 2.25 2.25h7.5A2.25 2.25 0 0 0 18 20.25V3.75a2.25 2.25 0 0 0-2.25-2.25H13.5m-3 0V3h3V1.5m-3 0h3m-3 18.75h3" />
                                    </svg>
                                </div>
                            </div>
                            <div>
                                <h3 className="font-bold text-slate-800 text-lg mb-1">Tối ưu hóa Giao diện Mobile</h3>
                                <p className="text-slate-600 text-sm leading-relaxed">
                                    Đã điều chỉnh và cải thiện đáng kể giao diện hiển thị trên các thiết bị di động. Giúp việc thao tác và đọc tài liệu trở nên dễ dàng và thân thiện hơn.
                                </p>
                            </div>
                        </li>

                        <li className="flex gap-4">
                            <div className="shrink-0 mt-1">
                                <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center text-amber-600">
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 9.75l4.5 4.5m0-4.5l-4.5 4.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                </div>
                            </div>
                            <div>
                                <h3 className="font-bold text-slate-800 text-lg mb-1">Tinh chỉnh Nút thao tác</h3>
                                <p className="text-slate-600 text-sm leading-relaxed">
                                    Làm gọn làm sạch giao diện các nút thao tác Tải xuống, Upload để tiết kiệm không gian. Cải tiến độ ổn định khi xuất PDF/Word.
                                </p>
                            </div>
                        </li>
                    </ul>

                    <div className="mt-8 pt-4 border-t border-slate-100">
                        <button 
                            onClick={handleClose}
                            className="w-full py-3.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-semibold shadow-md transition-all active:scale-[0.98]"
                        >
                            Đã hiểu, Bắt đầu sử dụng!
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );

    return createPortal(modalContent, document.body);
};
