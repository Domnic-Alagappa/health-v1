/**
 * i18n Types
 * Type-safe translation keys
 */

export type TranslationKey = string;

export interface TranslationObject {
  [key: string]: string | TranslationObject;
}

export interface Locale {
  code: string;
  name: string;
  nativeName: string;
  rtl?: boolean;
}
