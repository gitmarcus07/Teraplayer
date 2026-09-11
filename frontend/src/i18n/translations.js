/**
 * Translation dictionaries.
 * Covers site chrome + homepage. Other pages fall back to English until
 * their copy is added here — look up the key, add hi/es, use t(key).
 * Use {year} placeholders where noted; replace at render time.
 *
 * Bundle layout (page-speed): English ships in the main bundle because it
 * is both the default language and the per-key fallback. The remaining
 * locales live in ./lang/*.js and are code-split — LanguageContext loads
 * them on demand via localeLoaders below, so ~570 KB of dictionaries stay
 * out of the initial download.
 */
export const LANGS = [
  { code: "en", label: "English", native: "English" },
  { code: "hi", label: "Hindi", native: "हिन्दी" },
  { code: "id", label: "Indonesian", native: "Bahasa Indonesia" },
  { code: "bn", label: "Bengali", native: "বাংলা" },
  { code: "ur", label: "Urdu", native: "اردو", rtl: true },
  { code: "ar", label: "Arabic", native: "العربية", rtl: true },
  { code: "ne", label: "Nepali", native: "नेपाली" },
  { code: "es", label: "Spanish", native: "Español" },
];

import en from "./lang/en";

// Synchronously available dictionaries (default + fallback).
export const dictionaries = { en };

// Lazy per-locale chunks. Static import paths so webpack emits one chunk
// per language, fetched only when the user picks that language.
export const localeLoaders = {
  hi: () => import("./lang/hi"),
  es: () => import("./lang/es"),
  id: () => import("./lang/id"),
  bn: () => import("./lang/bn"),
  ur: () => import("./lang/ur"),
  ar: () => import("./lang/ar"),
  ne: () => import("./lang/ne"),
};
