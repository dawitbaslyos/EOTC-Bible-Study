
import React, { useState, useEffect, useMemo } from 'react';
import { AppPhase, WudaseLiturgy, DailyManna, Quote, BibleBookJSON, UserStats, Theme, RitualTime, Book } from './types';
import Dashboard from './components/Dashboard';
import PreparationPhase from './components/PreparationPhase';
import ReadingPhase from './components/ReadingPhase';
import SummaryPhase from './components/SummaryPhase';
import AskMemhir from './components/AskMemhir';
import LoginPage from './components/LoginPage';
import Onboarding from './components/Onboarding';
import SettingsPage from './components/SettingsPage';
import NotificationCenter, { NotificationToast } from './components/NotificationCenter';
import { useProgress } from './hooks/useProgress';
import { useNotifications } from './hooks/useNotifications';
import {
  sendWelcomeNotification,
  syncRitualRemindersFromStats,
  rescheduleOpenAppReminder
} from './utils/nativeNotifications';
import { pickDailyQuoteFromBible } from './utils/dailyQuoteFromBible';
import { isAndroidNative } from './utils/appPermissions';
import PermissionSetupModal, { ANDROID_PERMISSIONS_DONE_KEY } from './components/PermissionSetupModal';
interface UserProfile {
  name: string;
  email: string;
  photoURL: string;
  provider: 'google' | 'facebook' | 'guest';
  uid: string;
}

