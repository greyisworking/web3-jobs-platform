import { NextResponse } from 'next/server'

/**
 * Debug endpoint to check OAuth configuration
 * Access at: /api/auth/debug
 */
export async function GET(request: Request) {
  const { origin } = new URL(request.url)

  const config = {
    // Environment variables (masked for security)
    env: {
      NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL || '(not set)',
      NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL
        ? `${process.env.NEXT_PUBLIC_SUPABASE_URL.slice(0, 30)}...`
        : '(not set)',
      NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
        ? '(set, length: ' + process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY.length + ')'
        : '(not set)',
    },

    // Request info
    request: {
      origin,
      host: request.headers.get('host'),
      referer: request.headers.get('referer'),
    },

    // Expected callback URLs
    expectedCallbacks: {
      googleCallback: `${process.env.NEXT_PUBLIC_SITE_URL || origin}/auth/callback`,
      supabaseCallback: process.env.NEXT_PUBLIC_SUPABASE_URL
        ? `${process.env.NEXT_PUBLIC_SUPABASE_URL}/auth/v1/callback`
        : '(Supabase URL not set)',
    },

    // Checklist
    checklist: {
      siteUrlSet: !!process.env.NEXT_PUBLIC_SITE_URL,
      supabaseUrlSet: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      supabaseKeySet: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      originMatchesSiteUrl: origin === process.env.NEXT_PUBLIC_SITE_URL,
    },

    // Instructions
    instructions: [
      '1. Supabase Dashboard → Authentication → Providers → Google',
      '   - Client ID and Secret must be set',
      '   - Provider must be enabled',
      '',
      '2. Supabase Dashboard → Authentication → URL Configuration',
      `   - Site URL must be: ${process.env.NEXT_PUBLIC_SITE_URL || origin}`,
      `   - Redirect URLs must include: ${process.env.NEXT_PUBLIC_SITE_URL || origin}/auth/callback`,
      '',
      '3. Google Cloud Console → OAuth 2.0 Client',
      `   - Authorized redirect URI: ${process.env.NEXT_PUBLIC_SUPABASE_URL}/auth/v1/callback`,
      '',
      '4. Vercel Environment Variables',
      '   - NEXT_PUBLIC_SITE_URL must match your production domain exactly',
      '   - Check www vs non-www consistency',
    ],
  }

  return NextResponse.json(config, {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
    }
  })
}
