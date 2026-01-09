
export enum AppPhase {
  DASHBOARD = 'DASHBOARD',
  PREPARATION = 'PREPARATION', 
  READING = 'READING',         
  SUMMARY = 'SUMMARY',         
  REFLECTION = 'REFLECTION'    
}

export type Testament = 'Old' | 'New';
export type BookCategory = 'Law' | 'History' | 'Wisdom' | 'Prophets' | 'Gospels' | 'Epistles' | 'Revelation';

export interface Book {
  id: string;
  name: string;
  category: BookCategory;
  totalChapters: number;
  testament: Testament;
}

export interface Verse {
  id: string;
  geez: string;
  amharic: string;
  english: string;
  commentary?: Commentary[];
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
  verses: Verse[];
  liturgicalSeason: string;
}

export interface BookProgress {
  bookId: string;
  completedChapters: number[];
}

export interface UserStats {
  rank: string;
  studyHistory: Record<string, number>;
  bookProgress: Record<string, BookProgress>;
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface Quote {
  text: string;
  source: string;
}
