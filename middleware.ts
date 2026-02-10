import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

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
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // IMPORTANT: Do NOT run getUser() on auth callback - let the route handler do it
  const pathname = request.nextUrl.pathname
  if (pathname.startsWith('/auth/callback')) {
    return supabaseResponse
  }

  // Refresh the session (this updates cookies if needed)
  const {
    data: { user },
  } = await supabase.auth.getUser()

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
