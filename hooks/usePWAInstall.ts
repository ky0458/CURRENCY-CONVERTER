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

    const handleBeforeInstallPrompt = (e: Event) => {
      // Do NOT prevent default to allow browser's default prompt
      // Stash the event just in case, but we won't show custom UI
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

    // Provide manual install UI ONLY on iOS since iOS doesn't support beforeinstallprompt
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1 && !(window as any).MSStream);
    if (isIOS && !isInstalled) {
      setIsInstallable(true);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, [isInstalled]);

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
          alert('Trình duyệt của bạn đang tạm thời không cho phép cài đặt lại tự động (có thể do bạn đã từng cài đặt và gỡ ứng dụng gần đây). \n\nĐể cài đặt lại, hãy nhấn vào Menu trình duyệt (dấu 3 chấm góc phải) -> Chọn "Cài đặt ứng dụng" hoặc "Thêm vào màn hình chính".');
      }
    }
  };

  return { isInstallable, isInstalled, triggerInstall };
};

