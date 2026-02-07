import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const error_code = searchParams.get('error')
  const error_description = searchParams.get('error_description')
  const next = searchParams.get('next') ?? '/'

  console.log('[Auth Callback] Received:', { code: !!code, error_code, error_description, next })

  // Handle OAuth errors from provider
  if (error_code) {
    console.error('[Auth Callback] OAuth error:', error_code, error_description)
    const errorMsg = encodeURIComponent(error_description || error_code)
    return NextResponse.redirect(`${origin}/login?error=${errorMsg}`)
  }

  if (code) {
    const cookieStore = await cookies()
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
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options)
              )
            } catch {
              // Server Component context — ignored
            }
          },
        },
      }
    )

    const { data, error } = await supabase.auth.exchangeCodeForSession(code)
    console.log('[Auth Callback] Exchange result:', { success: !!data?.session, error: error?.message })

    if (!error && data?.session) {
      console.log('[Auth Callback] Success! Redirecting to:', next)
      return NextResponse.redirect(`${origin}${next}`)
    }

    if (error) {
      console.error('[Auth Callback] Exchange error:', error)
      return NextResponse.redirect(`${origin}/login?error=${encodeURIComponent(error.message)}`)
    }
  }

  console.error('[Auth Callback] No code received')
  return NextResponse.redirect(`${origin}/login?error=auth_failed`)
}
