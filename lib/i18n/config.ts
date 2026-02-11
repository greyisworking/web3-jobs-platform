/**
 * i18n Configuration
 */

export const i18nConfig = {
  defaultLocale: 'en' as const,
  locales: ['en', 'ko'] as const,
  localeNames: {
    en: 'English',
    ko: '한국어',
  },
  // Locale detection settings
  localeDetection: true,
  // Cookie settings
  localeCookie: 'NEXT_LOCALE',
  cookieMaxAge: 60 * 60 * 24 * 365, // 1 year
}

export type Locale = (typeof i18nConfig.locales)[number]

export function isValidLocale(locale: string): locale is Locale {
  return i18nConfig.locales.includes(locale as Locale)
}

/**
 * Get locale from pathname
 * /ko/jobs -> 'ko'
 * /jobs -> 'en' (default)
 */
export function getLocaleFromPathname(pathname: string): Locale {
  const segments = pathname.split('/')
  const potentialLocale = segments[1]

  if (potentialLocale && isValidLocale(potentialLocale)) {
    return potentialLocale
  }

  return i18nConfig.defaultLocale
}

/**
 * Remove locale prefix from pathname
 * /ko/jobs -> /jobs
 * /jobs -> /jobs
 */
export function removeLocaleFromPathname(pathname: string): string {
  const segments = pathname.split('/')
  const potentialLocale = segments[1]

  if (potentialLocale && isValidLocale(potentialLocale)) {
    return '/' + segments.slice(2).join('/') || '/'
  }

  return pathname
}

/**
 * Add locale prefix to pathname
 * /jobs, 'ko' -> /ko/jobs
 * /jobs, 'en' -> /jobs (default locale doesn't need prefix)
 */
export function addLocaleToPathname(pathname: string, locale: Locale): string {
  // Don't add prefix for default locale
  if (locale === i18nConfig.defaultLocale) {
    return pathname
  }

  // Remove existing locale prefix if any
  const cleanPath = removeLocaleFromPathname(pathname)

  return `/${locale}${cleanPath === '/' ? '' : cleanPath}`
}

/**
 * Get alternate URLs for hreflang
 */
export function getAlternateUrls(baseUrl: string, pathname: string): Record<string, string> {
  const cleanPath = removeLocaleFromPathname(pathname)
  const urls: Record<string, string> = {
    'x-default': `${baseUrl}${cleanPath}`,
  }

  for (const locale of i18nConfig.locales) {
    if (locale === i18nConfig.defaultLocale) {
      urls[locale] = `${baseUrl}${cleanPath}`
    } else {
      urls[locale] = `${baseUrl}/${locale}${cleanPath === '/' ? '' : cleanPath}`
    }
  }

  return urls
}
