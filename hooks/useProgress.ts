
import { useState, useEffect } from 'react';
import { UserStats, BookProgress, FastingSeason, EthiopianHoliday, DedicationLevel } from '../types';
import { getEthiopianDate } from '../utils/ethiopianCalendar';

const STORAGE_KEY = 'senay_user_stats';

const initialStats: UserStats = {
  rank: 'Mihiman (Faithful)',
  studyHistory: {},
  bookProgress: {},
  totalSessions: 0
};

export const getLocalDateString = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const useProgress = () => {
  const [stats, setStats] = useState<UserStats>(initialStats);
  const [holidays, setHolidays] = useState<EthiopianHoliday[]>([]);

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        setStats(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to parse saved stats", e);
      }
    }

    const loadHolidays = async () => {
      try {
        const res = await fetch('./data/holidays.json');
        if (!res.ok) throw new Error('Failed to load holidays');
        const data = await res.json();
        setHolidays(data);
      } catch (err) {
        console.error("Error loading holidays for heatmap:", err);
        setHolidays([]); // Fallback to empty
      }
    };
    
    loadHolidays();
  }, []);

  const saveStats = (newStats: UserStats) => {
    setStats(newStats);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newStats));
  };

  const setDedicationLevel = (level: DedicationLevel) => {
    saveStats({ ...stats, dedicationLevel: level });
  };

  const setPreferredTime = (enabled: boolean, time?: string) => {
    saveStats({ ...stats, preferredTime: { enabled, time } });
  };

  const updateLastAccessed = (bookId: string) => {
    const newStats = { ...stats };
    if (!newStats.bookProgress[bookId]) {
      newStats.bookProgress[bookId] = { bookId, completedChapters: [], lastAccessed: Date.now() };
    } else {
      newStats.bookProgress[bookId].lastAccessed = Date.now();
    }
    saveStats(newStats);
  };

  const completeChapter = (bookId: string, chapter: number) => {
    const todayStr = getLocalDateString(new Date());
    const newStats = { ...stats };
    
    newStats.studyHistory[todayStr] = (newStats.studyHistory[todayStr] || 0) + 1;
    newStats.totalSessions = (newStats.totalSessions || 0) + 1;
    
    if (!newStats.bookProgress[bookId]) {
      newStats.bookProgress[bookId] = { bookId, completedChapters: [], lastAccessed: Date.now() };
    }
    
    newStats.bookProgress[bookId].lastAccessed = Date.now();
    
    if (!newStats.bookProgress[bookId].completedChapters.includes(chapter)) {
      newStats.bookProgress[bookId].completedChapters.push(chapter);
      newStats.bookProgress[bookId].completedChapters.sort((a, b) => a - b);
    }

    saveStats(newStats);
  };

  const getNextChapter = (bookId: string): number => {
    const progress = stats.bookProgress[bookId];
    if (!progress || progress.completedChapters.length === 0) return 1;
    return Math.max(...progress.completedChapters) + 1;
  };

  const getHeatmapData = (targetDate: Date, fastingSeasons: FastingSeason[] = []) => {
    const data = [];
    const todayStr = getLocalDateString(new Date());
    
    const year = targetDate.getFullYear();
    const month = targetDate.getMonth();
    const firstDayOfMonth = new Date(year, month, 1);
    const lastDayOfMonth = new Date(year, month + 1, 0);
    
    let startDay = firstDayOfMonth.getDay();
    let leadingDays = startDay === 0 ? 6 : startDay - 1;

    const findLiturgicalInfo = (date: Date) => {
      const ethDate = getEthiopianDate(date);
      const val = ethDate.month * 100 + ethDate.day;
      
      const season = fastingSeasons.find(s => {
        const start = s.ethStartMonth * 100 + s.ethStartDay;
        const end = s.ethEndMonth * 100 + s.ethEndDay;
        if (start <= end) return val >= start && val <= end;
        return val >= start || val <= end;
      });

      const holiday = holidays.find(h => h.month === ethDate.month && h.day === ethDate.day);
      
      return { 
        fastingColor: season?.color || null, 
        fastingName: season?.name || null,
        holidayName: holiday?.name || null,
        isMajorHoliday: holiday?.type === 'Major'
      };
    };

    for (let i = leadingDays; i > 0; i--) {
      const d = new Date(year, month, 1 - i);
      const dStr = getLocalDateString(d);
      const lit = findLiturgicalInfo(d);
      data.push({
        count: stats.studyHistory[dStr] || 0,
        isToday: dStr === todayStr,
        isPadding: true,
        ...lit
      });
    }

    for (let i = 1; i <= lastDayOfMonth.getDate(); i++) {
      const d = new Date(year, month, i);
      const dStr = getLocalDateString(d);
      const lit = findLiturgicalInfo(d);
      data.push({
        count: stats.studyHistory[dStr] || 0,
        isToday: dStr === todayStr,
        isPadding: false,
        ...lit
      });
    }

    while (data.length % 7 !== 0) {
      const d = new Date(year, month + 1, data.length - leadingDays - lastDayOfMonth.getDate() + 1);
      const dStr = getLocalDateString(d);
      const lit = findLiturgicalInfo(d);
      data.push({
        count: stats.studyHistory[dStr] || 0,
        isToday: dStr === todayStr,
        isPadding: true,
        ...lit
      });
    }

    return data;
  };

  return { 
    stats, 
    completeChapter, 
    getNextChapter, 
    getHeatmapData, 
    updateLastAccessed,
    setDedicationLevel,
    setPreferredTime,
    daysPracticed: Object.keys(stats.studyHistory).length
  };
};