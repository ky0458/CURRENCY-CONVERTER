
import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  onAuthStateChanged, 
  signInWithPopup, 
  signOut, 
  User,
  AuthError
} from 'firebase/auth';
import { auth, googleProvider } from '../firebase';

interface NotificationState {
  message: string;
  type: 'success' | 'error' | 'info';
}

interface AuthContextType {
  user: User | null;
  isAdmin: boolean;
  loading: boolean;
  loginGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  notification: NotificationState | null;
  closeNotification: () => void;
  showNotification: (message: string, type: 'success' | 'error' | 'info') => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState<NotificationState | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // --- OPTIMIZED PRESENCE SYSTEM ---
  const userRef = React.useRef(user);
  
  useEffect(() => {
    userRef.current = user;
  }, [user]);

  useEffect(() => {
    let interval: any;

    const updatePresence = async () => {
      const currentUser = userRef.current;
      if (currentUser) {
        try {
          // Identify device info (silent tracking as requested)
          const ua = navigator.userAgent;
          let device = "Unknown Device";
          if (/Android/i.test(ua)) device = "Android";
          else if (/iPhone|iPad|iPod/i.test(ua)) device = "iOS";
          else if (/Windows/i.test(ua)) device = "Windows";
          else if (/Macintosh/i.test(ua)) device = "macOS";
          else if (/Linux/i.test(ua)) device = "Linux";

          let browser = "Unknown Browser";
          if (/Chrome/i.test(ua)) browser = "Chrome";
          else if (/Firefox/i.test(ua)) browser = "Firefox";
          else if (/Safari/i.test(ua)) browser = "Safari";
          else if (/Edge/i.test(ua)) browser = "Edge";
          else if (/MSIE|Trident/i.test(ua)) browser = "IE";

          const deviceInfo = `${device} (${browser})`;

          const response = await fetch('/api/users/presence', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'x-user-uid': currentUser.uid
            },
            body: JSON.stringify({
              uid: currentUser.uid,
              displayName: currentUser.displayName || 'Người dùng',
              photoURL: currentUser.photoURL || '',
              email: currentUser.email,
              lastSeen: Date.now(),
              status: document.visibilityState === 'visible' ? 'online' : 'away',
              deviceInfo
            })
          });
          
          if (!response.ok) {
            if (response.status === 403) {
              await auth.signOut();
              alert("Tài khoản của bạn đã bị khóa.");
              return;
            }
            console.error("Failed to update presence in backend", await response.text());
          } else {
             const data = await response.json();
             if (data.user && typeof data.user.isAdmin === 'boolean') {
                 setIsAdmin(data.user.isAdmin);
             }
          }
        } catch (error: any) {
          if (error.code !== 'permission-denied' && error.message !== 'Failed to fetch') {
             console.error("Presence update error:", error);
          }
        }
      }
    };

    if (user?.uid) {
      // 1. Initial update on mount
      updatePresence();

      // 2. Heartbeat every 5 minutes (reduced frequency to avoid spam)
      interval = setInterval(updatePresence, 300000);

      // 3. Update immediately when tab becomes visible
      const handleVisibilityChange = () => {
        if (document.visibilityState === 'visible') {
          updatePresence();
        }
      };
      
      document.addEventListener("visibilitychange", handleVisibilityChange);

      return () => {
        if (interval) clearInterval(interval);
        document.removeEventListener("visibilitychange", handleVisibilityChange);
      };
    }
  }, [user?.uid]);
  // -----------------------------------

  const showNotification = (message: string, type: 'success' | 'error' | 'info') => {
    setNotification({ message, type });
    // Tự động tắt sau 4 giây
    setTimeout(() => {
      setNotification(null);
    }, 4000);
  };

  const closeNotification = () => setNotification(null);

  const handleAuthError = (error: AuthError, providerName: string) => {
    console.error(`${providerName} Login Error:`, error.code, error.message);
    
    let message = `Đăng nhập ${providerName} thất bại.`;

    switch (error.code) {
      case 'auth/popup-closed-by-user':
        message = 'Bạn đã đóng cửa sổ đăng nhập.';
        break;
      case 'auth/cancelled-popup-request':
        message = 'Yêu cầu đăng nhập bị hủy do có cửa sổ khác đang mở.';
        break;
      case 'auth/account-exists-with-different-credential':
        message = 'Email này đã được liên kết với một phương thức đăng nhập khác.';
        break;
      case 'auth/unauthorized-domain':
        message = 'Tên miền hiện tại chưa được ủy quyền trong Firebase Console. Vui lòng thêm tên miền này vào Authentication > Settings > Authorized Domains.';
        break;
      case 'auth/operation-not-allowed':
        message = `Đăng nhập bằng ${providerName} chưa được kích hoạt trong Firebase Console.`;
        break;
      case 'auth/popup-blocked':
        message = 'Trình duyệt đã chặn cửa sổ bật lên (popup). Vui lòng cho phép popup để đăng nhập.';
        break;
      case 'auth/network-request-failed':
        message = 'Lỗi kết nối mạng. Vui lòng kiểm tra lại đường truyền.';
        break;
      default:
        break;
    }

    showNotification(message, 'error');
  };

  const loginGoogle = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
      showNotification('Đăng nhập Google thành công!', 'success');
    } catch (error: any) {
      handleAuthError(error, 'Google');
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
      showNotification('Đã đăng xuất thành công.', 'info');
    } catch (error: any) {
      console.error("Logout Error:", error);
      showNotification('Đăng xuất thất bại.', 'error');
    }
  };

  return (
    <AuthContext.Provider value={{ user, isAdmin, loading, loginGoogle, logout, notification, closeNotification, showNotification }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within an AuthProvider");
  return context;
};
