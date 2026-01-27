import { NextRequest, NextResponse } from 'next/server'
import { getAdminUser } from '@/lib/admin-auth'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import type { BulkActionRequest } from '@/types/admin'

export async function POST(request: NextRequest) {
  let adminUser
  try {
    adminUser = await getAdminUser()
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body: BulkActionRequest = await request.json()
  const { ids } = body

  if (!ids || ids.length === 0) {
    return NextResponse.json({ error: 'No job IDs provided' }, { status: 400 })
  }

  const supabase = await createSupabaseServerClient()

  const { error } = await supabase
    .from('Job')
    .update({
      status: 'rejected',
      reviewed_by: adminUser.user.id,
      reviewed_at: new Date().toISOString(),
    })
    .in('id', ids)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true, count: ids.length })
}
