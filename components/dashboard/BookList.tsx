
import React, { useState, useMemo } from 'react';
import { Book, UserStats } from '../../types';
import { Icons } from '../../constants';

interface Props {
  books: Book[];
  userStats: UserStats;
  onContinue: (bookId: string, chapter?: number) => void;
}

const BookList: React.FC<Props> = ({ books, userStats, onContinue }) => {
  const [selectedBookForChapters, setSelectedBookForChapters] = useState<Book | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchActive, setIsSearchActive] = useState(false);

  const filteredAndSortedBooks = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    
    return [...books].sort((a, b) => {
      if (q) {
        const aExact = a.name.toLowerCase().startsWith(q);
        const bExact = b.name.toLowerCase().startsWith(q);
        if (aExact && !bExact) return -1;
        if (!aExact && bExact) return 1;

        const aMatch = a.name.toLowerCase().includes(q) || a.category.toLowerCase().includes(q);
        const bMatch = b.name.toLowerCase().includes(q) || b.category.toLowerCase().includes(q);
        if (aMatch && !bMatch) return -1;
        if (!aMatch && bMatch) return 1;
      }

      const aAccess = userStats.bookProgress[a.id]?.lastAccessed || 0;
      const bAccess = userStats.bookProgress[b.id]?.lastAccessed || 0;
      if (aAccess !== bAccess) return bAccess - aAccess;

      return a.name.localeCompare(b.name);
    }).filter(b => {
      if (!q) return true;
      return b.name.toLowerCase().includes(q) || b.category.toLowerCase().includes(q);
    });
  }, [books, userStats.bookProgress, searchQuery]);

  return (
    <div className="lg:col-span-2 space-y-4">
      <div className="flex items-center justify-between mb-2 px-1">
         <div className="flex items-center space-x-2 text-[#d4af37]">
           <Icons.Book />
           <h3 className="uppercase text-[10px] font-bold tracking-[0.2em]">Spiritual Library</h3>
         </div>
         
         <div className="flex items-center space-x-2 md:space-x-3">
            <div className={`flex items-center transition-all duration-300 ${isSearchActive ? 'w-32 sm:w-48 opacity-100' : 'w-0 opacity-0 overflow-hidden'}`}>
              <input 
                type="text" 
                placeholder="Find a Scroll..." 
                className="w-full bg-white/5 border border-white/10 rounded-full px-3 py-1.5 text-[10px] focus:outline-none focus:border-[#d4af37]/50 text-white placeholder:text-gray-600"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                autoFocus={isSearchActive}
              />
            </div>
            <button 
              onClick={() => {
                setIsSearchActive(!isSearchActive);
                if (isSearchActive) setSearchQuery('');
              }}
              className={`p-2 rounded-full transition-all ${isSearchActive ? 'text-[#d4af37] bg-white/5' : 'text-gray-600 hover:text-[#d4af37]'}`}
            >
              <Icons.Search />
            </button>
         </div>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-4 lg:h-[600px] lg:overflow-y-auto pr-0 md:pr-2 custom-scrollbar pb-10">
        {filteredAndSortedBooks.map((book) => {
          const progress = userStats.bookProgress[book.id];
          const completedCount = progress ? progress.completedChapters.length : 0;
          const pct = Math.floor((completedCount / book.totalChapters) * 100);

          return (
            <div 
              key={book.id} 
              className="bg-white/5 border border-white/10 p-5 md:p-6 rounded-[2rem] group hover:border-[#d4af37]/40 transition-all flex flex-col shadow-xl"
            >
              <div className="flex justify-between items-start mb-4">
                <div className="flex-1">
                  <div className="text-[9px] text-gray-500 uppercase tracking-widest mb-1">{book.category}</div>
                  <h4 className="text-base md:text-lg serif group-hover:text-[#d4af37] transition-colors leading-tight">{book.name}</h4>
                </div>
                <div className="text-[#d4af37] text-sm font-bold ml-2">{pct}%</div>
              </div>
              
              <div className="flex-1">
                <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden mb-2">
                  <div 
                    className="h-full bg-[#d4af37] rounded-full transition-all duration-1000" 
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <div className="text-[9px] text-gray-500 uppercase flex justify-between">
                  <span>Progress</span>
                  <span className="text-gray-400">{completedCount} / {book.totalChapters} Chapters</span>
                </div>
              </div>

              <div className="mt-5 flex space-x-2">
                <button 
                  onClick={() => onContinue(book.id)}
                  className="flex-1 py-3 md:py-4 rounded-2xl bg-[#d4af37] text-black text-[10px] uppercase font-black tracking-widest hover:bg-[#c0a030] transition-all shadow-lg active:scale-95"
                >
                  {completedCount > 0 ? 'Continue' : 'Start Reading'}
                </button>
                <button 
                  onClick={() => setSelectedBookForChapters(book)}
                  className="px-4 py-3 md:py-4 rounded-2xl border border-white/5 text-gray-400 hover:text-[#d4af37] hover:bg-white/5 transition-all active:scale-95"
                >
                  <Icons.Menu />
                </button>
              </div>
            </div>
          );
        })}
        
        {filteredAndSortedBooks.length === 0 && (
          <div className="py-20 text-center opacity-30 text-xs uppercase tracking-[0.2em]">
            No scrolls found in this library
          </div>
        )}
      </div>

      {selectedBookForChapters && (
        <div className="fixed inset-0 z-[110] bg-black/95 backdrop-blur-xl flex items-center justify-center p-4 md:p-6 animate-in fade-in duration-300">
          <div className="bg-[#0e0e11] w-full max-w-xl rounded-[2.5rem] md:rounded-[3rem] border border-white/10 p-6 md:p-10 shadow-2xl relative overflow-hidden">
            <div className="flex justify-between items-start mb-6 md:mb-10">
               <div>
                 <h3 className="serif text-2xl md:text-3xl text-[#d4af37] mb-1">{selectedBookForChapters.name}</h3>
                 <p className="text-[9px] text-gray-500 uppercase tracking-widest">Select Chapter Scroll</p>
               </div>
               <button onClick={() => setSelectedBookForChapters(null)} className="p-3 bg-white/5 rounded-full text-gray-500 hover:text-white transition-colors">
                 <Icons.Close />
               </button>
            </div>

            <div className="grid grid-cols-4 sm:grid-cols-6 gap-2 md:gap-3 max-h-[50vh] overflow-y-auto pr-2 custom-scrollbar">
              {Array.from({ length: selectedBookForChapters.totalChapters }).map((_, i) => {
                const num = i + 1;
                const isCompleted = userStats.bookProgress[selectedBookForChapters.id]?.completedChapters.includes(num);
                return (
                  <button
                    key={num}
                    onClick={() => {
                      onContinue(selectedBookForChapters.id, num);
                      setSelectedBookForChapters(null);
                    }}
                    className={`aspect-square rounded-xl md:rounded-2xl flex items-center justify-center transition-all font-bold text-sm md:text-base ${
                      isCompleted 
                        ? 'bg-[#d4af37]/20 border border-[#d4af37]/40 text-[#d4af37]' 
                        : 'bg-white/5 border border-white/5 text-gray-600 hover:text-[#d4af37] hover:border-[#d4af37]/50'
                    }`}
                  >
                    {num}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BookList;
