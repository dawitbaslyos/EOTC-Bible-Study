
import React, { useState } from 'react';
import { DailyManna, Commentary } from '../types';
import { Icons } from '../constants';

interface Props {
  data: DailyManna;
  isDailyManna: boolean;
  onNext: () => void;
  onOpenMemhir: () => void;
  onFinish: () => void;
}

const ReadingPhase: React.FC<Props> = ({ data, isDailyManna, onNext, onOpenMemhir, onFinish }) => {
  const [selectedWord, setSelectedWord] = useState<Commentary | null>(null);

  const renderEnglishText = (text: string, commentaries: Commentary[] = []) => {
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
      <header className="p-6 flex justify-between items-center border-b border-black/5 bg-[#f4f1ea]/90 backdrop-blur sticky top-0 z-40">
        <button 
          onClick={onOpenMemhir}
          className="flex items-center space-x-2 text-[#d4af37] hover:scale-105 transition-transform bg-white/50 px-3 py-1.5 rounded-full border border-black/5"
        >
          <Icons.Message />
          <span className="text-[10px] uppercase font-bold tracking-widest text-[#2c2c2c]">Ask Memhir</span>
        </button>
        <div className="text-center">
           <h2 className="serif italic text-lg font-bold">{data.bookName}</h2>
           <p className="text-[10px] uppercase tracking-widest opacity-50">Chapter {data.chapter}</p>
        </div>
        <div className="w-16" />
      </header>

      <main className="flex-1 p-8 md:p-12 space-y-16 max-w-2xl mx-auto pb-48">
        {data.verses.map((v) => (
          <div key={v.id} className="space-y-8 animate-in slide-in-from-bottom-4 duration-700">
            <div className="flex items-start gap-6">
               <span className="text-[11px] text-[#d4af37] font-bold pt-1 opacity-50">v.{v.id.replace('v', '')}</span>
               <div className="space-y-6 flex-1">
                 <p className="ethiopic text-4xl leading-[1.6] text-black/90 font-medium">
                   {v.geez}
                 </p>
                 <p className="ethiopic text-3xl leading-[1.6] text-[#b4941f] font-light italic">
                   {v.amharic}
                 </p>
                 <p className="text-2xl serif leading-relaxed text-black/75 italic font-light tracking-tight border-l-2 border-[#d4af37]/20 pl-6">
                   {renderEnglishText(v.english, v.commentary)}
                 </p>
               </div>
            </div>
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
