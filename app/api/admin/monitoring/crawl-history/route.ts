import { NextResponse } from 'next/server'
import { withAdminAuth } from '@/lib/admin-auth'
import { createSupabaseServerClient } from '@/lib/supabase-server'

export const dynamic = 'force-dynamic'

export const GET = withAdminAuth(async (request, _admin) => {
  const { searchParams } = new URL(request.url)
  const page = parseInt(searchParams.get('page') || '1', 10)
  const pageSize = parseInt(searchParams.get('pageSize') || '20', 10)
  const offset = (page - 1) * pageSize

  const supabase = await createSupabaseServerClient()

  const { data: runs, count, error } = await supabase
    .from('crawl_runs')
    .select('*', { count: 'exact' })
    .order('started_at', { ascending: false })
    .range(offset, offset + pageSize - 1)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({
    runs: runs || [],
    total: count || 0,
    page,
    pageSize,
  })
})
