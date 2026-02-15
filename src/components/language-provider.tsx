"use client";

import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { type Locale, dictionaries, defaultLocale, getDirection } from "@/i18n";

interface LanguageContextType {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: string) => string;
  dir: "rtl" | "ltr";
}

const LanguageContext = createContext<LanguageContextType>({
  locale: defaultLocale,
  setLocale: () => {},
  t: (key: string) => key,
  dir: "rtl",
});

const STORAGE_KEY = "souqmaker-lang";
const COOKIE_KEY = "souqmaker-lang";

function setCookie(name: string, value: string) {
  document.cookie = `${name}=${value};path=/;max-age=${60 * 60 * 24 * 365};SameSite=Lax`;
}

export function LanguageProvider({
  children,
  initialLocale,
}: {
  children: React.ReactNode;
  initialLocale?: Locale;
}) {
  const [locale, setLocaleState] = useState<Locale>(initialLocale || defaultLocale);

  // Sync localStorage on mount (migrate old users who only had localStorage)
  useEffect(() => {
    if (!initialLocale) {
      const saved = localStorage.getItem(STORAGE_KEY) as Locale | null;
      if (saved && (saved === "ar" || saved === "fr")) {
        setLocaleState(saved);
        setCookie(COOKIE_KEY, saved);
      }
    }
  }, [initialLocale]);

  useEffect(() => {
    const dir = getDirection(locale);
    document.documentElement.lang = locale;
    document.documentElement.dir = dir;
  }, [locale]);

  const setLocale = useCallback((newLocale: Locale) => {
    setLocaleState(newLocale);
    localStorage.setItem(STORAGE_KEY, newLocale);
    setCookie(COOKIE_KEY, newLocale);
  }, []);

  const t = useCallback(
    (key: string): string => {
      return dictionaries[locale][key] || key;
    },
    [locale]
  );

  const dir = getDirection(locale);

  return (
    <LanguageContext.Provider value={{ locale, setLocale, t, dir }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useTranslation() {
  return useContext(LanguageContext);
}
