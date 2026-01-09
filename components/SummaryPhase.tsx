
import React from 'react';
import { Icons } from '../constants';

interface Props {
  wudaseAmlakText: string;
  onFinish: () => void;
}

const SummaryPhase: React.FC<Props> = ({ wudaseAmlakText, onFinish }) => {
  return (
    <div className="flex-1 flex flex-col p-8 bg-[#0a0a0c] animate-in slide-in-from-right-10 duration-700 pb-32">
      <header className="mb-12">
        <div className="flex items-center space-x-3 text-[#d4af37] mb-2 opacity-80">
          <Icons.Lotus />
          <span className="text-[10px] uppercase font-bold tracking-[0.3em]">Step 4: Wudase Amlak</span>
        </div>
        <h1 className="text-5xl serif gold-glow">Praises of the Almighty</h1>
      </header>

      <div className="space-y-6 flex-1 max-w-2xl mx-auto w-full overflow-y-auto max-h-[60vh] custom-scrollbar">
        <section className="bg-white/5 p-10 rounded-[2.5rem] border border-white/10 group hover:border-[#d4af37]/30 transition-all shadow-xl">
          <div className="flex items-center gap-4 mb-5">
            <div className="w-10 h-10 rounded-full bg-[#d4af37]/10 flex items-center justify-center text-[#d4af37]">
              <Icons.Eye />
            </div>
            <h3 className="text-xs uppercase font-bold tracking-[0.2em] text-gray-500">The Divine Praises</h3>
          </div>
          <p className="text-xl serif italic leading-relaxed text-gray-200 ethiopic whitespace-pre-wrap">
            {wudaseAmlakText}
          </p>
        </section>
      </div>

      <div className="mt-12 flex flex-col items-center space-y-4">
        <button 
          onClick={onFinish}
          className="w-full max-w-md bg-[#d4af37] text-black py-6 rounded-full font-bold shadow-2xl hover:bg-[#c0a030] hover:scale-[1.02] transition-all flex items-center justify-center space-x-3"
        >
          <span className="serif text-xl">Closing Prayers</span>
          <Icons.ChevronRight />
        </button>
      </div>
    </div>
  );
};

export default SummaryPhase;
