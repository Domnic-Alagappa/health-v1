/**
 * i18n Core Utilities
 * Internationalization system with React context
 */

import { createContext, useContext } from "react";
import { type Locale, SUPPORTED_LOCALES, type TranslationKey } from "./types";

export interface I18nContextValue {
  locale: string;
  setLocale: (locale: string) => void;
  t: (key: TranslationKey, params?: Record<string, string | number>) => string;
  formatDate: (date: Date, options?: Intl.DateTimeFormatOptions) => string;
  formatNumber: (value: number, options?: Intl.NumberFormatOptions) => string;
  formatCurrency: (value: number, currency?: string) => string;
  isRTL: () => boolean;
  getLocale: () => Locale | undefined;
}

export const I18nContext = createContext<I18nContextValue | null>(null);

// Translation storage - will be populated by TranslationProvider
const translations: Record<string, Record<string, string>> = {};

// Function to set translations for a locale
export function setTranslations(locale: string, translationData: Record<string, string>): void {
  translations[locale] = translationData;
}

// Helper function to get nested value from object using dot notation
function getNestedValue(obj: Record<string, any>, path: string): string | undefined {
  const keys = path.split(".");
  let current: any = obj;
  for (const key of keys) {
    if (current && typeof current === "object" && key in current) {
      current = current[key];
    } else {
      return undefined;
    }
  }
  return typeof current === "string" ? current : undefined;
}

export function getTranslation(
  locale: string,
  key: TranslationKey,
  params?: Record<string, string | number>
): string {
  const localeTranslations = translations[locale] || translations.en || {};
  let translation = getNestedValue(localeTranslations, key) || key;

  // Replace parameters
  if (params) {
    for (const [paramKey, paramValue] of Object.entries(params)) {
      translation = translation.replace(`{{${paramKey}}}`, String(paramValue));
    }
  }

  return translation;
}

export function formatDateInLocale(
  locale: string,
  date: Date,
  options?: Intl.DateTimeFormatOptions
): string {
  return new Intl.DateTimeFormat(locale, options).format(date);
}

export function formatNumberInLocale(
  locale: string,
  value: number,
  options?: Intl.NumberFormatOptions
): string {
  return new Intl.NumberFormat(locale, options).format(value);
}

export function formatCurrencyInLocale(locale: string, value: number, currency = "USD"): string {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
  }).format(value);
}

export function isRTL(locale: string): boolean {
  const localeInfo = SUPPORTED_LOCALES.find((l) => l.code === locale);
  return localeInfo?.rtl || false;
}

export function getLocaleInfo(locale: string): Locale | undefined {
  return SUPPORTED_LOCALES.find((l) => l.code === locale);
}

export function useI18n(): I18nContextValue {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error("useI18n must be used within I18nProvider");
  }
  return context;
}
