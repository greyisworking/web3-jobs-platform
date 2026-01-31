import { NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase-server'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const badge = searchParams.get('badge')
    const backer = searchParams.get('backer')
    const sector = searchParams.get('sector')
    const includeExpired = searchParams.get('includeExpired') === 'true'

    const supabase = await createSupabaseServerClient()

    let query = supabase
      .from('Job')
      .select('*')
      .eq('isActive', true)
      .order('postedDate', { ascending: false })
      .limit(500)

    // Filter out expired jobs by default
    if (!includeExpired) {
      query = query.or('status.is.null,status.neq.expired')
    }

    if (badge) {
      query = query.contains('badges', [badge])
    }
    if (backer) {
      query = query.contains('backers', [backer])
    }
    if (sector) {
      query = query.eq('sector', sector)
    }

    const { data: jobs, error } = await query

    if (error) {
      console.error('API Error:', error)
      return NextResponse.json({ jobs: [], stats: { total: 0, global: 0, korea: 0, sources: [] } })
    }

    const jobList = jobs ?? []

    // Stats: count active jobs
    const [totalResult, globalResult, koreaResult] = await Promise.all([
      supabase.from('Job').select('*', { count: 'exact', head: true }).eq('isActive', true),
      supabase.from('Job').select('*', { count: 'exact', head: true }).eq('isActive', true).eq('region', 'Global'),
      supabase.from('Job').select('*', { count: 'exact', head: true }).eq('isActive', true).eq('region', 'Korea'),
    ])

    // Compute source counts from returned jobs
    const sourceCounts = new Map<string, number>()
    for (const job of jobList) {
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

    return NextResponse.json({ jobs: jobList, stats })
  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json({ jobs: [], stats: { total: 0, global: 0, korea: 0, sources: [] } })
  }
}
