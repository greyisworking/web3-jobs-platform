import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

// ═══════════════════════════════════════════════════════════════════════════════
// i18n Configuration
// ═══════════════════════════════════════════════════════════════════════════════

const SUPPORTED_LOCALES = ['en', 'ko'] as const
type Locale = (typeof SUPPORTED_LOCALES)[number]
const DEFAULT_LOCALE: Locale = 'en'
const LOCALE_COOKIE = 'NEXT_LOCALE'

function isValidLocale(locale: string): locale is Locale {
  return SUPPORTED_LOCALES.includes(locale as Locale)
}

function getLocaleFromPathname(pathname: string): Locale | null {
  const segments = pathname.split('/')
  const potentialLocale = segments[1]
  return potentialLocale && isValidLocale(potentialLocale) ? potentialLocale : null
}

function getPreferredLocale(request: NextRequest): Locale {
  // 1. Check cookie first
  const cookieLocale = request.cookies.get(LOCALE_COOKIE)?.value
  if (cookieLocale && isValidLocale(cookieLocale)) {
    return cookieLocale
  }

  // 2. Check Accept-Language header
  const acceptLang = request.headers.get('accept-language')
  if (acceptLang) {
    const preferred = acceptLang.split(',')[0]?.split('-')[0]?.toLowerCase()
    if (preferred && isValidLocale(preferred)) {
      return preferred
    }
  }

  return DEFAULT_LOCALE
}

// ═══════════════════════════════════════════════════════════════════════════════
// Middleware
// ═══════════════════════════════════════════════════════════════════════════════

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname

  // Skip static files and API routes for locale handling
  const isStaticOrApi =
    pathname.startsWith('/api') ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/auth') ||
    pathname === '/favicon.ico' ||
    pathname === '/sitemap.xml' ||
    pathname === '/robots.txt' ||
    pathname === '/manifest.json'

  // ─── Locale Handling ─────────────────────────────────────────────────────────

  let currentLocale = getLocaleFromPathname(pathname)
  const preferredLocale = getPreferredLocale(request)
  let response: NextResponse

  // Handle locale routing for non-static routes
  if (!isStaticOrApi) {
    // If URL has locale prefix
    if (currentLocale) {
      // If it's the default locale, redirect to non-prefixed URL
      if (currentLocale === DEFAULT_LOCALE) {
        const newPathname = pathname.replace(`/${DEFAULT_LOCALE}`, '') || '/'
        const url = request.nextUrl.clone()
        url.pathname = newPathname
        return NextResponse.redirect(url)
      }
      // Non-default locale in URL - continue with that locale
    } else {
      // No locale in URL
      currentLocale = preferredLocale

      // If preferred locale is not default, redirect to locale-prefixed URL
      if (preferredLocale !== DEFAULT_LOCALE) {
        const url = request.nextUrl.clone()
        url.pathname = `/${preferredLocale}${pathname}`
        const redirectResponse = NextResponse.redirect(url)
        redirectResponse.cookies.set(LOCALE_COOKIE, preferredLocale, {
          path: '/',
          maxAge: 60 * 60 * 24 * 365,
          sameSite: 'lax',
        })
        return redirectResponse
      }
    }
  }

  // Create response
  response = NextResponse.next({ request })

  // Set locale cookie if changed
  const cookieLocale = request.cookies.get(LOCALE_COOKIE)?.value
  if (currentLocale && cookieLocale !== currentLocale) {
    response.cookies.set(LOCALE_COOKIE, currentLocale, {
      path: '/',
      maxAge: 60 * 60 * 24 * 365,
      sameSite: 'lax',
    })
  }

  // Set locale header for server components
  response.headers.set('x-locale', currentLocale || DEFAULT_LOCALE)

  // ─── Supabase Auth ───────────────────────────────────────────────────────────

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          response = NextResponse.next({ request })
          // Preserve locale cookie
          if (currentLocale) {
            response.cookies.set(LOCALE_COOKIE, currentLocale, {
              path: '/',
              maxAge: 60 * 60 * 24 * 365,
              sameSite: 'lax',
            })
          }
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // Get the actual pathname without locale prefix for admin check
  const pathnameWithoutLocale = currentLocale
    ? pathname.replace(`/${currentLocale}`, '') || '/'
    : pathname

  // Skip auth callback
  if (pathnameWithoutLocale.startsWith('/auth/callback')) {
    return response
  }

  // Skip auth check for non-admin routes
  if (!pathnameWithoutLocale.startsWith('/admin')) {
    return response
  }

  // Admin login page - don't call getUser()
  if (pathnameWithoutLocale === '/admin/login') {
    return response
  }

  // ─── Admin Auth ──────────────────────────────────────────────────────────────

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    const url = request.nextUrl.clone()
    url.pathname = currentLocale && currentLocale !== DEFAULT_LOCALE
      ? `/${currentLocale}/admin/login`
      : '/admin/login'
    return NextResponse.redirect(url)
  }

  // Admin email whitelist
  const ADMIN_EMAIL_WHITELIST = [
    'admin@neun.wtf',
    'dahye@neun.wtf',
  ]

  const userEmail = user.email?.toLowerCase()
  const isWhitelisted = userEmail && ADMIN_EMAIL_WHITELIST.includes(userEmail)

  if (!isWhitelisted) {
    const { data: admin } = await supabase
      .from('admins')
      .select('id')
      .eq('id', user.id)
      .single()

    if (!admin) {
      const url = request.nextUrl.clone()
      url.pathname = currentLocale && currentLocale !== DEFAULT_LOCALE
        ? `/${currentLocale}/admin/login`
        : '/admin/login'
      url.searchParams.set('error', 'unauthorized')
      return NextResponse.redirect(url)
    }
  }

  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for:
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - Static assets (images, etc.)
     */
    '/((?!_next/static|_next/image|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|woff|woff2)$).*)',
  ],
}
