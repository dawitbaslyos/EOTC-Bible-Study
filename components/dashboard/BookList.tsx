
import React, { useState, useMemo, useEffect } from 'react';
import { Book, UserStats } from '../../types';
import { Icons } from '../../constants';
import { useAppLanguage } from '../../contexts/AppLanguageContext';
import { isAndroidNative } from '../../utils/appPermissions';
import { pushAndroidBackOverlay } from '../../utils/androidBackHandler';

interface Props {
  books: Book[];
  userStats: UserStats;
  onContinue: (bookId: string, chapter?: number) => void;
}

const BookList: React.FC<Props> = ({ books, userStats, onContinue }) => {
  const { t } = useAppLanguage();
  const [selectedBookForChapters, setSelectedBookForChapters] = useState<Book | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchActive, setIsSearchActive] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    if (!isAndroidNative() || !selectedBookForChapters) return;
    return pushAndroidBackOverlay(() => {
      setSelectedBookForChapters(null);
      return true;
    });
  }, [selectedBookForChapters]);

  const filteredAndSortedBooks = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    
    // Sort by recency, then name
    let result = [...books].sort((a, b) => {
      const aAccess = userStats.bookProgress[a.id]?.lastAccessed || 0;
      const bAccess = userStats.bookProgress[b.id]?.lastAccessed || 0;
      if (aAccess !== bAccess) return bAccess - aAccess;
      return a.name.localeCompare(b.name);
    });

    // Apply search filter
    const filtered = result.filter(b => {
      if (!q) return true;
      return b.name.toLowerCase().includes(q) || b.category.toLowerCase().includes(q);
    });

    // Ensure each book appears only once, even if data has duplicates
    const seen = new Set<string>();
    const unique: typeof filtered = [];
    for (const book of filtered) {
      if (seen.has(book.id)) continue;
      seen.add(book.id);
      unique.push(book);
    }

    return unique;
  }, [books, userStats.bookProgress, searchQuery]);

  const displayedBooks = useMemo(() => {
    if (isExpanded || searchQuery) return filteredAndSortedBooks;
    return filteredAndSortedBooks.slice(0, 5);
  }, [filteredAndSortedBooks, isExpanded, searchQuery]);

  return (
    <div className="lg:col-span-2 space-y-4">
      <div className="flex items-center justify-between mb-2 px-1">
         <div className="flex items-center space-x-2 text-[var(--gold)]">
           <Icons.Book />
           <h3 className="uppercase text-[10px] font-bold tracking-[0.2em]">{t('bookList.title')}</h3>
         </div>
         
         <div className="flex items-center space-x-2 md:space-x-3">
            <div className={`flex items-center transition-all duration-300 ${isSearchActive ? 'w-32 sm:w-48 opacity-100' : 'w-0 opacity-0 overflow-hidden'}`}>
              <input 
                type="text" 
                placeholder={t('bookList.findPlaceholder')}
                className="w-full bg-[var(--card-bg)] border border-theme rounded-full px-4 py-2 text-[10px] focus:outline-none focus:border-[var(--gold)]/30 text-[var(--text-primary)] placeholder:text-[var(--text-muted)] shadow-inner"
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
              className={`p-2 rounded-full transition-all ${isSearchActive ? 'text-[var(--gold)] bg-[var(--card-bg)]' : 'text-[var(--text-muted)] hover:text-[var(--gold)]'}`}
            >
              <Icons.Search />
            </button>
         </div>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-4 lg:max-h-[700px] lg:overflow-y-auto pr-0 md:pr-2 custom-scrollbar pb-10">
        {displayedBooks.map((book) => {
          const progress = userStats.bookProgress[book.id];
          const completedCount = progress ? progress.completedChapters.length : 0;
          const totalChaps = book.totalChapters || 1;
          const pct = Math.min(100, Math.floor((completedCount / totalChaps) * 100));

          return (
            <div 
              key={book.id} 
              className="bg-[var(--card-bg)] border border-theme p-5 md:p-6 rounded-[2rem] group hover:border-[var(--gold)]/40 transition-all flex flex-col shadow-md"
            >
              <div className="flex justify-between items-start mb-4">
                <div className="flex-1">
                  <div className="text-[9px] text-[var(--text-muted)] uppercase tracking-widest mb-1">{book.category}</div>
                  <h4 className="text-base md:text-lg serif text-[var(--text-primary)] group-hover:text-[var(--gold)] transition-colors leading-tight">{book.name}</h4>
                </div>
                <div className="text-[var(--gold)] text-xs font-black ml-2 tabular-nums">{pct}%</div>
              </div>
              
              <div className="flex-1">
                <div className="h-1.5 w-full bg-[var(--bg-primary)] rounded-full overflow-hidden mb-2 shadow-inner">
                  <div 
                    className={`h-full bg-[var(--gold)] rounded-full transition-all duration-1000 ease-out ${pct === 100 ? 'gold-glow' : ''}`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>

              <div className="mt-5 flex space-x-2">
                <button 
                  onClick={() => onContinue(book.id)}
                  className={`flex-1 py-3 rounded-full text-[10px] uppercase font-black tracking-widest transition-all shadow-md active:scale-95 ${
                    pct === 100 
                    ? 'bg-[var(--gold-muted)] border border-[var(--gold)]/20 text-[var(--gold)]'
                    : 'bg-[var(--gold)] text-black hover:bg-[#c0a030]'
                  }`}
                >
                  {pct === 100 ? t('bookList.revisit') : (completedCount > 0 ? t('bookList.continue') : t('bookList.start'))}
                </button>
                <button 
                  onClick={() => setSelectedBookForChapters(book)}
                  className="px-4 py-3 rounded-full border border-theme text-[var(--text-muted)] hover:text-[var(--gold)] hover:bg-[var(--gold-muted)] transition-all"
                >
                  <Icons.Menu />
                </button>
              </div>
            </div>
          );
        })}
        
        {filteredAndSortedBooks.length > 5 && !isExpanded && !searchQuery && (
          <button 
            onClick={() => setIsExpanded(true)}
            className="w-full py-8 border-2 border-dashed border-theme rounded-[2rem] text-[var(--text-muted)] hover:text-[var(--gold)] hover:border-[var(--gold)]/20 transition-all group flex flex-col items-center justify-center space-y-2"
          >
            <Icons.Library className="w-8 h-8 opacity-40 group-hover:opacity-100 transition-opacity" />
            <span className="text-[10px] uppercase font-black tracking-[0.3em]">{t('bookList.browseLibrary')}</span>
          </button>
        )}

        {filteredAndSortedBooks.length === 0 && (
          <div className="py-20 text-center opacity-30 text-xs uppercase tracking-[0.2em]">
            {t('bookList.noBooksFound')}
          </div>
        )}
      </div>

      {selectedBookForChapters && (
        <div className="fixed inset-0 z-[110] bg-black/95 backdrop-blur-xl flex items-center justify-center p-4 md:p-6 animate-in fade-in duration-300">
          <div className="bg-[var(--bg-secondary)] w-full max-w-xl rounded-[2.5rem] border border-theme p-6 md:p-10 shadow-2xl relative">
            <div className="flex justify-between items-start mb-6">
               <div>
                 <h3 className="serif text-2xl text-[var(--gold)] mb-1">{selectedBookForChapters.name}</h3>
                 <p className="text-[9px] text-[var(--text-muted)] uppercase tracking-widest">{t('bookList.selectChapter')}</p>
               </div>
               <button onClick={() => setSelectedBookForChapters(null)} className="p-3 bg-[var(--card-bg)] rounded-full text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors">
                 <Icons.Close />
               </button>
            </div>

            <div className="grid grid-cols-4 sm:grid-cols-6 gap-2 max-h-[50vh] overflow-y-auto pr-2 custom-scrollbar">
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
                    className={`aspect-square rounded-xl flex items-center justify-center transition-all font-bold text-sm ${
                      isCompleted 
                        ? 'bg-[var(--gold-muted)] border border-[var(--gold)]/40 text-[var(--gold)]' 
                        : 'bg-[var(--card-bg)] border border-theme text-[var(--text-muted)] hover:text-[var(--gold)]'
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
