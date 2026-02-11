import { createClient, SupabaseClient } from '@supabase/supabase-js'

// Standalone Supabase client for scripts (crawlers, migrations, etc.)
// Uses @supabase/supabase-js directly since scripts run outside Next.js
// and don't have access to cookies.

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

// Check if Supabase is configured
export const isSupabaseConfigured = !!(supabaseUrl && supabaseKey)

// Create a mock client that does nothing when Supabase is not configured
const createMockClient = () => {
  const mockResponse = { data: null, error: null }
  const mockQueryBuilder = {
    select: () => mockQueryBuilder,
    insert: () => Promise.resolve(mockResponse),
    upsert: () => mockQueryBuilder,
    update: () => mockQueryBuilder,
    delete: () => mockQueryBuilder,
    eq: () => mockQueryBuilder,
    single: () => Promise.resolve(mockResponse),
    order: () => mockQueryBuilder,
    limit: () => mockQueryBuilder,
    gt: () => mockQueryBuilder,
  }

  return {
    from: () => mockQueryBuilder,
    rpc: () => Promise.resolve(mockResponse),
  } as unknown as SupabaseClient
}

// Export real client if configured, mock client otherwise
export const supabase: SupabaseClient = isSupabaseConfigured
  ? createClient(supabaseUrl!, supabaseKey!)
  : createMockClient()

// Log configuration status
if (!isSupabaseConfigured) {
  console.warn('⚠️  Supabase not configured - using Prisma/SQLite only')
}
