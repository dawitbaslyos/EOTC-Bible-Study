
import React, { useState } from 'react';
import { Icons } from '../constants';
import { Book, Testament } from '../types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  books: Book[];
  onSelectBook: (bookId: string) => void;
}

const LibraryDrawer: React.FC<Props> = ({ isOpen, onClose, books, onSelectBook }) => {
  const [activeTab, setActiveTab] = useState<Testament>('Old');

  const filteredBooks = books.filter(b => b.testament === activeTab);

  return (
    <>
      {/* Overlay */}
      <div 
        className={`fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] transition-opacity duration-500 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={onClose}
      />
      
      {/* Drawer */}
      <div 
        className={`fixed top-0 left-0 h-full w-full max-w-sm bg-[#0a0a0c] border-r border-white/10 z-[101] transition-transform duration-500 ease-out ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}
      >
        <div className="flex flex-col h-full">
          <header className="p-6 border-b border-white/10 flex justify-between items-center">
            <h2 className="text-xl serif text-[#d4af37]">The 81-Book Canon</h2>
            <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-full transition-colors text-gray-500">
              <Icons.Close />
            </button>
          </header>

          <div className="flex p-4 gap-2">
            {(['Old', 'New'] as const).map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex-1 py-3 rounded-xl text-xs uppercase tracking-widest font-bold transition-all ${
                  activeTab === tab ? 'bg-[#d4af37] text-black shadow-lg shadow-[#d4af37]/20' : 'bg-white/5 text-gray-500 hover:bg-white/10'
                }`}
              >
                {tab} Testament
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
                  <div className="text-[9px] text-gray-600 uppercase tracking-tighter">{book.category}</div>
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
    </>
  );
};

export default LibraryDrawer;
