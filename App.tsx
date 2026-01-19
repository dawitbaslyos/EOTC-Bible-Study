
import React, { useState, useEffect, useMemo } from 'react';
import { AppPhase, WudaseLiturgy, DailyManna, Quote, BibleBookJSON, UserStats, Theme, RitualTime, Book } from './types';
import Dashboard from './components/Dashboard';
import PreparationPhase from './components/PreparationPhase';
import ReadingPhase from './components/ReadingPhase';
import SummaryPhase from './components/SummaryPhase';
import AskMemhir from './components/AskMemhir';
import LoginPage from './components/LoginPage';
import Onboarding from './components/Onboarding';
import SettingsPage from './components/SettingsPage';
import NotificationCenter, { NotificationToast } from './components/NotificationCenter';
import { useProgress } from './hooks/useProgress';
import { useNotifications } from './hooks/useNotifications';

interface UserProfile {
  name: string;
  email: string;
  photoURL: string;
  provider: 'google' | 'facebook' | 'guest';
}

const App: React.FC = () => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [phase, setPhase] = useState<AppPhase>(AppPhase.DASHBOARD);
  const [showTransition, setShowTransition] = useState(false);
  const [isDailyWudase, setIsDailyWudase] = useState(false);
  
  const [liturgy, setLiturgy] = useState<WudaseLiturgy | null>(null);
  const [bibleData, setBibleData] = useState<BibleBookJSON[] | null>(null);
  const [allBooks, setAllBooks] = useState<Book[]>([]);
  const [quote, setQuote] = useState<Quote | null>(null);
  
  const [readingData, setReadingData] = useState<DailyManna | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [theme, setTheme] = useState<Theme>(() => (localStorage.getItem('senay_theme') as Theme) || 'dark');
  
  const { stats, completeChapter, getNextChapter, updateLastAccessed, saveStats } = useProgress();
  const { notifications, notify, markAsRead, clearAll, unreadCount, activeToast, dismissToast } = useNotifications();

  // Filtered books that only exist in BOTH the metadata and the content JSONs
  const availableBooks = useMemo(() => {
    if (!bibleData || !allBooks.length) return [];
    return allBooks.filter(book => 
      bibleData.some(bd => bd.book_short_name_en.toLowerCase() === book.id.toLowerCase())
    );
  }, [bibleData, allBooks]);

  useEffect(() => {
    document.documentElement.className = theme === 'light' ? 'light-theme' : '';
    localStorage.setItem('senay_theme', theme);
  }, [theme]);

  useEffect(() => {
    const savedUser = localStorage.getItem('senay_user');
    if (savedUser) {
      const parsed = JSON.parse(savedUser);
      setUser(parsed);
      if (!stats.hasCompletedOnboarding) {
        setPhase(AppPhase.ONBOARDING);
      }
    }

    const fetchData = async () => {
      try {
        const [litRes, bibleRes, quotesRes, booksRes] = await Promise.all([
          fetch('./data/wudase-liturgy.json').catch(() => ({ ok: false, json: () => null })),
          fetch('./data/bible-content.json').catch(() => ({ ok: false, json: () => null })),
          fetch('./data/quotes.json').catch(() => ({ ok: false, json: () => null })),
          fetch('./data/80-weahadu.json').catch(() => ({ ok: false, json: () => null }))
        ]);

        if (litRes.ok) setLiturgy(await (litRes as any).json());
        if (bibleRes.ok) setBibleData(await (bibleRes as any).json());
        if (booksRes.ok) setAllBooks(await (booksRes as any).json());
        
        if (quotesRes.ok) {
          const quotes = await (quotesRes as any).json();
          if (Array.isArray(quotes) && quotes.length > 0) {
            const index = new Date().getDate() % quotes.length;
            setQuote(quotes[index]);
          }
        }
      } catch (err) {
        console.error("Critical error loading data:", err);
      }
    };

    fetchData();
  }, [stats.hasCompletedOnboarding]);

  const handleLogin = (profile: UserProfile) => {
    setUser(profile);
    localStorage.setItem('senay_user', JSON.stringify(profile));
    if (!stats.hasCompletedOnboarding) {
      setPhase(AppPhase.ONBOARDING);
    } else {
      setPhase(AppPhase.DASHBOARD);
      notify({ title: "Peace be with you", body: `Welcome back, ${profile.name.split(' ')[0]}.`, type: 'emotional', priority: 'normal' });
    }
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('senay_user');
    setPhase(AppPhase.DASHBOARD);
    setIsDrawerOpen(false);
  };

  const goToPhase = (newPhase: AppPhase) => {
    setShowTransition(true);
    setTimeout(() => {
      setPhase(newPhase);
      setShowTransition(false);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }, 400);
  };

  const getWudasePortion = (lit: WudaseLiturgy, chapter: number): DailyManna => {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const todayName = days[new Date().getDay()];
    const portion = lit.portions[todayName];

    if (chapter === 1) {
      return {
        title: "Standard Prayers",
        bookId: 'wudase',
        bookName: 'ውዳሴ ማርያም',
        chapter: 1,
        totalChapters: 2,
        sections: lit.yezewetir.sections,
        liturgicalSeason: todayName
      };
    } else {
      return {
        title: portion?.dayName || `${todayName} Portion`,
        bookId: 'wudase',
        bookName: 'ውዳሴ ማርያም',
        chapter: 2,
        totalChapters: 2,
        sections: portion?.sections || [],
        liturgicalSeason: todayName
      };
    }
  };

  const startFlow = (bookId: string, isWudase: boolean, specificChapter?: number) => {
    setIsDailyWudase(isWudase);
    if (isWudase) {
      if (liturgy) {
        const chapterNum = specificChapter || 1;
        setReadingData(getWudasePortion(liturgy, chapterNum));
        if (chapterNum === 1) {
          goToPhase(AppPhase.PREPARATION);
        } else {
          goToPhase(AppPhase.READING);
        }
      }
    } else if (bibleData) {
      updateLastAccessed(bookId);
      const bookObj = bibleData.find(b => b.book_short_name_en.toLowerCase() === bookId.toLowerCase());
      
      if (bookObj) {
        const chapterNum = specificChapter || getNextChapter(bookId);
        const chapterObj = bookObj.chapters.find(c => c.chapter === chapterNum) || bookObj.chapters[0];
        
        setReadingData({
          title: bookObj.book_name_en,
          bookId: bookId,
          bookName: bookObj.book_name_am,
          chapter: chapterObj.chapter,
          totalChapters: bookObj.chapters.length,
          sections: chapterObj.sections,
          liturgicalSeason: 'General'
        });
        goToPhase(AppPhase.READING);
      }
    }
  };

  const handleTogglePremium = () => {
    const newVal = !stats.isPremium;
    const newStats: UserStats = { ...stats, isPremium: newVal };
    saveStats(newStats);
    if (newVal) {
      notify({ title: "Premium Activated", body: "Thank you for supporting Senay. You are now a Patron.", type: 'success', priority: 'high' });
    }
  };

  const handleUpdateRituals = (prefs: RitualTime[]) => {
    saveStats({ ...stats, preferredRituals: prefs });
  };

  const handleNextInReading = () => {
    if (isDailyWudase && readingData) {
      if (readingData.chapter === 1) {
        startFlow('wudase', true, 2);
      } else {
        goToPhase(AppPhase.SUMMARY);
      }
    } else {
      handleFinishReading();
    }
  };

  const handleFinishReading = () => {
    if (readingData && readingData.bookId !== 'wudase') {
      completeChapter(readingData.bookId, readingData.chapter);
    } else if (readingData && readingData.bookId === 'wudase') {
      completeChapter('wudase', 1);
    }
    goToPhase(AppPhase.DASHBOARD);
  };

  if (!user) {
    return <LoginPage onLogin={handleLogin} />;
  }

  const renderPhase = () => {
    switch (phase) {
      case AppPhase.ONBOARDING:
        return <Onboarding onComplete={(prefs) => {
          saveStats({ ...stats, hasCompletedOnboarding: true, preferredRituals: prefs });
          goToPhase(AppPhase.DASHBOARD);
        }} />;
      case AppPhase.DASHBOARD:
        return (
          <Dashboard 
            onStart={startFlow} 
            quote={quote || undefined} 
            availableBooks={availableBooks}
            onOpenMemhir={() => goToPhase(AppPhase.ASK_MEMHIR)} 
            userProfile={user}
            onLogout={handleLogout}
            isDrawerOpen={isDrawerOpen}
            setIsDrawerOpen={setIsDrawerOpen}
            unreadCount={unreadCount}
            onOpenNotifications={() => setIsNotificationOpen(true)}
            onOpenSettings={() => goToPhase(AppPhase.SETTINGS)}
            isPremium={stats.isPremium}
            onTogglePremium={handleTogglePremium}
          />
        );
      case AppPhase.SETTINGS:
        return (
          <SettingsPage 
            onClose={() => goToPhase(AppPhase.DASHBOARD)}
            theme={theme}
            setTheme={setTheme}
            rituals={stats.preferredRituals || ['day']}
            setRituals={handleUpdateRituals}
            isPremium={stats.isPremium}
            onTogglePremium={handleTogglePremium}
            onLogout={handleLogout}
          />
        );
      case AppPhase.ASK_MEMHIR:
        return <AskMemhir onClose={() => goToPhase(AppPhase.DASHBOARD)} currentQuote={quote || undefined} theme={theme} />;
      case AppPhase.PREPARATION:
        return (
          <PreparationPhase 
            openingText={liturgy?.opening || "In the name of the Father..."} 
            yezewetirText="" 
            onComplete={() => goToPhase(AppPhase.READING)} 
          />
        );
      case AppPhase.READING:
        return (
          <ReadingPhase 
            data={readingData!} 
            isDailyManna={isDailyWudase}
            onNext={handleNextInReading} 
            onOpenMemhir={() => goToPhase(AppPhase.ASK_MEMHIR)}
            onFinish={() => goToPhase(AppPhase.DASHBOARD)}
            onSelectChapter={(chapter) => startFlow(readingData!.bookId, false, chapter)}
          />
        );
      case AppPhase.SUMMARY:
        return (
          <SummaryPhase 
            wudaseAmlakText={liturgy?.wudaseAmlak || "Praises of the Almighty..."}
            onFinish={handleFinishReading}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className={`min-h-screen bg-[var(--bg-primary)] transition-opacity duration-500 ${showTransition ? 'opacity-0' : 'opacity-100'}`}>
      <div className="max-w-5xl mx-auto min-h-screen flex flex-col relative">
        {renderPhase()}
        <NotificationCenter 
          isOpen={isNotificationOpen} 
          notifications={notifications} 
          onClose={() => setIsNotificationOpen(false)} 
          onMarkRead={markAsRead}
          onClearAll={clearAll}
        />
        <NotificationToast notification={activeToast} onDismiss={dismissToast} />
      </div>
    </div>
  );
};

export default App;
