import React from 'react';
import { Icons } from '../constants';
import { Quote, Theme } from '../types';
import { useAppLanguage } from '../contexts/AppLanguageContext';

interface Props {
  onClose: () => void;
  currentQuote?: Quote;
  theme: Theme;
}

/**
 * Ask Memhir — full AI/voice experience temporarily disabled; shows a calm "coming soon" state.
 */
const AskMemhir: React.FC<Props> = ({ onClose, theme: _theme }) => {
  const { t } = useAppLanguage();

  return (
    <div className="flex-1 flex flex-col bg-[var(--bg-primary)] animate-in fade-in duration-500 min-h-screen overflow-hidden">
      <header className="px-4 py-4 md:px-8 md:py-6 border-b border-theme flex justify-between items-center backdrop-blur-xl bg-[var(--bg-primary)]/80 sticky top-0 z-20">
        <div className="flex items-center space-x-3 md:space-x-5">
          <div className="w-10 h-10 md:w-14 md:h-14 rounded-xl md:rounded-2xl bg-[var(--gold-muted)] border border-[var(--gold)]/20 flex items-center justify-center text-[var(--gold)] shadow-sm">
            <Icons.Message />
          </div>
          <div>
            <h2 className="serif text-xl md:text-2xl text-[var(--gold)] gold-glow tracking-wide">
              {t('askMemhir.title')}
            </h2>
            <p className="text-[8px] md:text-[10px] uppercase tracking-[0.3em] text-[var(--text-muted)] font-black">
              {t('askMemhir.subtitle')}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="p-3 bg-[var(--card-bg)] rounded-full hover:bg-[var(--gold-muted)] transition-all active:scale-90 text-[var(--text-muted)] hover:text-[var(--text-primary)]"
          aria-label={t('reading.close')}
        >
          <Icons.Close />
        </button>
      </header>

      <div className="flex-1 flex flex-col items-center justify-center px-6 py-16 text-center max-w-lg mx-auto">
        <div className="p-10 md:p-14 border border-theme rounded-[3rem] bg-[var(--card-bg)] shadow-lg relative overflow-hidden">
          <div className="flex justify-center mb-8 text-[var(--gold)]">
            <Icons.Feather />
          </div>
          <p className="serif text-2xl md:text-3xl text-[var(--gold)] gold-glow mb-4">{t('askMemhir.comingSoon')}</p>
          <p className="text-[var(--text-primary)] ethiopic text-lg md:text-xl leading-relaxed opacity-90">
            {t('askMemhir.comingSoonBody')}
          </p>
        </div>
      </div>
    </div>
  );
};

export default AskMemhir;
