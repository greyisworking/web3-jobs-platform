import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const { searchParams } = requestUrl
  const code = searchParams.get('code')
  const error_code = searchParams.get('error')
  const error_description = searchParams.get('error_description')
  const next = searchParams.get('next') ?? '/'

  // Use configured site URL to avoid www/non-www mismatch
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || requestUrl.origin

  console.log('[Auth Callback] ===== DEBUG =====')
  console.log('[Auth Callback] Request URL:', request.url)
  console.log('[Auth Callback] Site URL:', siteUrl)
  console.log('[Auth Callback] Code present:', !!code)
  console.log('[Auth Callback] Error:', error_code, error_description)
  console.log('[Auth Callback] Next:', next)

  // Handle OAuth errors from provider
  if (error_code) {
    console.error('[Auth Callback] OAuth provider error:', error_code, error_description)
    const errorMsg = encodeURIComponent(error_description || error_code)
    return NextResponse.redirect(`${siteUrl}/login?error=${errorMsg}`)
  }

  if (!code) {
    console.error('[Auth Callback] No code in callback URL')
    return NextResponse.redirect(`${siteUrl}/login?error=no_code`)
  }

  const cookieStore = await cookies()
  const allCookies = cookieStore.getAll()

  // Debug: Check for PKCE code verifier cookie
  const pkceVerifier = allCookies.find(c => c.name.includes('code_verifier') || c.name.includes('pkce'))
  console.log('[Auth Callback] All cookies:', allCookies.map(c => c.name))
  console.log('[Auth Callback] PKCE verifier cookie:', pkceVerifier?.name || 'NOT FOUND')

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          console.log('[Auth Callback] Setting cookies:', cookiesToSet.map(c => c.name))
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
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

    console.log('[Auth Callback] Exchange result:', {
      success: !!data?.session,
      userId: data?.user?.id,
      email: data?.user?.email,
      error: error?.message,
      errorCode: error?.code,
    })

    if (error) {
      console.error('[Auth Callback] Exchange failed:', error.message, error.code)
      return NextResponse.redirect(`${siteUrl}/login?error=${encodeURIComponent(error.message)}`)
    }

    if (data?.session) {
      console.log('[Auth Callback] SUCCESS! User:', data.user?.email)
      console.log('[Auth Callback] Redirecting to:', next)
      return NextResponse.redirect(`${siteUrl}${next}`)
    }

    console.error('[Auth Callback] No session returned')
    return NextResponse.redirect(`${siteUrl}/login?error=no_session`)
  } catch (e) {
    console.error('[Auth Callback] Exception:', e)
    return NextResponse.redirect(`${siteUrl}/login?error=callback_exception`)
  }
}
