
export enum AppPhase {
  DASHBOARD = 'DASHBOARD',
  PREPARATION = 'PREPARATION', 
  READING = 'READING',         
  SUMMARY = 'SUMMARY',         
  REFLECTION = 'REFLECTION',
  ASK_MEMHIR = 'ASK_MEMHIR'
}

export type Testament = 'Old' | 'New';
export type BookCategory = 'Law' | 'History' | 'Wisdom' | 'Prophets' | 'Gospels' | 'Epistles' | 'Revelation';

export type LanguageVisibility = {
  geez: boolean;
  amharic: boolean;
  english: boolean;
};

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
  testament: Testament;
}

export interface Verse {
  id: string;
  geez?: string;
  amharic: string;
  english?: string;
  commentary?: Commentary[];
  sectionTitle?: string;
}

export interface Commentary {
  term: string;
  explanation: string;
  theology: string;
}

export interface WudasePortion {
  dayName: string;
  verses: Verse[];
}

export interface WudaseLiturgy {
  opening: string;
  yezewetir: string;
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

export interface UserStats {
  rank: string;
  studyHistory: Record<string, number>;
  bookProgress: Record<string, BookProgress>;
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  attachment?: {
    type: 'book' | 'quote';
    title: string;
  };
}

export interface Quote {
  text: string;
  source: string;
}
