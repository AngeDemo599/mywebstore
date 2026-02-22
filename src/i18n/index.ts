import { ar } from "./ar";
import { fr } from "./fr";

export type Locale = "ar" | "fr";

export const dictionaries: Record<Locale, Record<string, string>> = { ar, fr };

export const defaultLocale: Locale = "fr";

export function getDirection(locale: Locale): "rtl" | "ltr" {
  return locale === "ar" ? "rtl" : "ltr";
}

/** Server-side translation helper for use in server components */
export function getTranslator(locale: Locale) {
  const dict = dictionaries[locale] || dictionaries[defaultLocale];
  return (key: string): string => dict[key] || key;
}
