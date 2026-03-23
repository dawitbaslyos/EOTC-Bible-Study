import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { AppContentLanguage } from '../types';
import { UI_STRINGS } from '../locales/strings';

const STORAGE_KEY = 'senay_app_language';

/** UI_STRINGS uses short locale keys `en` / `am`. */
function localeBundleKey(lang: AppContentLanguage): 'en' | 'am' {
  return lang === 'amharic' ? 'am' : 'en';
}

function readStoredLanguage(): AppContentLanguage {
  try {
    const v = localStorage.getItem(STORAGE_KEY);
    if (v === 'amharic') return 'amharic';
  } catch {
    /* ignore */
  }
  return 'english';
}

type AppLanguageContextValue = {
  language: AppContentLanguage;
  setLanguage: (l: AppContentLanguage) => void;
  t: (key: string, vars?: Record<string, string | number>) => string;
};

const AppLanguageContext = createContext<AppLanguageContextValue | null>(null);

export function AppLanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<AppContentLanguage>(() => readStoredLanguage());

  useEffect(() => {
    document.documentElement.lang = language === 'english' ? 'en' : 'am';
  }, [language]);

  const setLanguage = useCallback((l: AppContentLanguage) => {
    setLanguageState(l);
    try {
      localStorage.setItem(STORAGE_KEY, l);
    } catch {
      /* ignore */
    }
  }, []);

  const t = useCallback(
    (key: string, vars?: Record<string, string | number>) => {
      const bundleKey = localeBundleKey(language);
      const map = (UI_STRINGS[bundleKey] ?? UI_STRINGS.en) as Record<string, string>;
      const fallback = UI_STRINGS.en as Record<string, string>;
      let s = map[key] ?? fallback[key] ?? key;
      if (vars) {
        for (const [k, v] of Object.entries(vars)) {
          const safeK = k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
          s = s.replace(new RegExp(`\\{${safeK}\\}`, 'g'), String(v));
        }
      }
      return s;
    },
    [language]
  );

  const value = useMemo(
    () => ({ language, setLanguage, t }),
    [language, setLanguage, t]
  );

  return <AppLanguageContext.Provider value={value}>{children}</AppLanguageContext.Provider>;
}

export function useAppLanguage(): AppLanguageContextValue {
  const ctx = useContext(AppLanguageContext);
  if (!ctx) {
    throw new Error('useAppLanguage must be used within AppLanguageProvider');
  }
  return ctx;
}
