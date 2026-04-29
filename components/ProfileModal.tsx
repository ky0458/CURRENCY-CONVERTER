import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { User, updateProfile } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { ThemeColor } from '../types';
import { OperationType, handleFirestoreError } from '../utils/firestoreErrorHandler';

interface ProfileModalProps {
    onClose: () => void;
    user: User;
    theme: ThemeColor;
}

export const ProfileModal: React.FC<ProfileModalProps> = ({ onClose, user, theme }) => {
    const [name, setName] = useState(user.displayName || '');
    const [nickname, setNickname] = useState('');
    const [bio, setBio] = useState('');
    const [photoUrl, setPhotoUrl] = useState(user.photoURL || '');
    const [accountType, setAccountType] = useState('Miễn phí');

    const [isLoading, setIsLoading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle');

    useEffect(() => {
        const fetchUserData = async () => {
            setIsLoading(true);
            try {
                const path = `users/${user.uid}`;
                const userRef = doc(db, 'users', user.uid);
                const docSnap = await getDoc(userRef);
                if (docSnap.exists()) {
                    const data = docSnap.data();
                    if (data.nickname) setNickname(data.nickname);
                    if (data.bio) setBio(data.bio);
                    if (data.photoUrl) setPhotoUrl(data.photoUrl);
                    if (data.accountType) setAccountType(data.accountType);
                }
            } catch (error: any) {
                const isPermissionDenied = error.code === 'permission-denied' || error.message?.includes('permission') || error.message?.includes('Missing or insufficient permissions');
                if (!isPermissionDenied) {
                    console.error("Error fetching user data:", error);
                }
            } finally {
                setIsLoading(false);
            }
        };

        fetchUserData();
    }, [user.uid]);

    const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            if (!file.type.startsWith('image/')) return;

            const reader = new FileReader();
            reader.onload = (event) => {
                if (event.target?.result) {
                    const img = new Image();
                    img.onload = () => {
                        const canvas = document.createElement('canvas');
                        const MAX_WIDTH = 150;
                        const MAX_HEIGHT = 150;
                        let width = img.width;
                        let height = img.height;

                        if (width > height) {
                            if (width > MAX_WIDTH) {
                                height *= MAX_WIDTH / width;
                                width = MAX_WIDTH;
                            }
                        } else {
                            if (height > MAX_HEIGHT) {
                                width *= MAX_HEIGHT / height;
                                height = MAX_HEIGHT;
                            }
                        }

                        canvas.width = width;
                        canvas.height = height;
                        const ctx = canvas.getContext('2d');
                        if (ctx) {
                            ctx.drawImage(img, 0, 0, width, height);
                            // Compress heavily to keep base64 string small
                            const compressedBase64 = canvas.toDataURL('image/jpeg', 0.6);
                            setPhotoUrl(compressedBase64);
                        }
                    };
                    img.src = event.target.result as string;
                }
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSave = async () => {
        setIsSaving(true);
        setSaveStatus('idle');
        try {
            // Update auth profile
            // Only save to Auth profile if it's NOT a base64 string (due to Firebase length limits)
            const isBase64Image = photoUrl.startsWith('data:image/');
            const authProfileUpdates: any = { displayName: name };
            if (!isBase64Image) {
                authProfileUpdates.photoURL = photoUrl;
            }
            await updateProfile(user, authProfileUpdates);

            // Update firestore document
            const path = `users/${user.uid}`;
            const userRef = doc(db, 'users', user.uid);
            await setDoc(userRef, {
                uid: user.uid,
                email: user.email,
                displayName: name,
                photoUrl: photoUrl,
                nickname: nickname,
                bio: bio,
                updatedAt: Date.now()
            }, { merge: true });

            setSaveStatus('success');
            setTimeout(() => {
                setSaveStatus('idle');
            }, 3000);
        } catch (error: any) {
            const isPermissionDenied = error.code === 'permission-denied' || error.message?.includes('permission') || error.message?.includes('Missing or insufficient permissions');
            if (isPermissionDenied) {
                // If permission denied, still show success because we updated auth profile
                // just ignore firestore save failure if they don't have DB set up
                setSaveStatus('success');
                setTimeout(() => {
                    setSaveStatus('idle');
                }, 3000);
            } else {
                console.error("Error saving profile:", error);
                setSaveStatus('error');
            }
        } finally {
            setIsSaving(false);
        }
    };

    const joinDate = user.metadata.creationTime ? new Date(user.metadata.creationTime).toLocaleDateString('vi-VN') : 'Không rõ';



    return createPortal(
        <div className="fixed inset-0 z-[10002] flex items-center justify-center p-4 sm:p-6">
            <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={onClose}></div>
            
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg relative z-10 flex flex-col max-h-[90vh] animate-scale-in overflow-hidden border border-white/50">
                {/* Header */}
                <div className="px-6 py-4 flex items-center justify-between border-b border-slate-100 bg-slate-50/50 shrink-0">
                    <div>
                        <h3 className="text-xl font-bold text-slate-800">Hồ sơ cá nhân</h3>
                        <p className="text-sm text-slate-500 font-medium mt-0.5">Quản lý thông tin tài khoản của bạn</p>
                    </div>
                    <button 
                        onClick={onClose}
                        className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 hover:text-slate-700 transition-colors"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Body */}
                <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
                    {isLoading ? (
                        <div className="flex justify-center items-center py-20">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-500"></div>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            {/* Avatar Section */}
                            <div className="flex flex-col gap-6">
                                <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
                                    <div className="relative group shrink-0 mt-2">
                                        <label className="cursor-pointer block relative">
                                            <div className="w-28 h-28 rounded-full flex items-center justify-center ring-4 ring-primary-100 ring-offset-2 ring-offset-white">
                                                <div className="w-full h-full rounded-full overflow-hidden bg-slate-100 flex items-center justify-center relative">
                                                    {photoUrl ? (
                                                        <img src={photoUrl} alt={name || "User avatar"} className="w-full h-full object-cover group-hover:opacity-80 transition-opacity" />
                                                    ) : (
                                                        <div className="w-full h-full flex items-center justify-center bg-primary-50 text-primary-600 font-bold text-4xl group-hover:opacity-80 transition-opacity">
                                                            {name ? name.charAt(0).toUpperCase() : "U"}
                                                        </div>
                                                    )}
                                                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6 text-white">
                                                            <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 0 1 5.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 0 0-1.134-.175 2.31 2.31 0 0 1-1.64-1.055l-.822-1.316a2.192 2.192 0 0 0-1.736-1.039 48.774 48.774 0 0 0-5.232 0 2.192 2.192 0 0 0-1.736 1.039l-.821 1.316Z" />
                                                            <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 1 1-9 0 4.5 4.5 0 0 1 9 0ZM18.75 10.5h.008v.008h-.008V10.5Z" />
                                                        </svg>
                                                    </div>
                                                </div>
                                            </div>
                                            <input type="file" className="hidden" accept="image/*" onChange={handleAvatarChange} />
                                        </label>
                                    </div>
                                    <div className="flex-1 text-center sm:text-left space-y-2 mt-4 sm:mt-6">
                                        <p className="text-sm font-medium text-slate-500">Giới hạn dung lượng: 5MB</p>
                                        <p className="text-sm font-medium text-slate-500">Định dạng hỗ trợ: JPEG, PNG, GIF</p>
                                    </div>
                                </div>
                            </div>

                            {/* Info Fields */}
                            <div className="space-y-4">
                                <div className="w-full">
                                    <label className="block text-sm font-bold text-slate-700 mb-1.5 shrink-0">Email liên kết</label>
                                    <div className="relative w-full">
                                        <input 
                                            type="text" 
                                            readOnly
                                            value={user.email || ''} 
                                            className="w-full bg-slate-100 border border-transparent rounded-xl px-4 py-3 text-sm text-slate-500 font-medium focus:outline-none cursor-not-allowed pr-10 overflow-hidden text-ellipsis whitespace-nowrap"
                                            title="Email không thể thay đổi sau khi tạo tài khoản"
                                        />
                                        <div className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
                                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
                                              <path fillRule="evenodd" d="M10 1a4.5 4.5 0 0 0-4.5 4.5V9H5a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-6a2 2 0 0 0-2-2h-.5V5.5A4.5 4.5 0 0 0 10 1Zm3 8V5.5a3 3 0 1 0-6 0V9h6Z" clipRule="evenodd" />
                                            </svg>
                                        </div>
                                    </div>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-bold text-slate-700 mb-1.5">Loại tài khoản</label>
                                        <div className="w-full bg-slate-100 border border-transparent rounded-xl px-4 py-3 text-sm font-medium focus:outline-none cursor-not-allowed flex items-center gap-2">
                                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 text-amber-500">
                                              <path fillRule="evenodd" d="M10.868 2.884c-.321-.772-1.415-.772-1.736 0l-1.83 4.401-4.753.381c-.833.067-1.171 1.107-.536 1.651l3.62 3.102-1.106 4.637c-.194.813.691 1.456 1.405 1.02L10 15.591l4.069 2.485c.713.436 1.598-.207 1.404-1.02l-1.106-4.637 3.62-3.102c.635-.544.297-1.584-.536-1.65l-4.752-.382-1.831-4.401Z" clipRule="evenodd" />
                                            </svg>
                                            <span className="text-amber-600 font-bold">{accountType}</span>
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-slate-700 mb-1.5">Ngày gia nhập</label>
                                        <input 
                                            type="text" 
                                            readOnly
                                            value={joinDate} 
                                            className="w-full bg-slate-100 border border-transparent rounded-xl px-4 py-3 text-sm text-slate-500 font-medium focus:outline-none cursor-not-allowed"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-bold text-slate-700 mb-1.5">Họ và tên</label>
                                        <input 
                                            type="text" 
                                            value={name} 
                                            onChange={(e) => setName(e.target.value)}
                                            placeholder="Nguyễn Văn A"
                                            className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-800 font-medium focus:outline-none focus:border-primary-400 focus:ring-4 focus:ring-primary-50 transition-all"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-slate-700 mb-1.5">Biệt danh</label>
                                        <input 
                                            type="text" 
                                            value={nickname} 
                                            onChange={(e) => setNickname(e.target.value)}
                                            placeholder="Nhập biệt danh của bạn"
                                            className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-800 font-medium focus:outline-none focus:border-primary-400 focus:ring-4 focus:ring-primary-50 transition-all"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-1.5">Giới thiệu ngắn</label>
                                    <textarea 
                                        value={bio} 
                                        onChange={(e) => setBio(e.target.value)}
                                        placeholder="Một vài dòng giới thiệu về bạn..."
                                        rows={3}
                                        className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-800 font-medium focus:outline-none focus:border-primary-400 focus:ring-4 focus:ring-primary-50 transition-all resize-none"
                                    />
                                </div>
                            </div>

                            {/* Status Message */}
                            {saveStatus === 'success' && (
                                <div className="p-3 bg-green-50 text-green-600 rounded-xl text-sm font-bold flex items-center justify-center gap-2 animate-fade-in-up">
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                                    </svg>
                                    Lưu hồ sơ thành công!
                                </div>
                            )}
                            {saveStatus === 'error' && (
                                <div className="p-3 bg-red-50 text-red-600 rounded-xl text-sm font-bold flex items-center justify-center gap-2 animate-fade-in-up">
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3Z" />
                                    </svg>
                                    Có lỗi xảy ra, vui lòng thử lại!
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/50 flex justify-end gap-3 shrink-0">
                    <button 
                        onClick={onClose}
                        disabled={isSaving}
                        className="px-6 py-2.5 rounded-xl font-bold text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 transition-colors disabled:opacity-50 active:scale-95 shadow-sm"
                    >
                        Hủy
                    </button>
                    <button 
                        onClick={handleSave}
                        disabled={isSaving || isLoading}
                        style={{ backgroundColor: theme }}
                        className="px-6 py-2.5 rounded-xl font-bold text-white transition-opacity hover:opacity-90 disabled:opacity-50 flex items-center gap-2 active:scale-95 shadow-md"
                    >
                        {isSaving ? (
                            <>
                                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                Đang lưu...
                            </>
                        ) : (
                            'Lưu thay đổi'
                        )}
                    </button>
                </div>
            </div>
        </div>,
        document.body
    );
};
