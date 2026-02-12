import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const error_param = searchParams.get('error')
  const error_description = searchParams.get('error_description')
  const next = searchParams.get('next') ?? '/jobs'

  console.log('[Auth Callback] Processing callback, code:', code ? 'present' : 'missing')

  // Handle OAuth errors from provider
  if (error_param) {
    console.error('[Auth Callback] OAuth error:', error_param, error_description)
    return NextResponse.redirect(
      `${origin}/login?error=${encodeURIComponent(error_description || error_param)}`
    )
  }

  if (!code) {
    console.error('[Auth Callback] No code parameter')
    return NextResponse.redirect(`${origin}/login?error=no_code`)
  }

  const cookieStore = await cookies()

  // Create response first for proper cookie handling
  const response = NextResponse.redirect(`${origin}${next}`)

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              // Set on both cookie store and response
              cookieStore.set(name, value, options)
              response.cookies.set(name, value, options)
            })
          } catch (e) {
            console.error('[Auth Callback] Cookie set error:', e)
          }
        },
      },
    }
  )

  try {
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)

    if (error) {
      console.error('[Auth Callback] Session exchange error:', error.message, error)
      return NextResponse.redirect(`${origin}/login?error=${encodeURIComponent(error.message)}`)
    }

    console.log('[Auth Callback] Session established for:', data?.user?.email)
    return response
  } catch (e) {
    console.error('[Auth Callback] Unexpected error:', e)
    return NextResponse.redirect(`${origin}/login?error=unexpected_error`)
  }
}
