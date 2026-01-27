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
  const level = searchParams.get('level') || undefined
  const keyword = searchParams.get('keyword') || undefined
  const dateFrom = searchParams.get('date_from') || undefined
  const dateTo = searchParams.get('date_to') || undefined
  const page = parseInt(searchParams.get('page') || '1', 10)
  const pageSize = parseInt(searchParams.get('pageSize') || '50', 10)
  const offset = (page - 1) * pageSize

  const supabase = await createSupabaseServerClient()

  let query = supabase
    .from('error_logs')
    .select('*', { count: 'exact' })
    .order('timestamp', { ascending: false })
    .range(offset, offset + pageSize - 1)

  if (level) {
    query = query.eq('level', level)
  }

  if (keyword) {
    query = query.or(
      `message.ilike.%${keyword}%,crawler_name.ilike.%${keyword}%`
    )
  }

  if (dateFrom) {
    query = query.gte('timestamp', dateFrom)
  }

  if (dateTo) {
    query = query.lte('timestamp', dateTo)
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
