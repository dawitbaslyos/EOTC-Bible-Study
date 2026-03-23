
import React from 'react';
import { Icons } from '../constants';
import { useAppLanguage } from '../contexts/AppLanguageContext';

interface Props {
  openingText: string;
  yezewetirText: string;
  onComplete: () => void;
}

const PreparationPhase: React.FC<Props> = ({ openingText, onComplete }) => {
  const { t } = useAppLanguage();
  return (
    <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-12 animate-in fade-in duration-1000 bg-[var(--bg-primary)]">
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none flex items-center justify-center overflow-hidden">
        <Icons.Logo className="w-[60vw] h-[60vw] object-contain" />
      </div>

      <div className="relative z-10 space-y-8 animate-in slide-in-from-bottom-5 w-full max-w-2xl">
        <div className="flex flex-col items-center space-y-2">
          <div className="w-20 h-20 rounded-full bg-[var(--gold-muted)] border border-[var(--gold)]/20 flex items-center justify-center mb-4 overflow-hidden">
            <Icons.Logo className="w-12 h-12 object-contain" style={{ filter: 'brightness(0) saturate(100%) invert(80%) sepia(35%) saturate(769%) hue-rotate(3deg) brightness(92%) contrast(88%)' }} />
          </div>
          <div className="text-5xl text-[var(--gold)] gold-glow serif">{t('preparation.dailyRoutine')}</div>
          <p className="text-[10px] uppercase font-black tracking-[0.4em] text-[var(--gold)] opacity-60">{t('preparation.gettingReady')}</p>
        </div>

        <div className="p-8 md:p-12 bg-[var(--card-bg)] rounded-[3rem] border border-theme text-xl md:text-2xl leading-relaxed whitespace-pre-wrap italic text-[var(--text-primary)] ethiopic shadow-2xl backdrop-blur-sm border-theme/40">
          {openingText}
        </div>

        <button 
          onClick={onComplete}
          className="px-12 py-5 rounded-full bg-[var(--gold)] text-black font-black uppercase tracking-[0.2em] text-xs hover:bg-[#c0a030] transition-all duration-300 shadow-2xl flex items-center space-x-4 mx-auto group active:scale-95"
        >
          <span>{t('preparation.startNow')}</span>
          <div className="group-hover:translate-x-1 transition-transform">
            <Icons.ChevronRight />
          </div>
        </button>
      </div>
    </div>
  );
};

export default PreparationPhase;
