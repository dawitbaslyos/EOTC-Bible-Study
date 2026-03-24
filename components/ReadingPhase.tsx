
import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { DailyManna, type LanguageVisibility, type ReadingScriptMode } from '../types';
import { Icons } from '../constants';
import { useAppLanguage } from '../contexts/AppLanguageContext';
import {
  effectiveBibleReadingMode,
  isMostlyLatin,
  pickVerseForReadingMode,
  pickVerseStrictByLabel,
  wudaseVerseDualLines
} from '../utils/verseDisplay';
import { isAndroidNative } from '../utils/appPermissions';
import { pushAndroidBackOverlay } from '../utils/androidBackHandler';

const READING_SCRIPT_KEY = 'senay_reading_script';
const WUDASE_SCRIPT_KEY = 'senay_wudase_script';

function readStoredReadingScript(): ReadingScriptMode | null {
  try {
    const v = localStorage.getItem(READING_SCRIPT_KEY);
    if (v === 'geez' || v === 'amharic' || v === 'english' || v === 'geez_amharic') return v;
  } catch {
    /* ignore */
  }
  return null;
}

/** Bible UI only — `geez_amharic` is not a Bible mode. */
function normalizeReadingScriptForBible(mode: ReadingScriptMode | null): ReadingScriptMode {
  if (!mode || mode === 'geez_amharic') return 'amharic';
  return mode;
}

function readWudaseScript(): LanguageVisibility {
  try {
    const raw = localStorage.getItem(WUDASE_SCRIPT_KEY);
    if (raw) {
      const p = JSON.parse(raw) as Partial<LanguageVisibility>;
      if (typeof p.geez === 'boolean' && typeof p.amharic === 'boolean' && typeof p.english === 'boolean') {
        return { geez: p.geez, amharic: p.amharic, english: p.english };
      }
    }
    const legacy = localStorage.getItem(READING_SCRIPT_KEY);
    if (legacy === 'geez_amharic') return { geez: true, amharic: true, english: false };
    if (legacy === 'geez') return { geez: true, amharic: false, english: false };
    if (legacy === 'english') return { geez: false, amharic: false, english: true };
  } catch {
    /* ignore */
  }
  return { geez: false, amharic: true, english: false };
}

function persistWudaseScript(v: LanguageVisibility) {
  try {
    localStorage.setItem(WUDASE_SCRIPT_KEY, JSON.stringify(v));
  } catch {
    /* ignore */
  }
}

interface Props {
  data: DailyManna;
  isDailyManna: boolean;
  /** Bible only: more chapters after this one → show “Next chapter” instead of “Finish”. */
  bibleHasNextChapter?: boolean;
  onNext: () => void;
  onOpenMemhir: () => void;
  onFinish: () => void;
  onSelectChapter: (chapter: number) => void;
}

const SCRIPT_SEGMENTS_BIBLE: { id: ReadingScriptMode; label: string }[] = [
  { id: 'geez', label: 'G' },
  { id: 'amharic', label: 'A' },
  { id: 'english', label: 'E' }
];