const App: React.FC = () => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [phase, setPhase] = useState<AppPhase>(AppPhase.DASHBOARD);
  const [showTransition, setShowTransition] = useState(false);
  const [isDailyWudase, setIsDailyWudase] = useState(false);
  
  const [hasSeenOnboarding, setHasSeenOnboarding] = useState(() => 
    localStorage.getItem('senay_onboarding_complete') === 'true'
  );

  const [liturgy, setLiturgy] = useState<WudaseLiturgy | null>(null);
  const [bibleData, setBibleData] = useState<BibleBookJSON[] | null>(null);
  const [allBooks, setAllBooks] = useState<Book[]>([]);
  const [quote, setQuote] = useState<Quote | null>(null);
  
  const [readingData, setReadingData] = useState<DailyManna | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [theme, setTheme] = useState<Theme>(() => (localStorage.getItem('senay_theme') as Theme) || 'dark');
  const [androidPermissionOpen, setAndroidPermissionOpen] = useState(false);
  const [androidPermissionManual, setAndroidPermissionManual] = useState(false);

  const cloudUid = user?.provider === 'guest' ? null : (user?.uid || null);
  const { stats, completeChapter, applyGateCompletionsFromLock, getNextChapter, updateLastAccessed, saveStats, getHeatmapData, daysPracticed } = useProgress(cloudUid);
  const { notifications, notify, markAsRead, clearAll, unreadCount, activeToast, dismissToast } = useNotifications();

  const availableBooks = useMemo(() => {
    if (!bibleData || !allBooks.length) return [];

    const bibleIds = new Set(
      bibleData
        .map(bd => bd.book_short_name_en?.toLowerCase?.())
        .filter(Boolean)
    );

    const matched = allBooks.filter(book =>
      book.id ? bibleIds.has(book.id.toLowerCase()) : true
    );

    // If matching is too strict and hides many books, fall back to all
    if (matched.length === 0 || matched.length < allBooks.length * 0.5) {
      return allBooks;
    }

    return matched;
  }, [bibleData, allBooks]);

  useEffect(() => {
    document.documentElement.className = theme === 'light' ? 'light-theme' : '';
    localStorage.setItem('senay_theme', theme);
  }, [theme]);

  useEffect(() => {
    const savedUser = localStorage.getItem('senay_user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }

    const fetchData = async () => {
      try {
        const [litRes, bibleRes, booksRes] = await Promise.all([
          fetch('./data/wudase-liturgy.json'),
          fetch('./data/bible-content.json'),
          fetch('./data/80-weahadu.json')
        ]);

        if (litRes.ok) setLiturgy(await litRes.json());

        const bibleJson: BibleBookJSON[] | null = bibleRes.ok ? await bibleRes.json() : null;
        const weahaduJson: Book[] | null = booksRes.ok ? await booksRes.json() : null;

        if (bibleJson) {
          setBibleData(bibleJson);

          const weahaduById = new Map<string, Book>();
          if (weahaduJson) {
            for (const b of weahaduJson) {
              weahaduById.set(b.id.toLowerCase(), b);
            }
          }

          // Source of truth for which books exist is `bible-content.json` (should be 81).
          // `80-weahadu.json` is used only for metadata like display names/category.
          const mergedBooks: Book[] = bibleJson.map((b) => {
            const shortId = b.book_short_name_en.toLowerCase();
            const meta = weahaduById.get(shortId);

            return {
              id: shortId,
              name: meta?.name || `${b.book_name_am} (${b.book_name_en})`,
              category: (meta?.category || 'Law') as Book['category'],
              totalChapters: meta?.totalChapters ?? b.chapters.length,
              testament: meta?.testament || b.testament,
            };
          });

          setAllBooks(mergedBooks);

          const daily = pickDailyQuoteFromBible(bibleJson);
          if (daily) setQuote(daily);
        } else if (weahaduJson) {
          // Fallback: if bible content fails to load, show weahadu books.
          setAllBooks(weahaduJson);
        }
      } catch (err) {
        console.error("Data loading error:", err);
      }
    };

    fetchData();
  }, []);

  // Android: one-time permission sheet (native Allow dialogs) after login.
  useEffect(() => {
    if (!user) return;
    if (!isAndroidNative()) return;
    if (localStorage.getItem(ANDROID_PERMISSIONS_DONE_KEY)) return;
    setAndroidPermissionManual(false);
    setAndroidPermissionOpen(true);
  }, [user?.uid]);

  const handleOnboardingComplete = (rituals: RitualTime[]) => {
    setHasSeenOnboarding(true);
    localStorage.setItem('senay_onboarding_complete', 'true');
    const next: UserStats = {
      ...stats,
      preferredRituals: rituals,
      hasCompletedOnboarding: true
    };
    saveStats(next);
    syncRitualRemindersFromStats(next).catch(() => {});
  };

  const handleLogin = (profile: UserProfile) => {
    setUser(profile);
    localStorage.setItem('senay_user', JSON.stringify(profile));
    setPhase(AppPhase.DASHBOARD);
    notify({ 
      title: "Peace be with you", 
      body: `Welcome to your sanctuary, ${profile.name.split(' ')[0]}.`, 
      type: 'emotional', 
      priority: 'low'
    });

    sendWelcomeNotification(profile.name.split(' ')[0]).catch(() => {
      // native notifications might not be available; fail silently
    });

    syncRitualRemindersFromStats(stats).catch(() => {});
  };

  // Keep native routine alarms in sync with settings (all users, including guest).
  useEffect(() => {
    if (!user || !hasSeenOnboarding) return;
    syncRitualRemindersFromStats(stats).catch(() => {});
  }, [
    user?.uid,
    user?.provider,
    hasSeenOnboarding,
    JSON.stringify(stats.preferredRituals ?? []),
    JSON.stringify(stats.ritualReminderTimes ?? {})
  ]);

  // Android: merge focus-lock overlay readings into heatmap / streak when app returns to foreground.
  useEffect(() => {
    if (!isAndroidNative()) return;
    let cancelled = false;
    let removeListener: (() => void) | undefined;

    void (async () => {
      try {
        const [{ App }, { AppLock }] = await Promise.all([
          import('@capacitor/app'),
          import('./src/plugins/app-lock')
        ]);
        if (cancelled) return;
        const handle = await App.addListener('appStateChange', async ({ isActive }) => {
          if (!isActive) return;
          try {
            const { items } = await AppLock.consumePendingGateCompletions();
            if (items?.length) applyGateCompletionsFromLock(items);
          } catch {
            /* ignore */
          }
        });
        removeListener = () => handle.remove();
      } catch {
        /* Capacitor unavailable */
      }
    })();

    return () => {
      cancelled = true;
      removeListener?.();
    };
  }, [applyGateCompletionsFromLock]);

  // Gentle “open Senay” reminder after a few days away; reset whenever app is visible.
  useEffect(() => {
    if (!user || !hasSeenOnboarding) return;

    const bump = () => {
      localStorage.setItem('senay_last_app_open', String(Date.now()));
      rescheduleOpenAppReminder(3).catch(() => {});
    };

    bump();
    const onVis = () => {
      if (document.visibilityState === 'visible') bump();
    };
    document.addEventListener('visibilitychange', onVis);
    return () => document.removeEventListener('visibilitychange', onVis);
  }, [user?.uid, hasSeenOnboarding]);

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('senay_user');
    setPhase(AppPhase.DASHBOARD);
    setIsDrawerOpen(false);
  };

  const goToPhase = (newPhase: AppPhase, instant: boolean = false) => {
    if (instant) {
      setPhase(newPhase);
      window.scrollTo({ top: 0, behavior: 'auto' });
      return;
    }
    setShowTransition(true);
    setTimeout(() => {
      setPhase(newPhase);
      setShowTransition(false);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }, 400);
  };

  const getWudasePortion = (lit: WudaseLiturgy, chapter: number): DailyManna => {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const todayName = days[new Date().getDay()];
    const portion = lit.portions[todayName];

    return {
      title: chapter === 1 ? "Standard Prayers" : (portion?.dayName || `${todayName} Portion`),
      bookId: 'wudase',
      bookName: 'ውዳሴ ማርያም',
      chapter: chapter,
      totalChapters: 2,
      sections: chapter === 1 ? lit.yezewetir.sections : (portion?.sections || []),
      liturgicalSeason: todayName
    };
  };

  const startFlow = (bookId: string, isWudase: boolean, specificChapter?: number) => {
    const isInstant = phase === AppPhase.READING;
    setIsDailyWudase(isWudase);
    
    if (isWudase && liturgy) {
      const ch = specificChapter || 1;
      setReadingData(getWudasePortion(liturgy, ch));
      goToPhase(ch === 1 ? AppPhase.PREPARATION : AppPhase.READING, isInstant);
    } else if (bibleData) {
      updateLastAccessed(bookId);
      const bookObj = bibleData.find(b => b.book_short_name_en.toLowerCase() === bookId.toLowerCase());
      if (bookObj) {
        const ch = specificChapter || getNextChapter(bookId);
        const chObj = bookObj.chapters.find(c => c.chapter === ch) || bookObj.chapters[0];
        setReadingData({
          title: bookObj.book_name_en,
          bookId: bookId,
          bookName: bookObj.book_name_am,
          chapter: chObj.chapter,
          totalChapters: bookObj.chapters.length,
          sections: chObj.sections,
          liturgicalSeason: 'General'
        });
        goToPhase(AppPhase.READING, isInstant);
      }
    }
  };

  const handleFinishReading = () => {
    if (readingData) {
      completeChapter(readingData.bookId, readingData.chapter);
    }
    goToPhase(AppPhase.DASHBOARD);
  };

  // 1. First Priority: Onboarding
  if (!hasSeenOnboarding) {
    return <Onboarding onComplete={handleOnboardingComplete} />;
  }

  // 2. Second Priority: Login
  if (!user) {
    return <LoginPage onLogin={handleLogin} />;
  }

  // 3. Final: Main App
  return (
    <div className={`min-h-screen bg-[var(--bg-primary)] transition-opacity duration-500 ${showTransition ? 'opacity-0' : 'opacity-100'}`}>
      <div className="max-w-5xl mx-auto min-h-screen flex flex-col relative">
        {phase === AppPhase.DASHBOARD && (
          <Dashboard 
            onStart={startFlow} 
            quote={quote || undefined} 
            availableBooks={availableBooks}
            onOpenMemhir={() => goToPhase(AppPhase.ASK_MEMHIR)} 
            userProfile={user}
            onLogout={handleLogout}
            isDrawerOpen={isDrawerOpen}
            setIsDrawerOpen={setIsDrawerOpen}
            unreadCount={unreadCount}
            onOpenNotifications={() => setIsNotificationOpen(true)}
            onOpenSettings={() => goToPhase(AppPhase.SETTINGS)}
            stats={stats}
            getHeatmapData={getHeatmapData}
            daysPracticed={daysPracticed}
          />
        )}

        {phase === AppPhase.SETTINGS && (
          <SettingsPage 
            onClose={() => {
              syncRitualRemindersFromStats(stats).catch(() => {});
              goToPhase(AppPhase.DASHBOARD);
            }}
            theme={theme}
            setTheme={setTheme}
            rituals={stats.preferredRituals || ['day']}
            setRituals={(r) => saveStats({ ...stats, preferredRituals: r })}
            ritualReminderTimes={stats.ritualReminderTimes}
            setRitualReminderTimes={(t) => saveStats({ ...stats, ritualReminderTimes: t })}
            onLogout={handleLogout}
            onOpenAndroidPermissions={
              isAndroidNative()
                ? () => {
                    setAndroidPermissionManual(true);
                    setAndroidPermissionOpen(true);
                  }
                : undefined
            }
          />
        )}

        {phase === AppPhase.ASK_MEMHIR && <AskMemhir onClose={() => goToPhase(AppPhase.DASHBOARD)} currentQuote={quote || undefined} theme={theme} />}

        {phase === AppPhase.PREPARATION && (
          <PreparationPhase 
            openingText={liturgy?.opening || "In the name of the Father..."} 
            yezewetirText="" 
            onComplete={() => goToPhase(AppPhase.READING)} 
          />
        )}

        {phase === AppPhase.READING && readingData && (
          <ReadingPhase 
            data={readingData} 
            isDailyManna={isDailyWudase}
            onNext={() => isDailyWudase && readingData.chapter === 1 ? startFlow('wudase', true, 2) : (isDailyWudase ? goToPhase(AppPhase.SUMMARY) : handleFinishReading())} 
            onOpenMemhir={() => goToPhase(AppPhase.ASK_MEMHIR)}
            onFinish={() => goToPhase(AppPhase.DASHBOARD)}
            onSelectChapter={(chapter) => startFlow(readingData.bookId, false, chapter)}
          />
        )}

        {phase === AppPhase.SUMMARY && (
          <SummaryPhase 
            wudaseAmlakText={liturgy?.wudaseAmlak || "Praises of the Almighty..."}
            onFinish={handleFinishReading}
          />
        )}

        <NotificationCenter isOpen={isNotificationOpen} notifications={notifications} onClose={() => setIsNotificationOpen(false)} onMarkRead={markAsRead} onClearAll={clearAll} />
        <NotificationToast notification={activeToast} onDismiss={dismissToast} />

        {androidPermissionOpen && (
          <PermissionSetupModal
            stats={stats}
            isManualEntry={androidPermissionManual}
            onFinished={() => {
              setAndroidPermissionOpen(false);
              setAndroidPermissionManual(false);
            }}
          />
        )}
      </div>
    </div>
  );
};

export default App;
