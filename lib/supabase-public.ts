import { createClient } from '@supabase/supabase-js'

/**
 * Public Supabase client for ISR/SSG pages
 * Does NOT use cookies - suitable for public data fetching
 * Use this for pages with `export const revalidate = ...` (ISR)
 * or `export const dynamic = 'force-static'` (SSG)
 */
export function createPublicSupabaseClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
