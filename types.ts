
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

export interface WudaseLiturgy {
  opening: string;
  yezewetir: {
    title: string;
    sections: BibleSectionJSON[];
  };
  portions: Record<string, WudasePortion>;
  wudaseAmlak: string;
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
