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
  const badge = searchParams.get('badge') || undefined
  const backer = searchParams.get('backer') || undefined
  const sector = searchParams.get('sector') || undefined
  const page = parseInt(searchParams.get('page') || '1', 10)
  const pageSize = parseInt(searchParams.get('pageSize') || '20', 10)
  const offset = (page - 1) * pageSize

  const supabase = await createSupabaseServerClient()

  let query = supabase
    .from('Job')
    .select('*', { count: 'exact' })
    .order('crawledAt', { ascending: false })
    .range(offset, offset + pageSize - 1)

  if (status) {
    const isActive = status === 'active' ? true : status === 'inactive' ? false : undefined
    if (isActive !== undefined) {
      query = query.eq('isActive', isActive)
    }
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

  const { data: jobs, count, error } = await query

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({
    jobs: jobs || [],
    total: count || 0,
    page,
    pageSize,
  })
}
