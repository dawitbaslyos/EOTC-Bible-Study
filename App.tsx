
import React, { useState, useEffect, useRef } from 'react';
import { AppPhase, WudaseLiturgy, DailyManna, Quote, BibleBookJSON } from './types';
import Dashboard from './components/Dashboard';
import PreparationPhase from './components/PreparationPhase';
import ReadingPhase from './components/ReadingPhase';
import AskMemhir from './components/AskMemhir';
import LoginPage from './components/LoginPage';
import { useProgress } from './hooks/useProgress';

interface UserProfile {
  name: string;
  email: string;
  photoURL: string;
  provider: 'google' | 'facebook';
}

const PORTION_CHAR_LIMIT = 2000;

const App: React.FC = () => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [phase, setPhase] = useState<AppPhase>(AppPhase.DASHBOARD);
  const [showTransition, setShowTransition] = useState(false);
  const [isDailyWudase, setIsDailyWudase] = useState(false);
  const [wudaseStep, setWudaseStep] = useState<number>(0); 
  const [liturgy, setLiturgy] = useState<WudaseLiturgy | null>(null);
  const [bibleData, setBibleData] = useState<BibleBookJSON[] | null>(null);
  const [readingData, setReadingData] = useState<DailyManna | null>(null);
  const [quote, setQuote] = useState<Quote | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  
  const touchStartX = useRef(0);
  const { completeChapter, getNextChapter, updateLastAccessed } = useProgress();

  useEffect(() => {
    const savedUser = localStorage.getItem('senay_user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }

    const fetchData = async () => {
      try {
        const [litRes, bibleRes, quotesRes] = await Promise.all([
          fetch('./data/wudase-liturgy.json').catch(() => ({ ok: false, json: () => null })),
          fetch('./data/bible-content.json').catch(() => ({ ok: false, json: () => null })),
          fetch('./data/quotes.json').catch(() => ({ ok: false, json: () => null }))
        ]);

        if (litRes.ok) {
          const data = await litRes.json();
          setLiturgy(data);
        }
        
        if (bibleRes.ok) {
          const data = await bibleRes.json();
          setBibleData(data);
        }
        
        if (quotesRes.ok) {
          const quotes = await quotesRes.json();
          if (Array.isArray(quotes) && quotes.length > 0) {
            const now = new Date();
            const index = now.getDate() % quotes.length;
            setQuote(quotes[index]);
          }
        }
      } catch (err) {
        console.error("Critical error loading sanctuary data:", err);
      }
    };

    fetchData();
  }, []);

  const handleTouchStart = (e: React.TouchEvent) => {
    if (!isDrawerOpen && e.touches[0].clientX < 30) {
      touchStartX.current = e.touches[0].clientX;
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!isDrawerOpen && touchStartX.current > 0) {
      const deltaX = e.changedTouches[0].clientX - touchStartX.current;
      if (deltaX > 50) {
        setIsDrawerOpen(true);
      }
      touchStartX.current = 0;
    }
  };

  const handleLogin = (profile: UserProfile) => {
    setUser(profile);
    localStorage.setItem('senay_user', JSON.stringify(profile));
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
    }, 600);
  };

  const startFlow = (bookId: string, isWudase: boolean, specificChapter?: number) => {
    setIsDailyWudase(isWudase);
    if (isWudase) {
      setWudaseStep(0);
      goToPhase(AppPhase.PREPARATION);
    } else if (bibleData) {
      updateLastAccessed(bookId);
      const bookObj = bibleData.find(b => 
        b.book_short_name_en.toLowerCase() === bookId.toLowerCase() ||
        b.book_name_en.toLowerCase().includes(bookId.toLowerCase())
      );
      
      if (bookObj) {
        const chapterNum = specificChapter || getNextChapter(bookId);
        const chapterObj = bookObj.chapters.find(c => c.chapter === chapterNum) || bookObj.chapters[0];
        
        let currentChars = 0;
        const portionedSections = [];
        for (const section of chapterObj.sections) {
          const sectionChars = section.verses.reduce((acc, v) => acc + (v.text?.length || 0) + (v.geez?.length || 0), 0);
          if (currentChars + sectionChars <= PORTION_CHAR_LIMIT || portionedSections.length === 0) {
            portionedSections.push(section);
            currentChars += sectionChars;
          } else {
            break;
          }
        }

        setReadingData({
          title: bookObj.book_name_en,
          bookId: bookId,
          bookName: bookObj.book_name_am,
          chapter: chapterObj.chapter,
          totalChapters: bookObj.chapters.length,
          sections: portionedSections,
          liturgicalSeason: 'General'
        });
        goToPhase(AppPhase.READING);
      } else {
        // Fallback for books not in content.json yet
        setReadingData({
          title: bookId.toUpperCase(),
          bookId: bookId,
          bookName: bookId,
          chapter: 1,
          totalChapters: 1,
          sections: [{
            title: "Coming Soon",
            verses: [{ verse: 1, text: "The sacred text for this book is currently being digitized.", english: "This content will be available in a future update." }]
          }],
          liturgicalSeason: 'General'
        });
        goToPhase(AppPhase.READING);
      }
    }
  };

  const advanceWudase = () => {
    if (!liturgy) return;
    
    if (wudaseStep === 0) {
      setReadingData({
        title: "Standard Prayers",
        bookId: 'wudase',
        bookName: liturgy.yezewetir.title,
        chapter: 1,
        totalChapters: 2,
        sections: liturgy.yezewetir.sections,
        liturgicalSeason: 'Daily'
      });
      setWudaseStep(1);
      goToPhase(AppPhase.READING);
    } else if (wudaseStep === 1) {
      const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      const today = days[new Date().getDay()];
      const portion = liturgy.portions[today as keyof typeof liturgy.portions];
      if (portion) {
        setReadingData({
          title: portion.dayName,
          bookId: 'wudase',
          bookName: portion.dayName,
          chapter: 2,
          totalChapters: 2,
          sections: portion.sections || [],
          liturgicalSeason: 'Daily'
        });
      }
      setWudaseStep(2);
      goToPhase(AppPhase.READING);
    } else if (wudaseStep === 2) {
      handleFinishFlow();
    }
  };

  const handleFinishFlow = () => {
    if (readingData && !isDailyWudase) {
      completeChapter(readingData.bookId, readingData.chapter);
    } else if (isDailyWudase) {
      completeChapter('wudase', 1);
    }
    goToPhase(AppPhase.DASHBOARD);
  };

  if (!user) {
    return <LoginPage onLogin={handleLogin} />;
  }

  const renderPhase = () => {
    if (!liturgy && isDailyWudase) return <div className="p-10 text-center text-[#d4af37] ethiopic">Preparing the Altar...</div>;

    switch (phase) {
      case AppPhase.DASHBOARD:
        return <Dashboard 
          onStart={startFlow} 
          quote={quote || undefined} 
          onOpenMemhir={() => goToPhase(AppPhase.ASK_MEMHIR)} 
          userProfile={user}
          onLogout={handleLogout}
          isDrawerOpen={isDrawerOpen}
          setIsDrawerOpen={setIsDrawerOpen}
        />;
      case AppPhase.ASK_MEMHIR:
        return <AskMemhir onClose={() => goToPhase(AppPhase.DASHBOARD)} currentQuote={quote || undefined} />;
      case AppPhase.PREPARATION:
        return <PreparationPhase openingText={liturgy?.opening || "In the name of the Father..."} yezewetirText="" onComplete={advanceWudase} />;
      case AppPhase.READING:
        return (
          <ReadingPhase 
            data={readingData!} 
            isDailyManna={isDailyWudase}
            onNext={isDailyWudase ? advanceWudase : handleFinishFlow} 
            onOpenMemhir={() => goToPhase(AppPhase.ASK_MEMHIR)}
            onFinish={handleFinishFlow}
            onSelectChapter={(chapter) => startFlow(readingData!.bookId, false, chapter)}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div 
      className={`min-h-screen transition-opacity duration-500 ${showTransition ? 'opacity-0' : 'opacity-100'}`}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      <div className="max-w-5xl mx-auto min-h-screen flex flex-col">
        {renderPhase()}
      </div>
    </div>
  );
};

export default App;
