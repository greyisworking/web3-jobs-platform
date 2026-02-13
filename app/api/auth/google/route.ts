import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

/**
 * Server-side OAuth initiation for Google login.
 * This approach avoids client-side cookie/session sync issues.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const next = searchParams.get('next') || '/jobs'
  const origin = process.env.NEXT_PUBLIC_SITE_URL || new URL(request.url).origin

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
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options)
            })
          } catch (e) {
            // Server component context, ignore
          }
        },
      },
    }
  )

  const redirectTo = `${origin}/auth/callback?next=${encodeURIComponent(next)}`

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo,
      // Let Supabase handle the full redirect flow
      skipBrowserRedirect: false,
    },
  })

  if (error) {
    console.error('[API Auth Google] OAuth error:', error)
    return NextResponse.redirect(`${origin}/login?error=${encodeURIComponent(error.message)}`)
  }

  if (!data.url) {
    return NextResponse.redirect(`${origin}/login?error=oauth_not_configured`)
  }

  // Server-side redirect to Google OAuth
  return NextResponse.redirect(data.url)
}
