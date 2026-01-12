
import React, { useState, useEffect } from 'react';
import { AppPhase, WudaseLiturgy, DailyManna, Quote, BibleBookJSON } from './types';
import Dashboard from './components/Dashboard';
import PreparationPhase from './components/PreparationPhase';
import ReadingPhase from './components/ReadingPhase';
import SummaryPhase from './components/SummaryPhase';
import ReflectionPhase from './components/ReflectionPhase';
import AskMemhir from './components/AskMemhir';
import { useProgress } from './hooks/useProgress';

const App: React.FC = () => {
  const [phase, setPhase] = useState<AppPhase>(AppPhase.DASHBOARD);
  const [showTransition, setShowTransition] = useState(false);
  const [isDailyWudase, setIsDailyWudase] = useState(false);
  const [wudaseStep, setWudaseStep] = useState<number>(0); 
  const [liturgy, setLiturgy] = useState<WudaseLiturgy | any>(null);
  const [bibleData, setBibleData] = useState<BibleBookJSON[] | null>(null);
  const [readingData, setReadingData] = useState<DailyManna | null>(null);
  const [quote, setQuote] = useState<Quote | null>(null);
  const { completeChapter, getNextChapter, updateLastAccessed } = useProgress();

  useEffect(() => {
    fetch('./wudase-liturgy.json')
      .then(res => res.json())
      .then(setLiturgy)
      .catch(err => console.error("Error loading liturgy:", err));

    fetch('./bible-content.json')
      .then(res => res.json())
      .then(setBibleData)
      .catch(err => console.error("Error loading bible content:", err));

    fetch('./quotes.json')
      .then(res => res.json())
      .then(data => {
        const now = new Date();
        const index = now.getDate() % data.length;
        setQuote(data[index]);
      })
      .catch(err => console.error("Error loading quotes:", err));
  }, []);

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

  const advanceWudase = () => {
    if (!liturgy) return;
    
    if (wudaseStep === 0) {
      // Step 1: Opening -> Step 2: Yezewetir (Reading Phase)
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
      // Step 2: Yezewetir -> Step 3: Daily Portion (Reading Phase)
      const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      const today = days[new Date().getDay()];
      const portion = liturgy.portions[today];
      setReadingData({
        title: portion.dayName,
        bookId: 'wudase',
        bookName: portion.dayName,
        chapter: 2,
        totalChapters: 2,
        sections: portion.sections,
        liturgicalSeason: 'Daily'
      });
      setWudaseStep(2);
      goToPhase(AppPhase.READING);
    } else if (wudaseStep === 2) {
      // Step 3: Daily Portion -> Step 4: Summary (Wudase Amlak)
      goToPhase(AppPhase.SUMMARY);
    }
  };

  const handleFinishFlow = () => {
    if (readingData && !isDailyWudase) {
      completeChapter(readingData.bookId, readingData.chapter);
    } else if (isDailyWudase) {
      // Complete Wudase for the day
      completeChapter('wudase', 1);
    }
    goToPhase(AppPhase.DASHBOARD);
  };

  const renderPhase = () => {
    if (!liturgy && isDailyWudase) return <div className="p-10 text-center text-[#d4af37] ethiopic">Loading Liturgy...</div>;

    switch (phase) {
      case AppPhase.DASHBOARD:
        return <Dashboard onStart={startFlow} quote={quote || undefined} onOpenMemhir={() => goToPhase(AppPhase.ASK_MEMHIR)} />;
      case AppPhase.ASK_MEMHIR:
        return <AskMemhir onClose={() => goToPhase(AppPhase.DASHBOARD)} currentQuote={quote || undefined} />;
      case AppPhase.PREPARATION:
        return <PreparationPhase openingText={liturgy.opening} yezewetirText="" onComplete={advanceWudase} />;
      case AppPhase.READING:
        return (
          <ReadingPhase 
            data={readingData!} 
            isDailyManna={isDailyWudase}
            onNext={isDailyWudase ? advanceWudase : () => goToPhase(AppPhase.SUMMARY)} 
            onOpenMemhir={() => goToPhase(AppPhase.ASK_MEMHIR)}
            onFinish={handleFinishFlow}
            onSelectChapter={(chapter) => startFlow(readingData!.bookId, false, chapter)}
          />
        );
      case AppPhase.SUMMARY:
        return <SummaryPhase wudaseAmlakText={liturgy.wudaseAmlak} onFinish={handleFinishFlow} />;
      case AppPhase.REFLECTION:
        return <ReflectionPhase closingText="Peace be with you." instructionText="Take three bows." onRestart={handleFinishFlow} />;
      default:
        return null;
    }
  };

  return (
    <div className={`min-h-screen transition-opacity duration-500 ${showTransition ? 'opacity-0' : 'opacity-100'}`}>
      <div className="max-w-5xl mx-auto min-h-screen flex flex-col">{renderPhase()}</div>
    </div>
  );
};

export default App;
