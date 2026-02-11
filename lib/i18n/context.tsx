'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'

type Locale = 'en' | 'ko'

interface I18nContextType {
  locale: Locale
  setLocale: (locale: Locale) => void
  t: (key: string) => string
}

const I18nContext = createContext<I18nContextType | null>(null)

// Simple translations - expand as needed
const translations: Record<Locale, Record<string, string>> = {
  en: {
    'nav.jobs': 'Jobs',
    'nav.companies': 'Companies',
    'nav.post': 'Post a Job',
    'hero.title': 'Web3 Jobs from Top VCs',
    'hero.subtitle': 'a16z, Hashed, Paradigm backed companies. Only legit jobs.',
    'search.placeholder': 'Search jobs, companies, or skills...',
    'filter.all': 'All',
    'filter.remote': 'Remote',
    'filter.korea': 'Korea',
    'job.apply': 'Apply Now',
    'job.posted': 'Posted',
    'job.ago': 'ago',
    'footer.rights': 'All rights reserved',
  },
  ko: {
    'nav.jobs': '채용공고',
    'nav.companies': '회사',
    'nav.post': '채용공고 등록',
    'hero.title': 'Top VC 포트폴리오 채용',
    'hero.subtitle': 'a16z, Hashed, Paradigm 투자사만. 검증된 Web3 채용공고.',
    'search.placeholder': '채용공고, 회사, 기술스택 검색...',
    'filter.all': '전체',
    'filter.remote': '원격',
    'filter.korea': '한국',
    'job.apply': '지원하기',
    'job.posted': '게시일',
    'job.ago': '전',
    'footer.rights': 'All rights reserved',
  },
}

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>('en')

  useEffect(() => {
    // Read from cookie
    const cookies = document.cookie.split(';')
    for (const cookie of cookies) {
      const [name, value] = cookie.trim().split('=')
      if (name === 'NEXT_LOCALE' && (value === 'en' || value === 'ko')) {
        setLocaleState(value)
        break
      }
    }
  }, [])

  const setLocale = (newLocale: Locale) => {
    setLocaleState(newLocale)
    // Set cookie
    document.cookie = `NEXT_LOCALE=${newLocale}; path=/; max-age=${60 * 60 * 24 * 365}; samesite=lax`
    // Reload to apply changes
    window.location.reload()
  }

  const t = (key: string): string => {
    return translations[locale][key] || translations['en'][key] || key
  }

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
