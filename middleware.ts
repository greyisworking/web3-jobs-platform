import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

// Supported locales
const SUPPORTED_LOCALES = ['en', 'ko'] as const
const DEFAULT_LOCALE = 'en'
const LOCALE_COOKIE = 'NEXT_LOCALE'

function getPreferredLocale(request: NextRequest): string {
  // 1. Check cookie first
  const cookieLocale = request.cookies.get(LOCALE_COOKIE)?.value
  if (cookieLocale && SUPPORTED_LOCALES.includes(cookieLocale as 'en' | 'ko')) {
    return cookieLocale
  }

  // 2. Check Accept-Language header
  const acceptLang = request.headers.get('accept-language')
  if (acceptLang) {
    const preferred = acceptLang.split(',')[0]?.split('-')[0]?.toLowerCase()
    if (preferred && SUPPORTED_LOCALES.includes(preferred as 'en' | 'ko')) {
      return preferred
    }
  }

  return DEFAULT_LOCALE
}

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  // Set locale cookie if not present
  const pathname = request.nextUrl.pathname
  if (!request.cookies.has(LOCALE_COOKIE) && !pathname.startsWith('/api') && !pathname.startsWith('/_next')) {
    const locale = getPreferredLocale(request)
    supabaseResponse.cookies.set(LOCALE_COOKIE, locale, {
      path: '/',
      maxAge: 60 * 60 * 24 * 365, // 1 year
      sameSite: 'lax',
    })
  }

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
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // IMPORTANT: Do NOT run getUser() on auth callback - let the route handler do it
  if (pathname.startsWith('/auth/callback')) {
    return supabaseResponse
  }

  // Skip auth check for non-admin routes entirely (no getUser call needed)
  if (!pathname.startsWith('/admin')) {
    return supabaseResponse
  }

  // Admin login page - don't call getUser() to avoid token refresh loop
  if (pathname === '/admin/login') {
    return supabaseResponse
  }

  // Only call getUser() for protected admin routes (not login page)
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Protect all other /admin routes
  if (!user) {
    const url = request.nextUrl.clone()
    url.pathname = '/admin/login'
    return NextResponse.redirect(url)
  }

  // Admin email whitelist check (additional security layer)
  const ADMIN_EMAIL_WHITELIST = [
    'admin@neun.wtf',
    'dahye@neun.wtf',
    // Add your admin emails here
  ]

  // Check if user email is in whitelist or has admin in DB
  const userEmail = user.email?.toLowerCase()
  const isWhitelisted = userEmail && ADMIN_EMAIL_WHITELIST.includes(userEmail)

  if (!isWhitelisted) {
    // Also check admins table
    const { data: admin } = await supabase
      .from('admins')
      .select('id')
      .eq('id', user.id)
      .single()

    if (!admin) {
      // Not an admin - redirect to 403 or login
      const url = request.nextUrl.clone()
      url.pathname = '/admin/login'
      url.searchParams.set('error', 'unauthorized')
      return NextResponse.redirect(url)
    }
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
