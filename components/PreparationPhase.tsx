
import React, { useState } from 'react';
import { Icons } from '../constants';

interface Props {
  openingText: string;
  yezewetirText: string;
  onComplete: () => void;
}

const PreparationPhase: React.FC<Props> = ({ openingText, yezewetirText, onComplete }) => {
  const [step, setStep] = useState<'opening' | 'yezewetir'>('opening');

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-12 animate-in fade-in duration-1000">
      {step === 'opening' && (
        <div className="space-y-8 animate-in slide-in-from-bottom-5 w-full max-w-2xl">
          <div className="text-6xl text-[#d4af37] gold-glow serif">Daily Wudase</div>
          <p className="text-[10px] uppercase tracking-[0.3em] text-[#d4af37] opacity-60">Step 1: The Opening</p>
          <div className="p-8 bg-white/5 rounded-[2.5rem] border border-white/10 text-xl leading-relaxed whitespace-pre-wrap italic text-gray-300 mx-auto ethiopic shadow-inner">
            {openingText}
          </div>
          <button 
            onClick={() => setStep('yezewetir')}
            className="px-12 py-5 rounded-full bg-[#d4af37] text-black font-bold hover:bg-[#c0a030] transition-all duration-300 shadow-2xl flex items-center space-x-3 mx-auto group"
          >
            <span>Proceed to Yezewetir</span>
            <div className="group-hover:translate-x-1 transition-transform">
              <Icons.ChevronRight />
            </div>
          </button>
        </div>
      )}

      {step === 'yezewetir' && (
        <div className="space-y-8 w-full max-w-2xl mx-auto animate-in slide-in-from-right-5">
          <div className="flex flex-col items-center space-y-2">
            <Icons.Lotus />
            <h2 className="text-2xl text-[#d4af37] gold-glow serif">Yezewetir Tselot</h2>
            <p className="text-[10px] uppercase tracking-[0.3em] text-[#d4af37] opacity-60">Step 2: Standard Prayers</p>
          </div>
          <div className="p-8 bg-white/5 rounded-[2.5rem] border border-white/10 text-lg leading-relaxed whitespace-pre-wrap italic text-gray-300 ethiopic text-left h-[450px] overflow-y-auto custom-scrollbar shadow-inner">
            {yezewetirText}
          </div>
          <button 
            onClick={onComplete}
            className="w-full bg-[#d4af37] text-black font-bold py-6 rounded-[2rem] shadow-2xl hover:bg-[#c0a030] transform hover:scale-[1.02] transition-all flex items-center justify-center space-x-3"
          >
            <span>Read Daily Portion</span>
            <Icons.ChevronRight />
          </button>
        </div>
      )}
    </div>
  );
};

export default PreparationPhase;
