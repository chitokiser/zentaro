"use client"

import { createContext, useContext, useEffect, useState } from "react"
import { DICTIONARIES, type Locale } from "./translations"

interface I18nContextValue {
  locale: Locale
  setLocale: (locale: Locale) => void
  t: (typeof DICTIONARIES)["ko"]
}

const I18nContext = createContext<I18nContextValue | null>(null)
const STORAGE_KEY = "zentaro_locale"

function isLocale(value: string | null): value is Locale {
  return value === "ko" || value === "en" || value === "vi"
}

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>("vi")

  useEffect(() => {
    const saved = window.localStorage.getItem(STORAGE_KEY)
    if (isLocale(saved)) setLocaleState(saved)
  }, [])

  function setLocale(next: Locale) {
    setLocaleState(next)
    window.localStorage.setItem(STORAGE_KEY, next)
  }

  return (
    <I18nContext.Provider value={{ locale, setLocale, t: DICTIONARIES[locale] }}>
      {children}
    </I18nContext.Provider>
  )
}

export function useI18n() {
  const ctx = useContext(I18nContext)
  if (!ctx) throw new Error("useI18n must be used within I18nProvider")
  return ctx
}
