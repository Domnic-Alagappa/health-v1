/**
 * Translation Provider
 * i18n provider component
 */

import { type ReactNode, useEffect, useMemo, useState } from "react";
import {
  I18nContext,
  formatCurrencyInLocale,
  formatDateInLocale,
  formatNumberInLocale,
  getLocaleInfo,
  getTranslation,
  isRTL,
  setTranslations,
} from "./i18n";
import { SUPPORTED_LOCALES } from "./types";

// Import all locale files
import enTranslations from "./locales/en.json";
import esTranslations from "./locales/es.json";
import frTranslations from "./locales/fr.json";
import deTranslations from "./locales/de.json";
import itTranslations from "./locales/it.json";
import ptTranslations from "./locales/pt.json";
import zhTranslations from "./locales/zh.json";
import jaTranslations from "./locales/ja.json";
import koTranslations from "./locales/ko.json";
import arTranslations from "./locales/ar.json";
import hiTranslations from "./locales/hi.json";
import ruTranslations from "./locales/ru.json";
import nlTranslations from "./locales/nl.json";
import svTranslations from "./locales/sv.json";
import noTranslations from "./locales/no.json";
import daTranslations from "./locales/da.json";
import fiTranslations from "./locales/fi.json";
import plTranslations from "./locales/pl.json";
import trTranslations from "./locales/tr.json";
import csTranslations from "./locales/cs.json";
import roTranslations from "./locales/ro.json";
import huTranslations from "./locales/hu.json";
import elTranslations from "./locales/el.json";
import heTranslations from "./locales/he.json";
import thTranslations from "./locales/th.json";
import viTranslations from "./locales/vi.json";
import idTranslations from "./locales/id.json";
import msTranslations from "./locales/ms.json";
import ukTranslations from "./locales/uk.json";

// Flatten nested translation objects to dot-notation keys
function flattenTranslations(obj: any, prefix = ""): Record<string, string> {
  const result: Record<string, string> = {};
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      const newKey = prefix ? `${prefix}.${key}` : key;
      if (typeof obj[key] === "object" && obj[key] !== null && !Array.isArray(obj[key])) {
        Object.assign(result, flattenTranslations(obj[key], newKey));
      } else if (typeof obj[key] === "string") {
        result[newKey] = obj[key];
      }
    }
  }
  return result;
}

// Map of locale codes to translation imports
const localeTranslations: Record<string, any> = {
  en: enTranslations,
  es: esTranslations,
  fr: frTranslations,
  de: deTranslations,
  it: itTranslations,
  pt: ptTranslations,
  zh: zhTranslations,
  ja: jaTranslations,
  ko: koTranslations,
  ar: arTranslations,
  hi: hiTranslations,
  ru: ruTranslations,
  nl: nlTranslations,
  sv: svTranslations,
  no: noTranslations,
  da: daTranslations,
  fi: fiTranslations,
  pl: plTranslations,
  tr: trTranslations,
  cs: csTranslations,
  ro: roTranslations,
  hu: huTranslations,
  el: elTranslations,
  he: heTranslations,
  th: thTranslations,
  vi: viTranslations,
  id: idTranslations,
  ms: msTranslations,
  uk: ukTranslations,
};

// Initialize translations
for (const [locale, translations] of Object.entries(localeTranslations)) {
  setTranslations(locale, flattenTranslations(translations));
}

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
