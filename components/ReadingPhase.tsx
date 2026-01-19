
import React, { useState, useRef, useEffect } from 'react';
import { DailyManna, Commentary, LanguageVisibility } from '../types';
import { Icons } from '../constants';
import { useProgress } from '../hooks/useProgress';

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
  const [langs, setLangs] = useState<LanguageVisibility>({
    geez: true,
    amharic: true,
    english: true
  });
  
  const trayRef = useRef<HTMLDivElement>(null);
  const { stats } = useProgress();

  useEffect(() => {
    if (showChapterTray && trayRef.current) {
      const activeBtn = trayRef.current.querySelector(`[data-chapter="${data.chapter}"]`);
      if (activeBtn) {
        activeBtn.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
      }
    }
  }, [showChapterTray, data.chapter]);

  const toggleLang = (key: keyof LanguageVisibility) => {
    setLangs(prev => {
      const next = { ...prev, [key]: !prev[key] };
      if (!next.geez && !next.amharic && !next.english) return prev;
      return next;
    });
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
                  className="cursor-pointer border-b border-[#d4af37] border-dashed hover:bg-[#d4af37]/10 transition-colors inline-block underline-offset-4"
                  style={{ textDecorationStyle: 'dashed' }}
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
    <div className="flex-1 flex flex-col bg-[#f4f1ea] text-[#2c2c2c] animate-in fade-in duration-700 relative">
      <header className="sticky top-0 z-50 bg-[#f4f1ea]/95 backdrop-blur-md border-b border-black/5 shadow-sm">
        <div className="px-2 py-2 md:px-4 md:py-3 flex justify-between items-center">
          <div className="flex items-center space-x-0.5">
            <button 
              onClick={onFinish}
              className="p-2 text-gray-400 hover:text-black hover:bg-black/5 rounded-full transition-all"
              title="Close Reading"
            >
              <Icons.Close />
            </button>
            <button 
              onClick={onOpenMemhir}
              className="p-2 text-[#d4af37] hover:scale-110 transition-transform rounded-full hover:bg-black/5"
              title="Ask Memhir"
            >
              <Icons.Message />
            </button>
          </div>

          <div className="flex flex-col items-center flex-1 min-w-0 px-2">
             <h2 className="serif text-[8px] md:text-[9px] font-bold leading-tight uppercase tracking-[0.2em] opacity-40 truncate w-full text-center">
               {isDailyManna ? "Divine Wudase" : data.title}
             </h2>
             <button 
               onClick={() => !isDailyManna && setShowChapterTray(!showChapterTray)}
               className={`flex items-center space-x-1.5 transition-all duration-300 ${showChapterTray ? 'text-[#d4af37] scale-105' : 'text-[#2c2c2c] hover:text-[#d4af37]'}`}
               disabled={isDailyManna}
             >
               <span className="serif text-base md:text-lg font-bold truncate max-w-[140px] md:max-w-none">
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

          <div className="flex items-center p-0.5 bg-black/5 rounded-full border border-black/5">
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
                  ? 'bg-[#d4af37] text-white shadow-sm' 
                  : 'text-gray-400 hover:text-gray-600'
                }`}
              >
                {l.label}
              </button>
            ))}
          </div>
        </div>

        {!isDailyManna && (
          <div 
            className={`overflow-hidden transition-all duration-500 ease-in-out border-t border-black/5 bg-black/[0.02] ${
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
                    className={`flex-shrink-0 w-10 h-10 md:w-12 md:h-12 rounded-full snap-center flex flex-col items-center justify-center transition-all relative ${
                      isCurrent 
                        ? 'bg-[#d4af37] text-white scale-110 shadow-[0_0_15px_rgba(212,175,55,0.4)]' 
                        : 'bg-white border border-black/5 text-gray-400 hover:border-[#d4af37]/30 hover:text-[#d4af37]'
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

      <main className="flex-1 p-4 md:p-12 space-y-8 md:space-y-12 max-w-2xl mx-auto pb-48">
        {data.sections.map((section, sIdx) => (
          <div key={sIdx} className="space-y-8 md:space-y-12">
            {section.title && (
              <div className="text-center py-2 md:py-4">
                <div className="flex items-center justify-center space-x-3 md:space-x-4 mb-2">
                  <div className="h-px w-6 md:w-8 bg-[#d4af37]/30"></div>
                  <h3 className="ethiopic text-xl md:text-2xl text-[#d4af37] font-bold tracking-wider">{section.title}</h3>
                  <div className="h-px w-6 md:w-8 bg-[#d4af37]/30"></div>
                </div>
              </div>
            )}
            
            {section.verses.map((v) => (
              <div key={v.verse} className="space-y-4 md:space-y-6 animate-in slide-in-from-bottom-2 duration-500">
                <div className="flex items-start gap-3 md:gap-6">
                   {!isDailyManna && <span className="text-[10px] md:text-[11px] text-[#d4af37] font-bold pt-1.5 md:pt-1 opacity-40 w-6 md:w-8 text-right">v.{v.verse}</span>}
                   <div className="space-y-4 md:space-y-6 flex-1">
                     {v.geez && langs.geez && (
                       <p className="ethiopic text-xl md:text-3xl leading-[1.8] text-black/90 font-medium animate-in fade-in duration-500">{v.geez}</p>
                     )}
                     {v.text && langs.amharic && (
                       <p className="ethiopic text-xl md:text-3xl leading-[1.8] text-[#b4941f] font-light italic animate-in fade-in duration-500 whitespace-pre-wrap">{v.text}</p>
                     )}
                     {v.english && langs.english && (
                       <p className="text-base md:text-xl serif leading-relaxed text-black/75 italic font-light tracking-tight border-l-2 border-[#d4af37]/20 pl-4 md:pl-6 animate-in fade-in duration-500">{renderEnglishText(v.english, v.commentary)}</p>
                     )}
                   </div>
                </div>
              </div>
            ))}
          </div>
        ))}
      </main>

      <div className="fixed bottom-0 left-0 w-full p-6 md:p-10 flex justify-center z-40 bg-gradient-to-t from-[#f4f1ea] via-[#f4f1ea]/80 to-transparent">
        <button 
          onClick={isDailyManna ? onNext : onFinish}
          className="bg-[#2c2c2c] text-[#f4f1ea] px-8 md:px-12 py-4 md:py-5 rounded-full font-bold shadow-2xl flex items-center space-x-3 hover:scale-105 hover:bg-black transition-all group active:scale-95"
        >
          <span className="serif text-lg md:text-xl tracking-wide">{isDailyManna ? (data.chapter === 1 ? "Daily Portion" : "Summarize") : "Finish Scroll"}</span>
          <div className="group-hover:translate-x-1 transition-transform text-[#d4af37]">
            <Icons.ChevronRight />
          </div>
        </button>
      </div>
      
      {/* Commentary Overlay */}
      {selectedWord && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-6 animate-in fade-in duration-300">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setSelectedWord(null)} />
          <div className="relative w-full max-w-sm bg-[#1a1a1f] border border-[#d4af37]/30 rounded-[2rem] p-8 shadow-2xl animate-in zoom-in-95 duration-300">
             <div className="flex justify-between items-start mb-6">
                <div>
                  <h4 className="ethiopic text-2xl text-[#d4af37] mb-1">{selectedWord.term}</h4>
                  <span className="text-[10px] uppercase tracking-widest text-gray-500 font-bold">Andimta Insight</span>
                </div>
                <button onClick={() => setSelectedWord(null)} className="p-2 bg-white/5 rounded-full text-gray-400 hover:text-white transition-colors">
                  <Icons.Close />
                </button>
             </div>
             <div className="space-y-4">
                <p className="text-gray-200 leading-relaxed italic">"{selectedWord.explanation}"</p>
                <div className="p-4 bg-white/5 rounded-xl border-l-2 border-[#d4af37] text-gray-400 text-sm italic">
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
