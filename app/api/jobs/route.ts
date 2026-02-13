import { NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase-server'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const badge = searchParams.get('badge')
    const backer = searchParams.get('backer')
    const sector = searchParams.get('sector')
    const company = searchParams.get('company')
    const limit = parseInt(searchParams.get('limit') || '300', 10)
    const supabase = await createSupabaseServerClient()

    // Only show active jobs (isActive=true)
    // Select only fields needed for job list (exclude large text fields like description)
    const listFields = [
      'id', 'title', 'company', 'url', 'location', 'type', 'category', 'role',
      'salary', 'salaryMin', 'salaryMax', 'salaryCurrency', 'tags', 'source', 'region',
      'postedDate', 'crawledAt', 'updatedAt', 'isActive',
      'experienceLevel', 'remoteType', 'companyLogo',
      'backers', 'sector', 'badges'
    ].join(',')

    // Filter out old jobs (3+ months old or past deadline)
    const threeMonthsAgo = new Date()
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3)

    let query = supabase
      .from('Job')
      .select(listFields)
      .eq('isActive', true)
      .gte('crawledAt', threeMonthsAgo.toISOString())
      .order('crawledAt', { ascending: false })
      .limit(Math.min(limit, 300))

    if (badge) {
      query = query.contains('badges', [badge])
    }
    if (backer) {
      query = query.contains('backers', [backer])
    }
    if (sector) {
      query = query.eq('sector', sector)
    }
    if (company) {
      query = query.ilike('company', `%${company}%`)
    }

    const { data: jobs, error } = await query

    if (error) {
      console.error('API Error:', error)
      return NextResponse.json({ jobs: [], stats: { total: 0, global: 0, korea: 0, sources: [] } })
    }

    const jobList = jobs ?? []

    // Stats: count active jobs (use 'id' instead of '*' for faster count)
    const [totalResult, globalResult, koreaResult] = await Promise.all([
      supabase.from('Job').select('id', { count: 'exact', head: true }).eq('isActive', true),
      supabase.from('Job').select('id', { count: 'exact', head: true }).eq('isActive', true).eq('region', 'Global'),
      supabase.from('Job').select('id', { count: 'exact', head: true }).eq('isActive', true).eq('region', 'Korea'),
    ])

    // Compute source counts from returned jobs
    const sourceCounts = new Map<string, number>()
    for (const job of jobList as Array<{ source?: string }>) {
      const src = job.source ?? 'unknown'
      sourceCounts.set(src, (sourceCounts.get(src) ?? 0) + 1)
    }
    const sources = Array.from(sourceCounts.entries())
      .map(([source, _count]) => ({ source, _count }))
      .sort((a, b) => b._count - a._count)

    const stats = {
      total: totalResult.count ?? 0,
      global: globalResult.count ?? 0,
      korea: koreaResult.count ?? 0,
      sources,
    }

    // Return with cache headers for CDN/browser caching
    return NextResponse.json(
      { jobs: jobList, stats },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
        },
      }
    )
  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json({ jobs: [], stats: { total: 0, global: 0, korea: 0, sources: [] } })
  }
}
