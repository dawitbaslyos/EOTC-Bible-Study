
import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import {
  AppPhase,
  WudaseLiturgy,
  WudaseMelaketBlock,
  DailyManna,
  Quote,
  BibleBookJSON,
  UserStats,
  Theme,
  RitualTime,
  Book
} from './types';
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
  rescheduleOpenAppReminder,
  syncStreakReminderFromStats,
  refreshNativeReminderSchedules
} from './utils/nativeNotifications';
import { runDailyBehaviorNotifications } from './utils/notificationBehaviors';
import { pickDailyQuoteFromBible } from './utils/dailyQuoteFromBible';
import { isAndroidNative } from './utils/appPermissions';
import { setAndroidBackHandler } from './utils/androidBackHandler';
import PermissionSetupModal, { ANDROID_PERMISSIONS_DONE_KEY } from './components/PermissionSetupModal';
import type { User as FirebaseUser } from 'firebase/auth';
import { getRedirectResult, onAuthStateChanged, signOut } from 'firebase/auth';
import { auth } from './firebaseClient';
import { useAppLanguage } from './contexts/AppLanguageContext';
import { Capacitor } from '@capacitor/core';

interface UserProfile {
  name: string;
  email: string;
  photoURL: string;
  provider: 'google' | 'facebook' | 'guest';
  /** Display / local id. Prefixed with `native_` when Firebase sign-in failed (device-only session). */
  uid: string;
  /** Firebase Auth UID when cloud sign-in succeeded; omit for native-only Google. */
  firebaseUid?: string;
}

function profileFromFirebaseUser(firebaseUser: FirebaseUser): UserProfile {
  const pid = firebaseUser.providerData?.[0]?.providerId;
  return {
    name: firebaseUser.displayName || 'Senay User',
    email: firebaseUser.email || '',
    photoURL: firebaseUser.photoURL || '',
    uid: firebaseUser.uid,
    firebaseUid: firebaseUser.uid,
    provider: pid === 'facebook.com' ? 'facebook' : 'google'
  };
}

function migrateLegacyProfile(parsed: UserProfile): UserProfile {
  if (
    parsed.provider !== 'guest' &&
    !parsed.uid.startsWith('native_') &&
    parsed.uid &&
    !parsed.firebaseUid
  ) {
    return { ...parsed, firebaseUid: parsed.uid };
  }
  return parsed;
}

function readUserFromStorage(): UserProfile | null {
  try {
    const raw = localStorage.getItem('senay_user');
    if (!raw) return null;
    return migrateLegacyProfile(JSON.parse(raw) as UserProfile);
  } catch {
    return null;
  }
}

/** Firestore cloud sync key: only when Firebase authenticated this user (not native-only Google). */
function resolveCloudUid(user: UserProfile | null): string | null {
  if (!user || user.provider === 'guest') return null;
  if (user.uid.startsWith('native_')) return null;
  return (user.firebaseUid || user.uid) || null;
}

