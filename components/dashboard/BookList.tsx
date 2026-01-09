
import React from 'react';
import { Book, UserStats } from '../../types';
import { Icons } from '../../constants';

interface Props {
  books: Book[];
  userStats: UserStats;
  onContinue: (bookId: string) => void;
}

const BookList: React.FC<Props> = ({ books, userStats, onContinue }) => {
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
                <div>
                  <div className="text-[10px] text-gray-500 uppercase tracking-widest mb-1">{book.category}</div>
                  <h4 className="text-lg serif group-hover:text-[#d4af37] transition-colors">{book.name}</h4>
                </div>
                <div className="text-[#d4af37] text-sm font-bold">{pct}%</div>
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

              <button 
                onClick={() => onContinue(book.id)}
                className="mt-4 w-full py-2.5 rounded-xl border border-white/10 text-[10px] uppercase font-bold tracking-widest hover:bg-[#d4af37] hover:text-black hover:border-[#d4af37] transition-all"
              >
                {completedCount > 0 ? 'Continue Reading' : 'Open Scroll'}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default BookList;
