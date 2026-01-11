
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
  const [currentBookId, setCurrentBookId] = useState<string>('');
  const [liturgy, setLiturgy] = useState<WudaseLiturgy | null>(null);
  const [bibleData, setBibleData] = useState<BibleBookJSON[] | null>(null);
  const [readingData, setReadingData] = useState<DailyManna | null>(null);
  const [quote, setQuote] = useState<Quote | null>(null);
  const { completeChapter, getNextChapter, updateLastAccessed } = useProgress();

  useEffect(() => {
    // Load Liturgy
    fetch('./wudase-liturgy.json')
      .then(res => res.json())
      .then(data => setLiturgy(data))
      .catch(err => console.error("Error loading liturgy:", err));

    // Load Bible Content
    fetch('./bible-content.json')
      .then(res => res.json())
      .then(data => setBibleData(data))
      .catch(err => console.error("Error loading bible content:", err));

    // Load Quotes
    fetch('./quotes.json')
      .then(res => res.json())
      .then(data => {
        const now = new Date();
        const start = new Date(now.getFullYear(), 0, 0);
        const diff = (now.getTime() - start.getTime()) + ((start.getTimezoneOffset() - now.getTimezoneOffset()) * 60 * 1000);
        const oneDay = 1000 * 60 * 60 * 24;
        const dayOfYear = Math.floor(diff / oneDay);
        const index = dayOfYear % data.length;
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
    setCurrentBookId(bookId);
    if (!isWudase) updateLastAccessed(bookId);

    if (isWudase) {
      if (liturgy) {
        const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        const today = days[new Date().getDay()];
        const portion = liturgy.portions[today];
        
        setReadingData({
          title: "Wudase Maryam",
          bookId: 'wudase',
          bookName: portion?.dayName || "Daily Portion",
          chapter: 1,
          totalChapters: 1,
          sections: [{
            title: portion?.dayName || "Portion",
            verses: portion?.verses.map(v => ({
              verse: parseInt(v.id.replace(/\D/g, '') || '1'),
              text: v.amharic,
              geez: v.geez,
              english: v.english,
              commentary: v.commentary
            })) || []
          }],
          liturgicalSeason: 'Normal'
        });
        goToPhase(AppPhase.PREPARATION);
      }
    } else if (bibleData) {
      const bookObj = bibleData.find(b => 
        b.book_short_name_en.toLowerCase() === bookId.toLowerCase() || 
        b.book_name_en.toLowerCase() === bookId.toLowerCase() ||
        b.book_short_name_am === bookId
      );

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

  const handleFinishFlow = () => {
    if (readingData) {
      completeChapter(readingData.bookId, readingData.chapter);
    }
    goToPhase(AppPhase.DASHBOARD);
  };

  const renderPhase = () => {
    if ((isDailyWudase && !liturgy) || (!isDailyWudase && phase !== AppPhase.DASHBOARD && phase !== AppPhase.ASK_MEMHIR && !readingData)) {
      return (
        <div className="flex-1 flex flex-col items-center justify-center space-y-4">
          <div className="w-12 h-12 border-4 border-[#d4af37]/20 border-t-[#d4af37] rounded-full animate-spin" />
          <p className="text-[#d4af37] serif italic tracking-widest">Unrolling the Scrolls...</p>
        </div>
      );
    }

    switch (phase) {
      case AppPhase.DASHBOARD:
        return (
          <Dashboard 
            onStart={startFlow} 
            quote={quote || undefined} 
            onOpenMemhir={() => goToPhase(AppPhase.ASK_MEMHIR)} 
          />
        );
      case AppPhase.ASK_MEMHIR:
        return (
          <AskMemhir 
            onClose={() => goToPhase(AppPhase.DASHBOARD)} 
            currentQuote={quote || undefined} 
          />
        );
      case AppPhase.PREPARATION:
        return (
          <PreparationPhase 
            openingText={liturgy!.opening}
            yezewetirText={liturgy!.yezewetir}
            onComplete={() => goToPhase(AppPhase.READING)} 
          />
        );
      case AppPhase.READING:
        return (
          <ReadingPhase 
            data={readingData!} 
            isDailyManna={isDailyWudase}
            onNext={() => goToPhase(AppPhase.SUMMARY)} 
            onOpenMemhir={() => goToPhase(AppPhase.ASK_MEMHIR)}
            onFinish={handleFinishFlow}
            onSelectChapter={(chapter) => startFlow(readingData!.bookId, false, chapter)}
          />
        );
      case AppPhase.SUMMARY:
        return (
          <SummaryPhase 
            wudaseAmlakText={liturgy!.wudaseAmlak}
            onFinish={() => goToPhase(AppPhase.REFLECTION)} 
          />
        );
      case AppPhase.REFLECTION:
        return (
          <ReflectionPhase 
            closingText={isDailyWudase ? liturgy!.closing : "May the Word take root in your heart like a seed in good soil."}
            instructionText={isDailyWudase ? liturgy!.bowingInstructions : "Take a moment of silence or perform three bows."}
            onRestart={handleFinishFlow} 
          />
        );
      default:
        return <Dashboard onStart={startFlow} onOpenMemhir={() => goToPhase(AppPhase.ASK_MEMHIR)} quote={quote || undefined} />;
    }
  };

  return (
    <div className={`min-h-screen transition-opacity duration-500 ${showTransition ? 'opacity-0' : 'opacity-100'}`}>
      <div className="max-w-5xl mx-auto min-h-screen flex flex-col">
        {renderPhase()}
      </div>
    </div>
  );
};

export default App;
