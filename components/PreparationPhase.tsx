import React from 'react';
import { Icons } from '../constants';

interface Props {
  openingText: string;
  yezewetirText: string;
  onComplete: () => void;
}

const PreparationPhase: React.FC<Props> = ({ openingText, onComplete }) => {
  return (
    <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-12 animate-in fade-in duration-1000 bg-[var(--bg-primary)]">
      <div className="absolute inset-0 opacity-[0.02] pointer-events-none flex items-center justify-center overflow-hidden">
        <Icons.User className="w-[80vw] h-[80vw] text-[var(--gold)]" />
      </div>

      <div className="relative z-10 space-y-8 animate-in slide-in-from-bottom-5 w-full max-w-2xl">
        <div className="flex flex-col items-center space-y-2">
          <div className="w-16 h-16 rounded-full bg-[var(--gold-muted)] border border-[var(--gold)]/20 flex items-center justify-center text-[var(--gold)] mb-4">
            <Icons.Feather />
          </div>
          <div className="text-5xl text-[var(--gold)] gold-glow serif">Daily Wudase</div>
          <p className="text-[10px] uppercase font-black tracking-[0.4em] text-[var(--gold)] opacity-60">The Opening Rite</p>
        </div>

        <div className="p-8 md:p-12 bg-[var(--card-bg)] rounded-[3rem] border border-theme text-xl md:text-2xl leading-relaxed whitespace-pre-wrap italic text-[var(--text-primary)] ethiopic shadow-2xl backdrop-blur-sm border-theme/40">
          {openingText}
        </div>

        <button 
          onClick={onComplete}
          className="px-12 py-5 rounded-full bg-[var(--gold)] text-black font-black uppercase tracking-[0.2em] text-xs hover:bg-[#c0a030] transition-all duration-300 shadow-2xl flex items-center space-x-4 mx-auto group active:scale-95"
        >
          <span>Begin Prayer</span>
          <div className="group-hover:translate-x-1 transition-transform">
            <Icons.ChevronRight />
          </div>
        </button>
      </div>
    </div>
  );
};

export default PreparationPhase;