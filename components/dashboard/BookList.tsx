
import React, { useState } from 'react';
import { Book, UserStats } from '../../types';
import { Icons } from '../../constants';

interface Props {
  books: Book[];
  userStats: UserStats;
  onContinue: (bookId: string, chapter?: number) => void;
}

const BookList: React.FC<Props> = ({ books, userStats, onContinue }) => {
  const [selectedBookForChapters, setSelectedBookForChapters] = useState<Book | null>(null);

  return (
    <div className="lg:col-span-2 space-y-4">
      <div className="flex items-center justify-between mb-2">
         <div className="flex items-center space-x-2 text-[#d4af37]">
           <Icons.Book />
           <h3 className="uppercase text-xs font-bold tracking-widest">Spiritual Library</h3>
         </div>
         <div className="text-xs text-gray-500">
           {Object.keys(userStats.bookProgress).length} / 81 Books Started
         </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 h-[500px] overflow-y-auto pr-2 custom-scrollbar pb-10">
        {books.map((book) => {
          const progress = userStats.bookProgress[book.id];
          const completedCount = progress ? progress.completedChapters.length : 0;
          const pct = Math.floor((completedCount / book.totalChapters) * 100);
          
          return (
            <div 
              key={book.id} 
              className="bg-white/5 border border-white/10 p-5 rounded-3xl group hover:border-[#d4af37]/40 transition-all flex flex-col"
            >
              <div className="flex justify-between items-start mb-4">
                <div className="flex-1">
                  <div className="text-[10px] text-gray-500 uppercase tracking-widest mb-1">{book.category}</div>
                  <h4 className="text-lg serif group-hover:text-[#d4af37] transition-colors">{book.name}</h4>
                </div>
                <div className="text-[#d4af37] text-sm font-bold ml-2">{pct}%</div>
              </div>
              
              <div className="flex-1">
                <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden mb-2">
                  <div 
                    className="h-full bg-[#d4af37] rounded-full transition-all duration-1000" 
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <div className="text-[10px] text-gray-500 uppercase flex justify-between">
                  <span>Progress</span>
                  <span>{completedCount} / {book.totalChapters} Ch.</span>
                </div>
              </div>

              <div className="mt-4 flex space-x-2">
                <button 
                  onClick={() => onContinue(book.id)}
                  className="flex-1 py-2.5 rounded-xl bg-[#d4af37] text-black text-[10px] uppercase font-bold tracking-widest hover:bg-[#c0a030] transition-all"
                >
                  {completedCount > 0 ? 'Continue' : 'Start'}
                </button>
                <button 
                  onClick={() => setSelectedBookForChapters(book)}
                  className="px-4 py-2.5 rounded-xl border border-white/10 text-[10px] uppercase font-bold tracking-widest hover:bg-white/5 transition-all text-gray-400"
                  title="Select Chapter"
                >
                  <Icons.Menu />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Chapter Selection Modal */}
      {selectedBookForChapters && (
        <div className="fixed inset-0 z-[110] bg-black/80 backdrop-blur-md flex items-center justify-center p-6 animate-in fade-in duration-300">
          <div className="bg-[#111] w-full max-w-xl rounded-[3rem] border border-white/10 p-10 shadow-2xl animate-in zoom-in-95 duration-500 relative overflow-hidden">
            {/* Background Decoration */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-[#d4af37]/5 rounded-full blur-[100px] -mr-32 -mt-32" />
            
            <div className="relative z-10">
              <div className="flex justify-between items-start mb-8">
                 <div>
                   <h3 className="serif text-3xl text-[#d4af37] mb-1">{selectedBookForChapters.name}</h3>
                   <p className="text-[10px] uppercase tracking-widest text-gray-500">Select a Scroll Chapter</p>
                 </div>
                 <button 
                   onClick={() => setSelectedBookForChapters(null)} 
                   className="p-3 bg-white/5 rounded-full hover:bg-white/10 transition-colors"
                 >
                   <Icons.Close />
                 </button>
              </div>

              <div className="grid grid-cols-5 sm:grid-cols-6 gap-3 max-h-[400px] overflow-y-auto pr-4 custom-scrollbar">
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
                      className={`aspect-square rounded-2xl flex flex-col items-center justify-center transition-all relative group ${
                        isCompleted ? 'bg-[#d4af37]/20 border border-[#d4af37]/30 text-[#d4af37]' : 
                        'bg-white/5 border border-white/5 text-gray-500 hover:border-[#d4af37]/40 hover:text-white'
                      }`}
                    >
                      <span className="text-xl font-bold serif">{num}</span>
                      {isCompleted && (
                        <div className="absolute top-2 right-2 w-1.5 h-1.5 bg-[#d4af37] rounded-full shadow-[0_0_5px_#d4af37]" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BookList;
