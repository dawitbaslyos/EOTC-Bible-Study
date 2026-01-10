
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

  // Auto-scroll current chapter into view when tray opens
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
    <div className="flex-1 flex flex-col bg-[#f4f1ea] text-[#2c2c2c] animate-in fade-in duration-1000 relative">
      <header className="sticky top-0 z-50 bg-[#f4f1ea]/95 backdrop-blur border-b border-black/5">
        <div className="px-4 py-3 flex justify-between items-center">
          <div className="flex items-center">
            <button 
              onClick={onOpenMemhir}
              className="p-2 text-[#d4af37] hover:scale-110 transition-transform rounded-full hover:bg-black/5"
              title="Ask Memhir"
            >
              <Icons.Message />
            </button>
          </div>

          <div className="flex flex-col items-center">
             <h2 className="serif text-xs font-bold leading-tight uppercase tracking-widest opacity-40">{data.title}</h2>
             <button 
               onClick={() => setShowChapterTray(!showChapterTray)}
               className={`flex items-center space-x-2 transition-all duration-300 ${showChapterTray ? 'text-[#d4af37] scale-110' : 'text-[#2c2c2c] hover:text-[#d4af37]'}`}
             >
               <span className="serif text-lg font-bold">Chapter {data.chapter}</span>
               <div className={`transition-transform duration-300 ${showChapterTray ? 'rotate-180' : ''}`}>
                 <Icons.ChevronRight />
               </div>
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
                className={`w-7 h-7 rounded-full text-[9px] font-bold transition-all flex items-center justify-center ${
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

        {/* Fold-out Chapter Tray */}
        <div 
          className={`overflow-hidden transition-all duration-500 ease-in-out border-t border-black/5 bg-black/[0.02] ${
            showChapterTray ? 'max-h-24 opacity-100' : 'max-h-0 opacity-0 pointer-events-none'
          }`}
        >
          <div 
            ref={trayRef}
            className="flex items-center space-x-4 overflow-x-auto px-6 py-4 snap-x snap-mandatory scroll-smooth no-scrollbar"
          >
            {Array.from({ length: data.totalChapters }).map((_, i) => {
              const num = i + 1;
              const isCurrent = data.chapter === num;
              const isCompleted = stats.bookProgress[data.bookId]?.completedChapters.includes(num);
              
              return (
                <button
                  key={num}
                  data-chapter={num}
                  onClick={() => {
                    onSelectChapter(num);
                    setShowChapterTray(false);
                  }}
                  className={`flex-shrink-0 w-12 h-12 rounded-full snap-center flex flex-col items-center justify-center transition-all relative ${
                    isCurrent 
                      ? 'bg-[#d4af37] text-white scale-110 shadow-[0_0_15px_rgba(212,175,55,0.4)]' 
                      : 'bg-white border border-black/5 text-gray-400 hover:border-[#d4af37]/30 hover:text-[#d4af37]'
                  }`}
                >
                  <span className="text-sm font-bold serif">{num}</span>
                  {isCompleted && !isCurrent && (
                    <div className="absolute -bottom-1 w-1 h-1 bg-[#d4af37] rounded-full" />
                  )}
                </button>
              );
            })}
            <div className="flex-shrink-0 w-12" /> {/* Spacer for end padding */}
          </div>
        </div>
      </header>

      <main className="flex-1 p-6 md:p-12 space-y-12 max-w-2xl mx-auto pb-48">
        {data.sections.map((section, sIdx) => (
          <div key={sIdx} className="space-y-12">
            {section.title && (
              <div className="text-center py-4">
                <div className="flex items-center justify-center space-x-4 mb-2">
                  <div className="h-px w-8 bg-[#d4af37]/30"></div>
                  <h3 className="ethiopic text-2xl text-[#d4af37] font-bold tracking-wider">{section.title}</h3>
                  <div className="h-px w-8 bg-[#d4af37]/30"></div>
                </div>
              </div>
            )}
            
            {section.verses.map((v) => (
              <div key={v.verse} className="space-y-6 animate-in slide-in-from-bottom-4 duration-700">
                <div className="flex items-start gap-4 sm:gap-6">
                   <span className="text-[11px] text-[#d4af37] font-bold pt-1 opacity-40 w-8">v.{v.verse}</span>
                   <div className="space-y-6 flex-1">
                     {v.geez && langs.geez && (
                       <p className="ethiopic text-2xl sm:text-3xl leading-[1.6] text-black/90 font-medium animate-in fade-in duration-500">
                         {v.geez}
                       </p>
                     )}
                     {v.text && langs.amharic && (
                       <p className="ethiopic text-2xl sm:text-3xl leading-[1.6] text-[#b4941f] font-light italic animate-in fade-in duration-500">
                         {v.text}
                       </p>
                     )}
                     {v.english && langs.english && (
                       <p className="text-lg sm:text-xl serif leading-relaxed text-black/75 italic font-light tracking-tight border-l-2 border-[#d4af37]/20 pl-6 animate-in fade-in duration-500">
                         {renderEnglishText(v.english, v.commentary)}
                       </p>
                     )}
                   </div>
                </div>
              </div>
            ))}
          </div>
        ))}

        <div className="pt-20 text-center flex flex-col items-center space-y-4">
           <div className="w-12 h-px bg-black/10"></div>
           <p className="serif italic text-gray-500">End of the Scroll</p>
           <div className="w-12 h-px bg-black/10"></div>
        </div>
      </main>

      {selectedWord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/40 backdrop-blur-md">
          <div className="bg-white rounded-[2rem] p-8 shadow-2xl max-w-sm w-full border border-black/5 animate-in zoom-in-95 duration-300">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h4 className="text-3xl ethiopic text-[#d4af37] mb-1">{selectedWord.term}</h4>
                <div className="text-[10px] uppercase tracking-widest text-gray-400">Andimta Commentary</div>
              </div>
              <button onClick={() => setSelectedWord(null)} className="text-gray-400 p-2 hover:bg-gray-100 rounded-full transition-colors">
                <Icons.Close />
              </button>
            </div>
            <div className="space-y-6">
              <p className="text-gray-700 leading-relaxed italic text-lg">{selectedWord.explanation}</p>
              <div className="p-5 bg-[#f4f1ea] rounded-[1.5rem] border-l-4 border-[#d4af37]">
                <p className="text-[10px] font-bold text-[#d4af37] uppercase mb-2 tracking-widest">Mystery</p>
                <p className="text-md text-gray-500 italic leading-relaxed">"{selectedWord.theology}"</p>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="fixed bottom-0 left-0 w-full p-10 flex justify-center z-40 bg-gradient-to-t from-[#f4f1ea] via-[#f4f1ea]/80 to-transparent">
        {isDailyManna ? (
          <button 
            onClick={onNext}
            className="bg-[#2c2c2c] text-[#f4f1ea] px-12 py-5 rounded-full font-bold shadow-2xl flex items-center space-x-3 hover:scale-105 hover:bg-black transition-all group"
          >
            <span className="serif text-xl tracking-wide">Summarize</span>
            <div className="group-hover:translate-x-1 transition-transform text-[#d4af37]">
              <Icons.Eye />
            </div>
          </button>
        ) : (
          <button 
            onClick={onFinish}
            className="bg-[#2c2c2c] text-[#f4f1ea] px-12 py-5 rounded-full font-bold shadow-2xl flex items-center space-x-3 hover:scale-105 hover:bg-black transition-all group"
          >
            <span className="serif text-xl tracking-wide">Done Reading</span>
            <div className="group-hover:translate-x-1 transition-transform text-[#d4af37]">
              <Icons.ChevronRight />
            </div>
          </button>
        )}
      </div>
    </div>
  );
};

export default ReadingPhase;
