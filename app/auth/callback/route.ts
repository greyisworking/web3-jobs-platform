import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  // Use NEXT_PUBLIC_SITE_URL for consistent origin
  const origin = process.env.NEXT_PUBLIC_SITE_URL || new URL(request.url).origin
  const code = searchParams.get('code')
  const error_param = searchParams.get('error')
  const error_description = searchParams.get('error_description')
  const next = searchParams.get('next') ?? '/jobs'

  console.log('[Auth Callback] Processing callback')
  console.log('[Auth Callback] Origin:', origin)
  console.log('[Auth Callback] Code:', code ? 'present' : 'missing')
  console.log('[Auth Callback] Error:', error_param, error_description)

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
    console.log('[Auth Callback] Exchanging code for session...')
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)

    if (error) {
      console.error('[Auth Callback] Session exchange error:', error.message)
      console.error('[Auth Callback] Error details:', JSON.stringify(error, null, 2))
      // More user-friendly error messages
      let errorMessage = error.message
      if (error.message.includes('code verifier')) {
        errorMessage = 'Session expired. Please try logging in again.'
      } else if (error.message.includes('invalid')) {
        errorMessage = 'Invalid login attempt. Please try again.'
      }
      return NextResponse.redirect(`${origin}/login?error=${encodeURIComponent(errorMessage)}`)
    }

    console.log('[Auth Callback] Session established for:', data?.user?.email)
    console.log('[Auth Callback] Redirecting to:', `${origin}${next}`)
    return response
  } catch (e) {
    console.error('[Auth Callback] Unexpected error:', e)
    const errorMessage = e instanceof Error ? e.message : 'unexpected_error'
    return NextResponse.redirect(`${origin}/login?error=${encodeURIComponent(errorMessage)}`)
  }
}
