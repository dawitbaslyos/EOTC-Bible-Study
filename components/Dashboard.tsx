
import React, { useState, useEffect, useMemo } from 'react';
import { Icons } from '../constants';
import { useProgress } from '../hooks/useProgress';
import Heatmap from './dashboard/Heatmap';
import BookList from './dashboard/BookList';
import LibraryDrawer from './LibraryDrawer';
import { Book, Quote, FastingSeason, EthiopianHoliday } from '../types';
import { getEthiopianDate, EthiopianDate } from '../utils/ethiopianCalendar';

interface Props {
  onStart: (bookId: string, isDailyWudase: boolean, chapter?: number) => void;
  onOpenMemhir: () => void;
  quote?: Quote;
  userProfile?: any;
  onLogout: () => void;
  isDrawerOpen: boolean;
  setIsDrawerOpen: (open: boolean) => void;
}

const Dashboard: React.FC<Props> = ({ 
  onStart, 
  onOpenMemhir, 
  quote, 
  userProfile, 
  onLogout,
  isDrawerOpen,
  setIsDrawerOpen
}) => {
  const { stats, getHeatmapData, daysPracticed } = useProgress();
  const [books, setBooks] = useState<Book[]>([]);
  const [saints, setSaints] = useState<Record<string, string>>({});
  const [fastingSeasons, setFastingSeasons] = useState<FastingSeason[]>([]);
  const [holidays, setHolidays] = useState<EthiopianHoliday[]>([]);
  const [ethDate, setEthDate] = useState<EthiopianDate>(getEthiopianDate());
  
  const [heatmapViewDate, setHeatmapViewDate] = useState(new Date());
  const heatmapData = getHeatmapData(heatmapViewDate, fastingSeasons); 

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

    fetch('./data/fasting-seasons.json')
      .then(res => res.json())
      .then(setFastingSeasons)
      .catch(err => console.error("Error loading fasting seasons:", err));

    fetch('./data/holidays.json')
      .then(res => res.json())
      .then(setHolidays)
      .catch(err => console.error("Error loading holidays:", err));

    return () => clearInterval(timer);
  }, []);

  const changeHeatmapMonth = (offset: number) => {
    const nextDate = new Date(heatmapViewDate);
    nextDate.setMonth(heatmapViewDate.getMonth() + offset);
    setHeatmapViewDate(nextDate);
  };

  const resetToToday = () => {
    setHeatmapViewDate(new Date());
  };

  const isViewingCurrentMonth = useMemo(() => {
    const today = new Date();
    return heatmapViewDate.getMonth() === today.getMonth() && 
           heatmapViewDate.getFullYear() === today.getFullYear();
  }, [heatmapViewDate]);

  const activeFastingSeason = useMemo(() => {
    if (!fastingSeasons.length) return null;
    
    return fastingSeasons.find(season => {
      const { ethStartMonth, ethStartDay, ethEndMonth, ethEndDay } = season;
      const current = ethDate.month * 100 + ethDate.day;
      const start = ethStartMonth * 100 + ethStartDay;
      const end = ethEndMonth * 100 + ethEndDay;

      if (start <= end) {
        return current >= start && current <= end;
      } else {
        return current >= start || current <= end;
      }
    });
  }, [ethDate, fastingSeasons]);

  const todayHoliday = useMemo(() => {
    return holidays.find(h => h.month === ethDate.month && h.day === ethDate.day);
  }, [ethDate, holidays]);

  const seasonsInCurrentView = useMemo(() => {
    if (!fastingSeasons.length) return [];
    const seasons = new Set<FastingSeason>();
    
    heatmapData.forEach(day => {
      if (day.fastingName && !day.isPadding) {
        const season = fastingSeasons.find(s => s.name === day.fastingName);
        if (season) seasons.add(season);
      }
    });
    
    return Array.from(seasons);
  }, [heatmapData, fastingSeasons]);

  return (
    <div className="flex-1 flex flex-col p-4 md:p-8 space-y-6 md:space-y-10 animate-in fade-in slide-in-from-bottom-5 duration-1000 overflow-x-hidden">
      <div className="relative flex items-center justify-between py-2 md:py-4 px-2">
        <button 
          onClick={() => setIsDrawerOpen(true)}
          className="p-2.5 md:p-3 bg-white/5 rounded-2xl border border-white/10 text-[#d4af37] hover:scale-105 transition-all z-10"
        >
          <Icons.Library />
        </button>
        <h1 className="text-xl md:text-3xl serif gold-glow tracking-[0.2em] md:tracking-[0.3em] text-[#d4af37] font-bold">SENAY</h1>
        <button 
          onClick={onOpenMemhir}
          className="p-2.5 md:p-3 bg-[#d4af37]/10 rounded-2xl border border-[#d4af37]/20 text-[#d4af37] hover:scale-105 transition-all group"
          title="Ask Memhir"
        >
          <Icons.Message />
        </button>
      </div>

      <div className="flex flex-col items-center space-y-3 pb-2 px-4">
        <h2 className="text-base md:text-xl serif text-white text-center italic max-w-lg leading-relaxed opacity-90">
          "{quote?.text || "The Word is a lamp to my feet and a light to my path."}"
        </h2>
        <div className="flex items-center space-x-3 text-gray-700">
          <div className="h-px w-6 md:w-8 bg-white/5"></div>
          <span className="text-[8px] md:text-[9px] uppercase tracking-[0.2em] font-light">
            {quote?.source || "Daily Quote"}
          </span>
          <div className="h-px w-6 md:w-8 bg-white/5"></div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-10">
        <div className="lg:col-span-1 space-y-6">
          <div className={`bg-white/[0.03] border ${todayHoliday ? 'border-[#d4af37]/40 shadow-[0_0_30px_rgba(212,175,55,0.1)]' : 'border-white/10'} rounded-[2.5rem] md:rounded-[3rem] p-6 md:p-10 relative overflow-hidden shadow-2xl transition-all duration-700 hover:bg-white/[0.04]`}>
            {todayHoliday && (
              <div className="absolute inset-0 bg-gradient-to-br from-[#d4af37]/10 via-transparent to-transparent pointer-events-none" />
            )}
            <div className="absolute top-0 right-0 w-24 h-24 bg-[#d4af37]/5 blur-3xl -mr-12 -mt-12 rounded-full opacity-30" />
            
            <div className="flex flex-col mb-4 md:mb-8 relative z-10">
              <div className="flex justify-between items-start">
                <span className="text-[10px] md:text-[11px] font-bold text-gray-500 tracking-[0.3em] uppercase mb-0.5">
                  {ethDate.year} • {ethDate.yearName.replace("Year of St. ", "")}
                </span>
                <div className="flex flex-col items-end space-y-1.5">
                  {activeFastingSeason && (
                    <div className="flex items-center space-x-2 animate-in fade-in zoom-in duration-500">
                      <div className="w-2 h-2 rounded-full shadow-[0_0_8px]" style={{ backgroundColor: activeFastingSeason.color, boxShadow: `0 0 8px ${activeFastingSeason.color}` }} />
                      <span className="text-[7px] md:text-[8px] font-black uppercase tracking-widest text-white/50">{activeFastingSeason.name}</span>
                    </div>
                  )}
                </div>
              </div>
              <span className="text-xl md:text-3xl text-[#d4af37] font-black uppercase tracking-[0.4em] block leading-tight">
                {ethDate.monthName}
              </span>
            </div>

            <div className="flex flex-col items-start mb-6 md:mb-8 relative z-10">
              <div className="flex items-center space-x-4 md:space-x-6">
                <span className={`text-5xl md:text-7xl font-light serif ${todayHoliday ? 'text-[#d4af37] gold-glow' : 'text-white/95'} tracking-tighter leading-none`}>
                  {ethDate.day}
                </span>
                <div className="flex flex-col border-l border-white/10 pl-4 md:pl-6 py-1">
                   <span className="text-[6px] uppercase tracking-[0.4em] text-[#d4af37] font-black mb-1 opacity-30">
                     {todayHoliday ? 'Special Feast' : 'Commemorating'}
                   </span>
                   <span className={`text-sm md:text-lg ${todayHoliday ? 'text-white font-bold' : 'text-white/80'} serif italic leading-tight max-w-[120px] md:max-w-[160px] tracking-tight`}>
                    {todayHoliday ? todayHoliday.name : (saints[ethDate.day.toString()] || "All Saints")}
                  </span>
                </div>
              </div>
            </div>

            <div className="pt-6 md:pt-10 border-t border-white/5 relative z-10">
              <div className="flex flex-col mb-4 space-y-4">
                 <div className="flex items-center justify-between px-1">
                    <span className="text-[8px] md:text-[9px] uppercase tracking-[0.3em] text-gray-600 font-black">Witnessing</span>
                    {!isViewingCurrentMonth && (
                      <button 
                        onClick={resetToToday}
                        className="px-3 py-1.5 md:px-4 md:py-2 rounded-full border border-[#d4af37] bg-[#d4af37]/5 text-[#d4af37] text-[8px] md:text-[10px] font-black uppercase tracking-widest hover:bg-[#d4af37]/20 transition-all animate-in slide-in-from-right-4 shadow-lg shadow-[#d4af37]/5"
                      >
                        Today
                      </button>
                    )}
                 </div>

                 <div className="flex flex-wrap gap-2 items-center">
                    {seasonsInCurrentView.length > 0 ? seasonsInCurrentView.map(s => (
                      <div key={s.id} className="flex items-center space-x-1.5 px-2.5 py-1 bg-white/5 rounded-full border border-white/5">
                        <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: s.color, boxShadow: `0 0 4px ${s.color}` }} />
                        <span className="text-[7px] font-black text-white/70 uppercase tracking-tighter">{s.name.split(' (')[0]}</span>
                      </div>
                    )) : (
                      <div className="text-[7px] text-gray-800 font-bold uppercase tracking-widest italic opacity-40">No major fasts</div>
                    )}
                 </div>
                 
                 <div className="flex items-center justify-between bg-black/40 rounded-2xl p-2 px-3 border border-white/5">
                    <button 
                      onClick={() => changeHeatmapMonth(-1)}
                      className="p-1.5 rounded-full hover:bg-white/10 text-[#d4af37] transition-colors"
                    >
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
                    </button>
                    <span className="text-[9px] md:text-[10px] font-black text-white/80 uppercase tracking-[0.2em] serif">
                      {heatmapViewDate.toLocaleString('default', { month: 'short', year: 'numeric' })}
                    </span>
                    <button 
                      onClick={() => changeHeatmapMonth(1)}
                      className="p-1.5 rounded-full hover:bg-white/10 text-[#d4af37] transition-colors"
                    >
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
                    </button>
                 </div>
              </div>
              <Heatmap data={heatmapData} />
            </div>
          </div>

          <button 
            onClick={() => onStart('wudase', true)}
            className="w-full bg-[#d4af37] text-black font-bold py-6 md:py-8 rounded-[2.5rem] md:rounded-[3rem] shadow-2xl hover:bg-[#c0a030] hover:scale-[1.02] transition-all flex flex-col items-center justify-center group active:scale-95"
          >
            <span className="text-xl md:text-2xl serif mb-1">Daily Wudase</span>
            <span className="text-[8px] md:text-[9px] uppercase tracking-widest opacity-60 font-black">Divine Praises</span>
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
        userProfile={userProfile}
        userStats={stats}
        onLogout={onLogout}
        daysPracticed={daysPracticed}
      />
    </div>
  );
};

export default Dashboard;
