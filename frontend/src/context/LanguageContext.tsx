'use client';
import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import {
  aiTranslate, getCachedTranslation, LANG_STORAGE_KEY,
  LANGUAGES, LangCode, setCachedTranslation,
} from '@/lib/i18n';

// Module-level English source registry — populated by useT calls
const SOURCE_REGISTRY: Record<string, string> = {};

interface LangCtx {
  lang: LangCode;
  translations: Record<string, string>;
  isTranslating: boolean;
  setLang: (code: LangCode) => Promise<void>;
}

const LanguageContext = createContext<LangCtx>({
  lang: 'en', translations: {}, isTranslating: false,
  setLang: async () => {},
});

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<LangCode>('en');
  const [translations, setTranslations] = useState<Record<string, string>>({});
  const [isTranslating, setIsTranslating] = useState(false);

  const applyLang = useCallback(async (code: LangCode) => {
    setLangState(code);
    localStorage.setItem(LANG_STORAGE_KEY, code);
    if (code === 'en') { setTranslations({}); return; }
    const cached = getCachedTranslation(code);
    if (cached) { setTranslations(cached); return; }
    setIsTranslating(true);
    try {
      const meta = LANGUAGES.find((l) => l.code === code);
      const result = await aiTranslate(SOURCE_REGISTRY, code, meta?.name ?? code);
      setCachedTranslation(code, result);
      setTranslations(result);
    } catch (e) { console.error('Translation failed:', e); }
    finally { setIsTranslating(false); }
  }, []);

  useEffect(() => {
    const saved = localStorage.getItem(LANG_STORAGE_KEY) as LangCode | null;
    if (saved && saved !== 'en') applyLang(saved);
  }, [applyLang]);

  return (
    <LanguageContext.Provider value={{ lang, translations, isTranslating, setLang: applyLang }}>
      {children}
    </LanguageContext.Provider>
  );
}

export const useLanguage = () => useContext(LanguageContext);

/**
 * useT — the only hook you need for translatable text.
 *
 * Usage:  const label = useT('menu_detection', 'Crop Disease Detection')
 *
 * - First arg: unique key (snake_case)
 * - Second arg: English text (source of truth)
 * - Returns English when lang=en, translated string otherwise
 * - Automatically registers the English string for AI translation
 * - Adding new text: just add a new useT call — no dictionary updates needed
 */
export function useT(key: string, english: string): string {
  // Register into module-level source registry
  SOURCE_REGISTRY[key] = english;
  const { translations, lang } = useContext(LanguageContext);
  if (lang === 'en') return english;
  return translations[key] ?? english;
}
