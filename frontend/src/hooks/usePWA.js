import { useState, useEffect } from 'react';

export const usePWA = () => {
  const [isInstalled, setIsInstalled] = useState(false);
  const [isInstallable, setIsInstallable] = useState(false);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [registration, setRegistration] = useState(null);

  useEffect(() => {
    // Verificar se está instalado
    const checkInstalled = () => {
      const isStandalone = window.matchMedia('(display-mode: standalone)').matches ||
                          window.navigator.standalone ||
                          document.referrer.includes('android-app://');
      setIsInstalled(isStandalone);
    };

    checkInstalled();

    // Listener para instalação
    const handleInstallable = () => setIsInstallable(true);
    window.addEventListener('pwainstallable', handleInstallable);

    // Listeners para online/offline
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Verificar service worker
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.ready.then(reg => {
        setRegistration(reg);

        // Verificar atualizações
        reg.addEventListener('updatefound', () => {
          const newWorker = reg.installing;
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              setUpdateAvailable(true);
            }
          });
        });
      });

      // Verificar atualizações periodicamente
      const interval = setInterval(() => {
        if (registration) {
          registration.update();
        }
      }, 60000); // A cada minuto

      return () => {
        clearInterval(interval);
        window.removeEventListener('pwainstallable', handleInstallable);
        window.removeEventListener('online', handleOnline);
        window.removeEventListener('offline', handleOffline);
      };
    }
  }, [registration]);

  const installPWA = () => {
    if (window.showInstallPrompt) {
      window.showInstallPrompt();
    }
  };

  const updatePWA = () => {
    if (updateAvailable && registration && registration.waiting) {
      registration.waiting.postMessage({ type: 'SKIP_WAITING' });
      window.location.reload();
    }
  };

  const clearCache = async () => {
    if ('caches' in window) {
      const cacheNames = await caches.keys();
      await Promise.all(cacheNames.map(name => caches.delete(name)));
      window.location.reload();
    }
  };

  return {
    isInstalled,
    isInstallable,
    isOffline,
    updateAvailable,
    installPWA,
    updatePWA,
    clearCache
  };
};