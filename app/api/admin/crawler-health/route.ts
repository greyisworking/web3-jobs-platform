import { NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase-server'

export const dynamic = 'force-dynamic'

/**
 * GET /api/admin/crawler-health
 * Returns crawler error statistics for the admin dashboard
 */
export async function GET() {
  try {
    const supabase = await createSupabaseServerClient()

    // Get errors from last 24 hours
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()

    const { data: errors } = await supabase
      .from('CrawlerErrors')
      .select('source, error_type, created_at')
      .gte('created_at', since)
      .order('created_at', { ascending: false })

    if (!errors) {
      return NextResponse.json({ summary: {}, recentErrors: [] })
    }

    // Build summary by source
    const summary: Record<string, {
      total: number
      byType: Record<string, number>
      lastError: string | null
    }> = {}

    for (const error of errors) {
      if (!summary[error.source]) {
        summary[error.source] = {
          total: 0,
          byType: {},
          lastError: error.created_at,
        }
      }
      summary[error.source].total++
      summary[error.source].byType[error.error_type] =
        (summary[error.source].byType[error.error_type] || 0) + 1
    }

    // Get recent errors with details
    const { data: recentErrors } = await supabase
      .from('CrawlerErrors')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(20)

    return NextResponse.json({
      summary,
      recentErrors: recentErrors || [],
      totalErrors: errors.length,
      since,
    })
  } catch (error) {
    console.error('Error fetching crawler health:', error)
    return NextResponse.json({ error: 'Failed to fetch health data' }, { status: 500 })
  }
}
