import { NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase-server'

export const dynamic = 'force-dynamic'

// POST /api/admin/crawler-quality/log - Record current quality metrics to log
export async function POST() {
  try {
    const supabase = await createSupabaseServerClient()

    // First, fetch current quality data
    const qualityRes = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/api/admin/crawler-quality`)
    if (!qualityRes.ok) {
      throw new Error('Failed to fetch quality metrics')
    }
    const qualityData = await qualityRes.json()

    // Insert each source's metrics into the log
    const records = qualityData.sources.map((source: {
      source: string
      total: number
      jdSuccessRate: number
      companySuccessRate: number
      htmlErrorRate: number
      qualityScore: number
    }) => ({
      source: source.source,
      total_jobs: source.total,
      jd_success_rate: source.jdSuccessRate,
      company_success_rate: source.companySuccessRate,
      html_error_rate: source.htmlErrorRate,
      quality_score: source.qualityScore,
    }))

    const { error } = await supabase
      .from('CrawlerQualityLog')
      .insert(records)

    if (error) throw error

    return NextResponse.json({
      success: true,
      recordsInserted: records.length,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error('Error logging crawler quality:', error)
    return NextResponse.json(
      { error: 'Failed to log crawler quality metrics' },
      { status: 500 }
    )
  }
}

// GET /api/admin/crawler-quality/log - Get quality history for trending
export async function GET(request: Request) {
  try {
    const supabase = await createSupabaseServerClient()
    const { searchParams } = new URL(request.url)
    const source = searchParams.get('source')
    const days = parseInt(searchParams.get('days') || '30', 10)

    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)

    let query = supabase
      .from('CrawlerQualityLog')
      .select('*')
      .gte('created_at', startDate.toISOString())
      .order('created_at', { ascending: true })

    if (source) {
      query = query.eq('source', source)
    }

    const { data, error } = await query

    if (error) throw error

    // Group by date and source for charting
    const groupedData = new Map<string, Map<string, {
      qualityScore: number
      jdSuccessRate: number
      companySuccessRate: number
      htmlErrorRate: number
      totalJobs: number
    }>>()

    data?.forEach((record) => {
      const date = new Date(record.created_at).toISOString().split('T')[0]
      if (!groupedData.has(date)) {
        groupedData.set(date, new Map())
      }
      groupedData.get(date)!.set(record.source, {
        qualityScore: record.quality_score,
        jdSuccessRate: record.jd_success_rate,
        companySuccessRate: record.company_success_rate,
        htmlErrorRate: record.html_error_rate,
        totalJobs: record.total_jobs,
      })
    })

    // Convert to array format for charting
    const chartData = Array.from(groupedData.entries())
      .map(([date, sources]) => ({
        date,
        sources: Object.fromEntries(sources),
      }))
      .sort((a, b) => a.date.localeCompare(b.date))

    return NextResponse.json({
      history: data,
      chartData,
      days,
    })
  } catch (error) {
    console.error('Error fetching crawler quality history:', error)
    return NextResponse.json(
      { error: 'Failed to fetch crawler quality history' },
      { status: 500 }
    )
  }
}
