/**
 * i18n Types
 * Type-safe translation keys
 */

// This will be auto-generated from translation files
// For now, we define a basic structure

export type TranslationKey = string

export interface TranslationObject {
  [key: string]: string | TranslationObject
}

export interface Locale {
  code: string
  name: string
  nativeName: string
  rtl?: boolean
}

export const SUPPORTED_LOCALES: Locale[] = [
  { code: "en", name: "English", nativeName: "English" },
  { code: "es", name: "Spanish", nativeName: "Español" },
  { code: "fr", name: "French", nativeName: "Français" },
  { code: "de", name: "German", nativeName: "Deutsch" },
  { code: "it", name: "Italian", nativeName: "Italiano" },
  { code: "pt", name: "Portuguese", nativeName: "Português" },
  { code: "zh", name: "Chinese", nativeName: "中文" },
  { code: "ja", name: "Japanese", nativeName: "日本語" },
  { code: "ko", name: "Korean", nativeName: "한국어" },
  { code: "ar", name: "Arabic", nativeName: "العربية", rtl: true },
  { code: "hi", name: "Hindi", nativeName: "हिन्दी" },
  { code: "ru", name: "Russian", nativeName: "Русский" },
  { code: "nl", name: "Dutch", nativeName: "Nederlands" },
  { code: "sv", name: "Swedish", nativeName: "Svenska" },
  { code: "no", name: "Norwegian", nativeName: "Norsk" },
  { code: "da", name: "Danish", nativeName: "Dansk" },
  { code: "fi", name: "Finnish", nativeName: "Suomi" },
  { code: "pl", name: "Polish", nativeName: "Polski" },
  { code: "tr", name: "Turkish", nativeName: "Türkçe" },
  { code: "cs", name: "Czech", nativeName: "Čeština" },
  { code: "ro", name: "Romanian", nativeName: "Română" },
  { code: "hu", name: "Hungarian", nativeName: "Magyar" },
  { code: "el", name: "Greek", nativeName: "Ελληνικά" },
  { code: "he", name: "Hebrew", nativeName: "עברית", rtl: true },
  { code: "th", name: "Thai", nativeName: "ไทย" },
  { code: "vi", name: "Vietnamese", nativeName: "Tiếng Việt" },
  { code: "id", name: "Indonesian", nativeName: "Bahasa Indonesia" },
  { code: "ms", name: "Malay", nativeName: "Bahasa Melayu" },
  { code: "uk", name: "Ukrainian", nativeName: "Українська" },
]
