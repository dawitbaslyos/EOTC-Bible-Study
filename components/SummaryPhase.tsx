
import React from 'react';
import { Icons } from '../constants';

interface Props {
  wudaseAmlakText: string;
  onFinish: () => void;
}

const SummaryPhase: React.FC<Props> = ({ wudaseAmlakText, onFinish }) => {
  return (
    <div className="flex-1 flex flex-col p-8 bg-[var(--bg-primary)] animate-in slide-in-from-right-10 duration-700 pb-32">
      <header className="mb-12 text-center md:text-left">
        <div className="flex items-center justify-center md:justify-start space-x-3 text-[var(--gold)] mb-2 opacity-80">
          <Icons.Lotus className="w-5 h-5" />
          <span className="text-[10px] uppercase font-bold tracking-[0.3em]">Step 3: Wudase Amlak</span>
        </div>
        <h1 className="text-4xl md:text-5xl serif gold-glow text-[var(--text-primary)]">Praises of the Almighty</h1>
      </header>

      <div className="space-y-6 flex-1 max-w-2xl mx-auto w-full overflow-y-auto max-h-[60vh] custom-scrollbar mb-8 pr-2">
        <section className="bg-[var(--card-bg)] p-8 md:p-10 rounded-[2.5rem] border border-theme group hover:border-[var(--gold)]/30 transition-all shadow-xl backdrop-blur-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-[var(--gold)]/5 blur-3xl rounded-full pointer-events-none" />
          
          <div className="flex items-center gap-4 mb-6 relative z-10">
            <div className="w-10 h-10 rounded-full bg-[var(--gold-muted)] flex items-center justify-center text-[var(--gold)]">
              <Icons.Eye />
            </div>
            <h3 className="text-[10px] uppercase font-bold tracking-[0.2em] text-[var(--text-muted)]">The Divine Praises</h3>
          </div>
          
          <p className="text-lg md:text-xl serif italic leading-relaxed text-[var(--text-primary)] ethiopic whitespace-pre-wrap relative z-10">
            {wudaseAmlakText}
          </p>
        </section>
      </div>

      <div className="flex flex-col items-center space-y-4">
        <button 
          onClick={onFinish}
          className="w-full max-w-md bg-[var(--gold)] text-black py-5 md:py-6 rounded-full font-bold shadow-2xl hover:brightness-110 hover:scale-[1.02] transition-all flex items-center justify-center space-x-3 active:scale-95"
        >
          <span className="serif text-xl">Finish Reading</span>
          <Icons.ChevronRight className="w-5 h-5" />
        </button>
        <p className="text-[9px] uppercase tracking-[0.3em] text-[var(--text-muted)] font-bold">End of Daily Ritual</p>
      </div>
    </div>
  );
};

export default SummaryPhase;
