
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
  
  const mainRef = useRef<HTMLElement>(null);
  const touchStartX = useRef<number | null>(null);

  useEffect(() => {
    if (isDailyManna) {
      setHasReachedBottom(true);
      return;
    }

    const handleScroll = () => {
      const scrollHeight = document.documentElement.scrollHeight;
      const scrollTop = window.scrollY || document.documentElement.scrollTop;
      const clientHeight = window.innerHeight;
      
      // If user is within 30px of the bottom
      if (scrollTop + clientHeight >= scrollHeight - 30) {
        setHasReachedBottom(true);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, [data.chapter, data.bookId, isDailyManna]);

  useEffect(() => {
    window.scrollTo(0, 0);
    if (!isDailyManna) setHasReachedBottom(false);
  }, [data.chapter, data.bookId, isDailyManna]);

  const toggleLang = (key: keyof LanguageVisibility) => {
    setLangs(prev => {
      const next = { ...prev, [key]: !prev[key] };
      if (!next.geez && !next.amharic && !next.english) return prev;
      return next;
    });
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null || isDailyManna) return;
    const touchEndX = e.changedTouches[0].clientX;
    const diff = touchStartX.current - touchEndX;
    const threshold = 70; 

    if (diff > threshold && data.chapter < data.totalChapters) {
      onSelectChapter(data.chapter + 1);
    } else if (diff < -threshold && data.chapter > 1) {
      onSelectChapter(data.chapter - 1);
    }
    touchStartX.current = null;
  };

  return (
    <div 
      className="flex-1 flex flex-col bg-[var(--bg-secondary)] text-[var(--text-primary)] relative min-h-screen"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      <header className="sticky top-0 z-50 bg-[var(--bg-secondary)]/95 backdrop-blur-md border-b border-theme shadow-sm">
        <div className="px-2 py-2 md:px-4 md:py-3 flex justify-between items-center">
          <div className="flex items-center space-x-1">
            <button onClick={onFinish} className="p-2 text-[var(--text-muted)] hover:text-[var(--text-primary)] rounded-full transition-all">
              <Icons.Close />
            </button>
            <button onClick={onOpenMemhir} className="p-2 text-[var(--gold)] hover:scale-110 transition-transform rounded-full">
              <Icons.Message />
            </button>
          </div>

          <div className="flex flex-col items-center flex-1 min-w-0 px-2">
             <h2 className="serif text-[8px] md:text-[10px] font-bold leading-tight uppercase tracking-[0.2em] opacity-40 truncate w-full text-center">
               {isDailyManna ? "Divine Wudase" : data.title}
             </h2>
             <button onClick={() => !isDailyManna && setShowChapterTray(!showChapterTray)} className="serif text-base md:text-lg font-bold" disabled={isDailyManna}>
               {isDailyManna ? (data.chapter === 1 ? "Standard Prayers" : data.title) : `Chapter ${data.chapter}`}
             </button>
          </div>

          <div className="flex items-center p-0.5 bg-[var(--card-bg)] rounded-full border border-theme">
            {['geez', 'amharic', 'english'].map((id) => (
              <button
                key={id}
                onClick={() => toggleLang(id as keyof LanguageVisibility)}
                className={`w-7 h-7 md:w-8 md:h-8 rounded-full text-[8px] md:text-[9px] font-bold transition-all flex items-center justify-center ${
                  langs[id as keyof LanguageVisibility] ? 'bg-[var(--gold)] text-black' : 'text-[var(--text-muted)]'
                }`}
              >
                {id[0].toUpperCase()}
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* Horizontal chapter selector tray under header */}
      {!isDailyManna && showChapterTray && (
        <div className="bg-[var(--bg-secondary)]/95 border-b border-theme/60">
          <div className="px-3 md:px-6 py-3 flex items-center justify-between">
            <span className="text-[9px] uppercase tracking-[0.18em] text-[var(--text-muted)]">
              Select Chapter
            </span>
            <button
              onClick={() => setShowChapterTray(false)}
              className="text-[10px] uppercase tracking-[0.18em] text-[var(--text-muted)] hover:text-[var(--text-primary)]"
            >
              Close
            </button>
          </div>
          <div className="px-3 md:px-6 pb-3 overflow-x-auto custom-scrollbar">
            <div className="flex space-x-2 md:space-x-3">
              {Array.from({ length: data.totalChapters }).map((_, idx) => {
                const num = idx + 1;
                const isActive = num === data.chapter;
                return (
                  <button
                    key={num}
                    onClick={() => {
                      onSelectChapter(num);
                      setShowChapterTray(false);
                    }}
                    className={`px-3 md:px-4 py-1.5 md:py-2 rounded-full text-[10px] md:text-[11px] font-bold uppercase tracking-[0.18em] whitespace-nowrap transition-all ${
                      isActive
                        ? 'bg-[var(--gold)] text-black shadow-md'
                        : 'bg-[var(--card-bg)] text-[var(--text-muted)] border border-theme hover:text-[var(--gold)]'
                    }`}
                  >
                    Ch. {num}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      <main ref={mainRef} className="flex-1 p-6 md:p-16 space-y-12 max-w-2xl mx-auto pb-48">
        {data.sections.map((section, sIdx) => (
          <div key={sIdx} className="space-y-12">
            {section.title && (
              <div className="text-center opacity-50 flex items-center justify-center space-x-4">
                <div className="h-px w-8 bg-[var(--gold)]"></div>
                <h3 className="ethiopic text-xl text-[var(--gold)] font-bold">{section.title}</h3>
                <div className="h-px w-8 bg-[var(--gold)]"></div>
              </div>
            )}
            {section.verses.map((v) => (
              <div key={v.verse} className="space-y-6">
                <div className="flex items-start gap-4">
                   {!isDailyManna && <span className="text-[10px] text-[var(--gold)] font-black pt-2 opacity-30 w-8 text-right">{v.verse}</span>}
                   <div className="space-y-6 flex-1">
                     {v.geez && langs.geez && <p className="ethiopic text-2xl leading-[1.8]">{v.geez}</p>}
                     {v.text && langs.amharic && <p className="ethiopic text-2xl leading-[1.8] text-[var(--gold)] italic">{v.text}</p>}
                     {v.english && langs.english && <p className="serif text-lg leading-relaxed text-[var(--text-secondary)] italic border-l-2 border-[var(--gold)]/20 pl-6">{v.english}</p>}
                   </div>
                </div>
              </div>
            ))}
          </div>
        ))}
      </main>

      <div className={`fixed bottom-0 left-0 w-full p-6 md:p-12 flex justify-center z-40 transition-all duration-700 ${hasReachedBottom ? 'translate-y-0 opacity-100' : 'translate-y-12 opacity-0 pointer-events-none'}`}>
        <button 
          onClick={onNext}
          className="bg-[var(--text-primary)] text-[var(--bg-primary)] px-10 md:px-16 py-4 md:py-6 rounded-full font-black shadow-2xl flex items-center space-x-4 hover:scale-105 active:scale-95 transition-all group"
        >
          <span className="serif text-xl tracking-wide">{isDailyManna ? (data.chapter === 1 ? "Daily Portion" : "Summarize") : "Finish Scroll"}</span>
          <Icons.ChevronRight className="group-hover:translate-x-1 transition-transform text-[var(--gold)]" />
        </button>
      </div>
    </div>
  );
};

export default ReadingPhase;
