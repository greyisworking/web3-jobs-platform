import { NextRequest, NextResponse } from 'next/server'
import { getAdminUser } from '@/lib/admin-auth'
import { createSupabaseServerClient } from '@/lib/supabase-server'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    await getAdminUser()
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const status = searchParams.get('status') || undefined
  const source = searchParams.get('source') || undefined
  const page = parseInt(searchParams.get('page') || '1', 10)
  const pageSize = parseInt(searchParams.get('pageSize') || '50', 10)
  const offset = (page - 1) * pageSize

  const supabase = await createSupabaseServerClient()

  let query = supabase
    .from('CrawlLog')
    .select('*', { count: 'exact' })
    .order('createdAt', { ascending: false })
    .range(offset, offset + pageSize - 1)

  if (status) {
    query = query.eq('status', status)
  }

  if (source) {
    query = query.eq('source', source)
  }

  const { data: logs, count, error } = await query

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({
    logs: logs || [],
    total: count || 0,
    page,
    pageSize,
  })
}
