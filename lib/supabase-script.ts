import { createClient } from '@supabase/supabase-js'

// Standalone Supabase client for scripts (crawlers, migrations, etc.)
// Uses @supabase/supabase-js directly since scripts run outside Next.js
// and don't have access to cookies.

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  throw new Error(
    'Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY environment variables'
  )
}

export const supabase = createClient(supabaseUrl, supabaseKey)
