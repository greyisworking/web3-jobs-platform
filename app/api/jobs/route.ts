import { NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase-server'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const statusParam = searchParams.get('status')

    const supabase = await createSupabaseServerClient()

    let query = supabase
      .from('Job')
      .select('*')
      .order('postedDate', { ascending: false })
      .limit(500)

    if (statusParam !== 'all') {
      query = query.eq('status', statusParam || 'active')
    }

    const { data: jobs, error } = await query

    if (error) {
      console.error('API Error:', error)
      return NextResponse.json({ jobs: [], stats: { total: 0, global: 0, korea: 0, sources: [] } })
    }

    // Stats: count by status='active' (or matching filter)
    const statusFilter = statusParam === 'all' ? undefined : (statusParam || 'active')

    let totalQuery = supabase.from('Job').select('*', { count: 'exact', head: true })
    let globalQuery = supabase.from('Job').select('*', { count: 'exact', head: true }).eq('region', 'Global')
    let koreaQuery = supabase.from('Job').select('*', { count: 'exact', head: true }).eq('region', 'Korea')

    if (statusFilter) {
      totalQuery = totalQuery.eq('status', statusFilter)
      globalQuery = globalQuery.eq('status', statusFilter)
      koreaQuery = koreaQuery.eq('status', statusFilter)
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
