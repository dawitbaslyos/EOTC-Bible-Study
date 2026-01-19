
export enum AppPhase {
  DASHBOARD = 'DASHBOARD',
  PREPARATION = 'PREPARATION', 
  READING = 'READING',
  ASK_MEMHIR = 'ASK_MEMHIR'
}

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

export interface Verse {
  id: string;
  geez?: string;
  amharic: string;
  english?: string;
  commentary?: Commentary[];
  sectionTitle?: string;
}

// Updated WudasePortion to use sections instead of verses to match App.tsx usage
export interface WudasePortion {
  dayName: string;
  sections: BibleSectionJSON[];
}

export interface WudaseLiturgy {
  opening: string;
  // Updated yezewetir from string to object with title and sections to fix App.tsx errors
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

// Added DedicationLevel type to support tracking user commitment
export type DedicationLevel = 'Novice' | 'Steady' | 'Devoted';

export interface UserStats {
  rank: string;
  studyHistory: Record<string, number>;
  bookProgress: Record<string, BookProgress>;
  totalSessions: number;
  // Added optional fields for user preferences and dedication levels
  dedicationLevel?: DedicationLevel;
  preferredTime?: {
    enabled: boolean;
    time?: string;
  };
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