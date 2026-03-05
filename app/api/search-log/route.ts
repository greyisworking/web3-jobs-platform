import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase-server'

/**
 * POST: Log search queries
 * GET ?popular=true: Top 10 popular searches in last 7 days
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { query, results_count, session_id } = body

    if (!query || typeof query !== 'string') {
      return NextResponse.json({ error: 'query is required' }, { status: 400 })
    }

    const supabase = await createSupabaseServerClient()

    const { error } = await supabase.from('search_queries').insert({
      query: query.trim().toLowerCase(),
      results_count: results_count ?? 0,
      session_id: session_id ?? null,
    })

    if (error) {
      console.error('Search log insert error:', error)
      return NextResponse.json({ error: 'Failed to log search' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Search log POST error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const popular = searchParams.get('popular')

    if (popular !== 'true') {
      return NextResponse.json({ error: 'Use ?popular=true' }, { status: 400 })
    }

    const supabase = await createSupabaseServerClient()

    // Top 10 popular searches in last 7 days
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

    const { data, error } = await supabase
      .from('search_queries')
      .select('query')
      .gte('created_at', sevenDaysAgo.toISOString())

    if (error) {
      console.error('Search log GET error:', error)
      return NextResponse.json({ error: 'Failed to fetch popular searches' }, { status: 500 })
    }

    // Aggregate counts per query
    const counts: Record<string, number> = {}
    for (const row of data ?? []) {
      const q = row.query
      counts[q] = (counts[q] ?? 0) + 1
    }

    const popular_queries = Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([query, count]) => ({ query, count }))

    return NextResponse.json({ popular: popular_queries })
  } catch (error) {
    console.error('Search log GET error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
