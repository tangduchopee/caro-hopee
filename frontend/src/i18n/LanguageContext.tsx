import React, { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';
import en from './locales/en.json';
import vi from './locales/vi.json';

export type Language = 'en' | 'vi';

type TranslationValue = string | { [key: string]: TranslationValue };
type Translations = typeof en;

const translations: Record<Language, Translations> = { en, vi };

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string, params?: Record<string, string | number>) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const STORAGE_KEY = 'app-language';

/**
 * Get nested value from object by dot-notation key
 * Example: getNestedValue(obj, 'game.status.waiting')
 */
function getNestedValue(obj: TranslationValue, path: string): string | undefined {
  const keys = path.split('.');
  let current: TranslationValue = obj;

  for (const key of keys) {
    if (current && typeof current === 'object' && key in current) {
      current = current[key];
    } else {
      return undefined;
    }
  }

  return typeof current === 'string' ? current : undefined;
}

/**
 * Replace template params in string
 * Example: interpolate('Hello {name}', { name: 'John' }) => 'Hello John'
 */
function interpolate(str: string, params?: Record<string, string | number>): string {
  if (!params) return str;
  return str.replace(/\{(\w+)\}/g, (_, key) => {
    return params[key]?.toString() ?? `{${key}}`;
  });
}

export const LanguageProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    // Try to get from localStorage, default to 'vi'
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === 'en' || stored === 'vi') {
      return stored;
    }
    // Detect browser language
    const browserLang = navigator.language.toLowerCase();
    return browserLang.startsWith('vi') ? 'vi' : 'en';
  });

  const setLanguage = useCallback((lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem(STORAGE_KEY, lang);
  }, []);

  // Translation function
  const t = useCallback((key: string, params?: Record<string, string | number>): string => {
    const value = getNestedValue(translations[language], key);
    if (value) {
      return interpolate(value, params);
    }
    // Fallback to English
    const fallback = getNestedValue(translations.en, key);
    if (fallback) {
      return interpolate(fallback, params);
    }
    // Return key if not found (for debugging)
    console.warn(`[i18n] Missing translation: ${key}`);
    return key;
  }, [language]);

  // Update document lang attribute
  useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = (): LanguageContextType => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};

export default LanguageContext;
