
import React, { useState } from 'react';
import { DailyManna, Commentary } from '../types';
import { Icons } from '../constants';

interface Props {
  data: DailyManna;
  onNext: () => void;
}

const TeachingPhase: React.FC<Props> = ({ data, onNext }) => {
  const [selectedTerm, setSelectedTerm] = useState<Commentary | null>(null);

  return (
    <div className="flex-1 flex flex-col p-6 animate-in slide-in-from-right-10 duration-700">
      <header className="mb-8">
        <div className="flex items-center space-x-3 text-[#d4af37] mb-2">
          <Icons.Feather />
          <span className="text-xs font-bold uppercase tracking-widest">The Andimta</span>
        </div>
        <h1 className="text-3xl serif">Traditional Commentary</h1>
        <p className="text-gray-500 italic mt-2">"One word holds seven heavens of meaning."</p>
      </header>

      <div className="grid md:grid-cols-3 gap-6 flex-1 mb-20 overflow-hidden">
        {/* Left Column: List of Deep Concepts */}
        <div className="col-span-1 space-y-4 overflow-y-auto pr-2">
          {/* Fix: Accessing verses through sections since DailyManna uses sections to preserve titles */}
          {data.sections.flatMap(s => s.verses).flatMap(v => v.commentary || []).map((c, i) => (
            <button
              key={i}
              onClick={() => setSelectedTerm(c)}
              className={`w-full text-left p-4 rounded-xl border transition-all ${
                selectedTerm?.term === c.term 
                ? 'bg-[#d4af37]/20 border-[#d4af37] scale-[1.02]' 
                : 'bg-white/5 border-white/10 hover:border-white/30'
              }`}
            >
              <div className="ethiopic text-[#d4af37] text-lg font-bold">{c.term.split(' (')[0]}</div>
              <div className="text-xs text-gray-500 italic">{c.term.includes('(') ? c.term.split(' (')[1].replace(')', '') : ''}</div>
            </button>
          ))}
        </div>

        {/* Right Column: Detailed Explanation */}
        <div className="col-span-2 bg-[#1a1a1f] rounded-2xl border border-white/5 p-8 overflow-y-auto relative">
          {selectedTerm ? (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-5 duration-500">
              <div className="pb-6 border-b border-white/10">
                <h3 className="text-4xl ethiopic text-[#d4af37] gold-glow mb-2">{selectedTerm.term}</h3>
                <span className="px-3 py-1 bg-[#d4af37]/10 text-[#d4af37] text-xs rounded-full uppercase tracking-widest">Andimta Meaning</span>
              </div>
              
              <div className="space-y-6">
                <section>
                  <h4 className="text-xs uppercase text-gray-500 tracking-tighter mb-2 font-bold">The Explanation</h4>
                  <p className="text-xl text-gray-200 leading-relaxed font-light">
                    {selectedTerm.explanation}
                  </p>
                </section>

                <section className="bg-white/5 p-6 rounded-xl border-l-4 border-[#d4af37]">
                  <h4 className="text-xs uppercase text-[#d4af37] tracking-widest mb-3 font-bold">The Theological Mystery</h4>
                  <p className="text-gray-400 italic leading-relaxed">
                    "{selectedTerm.theology}"
                  </p>
                </section>
              </div>
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center opacity-40">
              <Icons.Feather />
              <p className="mt-4 text-gray-500">Select a highlighted concept to reveal its Mystery.</p>
            </div>
          )}
        </div>
      </div>

      <div className="sticky bottom-20 flex justify-center">
        <button 
          onClick={onNext}
          className="bg-[#d4af37] text-black px-12 py-4 rounded-full font-bold flex items-center space-x-3 hover:bg-[#c0a030] shadow-[0_10px_30px_rgba(212,175,55,0.3)] transition-all"
        >
          <span>Seek Personal Reflection</span>
          <Icons.Message />
        </button>
      </div>
    </div>
  );
};

export default TeachingPhase;
