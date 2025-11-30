/**
 * Translation Provider
 * i18n provider component
 */

import { type ReactNode, createContext, useEffect, useMemo, useState } from "react";
import {
  I18nContext,
  formatCurrencyInLocale,
  formatDateInLocale,
  formatNumberInLocale,
  getLocaleInfo,
  getTranslation,
  isRTL,
} from "./i18n";
import { SUPPORTED_LOCALES } from "./types";

export interface TranslationProviderProps {
  children: ReactNode;
  defaultLocale?: string;
}

export function TranslationProvider({ children, defaultLocale = "en" }: TranslationProviderProps) {
  const [locale, setLocaleState] = useState<string>(() => {
    // Try to get from localStorage
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("i18n-locale");
      if (saved && SUPPORTED_LOCALES.some((l) => l.code === saved)) {
        return saved;
      }
    }
    return defaultLocale;
  });

  const setLocale = (newLocale: string) => {
    if (SUPPORTED_LOCALES.some((l) => l.code === newLocale)) {
      setLocaleState(newLocale);
      if (typeof window !== "undefined") {
        localStorage.setItem("i18n-locale", newLocale);
        document.documentElement.setAttribute("lang", newLocale);
        document.documentElement.setAttribute("dir", isRTL(newLocale) ? "rtl" : "ltr");
      }
    }
  };

  useEffect(() => {
    // Set initial HTML attributes
    if (typeof window !== "undefined") {
      document.documentElement.setAttribute("lang", locale);
      document.documentElement.setAttribute("dir", isRTL(locale) ? "rtl" : "ltr");
    }
  }, [locale]);

  const value = useMemo(
    () => ({
      locale,
      setLocale,
      t: (key: string, params?: Record<string, string | number>) =>
        getTranslation(locale, key, params),
      formatDate: (date: Date, options?: Intl.DateTimeFormatOptions) =>
        formatDateInLocale(locale, date, options),
      formatNumber: (value: number, options?: Intl.NumberFormatOptions) =>
        formatNumberInLocale(locale, value, options),
      formatCurrency: (value: number, currency?: string) =>
        formatCurrencyInLocale(locale, value, currency),
      isRTL: () => isRTL(locale),
      getLocale: () => getLocaleInfo(locale),
    }),
    [locale]
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}
