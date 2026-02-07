import { createBrowserClient } from '@supabase/ssr'

// Check if we're on neun.wtf domain (with or without www)
function isNeunDomain(): boolean {
  if (typeof window === 'undefined') return false
  const hostname = window.location.hostname
  return hostname === 'neun.wtf' || hostname.endsWith('.neun.wtf')
}

export function createSupabaseBrowserClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookieOptions: {
        // Use root domain so cookies work across www and non-www
        domain: isNeunDomain() ? '.neun.wtf' : undefined,
        path: '/',
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
      },
    }
  )
}
