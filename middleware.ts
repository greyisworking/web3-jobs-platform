import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

// Cookie domain for production (works across www and non-www)
const COOKIE_DOMAIN = process.env.NODE_ENV === 'production' ? '.neun.wtf' : undefined

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

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
            supabaseResponse.cookies.set(name, value, {
              ...options,
              domain: COOKIE_DOMAIN,
            })
          )
        },
      },
    }
  )

  // Refresh the session (this updates cookies if needed)
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const pathname = request.nextUrl.pathname

  // Skip auth check for non-admin routes - just return with refreshed cookies
  if (!pathname.startsWith('/admin')) {
    return supabaseResponse
  }

  // Allow access to admin login page without auth
  if (pathname === '/admin/login') {
    // If already logged in, redirect to admin dashboard
    if (user) {
      const url = request.nextUrl.clone()
      url.pathname = '/admin'
      return NextResponse.redirect(url)
    }
    return supabaseResponse
  }

  // Protect all other /admin routes
  if (!user) {
    const url = request.nextUrl.clone()
    url.pathname = '/admin/login'
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}

export const config = {
  // Only run middleware on admin routes to avoid interfering with OAuth flow
  matcher: ['/admin/:path*'],
}
