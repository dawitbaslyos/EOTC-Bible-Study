
import React, { useState } from 'react';
import { Icons } from '../constants';

interface Props {
  closingText: string;
  instructionText: string;
  onRestart: () => void;
}

const ReflectionPhase: React.FC<Props> = ({ closingText, instructionText, onRestart }) => {
  const [bowCount, setBowCount] = useState(0);

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-12 animate-in fade-in duration-1000">
      <div className="space-y-4">
        <div className="flex items-center justify-center space-x-3 text-[#d4af37] mb-2 opacity-80">
          <Icons.Cloud />
          <span className="text-[10px] uppercase font-bold tracking-[0.3em]">Step 5: Closing</span>
        </div>
        <h1 className="text-5xl serif gold-glow">The Seal of Peace</h1>
      </div>

      <div className="p-8 bg-white/5 rounded-[2.5rem] border border-white/10 text-xl leading-relaxed whitespace-pre-wrap italic text-gray-300 max-w-lg mx-auto ethiopic shadow-inner">
        {closingText}
      </div>

      <div className="space-y-6">
        <p className="text-[10px] uppercase tracking-widest text-[#d4af37]/60 font-bold">{instructionText}</p>
        <div className="flex flex-col items-center space-y-4">
          <button 
            onClick={() => setBowCount(c => c + 1)}
            className="w-32 h-32 rounded-full border-2 border-[#d4af37]/30 flex flex-col items-center justify-center group hover:bg-[#d4af37]/10 transition-all relative overflow-hidden active:scale-95 shadow-lg shadow-[#d4af37]/5"
          >
            <div className="text-3xl font-bold text-[#d4af37]">{bowCount}</div>
            <div className="text-[8px] uppercase tracking-widest text-gray-500">Bows Done</div>
            {bowCount > 0 && <div className="absolute inset-0 bg-[#d4af37]/10 animate-ping rounded-full pointer-events-none" />}
          </button>
          <button 
            onClick={() => setBowCount(0)}
            className="text-[10px] text-gray-600 uppercase tracking-widest hover:text-gray-400 transition-colors"
          >
            Reset Count
          </button>
        </div>
      </div>

      <button 
        onClick={onRestart}
        className="w-full max-w-md bg-[#d4af37] text-black font-bold py-6 rounded-full shadow-2xl hover:bg-[#c0a030] hover:scale-[1.02] transition-all flex items-center justify-center space-x-3"
      >
        <span className="serif text-xl font-bold">Finish Prayer & Return</span>
        <Icons.ChevronRight />
      </button>
    </div>
  );
};

export default ReflectionPhase;
