
import React, { useState, useEffect } from 'react';
import { Icons, SAINT_OF_THE_DAY } from '../constants';
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
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [ethDate, setEthDate] = useState<EthiopianDate>(getEthiopianDate());
  const heatmapData = getHeatmapData(); 

  useEffect(() => {
    const timer = setInterval(() => {
      setEthDate(getEthiopianDate());
    }, 3600000);

    fetch('./80-weahadu.json')
      .then(res => res.json())
      .then(data => setBooks(data))
      .catch(err => console.error("Error loading books:", err));

    return () => clearInterval(timer);
  }, []);

  return (
    <div className="flex-1 flex flex-col p-6 space-y-6 animate-in fade-in slide-in-from-bottom-5 duration-1000">
      {/* Top Navigation */}
      <div className="relative flex items-center justify-between py-4">
        <button 
          onClick={() => setIsDrawerOpen(true)}
          className="p-3 bg-white/5 rounded-2xl border border-white/10 text-[#d4af37] hover:scale-105 transition-all z-10"
        >
          <Icons.Library />
        </button>
        <h1 className="text-3xl serif gold-glow tracking-[0.3em] text-[#d4af37] font-bold">SENAY</h1>
        <button 
          onClick={onOpenMemhir}
          className="p-3 bg-[#d4af37]/10 rounded-2xl border border-[#d4af37]/20 text-[#d4af37] hover:scale-105 transition-all group"
          title="Ask Memhir"
        >
          <Icons.Message />
        </button>
      </div>

      <div className="flex flex-col items-center space-y-2 pb-4">
        <h2 className="text-xl serif text-white text-center italic max-w-lg leading-relaxed opacity-90 px-4">
          "{quote?.text || "The Word is a lamp to my feet and a light to my path."}"
        </h2>
        <div className="flex items-center space-x-3 text-gray-500">
          <div className="h-px w-8 bg-white/10"></div>
          <span className="text-[10px] uppercase tracking-[0.2em] font-light">
            {quote?.source || "Daily Quote"}
          </span>
          <div className="h-px w-8 bg-white/10"></div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white/5 border border-white/10 rounded-[2.5rem] p-8 relative overflow-hidden shadow-2xl">
            <div className="flex justify-between items-start mb-1">
              <span className="text-[11px] text-[#d4af37] font-bold uppercase tracking-widest opacity-80">
                [{ethDate.monthName} • {ethDate.year}]
              </span>
              <span className="text-[10px] text-gray-500 uppercase tracking-tighter">saint of the day</span>
            </div>
            <div className="flex justify-between items-start mb-6">
              <span className="text-[13px] text-white/60 serif italic font-light">{ethDate.yearName}</span>
            </div>
            <div className="flex justify-between items-end mb-8">
              <span className="text-6xl font-light serif leading-none tracking-tighter text-white/90">Day {ethDate.day}</span>
              <span className="text-xl text-white font-semibold serif italic opacity-90 border-b border-[#d4af37]/20 pb-1 max-w-[50%] text-right leading-tight">
                "{SAINT_OF_THE_DAY[ethDate.day] || "All Saints"}"
              </span>
            </div>
            <Heatmap data={heatmapData} />
          </div>

          <button 
            onClick={() => onStart('wudase', true)}
            className="w-full bg-[#d4af37] text-black font-bold py-7 rounded-[2.5rem] shadow-2xl hover:bg-[#c0a030] hover:scale-[1.02] transition-all flex flex-col items-center justify-center group"
          >
            <span className="text-2xl serif mb-1">Daily Wudase</span>
            <span className="text-[9px] uppercase tracking-widest opacity-60">Seek Thy Praises</span>
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
