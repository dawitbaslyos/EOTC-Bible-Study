
import React from 'react';
import { Notification } from '../types';
import { Icons } from '../constants';

interface Props {
  notifications: Notification[];
  isOpen: boolean;
  onClose: () => void;
  onMarkRead: (id: string) => void;
  onClearAll: () => void;
}

const NotificationCenter: React.FC<Props> = ({ notifications, isOpen, onClose, onMarkRead, onClearAll }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[150] flex justify-end p-4 pointer-events-none">
      <div 
        className="absolute inset-0 bg-[var(--overlay-bg)] backdrop-blur-sm pointer-events-auto" 
        onClick={onClose} 
      />
      <div className="relative w-full max-w-sm bg-[var(--bg-primary)] border border-theme rounded-[2.5rem] shadow-2xl pointer-events-auto flex flex-col overflow-hidden animate-in slide-in-from-right-10 duration-500">
        <header className="p-8 border-b border-theme flex justify-between items-center bg-[var(--card-bg)]">
          <div>
            <h2 className="text-xl serif text-[var(--gold)]">Notifications</h2>
            <p className="text-[9px] uppercase tracking-widest text-[var(--text-muted)] font-black">Stay updated</p>
          </div>
          <div className="flex space-x-2">
            {notifications.length > 0 && (
              <button 
                onClick={onClearAll}
                className="text-[9px] uppercase tracking-widest text-[var(--text-muted)] hover:text-red-400 font-black transition-colors"
              >
                Clear
              </button>
            )}
            <button onClick={onClose} className="p-2 text-[var(--text-muted)] hover:text-[var(--text-primary)]">
              <Icons.Close />
            </button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
          {notifications.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-8 opacity-30">
              <Icons.Cloud className="w-12 h-12 mb-4" />
              <p className="text-xs uppercase tracking-widest font-black">All clear for now</p>
            </div>
          ) : (
            notifications.map((n) => (
              <div 
                key={n.id} 
                onClick={() => onMarkRead(n.id)}
                className={`p-5 rounded-3xl border transition-all cursor-pointer relative group ${
                  n.read 
                    ? 'bg-[var(--card-bg)] border-transparent opacity-60' 
                    : 'bg-[var(--gold-muted)] border-[var(--gold)]/20 shadow-md'
                }`}
              >
                {!n.read && (
                  <div className="absolute top-5 right-5 w-2 h-2 bg-[var(--gold)] rounded-full animate-pulse" />
                )}
                <h4 className={`text-sm font-bold mb-1 ${n.read ? 'text-[var(--text-secondary)]' : 'text-[var(--text-primary)]'}`}>
                  {n.title}
                </h4>
                <p className="text-xs text-[var(--text-muted)] leading-relaxed">{n.body}</p>
                <div className="mt-3 text-[8px] uppercase tracking-widest text-[var(--text-muted)] font-black">
                  {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export const NotificationToast: React.FC<{ notification: Notification | null, onDismiss: () => void }> = ({ notification, onDismiss }) => {
  if (!notification) return null;

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[200] w-[90%] max-w-sm animate-in slide-in-from-bottom-10 duration-500">
      <div 
        onClick={onDismiss}
        className="bg-[var(--bg-secondary)] border border-[var(--gold)]/30 p-5 rounded-2xl shadow-2xl flex items-center space-x-4 cursor-pointer"
      >
        <div className="w-10 h-10 rounded-xl bg-[var(--gold-muted)] flex items-center justify-center text-[var(--gold)] shrink-0">
          <Icons.Bell />
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-bold text-[var(--text-primary)] truncate">{notification.title}</h4>
          <p className="text-xs text-[var(--text-muted)] line-clamp-1">{notification.body}</p>
        </div>
        <button className="text-[var(--text-muted)] hover:text-[var(--text-primary)]"><Icons.Close className="w-4 h-4" /></button>
      </div>
    </div>
  );
};

export default NotificationCenter;
