import { NextResponse } from 'next/server'
import { withAdminAuth } from '@/lib/admin-auth'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import type { BulkActionRequest } from '@/types/admin'

export const POST = withAdminAuth(async (request, admin) => {
  const body: BulkActionRequest = await request.json()
  const { ids } = body

  if (!ids || ids.length === 0) {
    return NextResponse.json({ error: 'No job IDs provided' }, { status: 400 })
  }

  const supabase = await createSupabaseServerClient()

  const { error } = await supabase
    .from('Job')
    .update({
      isActive: false,
      reviewed_by: admin.user.id,
      reviewed_at: new Date().toISOString(),
    })
    .in('id', ids)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true, count: ids.length })
})
