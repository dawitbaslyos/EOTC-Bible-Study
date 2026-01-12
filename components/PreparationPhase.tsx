
import React from 'react';
import { Icons } from '../constants';

interface Props {
  openingText: string;
  yezewetirText: string;
  onComplete: () => void;
}

const PreparationPhase: React.FC<Props> = ({ openingText, onComplete }) => {
  return (
    <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-12 animate-in fade-in duration-1000">
      <div className="space-y-8 animate-in slide-in-from-bottom-5 w-full max-w-2xl">
        <div className="text-6xl text-[#d4af37] gold-glow serif">Daily Wudase</div>
        <p className="text-[10px] uppercase tracking-[0.3em] text-[#d4af37] opacity-60">Step 1: The Opening</p>
        <div className="p-8 bg-white/5 rounded-[2.5rem] border border-white/10 text-xl leading-relaxed whitespace-pre-wrap italic text-gray-300 mx-auto ethiopic shadow-inner">
          {openingText}
        </div>
        <button 
          onClick={onComplete}
          className="px-12 py-5 rounded-full bg-[#d4af37] text-black font-bold hover:bg-[#c0a030] transition-all duration-300 shadow-2xl flex items-center space-x-3 mx-auto group active:scale-95"
        >
          <span>Continue to Prayers</span>
          <div className="group-hover:translate-x-1 transition-transform">
            <Icons.ChevronRight />
          </div>
        </button>
      </div>
    </div>
  );
};

export default PreparationPhase;
