
import React, { useState, useEffect, useMemo } from 'react';
import { Icons } from '../constants';
import Heatmap from './dashboard/Heatmap';
import BookList from './dashboard/BookList';
import LibraryDrawer from './LibraryDrawer';
import { Book, Quote, FastingSeason, EthiopianHoliday, UserStats } from '../types';
import { getEthiopianDate, EthiopianDate } from '../utils/ethiopianCalendar';
import { buildWidgetSnapshot, persistWidgetSnapshot } from '../utils/widgetSnapshot';

interface Props {
  onStart: (bookId: string, isDailyWudase: boolean, chapter?: number) => void;
  onOpenMemhir: () => void;
  quote?: Quote;
  availableBooks: Book[];
  userProfile?: any;
  onLogout: () => void;
  isDrawerOpen: boolean;
  setIsDrawerOpen: (open: boolean) => void;
  unreadCount: number;
  onOpenNotifications: () => void;
  onOpenSettings: () => void;
  stats: UserStats;
  getHeatmapData: (date: Date, fasting: FastingSeason[]) => any[];
  daysPracticed: number;
}

const Dashboard: React.FC<Props> = ({ 
  onStart, 
  onOpenMemhir, 
  quote, 
  availableBooks,
  userProfile, 
  onLogout,
  isDrawerOpen,
  setIsDrawerOpen,
  unreadCount,
  onOpenNotifications,
  onOpenSettings,
  stats,
  getHeatmapData,
  daysPracticed
}) => {
  const [saints, setSaints] = useState<Record<string, string>>({});
  const [fastingSeasons, setFastingSeasons] = useState<FastingSeason[]>([]);
  const [holidays, setHolidays] = useState<EthiopianHoliday[]>([]);
  const [ethDate, setEthDate] = useState<EthiopianDate>(getEthiopianDate());
  const [showHolidayFirst, setShowHolidayFirst] = useState(true);
  
  const [heatmapViewDate, setHeatmapViewDate] = useState(new Date());
  const heatmapData = useMemo(() => getHeatmapData(heatmapViewDate, fastingSeasons), [heatmapViewDate, fastingSeasons, stats.studyHistory]);

  useEffect(() => {
    const timer = setInterval(() => {
      setEthDate(getEthiopianDate());
    }, 3600000);

    fetch('./data/saints.json').then(res => res.json()).then(setSaints).catch(err => console.error(err));
    fetch('./data/fasting-seasons.json').then(res => res.json()).then(setFastingSeasons).catch(err => console.error(err));
    fetch('./data/holidays.json').then(res => res.json()).then(setHolidays).catch(err => console.error(err));

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

  const todayHoliday = useMemo(() => {
    return holidays.find(h => h.month === ethDate.month && h.day === ethDate.day);
  }, [holidays, ethDate]);

  const saintOfToday = saints[ethDate.day.toString()];

  const toggleSaintHolidayDisplay = () => {
    if (todayHoliday) {
      setShowHolidayFirst(!showHolidayFirst);
    }
  };

  const hasSaintOrHoliday = !!todayHoliday || !!saintOfToday;

  // Keep a simple snapshot of calendar data for native widget use
  useEffect(() => {
    const snapshot = buildWidgetSnapshot(ethDate, {
      todayHolidayName: todayHoliday ? todayHoliday.name : null,
      saintOfToday: saintOfToday || null,
      heatmapData,
      streak: stats.streak || 0,
    });
    persistWidgetSnapshot(snapshot);
  }, [ethDate, todayHoliday, saintOfToday, heatmapData, stats.streak]);

  return (
    <div className="flex-1 flex flex-col p-4 md:p-8 space-y-8 animate-in fade-in duration-1000">
      <header className="flex justify-between items-center">
        <div className="flex items-center space-x-4">
          <button 
            onClick={() => setIsDrawerOpen(true)}
            className="w-12 h-12 bg-[var(--card-bg)] border border-theme rounded-xl flex items-center justify-center text-[var(--gold)] hover:bg-[var(--gold-muted)] transition-all active:scale-90"
          >
            <Icons.Menu />
          </button>
          <h1 className="text-3xl serif gold-glow text-[var(--gold)] font-bold tracking-tight">Senay</h1>
        </div>

        <div className="flex items-center space-x-2 md:space-x-3">
          <button 
            onClick={onOpenNotifications}
            className="w-12 h-12 bg-[var(--card-bg)] border border-theme rounded-xl flex items-center justify-center text-[var(--text-secondary)] hover:text-[var(--gold)] transition-all relative"
          >
            <Icons.Bell />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-[var(--gold)] text-black text-[10px] font-black rounded-full flex items-center justify-center border-2 border-[var(--bg-primary)]">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>
          <button 
            onClick={onOpenMemhir}
            className="w-12 h-12 bg-[var(--gold-muted)] border border-[var(--gold)]/30 rounded-xl flex items-center justify-center text-[var(--gold)] shadow-sm hover:bg-[var(--gold)]/20 transition-all active:scale-90"
          >
            <Icons.Message />
          </button>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1 space-y-8">
          <section className="bg-[var(--card-bg)] border border-theme p-8 rounded-[2.5rem] space-y-6 relative overflow-hidden group shadow-lg">
            <div className="absolute top-0 right-0 w-32 h-32 bg-[var(--gold)]/5 blur-3xl -mr-16 -mt-16 rounded-full opacity-50 group-hover:opacity-100 transition-opacity" />
            
            <div className="flex justify-between items-center relative z-10">
               <div>
                 <div className="flex items-baseline space-x-2">
                   <h2 className="serif text-4xl text-[var(--gold)]">{ethDate.monthName} {ethDate.day}</h2>
                   <p className="text-sm font-bold text-[var(--text-muted)] opacity-70">({ethDate.year})</p>
                 </div>
                 <p className="text-[9px] uppercase tracking-widest text-[var(--text-muted)] font-black mt-1">{ethDate.yearName}</p>
               </div>
               
               {hasSaintOrHoliday && (
                 <div 
                   className={`text-right ${todayHoliday ? 'cursor-pointer select-none active:opacity-60 transition-opacity' : ''}`}
                   onClick={toggleSaintHolidayDisplay}
                 >
                   <div className="text-[10px] text-[var(--text-muted)] uppercase tracking-tighter mb-0.5">
                     {todayHoliday && showHolidayFirst ? 'Holiday' : 'Saint of the day'}
                   </div>
                   <div className="text-xs font-bold text-[var(--text-primary)] ethiopic truncate max-w-[140px]">
                     {todayHoliday && showHolidayFirst ? todayHoliday.name : (saintOfToday || 'Holy Saints')}
                   </div>
                 </div>
               )}
            </div>

            <button 
              onClick={() => onStart('wudase', true)}
              className="w-full bg-[var(--gold)] text-black py-5 rounded-[1.5rem] font-black uppercase tracking-[0.2em] text-xs hover:bg-[#c0a030] transition-all shadow-xl active:scale-95 flex items-center justify-center space-x-3 group"
            >
              <span>Daily Reading</span>
              <Icons.ChevronRight className="group-hover:translate-x-1 transition-transform" />
            </button>
          </section>

          <section className="bg-[var(--card-bg)] border border-theme p-8 rounded-[2.5rem] space-y-6 shadow-md">
            <div className="flex justify-between items-center px-1">
              <div className="flex items-center space-x-2 text-[var(--gold)]">
                <h3 className="uppercase text-[10px] font-bold tracking-[0.2em]">My Routine</h3>
              </div>
              <div className="flex items-center space-x-3">
                <button onClick={() => changeHeatmapMonth(-1)} className="p-1.5 text-[var(--text-muted)] hover:text-[var(--text-primary)]"><Icons.ChevronRight className="rotate-180" /></button>
                <div 
                  className="flex items-baseline space-x-1 cursor-pointer hover:opacity-70 transition-opacity" 
                  onClick={resetToToday}
                >
                  <span className="text-sm font-bold text-[var(--gold)]">{heatmapViewDate.toLocaleString('default', { month: 'short' })}</span>
                </div>
                <button onClick={() => changeHeatmapMonth(1)} className="p-1.5 text-[var(--text-muted)] hover:text-[var(--text-primary)]"><Icons.ChevronRight /></button>
              </div>
            </div>
            
            <Heatmap data={heatmapData} />
            
            <div className="pt-2 flex justify-between items-end">
              <div className="flex flex-col">
                <span className="text-3xl font-light text-[var(--text-primary)] leading-none">
                  {stats.streak || (daysPracticed > 0 ? 0 : '—')}
                </span>
                <span className="text-[8px] uppercase tracking-widest text-[var(--text-muted)] font-black">
                  {stats.streak === 0 && daysPracticed > 0 ? 'Foundation Set' : 'Day Streak'}
                </span>
              </div>
              <div className="text-right flex flex-col">
                <span className="text-xl font-light text-[var(--text-primary)] leading-none">{daysPracticed}</span>
                <span className="text-[8px] uppercase tracking-widest text-[var(--text-muted)] font-black">Insights</span>
              </div>
            </div>
          </section>

          {quote && (
            <section className="p-8 border border-theme rounded-[2.5rem] bg-gradient-to-br from-[var(--card-bg)] to-transparent italic relative group shadow-sm">
              <p className="text-[var(--text-secondary)] text-sm leading-relaxed mb-4 relative z-10 px-2">{quote.text}</p>
              <div className="text-[9px] uppercase tracking-[0.2em] text-[var(--gold)] font-black text-right">— {quote.source}</div>
            </section>
          )}
        </div>

        <BookList books={availableBooks} userStats={stats} onContinue={(id, ch) => onStart(id, false, ch)} />
      </div>

      <LibraryDrawer 
        isOpen={isDrawerOpen} 
        onClose={() => setIsDrawerOpen(false)} 
        books={availableBooks}
        onSelectBook={(id) => onStart(id, false)}
        userProfile={userProfile}
        userStats={stats}
        onLogout={onLogout}
        daysPracticed={daysPracticed}
        onOpenSettings={onOpenSettings}
      />
    </div>
  );
};

export default Dashboard;
