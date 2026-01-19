
import React, { useState, useEffect, useRef } from 'react';
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
}

const LibraryDrawer: React.FC<Props> = ({ isOpen, onClose, books, onSelectBook, userProfile, userStats, onLogout, daysPracticed }) => {
  const [activeTab, setActiveTab] = useState<Testament>('All');
  const [showSubscription, setShowSubscription] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [dragOffset, setDragOffset] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [imageError, setImageError] = useState(false);
  
  const drawerRef = useRef<HTMLDivElement>(null);
  const touchStartX = useRef(0);
  
  const filteredBooks = books.filter(b => {
    if (activeTab === 'All') return true;
    return b.testament.toLowerCase() === activeTab.toLowerCase();
  });

  useEffect(() => {
    if (isMenuOpen) {
      const handleGlobalClick = () => setIsMenuOpen(false);
      window.addEventListener('click', handleGlobalClick);
      return () => window.removeEventListener('click', handleGlobalClick);
    }
  }, [isMenuOpen]);

  useEffect(() => {
    setImageError(false);
  }, [userProfile?.photoURL]);

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

  const SilhouettePlaceholder = () => (
    <div className="w-full h-full bg-gray-800 flex items-center justify-center rounded-full text-gray-500">
      <svg width="60%" height="60%" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
      </svg>
    </div>
  );

  const totalReflections = (Object.values(userStats?.studyHistory || {}) as number[]).reduce((a, b) => a + b, 0);
  const activeScrolls = (Object.values(userStats?.bookProgress || {}) as BookProgress[]).filter(p => p.completedChapters.length > 0).length;
  
  return (
    <>
      <div 
        className={`fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] transition-opacity duration-500 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={onClose}
      />
      
      <div 
        ref={drawerRef}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        className={`fixed top-0 left-0 h-full w-full max-w-sm bg-[#0a0a0c] border-r border-white/10 z-[101] overflow-hidden select-none transition-transform duration-500 ease-out`}
        style={{ 
          transform: isOpen 
            ? `translateX(${dragOffset}px)` 
            : `translateX(-100%)`,
          transition: isDragging ? 'none' : 'transform 0.5s ease-out'
        }}
      >
        <div className="flex flex-col h-full">
          <div className="p-8 border-b border-white/10 bg-white/[0.02] relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-[#d4af37]/5 blur-3xl -mr-16 -mt-16 rounded-full opacity-50" />
            
            <div className="relative z-10 flex items-center space-x-4 mb-6">
               <div className="relative">
                  <div className="w-16 h-16 rounded-full border-2 border-[#d4af37]/30 p-1 shadow-lg group-hover:border-[#d4af37] transition-all overflow-hidden flex items-center justify-center bg-white/5">
                    {userProfile?.photoURL && !imageError ? (
                      <img 
                        src={userProfile.photoURL} 
                        alt="Profile" 
                        className="w-full h-full rounded-full object-cover"
                        onError={() => setImageError(true)}
                      />
                    ) : (
                      <SilhouettePlaceholder />
                    )}
                  </div>
                  <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-[#d4af37] rounded-full flex items-center justify-center text-black border-2 border-[#0a0a0c] scale-0 group-hover:scale-100 transition-transform">
                    <Icons.Feather />
                  </div>
               </div>
               
               <div className="flex-1">
                  <h3 className="serif text-xl text-white group-hover:text-[#d4af37] transition-colors truncate max-w-[140px]">{userProfile?.name || 'Spiritual Seeker'}</h3>
                  <button 
                    onClick={() => setShowSubscription(true)}
                    className="flex items-center space-x-1.5 mt-1 px-3 py-1 bg-[#d4af37]/10 border border-[#d4af37]/30 rounded-full hover:bg-[#d4af37]/20 transition-all active:scale-95 group/premium"
                  >
                    <span className="w-1.5 h-1.5 bg-[#d4af37] rounded-full animate-pulse" />
                    <span className="text-[9px] uppercase tracking-[0.15em] font-black text-[#d4af37]">Go Premium</span>
                  </button>
               </div>

               <div className="relative">
                 <button 
                   onClick={(e) => {
                     e.stopPropagation();
                     setIsMenuOpen(!isMenuOpen);
                   }}
                   className="p-3 bg-white/5 rounded-2xl border border-white/5 text-gray-500 hover:text-[#d4af37] transition-all active:scale-90"
                   title="Account Options"
                 >
                   <Icons.MoreVertical />
                 </button>

                 {isMenuOpen && (
                   <div className="absolute top-full right-0 mt-2 w-40 bg-[#121214] border border-white/10 rounded-2xl shadow-2xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                     <button 
                       onClick={() => setShowLogoutConfirm(true)}
                       className="w-full flex items-center space-x-3 px-4 py-4 text-xs font-bold text-red-400 hover:bg-white/5 transition-colors text-left"
                     >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
                        <span>Sign Out</span>
                     </button>
                   </div>
                 )}
               </div>
            </div>

            <div className="flex items-center justify-between px-2">
               <div className="text-center">
                  <div className="text-sm font-bold text-white">{activeScrolls}</div>
                  <div className="text-[7px] uppercase tracking-widest text-gray-600 font-bold">Scrolls</div>
               </div>
               <div className="h-6 w-px bg-white/10" />
               <div className="text-center">
                  <div className="text-sm font-bold text-white">
                    {totalReflections}
                  </div>
                  <div className="text-[7px] uppercase tracking-widest text-gray-600 font-bold">Reflections</div>
               </div>
               <div className="h-6 w-px bg-white/10" />
               <div className="text-center">
                  <div className="text-sm font-bold text-white">{daysPracticed || 0}</div>
                  <div className="text-[7px] uppercase tracking-widest text-gray-600 font-bold">Days</div>
               </div>
            </div>
          </div>

          <header className="p-6 pb-2 flex justify-between items-center">
            <h2 className="text-xs uppercase tracking-[0.3em] font-black text-gray-700">The 81-Book Canon</h2>
          </header>

          <div className="flex p-4 gap-2 pt-2">
            {(['All', 'Old', 'New'] as const).map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex-1 py-3 rounded-xl text-[9px] uppercase tracking-widest font-black transition-all ${
                  activeTab === tab ? 'bg-[#d4af37] text-black shadow-lg shadow-[#d4af37]/20' : 'bg-white/5 text-gray-500 hover:bg-white/10'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-2 custom-scrollbar">
            {filteredBooks.map(book => (
              <button
                key={book.id}
                onClick={() => { onSelectBook(book.id); onClose(); }}
                className="w-full flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/5 hover:border-[#d4af37]/30 group transition-all"
              >
                <div className="text-left">
                  <div className="text-[9px] text-gray-500 uppercase tracking-tighter">{book.category}</div>
                  <div className="text-gray-200 group-hover:text-[#d4af37] transition-colors serif">{book.name}</div>
                </div>
                <div className="text-gray-700 group-hover:text-[#d4af37]/50">
                  <Icons.ChevronRight />
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {showLogoutConfirm && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 animate-in fade-in duration-300">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={() => setShowLogoutConfirm(false)} />
          <div className="relative w-full max-w-xs bg-[#121214] border border-white/10 rounded-[2.5rem] p-8 overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300">
            <div className="flex flex-col items-center text-center space-y-6">
              <div className="w-16 h-16 bg-red-400/10 rounded-full flex items-center justify-center text-red-400">
                <Icons.Lotus />
              </div>
              <div className="space-y-2">
                <h3 className="serif text-xl text-white">End Session?</h3>
                <p className="text-xs text-gray-500 px-4">Your spiritual progress is safe, but you will need to sign in again.</p>
              </div>
              <div className="flex flex-col w-full space-y-3">
                <button 
                  onClick={onLogout}
                  className="w-full bg-red-500 text-white font-black py-4 rounded-full shadow-lg shadow-red-500/20 transition-all text-[10px] uppercase tracking-widest"
                >
                  Confirm Sign Out
                </button>
                <button 
                  onClick={() => setShowLogoutConfirm(false)}
                  className="w-full bg-white/5 text-gray-400 font-bold py-4 rounded-full hover:bg-white/10 transition-all text-[10px] uppercase tracking-widest"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showSubscription && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 animate-in fade-in duration-300">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={() => setShowSubscription(false)} />
          <div className="relative w-full max-w-sm bg-[#121214] border border-[#d4af37]/20 rounded-[3rem] p-10 overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[#d4af37] to-transparent" />
            <div className="flex flex-col items-center text-center space-y-6">
              <div className="w-20 h-20 bg-[#d4af37]/10 rounded-full flex items-center justify-center text-[#d4af37] relative">
                <Icons.Lotus />
                <div className="absolute inset-0 bg-[#d4af37]/20 rounded-full animate-ping opacity-20" />
              </div>
              <div className="space-y-2">
                <h3 className="serif text-2xl text-white">Support the Sanctuary</h3>
                <p className="text-xs text-gray-500 leading-relaxed px-4">Unlock limitless reflections, deeper Andimta insights, and preserve the sacred digital scrolls.</p>
              </div>
              <div className="w-full py-6 px-8 bg-white/5 rounded-3xl border border-white/5 space-y-1">
                <div className="text-[10px] uppercase tracking-widest text-[#d4af37] font-black">Spiritual Premium</div>
                <div className="text-4xl font-light text-white">$4.99 <span className="text-xs text-gray-500 font-bold uppercase tracking-tighter">/ Year</span></div>
              </div>
              <button 
                onClick={() => {
                  alert("Thank you for your devotion! Subscription processed (Simulation).");
                  setShowSubscription(false);
                }}
                className="w-full bg-[#d4af37] text-black font-black py-5 rounded-full shadow-xl shadow-[#d4af37]/20 hover:bg-[#c0a030] hover:scale-[1.02] transition-all active:scale-95 text-xs uppercase tracking-[0.2em]"
              >
                Subscribe Now
              </button>
              <button onClick={() => setShowSubscription(false)} className="text-[9px] uppercase tracking-widest text-gray-600 hover:text-gray-400 transition-colors font-bold">Continue for free</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default LibraryDrawer;
