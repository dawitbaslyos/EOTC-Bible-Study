import type { BibleBookJSON, BibleVerseJSON, Quote } from '../types';

/** Deterministic PRNG for a numeric seed (same calendar day → same sequence). */
function mulberry32(seed: number) {
  return function next() {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function calendarSeed(d: Date): number {
  return d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate();
}

/**
 * Picks one verse from bundled Bible JSON for the dashboard “daily quote”.
 * Same calendar date → same verse until the next day (local time).
 * Prefers English, then Amharic `text`, then Geʿez.
 */
export function pickDailyQuoteFromBible(books: BibleBookJSON[]): Quote | null {
  if (!books.length) return null;

  const seed = calendarSeed(new Date());
  const maxAttempts = 800;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const rand = mulberry32(seed + attempt);
    const bi = Math.floor(rand() * books.length);
    const book = books[bi];
    if (!book?.chapters?.length) continue;

    const ci = Math.floor(rand() * book.chapters.length);
    const chapter = book.chapters[ci];
    const verses: BibleVerseJSON[] = [];
    for (const sec of chapter.sections || []) {
      if (sec.verses?.length) verses.push(...sec.verses);
    }
    if (!verses.length) continue;

    const vi = Math.floor(rand() * verses.length);
    const v = verses[vi];
    const raw =
      v.english?.trim() ||
      v.text?.trim() ||
      v.geez?.trim() ||
      '';
    const text = raw.replace(/\s+/g, ' ').trim();
    // Skip empty or trivially short lines
    if (text.length < 12) continue;

    const source = `${book.book_name_en} ${chapter.chapter}:${v.verse}`;
    return { text, source };
  }

  return null;
}
