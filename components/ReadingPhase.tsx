
import React, { useState, useRef, useEffect } from 'react';
import { DailyManna, Commentary, LanguageVisibility } from '../types';
import { Icons } from '../constants';

interface Props {
  data: DailyManna;
  isDailyManna: boolean;
  onNext: () => void;
  onOpenMemhir: () => void;
  onFinish: () => void;
  onSelectChapter: (chapter: number) => void;
}

const ReadingPhase: React.FC<Props> = ({ data, isDailyManna, onNext, onOpenMemhir, onFinish, onSelectChapter }) => {
  const [selectedWord, setSelectedWord] = useState<Commentary | null>(null);
  const [showChapterTray, setShowChapterTray] = useState(false);
  const [hasReachedBottom, setHasReachedBottom] = useState(false);
  const [langs, setLangs] = useState<LanguageVisibility>({
    geez: true,
    amharic: true,
    english: true
  });
  
  const trayRef = useRef<HTMLDivElement>(null);
  const mainRef = useRef<HTMLElement>(null);
  const touchStartX = useRef<number | null>(null);

  // Scroll detection logic - button only appears at the very bottom for Bible books
  // For Daily Routine (Wudase), we want it to be "continuously running", so it doesn't wait for scroll
  useEffect(() => {
    if (isDailyManna) {
      setHasReachedBottom(true);
      return;
    }

    const handleScroll = () => {
      const scrollHeight = document.documentElement.scrollHeight;
      const scrollTop = window.scrollY || document.documentElement.scrollTop;
      const clientHeight = window.innerHeight;
      
      // If we are within a small margin of the bottom
      if (scrollTop + clientHeight >= scrollHeight - 30) {
        setHasReachedBottom(true);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    
    return () => window.removeEventListener('scroll', handleScroll);
  }, [data.chapter, data.bookId, isDailyManna]);

  useEffect(() => {
    if (showChapterTray && trayRef.current) {
      const activeBtn = trayRef.current.querySelector(`[data-chapter="${data.chapter}"]`);
      if (activeBtn) {
        activeBtn.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
      }
    }
  }, [showChapterTray, data.chapter]);

  // Reset scroll position and bottom state on data change
  useEffect(() => {
    window.scrollTo(0, 0);
    if (!isDailyManna) {
      setHasReachedBottom(false);
    }
  }, [data.chapter, data.bookId, isDailyManna]);

  const toggleLang = (key: keyof LanguageVisibility) => {
    setLangs(prev => {
      const next = { ...prev, [key]: !prev[key] };
      if (!next.geez && !next.amharic && !next.english) return prev;
      return next;
    });
  };

  // Swipe logic for chapters (only for Bible books)
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null || isDailyManna) return;
    
    const touchEndX = e.changedTouches[0].clientX;
    const diff = touchStartX.current - touchEndX;
    const threshold = 70; 

    if (diff > threshold) {
      // Swipe Left -> Next
      if (data.chapter < data.totalChapters) {
        onSelectChapter(data.chapter + 1);
      }
    } else if (diff < -threshold) {
      // Swipe Right -> Prev
      if (data.chapter > 1) {
        onSelectChapter(data.chapter - 1);
      }
    }
    touchStartX.current = null;
  };

  const renderEnglishText = (text: string, commentaries: Commentary[] = []) => {
    if (!text) return null;
    let elements: React.ReactNode[] = [text];
    
    commentaries.forEach(c => {
      const termWords = c.term.split(' ');
      const mainWord = termWords[0];
      const termRegex = new RegExp(`(${mainWord})`, 'gi');
      const newElements: React.ReactNode[] = [];
      
      elements.forEach(el => {
        if (typeof el === 'string') {
          const parts = el.split(termRegex);
          parts.forEach((part, i) => {
            if (part.toLowerCase() === mainWord.toLowerCase()) {
              newElements.push(
                <span 
                  key={`${c.term}-${i}`}
                  onClick={() => setSelectedWord(c)}
                  className="cursor-pointer border-b border-[var(--gold)] border-dashed hover:bg-[var(--gold)]/10 transition-colors inline-block underline-offset-4"
                >
                  {part}
                </span>
              );
            } else {
              newElements.push(part);
            }
          });
        } else {
          newElements.push(el);
        }
      });
      elements = newElements;
    });

    return elements;
  };

  return (
    <div 
      className="flex-1 flex flex-col bg-[var(--bg-secondary)] text-[var(--text-primary)] animate-in fade-in duration-700 relative min-h-screen"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      <header className="sticky top-0 z-50 bg-[var(--bg-secondary)]/95 backdrop-blur-md border-b border-theme shadow-sm">
        <div className="px-2 py-2 md:px-4 md:py-3 flex justify-between items-center">
          <div className="flex items-center space-x-1">
            <button 
              onClick={onFinish}
              className="p-2 text-[var(--text-muted)] hover:text-[var(--text-primary)] rounded-full transition-all"
            >
              <Icons.Close />
            </button>
            <button 
              onClick={onOpenMemhir}
              className="p-2 text-[var(--gold)] hover:scale-110 transition-transform rounded-full"
            >
              <Icons.Message />
            </button>
          </div>

          <div className="flex flex-col items-center flex-1 min-w-0 px-2">
             <h2 className="serif text-[8px] md:text-[10px] font-bold leading-tight uppercase tracking-[0.2em] opacity-40 truncate w-full text-center">
               {isDailyManna ? "Divine Wudase" : data.title}
             </h2>
             <button 
               onClick={() => !isDailyManna && setShowChapterTray(!showChapterTray)}
               className={`flex items-center space-x-1.5 transition-all duration-300 ${showChapterTray ? 'text-[var(--gold)]' : 'text-[var(--text-primary)] hover:text-[var(--gold)]'}`}
               disabled={isDailyManna}
             >
               <span className="serif text-base md:text-lg font-bold">
                 {isDailyManna 
                   ? (data.chapter === 1 ? "Standard Prayers" : data.title) 
                   : `Chapter ${data.chapter}`}
               </span>
               {!isDailyManna && (
                 <div className={`transition-transform duration-300 ${showChapterTray ? 'rotate-180' : ''}`}>
                   <Icons.ChevronRight />
                 </div>
               )}
             </button>
          </div>

          <div className="flex items-center p-0.5 bg-[var(--card-bg)] rounded-full border border-theme">
            {[
              { id: 'geez', label: 'ግ' },
              { id: 'amharic', label: 'አ' },
              { id: 'english', label: 'E' }
            ].map((l) => (
              <button
                key={l.id}
                onClick={() => toggleLang(l.id as keyof LanguageVisibility)}
                className={`w-6 h-6 md:w-8 md:h-8 rounded-full text-[8px] md:text-[9px] font-bold transition-all flex items-center justify-center ${
                  langs[l.id as keyof LanguageVisibility] 
                  ? 'bg-[var(--gold)] text-black shadow-sm' 
                  : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                }`}
              >
                {l.label}
              </button>
            ))}
          </div>
        </div>

        {!isDailyManna && (
          <div 
            className={`overflow-hidden transition-all duration-500 ease-in-out border-t border-theme bg-[var(--bg-primary)]/40 ${
              showChapterTray ? 'max-h-24 opacity-100' : 'max-h-0 opacity-0 pointer-events-none'
            }`}
          >
            <div 
              ref={trayRef}
              className="flex items-center space-x-3 md:space-x-4 overflow-x-auto px-4 py-4 md:px-6 snap-x snap-mandatory scroll-smooth no-scrollbar"
            >
              {Array.from({ length: data.totalChapters }).map((_, i) => {
                const num = i + 1;
                const isCurrent = data.chapter === num;
                return (
                  <button
                    key={num}
                    data-chapter={num}
                    onClick={() => {
                      onSelectChapter(num);
                      setShowChapterTray(false);
                    }}
                    className={`flex-shrink-0 w-10 h-10 md:w-12 md:h-12 rounded-full snap-center flex items-center justify-center transition-all ${
                      isCurrent 
                        ? 'bg-[var(--gold)] text-black scale-110 shadow-lg' 
                        : 'bg-[var(--card-bg)] border border-theme text-[var(--text-muted)] hover:text-[var(--gold)]'
                    }`}
                  >
                    <span className="text-xs md:text-sm font-bold serif">{num}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </header>

      <main 
        ref={mainRef}
        className="flex-1 p-6 md:p-16 space-y-12 md:space-y-20 max-w-2xl mx-auto pb-48"
      >
        {data.sections.map((section, sIdx) => (
          <div key={sIdx} className="space-y-12">
            {section.title && (
              <div className="text-center">
                <div className="flex items-center justify-center space-x-4 mb-4 opacity-50">
                  <div className="h-px w-8 bg-[var(--gold)]"></div>
                  <h3 className="ethiopic text-xl md:text-2xl text-[var(--gold)] font-bold tracking-wider">{section.title}</h3>
                  <div className="h-px w-8 bg-[var(--gold)]"></div>
                </div>
              </div>
            )}
            
            {section.verses.map((v) => (
              <div key={v.verse} className="space-y-6 animate-in slide-in-from-bottom-2 duration-500">
                <div className="flex items-start gap-4 md:gap-8">
                   {!isDailyManna && (
                     <span className="text-[10px] md:text-[11px] text-[var(--gold)] font-black pt-2 opacity-30 w-8 text-right">
                       {v.verse}
                     </span>
                   )}
                   <div className="space-y-6 flex-1">
                     {v.geez && langs.geez && (
                       <p className="ethiopic text-2xl md:text-3xl leading-[1.8] text-[var(--text-primary)] font-medium animate-in fade-in duration-500">{v.geez}</p>
                     )}
                     {v.text && langs.amharic && (
                       <p className="ethiopic text-2xl md:text-3xl leading-[1.8] text-[var(--gold)] font-light italic animate-in fade-in duration-500 whitespace-pre-wrap">{v.text}</p>
                     )}
                     {v.english && langs.english && (
                       <p className="text-lg md:text-xl serif leading-relaxed text-[var(--text-secondary)] italic font-light border-l-2 border-[var(--gold)]/20 pl-6 animate-in fade-in duration-500">
                         {renderEnglishText(v.english, v.commentary)}
                       </p>
                     )}
                   </div>
                </div>
              </div>
            ))}
          </div>
        ))}
      </main>

      {/* Persistent footer reveals button for Bible books, or remains available for Daily Routine */}
      <div className={`fixed bottom-0 left-0 w-full p-6 md:p-12 flex justify-center z-40 bg-gradient-to-t from-[var(--bg-secondary)] via-[var(--bg-secondary)]/90 to-transparent transition-all duration-700 ${hasReachedBottom ? 'translate-y-0 opacity-100' : 'translate-y-12 opacity-0 pointer-events-none'}`}>
        <button 
          onClick={isDailyManna ? onNext : onFinish}
          className="bg-[var(--text-primary)] text-[var(--bg-primary)] px-10 md:px-16 py-4 md:py-6 rounded-full font-black shadow-2xl flex items-center space-x-4 hover:scale-105 transition-all group active:scale-95"
        >
          <span className="serif text-xl md:text-2xl tracking-wide">
            {isDailyManna ? (data.chapter === 1 ? "Daily Portion" : "Summarize") : "Finish Scroll"}
          </span>
          <div className="group-hover:translate-x-1 transition-transform text-[var(--gold)]">
            <Icons.ChevronRight />
          </div>
        </button>
      </div>
      
      {/* Commentary Overlay */}
      {selectedWord && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-6 animate-in fade-in">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-md" onClick={() => setSelectedWord(null)} />
          <div className="relative w-full max-w-sm bg-[var(--bg-primary)] border border-[var(--gold)]/30 rounded-[2.5rem] p-10 shadow-2xl animate-in zoom-in-95 duration-300">
             <div className="flex justify-between items-start mb-6">
                <div>
                  <h4 className="ethiopic text-2xl text-[var(--gold)] mb-1">{selectedWord.term}</h4>
                  <span className="text-[9px] uppercase tracking-[0.2em] text-[var(--text-muted)] font-black">Andimta Insight</span>
                </div>
                <button onClick={() => setSelectedWord(null)} className="p-2 text-[var(--text-muted)] hover:text-[var(--text-primary)]">
                  <Icons.Close />
                </button>
             </div>
             <div className="space-y-6">
                <p className="text-[var(--text-primary)] leading-relaxed italic text-lg">"{selectedWord.explanation}"</p>
                <div className="p-5 bg-[var(--card-bg)] rounded-2xl border-l-4 border-[var(--gold)] text-[var(--text-secondary)] text-sm italic">
                  {selectedWord.theology}
                </div>
             </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReadingPhase;
