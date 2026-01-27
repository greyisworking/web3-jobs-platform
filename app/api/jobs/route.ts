import { NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase-server'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const statusParam = searchParams.get('status')
    const badge = searchParams.get('badge')
    const backer = searchParams.get('backer')
    const sector = searchParams.get('sector')

    const supabase = await createSupabaseServerClient()

    let query = supabase
      .from('Job')
      .select('*')
      .order('postedDate', { ascending: false })
      .limit(500)

    if (statusParam !== 'all') {
      query = query.eq('isActive', true)
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

    // Stats: count active jobs (or all if status=all)
    const filterActive = statusParam !== 'all'

    let totalQuery = supabase.from('Job').select('*', { count: 'exact', head: true })
    let globalQuery = supabase.from('Job').select('*', { count: 'exact', head: true }).eq('region', 'Global')
    let koreaQuery = supabase.from('Job').select('*', { count: 'exact', head: true }).eq('region', 'Korea')

    if (filterActive) {
      totalQuery = totalQuery.eq('isActive', true)
      globalQuery = globalQuery.eq('isActive', true)
      koreaQuery = koreaQuery.eq('isActive', true)
    }

    const [totalResult, globalResult, koreaResult] = await Promise.all([
      totalQuery,
      globalQuery,
      koreaQuery,
    ])

    const stats = {
      total: totalResult.count ?? 0,
      global: globalResult.count ?? 0,
      korea: koreaResult.count ?? 0,
      sources: [] as { source: string; _count: number }[],
    }

    return NextResponse.json({ jobs: jobs ?? [], stats })
  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json({ jobs: [], stats: { total: 0, global: 0, korea: 0, sources: [] } })
  }
}
