import { createSupabaseServerClient } from './supabase-server'

export async function logSearchQuery(
  query: string,
  resultsCount: number,
  sessionId?: string
) {
  try {
    const supabase = await createSupabaseServerClient()
    await supabase.from('search_queries').insert({
      query: query.trim(),
      results_count: resultsCount,
      session_id: sessionId || null,
    })
  } catch {
    // Silently fail - search logging should not break the search
  }
}
