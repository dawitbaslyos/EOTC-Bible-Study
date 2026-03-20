
import React, { useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Icons } from '../constants';
import { Book, Testament, UserStats, BookProgress } from '../types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  books: Book[];
  onSelectBook: (bookId: string) => void;
  userProfile?: any;
  userStats?: UserStats;
  onLogout: () => void;
  daysPracticed?: number;
  onOpenSettings: () => void;
}

const LibraryDrawer: React.FC<Props> = ({ 
  isOpen, onClose, books, onSelectBook, userProfile, userStats, onLogout, daysPracticed,
  onOpenSettings
}) => {
  const [activeTab, setActiveTab] = useState<Testament>('All');
  const [dragOffset, setDragOffset] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [imageError, setImageError] = useState(false);
  
  const drawerRef = useRef<HTMLDivElement>(null);
  const touchStartX = useRef(0);
  
  const filteredBooks = books.filter(b => {
    if (activeTab === 'All') return true;
    return b.testament.toLowerCase() === activeTab.toLowerCase();
  });

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    setIsDragging(true);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isOpen) return;
    const currentX = e.touches[0].clientX;
    const deltaX = currentX - touchStartX.current;
    if (deltaX < 0) {
      setDragOffset(deltaX);
    }
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
    if (dragOffset < -100) {
      onClose();
    }
    setDragOffset(0);
  };

  const totalReflections = (Object.values(userStats?.studyHistory || {}) as number[]).reduce((a, b) => a + b, 0);
  const activeScrolls = (Object.values(userStats?.bookProgress || {}) as BookProgress[]).filter(p => p.completedChapters.length > 0).length;

  // Portal to body so position:fixed is relative to the viewport (not a transformed/padded ancestor).
  const drawer = (
    <>
      <div 
        className={`fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] transition-opacity duration-500 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={onClose}
        aria-hidden={!isOpen}
      />
      
      <div 
        ref={drawerRef}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        className={`fixed inset-y-0 left-0 w-full max-w-sm bg-[var(--bg-primary)] border-r border-theme z-[101] overflow-hidden select-none transition-transform duration-500 ease-out`}
        style={{ 
          transform: isOpen ? `translateX(${dragOffset}px)` : `translateX(-100%)`,
          transition: isDragging ? 'none' : 'transform 0.5s cubic-bezier(0.16, 1, 0.3, 1)',
          minHeight: '100dvh',
        }}
      >
        <div className="flex flex-col h-full">
          {/* User Section */}
          <div className="p-8 pt-[max(2rem,env(safe-area-inset-top,0px))] bg-[var(--card-bg)] border-b border-theme relative overflow-hidden">
            <div className="relative z-10 flex items-center space-x-4 mb-6">
               <div className="w-16 h-16 rounded-2xl border border-[var(--gold)]/30 p-1 flex items-center justify-center bg-[var(--bg-primary)] shadow-lg overflow-hidden">
                  {userProfile?.photoURL && !imageError ? (
                    <img src={userProfile.photoURL} alt="P" className="w-full h-full rounded-xl object-cover" onError={() => setImageError(true)} />
                  ) : (
                    <Icons.User className="w-8 h-8 opacity-40 text-[var(--gold)]" />
                  )}
               </div>
               
               <div className="flex-1">
                  <h3 className="serif text-xl text-[var(--text-primary)] truncate">{userProfile?.name || 'Seer'}</h3>
               </div>

               <button 
                 onClick={() => { onClose(); onOpenSettings(); }}
                 className="p-3 bg-[var(--card-bg)] border border-theme rounded-xl text-[var(--text-muted)] hover:text-[var(--gold)] transition-all"
               >
                 <Icons.MoreVertical />
               </button>
            </div>

            <div className="flex items-center justify-between px-2">
               <div className="text-center">
                  <div className="text-sm font-bold text-[var(--text-primary)]">{activeScrolls}</div>
                  <div className="text-[7px] uppercase tracking-widest text-[var(--text-muted)] font-bold">Scrolls</div>
               </div>
               <div className="text-center">
                  <div className="text-sm font-bold text-[var(--text-primary)]">{totalReflections}</div>
                  <div className="text-[7px] uppercase tracking-widest text-[var(--text-muted)] font-bold">Insight</div>
               </div>
               <div className="text-center">
                  <div className="text-sm font-bold text-[var(--text-primary)]">{daysPracticed || 0}</div>
                  <div className="text-[7px] uppercase tracking-widest text-[var(--text-muted)] font-bold">Days</div>
               </div>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar flex flex-col">
            <header className="p-6 pb-2">
              <h2 className="text-[10px] uppercase tracking-[0.3em] font-black text-[var(--text-muted)]">Holy Canon</h2>
            </header>

            <div className="flex px-6 gap-2 pt-2">
              {(['All', 'Old', 'New'] as const).map(tab => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`flex-1 py-2.5 rounded-xl text-[9px] uppercase tracking-widest font-black transition-all ${
                    activeTab === tab ? 'bg-[var(--gold)] text-black shadow-md' : 'bg-[var(--card-bg)] border border-theme text-[var(--text-muted)] hover:bg-[var(--gold-muted)]'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>

            <div className="p-6 space-y-2">
              {filteredBooks.map(book => (
                <button
                  key={book.id}
                  onClick={() => { onSelectBook(book.id); onClose(); }}
                  className="w-full flex items-center justify-between p-4 rounded-xl bg-[var(--card-bg)] border border-theme hover:border-[var(--gold)]/30 transition-all text-left group"
                >
                  <div>
                    <div className="text-[9px] text-[var(--text-muted)] uppercase tracking-tighter">{book.category}</div>
                    <div className="text-[var(--text-primary)] serif group-hover:text-[var(--gold)] transition-colors">{book.name}</div>
                  </div>
                  <Icons.ChevronRight className="text-[var(--text-muted)]" />
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );

  if (typeof document === 'undefined') {
    return null;
  }

  return createPortal(drawer, document.body);
};

export default LibraryDrawer;
