'use client'

import { createContext, useContext, ReactNode, useCallback } from 'react'
import { translations } from './translations'

type Locale = 'en'

interface I18nContextType {
  locale: Locale
  setLocale: (locale: Locale) => void
  t: (key: string, params?: Record<string, string | number>) => string
}

const I18nContext = createContext<I18nContextType | null>(null)

export function I18nProvider({ children }: { children: ReactNode }) {
  const locale: Locale = 'en'

  const setLocale = useCallback((_locale: Locale) => {
    // No-op: single locale site
  }, [])

  const t = useCallback((key: string, params?: Record<string, string | number>): string => {
    let text = translations['en'][key] || key

    if (params) {
      Object.entries(params).forEach(([paramKey, value]) => {
        text = text.replace(new RegExp(`\\{${paramKey}\\}`, 'g'), String(value))
      })
    }

    return text
  }, [])

  return (
    <I18nContext.Provider value={{ locale, setLocale, t }}>
      {children}
    </I18nContext.Provider>
  )
}

export function useI18n() {
  const context = useContext(I18nContext)
  if (!context) {
    throw new Error('useI18n must be used within I18nProvider')
  }
  return context
}

export function useLocale(): Locale {
  const { locale } = useI18n()
  return locale
}

export function useTranslation() {
  const { t, locale } = useI18n()
  return { t, locale }
}

export type { Locale }
