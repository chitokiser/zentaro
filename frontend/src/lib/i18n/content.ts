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

/** Picks the admin-entered translation for a list field (e.g. badges), falling back to the Korean original if empty. */
export function localizedList(
  locale: Locale,
  ko?: string[] | null,
  en?: string[] | null,
  vi?: string[] | null,
): string[] {
  if (locale === "en" && en && en.length > 0) return en
  if (locale === "vi" && vi && vi.length > 0) return vi
  return ko ?? []
}