const ReadingPhase: React.FC<Props> = ({
  data,
  isDailyManna,
  bibleHasNextChapter = false,
  onNext,
  onOpenMemhir,
  onFinish,
  onSelectChapter
}) => {
  const { t } = useAppLanguage();
  const [readingScript, setReadingScriptState] = useState<ReadingScriptMode>(() => {
    const raw = readStoredReadingScript();
    return normalizeReadingScriptForBible(raw);
  });
  const [wudaseScript, setWudaseScriptState] = useState<LanguageVisibility>(() => readWudaseScript());
  const [showChapterTray, setShowChapterTray] = useState(false);
  const [hasReachedBottom, setHasReachedBottom] = useState(false);

  const wudaseEffective = useMemo((): LanguageVisibility => {
    if (wudaseScript.english) return wudaseScript;
    if (!wudaseScript.geez && !wudaseScript.amharic) return { ...wudaseScript, amharic: true };
    return wudaseScript;
  }, [wudaseScript]);

  /** Button highlights: when both G and A are off we fall back to Amharic-only content — show A as on. */
  const wudaseGeezBtnOn = wudaseScript.geez && !wudaseScript.english;
  const wudaseAmBtnOn =
    !wudaseScript.english && (wudaseScript.amharic || (!wudaseScript.geez && !wudaseScript.amharic));

  const setReadingScript = useCallback((mode: ReadingScriptMode) => {
    const next = normalizeReadingScriptForBible(mode);
    setReadingScriptState(next);
    try {
      localStorage.setItem(READING_SCRIPT_KEY, next);
    } catch {
      /* ignore */
    }
  }, []);

  const setWudaseScript = useCallback((next: LanguageVisibility | ((prev: LanguageVisibility) => LanguageVisibility)) => {
    setWudaseScriptState((prev) => {
      const resolved = typeof next === 'function' ? next(prev) : next;
      persistWudaseScript(resolved);
      return resolved;
    });
  }, []);

  const mainRef = useRef<HTMLElement>(null);
  const touchStartX = useRef<number | null>(null);

  useEffect(() => {
    if (isDailyManna) {
      setHasReachedBottom(true);
      return;
    }

    const handleScroll = () => {
      const scrollHeight = document.documentElement.scrollHeight;
      const scrollTop = window.scrollY || document.documentElement.scrollTop;
      const clientHeight = window.innerHeight;
      
      // If user is within 30px of the bottom
      if (scrollTop + clientHeight >= scrollHeight - 30) {
        setHasReachedBottom(true);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, [data.chapter, data.bookId, isDailyManna]);

  useEffect(() => {
    window.scrollTo(0, 0);
    if (!isDailyManna) setHasReachedBottom(false);
  }, [data.chapter, data.bookId, isDailyManna]);

  useEffect(() => {
    if (!isAndroidNative()) return;
    return pushAndroidBackOverlay(() => {
      if (!isDailyManna && showChapterTray) {
        setShowChapterTray(false);
        return true;
      }
      return false;
    });
  }, [isDailyManna, showChapterTray]);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null || isDailyManna) return;
    const touchEndX = e.changedTouches[0].clientX;
    const diff = touchStartX.current - touchEndX;
    const threshold = 70; 

    if (diff > threshold && data.chapter < data.totalChapters) {
      onSelectChapter(data.chapter + 1);
    } else if (diff < -threshold && data.chapter > 1) {
      onSelectChapter(data.chapter - 1);
    }
    touchStartX.current = null;
  };

  return (
    <div 
      className="flex-1 flex flex-col bg-[var(--bg-secondary)] text-[var(--text-primary)] relative min-h-screen"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      <header className="sticky top-0 z-50 bg-[var(--bg-secondary)]/95 backdrop-blur-md border-b border-theme shadow-sm">
        <div className="px-2 py-2 md:px-4 md:py-3 flex justify-between items-center">
          <div className="flex items-center space-x-1">
            <button onClick={onFinish} className="p-2 text-[var(--text-muted)] hover:text-[var(--text-primary)] rounded-full transition-all">
              <Icons.Close />
            </button>
            <button onClick={onOpenMemhir} className="p-2 text-[var(--gold)] hover:scale-110 transition-transform rounded-full">
              <Icons.Message />
            </button>
          </div>

          <div className="flex flex-col items-center flex-1 min-w-0 px-2">
             <h2 className="serif text-[8px] md:text-[10px] font-bold leading-tight uppercase tracking-[0.2em] opacity-40 truncate w-full text-center">
               {isDailyManna ? t('reading.divineWudase') : data.title}
             </h2>
             <button onClick={() => !isDailyManna && setShowChapterTray(!showChapterTray)} className="serif text-base md:text-lg font-bold" disabled={isDailyManna}>
               {isDailyManna
                 ? data.chapter === 1
                   ? t('reading.standardPrayers')
                   : data.title
                 : t('reading.chapter', { n: data.chapter })}
             </button>
          </div>

          <div
            className="flex flex-col items-end gap-1 shrink-0"
            role="group"
            aria-label={isDailyManna ? t('reading.scriptGroupWudase') : t('reading.scriptGroup')}
          >
            <div className="flex p-0.5 bg-[var(--card-bg)] rounded-full border border-theme shadow-inner max-w-[100vw]">
              {isDailyManna ? (
                <>
                  <button
                    type="button"
                    onClick={() =>
                      setWudaseScript((s) => {
                        if (s.english) return { ...s, english: false, geez: true };
                        return { ...s, geez: !s.geez };
                      })
                    }
                    className={`min-w-[1.5rem] h-7 md:min-w-[2rem] md:h-8 px-0.5 md:px-1 rounded-full text-[7px] md:text-[9px] font-black transition-all flex items-center justify-center ${
                      wudaseGeezBtnOn
                        ? 'bg-[var(--gold)] text-black shadow-sm'
                        : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                    }`}
                    aria-pressed={wudaseGeezBtnOn}
                    aria-label={t('reading.scriptGeez')}
                  >
                    G
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setWudaseScript((s) => {
                        if (s.english) return { ...s, english: false, amharic: true };
                        return { ...s, amharic: !s.amharic };
                      })
                    }
                    className={`min-w-[1.5rem] h-7 md:min-w-[2rem] md:h-8 px-0.5 md:px-1 rounded-full text-[7px] md:text-[9px] font-black transition-all flex items-center justify-center ${
                      wudaseAmBtnOn
                        ? 'bg-[var(--gold)] text-black shadow-sm'
                        : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                    }`}
                    aria-pressed={wudaseAmBtnOn}
                    aria-label={t('reading.scriptAmharic')}
                  >
                    A
                  </button>
                  <button
                    type="button"
                    onClick={() => setWudaseScript((s) => ({ ...s, english: !s.english }))}
                    className={`min-w-[1.5rem] h-7 md:min-w-[2rem] md:h-8 px-0.5 md:px-1 rounded-full text-[7px] md:text-[9px] font-black transition-all flex items-center justify-center ${
                      wudaseScript.english
                        ? 'bg-[var(--gold)] text-black shadow-sm'
                        : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                    }`}
                    aria-pressed={wudaseScript.english}
                    aria-label={t('reading.scriptEnglish')}
                  >
                    E
                  </button>
                </>
              ) : (
                SCRIPT_SEGMENTS_BIBLE.map(({ id, label }) => {
                  const active = readingScript === id;
                  return (
                    <button
                      key={id}
                      type="button"
                      onClick={() => setReadingScript(id)}
                      className={`min-w-[1.5rem] h-7 md:min-w-[2rem] md:h-8 px-0.5 md:px-1 rounded-full text-[7px] md:text-[9px] font-black transition-all flex items-center justify-center ${
                        active ? 'bg-[var(--gold)] text-black shadow-sm' : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                      }`}
                      aria-pressed={active}
                      aria-label={
                        id === 'geez'
                          ? t('reading.scriptGeez')
                          : id === 'amharic'
                            ? t('reading.scriptAmharic')
                            : t('reading.scriptEnglish')
                      }
                    >
                      {label}
                    </button>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Horizontal chapter selector tray under header */}
      {!isDailyManna && showChapterTray && (
        <div className="bg-[var(--bg-secondary)]/95 border-b border-theme/60">
          <div className="px-3 md:px-6 py-3 flex items-center justify-between">
            <span className="text-[9px] uppercase tracking-[0.18em] text-[var(--text-muted)]">
              {t('reading.selectChapter')}
            </span>
            <button
              onClick={() => setShowChapterTray(false)}
              className="text-[10px] uppercase tracking-[0.18em] text-[var(--text-muted)] hover:text-[var(--text-primary)]"
            >
              {t('reading.close')}
            </button>
          </div>
          <div className="px-3 md:px-6 pb-3 overflow-x-auto custom-scrollbar">
            <div className="flex space-x-2 md:space-x-3">
              {Array.from({ length: data.totalChapters }).map((_, idx) => {
                const num = idx + 1;
                const isActive = num === data.chapter;
                return (
                  <button
                    key={num}
                    onClick={() => {
                      onSelectChapter(num);
                      setShowChapterTray(false);
                    }}
                    className={`px-3 md:px-4 py-1.5 md:py-2 rounded-full text-[10px] md:text-[11px] font-bold uppercase tracking-[0.18em] whitespace-nowrap transition-all ${
                      isActive
                        ? 'bg-[var(--gold)] text-black shadow-md'
                        : 'bg-[var(--card-bg)] text-[var(--text-muted)] border border-theme hover:text-[var(--gold)]'
                    }`}
                  >
                    {t('reading.chShort', { n: num })}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      <main ref={mainRef} className="flex-1 p-6 md:p-16 space-y-12 max-w-2xl mx-auto pb-48">
        {data.sections.map((section, sIdx) => (
          <div key={sIdx} className="space-y-12">
            {section.title && (
              <div
                className={`text-center flex items-center justify-center space-x-4 ${
                  isDailyManna ? 'opacity-70' : 'opacity-50'
                }`}
              >
                <div className="h-px w-8 bg-[var(--gold)]/50" />
                <h3
                  className={`ethiopic text-xl font-bold ${
                    isDailyManna ? 'text-[var(--text-primary)]' : 'text-[var(--gold)]'
                  }`}
                >
                  {section.title}
                </h3>
                <div className="h-px w-8 bg-[var(--gold)]/50" />
              </div>
            )}
            {section.verses.map((v) => {
              const bibleMode = effectiveBibleReadingMode(readingScript);
              const dailySingleMode: ReadingScriptMode = wudaseEffective.english
                ? 'english'
                : wudaseEffective.geez && !wudaseEffective.amharic
                  ? 'geez'
                  : 'amharic';
              const styleMode: ReadingScriptMode = isDailyManna ? dailySingleMode : bibleMode;

              if (
                isDailyManna &&
                !wudaseEffective.english &&
                wudaseEffective.geez &&
                wudaseEffective.amharic
              ) {
                const { geez: gzLine, amharic: amLine } = wudaseVerseDualLines(v);
                const geezClass =
                  'ethiopic text-xl md:text-2xl leading-[1.85] text-[var(--text-primary)] font-medium';
                const amClass =
                  'ethiopic text-[0.95rem] md:text-lg leading-[1.75] text-[var(--text-secondary)] opacity-[0.9]';
                return (
                  <div key={v.verse} className="space-y-6">
                    <div className="flex items-start gap-4">
                      <div className="space-y-3 flex-1 border-l-2 border-[var(--gold)]/30 pl-3 md:pl-4">
                        {gzLine ? <p className={geezClass}>{gzLine}</p> : null}
                        {amLine ? <p className={amClass}>{amLine}</p> : null}
                        {!gzLine && !amLine ? (
                          <p className="ethiopic text-sm text-[var(--text-muted)] opacity-60">—</p>
                        ) : null}
                      </div>
                    </div>
                  </div>
                );
              }

              let body = isDailyManna
                ? pickVerseStrictByLabel(v, dailySingleMode)
                : pickVerseForReadingMode(v, bibleMode);
              if (isDailyManna && !body && wudaseEffective.english) {
                body = v.amharic?.trim() || v.text?.trim() || null;
              }
              const bodyClass =
                body && styleMode === 'english' && isMostlyLatin(body)
                  ? 'serif text-lg md:text-xl leading-relaxed text-[var(--text-secondary)] italic border-l-2 border-[var(--gold)]/20 pl-4 md:pl-6'
                  : styleMode === 'amharic'
                    ? 'ethiopic text-xl md:text-2xl leading-[1.8] text-[var(--text-primary)] opacity-[0.92]'
                    : 'ethiopic text-2xl leading-[1.8] text-[var(--text-primary)]';
              return (
                <div key={v.verse} className="space-y-6">
                  <div className="flex items-start gap-4">
                    {!isDailyManna && (
                      <span className="text-xs font-bold tabular-nums text-[var(--text-secondary)] pt-1.5 min-w-[2.25rem] text-right shrink-0 leading-tight select-none">
                        {v.verse}
                      </span>
                    )}
                    <div className="space-y-6 flex-1">
                      {body ? <p className={bodyClass}>{body}</p> : null}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ))}

        {isDailyManna && data.chapter === 1 && (
          <div className="mt-16 pt-10 border-t border-[var(--gold)]/20 text-center px-2">
            <p className="ethiopic text-sm md:text-base leading-relaxed text-[var(--text-secondary)] max-w-md mx-auto">
              {t('reading.wudaseClosingAmShort')}
            </p>
          </div>
        )}
      </main>

      <div className={`fixed bottom-0 left-0 w-full p-6 md:p-12 flex justify-center z-40 transition-all duration-700 ${hasReachedBottom ? 'translate-y-0 opacity-100' : 'translate-y-12 opacity-0 pointer-events-none'}`}>
        <button
          type="button"
          onClick={onNext}
          className="bg-[var(--text-primary)] text-[var(--bg-primary)] px-8 md:px-14 py-4 md:py-5 rounded-full font-black shadow-2xl hover:scale-105 active:scale-95 transition-all max-w-[min(100%,20rem)]"
        >
          <span className="ethiopic text-base md:text-lg tracking-wide block text-center whitespace-normal break-words leading-snug">
            {isDailyManna
              ? data.chapter === 1
                ? t('reading.dailyPortion')
                : data.chapter === 2
                  ? t('reading.anqaseBerhanNext')
                  : t('reading.summarize')
              : bibleHasNextChapter
                ? t('reading.nextChapter')
                : t('reading.finishChapter')}
          </span>
        </button>
      </div>
    </div>
  );
};

export default ReadingPhase;
