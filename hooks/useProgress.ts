
import { useState, useEffect } from 'react';
import { UserStats, BookProgress } from '../types';

const STORAGE_KEY = 'senay_user_stats';

const initialStats: UserStats = {
  rank: 'Mihiman (Faithful)',
  studyHistory: {},
  bookProgress: {}
};

const getLocalDateString = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const useProgress = () => {
  const [stats, setStats] = useState<UserStats>(initialStats);

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        setStats(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to parse saved stats", e);
      }
    }
  }, []);

  const saveStats = (newStats: UserStats) => {
    setStats(newStats);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newStats));
  };

  const completeChapter = (bookId: string, chapter: number) => {
    const todayStr = getLocalDateString(new Date());
    const newStats = { ...stats };
    
    // Update Global Study History (Heatmap Source)
    // This logs every individual completion (Bible or Wudase) per day
    newStats.studyHistory[todayStr] = (newStats.studyHistory[todayStr] || 0) + 1;
    
    // Update Specific Book Progress (Chapter tracking)
    if (!newStats.bookProgress[bookId]) {
      newStats.bookProgress[bookId] = { bookId, completedChapters: [] };
    }
    
    // For Bible books, we track specific chapters. 
    // For 'wudase', we treat the 'chapter' param as a session index.
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

  /**
   * Returns data for the last 28 days, aligned to Mon-Sun weeks.
   */
  const getHeatmapData = () => {
    const data = [];
    const today = new Date();
    const todayStr = getLocalDateString(today);
    
    // Find the Monday of the current week
    const currentDay = today.getDay(); // 0=Sun, 1=Mon, ...
    const diffToMonday = (currentDay === 0 ? 6 : currentDay - 1);
    const thisMonday = new Date(today);
    thisMonday.setDate(today.getDate() - diffToMonday);
    
    // Go back 3 additional weeks to get 4 full weeks
    const startPoint = new Date(thisMonday);
    startPoint.setDate(thisMonday.getDate() - 21);
    
    for (let i = 0; i < 28; i++) {
      const d = new Date(startPoint);
      d.setDate(startPoint.getDate() + i);
      const dStr = getLocalDateString(d);
      
      data.push({
        count: stats.studyHistory[dStr] || 0,
        isToday: dStr === todayStr
      });
    }
    return data;
  };

  return { stats, completeChapter, getNextChapter, getHeatmapData };
};
