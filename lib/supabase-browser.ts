import { createBrowserClient } from '@supabase/ssr'

export function createSupabaseBrowserClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

// Auth pages client - same as regular but we'll handle cleanup separately
export function createSupabaseAuthClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

// Clear stale auth session before login attempt
export function clearAuthSession() {
  if (typeof window === 'undefined') return

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  if (!supabaseUrl) return

  const projectRef = supabaseUrl.split('//')[1]?.split('.')[0]
  if (!projectRef) return

  // Clear all Supabase auth related storage
  const keysToRemove = [
    `sb-${projectRef}-auth-token`,
    `sb-${projectRef}-auth-token-code-verifier`,
  ]

  keysToRemove.forEach(key => {
    try {
      localStorage.removeItem(key)
      sessionStorage.removeItem(key)
    } catch {
      // Ignore storage errors
    }
  })
}
