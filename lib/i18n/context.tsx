'use client'

import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react'
import { usePathname } from 'next/navigation'
import { translations, Locale } from './translations'

interface I18nContextType {
  locale: Locale
  setLocale: (locale: Locale) => void
  t: (key: string, params?: Record<string, string | number>) => string
}

const I18nContext = createContext<I18nContextType | null>(null)

const DEFAULT_LOCALE: Locale = 'en'
const SUPPORTED_LOCALES: Locale[] = ['en', 'ko']

function getLocaleFromPathname(pathname: string): Locale | null {
  const segments = pathname.split('/')
  const potentialLocale = segments[1]
  if (potentialLocale && SUPPORTED_LOCALES.includes(potentialLocale as Locale)) {
    return potentialLocale as Locale
  }
  return null
}

function getLocaleFromCookie(): Locale | null {
  if (typeof document === 'undefined') return null

  const cookies = document.cookie.split(';')
  for (const cookie of cookies) {
    const [name, value] = cookie.trim().split('=')
    if (name === 'NEXT_LOCALE' && SUPPORTED_LOCALES.includes(value as Locale)) {
      return value as Locale
    }
  }
  return null
}

export function I18nProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  const [locale, setLocaleState] = useState<Locale>(DEFAULT_LOCALE)

  // Determine locale from pathname or cookie
  useEffect(() => {
    const pathnameLocale = getLocaleFromPathname(pathname)
    const cookieLocale = getLocaleFromCookie()

    // Priority: pathname > cookie > default
    const detectedLocale = pathnameLocale || cookieLocale || DEFAULT_LOCALE
    setLocaleState(detectedLocale)
  }, [pathname])

  const setLocale = useCallback((newLocale: Locale) => {
    setLocaleState(newLocale)
    // Update cookie
    document.cookie = `NEXT_LOCALE=${newLocale}; path=/; max-age=${60 * 60 * 24 * 365}; samesite=lax`
  }, [])

  /**
   * Get translated string with optional parameter interpolation
   * Usage: t('time.daysAgo', { n: 5 }) => "5 days ago" or "5일 전"
   */
  const t = useCallback((key: string, params?: Record<string, string | number>): string => {
    let text = translations[locale][key] || translations['en'][key] || key

    // Interpolate parameters
    if (params) {
      Object.entries(params).forEach(([paramKey, value]) => {
        text = text.replace(new RegExp(`\\{${paramKey}\\}`, 'g'), String(value))
      })
    }

    return text
  }, [locale])

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

// Re-export Locale type
export type { Locale }
