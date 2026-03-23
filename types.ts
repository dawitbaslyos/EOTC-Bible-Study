
export enum AppPhase {
  DASHBOARD = 'DASHBOARD',
  PREPARATION = 'PREPARATION', 
  READING = 'READING',
  SUMMARY = 'SUMMARY',
  ASK_MEMHIR = 'ASK_MEMHIR',
  ONBOARDING = 'ONBOARDING',
  SETTINGS = 'SETTINGS'
}

export type Theme = 'dark' | 'light';
export type RitualTime = 'day' | 'night';

/** UI + primary reading translation preference (Settings). Default: English. */
export type AppContentLanguage = 'english' | 'amharic';

/**
 * In-reader script (segmented toggle on reading screen).
 * `geez_amharic` is legacy storage only; daily Wudase uses {@link LanguageVisibility} (G + A toggles).
 */
export type ReadingScriptMode = 'geez' | 'amharic' | 'english' | 'geez_amharic';

export type Testament = 'All' | 'Old' | 'New';
export type BookCategory = 'Law' | 'History' | 'Wisdom' | 'Prophets' | 'Gospels' | 'Epistles' | 'Revelation';

export interface LanguageVisibility {
  geez: boolean;
  amharic: boolean;
  english: boolean;
}

export interface BibleVerseJSON {
  verse: number;
  text: string;
  geez?: string;
  /** Amharic line when present (e.g. Wudase JSON); falls back to `text`. */
  amharic?: string;
  english?: string;
  commentary?: Commentary[];
}

export interface Commentary {
  term: string;
  explanation: string;
  theology: string;
}

export interface BibleSectionJSON {
  title: string;
  verses: BibleVerseJSON[];
}

export interface BibleChapterJSON {
  chapter: number;
  sections: BibleSectionJSON[];
}

export interface BibleBookJSON {
  book_number: number;
  book_name_am: string;
  book_short_name_am: string;
  book_name_en: string;
  book_short_name_en: string;
  testament: string;
  chapters: BibleChapterJSON[];
}

export interface Book {
  id: string;
  name: string;
  category: BookCategory;
  totalChapters: number;
  testament: string; 
}

export interface WudasePortion {
  dayName: string;
  sections: BibleSectionJSON[];
}

/** Standalone JSON `./data/yewedesewamelaket.json` — prepended before አንቀጸ ብርሃን on Wudase ch.3. */
export interface WudaseMelaketBlock {
  title: string;
  sections: BibleSectionJSON[];
}

export interface WudaseLiturgy {
  opening: string;
  yezewetir: {
    title: string;
    sections: BibleSectionJSON[];
  };
  portions: Record<string, WudasePortion>;
  /** Legacy; kept empty. አንቀጸ ብርሃን text lives in `anqaseBerhan` (reading chapter 3). */
  wudaseAmlak?: string;
  /** Closing liturgy "አንቀጸ ብርሃን" — same reading UI as daily portion (chapter 3). */
  anqaseBerhan: {
    title: string;
    sections: BibleSectionJSON[];
  };
  closing: string;
  bowingInstructions: string;
}

export interface DailyManna {
  title: string;
  bookId: string;
  bookName: string;
  chapter: number;
  totalChapters: number;
  sections: BibleSectionJSON[];
  liturgicalSeason: string;
}

export interface BookProgress {
  bookId: string;
  completedChapters: number[];
  lastAccessed: number;
}

export type DedicationLevel = 'Novice' | 'Steady' | 'Devoted';

export interface UserStats {
  rank: string;
  studyHistory: Record<string, number>;
  bookProgress: Record<string, BookProgress>;
  totalSessions: number;
  dedicationLevel?: DedicationLevel;
  preferredRituals?: RitualTime[];
  /** Local times for daily routine notifications (when morning/evening ritual is enabled). */
  ritualReminderTimes?: Partial<Record<RitualTime, { hour: number; minute: number }>>;
  /** Focus-lock overlay readings completed (native Android gate). */
  gateLockReadingsCompleted?: number;
  hasCompletedOnboarding?: boolean;
  streak: number;
  lastStudyDate?: string;
  isPremium?: boolean;
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  attachment?: {
    type: 'book' | 'quote' | 'audio';
    title: string;
    data?: string; 
    mimeType?: string;
  };
}

export interface Quote {
  text: string;
  source: string;
}

export interface FastingSeason {
  id: string;
  name: string;
  ethStartMonth: number;
  ethStartDay: number;
  ethEndMonth: number;
  ethEndDay: number;
  color: string;
  isMovable?: boolean;
}

export interface EthiopianHoliday {
  id: string;
  name: string;
  month: number;
  day: number;
  type: 'Major' | 'Minor' | 'Historical';
  description?: string;
}

export type NotificationType = 'info' | 'success' | 'warning' | 'emotional';
export type NotificationPriority = 'low' | 'normal' | 'high';

export interface Notification {
  id: string;
  title: string;
  body: string;
  type: NotificationType;
  priority: NotificationPriority;
  read: boolean;
  createdAt: number;
  actionUrl?: string;
}