const App: React.FC = () => {
  const { t, language: appUiLanguage } = useAppLanguage();
  // One-time hydrate from localStorage. Async bootstrap must NOT re-read storage (Android race with Google sign-in).
  const [user, setUser] = useState<UserProfile | null>(() => readUserFromStorage());
  const [phase, setPhase] = useState<AppPhase>(AppPhase.DASHBOARD);
  const [showTransition, setShowTransition] = useState(false);
  const [isDailyWudase, setIsDailyWudase] = useState(false);
  
  const [hasSeenOnboarding, setHasSeenOnboarding] = useState(() => 
    localStorage.getItem('senay_onboarding_complete') === 'true'
  );

  const [liturgy, setLiturgy] = useState<WudaseLiturgy | null>(null);
  const [yewedesewMelaket, setYewedesewMelaket] = useState<WudaseMelaketBlock | null>(null);
  const [bibleData, setBibleData] = useState<BibleBookJSON[] | null>(null);
  const [allBooks, setAllBooks] = useState<Book[]>([]);
  const [quote, setQuote] = useState<Quote | null>(null);
  
  const [readingData, setReadingData] = useState<DailyManna | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [theme, setTheme] = useState<Theme>(() => (localStorage.getItem('senay_theme') as Theme) || 'dark');
  const [androidPermissionOpen, setAndroidPermissionOpen] = useState(false);
  const [androidPermissionManual, setAndroidPermissionManual] = useState(false);

  const cloudUid = resolveCloudUid(user);
  const { stats, completeChapter, applyGateCompletionsFromLock, getNextChapter, updateLastAccessed, saveStats, getHeatmapData, daysPracticed } = useProgress(cloudUid);
  const { notifications, notify, markAsRead, clearAll, unreadCount, activeToast, dismissToast } = useNotifications();

  const statsRef = useRef(stats);
  statsRef.current = stats;

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

  const bibleHasNextChapter = useMemo(() => {
    if (isDailyWudase || !readingData || readingData.bookId === 'wudase' || !bibleData) return false;
    const bookObj = bibleData.find(
      (b) => b.book_short_name_en.toLowerCase() === readingData.bookId.toLowerCase()
    );
    if (!bookObj?.chapters?.length) return false;
    const idx = bookObj.chapters.findIndex((c) => c.chapter === readingData.chapter);
    return idx >= 0 && idx < bookObj.chapters.length - 1;
  }, [isDailyWudase, readingData, bibleData]);

  useEffect(() => {
    document.documentElement.className = theme === 'light' ? 'light-theme' : '';
    localStorage.setItem('senay_theme', theme);
  }, [theme]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [litRes, yewRes, bibleRes, booksRes] = await Promise.all([
          fetch('./data/wudase-liturgy.json'),
          fetch('./data/yewedesewamelaket.json'),
          fetch('./data/bible-content.json'),
          fetch('./data/80-weahadu.json')
        ]);

        if (litRes.ok) setLiturgy(await litRes.json());
        if (yewRes.ok) setYewedesewMelaket(await yewRes.json());

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

    void fetchData();
  }, []);

  // Hydrate user after Firebase is ready (prefer live session over stale localStorage), then subscribe.
  // Do NOT return early for guest in the listener — otherwise a leftover guest profile blocks upgrading to Google.
  useEffect(() => {
    let unsub: (() => void) | undefined;
    let cancelled = false;

    void (async () => {
      await auth.authStateReady();
      if (cancelled) return;

      const persistProfile = (profile: UserProfile) => {
        try {
          localStorage.setItem('senay_user', JSON.stringify(profile));
        } catch {
          /* ignore */
        }
      };

      try {
        const redirectResult = await getRedirectResult(auth);
        if (redirectResult?.user) {
          const profile = profileFromFirebaseUser(redirectResult.user);
          persistProfile(profile);
          setUser(profile);
          setPhase(AppPhase.DASHBOARD);
        } else {
          // Capacitor Android WebView often lags updating auth.currentUser right after native Google + signInWithCredential.
          let firebaseUser = auth.currentUser;
          if (!firebaseUser) {
            for (let i = 0; i < 12 && !firebaseUser; i++) {
              await new Promise((r) => setTimeout(r, 50));
              if (cancelled) return;
              firebaseUser = auth.currentUser;
            }
          }
          if (firebaseUser) {
            const profile = profileFromFirebaseUser(firebaseUser);
            persistProfile(profile);
            setUser(profile);
          }
          // If no Firebase session: keep initial state from readUserFromStorage() — do NOT re-apply localStorage here
          // (would race with handleLogin and can overwrite a fresh Google session with stale guest data).
        }
      } catch (e) {
        console.error('Auth bootstrap failed:', e);
      }

      if (cancelled) return;

      unsub = onAuthStateChanged(auth, (firebaseUser) => {
        if (!firebaseUser) return;
        setUser((prev) => {
          if (prev?.uid === firebaseUser.uid && prev?.provider !== 'guest') return prev;
          const profile = profileFromFirebaseUser(firebaseUser);
          try {
            localStorage.setItem('senay_user', JSON.stringify(profile));
          } catch {
            /* ignore */
          }
          // Leave login screen when a new Firebase session is applied (not on token refresh — same uid returns early above).
          queueMicrotask(() => setPhase(AppPhase.DASHBOARD));
          return profile;
        });
      });
    })();

    return () => {
      cancelled = true;
      unsub?.();
    };
  }, []);

  // Android: after the native Google account sheet closes, Firebase sometimes updates one tick late in the WebView.
  useEffect(() => {
    if (!isAndroidNative()) return;
    let remove: (() => void) | undefined;

    void import('@capacitor/app').then(({ App }) => {
      void App.addListener('appStateChange', async ({ isActive }) => {
        if (!isActive) return;
        try {
          await auth.authStateReady();
          const u = auth.currentUser;
          if (!u) return;
          setUser((prev) => {
            if (prev?.uid === u.uid && prev?.provider !== 'guest') return prev;
            const profile = profileFromFirebaseUser(u);
            try {
              localStorage.setItem('senay_user', JSON.stringify(profile));
            } catch {
              /* ignore */
            }
            queueMicrotask(() => setPhase(AppPhase.DASHBOARD));
            return profile;
          });
        } catch {
          /* ignore */
        }
      }).then((handle) => {
        remove = () => void handle.remove();
      });
    });

    return () => {
      remove?.();
    };
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
    syncStreakReminderFromStats(next).catch(() => {});
  };

  const handleLogin = useCallback((profile: UserProfile) => {
    try {
      // Persist first so any concurrent bootstrap/storage reads see the new account (Android race).
      localStorage.setItem('senay_user', JSON.stringify(profile));
      setUser(profile);
      setPhase(AppPhase.DASHBOARD);
      const firstName = (profile.name || 'Friend').split(/\s+/)[0] || 'Friend';
      notify({
        title: 'Peace be with you',
        body: `Welcome to your sanctuary, ${firstName}.`,
        type: 'emotional',
        priority: 'low'
      });

      if (profile.uid.startsWith('native_')) {
        notify({
          title: 'Signed in on this device',
          body:
            'Your progress is saved on this phone. Syncing across devices may be available after a future app update.',
          type: 'emotional',
          priority: 'low'
        });
      }

      sendWelcomeNotification(firstName).catch(() => {
        // native notifications might not be available; fail silently
      });

      syncRitualRemindersFromStats(stats).catch(() => {});
      syncStreakReminderFromStats(stats).catch(() => {});
    } catch (e) {
      console.error('handleLogin failed:', e);
    }
  }, [notify, stats]);

  // Keep native routine alarms in sync with settings (all users, including guest).
  useEffect(() => {
    if (!user || !hasSeenOnboarding) return;
    syncRitualRemindersFromStats(stats).catch(() => {});
  }, [
    user?.uid,
    user?.provider,
    hasSeenOnboarding,
    appUiLanguage,
    JSON.stringify(stats.preferredRituals ?? []),
    JSON.stringify(stats.ritualReminderTimes ?? {})
  ]);

  // Re-apply native schedules when returning from background (OS may drop alarms; user may grant exact alarms).
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;
    if (!user || !hasSeenOnboarding) return;

    let remove: (() => void) | undefined;
    void import('@capacitor/app').then(({ App }) => {
      void App.addListener('appStateChange', ({ isActive }) => {
        if (!isActive) return;
        refreshNativeReminderSchedules(statsRef.current).catch(() => {});
      }).then((handle) => {
        remove = () => void handle.remove();
      });
    });

    return () => {
      remove?.();
    };
  }, [user?.uid, hasSeenOnboarding]);

  // Native: streak nudge at next 8 PM when streak ≥ 1 and no session today.
  useEffect(() => {
    if (!user || !hasSeenOnboarding) return;
    syncStreakReminderFromStats(stats).catch(() => {});
  }, [user?.uid, hasSeenOnboarding, stats]);

  // In-app (and mirrored tray) streak / routine behaviors; re-check on visibility and every minute
  // so crossing the ritual time while the app stays open still enqueues the reminder.
  useEffect(() => {
    if (!user || !hasSeenOnboarding) return;

    const tick = () => runDailyBehaviorNotifications(stats, notify);

    tick();
    const intervalId = window.setInterval(tick, 60_000);
    const onVis = () => {
      if (document.visibilityState === 'visible') tick();
    };
    document.addEventListener('visibilitychange', onVis);
    return () => {
      window.clearInterval(intervalId);
      document.removeEventListener('visibilitychange', onVis);
    };
  }, [user?.uid, hasSeenOnboarding, notify, stats]);

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
    void signOut(auth).catch(() => {
      /* still clear local session */
    });
    setUser(null);
    localStorage.removeItem('senay_user');
    setPhase(AppPhase.DASHBOARD);
    setIsDrawerOpen(false);
  };

  const goToPhase = useCallback((newPhase: AppPhase, instant: boolean = false) => {
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
  }, []);

  const onboardingBackRef = useRef<() => boolean>(() => false);
  const loginBackRef = useRef<() => boolean>(() => false);

  const bindOnboardingAndroidBack = useCallback((fn: () => boolean) => {
    onboardingBackRef.current = fn;
  }, []);

  const bindLoginAndroidBack = useCallback((fn: () => boolean) => {
    loginBackRef.current = fn;
  }, []);

  const closeSettings = useCallback(() => {
    syncRitualRemindersFromStats(stats).catch(() => {});
    syncStreakReminderFromStats(stats).catch(() => {});
    goToPhase(AppPhase.DASHBOARD);
  }, [stats, goToPhase]);

  useEffect(() => {
    if (!isAndroidNative()) return;

    setAndroidBackHandler(() => {
      if (!hasSeenOnboarding) return onboardingBackRef.current();
      if (!user) return loginBackRef.current();

      if (androidPermissionOpen) {
        setAndroidPermissionOpen(false);
        setAndroidPermissionManual(false);
        return true;
      }
      if (isNotificationOpen) {
        setIsNotificationOpen(false);
        return true;
      }
      if (isDrawerOpen) {
        setIsDrawerOpen(false);
        return true;
      }

      switch (phase) {
        case AppPhase.SETTINGS:
          closeSettings();
          return true;
        case AppPhase.ASK_MEMHIR:
          goToPhase(AppPhase.DASHBOARD);
          return true;
        case AppPhase.SUMMARY:
          goToPhase(AppPhase.READING);
          return true;
        case AppPhase.READING:
          goToPhase(AppPhase.DASHBOARD);
          return true;
        case AppPhase.PREPARATION:
          goToPhase(AppPhase.DASHBOARD);
          return true;
        case AppPhase.DASHBOARD:
        default:
          return false;
      }
    });

    return () => setAndroidBackHandler(null);
  }, [
    hasSeenOnboarding,
    user,
    phase,
    isDrawerOpen,
    isNotificationOpen,
    androidPermissionOpen,
    closeSettings,
    goToPhase
  ]);

  const getWudasePortion = (lit: WudaseLiturgy, chapter: number, melaket: WudaseMelaketBlock | null): DailyManna => {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const todayName = days[new Date().getDay()];
    const portion = lit.portions[todayName];
    const totalChapters = 3;

    if (chapter === 1) {
      return {
        title: 'Standard Prayers',
        bookId: 'wudase',
        bookName: 'ውዳሴ ማርያም',
        chapter: 1,
        totalChapters,
        sections: lit.yezewetir.sections,
        liturgicalSeason: todayName
      };
    }

    if (chapter === 3) {
      const ab = lit.anqaseBerhan;
      const prefixSections = melaket?.sections?.length ? [...melaket.sections] : [];
      let abSections = [...(ab?.sections || [])];
      if (abSections.length && !abSections[0].title?.trim()) {
        abSections = [
          { ...abSections[0], title: ab?.title || 'አንቀጸ ብርሃን' },
          ...abSections.slice(1)
        ];
      }
      return {
        title: ab?.title || 'አንቀጸ ብርሃን',
        bookId: 'wudase',
        bookName: 'ውዳሴ ማርያም',
        chapter: 3,
        totalChapters,
        sections: [...prefixSections, ...abSections],
        liturgicalSeason: todayName
      };
    }

    return {
      title: portion?.dayName || `${todayName} Portion`,
      bookId: 'wudase',
      bookName: 'ውዳሴ ማርያም',
      chapter: 2,
      totalChapters,
      sections: portion?.sections || [],
      liturgicalSeason: todayName
    };
  };

  const startFlow = (bookId: string, isWudase: boolean, specificChapter?: number) => {
    const isInstant = phase === AppPhase.READING;
    setIsDailyWudase(isWudase);
    
    if (isWudase && liturgy) {
      const ch = specificChapter || 1;
      setReadingData(getWudasePortion(liturgy, ch, yewedesewMelaket));
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

  const handleFinishReading = useCallback(() => {
    if (readingData) {
      const isBibleBook = readingData.bookId !== 'wudase';
      const prev = stats.bookProgress[readingData.bookId]?.completedChapters || [];
      const alreadyHadChapter = prev.includes(readingData.chapter);
      const done = new Set(prev);
      done.add(readingData.chapter);
      const willCompleteBook =
        isBibleBook &&
        readingData.totalChapters > 0 &&
        !alreadyHadChapter &&
        done.size === readingData.totalChapters;

      completeChapter(readingData.bookId, readingData.chapter);

      if (willCompleteBook) {
        notify({
          title: 'You finished the book',
          body: `${readingData.title} — well done. May the words continue to bear fruit in your life.`,
          type: 'success',
          priority: 'high'
        });
      }
    }
    goToPhase(AppPhase.DASHBOARD);
  }, [readingData, stats.bookProgress, completeChapter, notify, goToPhase]);

  // 1. First Priority: Onboarding
  if (!hasSeenOnboarding) {
    return <Onboarding onComplete={handleOnboardingComplete} bindAndroidBack={bindOnboardingAndroidBack} />;
  }

  // 2. Second Priority: Login
  if (!user) {
    return <LoginPage onLogin={handleLogin} bindAndroidBack={bindLoginAndroidBack} />;
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
            onClose={closeSettings}
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
            bibleHasNextChapter={bibleHasNextChapter}
            onNext={() => {
              if (isDailyWudase && readingData) {
                if (readingData.chapter === 1) startFlow('wudase', true, 2);
                else if (readingData.chapter === 2) startFlow('wudase', true, 3);
                else goToPhase(AppPhase.SUMMARY);
                return;
              }
              if (!readingData || !bibleData || readingData.bookId === 'wudase') {
                handleFinishReading();
                return;
              }
              const bookObj = bibleData.find(
                (b) => b.book_short_name_en.toLowerCase() === readingData.bookId.toLowerCase()
              );
              if (!bookObj) {
                handleFinishReading();
                return;
              }
              const idx = bookObj.chapters.findIndex((c) => c.chapter === readingData.chapter);
              if (idx < 0 || idx >= bookObj.chapters.length - 1) {
                handleFinishReading();
                return;
              }
              const nextChapterNum = bookObj.chapters[idx + 1].chapter;
              completeChapter(readingData.bookId, readingData.chapter);
              startFlow(readingData.bookId, false, nextChapterNum);
            }}
            onOpenMemhir={() => goToPhase(AppPhase.ASK_MEMHIR)}
            onFinish={() => goToPhase(AppPhase.DASHBOARD)}
            onSelectChapter={(chapter) => startFlow(readingData.bookId, false, chapter)}
          />
        )}

        {phase === AppPhase.SUMMARY && (
          <SummaryPhase reflectionText={t('summary.wudasePrayerPrompt')} onFinish={handleFinishReading} />
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
