import React from 'react';
import { Icons } from '../constants';

interface OfflineBannerProps {
  isOnline: boolean;
  isSlowConnection: boolean;
}

const OfflineBanner: React.FC<OfflineBannerProps> = ({ isOnline, isSlowConnection }) => {
  if (isOnline && !isSlowConnection) return null;

  return (
    <div className={`fixed top-0 left-0 right-0 z-50 bg-[var(--bg-primary)] border-b border-theme px-4 py-3 flex items-center justify-center space-x-2 ${
      !isOnline ? 'bg-red-500/20 border-red-500/50' : 'bg-yellow-500/20 border-yellow-500/50'
    }`}>
      {!isOnline ? (
        <>
          <Icons.Cloud className="w-5 h-5 text-red-400" />
          <span className="text-sm text-red-400 font-medium">
            No internet connection. Some features may be limited.
          </span>
        </>
      ) : (
        <>
          <Icons.Cloud className="w-5 h-5 text-yellow-400" />
          <span className="text-sm text-yellow-400 font-medium">
            Slow connection detected. Content may load slowly.
          </span>
        </>
      )}
    </div>
  );
};

export default OfflineBanner;

