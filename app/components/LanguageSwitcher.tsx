'use client'

import { usePathname, useRouter } from 'next/navigation'
import { useI18n } from '@/lib/i18n/context'

const DEFAULT_LOCALE = 'en'

export default function LanguageSwitcher() {
  const { locale, setLocale } = useI18n()
  const pathname = usePathname()
  const router = useRouter()

  const switchLocale = () => {
    const newLocale = locale === 'en' ? 'ko' : 'en'

    // Remove existing locale prefix if any
    let cleanPath = pathname
    if (pathname.startsWith('/ko')) {
      cleanPath = pathname.slice(3) || '/'
    }

    // Build new path
    let newPath: string
    if (newLocale === DEFAULT_LOCALE) {
      // Default locale doesn't need prefix
      newPath = cleanPath
    } else {
      // Non-default locale gets prefix
      newPath = `/${newLocale}${cleanPath === '/' ? '' : cleanPath}`
    }

    // Update cookie
    document.cookie = `NEXT_LOCALE=${newLocale}; path=/; max-age=${60 * 60 * 24 * 365}; samesite=lax`

    // Navigate to new path
    router.push(newPath)
  }

  return (
    <button
      onClick={switchLocale}
      className="px-2 py-1 text-sm font-medium text-a24-text-muted dark:text-a24-dark-text-muted hover:text-a24-text dark:hover:text-a24-dark-text transition-colors"
      aria-label={locale === 'en' ? 'Switch to Korean' : 'Switch to English'}
    >
      {locale === 'en' ? '한국어' : 'EN'}
    </button>
  )
}
