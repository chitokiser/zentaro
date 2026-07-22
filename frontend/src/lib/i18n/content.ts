import type { Locale } from "./translations"

/** Picks the admin-entered translation for the current locale, falling back to the Korean original if missing. */
export function localizedText(
  locale: Locale,
  ko: string,
  en?: string | null,
  vi?: string | null,
): string {
  if (locale === "en" && en) return en
  if (locale === "vi" && vi) return vi
  return ko
}
