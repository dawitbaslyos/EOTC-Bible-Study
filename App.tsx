
import React, { useState, useEffect } from 'react';
import { AppPhase, WudaseLiturgy, DailyManna, Quote } from './types';
import Dashboard from './components/Dashboard';
import PreparationPhase from './components/PreparationPhase';
import ReadingPhase from './components/ReadingPhase';
import SummaryPhase from './components/SummaryPhase';
import ReflectionPhase from './components/ReflectionPhase';
import { useProgress } from './hooks/useProgress';

const App: React.FC = () => {
  const [phase, setPhase] = useState<AppPhase>(AppPhase.DASHBOARD);
  const [showTransition, setShowTransition] = useState(false);
  const [isDailyWudase, setIsDailyWudase] = useState(false);
  const [currentBookId, setCurrentBookId] = useState<string>('');
  const [liturgy, setLiturgy] = useState<WudaseLiturgy | null>(null);
  const [bibleData, setBibleData] = useState<any>(null);
  const [readingData, setReadingData] = useState<DailyManna | null>(null);
  const [quote, setQuote] = useState<Quote | null>(null);
  const { completeChapter, getNextChapter } = useProgress();

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

    // Load Quotes and select one for the day
    fetch('./quotes.json')
      .then(res => res.json())
      .then(data => {
        const now = new Date();
        const start = new Date(now.getFullYear(), 0, 0);
        const diff = (now.getTime() - start.getTime()) + ((start.getTimezoneOffset() - now.getTimezoneOffset()) * 60 * 1000);
        const oneDay = 1000 * 60 * 60 * 24;
        const dayOfYear = Math.floor(diff / oneDay);
        
        // Use dayOfYear to cycle through available quotes
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

  const startFlow = (bookId: string, isWudase: boolean) => {
    setIsDailyWudase(isWudase);
    setCurrentBookId(bookId);

    if (isWudase) {
      if (liturgy) {
        const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        const today = days[new Date().getDay()];
        const portion = liturgy.portions[today];
        
        setReadingData({
          title: "Wudase Maryam",
          bookId: 'wudase',
          bookName: portion?.dayName || "Daily Portion",
          chapter: 1, // Using 1 for daily sessions
          verses: portion?.verses || [],
          liturgicalSeason: 'Normal'
        });
        goToPhase(AppPhase.PREPARATION);
      }
    } else {
      if (bibleData && bibleData[bookId]) {
        const chapterNum = getNextChapter(bookId);
        const bookContent = bibleData[bookId];
        const chapterContent = bookContent.chapters[chapterNum] || bookContent.chapters["1"];
        
        setReadingData({
          title: bookContent.bookName,
          bookId: bookId,
          bookName: bookContent.bookName,
          chapter: chapterNum,
          verses: chapterContent.verses,
          liturgicalSeason: 'General'
        });
        goToPhase(AppPhase.READING);
      } else {
        console.warn(`Content for book ${bookId} not found.`);
        setReadingData({
          title: "Book of Silence",
          bookId: bookId,
          bookName: "Metsihafe...",
          chapter: 1,
          verses: [{
            id: "1",
            geez: "ይህ ክፍል ገና አልተተረጎመም።",
            amharic: "ይህ ክፍል ገና አልተተረጎመም።",
            english: "This section is not yet available in the digital scroll.",
          }],
          liturgicalSeason: 'Normal'
        });
        goToPhase(AppPhase.READING);
      }
    }
  };

  const handleFinishFlow = () => {
    if (readingData) {
      // Logic for logging progress to heatmap
      completeChapter(readingData.bookId, readingData.chapter);
    }
    goToPhase(AppPhase.DASHBOARD);
  };

  const renderPhase = () => {
    if ((isDailyWudase && !liturgy) || (!isDailyWudase && phase !== AppPhase.DASHBOARD && !readingData)) {
      return (
        <div className="flex-1 flex flex-col items-center justify-center space-y-4">
          <div className="w-12 h-12 border-4 border-[#d4af37]/20 border-t-[#d4af37] rounded-full animate-spin" />
          <p className="text-[#d4af37] serif italic tracking-widest">Unrolling the Scrolls...</p>
        </div>
      );
    }

    switch (phase) {
      case AppPhase.DASHBOARD:
        return <Dashboard onStart={startFlow} quote={quote || undefined} />;
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
            onOpenMemhir={() => goToPhase(AppPhase.REFLECTION)}
            onFinish={handleFinishFlow}
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
        return <Dashboard onStart={startFlow} quote={quote || undefined} />;
    }
  };

  return (
    <div className={`min-h-screen transition-opacity duration-500 ${showTransition ? 'opacity-0' : 'opacity-100'}`}>
      <div className="max-w-5xl mx-auto min-h-screen flex flex-col">
        {renderPhase()}
      </div>
      
      {phase !== AppPhase.DASHBOARD && phase !== AppPhase.PREPARATION && (
        <div className="fixed bottom-0 left-0 w-full p-4 flex justify-center space-x-2 bg-black/80 backdrop-blur-xl border-t border-white/5 z-30">
          {Object.values(AppPhase).map((p) => (
            <div 
              key={p} 
              className={`h-1 w-8 rounded-full transition-all duration-500 ${
                p === phase ? 'bg-[#d4af37] w-12 shadow-[0_0_15px_#d4af37]' : 'bg-gray-800/50'
              }`} 
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default App;
