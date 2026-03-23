import type { AppContentLanguage, BibleVerseJSON, ReadingScriptMode } from '../types';

/** Heuristic: Latin-heavy strings (e.g. English translation) vs Ethiopic script. */
export function isMostlyLatin(s: string): boolean {
  const trimmed = s.trim();
  if (!trimmed) return true;
  const latin = (trimmed.match(/[a-zA-Z]/g) || []).length;
  return latin > trimmed.length * 0.12;
}

/**
 * Pick one primary line per verse from app language + available fields.
 * Falls through when a field is missing (common in liturgical JSON).
 */
export function pickVerseBody(v: BibleVerseJSON, lang: AppContentLanguage): string | null {
  const en = v.english?.trim() || '';
  const am = v.amharic?.trim() || '';
  const tx = v.text?.trim() || '';
  const gz = v.geez?.trim() || '';

  if (lang === 'english') {
    if (en) return en;
    if (tx && isMostlyLatin(tx)) return tx;
    if (am && isMostlyLatin(am)) return am;
    if (gz && isMostlyLatin(gz)) return gz;
    if (tx) return tx;
    if (gz) return gz;
    if (am) return am;
    return null;
  }

  if (am) return am;
  if (tx) return tx;
  if (gz) return gz;
  if (en) return en;
  return null;
}

/** Single-column Bible reading: dual Wudase preference maps to Amharic (closest study line). */
export type BibleReadingScriptMode = 'geez' | 'amharic' | 'english';

export function effectiveBibleReadingMode(mode: ReadingScriptMode): BibleReadingScriptMode {
  return mode === 'geez_amharic' ? 'amharic' : mode;
}

/**
 * Single-column reading by segmented G / A / E toggle (Wudase + Bible).
 * When a field is empty, falls through so you still see content until you add full Geez/Amharic lines.
 */
export function pickVerseForReadingMode(v: BibleVerseJSON, mode: ReadingScriptMode): string | null {
  const en = v.english?.trim() || '';
  const am = v.amharic?.trim() || '';
  const tx = v.text?.trim() || '';
  const gz = v.geez?.trim() || '';

  switch (mode) {
    case 'geez_amharic':
      return pickVerseForReadingMode(v, 'amharic');
    case 'geez':
      if (gz) return gz;
      if (am) return am;
      if (tx) return tx;
      return en || null;
    case 'amharic':
      if (am) return am;
      if (tx) return tx;
      if (gz) return gz;
      return en || null;
    case 'english':
      if (en) return en;
      if (tx && isMostlyLatin(tx)) return tx;
      if (am && isMostlyLatin(am)) return am;
      if (gz && isMostlyLatin(gz)) return gz;
      if (tx) return tx;
      if (gz) return gz;
      if (am) return am;
      return null;
    default:
      return null;
  }
}

/**
 * Wudase JSON uses `geez` / `amharic` / `english` only — show exactly that column, no fallbacks.
 */
export function pickVerseStrictByLabel(v: BibleVerseJSON, mode: ReadingScriptMode): string | null {
  const gz = v.geez?.trim() || '';
  const am = v.amharic?.trim() || '';
  const en = v.english?.trim() || '';
  switch (mode) {
    case 'geez':
      return gz || null;
    case 'amharic':
      return am || null;
    case 'english':
      return en || null;
    case 'geez_amharic':
      return null;
    default:
      return null;
  }
}

/** Wudase: Ge'ez + Amharic stacked (strict fields, no cross-fallback). */
export function wudaseVerseDualLines(v: BibleVerseJSON): { geez: string | null; amharic: string | null } {
  return {
    geez: pickVerseStrictByLabel(v, 'geez'),
    amharic: pickVerseStrictByLabel(v, 'amharic')
  };
}
