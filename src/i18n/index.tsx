import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { LOCALE_BY_LANGUAGE, translations, type Language } from "./translations";

const STORAGE_KEY = "spraystone-lang-v2";
const DEFAULT_LANGUAGE: Language = "fr";

const isLanguage = (value: string): value is Language =>
  value === "en" || value === "fr" || value === "nl";

const getInitialLanguage = (): Language => {
  try {
    const stored = typeof localStorage !== "undefined" ? localStorage.getItem(STORAGE_KEY) : null;
    if (stored && isLanguage(stored)) return stored;
  } catch {
    // ignore
  }
  return DEFAULT_LANGUAGE;
};

const getByPath = (obj: any, key: string): unknown =>
  key.split(".").reduce((acc, part) => (acc ? acc[part] : undefined), obj);

export interface I18nContextValue {
  lang: Language;
  locale: string;
  setLang: (lang: Language) => void;
  t: (key: string, vars?: Record<string, string | number>) => string;
}

const I18nContext = createContext<I18nContextValue | null>(null);

export const I18nProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [lang, setLang] = useState<Language>(() => getInitialLanguage());
  const locale = LOCALE_BY_LANGUAGE[lang];

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, lang);
    } catch {
      // ignore
    }
    document.documentElement.lang = lang;
  }, [lang]);

  const t = useCallback<I18nContextValue["t"]>(
    (key, vars) => {
      const primary = getByPath((translations as any)[lang], key);
      const fallback = getByPath((translations as any).en, key);
      const template = typeof primary === "string" ? primary : typeof fallback === "string" ? fallback : key;
      if (!vars) return template;
      return template.replace(/\{(\w+)\}/g, (match, name) =>
        Object.prototype.hasOwnProperty.call(vars, name) ? String(vars[name]) : match
      );
    },
    [lang]
  );

  const value = useMemo<I18nContextValue>(() => ({ lang, locale, setLang, t }), [lang, locale, t]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
};

export const useI18n = (): I18nContextValue => {
  const ctx = useContext(I18nContext);
  if (!ctx) {
    throw new Error("useI18n must be used within an I18nProvider");
  }
  return ctx;
};
