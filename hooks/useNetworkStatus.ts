import { useState, useEffect } from 'react';

interface NetworkStatus {
  isOnline: boolean;
  isSlowConnection: boolean;
}

export function useNetworkStatus(): NetworkStatus {
  const [isOnline, setIsOnline] = useState(() => {
    if (typeof navigator !== 'undefined') {
      return navigator.onLine;
    }
    return true;
  });

  const [isSlowConnection, setIsSlowConnection] = useState(false);

  useEffect(() => {
    // Check connection speed
    const checkConnection = () => {
      if ('connection' in navigator) {
        const connection = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection;
        if (connection) {
          const effectiveType = connection.effectiveType;
          setIsSlowConnection(effectiveType === 'slow-2g' || effectiveType === '2g');
        }
      }
    };

    checkConnection();

    const handleOnline = () => {
      setIsOnline(true);
      checkConnection();
    };

    const handleOffline = () => {
      setIsOnline(false);
    };

    // Listen for connection changes
    if ('connection' in navigator) {
      const connection = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection;
      if (connection) {
        connection.addEventListener('change', checkConnection);
      }
    }

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Check Capacitor network status if available
    const checkCapacitorNetwork = async () => {
      try {
        const { Network } = await import('@capacitor/network');
        const status = await Network.getStatus();
        setIsOnline(status.connected);
      } catch (err) {
        // Capacitor not available, use browser API
      }
    };

    checkCapacitorNetwork();

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      if ('connection' in navigator) {
        const connection = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection;
        if (connection) {
          connection.removeEventListener('change', checkConnection);
        }
      }
    };
  }, []);

  return { isOnline, isSlowConnection };
}

