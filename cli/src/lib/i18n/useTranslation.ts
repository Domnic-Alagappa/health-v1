/**
 * useTranslation Hook
 * React hook for translations
 */

import { useI18n } from "./i18n"
import type { TranslationKey } from "./types"

export function useTranslation() {
  const { t, locale, setLocale, formatDate, formatNumber, formatCurrency, isRTL, getLocale } =
    useI18n()

  return {
    t,
    locale,
    setLocale,
    formatDate: (date: Date, options?: Intl.DateTimeFormatOptions) => formatDate(date, options),
    formatNumber: (value: number, options?: Intl.NumberFormatOptions) =>
      formatNumber(value, options),
    formatCurrency: (value: number, currency?: string) => formatCurrency(value, currency),
    isRTL: isRTL(),
    localeInfo: getLocale(),
  }
}

// Convenience hook for just translation
export function useT() {
  const { t } = useI18n()
  return t
}
