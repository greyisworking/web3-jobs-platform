/**
 * i18n Configuration - English only
 */

export const i18nConfig = {
  defaultLocale: 'en' as const,
  locales: ['en'] as const,
}

export type Locale = 'en'

export function isValidLocale(locale: string): locale is Locale {
  return locale === 'en'
}

export function getLocaleFromPathname(_pathname: string): Locale {
  return 'en'
}

export function removeLocaleFromPathname(pathname: string): string {
  return pathname
}

export function addLocaleToPathname(pathname: string, _locale: Locale): string {
  return pathname
}

export function getAlternateUrls(baseUrl: string, pathname: string): Record<string, string> {
  return {
    'x-default': `${baseUrl}${pathname}`,
    en: `${baseUrl}${pathname}`,
  }
}
