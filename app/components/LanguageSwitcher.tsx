'use client'

import { useI18n } from '@/lib/i18n/context'

export default function LanguageSwitcher() {
  const { locale, setLocale } = useI18n()

  return (
    <button
      onClick={() => setLocale(locale === 'en' ? 'ko' : 'en')}
      className="px-2 py-1 text-sm font-medium text-a24-text-muted dark:text-a24-dark-text-muted hover:text-a24-text dark:hover:text-a24-dark-text transition-colors"
      aria-label="Switch language"
    >
      {locale === 'en' ? '한국어' : 'EN'}
    </button>
  )
}
