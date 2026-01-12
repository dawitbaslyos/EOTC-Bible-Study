
import React, { useState, useEffect } from 'react';
import { Icons } from '../constants';
import { useProgress } from '../hooks/useProgress';
import Heatmap from './dashboard/Heatmap';
import BookList from './dashboard/BookList';
import LibraryDrawer from './LibraryDrawer';
import { Book, Quote } from '../types';
import { getEthiopianDate, EthiopianDate } from '../utils/ethiopianCalendar';

interface Props {
  onStart: (bookId: string, isDailyWudase: boolean, chapter?: number) => void;
  onOpenMemhir: () => void;
  quote?: Quote;
}

const Dashboard: React.FC<Props> = ({ onStart, onOpenMemhir, quote }) => {
  const { stats, getHeatmapData } = useProgress();
  const [books, setBooks] = useState<Book[]>([]);
  const [saints, setSaints] = useState<Record<string, string>>({});
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [ethDate, setEthDate] = useState<EthiopianDate>(getEthiopianDate());
  const heatmapData = getHeatmapData(); 

  useEffect(() => {
    const timer = setInterval(() => {
      setEthDate(getEthiopianDate());
    }, 3600000);

    fetch('./data/saints.json')
      .then(res => res.json())
      .then(setSaints)
      .catch(err => console.error("Error loading saints:", err));

    fetch('./data/80-weahadu.json')
      .then(res => res.json())
      .then(data => setBooks(data))
      .catch(err => console.error("Error loading books:", err));

    return () => clearInterval(timer);
  }, []);

  return (
    <div className="flex-1 flex flex-col p-4 md:p-6 space-y-6 animate-in fade-in slide-in-from-bottom-5 duration-1000 overflow-x-hidden">
      {/* Top Navigation */}
      <div className="relative flex items-center justify-between py-2 md:py-4">
        <button 
          onClick={() => setIsDrawerOpen(true)}
          className="p-3 bg-white/5 rounded-2xl border border-white/10 text-[#d4af37] hover:scale-105 transition-all z-10"
        >
          <Icons.Library />
        </button>
        <h1 className="text-2xl md:text-3xl serif gold-glow tracking-[0.2em] md:tracking-[0.3em] text-[#d4af37] font-bold">SENAY</h1>
        <button 
          onClick={onOpenMemhir}
          className="p-3 bg-[#d4af37]/10 rounded-2xl border border-[#d4af37]/20 text-[#d4af37] hover:scale-105 transition-all group"
          title="Ask Memhir"
        >
          <Icons.Message />
        </button>
      </div>

      <div className="flex flex-col items-center space-y-2 pb-2">
        <h2 className="text-lg md:text-xl serif text-white text-center italic max-w-lg leading-relaxed opacity-90 px-4">
          "{quote?.text || "The Word is a lamp to my feet and a light to my path."}"
        </h2>
        <div className="flex items-center space-x-3 text-gray-600">
          <div className="h-px w-6 md:w-8 bg-white/10"></div>
          <span className="text-[9px] uppercase tracking-[0.2em] font-light">
            {quote?.source || "Daily Quote"}
          </span>
          <div className="h-px w-6 md:w-8 bg-white/10"></div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
        <div className="lg:col-span-1 space-y-6">
          {/* Calendar Card Polished & Compact - Mobile Optimized */}
          <div className="bg-white/[0.03] border border-white/10 rounded-[2.5rem] md:rounded-[3rem] p-6 md:p-8 relative overflow-hidden shadow-2xl transition-all duration-700 hover:bg-white/[0.04]">
            <div className="absolute top-0 right-0 w-24 h-24 bg-[#d4af37]/5 blur-3xl -mr-12 -mt-12 rounded-full opacity-30" />
            
            <div className="flex flex-col mb-4 md:mb-6 relative z-10">
              <span className="text-[10px] md:text-[11px] font-bold text-gray-500 tracking-[0.3em] uppercase mb-0.5">
                {ethDate.year} • {ethDate.yearName.replace("Year of St. ", "")}
              </span>
              <span className="text-2xl md:text-3xl text-[#d4af37] font-black uppercase tracking-[0.4em] block leading-tight">
                {ethDate.monthName}
              </span>
            </div>

            <div className="flex flex-col items-start mb-6 relative z-10">
              <div className="flex items-center space-x-4 md:space-x-5">
                <span className="text-6xl md:text-7xl font-light serif text-white/95 tracking-tighter leading-none">
                  {ethDate.day}
                </span>
                <div className="flex flex-col border-l border-white/10 pl-4 md:pl-5 py-1">
                   <span className="text-[6px] uppercase tracking-[0.4em] text-[#d4af37] font-black mb-1 opacity-30">Commemorating</span>
                   <span className="text-base md:text-lg text-white/80 serif italic leading-tight max-w-[120px] md:max-w-[140px] tracking-tight">
                    {saints[ethDate.day.toString()] || "All Saints"}
                  </span>
                </div>
              </div>
            </div>

            <div className="pt-6 md:pt-8 border-t border-white/5 relative z-10">
              <div className="flex items-center justify-between mb-4">
                 <span className="text-[8px] uppercase tracking-[0.3em] text-gray-600 font-black">Spiritual Momentum</span>
              </div>
              <Heatmap data={heatmapData} />
            </div>
          </div>

          <button 
            onClick={() => onStart('wudase', true)}
            className="w-full bg-[#d4af37] text-black font-bold py-5 md:py-7 rounded-[2.5rem] md:rounded-[3rem] shadow-2xl hover:bg-[#c0a030] hover:scale-[1.02] transition-all flex flex-col items-center justify-center group active:scale-95"
          >
            <span className="text-xl md:text-2xl serif mb-1">Daily Wudase</span>
            <span className="text-[8px] md:text-[9px] uppercase tracking-widest opacity-60 font-black">Open Praises</span>
          </button>
        </div>

        <BookList 
          books={books} 
          userStats={stats} 
          onContinue={(id, chapter) => onStart(id, false, chapter)} 
        />
      </div>

      <LibraryDrawer 
        isOpen={isDrawerOpen} 
        onClose={() => setIsDrawerOpen(false)} 
        books={books} 
        onSelectBook={(id) => onStart(id, false)} 
      />
    </div>
  );
};

export default Dashboard;
