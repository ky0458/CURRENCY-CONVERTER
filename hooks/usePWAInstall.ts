import { useState, useEffect } from 'react';

export const usePWAInstall = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone === true) {
      setIsInstalled(true);
      return;
    }

    // Always show install button on mobile/tablet to provide manual instructions if native prompt is missing
    const isMobileOrTablet = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    if (isMobileOrTablet) {
        setIsInstallable(true);
    }

    // Also check if they are not in an iframe
    if (window === window.parent && !isMobileOrTablet) {
      // In a normal window on desktop, we still might want to show it if browser supports beforeinstallprompt
    }

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setIsInstallable(true);
    };

    const handleAppInstalled = () => {
      setIsInstallable(false);
      setIsInstalled(true);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const triggerInstall = async () => {
    if (deferredPrompt) {
      try {
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        if (outcome === 'accepted') {
          setIsInstallable(false);
          setIsInstalled(true);
        }
        setDeferredPrompt(null);
      } catch (err) {
        console.error("Installation error:", err);
      }
    } else {
      // Provide manual instruction fallback
      const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1 && !(window as any).MSStream);
      
      if (isIOS) {
          alert('Để cài đặt ứng dụng: Nhấn vào biểu tượng Chia sẻ (Share) ở trình duyệt Safari và chọn "Thêm vào MH chính" (Add to Home Screen).');
      } else {
          alert('Không thể hiển thị lời nhắc tự động (có thể do bạn đã từng cài đặt và gỡ ứng dụng, hoặc trình duyệt chặn).\n\nVui lòng cài đặt thủ công:\nNhấn vào Menu trình duyệt (ba chấm / tùy chọn) -> Chọn "Thêm vào màn hình chính" (Add to Home screen) hoặc "Cài đặt ứng dụng".\n\n*Nếu bạn không thấy tùy chọn này, hãy thử xóa dữ liệu duyệt web cho trang web này và tải lại.');
      }
    }
  };

  return { isInstallable, isInstalled, triggerInstall };
};

